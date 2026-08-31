import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { DONOR_PHOTOS_BUCKET, getSupabaseObjectUrl, getSupabaseStorageAdmin } from '@/lib/supabase-storage';

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'] as const;
const schema = z.object({
  fileName: z.string().trim().min(1).max(180),
  contentType: z.enum(allowedTypes),
  size: z.number().int().positive().max(5 * 1024 * 1024),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ message: 'Foto inválida. Use uma imagem de até 5 MB.' }, { status: 400 });
    }
    const safeName = parsed.data.fileName.replace(/[^a-zA-Z0-9._-]/g, '-');
    const pathname = `perfis/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
    const { data, error } = await getSupabaseStorageAdmin().storage
      .from(DONOR_PHOTOS_BUCKET)
      .createSignedUploadUrl(pathname);
    if (error || !data) throw error ?? new Error('Não foi possível assinar o upload.');

    return NextResponse.json({
      pathname,
      token: data.token,
      url: getSupabaseObjectUrl(pathname),
      nomeArquivo: parsed.data.fileName,
      contentType: parsed.data.contentType,
    });
  } catch (error) {
    console.error('Falha ao preparar upload no Supabase', error);
    return NextResponse.json({ message: 'Não foi possível enviar a foto de perfil.' }, { status: 500 });
  }
}
