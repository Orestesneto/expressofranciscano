'use client';

import { useState } from 'react';
import { useCart } from './cart-context';

interface ProductCardProps {
  id: number;
  nome: string;
  descricao?: string;
  preco: number;
  estoque: number;
}

export default function ProductCard({ id, nome, descricao, preco, estoque }: ProductCardProps) {
  const { addItem } = useCart();
  const [quantidade, setQuantidade] = useState(1);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    const quantidadeValida = Math.max(1, Math.min(estoque, quantidade));
    addItem({ productId: id, nome, preco, quantidade: quantidadeValida });
    setQuantidade(quantidadeValida);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1800);
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Produto</div>
      <h3 className="text-xl font-semibold text-slate-900">{nome}</h3>
      {descricao ? <p className="mt-2 text-sm text-slate-600">{descricao}</p> : null}
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
  );
}
