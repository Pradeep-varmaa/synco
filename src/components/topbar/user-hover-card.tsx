'use client';

import React, { useState, useEffect } from 'react';
import { User, Settings, LogOut, Calendar } from 'lucide-react';
import styles from './user-card.module.css';

interface UserHoverCardProps {
  userName?: string;
  userEmail?: string;
  role?: string;
}

export default function UserHoverCard({
  userName = 'Praveen Kumar',
  userEmail = 'praveen@synco.app',
  role = 'Workspace Admin',
}: UserHoverCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingTasksCount, setPendingTasksCount] = useState(0);
  const [eventsCount, setEventsCount] = useState(0);

  useEffect(() => {
    fetch('/api/tasks')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
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
          <span className={styles.profileSubRole}>Workspace Admin</span>
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
            <span className={styles.statLabel}>Today's Events</span>
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
          <button type="button" className={styles.actionButton}>
            <User size={16} />
            <span>Profile Details</span>
          </button>
          <button type="button" className={styles.actionButton}>
            <Calendar size={16} />
            <span>Calendar Settings</span>
          </button>
          <button type="button" className={styles.actionButton}>
            <Settings size={16} />
            <span>Preferences</span>
          </button>
          <button type="button" className={`${styles.actionButton} ${styles.actionDanger}`}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
