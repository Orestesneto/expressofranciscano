'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result?.message ?? 'Credenciais inválidas.');
        return;
      }
      router.push('/admin');
    } catch (err) {
      setError('Erro ao se conectar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container py-16">
      <div className="mx-auto max-w-lg rounded-[2rem] bg-white p-10 shadow-soft">
        <h1 className="text-3xl font-semibold">Painel administrativo</h1>
        <p className="mt-3 text-slate-600">Faça login para acessar os pedidos e o controle de produção.</p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Usuário</label>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3"
            />
          </div>
          {error ? <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-3xl bg-slate-900 px-6 py-4 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
