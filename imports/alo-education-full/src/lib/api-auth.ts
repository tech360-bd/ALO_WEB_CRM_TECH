import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { NextResponse } from 'next/server';

interface AuthResult {
  error: NextResponse | null;
  user: { id: string; email: string; name: string; role: string; status: string } | null;
}

export async function requireAuth(request: Request): Promise<AuthResult> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), user: null };
    }

    const userId = (session.user as any).id;
    const userRole = (session.user as any).role;

    // Return user info from session
    return {
      error: null,
      user: {
        id: userId || '',
        email: session.user.email || '',
        name: session.user.name || '',
        role: userRole || 'STUDENT',
        status: (session.user as any).status || 'ACTIVE',
      },
    };
  } catch {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), user: null };
  }
}

export async function requireRole(request: Request, roles: string[]): Promise<AuthResult> {
  const auth = await requireAuth(request);
  if (auth.error) return auth;

  if (!roles.includes(auth.user?.role || '')) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }), user: null };
  }
  return auth;
}
