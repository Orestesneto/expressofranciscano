'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  nome: z.string().min(3),
  descricao: z.string().optional(),
  imagemUrl: z.union([z.string().url(), z.literal('')]).optional(),
  preco: z.number().positive(),
  estoque: z.number().int().min(0),
  estoqueMinimo: z.number().int().min(0),
  disponivelVenda: z.boolean(),
  personalizado: z.boolean(),
  ativo: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export default function NovoProdutoPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { register, handleSubmit, formState } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      disponivelVenda: true,
      ativo: true,
      personalizado: false,
      estoqueMinimo: 0,
      estoque: 0,
    },
  });

  async function onSubmit(data: FormValues) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/produtos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        setError(result?.message ?? 'Erro ao criar o produto.');
        return;
      }

      router.push('/admin/produtos');
    } catch (err) {
      setError('Erro de comunicação.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container py-16">
      <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-10 shadow-soft">
        <h1 className="text-3xl font-semibold">Cadastrar produto</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid gap-6">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Nome</label>
            <input className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3" {...register('nome')} />
            <p className="mt-2 text-sm text-red-600">{formState.errors.nome?.message}</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Descrição</label>
            <textarea className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3" rows={4} {...register('descricao')} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Imagem URL</label>
            <input className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3" {...register('imagemUrl')} />
            <p className="mt-2 text-sm text-slate-600">Informe a URL da imagem do produto.</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Preço</label>
              <input type="number" step="0.01" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3" {...register('preco', { valueAsNumber: true })} />
              <p className="mt-2 text-sm text-red-600">{formState.errors.preco?.message}</p>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Estoque</label>
              <input type="number" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3" {...register('estoque', { valueAsNumber: true })} />
              <p className="mt-2 text-sm text-red-600">{formState.errors.estoque?.message}</p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Estoque mínimo</label>
              <input type="number" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3" {...register('estoqueMinimo', { valueAsNumber: true })} />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <label className="flex items-center gap-3">
                <input type="checkbox" {...register('disponivelVenda')} />
                <span className="text-sm">Disponível para venda</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" {...register('personalizado')} />
                <span className="text-sm">Produto personalizado</span>
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" {...register('ativo')} />
                <span className="text-sm">Ativo</span>
              </label>
            </div>
          </div>
          {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
          <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center rounded-3xl bg-slate-900 px-6 py-4 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
            {loading ? 'Salvando…' : 'Cadastrar produto'}
          </button>
        </form>
      </div>
    </main>
  );
}
