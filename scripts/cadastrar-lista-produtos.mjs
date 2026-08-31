import { PrismaClient } from '@prisma/client';

const produtos = [
  ['AÇÚCAR', 12, 'kg', 'Mantimentos'],
  ['AMIDO DE MILHO - GRD', 2, 'caixas', 'Mantimentos'],
  ['ARROZ PARBOILIZADO', 30, 'kg', 'Mantimentos'],
  ['AZEITE', 1, 'litro', 'Mantimentos'],
  ['BACON', 2, 'kg', 'Proteína'],
  ['BATATA PALHA', 5, 'pacotes grandes', 'Mantimentos'],
  ['BOLACHA CREAM CRACKER', 20, 'pacotes', 'Mantimentos'],
  ['CAFÉ', 10, 'pacotes', 'Mantimentos'],
  ['CALDO DE GALINHA - GRD', 5, 'caixas', 'Mantimentos'],
  ['CARNE DE CHARQUE', 10, 'kg', 'Proteína'],
  ['CARNE MOÍDA', 4, 'kg', 'Proteína'],
  ['COLORAU', 1, 'kg', 'Mantimentos'],
  ['COMINHO', 200, 'g', 'Mantimentos'],
  ['COSTELA SECA', 3, 'kg', 'Proteína'],
  ['CREME DE CEBOLA', 6, 'sachês', 'Mantimentos'],
  ['CREME DE LEITE', 6, 'kg', 'Mantimentos'],
  ['CUSCUZ (FLOCÃO)', 30, 'kg', 'Mantimentos'],
  ['FARINHA DE TRIGO', 4, 'kg', 'Mantimentos'],
  ['FEIJÃO CARIOCA', 15, 'kg', 'Mantimentos'],
  ['FEIJÃO SEMPRE VERDE', 10, 'kg', 'Mantimentos'],
  ['FILÉ DE FRANGO', 100, 'kg', 'Proteína'],
  ['FOLHAS DE LOURO', 2, 'pacotes', 'Mantimentos'],
  ['IOGURTE', 12, 'litros', 'Mantimentos'],
  ['LEITE DE GADO', 36, 'litros', 'Mantimentos'],
  ['LINGUIÇA CALABRESA', 5, 'kg', 'Proteína'],
  ['MACARRÃO', 15, 'unidades', 'Mantimentos'],
  ['MAIONESE', 8, 'kg', 'Mantimentos'],
  ['MANTEIGA DE GARRAFA', 4, 'unidades', 'Mantimentos'],
  ['MARGARINA', 6, 'kg', 'Mantimentos'],
  ['MILHO VERDE', 1, 'litro', 'Mantimentos'],
  ['MOLHO SHOYO', 1, 'litro', 'Mantimentos'],
  ['ÓLEO', 12, 'unidades', 'Mantimentos'],
  ['ORÉGANO', 200, 'g', 'Mantimentos'],
  ['OVOS', 120, 'unidades', 'Proteína'],
  ['PÃO', 300, 'unidades', 'Mantimentos'],
  ['PIMENTA DO REINO', 100, 'g', 'Mantimentos'],
  ['POLPA', 30, 'kg', 'Mantimentos'],
  ['PRESUNTO', 1, 'peça', 'Proteína'],
  ['QUEIJO MUSSARELA', 1, 'peça', 'Proteína'],
  ['QUEIJO RALADO', 1, 'kg', 'Mantimentos'],
  ['REFRIGERANTE', 1, 'unidade', 'Mantimentos'],
  ['REQUEIJÃO', 2, 'kg', 'Mantimentos'],
  ['SAL', 4, 'kg', 'Mantimentos'],
  ['SALSICHA', 10, 'kg', 'Proteína'],
  ['VINAGRE', 5, 'litros', 'Mantimentos'],
  ['ABACAXI', 15, 'unidades', 'Hortifruti'],
  ['ALFACE', 25, 'molhos', 'Hortifruti'],
  ['ALHO', 2, 'kg', 'Hortifruti'],
  ['BANANA', 200, 'unidades', 'Hortifruti'],
  ['BATATA INGLESA', 60, 'kg', 'Hortifruti'],
  ['CEBOLA', 15, 'kg', 'Hortifruti'],
  ['CEBOLINHA', 5, 'molhos', 'Hortifruti'],
  ['CENOURA', 35, 'kg', 'Hortifruti'],
  ['COENTRO', 5, 'molhos', 'Hortifruti'],
  ['LIMÃO', 2, 'kg', 'Hortifruti'],
  ['MAMÃO', 15, 'unidades', 'Hortifruti'],
  ['MANGA', 10, 'unidades', 'Hortifruti'],
  ['MELANCIA', 6, 'unidades', 'Hortifruti'],
  ['SALSA', 3, 'molhos', 'Hortifruti'],
  ['TOMATE', 1, 'caixa', 'Hortifruti'],
  ['ÁGUA SANITÁRIA', 6, 'litros', 'Material de limpeza'],
  ['ÁLCOOL 70%', 1, 'litro', 'Material de limpeza'],
  ['ATOL', 2, 'unidades', 'Material de limpeza'],
  ['BOBINA PLÁSTICA', 1, 'unidade', 'Descartáveis'],
  ['BOMBRIL', 4, 'pacotes', 'Material de limpeza'],
  ['BUCHAS DE PRATO', 10, 'unidades', 'Material de limpeza'],
  ['COPOS 180 ML', 12, 'pacotes', 'Descartáveis'],
  ['DESINFETANTE', 4, 'litros', 'Material de limpeza'],
  ['DETERGENTE', 6, 'litros', 'Material de limpeza'],
  ['FACAS', 1, 'unidade', 'Descartáveis'],
  ['GARRAFÃO DE ÁGUA 20 LT', 5, 'unidades', 'Mantimentos'],
  ['GÁS DE COZINHA', 3, 'botijões', 'Mantimentos'],
  ['GUARDANAPO', 20, 'unidades', 'Descartáveis'],
  ['LUVAS DESCARTÁVEIS', 1, 'caixa', 'Descartáveis'],
  ['PALITOS DE DENTE', 6, 'caixas', 'Descartáveis'],
  ['PANO PERFLEX', 2, 'pacotes', 'Material de limpeza'],
  ['PANOS DE CHÃO', 10, 'unidades', 'Material de limpeza'],
  ['PANOS DE PIA', 6, 'pacotes', 'Material de limpeza'],
  ['PANOS DE PRATO', 24, 'unidades', 'Material de limpeza'],
  ['PAPEL ALUMÍNIO', 2, 'rolos', 'Descartáveis'],
  ['PAPEL FILME 100 MT', 1, 'unidade', 'Descartáveis'],
  ['PAPEL TOALHA', 3, 'pacotes', 'Descartáveis'],
  ['POLIDOR DE ALUMÍNIO', 3, 'unidades', 'Material de limpeza'],
  ['SACO DE LIXO 200 LT', 2, 'kg', 'Material de limpeza'],
  ['SACO DE LIXO 50 LT', 1, 'pacote', 'Material de limpeza'],
  ['TOUCAS DESCARTÁVEIS', 1, 'caixa', 'Descartáveis'],
  ['VEJA MULTIUSO', 2, 'unidades', 'Material de limpeza'],
];

