import { MercadoPagoConfig, Payment } from 'mercadopago';

function getPaymentsClient() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!token) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN is required in environment variables.');
  }
  return new Payment(new MercadoPagoConfig({ accessToken: token }));
}

export interface CreatePixPaymentParams {
  amount: number;
  description: string;
  externalReference: string;
  payerName: string;
  payerEmail?: string;
  notificationUrl?: string;
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

export interface CreateCardPaymentParams {
  amount: number;
  token: string;
  installments: number;
  paymentMethodId: string;
  issuerId?: string;
  payerEmail: string;
  identificationType?: string;
  identificationNumber?: string;
  description: string;
  externalReference: string;
  notificationUrl?: string;
}

export async function createPixPayment(params: CreatePixPaymentParams): Promise<PixPaymentResult> {
  const transaction = await getPaymentsClient().create({
    body: {
      transaction_amount: Number(params.amount),
      description: params.description,
      payment_method_id: 'pix',
      external_reference: params.externalReference,
      notification_url: params.notificationUrl,
      payer: {
        email: params.payerEmail ?? 'cliente@expressofranciscano.com.br',
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
  return getPaymentsClient().get({ id: paymentId });
}

export async function createCardPayment(params: CreateCardPaymentParams) {
  const transaction = await getPaymentsClient().create({
    body: {
      transaction_amount: Number(params.amount),
      token: params.token,
      installments: params.installments,
      payment_method_id: params.paymentMethodId,
      issuer_id: params.issuerId ? Number(params.issuerId) : undefined,
      description: params.description,
      external_reference: params.externalReference,
      notification_url: params.notificationUrl,
      payer: {
        email: params.payerEmail,
        identification:
          params.identificationType && params.identificationNumber
            ? { type: params.identificationType, number: params.identificationNumber }
            : undefined,
      },
    },
    requestOptions: { idempotencyKey: `card-${params.externalReference}` },
  });

  return {
    paymentId: String(transaction.id),
    status: String(transaction.status),
    statusDetail: String(transaction.status_detail ?? ''),
    amount: Number(transaction.transaction_amount),
  };
}
