import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { hashPassword, isValidAdminSession } from '@/lib/auth';

const schema = z.object({
  status: z.enum(['EM_PRODUCAO', 'PRONTO_PARA_RETIRADA', 'ENTREGUE']),
});

const transitions: Record<string, string> = {
  PEDIDO_RECEBIDO: 'EM_PRODUCAO',
  EM_PRODUCAO: 'PRONTO_PARA_RETIRADA',
  PRONTO_PARA_RETIRADA: 'ENTREGUE',
};

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = request.cookies.get('ecri_admin_session')?.value;
  if (!isValidAdminSession(session)) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: 'Situação inválida' }, { status: 400 });

  const pedido = await prisma.pedido.findUnique({ where: { id: Number(params.id) } });
  if (!pedido) return NextResponse.json({ message: 'Pedido não encontrado' }, { status: 404 });
  if (pedido.statusPagamento !== 'PAGO') {
    return NextResponse.json({ message: 'O pedido ainda não está pago.' }, { status: 400 });
  }
  if (transitions[pedido.statusProducao] !== parsed.data.status) {
    return NextResponse.json({ message: 'Esta mudança de situação não é permitida.' }, { status: 400 });
  }

  const adminEmail = (process.env.ADMIN_EMAIL ?? 'adm').trim();
  const administrador = await prisma.administrador.upsert({
    where: { email: adminEmail },
    create: {
      nome: 'Administrador',
      email: adminEmail,
      senhaHash: hashPassword('environment-managed'),
      perfil: 'ADMIN',
    },
    update: { ativo: true },
  });

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.pedido.update({
      where: { id: pedido.id },
      data: {
        statusProducao: parsed.data.status,
        deliveredAt: parsed.data.status === 'ENTREGUE' ? new Date() : undefined,
      },
    });
    await tx.historicoPedido.create({
      data: {
        pedidoId: pedido.id,
        administradorId: administrador.id,
        statusAnterior: pedido.statusProducao,
        statusNovo: parsed.data.status,
        descricao: `Situação alterada para ${parsed.data.status}`,
      },
    });
    return result;
  });

  return NextResponse.json({ pedido: updated });
}
