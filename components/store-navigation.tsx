'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, ShoppingBag, ShoppingCart } from 'lucide-react';
import { useCart } from './cart-context';

export default function StoreNavigation() {
  const pathname = usePathname();
  const { itemCount } = useCart();

  if (pathname.startsWith('/admin')) return null;

  return (
    <>
    <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="container flex min-h-16 items-center justify-between gap-2">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold text-slate-950">
          <ShoppingBag size={21} />
          <span className="text-sm sm:text-base">ORESTES STORE</span>
        </Link>

        <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className={`hidden rounded-xl px-4 py-2 text-sm font-semibold sm:block ${
              pathname === '/' ? 'bg-slate-100 text-slate-950' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Produtos
          </Link>
          <Link
            href="/consultar-pedido"
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold ${
              pathname === '/consultar-pedido'
                ? 'bg-slate-100 text-slate-950'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Search size={17} />
            <span className="hidden md:inline">Consultar meu pedido</span>
            <span className="sr-only md:hidden">Consultar meu pedido</span>
          </Link>
        </nav>
      </div>
    </header>
    <div className="h-16" aria-hidden="true" />
    <Link
      href="/cart"
      aria-label={`Carrinho com ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`}
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 flex min-h-16 touch-manipulation items-center gap-3 rounded-full bg-slate-950 px-5 py-4 text-base font-bold text-white shadow-2xl ring-2 ring-white transition hover:bg-slate-700 active:scale-95 sm:bottom-6 sm:right-6"
    >
      <ShoppingCart size={24} aria-hidden="true" />
      <span>Carrinho</span>
      <span className="flex min-h-7 min-w-7 items-center justify-center rounded-full bg-amber-400 px-2 text-sm font-bold text-slate-950">
        {itemCount}
      </span>
    </Link>
    </>
  );
}
