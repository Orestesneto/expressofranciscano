import { get } from '@vercel/blob';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { isValidAdminSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { downloadDonorPhoto, isSupabaseObjectUrl } from '@/lib/supabase-storage';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  if (!isValidAdminSession(cookies().get('ecri_admin_session')?.value)) {
    return NextResponse.json({ message: 'Não autorizado.' }, { status: 401 });
  }
  const pedido = await prisma.pedido.findUnique({ where: { id: Number(params.id) }, select: { fotoPerfilUrl: true, fotoPerfilPathname: true, fotoPerfilContentType: true, fotoPerfilNome: true } });
  if (!pedido?.fotoPerfilUrl) return NextResponse.json({ message: 'Foto não encontrada.' }, { status: 404 });
  let stream: ReadableStream;
  if (isSupabaseObjectUrl(pedido.fotoPerfilUrl) && pedido.fotoPerfilPathname) {
    const arquivo = await downloadDonorPhoto(pedido.fotoPerfilPathname);
    if (!arquivo) return NextResponse.json({ message: 'Foto não encontrada.' }, { status: 404 });
    stream = arquivo.stream();
  } else {
    const arquivo = await get(pedido.fotoPerfilUrl, { access: 'private' });
    if (!arquivo || arquivo.statusCode !== 200 || !arquivo.stream) return NextResponse.json({ message: 'Foto não encontrada.' }, { status: 404 });
    stream = arquivo.stream;
  }
  return new Response(stream, {
    headers: {
      'Content-Type': pedido.fotoPerfilContentType ?? 'image/jpeg',
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(pedido.fotoPerfilNome ?? 'perfil.jpg')}`,
      'Cache-Control': 'private, max-age=300',
    },
  });
}
