import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncMercadoPagoPayment } from '@/lib/sync-payment';

export async function GET(request: NextRequest, { params }: { params: { codigo: string } }) {
  const paymentId = request.nextUrl.searchParams.get('paymentId');
  if (!paymentId) return NextResponse.json({ message: 'Pagamento ausente' }, { status: 400 });

  const pedido = await prisma.pedido.findUnique({
    where: { codigo: params.codigo },
    include: { pagamento: true },
  });
  if (!pedido || pedido.pagamento?.paymentId !== paymentId) {
    return NextResponse.json({ message: 'Pedido não encontrado' }, { status: 404 });
  }

  let statusPagamento = pedido.statusPagamento;
  if (statusPagamento === 'AGUARDANDO_PAGAMENTO') {
    const synced = await syncMercadoPagoPayment(paymentId);
    statusPagamento = synced.statusPagamento;
  }

  return NextResponse.json({ codigo: pedido.codigo, statusPagamento });
}