const prisma = new PrismaClient();

try {
  const categorias = new Map();
  for (const nome of [...new Set(produtos.map((item) => item[3]))]) {
    const categoria = await prisma.categoria.upsert({
      where: { nome },
      update: { ativa: true },
      create: { nome, ativa: true },
    });
    categorias.set(nome, categoria.id);
  }

  const existentes = await prisma.produto.findMany({ select: { id: true, nome: true } });
  const porNome = new Map(existentes.map((produto) => [produto.nome.trim().toLocaleUpperCase('pt-BR'), produto]));
  let criados = 0;
  let atualizados = 0;

  for (const [nome, metaQuantidade, unidade, classificacao] of produtos) {
    const existente = porNome.get(nome.toLocaleUpperCase('pt-BR'));
    const data = {
      nome,
      categoriaId: categorias.get(classificacao),
      preco: 0.01,
      metaQuantidade,
      unidade,
      disponivelVenda: true,
      personalizado: false,
      ativo: true,
    };
    if (existente) {
      await prisma.produto.update({ where: { id: existente.id }, data });
      atualizados += 1;
    } else {
      await prisma.produto.create({ data: { ...data, estoque: metaQuantidade, estoqueMinimo: 0, quantidadeArrecadada: 0 } });
      criados += 1;
    }
  }

  console.log(JSON.stringify({ total: produtos.length, criados, atualizados }));
} finally {
  await prisma.$disconnect();
}
