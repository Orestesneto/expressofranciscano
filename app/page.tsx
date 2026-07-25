import { prisma } from '@/lib/prisma';
import ProductCard from '@/components/product-card';

export const revalidate = 10;

async function getProdutos() {
  return prisma.produto.findMany({
    where: {
      ativo: true,
      disponivelVenda: true,
      estoque: { gt: 0 },
    },
    orderBy: { nome: 'asc' },
  });
}

export default async function HomePage() {
  const produtos = await getProdutos();

  return (
    <main className="container py-10">
      <div className="mb-10 rounded-[2rem] bg-slate-950 px-8 py-12 text-white shadow-soft">
        <h1 className="text-4xl font-semibold">ORESTES STORE</h1>
        <p className="mt-3 max-w-2xl text-base text-slate-200">
          Venda antecipada com pagamento via Pix e retirada presencial. Não é necessário login.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {produtos.map((produto) => (
          <ProductCard
            key={produto.id}
            id={produto.id}
            nome={produto.nome}
            descricao={produto.descricao ?? ''}
            preco={Number(produto.preco)}
            estoque={produto.estoque}
          />
        ))}
      </div>
    </main>
  );
}
