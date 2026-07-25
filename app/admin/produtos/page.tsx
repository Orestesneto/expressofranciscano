import { cookies } from 'next/headers';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { isValidAdminSession } from '@/lib/auth';

const ITEMS_PER_PAGE = 50;

async function getProdutos() {
  return prisma.produto.findMany({
    orderBy: { nome: 'asc' },
    take: ITEMS_PER_PAGE,
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
  const produtosComAlerta = produtos.filter((produto) => produto.estoque <= produto.estoqueMinimo);

  return (
    <main className="container py-16">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Produtos</h1>
          <p className="mt-2 text-slate-600">Gerencie estoque, disponibilidade e informações do produto.</p>
        </div>
        <Link href="/admin/produtos/novo" className="rounded-3xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-700">
          Cadastrar novo produto
        </Link>
      </div>

      {produtosComAlerta.length > 0 ? (
        <div className="mb-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <p className="font-semibold">Atenção ao estoque</p>
          <p className="mt-1 text-sm">
            {produtosComAlerta.length} {produtosComAlerta.length === 1 ? 'produto atingiu' : 'produtos atingiram'} o estoque mínimo.
          </p>
        </div>
      ) : null}

      <div className="space-y-4">
        {produtos.map((produto) => (
          <div key={produto.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-soft">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold">{produto.nome}</h2>
                <p className="mt-1 text-sm text-slate-600">{produto.descricao ?? 'Sem descrição'}</p>
              </div>
              <div className="grid gap-2 text-sm text-slate-700 md:text-right">
                <span>Preço: R$ {Number(produto.preco).toFixed(2).replace('.', ',')}</span>
                <span>Estoque: {produto.estoque}</span>
                <span>Disponível: {produto.disponivelVenda ? 'Sim' : 'Não'}</span>
                <span>Status: {produto.ativo ? 'Ativo' : 'Inativo'}</span>
                {produto.estoque === 0 ? <span className="text-red-600">Esgotado</span> : null}
                {produto.estoque > 0 && produto.estoque <= produto.estoqueMinimo ? (
                  <span className="font-semibold text-amber-700">Estoque baixo</span>
                ) : null}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link href={`/admin/produtos/${produto.id}`} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">
                Editar
              </Link>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
