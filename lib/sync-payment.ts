import { prisma } from '@/lib/prisma';
import { getPayment } from '@/lib/mercadopago';

export async function syncMercadoPagoPayment(paymentId: string) {
  const payment = await getPayment(paymentId);
  const externalReference = payment.external_reference;
  if (!externalReference) throw new Error('Referência externa ausente');

  const pedido = await prisma.pedido.findFirst({
    where: { codigo: externalReference },
    include: { itens: true },
  });
  if (!pedido) throw new Error('Pedido não encontrado');

  const status = String(payment.status).toUpperCase();
  const statusPagamento =
    status === 'APPROVED'
      ? 'PAGO'
      : status === 'PENDING'
        ? 'AGUARDANDO_PAGAMENTO'
        : status === 'REFUSED' || status === 'CANCELLED'
          ? 'CANCELADO'
          : status === 'EXPIRED'
            ? 'EXPIRADO'
            : pedido.statusPagamento;

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
      dadosRetorno: JSON.stringify(payment),
      updatedAt: new Date(),
    },
  });

  if (statusPagamento === 'PAGO' && pedido.statusPagamento !== 'PAGO') {
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.pedido.updateMany({
        where: { id: pedido.id, statusPagamento: { not: 'PAGO' } },
        data: { statusPagamento: 'PAGO', paidAt: new Date(), statusProducao: 'PEDIDO_RECEBIDO' },
      });
      if (claimed.count === 0) return;

      for (const item of pedido.itens) {
        const anterior = await tx.produto.findUnique({
          where: { id: item.produtoId },
          select: { estoque: true },
        });
        if (!anterior || anterior.estoque < item.quantidade) {
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
            estoqueAnterior: anterior.estoque,
            estoqueNovo: produto.estoque,
            motivo: `Venda do pedido ${pedido.codigo}`,
          },
        });
      }
    });
  } else if (pedido.statusPagamento !== 'PAGO') {
    await prisma.pedido.update({
      where: { id: pedido.id },
      data: {
        statusPagamento,
        statusProducao: statusPagamento === 'EXPIRADO' ? 'CANCELADO' : pedido.statusProducao,
      },
    });
  }

  return { codigo: pedido.codigo, statusPagamento };
}
