'use client';

import { useState } from 'react';
import { useCart } from './cart-context';

interface ProductCardProps {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  metaQuantidade: number;
  quantidadeArrecadada: number;
  unidade: string;
  categoria: string;
  personalizado: boolean;
  imagemUrl?: string;
}

export default function ProductCard({
  id,
  nome,
  descricao,
  preco,
  metaQuantidade,
  quantidadeArrecadada,
  unidade,
  categoria,
  personalizado,
  imagemUrl,
}: ProductCardProps) {
  const restante = Math.max(0, metaQuantidade - quantidadeArrecadada);
  const percentual = metaQuantidade > 0 ? Math.min(100, Math.round((quantidadeArrecadada / metaQuantidade) * 100)) : 0;
  const { addItem } = useCart();
  const [quantidade, setQuantidade] = useState(1);
  const [added, setAdded] = useState(false);
  const [imageError, setImageError] = useState(false);

  function handleAdd() {
    const quantidadeValida = Math.max(1, Math.min(restante, quantidade));
    addItem({ productId: id, nome, preco, quantidade: quantidadeValida, personalizado });
    setQuantidade(quantidadeValida);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-orange-200 bg-orange-50 shadow-soft transition hover:-translate-y-1 hover:border-orange-400 hover:shadow-lg">
      {imagemUrl && !imageError ? (
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-orange-100">
          {/* A tag nativa mantém compatibilidade com URLs externas no Safari e Android. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagemUrl}
            alt={`Imagem do produto ${nome}`}
            loading="lazy"
            decoding="async"
            onError={() => setImageError(true)}
            className="h-full w-full object-contain"
          />
        </div>
      ) : null}
      <div className="p-6">
      <div className="mb-3 inline-flex rounded-full bg-orange-200 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-orange-900">{categoria}</div>
      <h3 className="text-xl font-semibold text-slate-900">{nome}</h3>
      {descricao ? <p className="mt-2 text-sm text-slate-600">{descricao}</p> : null}
      {personalizado ? (
        <p className="mt-3 inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">
          Personalizado · envie suas imagens no checkout
        </p>
      ) : null}
      <div className="mt-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-base text-slate-900">R$ {preco.toFixed(2).replace('.', ',')}</p>
          <p className="text-xs text-slate-500">Valor por {unidade}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={restante}
            value={quantidade}
            onChange={(event) => setQuantidade(Number(event.target.value))}
            className="w-20 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          />
          <button
            type="button"
            disabled={restante === 0}
            onClick={handleAdd}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
              added ? 'bg-orange-700' : 'bg-orange-600 hover:bg-orange-700'
            }`}
          >
            {added ? 'Adicionado ✓' : 'Adicionar'}
          </button>
        </div>
      </div>
      <div className="mt-5">
        <div className="mb-2 flex justify-between gap-3 text-sm font-semibold text-slate-700">
          <span>{quantidadeArrecadada} {unidade} arrecadados</span>
          <span>Meta: {metaQuantidade} {unidade}</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-orange-200"><div className="h-full rounded-full bg-emerald-600 transition-all" style={{ width: `${percentual}%` }} /></div>
        <p className="mt-2 text-xs font-semibold text-emerald-700">{restante === 0 ? 'Meta atingida!' : `${percentual}% concluído · faltam ${restante} ${unidade}`}</p>
      </div>
      </div>
    </div>
  );
}
