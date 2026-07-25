import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { isValidAdminSession } from '@/lib/auth';
import OrderStatusActions from '@/components/order-status-actions';

export const dynamic = 'force-dynamic';

const statusLabels: Record<string, string> = {
  PEDIDO_RECEBIDO: 'Aguardando produção',
  EM_PRODUCAO: 'Em produção',
  PRONTO_PARA_RETIRADA: 'Pronto para retirada',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
};

export default async function AdminPedidosPage() {
  const session = cookies().get('ecri_admin_session')?.value;
  if (!isValidAdminSession(session)) redirect('/admin/login');

  const pedidos = await prisma.pedido.findMany({
    where: { statusPagamento: 'PAGO' },
    include: { itens: true },
    orderBy: { paidAt: 'desc' },
  });

  return (
    <main className="container py-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">Pedidos pagos</h1>
        <p className="mt-2 text-slate-600">Acompanhe a produção e confirme a entrega dos pedidos.</p>
      </div>

      {pedidos.length === 0 ? (
        <div className="mt-8 rounded-3xl bg-white p-10 text-center shadow-soft">
          <p className="text-slate-600">Nenhum pedido pago encontrado.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-5">
          {pedidos.map((pedido) => (
            <article key={pedido.id} className="rounded-3xl bg-white p-6 shadow-soft">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-950">Pedido #{pedido.codigo}</h2>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">PAGO</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      {statusLabels[pedido.statusProducao] ?? pedido.statusProducao}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                    <p><span className="text-slate-500">Cliente:</span> <strong>{pedido.nomeCliente}</strong></p>
                    <p><span className="text-slate-500">Equipe:</span> <strong>{pedido.equipeNome || 'Não informada'}</strong></p>
                    <p><span className="text-slate-500">Telefone:</span> <strong>{pedido.telefone || 'Não informado'}</strong></p>
                    <p><span className="text-slate-500">Pago em:</span> <strong>{pedido.paidAt?.toLocaleString('pt-BR') || '-'}</strong></p>
                  </div>
                </div>
                <div className="shrink-0 text-left lg:text-right">
                  <p className="text-sm text-slate-500">Total</p>
                  <p className="text-2xl font-bold">R$ {Number(pedido.valorTotal).toFixed(2).replace('.', ',')}</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                {pedido.itens.map((item) => (
                  <p key={item.id} className="text-sm text-slate-700">
                    <strong>{item.quantidade}×</strong> {item.nomeProduto}
                  </p>
                ))}
              </div>

              <div className="mt-5 flex justify-end">
                <OrderStatusActions pedidoId={pedido.id} statusAtual={pedido.statusProducao} />
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
