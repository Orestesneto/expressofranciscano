import type { Prisma } from '@prisma/client';

type Transaction = Prisma.TransactionClient;
type ContributionOrder = { id: number; codigo: string; itens: Array<{ produtoId: number; quantidade: number }> };

export async function addOrderToCollection(tx: Transaction, pedido: ContributionOrder, pagamentoId?: number) {
  for (const item of pedido.itens) {
    const atual = await tx.produto.findUnique({
      where: { id: item.produtoId },
      select: { estoque: true, metaQuantidade: true, quantidadeArrecadada: true, unidade: true },
    });
    if (!atual || atual.quantidadeArrecadada + item.quantidade > atual.metaQuantidade) {
      throw new Error(`A meta deste produto já foi atingida ou restam menos de ${item.quantidade} ${atual?.unidade ?? 'unidades'}.`);
    }

    const claimed = await tx.produto.updateMany({
      where: { id: item.produtoId, quantidadeArrecadada: atual.quantidadeArrecadada },
      data: { quantidadeArrecadada: { increment: item.quantidade }, estoque: { decrement: item.quantidade } },
    });
    if (claimed.count !== 1) throw new Error('Outra contribuição foi confirmada ao mesmo tempo. Tente novamente.');

    await tx.movimentacaoEstoque.create({
      data: {
        produtoId: item.produtoId,
        pedidoId: pedido.id,
        pagamentoId,
        tipo: 'ARRECADACAO',
        quantidade: item.quantidade,
        estoqueAnterior: atual.quantidadeArrecadada,
        estoqueNovo: atual.quantidadeArrecadada + item.quantidade,
        motivo: `Contribuição confirmada no pedido ${pedido.codigo}`,
      },
    });
  }
}
