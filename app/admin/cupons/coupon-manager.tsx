'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Produto = { id: number; nome: string; preco: number; estoque: number };
type TipoCupom = 'TOTAL' | 'ITEM' | 'MINIMO';
type Cupom = { id: number; codigo: string; valor: number; tipo: string; valorMinimo: number | null; limiteUsos: number; usosRealizados: number; ativo: boolean; produtos: string[]; pedidos: { codigo: string; cliente: string; utilizadoEm: string }[] };

const dinheiro = (valor: number) => valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function CouponManager({ produtos, cupons }: { produtos: Produto[]; cupons: Cupom[] }) {
  const router = useRouter();
  const [tipo, setTipo] = useState<TipoCupom>('TOTAL');
  const [codigo, setCodigo] = useState('');
  const [valor, setValor] = useState('');
  const [valorMinimo, setValorMinimo] = useState('');
  const [limiteUsos, setLimiteUsos] = useState('1');
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const response = await fetch('/api/admin/cupons', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, valor: Number(valor.replace(',', '.')), tipo, valorMinimo: tipo === 'MINIMO' ? Number(valorMinimo.replace(',', '.')) : null, limiteUsos: Number(limiteUsos), produtoIds: tipo === 'ITEM' ? selecionados : [] }),
      });
      const result = await response.json();
      if (!response.ok) return setMessage(result.message ?? 'Não foi possível criar o cupom.');
      setCodigo(''); setValor(''); setValorMinimo(''); setLimiteUsos('1'); setSelecionados([]); setMessage('Cupom criado com sucesso.');
      router.refresh();
    } finally { setSaving(false); }
  }

  async function toggle(cupom: Cupom) {
    await fetch(`/api/admin/cupons/${cupom.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ativo: !cupom.ativo }) });
    router.refresh();
  }

  function descricao(cupom: Cupom) {
    if (cupom.tipo === 'ITEM') return `itens: ${cupom.produtos.join(', ')}`;
    if (cupom.tipo === 'MINIMO') return `pedido mínimo de ${dinheiro(cupom.valorMinimo ?? 0)}`;
    return 'valor total';
  }

  return (
    <main className="container py-12">
      <div className="mb-8"><h1 className="text-3xl font-semibold">Cupons de desconto</h1><p className="mt-2 text-slate-600">Crie cupons para o pedido inteiro, produtos específicos ou pedidos de valor mínimo.</p></div>
      <form onSubmit={submit} className="rounded-[2rem] bg-white p-6 shadow-soft md:p-8">
        <div className="grid gap-5 md:grid-cols-3">
          <div><label className="mb-2 block text-sm font-semibold">Código do cupom</label><input required value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))} placeholder="EX.: DESCONTO10" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 uppercase" /></div>
          <div><label className="mb-2 block text-sm font-semibold">Valor do desconto (R$)</label><input required inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="10,00" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3" /></div>
          <div><label className="mb-2 block text-sm font-semibold">Quantidade de usos</label><input required type="number" min="1" step="1" value={limiteUsos} onChange={(e) => setLimiteUsos(e.target.value)} className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3" /></div>
        </div>
        <fieldset className="mt-6"><legend className="mb-3 text-sm font-semibold">Aplicar desconto</legend><div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border p-4 has-[:checked]:border-slate-950 has-[:checked]:bg-slate-50"><input type="radio" checked={tipo === 'TOTAL'} onChange={() => setTipo('TOTAL')} /> No valor total</label>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border p-4 has-[:checked]:border-slate-950 has-[:checked]:bg-slate-50"><input type="radio" checked={tipo === 'ITEM'} onChange={() => setTipo('ITEM')} /> Por item</label>
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl border p-4 has-[:checked]:border-slate-950 has-[:checked]:bg-slate-50"><input type="radio" checked={tipo === 'MINIMO'} onChange={() => setTipo('MINIMO')} /> Pedido mínimo</label>
        </div></fieldset>
        {tipo === 'MINIMO' ? <div className="mt-6 max-w-md"><label className="mb-2 block text-sm font-semibold">Valor mínimo do pedido (R$)</label><input required inputMode="decimal" value={valorMinimo} onChange={(e) => setValorMinimo(e.target.value)} placeholder="100,00" className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3" /><p className="mt-2 text-sm text-slate-500">O desconto só será aplicado quando o subtotal atingir esse valor.</p></div> : null}
        {tipo === 'ITEM' ? <fieldset className="mt-6"><legend className="mb-3 text-sm font-semibold">Itens disponíveis na loja</legend><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{produtos.map((produto) => <label key={produto.id} className="flex cursor-pointer gap-3 rounded-2xl border border-slate-200 p-4 has-[:checked]:border-slate-950"><input type="checkbox" checked={selecionados.includes(produto.id)} onChange={(e) => setSelecionados((current) => e.target.checked ? [...current, produto.id] : current.filter((id) => id !== produto.id))} /><span><strong className="block">{produto.nome}</strong><span className="text-sm text-slate-500">{dinheiro(produto.preco)} · estoque {produto.estoque}</span></span></label>)}</div>{produtos.length === 0 ? <p className="text-sm text-slate-500">Nenhum produto disponível.</p> : null}</fieldset> : null}
        {message ? <p className={`mt-5 rounded-2xl px-4 py-3 text-sm ${message.includes('sucesso') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{message}</p> : null}
        <button disabled={saving || (tipo === 'ITEM' && selecionados.length === 0)} className="mt-6 rounded-2xl bg-slate-950 px-6 py-3 font-semibold text-white disabled:opacity-50">{saving ? 'Salvando...' : 'Criar cupom'}</button>
      </form>
      <section className="mt-8"><h2 className="mb-4 text-xl font-semibold">Cupons cadastrados</h2><div className="space-y-3">{cupons.map((cupom) => { const esgotado = cupom.usosRealizados >= cupom.limiteUsos; return <article key={cupom.id} className="rounded-3xl border border-slate-200 bg-white p-5"><div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><div className="flex flex-wrap items-center gap-2"><strong className="text-lg">{cupom.codigo}</strong><span className={`rounded-full px-3 py-1 text-xs font-bold ${esgotado ? 'bg-slate-100 text-slate-600' : cupom.ativo ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{esgotado ? 'Esgotado' : cupom.ativo ? 'Ativo' : 'Inativo'}</span></div><p className="mt-1 text-sm text-slate-600">{dinheiro(cupom.valor)} · {descricao(cupom)}</p><p className="mt-1 text-xs text-slate-500">{cupom.usosRealizados} de {cupom.limiteUsos} usos realizados</p></div>{!esgotado ? <button type="button" onClick={() => toggle(cupom)} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold">{cupom.ativo ? 'Desativar' : 'Ativar'}</button> : null}</div>{cupom.pedidos.length > 0 ? <div className="mt-5 border-t border-slate-100 pt-4"><h3 className="mb-2 text-sm font-semibold">Utilizações</h3><div className="divide-y divide-slate-100 rounded-2xl bg-slate-50 px-4">{cupom.pedidos.map((pedido) => <div key={pedido.codigo} className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><span className="font-medium text-slate-800">{pedido.cliente}</span><span className="text-slate-600">Pedido {pedido.codigo} · {new Date(pedido.utilizadoEm).toLocaleDateString('pt-BR')}</span></div>)}</div></div> : null}</article>})}{cupons.length === 0 ? <p className="rounded-3xl bg-white p-6 text-slate-500">Nenhum cupom cadastrado.</p> : null}</div></section>
    </main>
  );
}
