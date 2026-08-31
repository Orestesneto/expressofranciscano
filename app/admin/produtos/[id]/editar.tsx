'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const schema = z.object({
  nome: z.string().min(3),
  descricao: z.string().optional(),
  imagemUrl: z.union([z.string().url(), z.literal('')]).optional(),
  preco: z.number().positive(),
  unidade: z.string().trim().min(1, 'Informe a unidade de medida'),
  estoque: z.number().int().min(0),
  estoqueMinimo: z.number().int().min(0),
  disponivelVenda: z.boolean(),
  personalizado: z.boolean(),
  ativo: z.boolean(),
  ajusteQuantidade: z.number().int().optional(),
  ajusteMotivo: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function ProdutoEditar({ produto }: { produto: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { register, handleSubmit, formState, reset } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nome: produto.nome,
      descricao: produto.descricao ?? '',
      imagemUrl: produto.imagemUrl ?? '',
      preco: Number(produto.preco),
      unidade: produto.unidade ?? 'unidade',
      estoque: produto.estoque,
      estoqueMinimo: produto.estoqueMinimo,
      disponivelVenda: produto.disponivelVenda,
      personalizado: produto.personalizado,
      ativo: produto.ativo,
    },
  });

  useEffect(() => {
    reset({
      nome: produto.nome,
      descricao: produto.descricao ?? '',
      imagemUrl: produto.imagemUrl ?? '',
      preco: Number(produto.preco),
      unidade: produto.unidade ?? 'unidade',
      estoque: produto.estoque,
      estoqueMinimo: produto.estoqueMinimo,
      disponivelVenda: produto.disponivelVenda,
      personalizado: produto.personalizado,
      ativo: produto.ativo,
    });
  }, [produto, reset]);

  async function onSubmit(data: FormValues) {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/admin/produtos/${produto.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const result = await response.json();
        setError(result?.message ?? 'Erro ao atualizar o produto.');
        return;
      }

      const result = await response.json();
      reset({
        nome: result.produto.nome,
        descricao: result.produto.descricao ?? '',
        imagemUrl: result.produto.imagemUrl ?? '',
        preco: Number(result.produto.preco),
        unidade: result.produto.unidade ?? 'unidade',
        estoque: result.produto.estoque,
        estoqueMinimo: result.produto.estoqueMinimo,
        disponivelVenda: result.produto.disponivelVenda,
        personalizado: result.produto.personalizado,
        ativo: result.produto.ativo,
        ajusteQuantidade: undefined,
        ajusteMotivo: '',
      });
      setSuccess(`Produto atualizado. Meta definida em ${result.produto.metaQuantidade} ${result.produto.unidade}.`);
    } catch (err) {
      setError('Erro de comunicação.');
    } finally {
      setLoading(false);
    }
  }

  async function removerProduto() {
    const confirmado = window.confirm(`Remover o produto "${produto.nome}"? Ele deixará de aparecer no catálogo.`);
    if (!confirmado) return;

    setDeleting(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/admin/produtos/${produto.id}`, { method: 'DELETE' });
      const result = await response.json();
      if (!response.ok) {
        setError(result?.message ?? 'Não foi possível remover o produto.');
        return;
      }
      router.replace('/admin/produtos');
      router.refresh();
    } catch {
      setError('Erro de comunicação ao remover o produto.');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Nome</label>
          <input className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3" {...register('nome')} />
          <p className="mt-2 text-sm text-red-600">{formState.errors.nome?.message}</p>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Imagem URL</label>
          <input className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3" {...register('imagemUrl')} />
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Preço</label>
            <input type="number" step="0.01" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3" {...register('preco', { valueAsNumber: true })} />
            <p className="mt-2 text-sm text-red-600">{formState.errors.preco?.message}</p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Quantidade de itens necessários</label>
            <input type="number" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3" {...register('estoque', { valueAsNumber: true })} />
            <p className="mt-2 text-sm text-red-600">{formState.errors.estoque?.message}</p>
            <p className="mt-2 text-sm text-slate-600">Este número será exibido como a meta do produto na loja.</p>
          </div>
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">Unidade de medida</label>
          <input
            placeholder="kg, litro, unidade, pacote..."
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
            {...register('unidade')}
          />
          <p className="mt-2 text-sm text-red-600">{formState.errors.unidade?.message}</p>
        </div>
        <div className="rounded-3xl border border-orange-200 bg-orange-50 p-5">
          <p className="mb-4 text-sm font-semibold text-slate-700">Opções do produto</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex items-center gap-3">
              <input type="checkbox" {...register('disponivelVenda')} />
              <span className="text-sm">Exibir na loja</span>
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
        {success ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</p> : null}
        <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center rounded-3xl bg-slate-900 px-6 py-4 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? 'Atualizando…' : 'Salvar alterações'}
        </button>
        <button
          type="button"
          onClick={removerProduto}
          disabled={loading || deleting}
          className="inline-flex w-full items-center justify-center rounded-3xl border-2 border-red-600 px-6 py-4 text-sm font-semibold text-red-700 transition hover:bg-red-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {deleting ? 'Removendo…' : 'Remover produto'}
        </button>
      </form>

    </>
  );
}
