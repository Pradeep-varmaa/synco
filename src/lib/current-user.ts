import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { DUMMY_USERS } from '@/lib/dummy-data';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  image?: string;
  createdAt?: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return null;
    }

    const email = session.user.email.toLowerCase();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let id = (session.user as any).id as string | undefined;

    // Check database first
    try {
      const dbRes = await query(
        `SELECT u.id, u.name, u.email, u.role, u.image, u.created_at, tm.department
         FROM users u
         LEFT JOIN team_members tm ON tm.user_id = u.id OR LOWER(tm.email) = LOWER(u.email)
         WHERE LOWER(u.email) = $1
         LIMIT 1`,
        [email]
      );
      if (dbRes && dbRes.rows.length > 0) {
        const row = dbRes.rows[0];
        return {
          id: String(row.id),
          name: row.name || session.user.name || 'User',
          email: row.email,
          role: row.role || 'Member',
          department: row.department || 'Engineering',
          image: row.image || session.user.image || '',
          createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at || '',
        };
      }
    } catch (e) {
      console.warn('Could not query users table for current user details:', e);
    }

    // Fallback to DUMMY_USERS
    const dummy = DUMMY_USERS.find((u) => u.email.toLowerCase() === email);
    if (dummy) {
      return {
        id: dummy.id,
        name: dummy.name,
        email: dummy.email,
        role: dummy.role,
        department: dummy.department,
        image: dummy.avatar,
        createdAt: '2026-10-01T00:00:00.000Z',
      };
    }

    return {
      id: id || 'usr-default',
      name: session.user.name || 'User',
      email,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      role: (session.user as any).role || 'Member',
      department: 'Engineering',
      image: session.user.image || '',
      createdAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error('Error getting current user:', err);
    return null;
  }
}
