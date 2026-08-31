import { cookies } from 'next/headers';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { isValidAdminSession } from '@/lib/auth';
import ProductList from './product-list';

async function getProdutos() {
  return prisma.produto.findMany({
    where: { ativo: true },
    orderBy: { nome: 'asc' },
    include: { categoria: true },
  });
}

export default async function AdminProdutosPage() {
  const cookieStore = cookies();
  const session = cookieStore.get('ecri_admin_session')?.value;
  if (!isValidAdminSession(session)) {
    return (
      <main className="container py-16">
        <div className="rounded-[2rem] bg-white p-10 shadow-soft text-center">
          <h1 className="text-3xl font-semibold">Acesso não autorizado</h1>
          <p className="mt-3 text-slate-600">Faça login em /admin/login para continuar.</p>
        </div>
      </main>
    );
  }

  const produtos = await getProdutos();
  return (
    <main className="container py-16">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Produtos</h1>
          <p className="mt-2 text-slate-600">Gerencie metas, unidades de medida e o progresso da arrecadação.</p>
        </div>
        <Link href="/admin/produtos/novo" className="rounded-3xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700">
          Cadastrar novo produto
        </Link>
      </div>

      <ProductList produtos={produtos.map((produto) => ({
        id: produto.id,
        nome: produto.nome,
        categoria: produto.categoria?.nome ?? 'Sem classificação',
        preco: Number(produto.preco),
        quantidadeArrecadada: produto.quantidadeArrecadada,
        metaQuantidade: produto.metaQuantidade,
        unidade: produto.unidade,
        disponivelVenda: produto.disponivelVenda,
        ativo: produto.ativo,
      }))} />
    </main>
  );
}
