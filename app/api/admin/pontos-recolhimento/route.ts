import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { normalizeBrazilianPhone } from '@/lib/phone';
import { prisma } from '@/lib/prisma';
import { BAIRROS } from '@/lib/bairros';

const schema = z.object({
  nome: z.string().trim().min(3, 'Informe o nome.').max(120),
  whatsapp: z.string().trim().min(8, 'Informe o WhatsApp.'),
  endereco: z.string().trim().min(5, 'Informe o endereço.').max(240),
  bairro: z.enum(BAIRROS, { error: 'Selecione um bairro válido.' }),
  autorizado: z.literal(true, { error: 'Confirme a autorização do ponto de recolhimento.' }),
  disponibilidadeBusca: z.boolean().default(false),
  fotoPerfil: z.object({
    url: z.string().url(),
    pathname: z.string().min(1),
    nomeArquivo: z.string().min(1),
    contentType: z.string().startsWith('image/'),
  }).optional(),
});

export async function GET() {
  const pontos = await prisma.pontoRecolhimento.findMany({
    where: { autorizado: true },
    select: { id: true, nome: true, endereco: true, bairro: true },
    orderBy: [{ bairro: 'asc' }, { nome: 'asc' }],
  });
  return NextResponse.json({ pontos });
}

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? 'Revise os dados informados.' }, { status: 400 });
  }

  const whatsappNormalizado = normalizeBrazilianPhone(parsed.data.whatsapp);
  if (!whatsappNormalizado) {
    return NextResponse.json({ message: 'Informe um WhatsApp válido com DDD.' }, { status: 400 });
  }

  const ponto = await prisma.pontoRecolhimento.create({
    data: {
      nome: parsed.data.nome,
      whatsapp: parsed.data.whatsapp,
      whatsappNormalizado,
      endereco: parsed.data.endereco,
      bairro: parsed.data.bairro,
      autorizado: parsed.data.autorizado,
      disponibilidadeBusca: parsed.data.disponibilidadeBusca,
      fotoPerfilUrl: parsed.data.fotoPerfil?.url,
      fotoPerfilPathname: parsed.data.fotoPerfil?.pathname,
      fotoPerfilNome: parsed.data.fotoPerfil?.nomeArquivo,
      fotoPerfilContentType: parsed.data.fotoPerfil?.contentType,
    },
  });

  return NextResponse.json({ id: ponto.id }, { status: 201 });
}
