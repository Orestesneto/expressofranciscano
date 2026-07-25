'use client';

import { useState } from 'react';
import { useCart } from './cart-context';

interface ProductCardProps {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  estoque: number;
  personalizado: boolean;
  imagemUrl?: string;
}

export default function ProductCard({
  id,
  nome,
  descricao,
  preco,
  estoque,
  personalizado,
  imagemUrl,
}: ProductCardProps) {
  const { addItem } = useCart();
  const [quantidade, setQuantidade] = useState(1);
  const [added, setAdded] = useState(false);
  const [imageError, setImageError] = useState(false);

  function handleAdd() {
    const quantidadeValida = Math.max(1, Math.min(estoque, quantidade));
    addItem({ productId: id, nome, preco, quantidade: quantidadeValida, personalizado });
    setQuantidade(quantidadeValida);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft">
      {imagemUrl && !imageError ? (
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-slate-50">
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
      <div className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Produto</div>
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
          <p className="text-xs text-slate-500">Estoque: {estoque}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={estoque}
            value={quantidade}
            onChange={(event) => setQuantidade(Number(event.target.value))}
            className="w-20 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-900"
          />
          <button
            type="button"
            disabled={estoque === 0}
            onClick={handleAdd}
            className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
              added ? 'bg-emerald-600' : 'bg-slate-900 hover:bg-slate-700'
            }`}
          >
            {added ? 'Adicionado ✓' : 'Adicionar'}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
