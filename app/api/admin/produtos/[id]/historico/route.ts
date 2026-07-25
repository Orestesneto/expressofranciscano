import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidAdminSession } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const session = request.cookies.get('ecri_admin_session')?.value;
  if (!isValidAdminSession(session)) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  const produtoId = Number(params.id);
  const movimentacoes = await prisma.movimentacaoEstoque.findMany({
    where: { produtoId },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ movimentacoes });
}
