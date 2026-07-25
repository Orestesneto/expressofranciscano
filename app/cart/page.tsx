'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useCart } from '@/components/cart-context';

export default function CartPage() {
  const { items, updateQuantity, removeItem, total } = useCart();

  const valorTotal = useMemo(
    () => total.toFixed(2).replace('.', ','),
    [total],
  );

  if (items.length === 0) {
    return (
      <main className="container py-10">
        <div className="rounded-3xl bg-white p-10 shadow-soft text-center">
          <h2 className="text-2xl font-semibold">Seu carrinho está vazio</h2>
          <p className="mt-3 text-slate-600">Adicione produtos e volte aqui para finalizar o pedido.</p>
          <Link href="/" className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-white">
            Voltar à loja
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container py-10">
      <div className="rounded-[2rem] bg-white p-8 shadow-soft">
        <h1 className="text-3xl font-semibold">Carrinho</h1>
        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <div key={item.productId} className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold">{item.nome}</h2>
                <p className="mt-1 text-sm text-slate-600">R$ {item.preco.toFixed(2).replace('.', ',')} cada</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.productId, item.quantidade - 1)}
                  className="rounded-full bg-slate-200 px-3 py-2 text-slate-700"
                >
                  −
                </button>
                <span className="min-w-[2rem] text-center text-lg font-semibold">{item.quantidade}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.productId, item.quantidade + 1)}
                  className="rounded-full bg-slate-200 px-3 py-2 text-slate-700"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(item.productId)}
                  className="rounded-xl bg-red-500 px-4 py-2 text-white"
                >
                  Remover
                </button>
              </div>
              <div className="text-right text-sm text-slate-700">
                <p>Subtotal:</p>
                <p className="text-lg font-semibold">R$ {(item.preco * item.quantidade).toFixed(2).replace('.', ',')}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex flex-col gap-4 border-t border-slate-200 pt-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-500">Total do pedido</p>
            <p className="text-3xl font-semibold">R$ {valorTotal}</p>
          </div>
          <Link href="/checkout" className="inline-flex rounded-3xl bg-slate-900 px-6 py-4 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-700">
            Finalizar pedido
          </Link>
        </div>
      </div>
    </main>
  );
}
