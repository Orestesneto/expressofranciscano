import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createCardPayment, createPixPayment } from '@/lib/mercadopago';
import { calculateCouponDiscount } from '@/lib/coupons';
import { normalizeBrazilianPhone } from '@/lib/phone';
import { syncMercadoPagoPayment } from '@/lib/sync-payment';

const checkoutSchema = z.object({
  customer: z.object({
    nome: z.string().optional(),
    anonimo: z.boolean().default(false),
    telefone: z.string().transform((value, ctx) => {
      const telefone = normalizeBrazilianPhone(value);
      if (!telefone) {
        ctx.addIssue({ code: 'custom', message: 'Informe um telefone válido com 11 dígitos.' });
        return z.NEVER;
      }
      return telefone;
    }),
    observacao: z.string().optional(),
  }),
  fotoPerfil: z.object({
    url: z.string().url(),
    pathname: z.string().startsWith('perfis/'),
    nomeArquivo: z.string().min(1).max(255),
    contentType: z.string().startsWith('image/'),
  }).optional(),
  items: z.array(
    z.object({
      productId: z.number().int().positive(),
      nome: z.string(),
      preco: z.number(),
      quantidade: z.number().int().min(1),
    }),
  ),
  imagens: z.array(
    z.object({
      url: z.string().url(),
      pathname: z.string().startsWith('personalizacoes/'),
      nomeArquivo: z.string().min(1).max(255),
      contentType: z.string().startsWith('image/'),
    }),
  ).max(10).default([]),
  cupomCodigo: z.string().max(40).optional(),
  paymentMethod: z.enum(['pix', 'credit_card', 'delivery']).default('pix'),
  deliveryPointId: z.number().int().positive().optional(),
  cardData: z.object({
    token: z.string().min(1),
    installments: z.number().int().min(1).max(24),
    payment_method_id: z.string().min(1),
    issuer_id: z.string().optional(),
    payer: z.object({
      email: z.string().email(),
      identification: z.object({ type: z.string().min(1), number: z.string().min(1) }).optional(),
    }),
  }).optional(),
}).superRefine((data, ctx) => {
  if (!data.customer.anonimo && (!data.customer.nome || data.customer.nome.trim().length < 2)) {
    ctx.addIssue({ code: 'custom', path: ['customer', 'nome'], message: 'Informe o nome.' });
  }
  if (data.paymentMethod === 'credit_card' && !data.cardData) {
    ctx.addIssue({ code: 'custom', path: ['cardData'], message: 'Dados do cartão são obrigatórios.' });
  }
  if (data.paymentMethod === 'delivery' && !data.deliveryPointId) {
    ctx.addIssue({ code: 'custom', path: ['deliveryPointId'], message: 'Selecione um ponto de recolhimento.' });
  }
});

