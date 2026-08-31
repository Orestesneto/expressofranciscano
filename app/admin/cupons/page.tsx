import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from '@/lib/auth';
import CouponManager from './coupon-manager';

export default async function CuponsPage() {
  const session = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidAdminSession(session)) {
    return <main className="container py-16 text-center">Acesso não autorizado.</main>;
  }

  const [produtos, cupons] = await Promise.all([
    prisma.produto.findMany({
      where: { ativo: true, disponivelVenda: true },
      select: { id: true, nome: true, preco: true, estoque: true },
      orderBy: { nome: 'asc' },
    }),
    prisma.cupomDesconto.findMany({
      include: {
        produtos: { include: { produto: { select: { nome: true } } } },
        pedidos: {
          select: { codigo: true, nomeCliente: true, sobrenomeCliente: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return (
    <CouponManager
      produtos={produtos.map((produto) => ({ ...produto, preco: Number(produto.preco) }))}
      cupons={cupons.map((cupom) => ({
        id: cupom.id,
        codigo: cupom.codigo,
        valor: Number(cupom.valor),
        tipo: cupom.tipo,
        ativo: cupom.ativo,
        valorMinimo: cupom.valorMinimo == null ? null : Number(cupom.valorMinimo),
        limiteUsos: cupom.limiteUsos,
        usosRealizados: cupom.usosRealizados,
        produtos: cupom.produtos.map((item) => item.produto.nome),
        pedidos: cupom.pedidos.map((pedido) => ({
          codigo: pedido.codigo,
          cliente: `${pedido.nomeCliente} ${pedido.sobrenomeCliente}`.trim(),
          utilizadoEm: pedido.createdAt.toISOString(),
        })),
      }))}
    />
  );
}
