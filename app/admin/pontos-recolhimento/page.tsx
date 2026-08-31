import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import CollectionPointManager from './collection-point-manager';

export const dynamic = 'force-dynamic';

export default async function PontosRecolhimentoAdminPage() {
  const session = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidAdminSession(session)) redirect('/admin/login');

  const pontos = await prisma.pontoRecolhimento.findMany({ orderBy: { createdAt: 'desc' } });
  return <CollectionPointManager mostrarPontos pontos={pontos.map((ponto) => ({
    id: ponto.id,
    nome: ponto.nome,
    whatsapp: ponto.whatsapp,
    endereco: ponto.endereco,
    bairro: ponto.bairro,
    autorizado: ponto.autorizado,
    disponibilidadeBusca: ponto.disponibilidadeBusca,
    temFoto: Boolean(ponto.fotoPerfilUrl),
    createdAt: ponto.createdAt.toISOString(),
  }))} />;
}
