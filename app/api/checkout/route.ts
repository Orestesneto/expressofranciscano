import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createPixPayment } from '@/lib/mercadopago';

const checkoutSchema = z.object({
  customer: z.object({
    nome: z.string().min(2),
    sobrenome: z.string().min(2),
    equipe: z.string().min(1),
    telefone: z.string().optional(),
    observacao: z.string().optional(),
  }),
  items: z.array(
    z.object({
      productId: z.number().int().positive(),
      nome: z.string(),
      preco: z.number(),
      quantidade: z.number().int().min(1),
    }),
  ),
});

function formatCodigoPedido(id: number) {
  return `ECRI-${String(id).padStart(4, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
  const body = await request.json();

  const parseResult = checkoutSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ message: 'Dados inválidos.' }, { status: 400 });
  }

  const { customer, items: rawItems } = parseResult.data;

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
      estoque: { gt: 0 },
    },
  });

  if (produtos.length !== produtosIds.length) {
    return NextResponse.json({ message: 'Um ou mais produtos não estão mais disponíveis.' }, { status: 400 });
  }

  const orderItems = items.map((item) => {
    const produto = produtos.find((produtoItem) => produtoItem.id === item.productId);
    if (!produto) {
      throw new Error(`Produto não encontrado: ${item.productId}`);
    }

    if (item.quantidade > produto.estoque) {
      throw new Error(`Quantidade solicitada maior que estoque para o produto ${produto.nome}.`);
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

  const valorTotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);

  const pedido = await prisma.pedido.create({
    data: {
      codigo: 'TEMP',
      nomeCliente: customer.nome,
      sobrenomeCliente: customer.sobrenome,
      telefone: customer.telefone,
      equipeNome: customer.equipe,
      valorTotal: valorTotal,
      statusPagamento: 'AGUARDANDO_PAGAMENTO',
      statusProducao: 'AGUARDANDO_PAGAMENTO',
      observacaoCliente: customer.observacao,
      itens: {
        create: orderItems,
      },
    },
  });

  const codigo = formatCodigoPedido(pedido.id);
  await prisma.pedido.update({ where: { id: pedido.id }, data: { codigo } });

  const payment = await createPixPayment({
    amount: Number(valorTotal),
    description: `Pedido ${codigo}`,
    externalReference: codigo,
    payerName: `${customer.nome} ${customer.sobrenome}`,
    notificationUrl: new URL('/api/webhook', request.url).toString(),
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
    console.error('Falha ao gerar pagamento Pix', error);
    const message = error instanceof Error ? error.message : 'Erro interno ao gerar pagamento Pix.';
    return NextResponse.json({ message }, { status: 500 });
  }
}
