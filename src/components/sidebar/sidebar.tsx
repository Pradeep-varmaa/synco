'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  CheckSquare,
  FileText,
  Settings,
  X,
  Sparkles,
} from 'lucide-react';
import styles from './sidebar.module.css';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isCollapsed?: boolean;
}

export default function Sidebar({
  isOpen = false,
  onClose,
  isCollapsed = false,
}: SidebarProps) {
  const pathname = usePathname();
  const [pendingTasksCount, setPendingTasksCount] = useState<number>(0);

  useEffect(() => {
    fetch('/api/tasks')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pending = data.filter((t: any) => t.status !== 'COMPLETED').length;
          setPendingTasksCount(pending);
        }
      })
      .catch(() => {});
  }, [pathname]);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'calendar', label: 'Calendar', href: '/calendar', icon: <CalendarDays size={20} /> },
    {
      id: 'tasks',
      label: 'Tasks',
      href: '/tasks',
      icon: <CheckSquare size={20} />,
      badge: pendingTasksCount > 0 ? pendingTasksCount : undefined,
    },
    { id: 'notes', label: 'Notes', href: '/notes', icon: <FileText size={20} /> },
    { id: 'settings', label: 'Settings', href: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <>
      {isOpen && <div className={styles.backdrop} onClick={onClose} />}

      <aside
        className={`${styles.sidebar} ${isOpen ? styles.sidebarOpen : ''} ${
          isCollapsed ? styles.sidebarCollapsed : ''
        }`}
      >
        <div className={styles.brandContainer}>
          <div className={styles.brandLogoGroup}>
            <div className={styles.brandLogo}>
              <img src="/logo.png" alt="" />
            </div>
            <div className={styles.brandTextGroup}>
              <span className={styles.brandName}>
                <span className={styles.brandNameHighlight}>SYN</span>
                <span className={styles.brandNameChrome}>CO</span>
              </span>
              <span className={styles.brandTagline}>
                TASK <span className={styles.taglineSep}>|</span> CALENDAR <span className={styles.taglineSep}>|</span> SYNC
              </span>
            </div>
          </div>

          <button
            type="button"
            className={styles.closeSidebarBtn}
            onClick={onClose}
            aria-label="Close Sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <nav className={styles.navContainer}>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href === '/calendar' && pathname === '/');

            return (
              <Link
                key={item.id}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                onClick={onClose}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
                {item.badge !== undefined && (
                  <span className={styles.navBadge}>{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.syncStatusCard}>
            <div className={styles.statusIndicator} />
            <div className={styles.syncStatusText}>
              <span className={styles.syncStatusTitle}>Google Sync Active</span>
              <span className={styles.syncStatusSubtitle}>Auto-syncs every 15m</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
