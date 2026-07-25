import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { isValidAdminSession } from '@/lib/auth';

const produtoSchema = z.object({
  nome: z.string().min(3),
  descricao: z.string().optional(),
  imagemUrl: z.union([z.string().url(), z.literal('')]).optional(),
  preco: z.number().positive(),
  estoque: z.number().int().min(0),
  estoqueMinimo: z.number().int().min(0),
  disponivelVenda: z.boolean(),
  personalizado: z.boolean(),
  ativo: z.boolean(),
});

export async function POST(request: NextRequest) {
  const session = request.cookies.get('ecri_admin_session')?.value;
  if (!isValidAdminSession(session)) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const parseResult = produtoSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json({ message: 'Dados inválidos do produto' }, { status: 400 });
  }

  const produto = await prisma.produto.create({
    data: {
      nome: parseResult.data.nome,
      descricao: parseResult.data.descricao,
      imagemUrl: parseResult.data.imagemUrl,
      preco: parseResult.data.preco,
      estoque: parseResult.data.estoque,
      estoqueMinimo: parseResult.data.estoqueMinimo,
      disponivelVenda: parseResult.data.disponivelVenda,
      personalizado: parseResult.data.personalizado,
      ativo: parseResult.data.ativo,
    },
  });

  if (produto.estoque > 0) {
    await prisma.movimentacaoEstoque.create({
      data: {
        produtoId: produto.id,
        tipo: 'ENTRADA',
        quantidade: produto.estoque,
        estoqueAnterior: 0,
        estoqueNovo: produto.estoque,
        motivo: 'Cadastro inicial de estoque',
      },
    });
  }

  return NextResponse.json({ produto });
}
