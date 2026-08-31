import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isValidAdminSession } from '@/lib/auth';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  if (!isValidAdminSession(request.cookies.get('ecri_admin_session')?.value)) return NextResponse.json({ message: 'Não autorizado.' }, { status: 401 });
  const { ativo } = await request.json();
  if (typeof ativo !== 'boolean') return NextResponse.json({ message: 'Dados inválidos.' }, { status: 400 });
  await prisma.cupomDesconto.update({ where: { id: Number(params.id) }, data: { ativo } });
  return NextResponse.json({ ok: true });
}
