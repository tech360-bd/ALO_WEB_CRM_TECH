import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

/** Content authority is revalidated against the current account, not a stale JWT. */
export async function getContentAdminSession(request: Request) {
  if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    const origin = request.headers.get('origin');
    if (!origin || origin !== new URL(process.env.NEXTAUTH_URL || request.url).origin) return null;
  }
  const session = await getServerSession(authOptions);
  const id = (session?.user as { id?: string } | undefined)?.id;
  if (!id) return null;
  const user = await db.user.findUnique({ where: { id } });
  if (!user || user.status.toUpperCase() !== 'ACTIVE' || !user.emailVerified ||
      !['SUPER_ADMIN', 'ADMIN'].includes(user.role.toUpperCase())) return null;
  return { ...session, user: { ...session!.user, id: user.id, role: user.role.toUpperCase() } };
}
