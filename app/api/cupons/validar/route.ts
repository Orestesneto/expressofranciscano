import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { calculateCouponDiscount } from '@/lib/coupons';

const schema = z.object({ codigo: z.string().min(1), items: z.array(z.object({ productId: z.number().int().positive(), quantidade: z.number().int().positive() })) });

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: 'Cupom inválido.' }, { status: 400 });
  const codigo = parsed.data.codigo.trim().toUpperCase();
  const cupom = await prisma.cupomDesconto.findFirst({ where: { codigo, ativo: true }, include: { produtos: true } });
  if (cupom && cupom.usosRealizados >= cupom.limiteUsos) return NextResponse.json({ message: 'Este cupom atingiu o limite de usos.' }, { status: 404 });
  if (!cupom) return NextResponse.json({ message: 'Cupom inexistente, inativo ou já utilizado.' }, { status: 404 });
  const produtos = await prisma.produto.findMany({ where: { id: { in: parsed.data.items.map((item) => item.productId) } }, select: { id: true, preco: true } });
  const items = parsed.data.items.flatMap((item) => { const produto = produtos.find((p) => p.id === item.productId); return produto ? [{ produtoId: produto.id, quantidade: item.quantidade, valorUnitario: Number(produto.preco) }] : []; });
  const desconto = calculateCouponDiscount(cupom, items);
  if (desconto <= 0) return NextResponse.json({ message: 'Este cupom não se aplica aos itens do carrinho.' }, { status: 400 });
  return NextResponse.json({ codigo, desconto, tipo: cupom.tipo, valorMinimo: cupom.valorMinimo == null ? null : Number(cupom.valorMinimo) });
}
