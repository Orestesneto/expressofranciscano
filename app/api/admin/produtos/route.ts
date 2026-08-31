import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { isValidAdminSession } from '@/lib/auth';

const produtoSchema = z.object({
  nome: z.string().min(3),
  categoria: z.enum(['Mantimentos', 'Proteína', 'Hortifruti', 'Material de limpeza', 'Descartáveis', 'Carnes']),
  descricao: z.string().optional(),
  imagemUrl: z.union([z.string().url(), z.literal('')]).optional(),
  preco: z.number().positive(),
  metaQuantidade: z.number().int().positive(),
  unidade: z.string().trim().min(1).max(30),
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
      categoria: {
        connectOrCreate: {
          where: { nome: parseResult.data.categoria },
          create: { nome: parseResult.data.categoria, ativa: true },
        },
      },
      nome: parseResult.data.nome,
      descricao: parseResult.data.descricao,
      imagemUrl: parseResult.data.imagemUrl,
      preco: parseResult.data.preco,
      estoque: parseResult.data.metaQuantidade,
      estoqueMinimo: 0,
      metaQuantidade: parseResult.data.metaQuantidade,
      quantidadeArrecadada: 0,
      unidade: parseResult.data.unidade,
      disponivelVenda: parseResult.data.disponivelVenda,
      personalizado: parseResult.data.personalizado,
      ativo: parseResult.data.ativo,
    },
  });

  return NextResponse.json({ produto });
}
