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
    unidade: produto.unidade,
    metaQuantidade: produto.metaQuantidade,
    quantidadeArrecadada: produto.quantidadeArrecadada,
    disponivelVenda: produto.disponivelVenda,
    personalizado: produto.personalizado,
    ativo: produto.ativo,
  };

  return (
    <main className="container py-16">
      <div className="mx-auto max-w-3xl rounded-[2rem] bg-white p-8 shadow-soft sm:p-10">
        <h1 className="text-3xl font-semibold">Editar produto</h1>
        <div className="mt-8">
          <ProdutoEditar produto={produtoSerializado} />
        </div>
      </div>
    </main>
  );
}
