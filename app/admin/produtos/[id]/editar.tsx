'use client';

import { useEffect, useMemo, useState } from 'react';
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

interface Movimentacao {
  id: number;
  tipo: string;
  quantidade: number;
  estoqueAnterior: number;
  estoqueNovo: number;
  motivo: string | null;
  createdAt: string;
}

export default function ProdutoEditar({ produto }: { produto: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const { register, handleSubmit, formState, reset, watch } = useForm<FormValues>({
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

  const estoque = watch('estoque');
  const statusBadge = useMemo(() => (estoque > 0 ? 'Disponível' : 'Esgotado'), [estoque]);

  useEffect(() => {
    async function loadHistory() {
      setLoadingHistory(true);
      try {
        const response = await fetch(`/api/admin/produtos/${produto.id}/historico`);
        if (!response.ok) return;
        const data = await response.json();
        setMovimentacoes(data.movimentacoes ?? []);
      } finally {
        setLoadingHistory(false);
      }
    }
    loadHistory();
  }, [produto.id]);

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
      const historyResponse = await fetch(`/api/admin/produtos/${produto.id}/historico`);
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setMovimentacoes(historyData.movimentacoes ?? []);
      }
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
            <label className="mb-2 block text-sm font-semibold text-slate-700">Itens necessários</label>
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
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Estoque mínimo</label>
            <input type="number" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3" {...register('estoqueMinimo', { valueAsNumber: true })} />
            <p className="mt-2 text-sm text-red-600">{formState.errors.estoqueMinimo?.message}</p>
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
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
          <p className="text-sm text-slate-600">Status do estoque</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">{estoque > 0 ? 'Disponível' : 'Esgotado'}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Ajuste de quantidade</label>
            <input type="number" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3" {...register('ajusteQuantidade', { valueAsNumber: true })} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Motivo do ajuste</label>
            <input className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3" {...register('ajusteMotivo')} />
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

      <div className="mt-10 rounded-3xl border border-slate-200 bg-slate-50 p-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Histórico de estoque</h2>
            <p className="text-sm text-slate-600">Registros de entrada, venda e ajustes.</p>
          </div>
          {loadingHistory ? <span className="text-sm text-slate-500">Carregando...</span> : null}
        </div>
        {movimentacoes.length === 0 ? (
          <p className="text-sm text-slate-600">Nenhuma movimentação registrada ainda.</p>
        ) : (
          <div className="space-y-4">
            {movimentacoes.map((mov) => (
              <div key={mov.id} className="rounded-3xl border border-slate-200 bg-white p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{mov.tipo}</p>
                    <p className="text-sm text-slate-500">{new Date(mov.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">{mov.quantidade > 0 ? `+${mov.quantidade}` : mov.quantidade}</span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  <p className="text-sm text-slate-600">Estoque anterior: <span className="font-semibold text-slate-900">{mov.estoqueAnterior}</span></p>
                  <p className="text-sm text-slate-600">Estoque novo: <span className="font-semibold text-slate-900">{mov.estoqueNovo}</span></p>
                  <p className="text-sm text-slate-600">Motivo: <span className="font-semibold text-slate-900">{mov.motivo || 'Sem motivo'}</span></p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
