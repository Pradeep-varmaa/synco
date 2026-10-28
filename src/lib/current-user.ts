import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';
import { DUMMY_USERS } from '@/lib/dummy-data';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
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

    // If ID is already in session token and is a valid UUID/string
    if (id && id.length > 5) {
      return {
        id,
        name: session.user.name || 'User',
        email,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        role: (session.user as any).role || 'Member',
      };
    }

    // Try resolving ID from database
    try {
      const dbRes = await query(
        'SELECT id, name, email, role FROM users WHERE LOWER(email) = $1 LIMIT 1',
        [email]
      );
      if (dbRes && dbRes.rows.length > 0) {
        return {
          id: String(dbRes.rows[0].id),
          name: dbRes.rows[0].name || session.user.name || 'User',
          email: dbRes.rows[0].email,
          role: dbRes.rows[0].role || 'Member',
        };
      }
    } catch (e) {
      console.warn('Could not query users table for ID:', e);
    }

    // Fallback to DUMMY_USERS
    const dummy = DUMMY_USERS.find((u) => u.email.toLowerCase() === email);
    if (dummy) {
      return {
        id: dummy.id,
        name: dummy.name,
        email: dummy.email,
        role: dummy.role,
      };
    }

    return {
      id: id || 'usr-default',
      name: session.user.name || 'User',
      email,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      role: (session.user as any).role || 'Member',
    };
  } catch (err) {
    console.error('Error getting current user:', err);
    return null;
  }
}
