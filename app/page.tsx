import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/product-card';
import Image from 'next/image';

export const revalidate = 10;

const classificacoes = ['Mantimentos', 'Proteína', 'Hortifruti', 'Material de limpeza', 'Descartáveis', 'Carnes'] as const;

async function getProdutos() {
  return prisma.produto.findMany({
    where: {
      ativo: true,
      disponivelVenda: true,
    },
    orderBy: { nome: 'asc' },
    include: { categoria: true },
  });
}

export default async function HomePage() {
  const produtos = await getProdutos();
  const grupos = classificacoes
    .map((categoria) => ({
      categoria,
      produtos: produtos
        .filter((produto) => produto.categoria?.nome === categoria)
        .sort(
          (produtoA, produtoB) =>
            Number(produtoA.quantidadeArrecadada >= produtoA.metaQuantidade) -
            Number(produtoB.quantidadeArrecadada >= produtoB.metaQuantidade),
        ),
    }))
    .filter((grupo) => grupo.produtos.length > 0);

  return (
    <main className="container py-10">
      <div className="brand-hero relative mb-12 overflow-hidden rounded-[2rem] border-2 border-orange-200 px-5 pb-5 pt-12 shadow-soft sm:px-10 sm:pb-7 sm:pt-14">
        <span className="brand-tape absolute left-8 top-0 h-8 w-28 -translate-y-2 rotate-[-3deg]" aria-hidden="true" />
        <span className="brand-tape absolute bottom-1 right-10 h-7 w-24 rotate-3" aria-hidden="true" />
        <div className="relative grid items-center gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="brand-paper relative rotate-[-1deg] px-6 py-10 text-center shadow-xl sm:px-12">
            <p className="mx-auto mb-7 w-fit rotate-1 bg-slate-950 px-5 py-3 text-sm font-black uppercase tracking-[0.12em] text-white shadow-md sm:text-lg">
              <span className="text-orange-400">Compre</span> e doe para <span className="text-orange-400">o  mestre cuca</span>
            </p>
            <p className="text-5xl font-black leading-none text-orange-600 sm:text-7xl">VI</p>
            <h1 className="mt-2 font-black uppercase leading-[0.9] tracking-[-0.04em] text-slate-950">
              <span className="block text-5xl sm:text-7xl">Expresso</span>
              <span className="mt-3 block text-3xl tracking-[0.08em] text-orange-700 sm:text-5xl">Franciscano</span>
            </h1>
            <div className="mx-auto mt-5 h-1.5 w-4/5 -rotate-1 rounded-full bg-slate-800" />
            <p className="mt-6 font-semibold text-slate-700">Página voltada para arrecadação de doações em prol do  VI EXPRESSO FRANCISCANO </p>
            <p className="font-light text-slate-600">Paróquia São Francisco de Assis -Campina Grande- PB.</p>
          </div>
          <Image
            src="/logo-expresso-franciscano.png"
            alt="Expresso Franciscano — Paróquia São Francisco, Campina Grande"
            width={1569}
            height={1754}
            priority
            className="mx-auto h-auto w-full max-w-[330px] mix-blend-multiply"
          />
        </div>
      </div>

      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.25em] text-orange-700">O que precisamos?</p>
          <h2 className="mt-1 text-3xl font-black text-slate-950">Produtos por classificação</h2>
        </div>
        <span className="hidden h-1 flex-1 rounded-full bg-orange-200 sm:block" aria-hidden="true" />
      </div>
      {grupos.length === 0 ? (
        <div className="rounded-3xl border border-orange-200 bg-white p-10 text-center shadow-soft">
          <h3 className="text-xl font-bold text-slate-950">Nenhum produto cadastrado no momento</h3>
          <p className="mt-2 text-slate-600">Os produtos necessários aparecerão aqui, separados por classificação.</p>
        </div>
      ) : (
        <div className="space-y-12">
          <nav aria-label="Classificações disponíveis" className="flex flex-wrap gap-2">
            {grupos.map((grupo) => (
              <a key={grupo.categoria} href={`#${grupo.categoria.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="rounded-full bg-orange-100 px-4 py-2 text-sm font-bold text-orange-900 transition hover:bg-orange-200">
                {grupo.categoria} <span className="ml-1 text-orange-700">({grupo.produtos.length})</span>
              </a>
            ))}
          </nav>
          {grupos.map((grupo) => (
            <section key={grupo.categoria} id={grupo.categoria.toLowerCase().replace(/[^a-z0-9]+/g, '-')} className="scroll-mt-24">
              <div className="mb-5 flex items-center gap-4">
                <h3 className="text-2xl font-black text-slate-950">{grupo.categoria}</h3>
                <span className="h-1 flex-1 rounded-full bg-orange-200" aria-hidden="true" />
              </div>
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {grupo.produtos.map((produto) => (
                  <ProductCard
                    key={produto.id}
                    id={produto.id}
                    nome={produto.nome}
                    descricao={produto.descricao ?? ''}
                    preco={Number(produto.preco)}
                    metaQuantidade={produto.metaQuantidade}
                    quantidadeArrecadada={produto.quantidadeArrecadada}
                    unidade={produto.unidade}
                    categoria={grupo.categoria}
                    personalizado={produto.personalizado}
                    imagemUrl={produto.imagemUrl ?? undefined}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
