import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { isValidAdminSession } from '@/lib/auth';
import OrderStatusActions from '@/components/order-status-actions';
import { formatOrderCode } from '@/lib/order-code';

export const dynamic = 'force-dynamic';

const statusLabels: Record<string, string> = {
  PEDIDO_RECEBIDO: 'Aguardando produção',
  EM_PRODUCAO: 'Em produção',
  PRONTO_PARA_RETIRADA: 'Pronto para retirada',
  ENTREGUE: 'Entregue',
  CANCELADO: 'Cancelado',
  AGUARDANDO_ENTREGA: 'Aguardando entrega no ponto',
  ENTREGUE_NO_PONTO: 'Recebido no ponto',
};

export default async function AdminPedidosPage() {
  const session = cookies().get('ecri_admin_session')?.value;
  if (!isValidAdminSession(session)) redirect('/admin/login');

  const pedidos = await prisma.pedido.findMany({
    where: { statusPagamento: { in: ['PAGO', 'AGUARDANDO_ENTREGA'] } },
    include: { itens: true, imagens: true },
    orderBy: { paidAt: 'desc' },
  });

  return (
    <main className="container py-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-950">Contribuições</h1>
        <p className="mt-2 text-slate-600">Acompanhe pagamentos e confirme as entregas feitas no ponto de recebimento.</p>
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
                <div className="flex items-start gap-4">
                  {pedido.fotoPerfilUrl && !pedido.anonimo ? (
                    <img src={`/api/admin/pedidos/${pedido.id}/perfil`} alt={`Foto de ${pedido.nomeCliente}`} className="h-16 w-16 shrink-0 rounded-full border-2 border-orange-200 object-cover" />
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-orange-100 text-xl font-bold text-orange-800">{pedido.anonimo ? '?' : pedido.nomeCliente.charAt(0).toUpperCase()}</div>
                  )}
                  <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-950">Pedido {formatOrderCode(pedido.codigo)}</h2>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">{pedido.statusPagamento === 'PAGO' ? 'CONFIRMADA' : 'AGUARDANDO ENTREGA'}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      {statusLabels[pedido.statusProducao] ?? pedido.statusProducao}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2">
                    <p><span className="text-slate-500">Cliente:</span> <strong>{pedido.nomeCliente}</strong></p>
                    <p><span className="text-slate-500">Telefone:</span> <strong>{pedido.telefone || 'Não informado'}</strong></p>
                    <p><span className="text-slate-500">Forma:</span> <strong>{pedido.formaContribuicao === 'ENTREGA' ? 'Entrega no ponto' : pedido.formaContribuicao}</strong></p>
                    <p><span className="text-slate-500">Pago em:</span> <strong>{pedido.paidAt?.toLocaleString('pt-BR') || '-'}</strong></p>
                  </div>
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

              {pedido.observacaoCliente ? (
                <div className="mt-5 rounded-2xl border border-violet-200 bg-violet-50 p-4">
                  <h3 className="text-sm font-bold text-violet-950">Instruções do cliente</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-violet-900">
                    {pedido.observacaoCliente}
                  </p>
                </div>
              ) : null}

              {pedido.imagens.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-sm font-bold text-slate-950">Imagens para personalização</h3>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {pedido.imagens.map((imagem, index) => (
                      <a
                        key={imagem.id}
                        href={`/api/admin/imagens/${imagem.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="group block overflow-hidden rounded-xl border border-slate-200 bg-white"
                        title={`Abrir ${imagem.nomeArquivo}`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={`/api/admin/imagens/${imagem.id}`}
                          alt={`Personalização ${index + 1}`}
                          className="h-28 w-28 object-cover transition group-hover:scale-105"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

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
