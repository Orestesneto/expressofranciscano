import { NextRequest, NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as HandleUploadBody;
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = JSON.parse(clientPayload || '{}') as { productIds?: number[] };
        const productIds = Array.isArray(payload.productIds) ? payload.productIds : [];
        const customProduct = await prisma.produto.findFirst({
          where: {
            id: { in: productIds },
            personalizado: true,
            ativo: true,
          },
          select: { id: true },
        });
        if (!customProduct || !pathname.startsWith('personalizacoes/')) {
          throw new Error('Upload não autorizado para este pedido.');
        }
        return {
          // image/* inclui os MIME types usados por Android e pelo Safari/iOS,
          // inclusive variações de HEIC/HEIF enviadas pelo seletor de fotos.
          allowedContentTypes: ['image/*'],
          maximumSizeInBytes: 10 * 1024 * 1024,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ productIds }),
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error('Falha no upload de personalização', error);
    return NextResponse.json({ message: 'Não foi possível enviar a imagem.' }, { status: 400 });
  }
}
