import { NextRequest, NextResponse } from 'next/server';
import { syncMercadoPagoPayment } from '@/lib/sync-payment';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const paymentId = body?.data?.id || body?.['data.id'];
  if (!paymentId) {
    return NextResponse.json({ message: 'Payload inválido' }, { status: 400 });
  }

  try {
    await syncMercadoPagoPayment(String(paymentId));
    return NextResponse.json({ message: 'Webhook processado' });
  } catch (error) {
    console.error('Falha ao processar pagamento', error);
    return NextResponse.json({ message: 'Falha ao processar pagamento' }, { status: 409 });
  }
}
