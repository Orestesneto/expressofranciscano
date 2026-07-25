import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const schema = z.object({
  telefone: z.string().transform((value) => value.replace(/\D/g, '')).pipe(z.string().min(8).max(15)),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: 'Informe um telefone válido.' }, { status: 400 });
  }

  const pedidos = await prisma.pedido.findMany({
    where: { telefoneNormalizado: parsed.data.telefone },
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
      equipe: pedido.equipeNome,
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
