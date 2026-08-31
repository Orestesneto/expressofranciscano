import { get } from '@vercel/blob';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { downloadDonorPhoto, isSupabaseObjectUrl } from '@/lib/supabase-storage';

export const dynamic = 'force-dynamic';

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ message: 'Foto inválida.' }, { status: 400 });

  const pedido = await prisma.pedido.findFirst({
    where: { id, statusPagamento: 'PAGO', anonimo: false },
    select: { fotoPerfilUrl: true, fotoPerfilPathname: true, fotoPerfilContentType: true },
  });
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
      'Cache-Control': 'public, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
