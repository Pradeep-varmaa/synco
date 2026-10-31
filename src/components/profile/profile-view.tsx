'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import {
  User,
  Mail,
  Briefcase,
  Building2,
  Calendar,
  CheckSquare,
  FileText,
  Lock,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  LogOut,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import styles from './profile.module.css';

interface ProfileData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    department: string;
    image: string;
    createdAt: string;
    organization: string;
  };
  stats: {
    totalTasks: number;
    pendingTasks: number;
    completedTasks: number;
    totalEvents: number;
    todayEvents: number;
    totalNotes: number;
    googleCalendarSynced: boolean;
  };
}

export default function ProfileView() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [bio, setBio] = useState('Passionate about high-impact product engineering and calendar task synchronization.');
  const [timezone, setTimezone] = useState('Asia/Kolkata (IST +05:30)');

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [pwdStatus, setPwdStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPwd, setIsUpdatingPwd] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setProfile(data);
          setName(data.user.name);
          setDepartment(data.user.department);
          setRole(data.user.role);
        }
      }
    } catch (err) {
      console.error('Failed to load profile data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus(null);
    setIsSaving(true);

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, department, role }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSaveStatus({ type: 'success', message: 'Profile information updated successfully.' });
        fetchProfile();
      } else {
        setSaveStatus({ type: 'error', message: data.error || 'Failed to update profile.' });
      }
    } catch (err) {
      setSaveStatus({ type: 'error', message: 'Network error updating profile.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdStatus(null);

    if (newPassword !== confirmPassword) {
      setPwdStatus({ type: 'error', message: 'New password and confirmation do not match.' });
      return;
    }

    if (newPassword.length < 6) {
      setPwdStatus({ type: 'error', message: 'Password must be at least 6 characters long.' });
      return;
    }

    setIsUpdatingPwd(true);
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPwdStatus({ type: 'success', message: 'Password updated and Bcrypt secured successfully!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwdStatus({ type: 'error', message: data.error || 'Failed to update password.' });
      }
    } catch (err) {
      setPwdStatus({ type: 'error', message: 'Network error updating password.' });
    } finally {
      setIsUpdatingPwd(false);
    }
  };

  const handleSyncCalendar = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/calendar/sync', { method: 'POST' });
      await fetchProfile();
    } catch (err) {
      console.error('Failed to trigger manual calendar sync:', err);
    } finally {
      setTimeout(() => setIsSyncing(false), 800);
    }
  };

  const copyUserId = () => {
    if (profile?.user?.id) {
      navigator.clipboard.writeText(profile.user.id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const displayName = profile?.user?.name || session?.user?.name || 'User';
  const displayEmail = profile?.user?.email || session?.user?.email || 'user@synco.app';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const displayRole = profile?.user?.role || (session?.user as any)?.role || 'Member';
  const displayDept = profile?.user?.department || 'Engineering';

  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className={styles.profileContainer}>
      {/* 1. Hero Header Banner */}
      <div className={styles.heroCard}>
        <div className={styles.heroLeft}>
          <div className={styles.avatarLarge}>{initials}</div>
          <div className={styles.heroDetails}>
            <div className={styles.heroNameRow}>
              <h2 className={styles.heroName}>{displayName}</h2>
              <span className={styles.roleBadge}>{displayRole}</span>
            </div>
            <div className={styles.heroEmailRow}>
              <span className={styles.heroEmail}>{displayEmail}</span>
              <span className={styles.heroMetaDot} />
              <span>{displayDept}</span>
              <span className={styles.heroMetaDot} />
              <span className={styles.heroOrg}>SYNCO Workspace</span>
            </div>
          </div>
        </div>

        <div className={styles.heroActions}>
          <button
            type="button"
            className={styles.signOutBtn}
            onClick={() => signOut({ callbackUrl: '/login' })}
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* 2. Key Activity & Productivity Metrics */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={`${styles.metricIconCircle} ${styles.iconOrange}`}>
            <CheckSquare size={22} />
          </div>
          <div className={styles.metricContent}>
            <span className={styles.metricValue}>{profile?.stats?.pendingTasks ?? 0}</span>
            <span className={styles.metricLabel}>Pending Tasks</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={`${styles.metricIconCircle} ${styles.iconPurple}`}>
            <Calendar size={22} />
          </div>
          <div className={styles.metricContent}>
            <span className={styles.metricValue}>{profile?.stats?.todayEvents ?? 0}</span>
            <span className={styles.metricLabel}>Today&apos;s Events</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={`${styles.metricIconCircle} ${styles.iconGreen}`}>
            <CheckSquare size={22} />
          </div>
          <div className={styles.metricContent}>
            <span className={styles.metricValue}>{profile?.stats?.completedTasks ?? 0}</span>
            <span className={styles.metricLabel}>Completed Tasks</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={`${styles.metricIconCircle} ${styles.iconTeal}`}>
            <FileText size={22} />
          </div>
          <div className={styles.metricContent}>
            <span className={styles.metricValue}>{profile?.stats?.totalNotes ?? 0}</span>
            <span className={styles.metricLabel}>Active Notes</span>
          </div>
        </div>
      </div>

      {/* 3. Main Two-Column View */}
      <div className={styles.contentGrid}>
        {/* Left Column: Personal Information & Password Security */}
        <div className={styles.column}>
          {/* Edit Profile Information */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <User size={20} color="#ff5722" />
                <div>
                  <h3 className={styles.sectionTitle}>Personal Details</h3>
                  <p className={styles.sectionSubtitle}>Manage your profile identity in your organization</p>
                </div>
              </div>
            </div>

            {saveStatus && (
              <div className={saveStatus.type === 'success' ? styles.alertSuccess : styles.alertError}>
                {saveStatus.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                <span>{saveStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Full Name</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Email Address</label>
                  <input
                    type="email"
                    className={`${styles.formInput} ${styles.formInputDisabled}`}
                    value={displayEmail}
                    disabled
                    title="Account email address cannot be changed"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Role / Designation</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Department</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Timezone</label>
                  <select
                    className={styles.formInput}
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  >
                    <option value="Asia/Kolkata (IST +05:30)">Asia/Kolkata (IST +05:30)</option>
                    <option value="America/New_York (EST -05:00)">America/New_York (EST -05:00)</option>
                    <option value="Europe/London (GMT +00:00)">Europe/London (GMT +00:00)</option>
                    <option value="Asia/Tokyo (JST +09:00)">Asia/Tokyo (JST +09:00)</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Organization</label>
                  <input
                    type="text"
                    className={`${styles.formInput} ${styles.formInputDisabled}`}
                    value="SYNCO Workspace • UP THREE"
                    disabled
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.formLabel}>Professional Bio</label>
                  <textarea
                    className={styles.formTextarea}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Security & Password Card */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <Lock size={20} color="#ff5722" />
                <div>
                  <h3 className={styles.sectionTitle}>Security & Password</h3>
                  <p className={styles.sectionSubtitle}>Update your password with Bcrypt encryption (10 salt rounds)</p>
                </div>
              </div>
            </div>

            {pwdStatus && (
              <div className={pwdStatus.type === 'success' ? styles.alertSuccess : styles.alertError}>
                {pwdStatus.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
                <span>{pwdStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword}>
              <div className={styles.formGrid}>
                <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                  <label className={styles.formLabel}>Current Password</label>
                  <input
                    type="password"
                    className={styles.formInput}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>New Password</label>
                  <input
                    type="password"
                    className={styles.formInput}
                    placeholder="Minimum 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Confirm New Password</label>
                  <input
                    type="password"
                    className={styles.formInput}
                    placeholder="Re-type new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="submit"
                  className={styles.saveButton}
                  disabled={isUpdatingPwd}
                >
                  {isUpdatingPwd ? 'Securing...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Account Info, Sync & Quick Links */}
        <div className={styles.column}>
          {/* Workspace Identity Info */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <ShieldCheck size={20} color="#0c8388" />
                <h3 className={styles.sectionTitle}>Workspace Identity</h3>
              </div>
            </div>

            <div className={styles.infoList}>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>User UUID</span>
                <span className={styles.infoValue}>
                  <span className={styles.uuidCode}>{profile?.user?.id || 'usr-default'}</span>
                  <button
                    type="button"
                    className={styles.copyBtn}
                    onClick={copyUserId}
                    title="Copy User UUID"
                    aria-label="Copy User UUID"
                  >
                    {copiedId ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  </button>
                </span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Role Permission</span>
                <span className={styles.infoValue}>{displayRole}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Primary Department</span>
                <span className={styles.infoValue}>{displayDept}</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Password Security</span>
                <span className={styles.infoValue}>Bcrypt (10 Salt Rounds)</span>
              </div>

              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Member Since</span>
                <span className={styles.infoValue}>October 2026</span>
              </div>
            </div>
          </div>

          {/* Google Calendar Sync Card */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <Calendar size={20} color="#ff5722" />
                <h3 className={styles.sectionTitle}>Google Sync</h3>
              </div>
            </div>

            <div className={styles.syncBox}>
              <div className={styles.syncBoxLeft}>
                <div className={styles.syncDotActive} />
                <div>
                  <div className={styles.syncTitle}>
                    {isSyncing ? 'Syncing...' : 'Google Calendar Synced'}
                  </div>
                  <div className={styles.syncSubtitle}>Automatic bi-directional sync active</div>
                </div>
              </div>

              <button
                type="button"
                className={styles.syncNowButton}
                onClick={handleSyncCalendar}
                disabled={isSyncing}
              >
                {isSyncing ? 'Syncing' : 'Sync Now'}
              </button>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Quick Navigation</h3>
            </div>

            <div className={styles.quickNavGroup}>
              <Link href="/tasks" className={styles.quickNavLink}>
                <div className={styles.quickNavLeft}>
                  <CheckSquare size={17} color="#ff5722" />
                  <span>My Tasks Board</span>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </Link>

              <Link href="/calendar" className={styles.quickNavLink}>
                <div className={styles.quickNavLeft}>
                  <Calendar size={17} color="#8b5cf6" />
                  <span>My Calendar</span>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </Link>

              <Link href="/notes" className={styles.quickNavLink}>
                <div className={styles.quickNavLeft}>
                  <FileText size={17} color="#10b981" />
                  <span>My Notes & Ideas</span>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </Link>

              <Link href="/settings" className={styles.quickNavLink}>
                <div className={styles.quickNavLeft}>
                  <Building2 size={17} color="#0c8388" />
                  <span>Workspace Settings</span>
                </div>
                <ChevronRight size={16} color="#94a3b8" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
