import { cookies } from 'next/headers';
import AdminNavigation from '@/components/admin-navigation';
import { ADMIN_SESSION_COOKIE, isValidAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  const authenticated = isValidAdminSession(session);

  return (
    <>
      {authenticated ? <AdminNavigation /> : null}
      {children}
    </>
  );
}
