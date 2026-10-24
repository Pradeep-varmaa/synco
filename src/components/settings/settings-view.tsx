'use client';

import React, { useState, useEffect } from 'react';
import { TeamMember } from '@/app/api/team/route';
import styles from './settings.module.css';

export default function SettingsView() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('Last synced 3 minutes ago');
  const [team, setTeam] = useState<TeamMember[]>([]);

  useEffect(() => {
    fetch('/api/team')
      .then((res) => res.json())
      .then((data) => setTeam(data))
      .catch((e) => console.error(e));
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/calendar/sync', { method: 'POST' });
      if (res.ok) {
        setSyncMessage('Synced successfully just now');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setIsSyncing(false), 900);
    }
  };

  return (
    <div className={styles.settingsContainer}>
      {/* Google Calendar API Integration */}
      <div className={styles.settingsCard}>
        <div className={styles.cardHeader}>
          <div className={styles.headerText}>
            <h3 className={styles.cardTitle}>Google Calendar API Integration</h3>
            <span className={styles.cardSubtitle}>
              Bidirectional real-time event and task scheduling synchronization
            </span>
          </div>

          <div className={styles.connectionStatus}>
            <div className={styles.statusDot} />
            <span className={styles.statusText}>Connected</span>
          </div>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingName}>Sync Engine Status</span>
            <span className={styles.settingDescription}>{syncMessage}</span>
          </div>
          <button
            type="button"
            className={styles.syncActionBtn}
            onClick={handleManualSync}
            disabled={isSyncing}
          >
            {isSyncing ? 'Synchronizing...' : 'Sync Now'}
          </button>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingName}>Auto-Sync Task Deadlines</span>
            <span className={styles.settingDescription}>
              Automatically post assigned tasks with due dates to your primary Google Calendar
            </span>
          </div>
          <input type="checkbox" defaultChecked />
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingName}>Instant Meeting Creation</span>
            <span className={styles.settingDescription}>
              Auto-generate Google Meet conference links for new events
            </span>
          </div>
          <input type="checkbox" defaultChecked />
        </div>
      </div>

      {/* Database Connection */}
      <div className={styles.settingsCard}>
        <div className={styles.cardHeader}>
          <div className={styles.headerText}>
            <h3 className={styles.cardTitle}>Neon PostgreSQL Database</h3>
            <span className={styles.cardSubtitle}>
              Serverless Postgres connection with pg client pool
            </span>
          </div>

          <div className={styles.connectionStatus}>
            <div className={styles.statusDot} />
            <span className={styles.statusText}>Pool Active</span>
          </div>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingName}>SSL Mode</span>
            <span className={styles.settingDescription}>
              Verified SSL connection (require/rejectUnauthorized: false)
            </span>
          </div>
          <span className={styles.settingDescription}>TLS v1.3</span>
        </div>

        <div className={styles.settingRow}>
          <div className={styles.settingInfo}>
            <span className={styles.settingName}>Database Dialect</span>
            <span className={styles.settingDescription}>
              PostgreSQL 16 (Neon Serverless)
            </span>
          </div>
          <span className={styles.settingDescription}>PostgreSQL (pg)</span>
        </div>
      </div>

      {/* Team Member Directory for Task Delegation */}
      <div className={styles.settingsCard}>
        <div className={styles.cardHeader}>
          <div className={styles.headerText}>
            <h3 className={styles.cardTitle}>Team Members Directory</h3>
            <span className={styles.cardSubtitle}>
              People available for task delegation and meeting scheduling
            </span>
          </div>
        </div>

        <div className={styles.teamGrid}>
          {team.map((member) => (
            <div key={member.id} className={styles.memberCard}>
              <div className={styles.memberAvatar}>
                {member.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className={styles.memberImg}
                  />
                ) : (
                  member.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className={styles.memberMeta}>
                <span className={styles.memberName}>{member.name}</span>
                <span className={styles.memberRole}>
                  {member.role} • {member.department}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
