import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getPayment } from '@/lib/mercadopago';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const paymentId = body?.data?.id || body?.['data.id'];

  if (!paymentId) {
    return NextResponse.json({ message: 'Payload inválido' }, { status: 400 });
  }

  const payment = await getPayment(String(paymentId));
  const externalReference = payment.external_reference;
  if (!externalReference) {
    return NextResponse.json({ message: 'Referência externa ausente' }, { status: 400 });
  }

  const pedido = await prisma.pedido.findFirst({
    where: { codigo: externalReference },
    include: { itens: true },
  });
  if (!pedido) {
    return NextResponse.json({ message: 'Pedido não encontrado' }, { status: 404 });
  }

  const status = String(payment.status).toUpperCase();

  const statusPagamento = status === 'APPROVED' ? 'PAGO' : status === 'PENDING' ? 'AGUARDANDO_PAGAMENTO' : status === 'REFUSED' ? 'CANCELADO' : status === 'EXPIRED' ? 'EXPIRADO' : pedido.statusPagamento;

  const paymentRecord = await prisma.pagamento.upsert({
    where: { pedidoId: pedido.id },
    create: {
      pedidoId: pedido.id,
      provedor: 'MercadoPago',
      paymentId: String(payment.id),
      status,
      valor: Number(payment.transaction_amount ?? pedido.valorTotal),
      qrCode: payment.point_of_interaction?.transaction_data?.qr_code ?? undefined,
      qrCodeBase64: payment.point_of_interaction?.transaction_data?.qr_code_base64 ?? undefined,
      pixCopiaCola: payment.point_of_interaction?.transaction_data?.qr_code ?? undefined,
      dataExpiracao: payment.date_of_expiration ? new Date(payment.date_of_expiration) : undefined,
      dadosRetorno: JSON.stringify(payment),
    },
    update: {
      status,
      qrCode: payment.point_of_interaction?.transaction_data?.qr_code ?? undefined,
      qrCodeBase64: payment.point_of_interaction?.transaction_data?.qr_code_base64 ?? undefined,
      pixCopiaCola: payment.point_of_interaction?.transaction_data?.qr_code ?? undefined,
      dataExpiracao: payment.date_of_expiration ? new Date(payment.date_of_expiration) : undefined,
      dadosRetorno: JSON.stringify(payment),
      updatedAt: new Date(),
    },
  });

  if (statusPagamento === 'PAGO' && pedido.statusPagamento !== 'PAGO') {
    try {
      await prisma.$transaction(async (tx) => {
        // A troca condicional de status faz somente uma entrega concorrente do
        // webhook ser responsável pela baixa.
        const claimed = await tx.pedido.updateMany({
          where: { id: pedido.id, statusPagamento: { not: 'PAGO' } },
          data: { statusPagamento: 'PAGO', paidAt: new Date(), statusProducao: 'PEDIDO_RECEBIDO' },
        });
        if (claimed.count === 0) return;

        for (const item of pedido.itens) {
          const produtoAnterior = await tx.produto.findUnique({
            where: { id: item.produtoId },
            select: { estoque: true },
          });

          if (!produtoAnterior || produtoAnterior.estoque < item.quantidade) {
            throw new Error(`ESTOQUE_INSUFICIENTE:${item.produtoId}`);
          }

          const produto = await tx.produto.update({
            where: { id: item.produtoId },
            data: { estoque: { decrement: item.quantidade } },
          });

          await tx.movimentacaoEstoque.create({
            data: {
              produtoId: item.produtoId,
              pedidoId: pedido.id,
              pagamentoId: paymentRecord.id,
              tipo: 'VENDA',
              quantidade: -item.quantidade,
              estoqueAnterior: produtoAnterior.estoque,
              estoqueNovo: produto.estoque,
              motivo: `Venda do pedido ${pedido.codigo}`,
            },
          });
        }
      });
    } catch (error) {
      console.error('Pagamento aprovado sem estoque suficiente', {
        pedidoId: pedido.id,
        paymentId: paymentRecord.id,
        error,
      });
      return NextResponse.json(
        { message: 'Pagamento confirmado, mas o estoque precisa de intervenção administrativa.' },
        { status: 409 },
      );
    }
  } else {
    await prisma.pedido.update({
      where: { id: pedido.id },
      data: { statusPagamento, statusProducao: statusPagamento === 'EXPIRADO' ? 'CANCELADO' : pedido.statusProducao },
    });
  }

  return NextResponse.json({ message: 'Webhook processado' });
}
