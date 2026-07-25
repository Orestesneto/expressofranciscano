import { createHash } from 'crypto';

const adminUser = process.env.ADMIN_USER ?? process.env.ADMIN_EMAIL ?? 'adm';
const adminPassword = process.env.ADMIN_PASSWORD ?? 'admin123';

export const ADMIN_SESSION_COOKIE = 'ecri_admin_session';

export function hashPassword(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

export function getAdminSessionToken() {
  return hashPassword(`${adminUser}:${adminPassword}`);
}

export function verifyAdminCredentials(username: string, password: string) {
  return username === adminUser && password === adminPassword;
}

export function isValidAdminSession(cookieValue: string | undefined) {
  if (!cookieValue) return false;
  return cookieValue === getAdminSessionToken();
}
