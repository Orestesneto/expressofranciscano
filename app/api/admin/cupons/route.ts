import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { isValidAdminSession } from '@/lib/auth';

const schema = z.object({ codigo: z.string().min(3).max(40).regex(/^[A-Z0-9_-]+$/), valor: z.number().positive(), tipo: z.enum(['TOTAL', 'ITEM', 'MINIMO']), valorMinimo: z.number().positive().nullable().optional(), limiteUsos: z.number().int().positive().max(100000), produtoIds: z.array(z.number().int().positive()).default([]) })
  .refine((data) => data.tipo !== 'MINIMO' || data.valorMinimo != null, { message: 'Informe o valor mínimo do pedido.' });

export async function POST(request: NextRequest) {
  if (!isValidAdminSession(request.cookies.get('ecri_admin_session')?.value)) return NextResponse.json({ message: 'Não autorizado.' }, { status: 401 });
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success || (parsed.data?.tipo === 'ITEM' && parsed.data.produtoIds.length === 0)) return NextResponse.json({ message: parsed.success ? 'Selecione ao menos um item.' : (parsed.error.issues[0]?.message ?? 'Preencha os dados do cupom.') }, { status: 400 });
  try {
    const cupom = await prisma.cupomDesconto.create({ data: { codigo: parsed.data.codigo, valor: parsed.data.valor, tipo: parsed.data.tipo, valorMinimo: parsed.data.tipo === 'MINIMO' ? parsed.data.valorMinimo : null, limiteUsos: parsed.data.limiteUsos, produtos: { create: parsed.data.produtoIds.map((produtoId) => ({ produtoId })) } } });
    return NextResponse.json({ cupom }, { status: 201 });
  } catch { return NextResponse.json({ message: 'Este código já existe ou contém um produto inválido.' }, { status: 409 }); }
}
