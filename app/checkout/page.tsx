'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Check, Copy, X } from 'lucide-react';
import { useCart } from '@/components/cart-context';

const schema = z.object({
  nome: z.string().min(2, 'Informe o nome'),
  sobrenome: z.string().min(2, 'Informe o sobrenome'),
  equipe: z.string().min(1, 'Selecione a equipe'),
  telefone: z.string().optional(),
  observacao: z.string().optional(),
});

type CheckoutForm = z.infer<typeof schema>;

interface PixPayment {
  codigo: string;
  paymentId: string;
  qrCodeBase64: string;
  pixCopyPaste: string;
  expirationDate?: string;
  amount: number;
}

const equipes = [
  'Apressentadores',
  'Bandinha',
  'Boa Vontade',
  'Circulos',
  'Compras',
  'Correio Interno',
  'Cozinha',
  'Externa',
  'Geral',
  'Lanchinho',
  'Lirtugia e Vigilia',
  'Mini Box',
  'Odem e Limpeza',
  'Recpção aos Palestrantes',
  'Secretaria',
  'Som e Iluminação',
  'Trânsito e Sociodrama',
];

export default function CheckoutPage() {
  const { items, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [payment, setPayment] = useState<PixPayment | null>(null);
  const [copied, setCopied] = useState(false);
  const [paymentApproved, setPaymentApproved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState } = useForm<CheckoutForm>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (items.length === 0) {
      setError('O carrinho está vazio. Adicione algum produto antes de finalizar.');
    }
  }, [items.length]);

  useEffect(() => {
    if (!payment || paymentApproved) return;
    const checkStatus = async () => {
      try {
        const response = await fetch(
          `/api/pedidos/${encodeURIComponent(payment.codigo)}/status?paymentId=${encodeURIComponent(payment.paymentId)}`,
          { cache: 'no-store' },
        );
        if (!response.ok) return;
        const result = await response.json();
        if (result.statusPagamento === 'PAGO') setPaymentApproved(true);
      } catch {
        // Uma falha momentânea não fecha o modal; a próxima consulta tenta novamente.
      }
    };
    checkStatus();
    const interval = window.setInterval(checkStatus, 3000);
    return () => window.clearInterval(interval);
  }, [payment, paymentApproved]);

  async function onSubmit(data: CheckoutForm) {
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer: data, items }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result?.message ?? 'Erro ao criar pedido.');
        return;
      }
      if (!result.qrCodeBase64 || !result.pixCopyPaste) {
        setError('O pagamento foi criado, mas o Mercado Pago não retornou os dados do Pix.');
        return;
      }
      setPayment(result);
      clearCart();
    } catch (err) {
      setError('Erro de comunicação com o servidor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container py-10">
      <div className="rounded-[2rem] bg-white p-8 shadow-soft">
        <h1 className="text-3xl font-semibold">Finalizar pedido</h1>
        <p className="mt-3 text-slate-600">Preencha os dados para gerar o pagamento Pix.</p>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Nome</label>
            <input className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3" {...register('nome')} />
            <p className="mt-2 text-sm text-red-600">{formState.errors.nome?.message}</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Sobrenome</label>
            <input className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3" {...register('sobrenome')} />
            <p className="mt-2 text-sm text-red-600">{formState.errors.sobrenome?.message}</p>
          </div>
          <fieldset className="md:col-span-2">
            <legend className="mb-3 text-sm font-semibold text-slate-700">Equipe</legend>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {equipes.map((equipe) => (
                <label
                  key={equipe}
                  className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 transition hover:border-slate-400 has-[:checked]:border-slate-950 has-[:checked]:bg-slate-100 has-[:checked]:font-semibold"
                >
                  <input
                    type="radio"
                    value={equipe}
                    className="h-4 w-4 accent-slate-950"
                    {...register('equipe')}
                  />
                  <span>{equipe}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-sm text-red-600">{formState.errors.equipe?.message}</p>
          </fieldset>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Telefone / WhatsApp</label>
            <input className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3" {...register('telefone')} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Observação</label>
            <textarea className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3" rows={4} {...register('observacao')} />
          </div>
          <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm text-slate-600">Total do pedido</p>
            <p className="mt-2 text-3xl font-semibold">R$ {total.toFixed(2).replace('.', ',')}</p>
          </div>
          <div className="md:col-span-2 flex flex-col gap-3">
            {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
            <button
              type="submit"
              disabled={loading || items.length === 0}
              className="inline-flex items-center justify-center rounded-3xl bg-slate-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? 'Gerando pagamento…' : 'Gerar pagamento Pix'}
            </button>
          </div>
        </form>
      </div>

      {payment ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pix-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
        >
          <div className="max-h-[95vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white p-6 shadow-2xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-emerald-700">Pagamento Pix</p>
                <h2 id="pix-modal-title" className="mt-2 text-2xl font-bold text-slate-950">
                  Escaneie para pagar
                </h2>
                <p className="mt-1 text-sm text-slate-500">Pedido #{payment.codigo}</p>
              </div>
              <button
                type="button"
                onClick={() => setPayment(null)}
                aria-label="Fechar"
                className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mx-auto mt-6 w-fit rounded-3xl border border-slate-200 bg-white p-4">
              {/* O Mercado Pago retorna somente o conteúdo base64, sem o prefixo data URL. */}
              <img
                src={`data:image/png;base64,${payment.qrCodeBase64.replace(/^data:image\/png;base64,/, '')}`}
                alt="QR Code Pix do pedido"
                className="h-56 w-56"
              />
            </div>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-center">
              <p className="text-sm text-slate-500">Valor</p>
              <p className="mt-1 text-3xl font-bold text-slate-950">
                R$ {Number(payment.amount).toFixed(2).replace('.', ',')}
              </p>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">Pix copia e cola</label>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <p className="max-h-20 overflow-y-auto break-all text-xs text-slate-600">{payment.pixCopyPaste}</p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(payment.pixCopyPaste);
                  setCopied(true);
                  window.setTimeout(() => setCopied(false), 2000);
                }}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white hover:bg-slate-800"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
                {copied ? 'Código copiado' : 'Copiar código Pix'}
              </button>
            </div>

            <p className="mt-5 text-center text-sm text-slate-500">
              Após o pagamento, aguarde a confirmação automática do Mercado Pago.
            </p>
          </div>
        </div>
      ) : null}

      {payment && paymentApproved ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-8 text-center shadow-2xl">
            <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-emerald-300 opacity-50" />
              <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
                <Check size={44} strokeWidth={3} />
              </span>
            </div>
            <h2 className="mt-6 text-2xl font-bold text-slate-950">Pagamento realizado com sucesso!</h2>
            <p className="mt-3 text-slate-600">
              Seu pagamento foi confirmado. Clique em OK para visualizar todos os detalhes do pedido.
            </p>
            <button
              type="button"
              onClick={() => {
                window.open(
                  `/pedido/${encodeURIComponent(payment.codigo)}?paymentId=${encodeURIComponent(payment.paymentId)}`,
                  '_blank',
                  'noopener,noreferrer',
                );
                setPaymentApproved(false);
                setPayment(null);
              }}
              className="mt-7 w-full rounded-2xl bg-emerald-600 px-6 py-4 font-bold text-white hover:bg-emerald-700"
            >
              OK
            </button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
