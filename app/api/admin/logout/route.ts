import { NextResponse } from 'next/server';
import { ADMIN_SESSION_COOKIE } from '@/lib/auth';

export async function POST() {
  const response = NextResponse.json({ message: 'Sessão encerrada.' });
  response.cookies.set({
    name: ADMIN_SESSION_COOKIE,
    value: '',
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 0,
  });
  return response;
}
