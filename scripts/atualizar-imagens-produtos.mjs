import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'node:fs';

const prisma = new PrismaClient();
const termosEspecificos = {
  'AMIDO DE MILHO - GRD': 'corn starch package',
  'ARROZ PARBOILIZADO': 'parboiled rice grains',
  'BATATA PALHA': 'batata palha potato sticks',
  'BOLACHA CREAM CRACKER': 'cream cracker biscuits',
  'CALDO DE GALINHA - GRD': 'chicken bouillon cubes',
  'CARNE DE CHARQUE': 'carne seca charque',
  'COLORAU': 'annatto powder urucum',
  'COSTELA SECA': 'salted beef ribs',
  'CREME DE CEBOLA': 'onion soup powder',
  'CUSCUZ (FLOCÃO)': 'corn flakes couscous farinha milho flocada',
  'FEIJÃO SEMPRE VERDE': 'green cowpea beans',
  'FOLHAS DE LOURO': 'bay leaves spice',
  'LEITE DE GADO': 'cow milk bottle',
  'MANTEIGA DE GARRAFA': 'manteiga de garrafa clarified butter',
  'MILHO VERDE': 'canned sweet corn',
  'MOLHO SHOYO': 'soy sauce bottle',
  'PIMENTA DO REINO': 'black pepper spice',
  'POLPA': 'frozen fruit pulp',
  'QUEIJO MUSSARELA': 'mozzarella cheese block',
  'QUEIJO RALADO': 'grated parmesan cheese',
  'GARRAFÃO DE ÁGUA 20 LT': 'water cooler bottle 20 litre',
  'GÁS DE COZINHA': 'cooking gas cylinder',
  'ÁGUA SANITÁRIA': 'bleach cleaning bottle',
  'ÁLCOOL 70%': 'rubbing alcohol 70 bottle',
  'ATOL': 'cleaning product bottle',
  'BOBINA PLÁSTICA': 'plastic film roll food',
  'BOMBRIL': 'steel wool cleaning',
  'BUCHAS DE PRATO': 'dishwashing sponge',
  'COPOS 180 ML': 'disposable plastic cups',
  'FACAS': 'disposable plastic knives',
  'GUARDANAPO': 'paper napkins',
  'LUVAS DESCARTÁVEIS': 'disposable gloves box',
  'PALITOS DE DENTE': 'toothpicks box',
  'PANO PERFLEX': 'cleaning cloth roll',
  'PANOS DE CHÃO': 'floor cleaning cloth',
  'PANOS DE PIA': 'kitchen cleaning cloth',
  'PANOS DE PRATO': 'dish towels',
  'PAPEL ALUMÍNIO': 'aluminium foil roll',
  'PAPEL FILME 100 MT': 'plastic cling film roll',
  'PAPEL TOALHA': 'paper towel rolls',
  'POLIDOR DE ALUMÍNIO': 'aluminium polish bottle',
  'SACO DE LIXO 200 LT': 'large black garbage bags',
  'SACO DE LIXO 50 LT': 'black garbage bags roll',
  'TOUCAS DESCARTÁVEIS': 'disposable hair nets',
  'VEJA MULTIUSO': 'all purpose cleaner spray bottle',
};

function termo(produto) {
  return termosEspecificos[produto.nome] ?? `${produto.nome.toLocaleLowerCase('pt-BR')} ${produto.categoria?.nome ?? ''}`;
}

function urlDaImagem(produto) {
  const tags = termo(produto)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ',')
    .replace(/^,+|,+$/g, '')
    .toLowerCase();
  return `https://loremflickr.com/800/600/${tags}?lock=${produto.id}`;
}

try {
  const cadastroFonte = readFileSync(new URL('./cadastrar-lista-produtos.mjs', import.meta.url), 'utf8');
  const nomesDaLista = [...cadastroFonte.matchAll(/^\s*\['([^']+)',\s*\d+,\s*'[^']+',\s*'[^']+'\],$/gm)].map((item) => item[1]);
  const produtos = await prisma.produto.findMany({
    where: { ativo: true, nome: { in: nomesDaLista } },
    include: { categoria: true },
    orderBy: { nome: 'asc' },
  });
  let atualizados = 0;
  const falhas = [];

  for (const produto of produtos) {
    try {
      const imagemUrl = urlDaImagem(produto);
      await prisma.produto.update({ where: { id: produto.id }, data: { imagemUrl } });
      atualizados += 1;
      console.log(`${atualizados}/${produtos.length} ${produto.nome}`);
    } catch (error) {
      falhas.push(produto.nome);
      console.error(`Falha em ${produto.nome}: ${error.message}`);
    }
  }

  console.log(JSON.stringify({ total: produtos.length, atualizados, falhas }, null, 2));
  if (falhas.length > 0) process.exitCode = 2;
} finally {
  await prisma.$disconnect();
}
