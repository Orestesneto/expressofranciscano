'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Search, ShoppingBag, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCart } from './cart-context';

export default function StoreNavigation() {
  const pathname = usePathname();
  const { itemCount } = useCart();
  const [cartBottom, setCartBottom] = useState(16);

  useEffect(() => {
    let animationFrame = 0;

    function updateCartPosition() {
      cancelAnimationFrame(animationFrame);
      animationFrame = requestAnimationFrame(() => {
        const footer = document.getElementById('site-footer');
        const baseSpacing = window.innerWidth >= 640 ? 24 : 16;
        if (!footer) {
          setCartBottom(baseSpacing);
          return;
        }

        const footerTop = footer.getBoundingClientRect().top;
        const visibleFooterHeight = Math.max(0, window.innerHeight - footerTop);
        setCartBottom(baseSpacing + visibleFooterHeight);
      });
    }

    updateCartPosition();
    window.addEventListener('scroll', updateCartPosition, { passive: true });
    window.addEventListener('resize', updateCartPosition);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener('scroll', updateCartPosition);
      window.removeEventListener('resize', updateCartPosition);
    };
  }, []);

  if (pathname.startsWith('/admin')) return null;

  return (
    <>
    <header className="fixed inset-x-0 top-0 z-40 border-b border-orange-500 bg-slate-950/95 text-white shadow-sm backdrop-blur">
      <div className="container relative flex min-h-16 items-center justify-between gap-1">
        <Link href="/" className="flex shrink-0 items-center gap-1.5 font-bold text-white sm:gap-2">
          <ShoppingBag className="h-[18px] w-[18px] sm:h-[21px] sm:w-[21px]" />
          <span className="text-xs sm:text-base">EXPRESSO FRANCISCANO</span>
        </Link>

        <Image
          src="/trem-franciscano-transparente.png"
          alt=""
          width={1401}
          height={497}
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 hidden h-auto w-44 -translate-x-1/2 -translate-y-1/2 lg:block xl:w-52"
        />

        <nav className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Link
            href="/"
            className={`hidden rounded-xl px-4 py-2 text-sm font-semibold sm:block ${
              pathname === '/' ? 'bg-orange-500 text-white' : 'text-orange-100 hover:bg-orange-600'
            }`}
          >
            Produtos
          </Link>
          <Link
            href="/consultar-pedido"
            className={`flex items-center gap-1.5 rounded-xl px-2 py-2 text-[10px] font-semibold sm:gap-2 sm:px-3 sm:text-sm ${
              pathname === '/consultar-pedido'
                ? 'bg-orange-500 text-white'
                : 'text-orange-100 hover:bg-orange-600'
            }`}
          >
            <Search size={17} />
            <span>Quem já nos ajudou</span>
          </Link>
        </nav>
      </div>
    </header>
    <div className="h-16" aria-hidden="true" />
    <Link
      href="/cart"
      aria-label={`Carrinho com ${itemCount} ${itemCount === 1 ? 'item' : 'itens'}`}
      style={{ bottom: `calc(${cartBottom}px + env(safe-area-inset-bottom))` }}
      className="fixed right-4 z-40 flex min-h-16 touch-manipulation items-center gap-3 rounded-full bg-orange-600 px-5 py-4 text-base font-bold text-white shadow-2xl ring-2 ring-orange-200 transition-[bottom,background-color,transform] duration-150 hover:bg-orange-700 active:scale-95 sm:right-6"
    >
      <ShoppingCart size={24} aria-hidden="true" />
      <span>Carrinho</span>
      <span className="flex min-h-7 min-w-7 items-center justify-center rounded-full bg-slate-950 px-2 text-sm font-bold text-orange-100">
        {itemCount}
      </span>
    </Link>
    </>
  );
}
