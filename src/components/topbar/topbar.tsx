'use client';

import React from 'react';
import { Menu, Search } from 'lucide-react';
import UserHoverCard from './user-hover-card';
import styles from './topbar.module.css';

interface TopbarProps {
  title?: string;
  onToggleSidebar?: () => void;
}

export default function Topbar({ title = 'Calendar', onToggleSidebar }: TopbarProps) {
  return (
    <header className={styles.topbar}>
      <div className={styles.titleSection}>
        <button
          type="button"
          className={styles.sidebarToggleBtn}
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Sidebar"
          title="Toggle Navigation Menu"
        >
          <Menu size={19} />
        </button>
        <h1 className={styles.pageTitle}>{title}</h1>
      </div>

      <div className={styles.actionsSection}>
        <button
          type="button"
          className={styles.searchIconButton}
          aria-label="Search"
          title="Search"
        >
          <Search size={18} />
        </button>
        <UserHoverCard />
      </div>
    </header>
  );
}
