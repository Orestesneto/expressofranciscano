'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, ShoppingCart } from 'lucide-react';
import { useCart } from './cart-context';

export default function StoreNavigation() {
  const pathname = usePathname();
  const { itemCount } = useCart();

  if (pathname.startsWith('/admin')) return null;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="container flex min-h-16 items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-slate-950">
          <ShoppingBag size={21} />
          <span>ORESTES STORE</span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/"
            className={`rounded-xl px-4 py-2 text-sm font-semibold ${
              pathname === '/' ? 'bg-slate-100 text-slate-950' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Produtos
          </Link>
          <Link
            href="/cart"
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
              pathname === '/cart' || pathname === '/checkout'
                ? 'bg-slate-950 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShoppingCart size={18} />
            Carrinho
            {itemCount > 0 ? (
              <span className="flex min-w-5 items-center justify-center rounded-full bg-amber-400 px-1.5 py-0.5 text-xs font-bold text-slate-950">
                {itemCount}
              </span>
            ) : null}
          </Link>
        </nav>
      </div>
    </header>
  );
}
