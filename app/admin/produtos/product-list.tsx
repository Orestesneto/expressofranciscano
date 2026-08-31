'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';

type Produto = {
  id: number;
  nome: string;
  categoria: string;
  preco: number;
  quantidadeArrecadada: number;
  metaQuantidade: number;
  unidade: string;
  disponivelVenda: boolean;
  ativo: boolean;
};

function normalizar(texto: string) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export default function ProductList({ produtos }: { produtos: Produto[] }) {
  const [pesquisa, setPesquisa] = useState('');
  const produtosFiltrados = useMemo(() => {
    const termo = normalizar(pesquisa.trim());
    if (!termo) return produtos;
    return produtos.filter((produto) => normalizar(`${produto.nome} ${produto.categoria}`).includes(termo));
  }, [pesquisa, produtos]);

  return (
    <>
      <label className="mb-6 block">
        <span className="mb-2 block text-sm font-semibold text-slate-700">Pesquisar produto</span>
        <span className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="search"
            value={pesquisa}
            onChange={(event) => setPesquisa(event.target.value)}
            placeholder="Digite o nome ou a categoria"
            className="w-full rounded-2xl border border-orange-200 bg-white py-3 pl-12 pr-4 text-slate-900 outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
          />
        </span>
      </label>

      <div className="space-y-4">
        {produtosFiltrados.map((produto) => (
          <div key={produto.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">{produto.nome}</h2>
                <p className="mt-1 text-xs font-bold uppercase tracking-wider text-orange-700">{produto.categoria}</p>
              </div>
              <div className="grid gap-2 text-sm text-slate-700 md:text-right">
                <span>Preço: R$ {produto.preco.toFixed(2).replace('.', ',')}</span>
                <span>Arrecadado: {produto.quantidadeArrecadada} {produto.unidade}</span>
                <span>Meta: {produto.metaQuantidade} {produto.unidade}</span>
                <span>Disponível: {produto.disponivelVenda ? 'Sim' : 'Não'}</span>
                <span>Status: {produto.ativo ? 'Ativo' : 'Inativo'}</span>
                {produto.quantidadeArrecadada >= produto.metaQuantidade ? <span className="font-semibold text-emerald-700">Meta atingida</span> : null}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link href={`/admin/produtos/${produto.id}`} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                Editar
              </Link>
            </div>
          </div>
        ))}
        {produtosFiltrados.length === 0 ? (
          <div className="rounded-3xl border border-orange-200 bg-white p-8 text-center text-slate-600">
            Nenhum produto encontrado para “{pesquisa}”.
          </div>
        ) : null}
      </div>
    </>
  );
}
