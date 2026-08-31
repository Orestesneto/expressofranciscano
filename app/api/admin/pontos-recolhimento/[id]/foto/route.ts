import { get } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { downloadDonorPhoto, isSupabaseObjectUrl } from '@/lib/supabase-storage';

export const dynamic = 'force-dynamic';

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ message: 'Foto inválida.' }, { status: 400 });
  const ponto = await prisma.pontoRecolhimento.findUnique({
    where: { id },
    select: { fotoPerfilUrl: true, fotoPerfilPathname: true, fotoPerfilContentType: true },
  });
  if (!ponto?.fotoPerfilUrl) return NextResponse.json({ message: 'Foto não encontrada.' }, { status: 404 });
  let stream: ReadableStream;
  if (isSupabaseObjectUrl(ponto.fotoPerfilUrl) && ponto.fotoPerfilPathname) {
    const arquivo = await downloadDonorPhoto(ponto.fotoPerfilPathname);
    if (!arquivo) return NextResponse.json({ message: 'Foto não encontrada.' }, { status: 404 });
    stream = arquivo.stream();
  } else {
    const arquivo = await get(ponto.fotoPerfilUrl, { access: 'private' });
    if (!arquivo || arquivo.statusCode !== 200 || !arquivo.stream) return NextResponse.json({ message: 'Foto não encontrada.' }, { status: 404 });
    stream = arquivo.stream;
  }
  return new Response(stream, {
    headers: { 'Content-Type': ponto.fotoPerfilContentType ?? 'image/jpeg', 'Cache-Control': 'private, max-age=300' },
  });
}
