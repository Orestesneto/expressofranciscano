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
  estoque: z.number().int().min(0),
  estoqueMinimo: z.number().int().min(0),
  disponivelVenda: z.boolean(),
  personalizado: z.boolean(),
  ativo: z.boolean(),
  ajusteQuantidade: z.number().int().optional(),
  ajusteMotivo: z.string().optional(),
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
  let estoqueFinal = data.estoque;
  const ajustes: Array<{ tipo: string; quantidade: number; motivo: string }> = [];

  if (typeof data.ajusteQuantidade === 'number' && data.ajusteQuantidade !== 0) {
    estoqueFinal = produto.estoque + data.ajusteQuantidade;
    ajustes.push({
      tipo: 'AJUSTE',
      quantidade: data.ajusteQuantidade,
      motivo: data.ajusteMotivo ?? 'Ajuste manual de estoque',
    });
  } else if (data.estoque !== produto.estoque) {
    ajustes.push({
      tipo: 'AJUSTE',
      quantidade: data.estoque - produto.estoque,
      motivo: data.ajusteMotivo ?? 'Correção de inventário',
    });
  }

  if (estoqueFinal < 0) {
    return NextResponse.json({ message: 'O ajuste não pode deixar o estoque negativo.' }, { status: 400 });
  }

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
        metaQuantidade: estoqueFinal,
        estoqueMinimo: data.estoqueMinimo,
        disponivelVenda: data.disponivelVenda,
        personalizado: data.personalizado,
        ativo: data.ativo,
      },
    });

    if (ajustes.length > 0) {
      await tx.movimentacaoEstoque.create({
        data: {
          produtoId,
          tipo: ajustes[0].quantidade > 0 ? 'ENTRADA' : 'AJUSTE',
          quantidade: ajustes[0].quantidade,
          estoqueAnterior: produto.estoque,
          estoqueNovo: estoqueFinal,
          motivo: ajustes[0].motivo,
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
