import { Heart, Users } from 'lucide-react';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

async function getColaboradores() {
  return prisma.pedido.findMany({
    where: { statusPagamento: 'PAGO' },
    include: { itens: { include: { produto: { select: { unidade: true } } } } },
    orderBy: { paidAt: 'desc' },
    take: 100,
  });
}

export default async function QuemAjudouPage() {
  const colaboradores = await getColaboradores();

  return (
    <main className="container py-12">
      <section className="rounded-[2rem] border border-orange-200 bg-white p-7 shadow-soft sm:p-10">
        <div className="mx-auto max-w-2xl text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-700">
            <Users size={29} aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-3xl font-black text-slate-950">Quem já nos ajudou</h1>
          <p className="mt-3 text-slate-600">Nossa gratidão a cada pessoa que está ajudando a completar as metas.</p>
        </div>

        {colaboradores.length === 0 ? (
          <div className="mt-10 rounded-3xl bg-orange-50 p-10 text-center">
            <Heart className="mx-auto text-orange-600" size={36} aria-hidden="true" />
            <p className="mt-4 font-semibold text-slate-700">As contribuições confirmadas aparecerão aqui.</p>
          </div>
        ) : (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {colaboradores.map((pedido) => {
              const nome = pedido.anonimo ? 'Anônimo' : pedido.nomeCliente;
              return (
                <article key={pedido.id} className="overflow-hidden rounded-3xl border border-orange-200 bg-orange-50 p-6 text-center shadow-sm">
                  {pedido.fotoPerfilUrl && !pedido.anonimo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`/api/doadores/${pedido.id}/perfil`} alt={`Foto de ${nome}`} className="mx-auto h-24 w-24 rounded-full border-4 border-white object-cover shadow-md" />
                  ) : (
                    <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-orange-200 text-3xl font-black text-orange-900 shadow-md">
                      {pedido.anonimo ? '?' : nome.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <h2 className="mt-4 text-xl font-bold text-slate-950">{nome}</h2>
                  <p className="mt-1 text-xs font-bold uppercase tracking-[0.15em] text-emerald-700">Contribuição confirmada</p>
                  <div className="mt-5 rounded-2xl bg-white p-4 text-left">
                    <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Itens doados</p>
                    <ul className="space-y-2">
                      {pedido.itens.map((item) => (
                        <li key={item.id} className="flex items-start justify-between gap-3 text-sm text-slate-700">
                          <span>{item.nomeProduto}</span>
                          <strong className="shrink-0 text-orange-800">{item.quantidade} {item.produto.unidade}</strong>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
