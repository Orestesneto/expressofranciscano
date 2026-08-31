import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { isValidAdminSession } from '@/lib/auth';
import ProdutoEditar from './editar';

interface Params {
  params: { id: string };
}

async function getProduto(id: number) {
  return prisma.produto.findUnique({ where: { id } });
}

export default async function ProdutoDetalhePage({ params }: Params) {
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

  const produto = await getProduto(Number(params.id));
  if (!produto) {
    return (
      <main className="container py-16">
        <div className="rounded-[2rem] bg-white p-10 shadow-soft text-center">
          <h1 className="text-3xl font-semibold">Produto não encontrado</h1>
        </div>
      </main>
    );
  }

  const produtoSerializado = {
    id: produto.id,
    nome: produto.nome,
    descricao: produto.descricao ?? '',
    imagemUrl: produto.imagemUrl ?? '',
    preco: Number(produto.preco),
    estoque: produto.estoque,
    estoqueMinimo: produto.estoqueMinimo,
    disponivelVenda: produto.disponivelVenda,
    personalizado: produto.personalizado,
    ativo: produto.ativo,
  };

  return (
    <main className="container py-16">
      <div className="mx-auto max-w-5xl rounded-[2rem] bg-white p-10 shadow-soft">
        <h1 className="text-3xl font-semibold">Editar produto</h1>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px]">
          <div>
            <ProdutoEditar produto={produtoSerializado} />
          </div>
          <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-6">
            <div className="space-y-5">
              <div>
                <p className="text-sm text-slate-600">Itens necessários</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{produto.metaQuantidade} {produto.unidade}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Disponibilidade</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">
                  {produto.ativo && produto.disponivelVenda && produto.estoque > 0 ? 'Disponível' : 'Esgotado / indisponível'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Estoque mínimo</p>
                <p className="mt-2 text-xl font-semibold text-slate-900">{produto.estoqueMinimo}</p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