function formatCodigoPedido(id: number) {
  return `EJCDAGUIA-${String(id).padStart(4, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
  const body = await request.json();

  const parseResult = checkoutSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ message: 'Dados inválidos.' }, { status: 400 });
  }

  const { customer, items: rawItems, imagens, fotoPerfil, cupomCodigo, paymentMethod, deliveryPointId, cardData } = parseResult.data;

  const pontoRecolhimento = paymentMethod === 'delivery'
    ? await prisma.pontoRecolhimento.findFirst({
        where: { id: deliveryPointId, autorizado: true },
        select: { id: true, nome: true, endereco: true, bairro: true, whatsappNormalizado: true },
      })
    : null;
  if (paymentMethod === 'delivery' && !pontoRecolhimento) {
    return NextResponse.json({ message: 'O ponto de recolhimento selecionado não está disponível.' }, { status: 400 });
  }

  // O carrinho é controlado pelo navegador. Consolida IDs repetidos antes de
  // consultar o banco para que preço, disponibilidade e estoque sejam sempre
  // validados pelo servidor.
  const items = Array.from(
    rawItems.reduce((acc, item) => {
      const existing = acc.get(item.productId);
      acc.set(item.productId, {
        ...item,
        quantidade: (existing?.quantidade ?? 0) + item.quantidade,
      });
      return acc;
    }, new Map<number, (typeof rawItems)[number]>()),
  ).map(([, item]) => item);

  const produtosIds = items.map((item) => item.productId);
  const produtos = await prisma.produto.findMany({
    where: {
      id: { in: produtosIds },
      ativo: true,
      disponivelVenda: true,
    },
  });

  if (produtos.length !== produtosIds.length) {
    return NextResponse.json({ message: 'Um ou mais produtos não estão mais disponíveis.' }, { status: 400 });
  }

  if (
    imagens.some(
      (imagem) => !new URL(imagem.url).hostname.endsWith('.private.blob.vercel-storage.com'),
    )
  ) {
    return NextResponse.json({ message: 'Imagem de personalização inválida.' }, { status: 400 });
  }

  const orderItems = items.map((item) => {
    const produto = produtos.find((produtoItem) => produtoItem.id === item.productId);
    if (!produto) {
      throw new Error(`Produto não encontrado: ${item.productId}`);
    }

    const restante = produto.metaQuantidade - produto.quantidadeArrecadada;
    if (item.quantidade > restante) {
      throw new Error(`A quantidade supera o que falta para a meta de ${produto.nome}.`);
    }

    const valorUnitario = Number(produto.preco);
    const subtotal = valorUnitario * item.quantidade;

    return {
      produtoId: produto.id,
      nomeProduto: produto.nome,
      quantidade: item.quantidade,
      valorUnitario,
      subtotal,
    };
  });

  const subtotalPedido = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
  const cupom = cupomCodigo ? await prisma.cupomDesconto.findFirst({
    where: { codigo: cupomCodigo.trim().toUpperCase(), ativo: true }, include: { produtos: true },
  }) : null;
  if (cupomCodigo && !cupom) return NextResponse.json({ message: 'O cupom é inválido ou já foi utilizado.' }, { status: 400 });
  if (cupom && cupom.usosRealizados >= cupom.limiteUsos) return NextResponse.json({ message: 'Este cupom atingiu o limite de usos.' }, { status: 400 });
  const valorDesconto = cupom ? calculateCouponDiscount(cupom, orderItems.map((item) => ({ produtoId: item.produtoId, quantidade: item.quantidade, valorUnitario: item.valorUnitario }))) : 0;
  if (cupom && valorDesconto <= 0) return NextResponse.json({ message: 'O cupom não se aplica aos itens do pedido.' }, { status: 400 });
  const valorPedido = Math.max(0.01, subtotalPedido - valorDesconto);
  const taxaCartao = paymentMethod === 'credit_card' ? Number((valorPedido * 0.08).toFixed(2)) : 0;
  const valorTotal = Number((valorPedido + taxaCartao).toFixed(2));

  const pedido = await prisma.$transaction(async (tx) => {
    if (cupom) {
      const claimed = await tx.cupomDesconto.updateMany({ where: { id: cupom.id, ativo: true, usosRealizados: { lt: cupom.limiteUsos } }, data: { usosRealizados: { increment: 1 }, usadoEm: new Date() } });
      if (claimed.count !== 1) throw new Error('Este cupom acabou de ser utilizado em outro pedido.');
    }
    return tx.pedido.create({ data: {
      codigo: 'TEMP',
      nomeCliente: customer.anonimo ? 'Anônimo' : customer.nome!.trim(),
      sobrenomeCliente: '',
      telefone: customer.telefone,
      telefoneNormalizado: customer.telefone,
      equipeNome: null,
      valorTotal: valorTotal,
      valorDesconto,
      cupomId: cupom?.id,
      codigoCupom: cupom?.codigo,
      statusPagamento: 'AGUARDANDO_PAGAMENTO',
      statusProducao: 'AGUARDANDO_PAGAMENTO',
      formaContribuicao: paymentMethod === 'delivery' ? 'ENTREGA' : paymentMethod.toUpperCase(),
      anonimo: customer.anonimo,
      fotoPerfilUrl: customer.anonimo ? null : fotoPerfil?.url,
      fotoPerfilPathname: customer.anonimo ? null : fotoPerfil?.pathname,
      fotoPerfilNome: customer.anonimo ? null : fotoPerfil?.nomeArquivo,
      fotoPerfilContentType: customer.anonimo ? null : fotoPerfil?.contentType,
      pontoRecolhimentoId: pontoRecolhimento?.id,
      observacaoCliente: customer.observacao,
      itens: {
        create: orderItems,
      },
      imagens: {
        create: imagens,
      },
    } });
  });

  const codigo = formatCodigoPedido(pedido.id);
  await prisma.pedido.update({ where: { id: pedido.id }, data: { codigo } });

  if (paymentMethod === 'delivery') {
    await prisma.pedido.update({
      where: { id: pedido.id },
      data: { statusPagamento: 'AGUARDANDO_ENTREGA', statusProducao: 'AGUARDANDO_ENTREGA' },
    });
    return NextResponse.json({ pedidoId: pedido.id, codigo, delivery: true, pontoRecolhimento: {
      id: pontoRecolhimento!.id,
      nome: pontoRecolhimento!.nome,
      endereco: pontoRecolhimento!.endereco,
      bairro: pontoRecolhimento!.bairro,
      whatsapp: pontoRecolhimento!.whatsappNormalizado,
    } });
  }

  const notificationUrl = new URL('/api/webhook', request.url).toString();

  if (paymentMethod === 'credit_card' && cardData) {
    const payment = await createCardPayment({
      amount: valorTotal,
      token: cardData.token,
      installments: cardData.installments,
      paymentMethodId: cardData.payment_method_id,
      issuerId: cardData.issuer_id,
      payerEmail: cardData.payer.email,
      identificationType: cardData.payer.identification?.type,
      identificationNumber: cardData.payer.identification?.number,
      description: `Pedido ${codigo}`,
      externalReference: codigo,
      notificationUrl,
    });

    await prisma.pagamento.create({
      data: {
        pedidoId: pedido.id,
        provedor: 'MercadoPago',
        paymentId: payment.paymentId,
        status: payment.status,
        valor: valorTotal,
        dadosRetorno: JSON.stringify({ statusDetail: payment.statusDetail, taxaCartao }),
      },
    });

    const synced = await syncMercadoPagoPayment(payment.paymentId);
    return NextResponse.json({
      pedidoId: pedido.id,
      codigo,
      paymentId: payment.paymentId,
      status: payment.status,
      statusDetail: payment.statusDetail,
      statusPagamento: synced.statusPagamento,
      amount: valorTotal,
    });
  }

  const payment = await createPixPayment({
    amount: valorTotal,
    description: `Pedido ${codigo}`,
    externalReference: codigo,
    payerName: customer.anonimo ? 'Doador Anônimo' : customer.nome!,
    notificationUrl,
  });

  await prisma.pagamento.create({
    data: {
      pedidoId: pedido.id,
      provedor: 'MercadoPago',
      paymentId: payment.paymentId,
      status: payment.status,
      valor: Number(valorTotal),
      qrCode: payment.qrCode,
      qrCodeBase64: payment.qrCodeBase64,
      pixCopiaCola: payment.pixCopyPaste,
      dataExpiracao: payment.expirationDate ? new Date(payment.expirationDate) : undefined,
    },
  });

  return NextResponse.json({
    pedidoId: pedido.id,
    codigo,
    paymentId: payment.paymentId,
    qrCodeBase64: payment.qrCodeBase64,
    pixCopyPaste: payment.pixCopyPaste,
    expirationDate: payment.expirationDate,
    amount: valorTotal,
  });
  } catch (error) {
    console.error('Falha ao gerar pagamento', error);
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error && 'message' in error
          ? String(error.message)
          : 'Erro interno ao gerar pagamento.';
    return NextResponse.json({ message }, { status: 500 });
  }
}
