import { cookies } from 'next/headers';
import { isValidAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function AdminDashboardPage() {
  const cookieStore = cookies();
  const session = cookieStore.get('ecri_admin_session')?.value;
  if (!isValidAdminSession(session)) {
    return (
      <main className="container py-16">
        <div className="rounded-[2rem] bg-white p-10 shadow-soft text-center">
          <h1 className="text-3xl font-semibold">Acesso não autorizado</h1>
          <p className="mt-3 text-slate-600">Faça login em /admin/login para continuar.</p>
        </div>
      </main>
    );
  }

  const pedidosPagos = await prisma.pedido.count({ where: { statusPagamento: 'PAGO' } });
  const aguardandoProducao = await prisma.pedido.count({ where: { statusProducao: 'PEDIDO_RECEBIDO' } });
  const emProducao = await prisma.pedido.count({ where: { statusProducao: 'EM_PRODUCAO' } });
  const prontos = await prisma.pedido.count({ where: { statusProducao: 'PRONTO_PARA_RETIRADA' } });
  const entregues = await prisma.pedido.count({ where: { statusProducao: 'ENTREGUE' } });
  const totalVendido = await prisma.pedido.aggregate({
    _sum: { valorTotal: true },
    where: { statusPagamento: 'PAGO' },
  });

  return (
    <main className="container py-16">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-[2rem] bg-white p-8 shadow-soft">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Pedidos pagos</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{pedidosPagos}</p>
        </div>
        <div className="rounded-[2rem] bg-white p-8 shadow-soft">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Aguardando produção</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{aguardandoProducao}</p>
        </div>
        <div className="rounded-[2rem] bg-white p-8 shadow-soft">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Em produção</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{emProducao}</p>
        </div>
        <div className="rounded-[2rem] bg-white p-8 shadow-soft">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Prontos para retirada</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{prontos}</p>
        </div>
        <div className="rounded-[2rem] bg-white p-8 shadow-soft">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Entregues</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">{entregues}</p>
        </div>
        <div className="rounded-[2rem] bg-white p-8 shadow-soft">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Total vendido</p>
          <p className="mt-4 text-4xl font-semibold text-slate-900">R$ {Number(totalVendido._sum.valorTotal ?? 0).toFixed(2).replace('.', ',')}</p>
        </div>
      </div>
    </main>
  );
}
