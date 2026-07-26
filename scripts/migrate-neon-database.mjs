import { PrismaClient } from '@prisma/client';

const sourceUrl = process.env.SOURCE_DATABASE_URL;
const targetUrl = process.env.TARGET_DATABASE_URL;

if (!sourceUrl || !targetUrl) {
  throw new Error('SOURCE_DATABASE_URL e TARGET_DATABASE_URL são obrigatórias.');
}

if (sourceUrl === targetUrl) {
  throw new Error('Origem e destino não podem ser o mesmo banco.');
}

const source = new PrismaClient({ datasources: { db: { url: sourceUrl } } });
const target = new PrismaClient({ datasources: { db: { url: targetUrl } } });

const models = [
  'administrador',
  'equipe',
  'categoria',
  'produto',
  'produtoVariacao',
  'pedido',
  'pedidoImagem',
  'pedidoItem',
  'pagamento',
  'historicoPedido',
  'movimentacaoEstoque',
];

async function counts(client) {
  return Object.fromEntries(
    await Promise.all(models.map(async (model) => [model, await client[model].count()])),
  );
}

try {
  const sourceCounts = await counts(source);
  const targetCounts = await counts(target);
  const targetRows = Object.values(targetCounts).reduce((sum, count) => sum + count, 0);

  console.log('Origem:', sourceCounts);
  console.log('Destino antes:', targetCounts);

  if (targetRows > 0) {
    throw new Error('O banco de destino já contém dados. Migração interrompida sem alterações.');
  }

  const data = {
    administrador: await source.administrador.findMany(),
    equipe: await source.equipe.findMany(),
    categoria: await source.categoria.findMany(),
    produto: await source.produto.findMany(),
    produtoVariacao: await source.produtoVariacao.findMany(),
    pedido: await source.pedido.findMany(),
    pedidoImagem: await source.pedidoImagem.findMany(),
    pedidoItem: await source.pedidoItem.findMany(),
    pagamento: await source.pagamento.findMany(),
    historicoPedido: await source.historicoPedido.findMany(),
    movimentacaoEstoque: await source.movimentacaoEstoque.findMany(),
  };

  await target.$transaction(async (tx) => {
    for (const model of models) {
      if (data[model].length > 0) {
        await tx[model].createMany({ data: data[model] });
      }
    }

    const tables = [
      'Administrador',
      'Equipe',
      'Categoria',
      'Produto',
      'ProdutoVariacao',
      'Pedido',
      'PedidoImagem',
      'PedidoItem',
      'Pagamento',
      'HistoricoPedido',
      'MovimentacaoEstoque',
    ];
    for (const table of tables) {
      await tx.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE(MAX("id"), 1), MAX("id") IS NOT NULL) FROM "${table}"`,
      );
    }
  }, { timeout: 120000 });

  const finalCounts = await counts(target);
  console.log('Destino depois:', finalCounts);

  for (const model of models) {
    if (sourceCounts[model] !== finalCounts[model]) {
      throw new Error(`Divergência na tabela ${model}.`);
    }
  }

  console.log('MIGRACAO_CONFIRMADA');
} finally {
  await source.$disconnect();
  await target.$disconnect();
}
