import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { isValidAdminSession } from '@/lib/auth';

const updateProdutoSchema = z.object({
  nome: z.string().min(3),
  descricao: z.string().optional(),
  imagemUrl: z.union([z.string().url(), z.literal('')]).optional(),
  preco: z.number().positive(),
  unidade: z.string().trim().min(1).max(30),
  metaQuantidade: z.number().int().min(0),
  quantidadeArrecadada: z.number().int().min(0),
  disponivelVenda: z.boolean(),
  personalizado: z.boolean(),
  ativo: z.boolean(),
}).refine((data) => data.quantidadeArrecadada <= data.metaQuantidade, {
  message: 'A quantidade arrecadada não pode ser maior que a quantidade necessária',
  path: ['quantidadeArrecadada'],
});

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = request.cookies.get('ecri_admin_session')?.value;
  if (!isValidAdminSession(session)) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  const parseResult = updateProdutoSchema.safeParse(await request.json());
  if (!parseResult.success) {
    return NextResponse.json({ message: 'Dados inválidos do produto' }, { status: 400 });
  }

  const produtoId = Number(params.id);
  const produto = await prisma.produto.findUnique({ where: { id: produtoId } });
  if (!produto) {
    return NextResponse.json({ message: 'Produto não encontrado' }, { status: 404 });
  }

  const data = parseResult.data;
  const estoqueFinal = data.metaQuantidade - data.quantidadeArrecadada;
  const diferencaEstoque = estoqueFinal - produto.estoque;

  const updatedProduct = await prisma.$transaction(async (tx) => {
    const updated = await tx.produto.update({
      where: { id: produtoId },
      data: {
        nome: data.nome,
        descricao: data.descricao,
        imagemUrl: data.imagemUrl,
        preco: data.preco,
        unidade: data.unidade,
        estoque: estoqueFinal,
        metaQuantidade: data.metaQuantidade,
        quantidadeArrecadada: data.quantidadeArrecadada,
        disponivelVenda: data.disponivelVenda,
        personalizado: data.personalizado,
        ativo: data.ativo,
      },
    });

    if (diferencaEstoque !== 0 || data.quantidadeArrecadada !== produto.quantidadeArrecadada) {
      await tx.movimentacaoEstoque.create({
        data: {
          produtoId,
          tipo: 'AJUSTE',
          quantidade: diferencaEstoque,
          estoqueAnterior: produto.estoque,
          estoqueNovo: estoqueFinal,
          motivo: 'Meta e quantidade arrecadada atualizadas manualmente',
        },
      });
    }
    return updated;
  });

  return NextResponse.json({ produto: updatedProduct });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const session = request.cookies.get('ecri_admin_session')?.value;
  if (!isValidAdminSession(session)) {
    return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
  }

  const produtoId = Number(params.id);
  if (!Number.isInteger(produtoId) || produtoId <= 0) {
    return NextResponse.json({ message: 'Produto inválido.' }, { status: 400 });
  }

  const produto = await prisma.produto.findUnique({
    where: { id: produtoId },
    select: {
      id: true,
      nome: true,
      _count: { select: { pedidoItens: true, movimentacoes: true } },
    },
  });
  if (!produto) {
    return NextResponse.json({ message: 'Produto não encontrado.' }, { status: 404 });
  }

  const possuiHistorico = produto._count.pedidoItens > 0 || produto._count.movimentacoes > 0;
  if (possuiHistorico) {
    await prisma.produto.update({
      where: { id: produtoId },
      data: { ativo: false, disponivelVenda: false },
    });
    return NextResponse.json({ removido: true, modo: 'desativado' });
  }

  await prisma.$transaction(async (tx) => {
    await tx.cupomProduto.deleteMany({ where: { produtoId } });
    await tx.produtoVariacao.deleteMany({ where: { produtoId } });
    await tx.produto.delete({ where: { id: produtoId } });
  });
  return NextResponse.json({ removido: true, modo: 'excluido' });
}
