import { MercadoPagoConfig, Payment } from 'mercadopago';

const token = process.env.MERCADOPAGO_ACCESS_TOKEN;

if (!token) {
  throw new Error('MERCADOPAGO_ACCESS_TOKEN is required in environment variables.');
}

const client = new MercadoPagoConfig({ accessToken: token });
const payments = new Payment(client);

export interface CreatePixPaymentParams {
  amount: number;
  description: string;
  externalReference: string;
  payerName: string;
  payerEmail?: string;
}

export interface PixPaymentResult {
  paymentId: string;
  status: string;
  amount: number;
  expirationDate?: string;
  qrCode: string;
  qrCodeBase64: string;
  pixCopyPaste: string;
}

export async function createPixPayment(params: CreatePixPaymentParams): Promise<PixPaymentResult> {
  const transaction = await payments.create({
    body: {
      transaction_amount: Number(params.amount),
      description: params.description,
      payment_method_id: 'pix',
      external_reference: params.externalReference,
      payer: {
        email: params.payerEmail ?? 'cliente@ecri.local',
        first_name: params.payerName,
      },
    },
    requestOptions: { idempotencyKey: `pix-${params.externalReference}` },
  });

  return {
    paymentId: String(transaction.id),
    status: String(transaction.status),
    amount: Number(transaction.transaction_amount),
    expirationDate: transaction.date_of_expiration,
    qrCode: transaction.point_of_interaction?.transaction_data?.qr_code ?? '',
    qrCodeBase64: transaction.point_of_interaction?.transaction_data?.qr_code_base64 ?? '',
    pixCopyPaste: transaction.point_of_interaction?.transaction_data?.qr_code ?? '',
  };
}

export async function getPayment(paymentId: string) {
  return payments.get({ id: paymentId });
}
