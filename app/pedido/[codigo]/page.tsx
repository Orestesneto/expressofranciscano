import Link from 'next/link';
import { notFound } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function PedidoConfirmadoPage({
  params,
  searchParams,
}: {
  params: { codigo: string };
  searchParams: { paymentId?: string };
}) {
  if (!searchParams.paymentId) notFound();

  const pedido = await prisma.pedido.findFirst({
    where: {
      codigo: params.codigo,
      statusPagamento: 'PAGO',
      pagamento: { paymentId: searchParams.paymentId },
    },
    include: { itens: true, pagamento: true },
  });
  if (!pedido) notFound();

  return (
    <main className="container py-10">
      <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 shadow-soft sm:p-10">
        <div className="flex flex-col items-center text-center">
          <CheckCircle2 className="text-emerald-500" size={64} />
          <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">Pagamento confirmado</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-950">Pedido #{pedido.codigo}</h1>
          <p className="mt-3 text-slate-600">Seu pedido foi recebido e seguirá para produção.</p>
        </div>

        <div className="mt-8 grid gap-4 rounded-3xl bg-slate-50 p-6 sm:grid-cols-2">
          <div>
            <p className="text-sm text-slate-500">Cliente</p>
            <p className="mt-1 font-semibold">{pedido.nomeCliente} {pedido.sobrenomeCliente}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Equipe</p>
            <p className="mt-1 font-semibold">{pedido.equipeNome || 'Não informada'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Telefone</p>
            <p className="mt-1 font-semibold">{pedido.telefone || 'Não informado'}</p>
          </div>
          <div>
            <p className="text-sm text-slate-500">Data do pedido</p>
            <p className="mt-1 font-semibold">{pedido.createdAt.toLocaleString('pt-BR')}</p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold">Itens do pedido</h2>
          <div className="mt-4 divide-y divide-slate-200 rounded-3xl border border-slate-200">
            {pedido.itens.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-4 p-5">
                <div>
                  <p className="font-semibold">{item.nomeProduto}</p>
                  <p className="text-sm text-slate-500">
                    {item.quantidade} × R$ {Number(item.valorUnitario).toFixed(2).replace('.', ',')}
                  </p>
                </div>
                <p className="font-bold">R$ {Number(item.subtotal).toFixed(2).replace('.', ',')}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-between rounded-3xl bg-slate-950 p-6 text-white">
          <span>Total pago</span>
          <span className="text-2xl font-bold">R$ {Number(pedido.valorTotal).toFixed(2).replace('.', ',')}</span>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-slate-500">Guarde o número do pedido para a retirada.</p>
          <Link href="/" className="mt-4 inline-flex rounded-2xl bg-slate-100 px-5 py-3 font-semibold text-slate-800 hover:bg-slate-200">
            Voltar à loja
          </Link>
        </div>
      </div>
    </main>
  );
}
