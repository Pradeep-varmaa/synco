import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { query } from '@/lib/db';

export const authOptions: NextAuthOptions = {
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
      name: 'Demo Account',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'praveen@synco.app' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Simple demo authentication fallback
        return {
          id: 'user-1',
          name: 'Praveen Kumar',
          email: credentials?.email || 'praveen@synco.app',
          image: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }) {
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

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
