import CollectionPointManager from '@/app/admin/pontos-recolhimento/collection-point-manager';

export const dynamic = 'force-dynamic';

export default async function PontosRecolhimentoPublicPage() {
  return <CollectionPointManager pontos={[]} />;
}
