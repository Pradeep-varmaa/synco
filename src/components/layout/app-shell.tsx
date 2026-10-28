'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Sidebar from '@/components/sidebar/sidebar';
import Topbar from '@/components/topbar/topbar';
import styles from './app-shell.module.css';

interface AppShellProps {
  children: React.ReactNode;
}

const titlesByPath: Record<string, string> = {
  '/': 'Calendar',
  '/calendar': 'Calendar',
  '/dashboard': 'Dashboard',
  '/tasks': 'Tasks & Delegation',
  '/notes': 'Notes',
  '/settings': 'Settings',
};

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useSession();
  const currentTitle = titlesByPath[pathname] || 'SYNCO';
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Client-side session check: if unauthenticated on a protected page, automatically push to /login
  useEffect(() => {
    const isAuthPage = pathname?.startsWith('/auth') || pathname?.startsWith('/login');
    if (!isAuthPage && status === 'unauthenticated') {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname || '/')}`);
    }
  }, [status, pathname, router]);

  // For authentication pages (e.g. /login, /auth/signin), do not show sidebar or topbar
  if (pathname?.startsWith('/auth') || pathname?.startsWith('/login')) {
    return <>{children}</>;
  }

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth <= 900) {
      setMobileDrawerOpen((prev) => !prev);
    } else {
      setIsCollapsed((prev) => !prev);
    }
  };

  const handleCloseMobileDrawer = () => {
    setMobileDrawerOpen(false);
  };

  return (
    <div className={styles.shellContainer}>
      <Sidebar
        isOpen={mobileDrawerOpen}
        onClose={handleCloseMobileDrawer}
        isCollapsed={isCollapsed}
      />
      <div className={styles.mainSection}>
        <Topbar
          title={currentTitle}
          onToggleSidebar={handleToggleSidebar}
        />
        <main className={styles.contentWrapper}>{children}</main>
      </div>
    </div>
  );
}
