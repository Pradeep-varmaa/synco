'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { User, Settings, LogOut, Calendar } from 'lucide-react';
import styles from './user-card.module.css';

interface UserHoverCardProps {
  userName?: string;
  userEmail?: string;
  role?: string;
}

export default function UserHoverCard({
  userName: defaultUserName = 'User',
  userEmail: defaultUserEmail = 'user@synco.app',
  role: defaultRole = 'Member',
}: UserHoverCardProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);

  const userName = session?.user?.name || defaultUserName;
  const userEmail = session?.user?.email || defaultUserEmail;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (session?.user as any)?.role || defaultRole;

  useEffect(() => {
    fetch('/api/tasks')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setPendingTasksCount(data.filter((t: any) => t.status !== 'COMPLETED').length);
        }
      })
      .catch(() => {});

    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setEventsCount(data.length);
        }
      })
      .catch(() => {});
  }, []);

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/calendar/sync', { method: 'POST' });
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <div
      className={styles.userCardWrapper}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <div
        className={styles.extendedProfileBadge}
        onClick={() => setIsOpen((prev) => !prev)}
        role="button"
        tabIndex={0}
        aria-label="User profile options"
      >
        <div className={styles.avatarCircle}>{initials}</div>
        <div className={styles.profileNameContainer}>
          <span className={styles.profileDisplayName} title={userName}>
            {userName}
          </span>
          <span className={styles.profileSubRole}>{role}</span>
        </div>
      </div>

      <div className={`${styles.hoverBoard} ${isOpen ? styles.hoverBoardOpen : ''}`}>
        <div className={styles.boardHeader}>
          <div className={styles.boardAvatarLarge}>{initials}</div>
          <div className={styles.boardUserInfo}>
            <span className={styles.userName}>{userName}</span>
            <span className={styles.userEmail}>{userEmail}</span>
            <span className={styles.userRoleBadge}>{role}</span>
          </div>
        </div>

        <div className={styles.statsSection}>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{pendingTasksCount}</span>
            <span className={styles.statLabel}>Tasks Pending</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statNumber}>{eventsCount}</span>
            <span className={styles.statLabel}>Today&apos;s Events</span>
          </div>
        </div>

        <div className={styles.syncCard}>
          <div className={styles.syncLabelContainer}>
            <div className={styles.syncDot} />
            <span className={styles.syncText}>
              {isSyncing ? 'Syncing...' : 'Google Calendar Synced'}
            </span>
          </div>
          <button
            type="button"
            className={styles.syncButton}
            onClick={handleManualSync}
            disabled={isSyncing}
          >
            {isSyncing ? 'Syncing' : 'Sync Now'}
          </button>
        </div>

        <div className={styles.boardActions}>
          <Link
            href="/profile"
            className={styles.actionButton}
            onClick={() => setIsOpen(false)}
          >
            <User size={16} />
            <span>Profile Details</span>
          </Link>
          <Link
            href="/calendar"
            className={styles.actionButton}
            onClick={() => setIsOpen(false)}
          >
            <Calendar size={16} />
            <span>Calendar Settings</span>
          </Link>
          <Link
            href="/settings"
            className={styles.actionButton}
            onClick={() => setIsOpen(false)}
          >
            <Settings size={16} />
            <span>Preferences</span>
          </Link>
          <button
            type="button"
            className={`${styles.actionButton} ${styles.actionDanger}`}
            onClick={handleSignOut}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
