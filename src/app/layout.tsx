import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import './globals.css';
import AppShell from '@/components/layout/app-shell';
import SessionProvider from '@/components/providers/session-provider';

export const metadata: Metadata = {
  title: 'SYNCO ',
  description: 'An UPTHREE product for team collaboration and productivity.',
  icons:{
    icon: '/logo.png',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <Suspense fallback={null}>
            <AppShell>{children}</AppShell>
          </Suspense>
        </SessionProvider>
      </body>
    </html>
  );
}
