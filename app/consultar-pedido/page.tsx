'use client';

import { FormEvent, useState } from 'react';
import { CheckCircle2, Clock3, PackageCheck, Search } from 'lucide-react';

interface Pedido {
  codigo: string;
  nomeCliente: string;
  equipe: string | null;
  valorTotal: number;
  statusPagamento: string;
  statusProducao: string;
  createdAt: string;
  paidAt: string | null;
  deliveredAt: string | null;
  itens: Array<{
    id: number;
    nomeProduto: string;
    quantidade: number;
    valorUnitario: number;
    subtotal: number;
  }>;
}

const pagamentoLabels: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  PAGO: 'Pagamento aprovado',
  CANCELADO: 'Pagamento cancelado',
  EXPIRADO: 'Pagamento expirado',
  ESTORNADO: 'Pagamento estornado',
};

const producaoLabels: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: 'Aguardando pagamento',
  PEDIDO_RECEBIDO: 'Pedido recebido',
  EM_PRODUCAO: 'Em produção',
  PRONTO_PARA_RETIRADA: 'Pronto para retirada',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

export default function ConsultarPedidoPage() {
  const [telefone, setTelefone] = useState('');
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function consultar(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setPedidos(null);
    try {
      const response = await fetch('/api/pedidos/consultar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ telefone }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.message ?? 'Não foi possível consultar os pedidos.');
        return;
      }
      setPedidos(result.pedidos);
    } catch {
      setError('Erro de comunicação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="container py-10">
      <section className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 shadow-soft sm:p-10">
        <div className="text-center">
          <Search className="mx-auto text-slate-900" size={42} />
          <h1 className="mt-4 text-3xl font-bold">Consultar meu pedido</h1>
          <p className="mt-2 text-slate-600">Informe o mesmo telefone utilizado na compra.</p>
        </div>

        <form onSubmit={consultar} className="mx-auto mt-8 flex max-w-xl flex-col gap-3 sm:flex-row">
          <input
            type="tel"
            inputMode="numeric"
            value={telefone}
            onChange={(event) => setTelefone(event.target.value)}
            placeholder="Telefone ou WhatsApp"
            className="min-w-0 flex-1 rounded-2xl border border-slate-300 bg-slate-50 px-5 py-4"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-slate-950 px-6 py-4 font-bold text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? 'Consultando...' : 'Consultar'}
          </button>
        </form>
        {error ? <p className="mx-auto mt-4 max-w-xl rounded-2xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : null}
      </section>

      {pedidos?.length === 0 ? (
        <div className="mx-auto mt-6 max-w-3xl rounded-3xl bg-white p-8 text-center shadow-soft">
          <p className="font-semibold">Nenhum pedido encontrado para este telefone.</p>
        </div>
      ) : null}

      {pedidos && pedidos.length > 0 ? (
        <section className="mx-auto mt-6 max-w-3xl space-y-5">
          <p className="text-sm text-slate-600">{pedidos.length} {pedidos.length === 1 ? 'pedido encontrado' : 'pedidos encontrados'}</p>
          {pedidos.map((pedido) => {
            const pago = pedido.statusPagamento === 'PAGO';
            const entregue = pedido.statusProducao === 'ENTREGUE';
            return (
              <article key={pedido.codigo} className="rounded-3xl bg-white p-6 shadow-soft sm:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Número do pedido</p>
                    <h2 className="mt-1 text-2xl font-bold">#{pedido.codigo}</h2>
                    <p className="mt-1 text-sm text-slate-500">{new Date(pedido.createdAt).toLocaleString('pt-BR')}</p>
                  </div>
                  <p className="text-2xl font-bold">R$ {pedido.valorTotal.toFixed(2).replace('.', ',')}</p>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className={`rounded-2xl p-4 ${pago ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                    <div className="flex items-center gap-2 font-bold">
                      {pago ? <CheckCircle2 size={19} /> : <Clock3 size={19} />}
                      {pagamentoLabels[pedido.statusPagamento] ?? pedido.statusPagamento}
                    </div>
                  </div>
                  <div className={`rounded-2xl p-4 ${entregue ? 'bg-emerald-50 text-emerald-800' : 'bg-blue-50 text-blue-800'}`}>
                    <div className="flex items-center gap-2 font-bold">
                      <PackageCheck size={19} />
                      {producaoLabels[pedido.statusProducao] ?? pedido.statusProducao}
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                  {pedido.itens.map((item) => (
                    <div key={item.id} className="flex justify-between gap-3 text-sm">
                      <span><strong>{item.quantidade}×</strong> {item.nomeProduto}</span>
                      <span>R$ {item.subtotal.toFixed(2).replace('.', ',')}</span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-sm text-slate-500">Cliente: {pedido.nomeCliente} · Equipe: {pedido.equipe || 'Não informada'}</p>
              </article>
            );
          })}
        </section>
      ) : null}
    </main>
  );
}
