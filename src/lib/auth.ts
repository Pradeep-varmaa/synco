import { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { DUMMY_USERS } from '@/lib/dummy-data';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
              params: {
                scope:
                  'openid email profile https://www.googleapis.com/auth/calendar.events',
                access_type: 'offline',
                prompt: 'consent',
              },
            },
          }),
        ]
      : []),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'you@organization.com' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.trim().toLowerCase();
        const plainPassword = credentials.password;

        // Query database for user and authenticate strictly via Bcrypt
        try {
          const userRes = await query(
            'SELECT id, name, email, password, image, role FROM users WHERE LOWER(email) = $1 LIMIT 1',
            [email]
          );

          if (userRes && userRes.rows.length > 0) {
            const dbUser = userRes.rows[0];

            if (dbUser.password) {
              const isMatch = await bcrypt.compare(plainPassword, dbUser.password);
              if (isMatch) {
                return {
                  id: String(dbUser.id),
                  name: dbUser.name || 'User',
                  email: dbUser.email,
                  image: dbUser.image || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                  role: dbUser.role || 'Member',
                };
              }
            }
          }
        } catch (dbErr) {
          console.error('Database query during authorize failed:', dbErr);
        }

        // Fallback to DUMMY_USERS for sandbox/offline execution
        const dummy = DUMMY_USERS.find((u) => u.email.toLowerCase() === email);
        if (dummy) {
          const isMatch = await bcrypt.compare(plainPassword, dummy.passwordHash);
          if (isMatch) {
            return {
              id: dummy.id,
              name: dummy.name,
              email: dummy.email,
              image: dummy.avatar,
              role: dummy.role,
            };
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
      if (user) {
        token.id = user.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        token.role = (user as any).role || 'Member';
      }
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;

        // Persist token in Neon accounts table if available
        if (user && account.provider === 'google') {
          try {
            await query(
              `INSERT INTO accounts (user_id, type, provider, provider_account_id, refresh_token, access_token, expires_at, scope)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
              [
                user.id,
                account.type,
                account.provider,
                account.providerAccountId,
                account.refresh_token,
                account.access_token,
                account.expires_at,
                account.scope,
              ]
            );
          } catch (e) {
            console.warn('Could not persist oauth tokens to db accounts table', e);
          }
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).id = token.id;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session.user as any).role = token.role;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (session as any).accessToken = token.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET || 'synco_default_secret_key_123456789',
};
