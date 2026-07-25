import { get } from '@vercel/blob';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isValidAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = cookies().get('ecri_admin_session')?.value;
  if (!isValidAdminSession(session)) {
    return NextResponse.json({ message: 'Não autorizado.' }, { status: 401 });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ message: 'Imagem inválida.' }, { status: 400 });
  }

  const imagem = await prisma.pedidoImagem.findUnique({ where: { id } });
  if (!imagem) {
    return NextResponse.json({ message: 'Imagem não encontrada.' }, { status: 404 });
  }

  const arquivo = await get(imagem.url, { access: 'private' });
  if (!arquivo || arquivo.statusCode !== 200 || !arquivo.stream) {
    return NextResponse.json({ message: 'Arquivo não encontrado.' }, { status: 404 });
  }

  return new Response(arquivo.stream, {
    headers: {
      'Content-Type': imagem.contentType,
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(imagem.nomeArquivo)}`,
      'Cache-Control': 'private, max-age=300',
    },
  });
}
