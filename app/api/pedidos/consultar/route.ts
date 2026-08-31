import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { normalizeBrazilianPhone } from '@/lib/phone';

const schema = z.object({
  telefone: z.string().transform((value, ctx) => {
    const telefone = normalizeBrazilianPhone(value);
    if (!telefone) {
      ctx.addIssue({ code: 'custom', message: 'Informe um telefone válido com 11 dígitos.' });
      return z.NEVER;
    }
    return telefone;
  }),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: 'Informe um telefone válido.' }, { status: 400 });
  }

  const pedidos = await prisma.pedido.findMany({
    where: {
      telefoneNormalizado: parsed.data.telefone,
      statusPagamento: 'PAGO',
    },
    include: {
      itens: {
        select: {
          id: true,
          nomeProduto: true,
          quantidade: true,
          valorUnitario: true,
          subtotal: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json({
    pedidos: pedidos.map((pedido) => ({
      codigo: pedido.codigo,
      nomeCliente: pedido.nomeCliente,
      valorTotal: Number(pedido.valorTotal),
      statusPagamento: pedido.statusPagamento,
      statusProducao: pedido.statusProducao,
      createdAt: pedido.createdAt,
      paidAt: pedido.paidAt,
      deliveredAt: pedido.deliveredAt,
      itens: pedido.itens.map((item) => ({
        ...item,
        valorUnitario: Number(item.valorUnitario),
        subtotal: Number(item.subtotal),
      })),
    })),
  });
}
