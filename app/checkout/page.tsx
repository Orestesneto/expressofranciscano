'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useCart } from '@/components/cart-context';

const schema = z.object({
  nome: z.string().min(2, 'Informe o nome'),
  sobrenome: z.string().min(2, 'Informe o sobrenome'),
  equipe: z.string().min(1, 'Selecione a equipe'),
  telefone: z.string().optional(),
  observacao: z.string().optional(),
});

type CheckoutForm = z.infer<typeof schema>;

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
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState } = useForm<CheckoutForm>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (items.length === 0) {
      setError('O carrinho está vazio. Adicione algum produto antes de finalizar.');
    }
  }, [items.length]);

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
      setCheckoutUrl(result.checkoutUrl);
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
            {checkoutUrl ? (
              <a href={checkoutUrl} className="rounded-3xl bg-emerald-500 px-6 py-4 text-center text-sm font-semibold text-white hover:bg-emerald-600">
                Abrir pagamento Pix
              </a>
            ) : null}
          </div>
        </form>
      </div>
    </main>
  );
}
