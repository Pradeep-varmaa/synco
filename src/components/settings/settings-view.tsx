'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, X, Mail, Check, Shield } from 'lucide-react';
import { TeamMember } from '@/app/api/team/route';
import styles from './settings.module.css';

interface MailTemplate {
  id?: string;
  name: string;
  subject: string;
  body: string;
  variables?: string;
}

export default function SettingsView() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('Last synced 3 minutes ago');
  const [team, setTeam] = useState<TeamMember[]>([]);

  // Add outside user modal state
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Product Engineer');
  const [inviteDepartment, setInviteDepartment] = useState('Engineering');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');

  // Mail templates management state
  const [templates, setTemplates] = useState<MailTemplate[]>([]);
  const [selectedTemplateName, setSelectedTemplateName] = useState('task_assigned');
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [templateStatusMsg, setTemplateStatusMsg] = useState('');

  useEffect(() => {
    // Fetch team members
    fetch('/api/team')
      .then((res) => res.json())
      .then((data) => setTeam(data))
      .catch((e) => console.error(e));

    // Fetch dynamic mail templates
    fetch('/api/mail-templates')
      .then((res) => res.json())
      .then((data) => {
        if (data.templates && Array.isArray(data.templates)) {
          setTemplates(data.templates);
          const current = data.templates.find((t: MailTemplate) => t.name === 'task_assigned') || data.templates[0];
          if (current) {
            setEditSubject(current.subject);
            setEditBody(current.body);
          }
        }
      })
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

  const handleSelectTemplate = (templateName: string) => {
    setSelectedTemplateName(templateName);
    const tmpl = templates.find((t) => t.name === templateName);
    if (tmpl) {
      setEditSubject(tmpl.subject);
      setEditBody(tmpl.body);
      setTemplateStatusMsg('');
    }
  };

  const handleSaveTemplate = async () => {
    setIsSavingTemplate(true);
    setTemplateStatusMsg('');
    try {
      const res = await fetch('/api/mail-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: selectedTemplateName,
          subject: editSubject,
          body: editBody,
        }),
      });

      if (res.ok) {
        setTemplateStatusMsg('Template saved and updated dynamically!');
        setTemplates((prev) =>
          prev.map((t) =>
            t.name === selectedTemplateName
              ? { ...t, subject: editSubject, body: editBody }
              : t
          )
        );
      } else {
        const errData = await res.json();
        setTemplateStatusMsg(errData.error || 'Failed to save template.');
      }
    } catch (err) {
      console.error(err);
      setTemplateStatusMsg('Network error while saving template.');
    } finally {
      setIsSavingTemplate(false);
      setTimeout(() => setTemplateStatusMsg(''), 4000);
    }
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    setIsInviting(true);
    setInviteSuccessMsg('');

    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inviteName,
          email: inviteEmail,
          role: inviteRole,
          department: inviteDepartment,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setTeam((prev) => [...prev, data.member]);
        setInviteSuccessMsg(
          `User invited! An email with default password "${data.defaultPassword}" was sent to ${inviteEmail}.`
        );
        setInviteName('');
        setInviteEmail('');
        setTimeout(() => {
          setIsInviteModalOpen(false);
          setInviteSuccessMsg('');
        }, 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsInviting(false);
    }
  };

  const currentTemplate = templates.find((t) => t.name === selectedTemplateName);

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

      {/* Team Member Directory for Task Delegation with Add User action */}
      <div className={styles.settingsCard}>
        <div className={styles.cardHeader}>
          <div className={styles.headerText}>
            <h3 className={styles.cardTitle}>Team Members Directory</h3>
            <span className={styles.cardSubtitle}>
              People available for task delegation and meeting scheduling
            </span>
          </div>

          <button
            type="button"
            className={styles.addMemberBtn}
            onClick={() => setIsInviteModalOpen(true)}
          >
            <UserPlus size={16} />
            <span>+ Add Outside User</span>
          </button>
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

      {/* Dynamic Mail Templates Table Management (Editable by Members) */}
      <div className={styles.settingsCard}>
        <div className={styles.cardHeader}>
          <div className={styles.headerText}>
            <h3 className={styles.cardTitle}>Email Notification Templates</h3>
            <span className={styles.cardSubtitle}>
              Dynamic database templates for task delegation and member invitations
            </span>
          </div>

          <div className={styles.membersOnlyBadge}>
            <Shield size={12} />
            <span>Members Only</span>
          </div>
        </div>

        <div className={styles.templateTabs}>
          <button
            type="button"
            className={`${styles.templateTabBtn} ${
              selectedTemplateName === 'task_assigned' ? styles.templateTabActive : ''
            }`}
            onClick={() => handleSelectTemplate('task_assigned')}
          >
            <Mail size={14} />
            <span>Task Assignment Email</span>
          </button>
          <button
            type="button"
            className={`${styles.templateTabBtn} ${
              selectedTemplateName === 'user_invitation' ? styles.templateTabActive : ''
            }`}
            onClick={() => handleSelectTemplate('user_invitation')}
          >
            <Mail size={14} />
            <span>Member Welcome & Default Password</span>
          </button>
        </div>

        <div className={styles.templateForm}>
          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Subject Line</label>
            <input
              type="text"
              className={styles.fieldInput}
              value={editSubject}
              onChange={(e) => setEditSubject(e.target.value)}
              placeholder="Email subject..."
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>Available Dynamic Variables</label>
            <div className={styles.tokenList}>
              {currentTemplate?.variables ? (
                currentTemplate.variables.split(',').map((v) => (
                  <span key={v.trim()} className={styles.tokenPill}>
                    {v.trim()}
                  </span>
                ))
              ) : (
                <span className={styles.tokenPill}>{"{user_name}"}</span>
              )}
            </div>
          </div>

          <div className={styles.formField}>
            <label className={styles.fieldLabel}>HTML Template Body</label>
            <textarea
              className={styles.fieldTextarea}
              value={editBody}
              onChange={(e) => setEditBody(e.target.value)}
              placeholder="HTML template content..."
            />
          </div>

          <div className={styles.templateActionsRow}>
            {templateStatusMsg && (
              <span className={styles.statusNotice}>{templateStatusMsg}</span>
            )}
            <button
              type="button"
              className={styles.saveTemplateBtn}
              onClick={handleSaveTemplate}
              disabled={isSavingTemplate}
            >
              {isSavingTemplate ? 'Saving...' : 'Save Template Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Add Outside User Under Organization */}
      {isInviteModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsInviteModalOpen(false)}>
          <div className={styles.inviteModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add Outside User to Organization</h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setIsInviteModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <p className={styles.modalNotice}>
              An account will be created under your organization and an invitation email will be sent
              with an auto-generated default password and login instructions.
            </p>

            {inviteSuccessMsg ? (
              <div className={styles.inviteSuccessBanner}>
                <Check size={18} />
                <span>{inviteSuccessMsg}</span>
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit} className={styles.templateForm}>
                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Full Name</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    placeholder="e.g. Alex Johnson"
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Email Address</label>
                  <input
                    type="email"
                    className={styles.fieldInput}
                    placeholder="e.g. alex@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Role / Title</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    placeholder="e.g. Senior Frontend Engineer"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.fieldLabel}>Department</label>
                  <input
                    type="text"
                    className={styles.fieldInput}
                    placeholder="e.g. Engineering"
                    value={inviteDepartment}
                    onChange={(e) => setInviteDepartment(e.target.value)}
                  />
                </div>

                <div className={styles.modalFooter}>
                  <button
                    type="button"
                    className={styles.cancelModalBtn}
                    onClick={() => setIsInviteModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.submitModalBtn}
                    disabled={isInviting}
                  >
                    {isInviting ? 'Inviting...' : 'Send Invitation & Credentials'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
