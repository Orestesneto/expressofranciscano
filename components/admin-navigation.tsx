'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ClipboardList, LayoutDashboard, LogOut, Package, PlusCircle, Store } from 'lucide-react';
import { useState } from 'react';

const tabs = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ClipboardList },
  { href: '/admin/produtos', label: 'Produtos', icon: Package },
  { href: '/admin/produtos/novo', label: 'Novo produto', icon: PlusCircle, exact: true },
];

export default function AdminNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  async function logout() {
    setLeaving(true);
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.replace('/admin/login');
      router.refresh();
    } finally {
      setLeaving(false);
    }
  }

  return (
    <header className="border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
      <div className="container">
        <div className="flex min-h-20 items-center justify-between gap-4">
          <Link href="/admin" className="shrink-0">
            <span className="block text-lg font-bold text-slate-950">ORESTES STORE</span>
            <span className="block text-xs text-slate-500">Painel administrativo</span>
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 sm:flex"
            >
              <Store size={17} />
              Ver loja
            </Link>
            <button
              type="button"
              onClick={logout}
              disabled={leaving}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              <LogOut size={17} />
              {leaving ? 'Saindo...' : 'Sair'}
            </button>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto" aria-label="Navegação administrativa">
          {tabs.map(({ href, label, icon: Icon, exact }) => {
            const active =
              href === '/admin/produtos'
                ? pathname.startsWith(href) && pathname !== '/admin/produtos/novo'
                : exact
                  ? pathname === href
                  : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${
                  active
                    ? 'border-slate-950 text-slate-950'
                    : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-800'
                }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
