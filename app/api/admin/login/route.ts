import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminCredentials, getAdminSessionToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { username, password } = body as { username?: string; password?: string };

  if (!username || !password) {
    return NextResponse.json({ message: 'Usuário e senha são obrigatórios.' }, { status: 400 });
  }

  if (!verifyAdminCredentials(username, password)) {
    return NextResponse.json({ message: 'Credenciais inválidas.' }, { status: 401 });
  }

  const response = NextResponse.json({ message: 'Autenticado' });
  response.cookies.set({
    name: 'ecri_admin_session',
    value: getAdminSessionToken(),
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24,
  });

  return response;
}
