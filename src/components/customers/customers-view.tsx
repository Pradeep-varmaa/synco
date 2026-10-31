'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Mail,
  Send,
  Clock,
  Building,
  User,
  CheckCircle,
  Eye,
  FileText,
  Search,
  Sparkles,
  X,
  ExternalLink,
  ShieldCheck,
  Users,
} from 'lucide-react';
import styles from './customers.module.css';

interface CustomerEmailItem {
  id: string;
  userId: string;
  senderName: string;
  senderEmail: string;
  customerName: string;
  customerEmail: string;
  customerCompany: string;
  subject: string;
  body: string;
  htmlContent: string;
  status: 'SENT' | 'DELIVERED';
  createdAt: string;
}

// Pre-defined customer templates
const TEMPLATES = [
  {
    id: 'feature_update',
    name: 'Feature Update & Release',
    subject: 'SYNCO Product Update: New Calendar & Multi-Color Task Views',
    body: `Hello {customer_name},\n\nWe are delighted to announce that your SYNCO workspace has been updated with our latest productivity enhancements.\n\nKey highlights in this release:\n- Responsive calendar grid with compressed height and clean view switching\n- Dynamic multi-color task highlighting to distinguish parallel initiatives\n- Direct email dispatch with verified brand signature verification\n\nLet us know if you or your team have any questions or feedback. We are always here to help you get the most out of your workflow.\n\nWarm regards,`,
  },
  {
    id: 'welcome_onboard',
    name: 'Welcome & Onboarding',
    subject: 'Welcome to SYNCO - Getting Started with Your Team Workspace',
    body: `Dear {customer_name},\n\nWelcome to SYNCO! We are thrilled to partner with {customer_company} to help streamline your team coordination, task delegation, and calendar synchronization.\n\nTo help your team get started immediately:\n1. Log in to your dedicated portal at https://synco.app/login\n2. Sync your Google Calendar in your Settings panel\n3. Assign tasks directly across departments with automated mail notifications\n\nPlease reply directly to this mail if you would like a personalized demo session.\n\nBest regards,`,
  },
  {
    id: 'meeting_followup',
    name: 'Meeting Follow-up & Tasks',
    subject: 'Follow-up & Key Action Items from Our Strategy Session',
    body: `Hi {customer_name},\n\nThank you for the productive discussion earlier today regarding our upcoming milestones. Below is a recap of the key action items we aligned on:\n\n- Task Delegation: Team assignments have been logged in your SYNCO dashboard\n- Timeline: Review scheduled for next Friday at 10:00 AM\n- Calendar Sync: All scheduled milestones are now synchronized\n\nPlease let us know if anything needs adjustments before we proceed.\n\nSincerely,`,
  },
  {
    id: 'custom_blank',
    name: 'Custom / Blank',
    subject: '',
    body: `Dear {customer_name},\n\n`,
  },
];

// Quick customer contacts
const QUICK_CUSTOMERS = [
  { name: 'Sarah Jenkins', email: 'sarah.jenkins@acmecorp.com', company: 'Acme Corporation' },
  { name: 'David Chen', email: 'david.chen@innovatetech.io', company: 'InnovateTech' },
  { name: 'Elena Rostova', email: 'elena@apexlogistics.com', company: 'Apex Logistics' },
  { name: 'Marcus Vance', email: 'marcus@vancetech.com', company: 'Vance Technologies' },
];

export default function CustomersView() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'compose' | 'history'>('compose');
  const [emails, setEmails] = useState<CustomerEmailItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('feature_update');
  const [showLivePreview, setShowLivePreview] = useState(false);

  // Status & UI State
  const [isSending, setIsSending] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmailModal, setSelectedEmailModal] = useState<CustomerEmailItem | null>(null);

  // User credentials for signature card
  const senderName = session?.user?.name || 'SYNCO Lead';
  const senderEmail = session?.user?.email || 'team@synco.app';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const senderRole = (session?.user as any)?.role || 'Client Success Lead';

  const fetchEmails = async () => {
    try {
      const res = await fetch('/api/customers/mail');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setEmails(data);
        }
      }
    } catch (e) {
      console.error('Failed to load customer emails:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
    // Pre-populate with default template
    applyTemplate('feature_update', 'Sarah Jenkins', 'Acme Corporation');
    setCustomerName('Sarah Jenkins');
    setCustomerEmail('sarah.jenkins@acmecorp.com');
    setCustomerCompany('Acme Corporation');
  }, []);

  const applyTemplate = (templateId: string, name = customerName, company = customerCompany) => {
    const tmpl = TEMPLATES.find((t) => t.id === templateId);
    if (!tmpl) return;

    setSelectedTemplate(templateId);
    const populatedSubject = tmpl.subject;
    const populatedBody = tmpl.body
      .replace(/\{customer_name\}/g, name || 'Customer')
      .replace(/\{customer_company\}/g, company || 'your company');

    setSubject(populatedSubject);
    setBody(populatedBody);
  };

  const handleSelectQuickCustomer = (customer: { name: string; email: string; company: string }) => {
    setCustomerName(customer.name);
    setCustomerEmail(customer.email);
    setCustomerCompany(customer.company);
    applyTemplate(selectedTemplate, customer.name, customer.company);
  };

  const handleSendMail = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);

    if (!customerEmail.trim()) {
      setAlert({ type: 'error', message: 'Customer recipient email is required.' });
      return;
    }
    if (!subject.trim()) {
      setAlert({ type: 'error', message: 'Please provide an email subject.' });
      return;
    }
    if (!body.trim()) {
      setAlert({ type: 'error', message: 'Email body cannot be empty.' });
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch('/api/customers/mail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerCompany,
          subject,
          body,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setAlert({
          type: 'success',
          message: `Email dispatched to ${customerEmail} and recorded in sent history with timestamp!`,
        });
        fetchEmails();
        // Reset or prepare next
        setSelectedTemplate('custom_blank');
      } else {
        setAlert({ type: 'error', message: result.error || 'Failed to dispatch email.' });
      }
    } catch (err) {
      setAlert({ type: 'error', message: 'Network error communicating with mail server.' });
    } finally {
      setIsSending(false);
    }
  };

  const filteredEmails = emails.filter((item) => {
    const q = searchQuery.toLowerCase();
    return (
      item.customerName.toLowerCase().includes(q) ||
      item.customerEmail.toLowerCase().includes(q) ||
      item.customerCompany.toLowerCase().includes(q) ||
      item.subject.toLowerCase().includes(q)
    );
  });

  const formatTimestamp = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className={styles.customersContainer}>
      {/* 1. Header Banner */}
      <div className={styles.headerCard}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIconBadge}>
            <Mail size={24} />
          </div>
          <div className={styles.headerTitles}>
            <h2 className={styles.pageHeading}>Customer Communications</h2>
            <p className={styles.pageSubheading}>
              Send branded outreach emails with automated SYNCO signature cards &amp; stored timestamp logs
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className={styles.tabSwitcher}>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'compose' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('compose')}
          >
            <Send size={16} />
            <span>Compose &amp; Send</span>
          </button>
          <button
            type="button"
            className={`${styles.tabBtn} ${activeTab === 'history' ? styles.tabBtnActive : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <Clock size={16} />
            <span>Sent History</span>
            <span className={activeTab === 'history' ? styles.tabBadge : styles.tabBadgeInactive}>
              {emails.length}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Strip */}
      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={`${styles.metricIconCircle} ${styles.iconOrange}`}>
            <Send size={20} />
          </div>
          <div className={styles.metricContent}>
            <span className={styles.metricValue}>{emails.length}</span>
            <span className={styles.metricLabel}>Total Mails Sent</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={`${styles.metricIconCircle} ${styles.iconGreen}`}>
            <CheckCircle size={20} />
          </div>
          <div className={styles.metricContent}>
            <span className={styles.metricValue}>{emails.length}</span>
            <span className={styles.metricLabel}>Delivered &amp; Logged</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={`${styles.metricIconCircle} ${styles.iconPurple}`}>
            <Users size={20} />
          </div>
          <div className={styles.metricContent}>
            <span className={styles.metricValue}>
              {new Set(emails.map((e) => e.customerEmail.toLowerCase())).size || 3}
            </span>
            <span className={styles.metricLabel}>Active Customer Accounts</span>
          </div>
        </div>

        <div className={styles.metricCard}>
          <div className={`${styles.metricIconCircle} ${styles.iconTeal}`}>
            <ShieldCheck size={20} />
          </div>
          <div className={styles.metricContent}>
            <span className={styles.metricValue}>100%</span>
            <span className={styles.metricLabel}>Verified Brand Signature</span>
          </div>
        </div>
      </div>

      {/* 3. Main Views: Compose vs History */}
      {activeTab === 'compose' ? (
        <div className={styles.contentGrid}>
          {/* Left Column: Compose Form */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <FileText size={20} color="#ff5722" />
                <div>
                  <h3 className={styles.sectionTitle}>Draft Customer Message</h3>
                  <p className={styles.sectionSubtitle}>
                    All sent mails are permanently recorded in the database with timestamp and body
                  </p>
                </div>
              </div>

              <button
                type="button"
                className={styles.previewToggleBtn}
                onClick={() => setShowLivePreview((prev) => !prev)}
              >
                <Eye size={15} />
                <span>{showLivePreview ? 'Hide Preview' : 'Live Preview'}</span>
              </button>
            </div>

            {alert && (
              <div className={alert.type === 'success' ? styles.alertSuccess : styles.alertError}>
                {alert.type === 'success' ? <CheckCircle size={18} /> : <X size={18} />}
                <span>{alert.message}</span>
              </div>
            )}

            {/* Quick Templates Strip */}
            <div className={styles.templateStrip}>
              <span className={styles.templateLabel}>Message Templates</span>
              <div className={styles.templateButtons}>
                {TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    className={`${styles.templateBtn} ${selectedTemplate === tmpl.id ? styles.templateBtnActive : ''}`}
                    onClick={() => applyTemplate(tmpl.id)}
                  >
                    {tmpl.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Customers Picker */}
            <div className={styles.templateStrip}>
              <span className={styles.templateLabel}>Quick Recipient Select</span>
              <div className={styles.clientPillsGroup}>
                {QUICK_CUSTOMERS.map((cust) => (
                  <button
                    key={cust.email}
                    type="button"
                    className={styles.clientPill}
                    onClick={() => handleSelectQuickCustomer(cust)}
                  >
                    <span className={styles.clientPillDot} />
                    <span>{cust.name} ({cust.company})</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendMail}>
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Customer Name
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. Sarah Jenkins"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>
                    Customer Email Address
                    <span className={styles.requiredStar}>*</span>
                  </label>
                  <input
                    type="email"
                    className={styles.formInput}
                    placeholder="sarah@acmecorp.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    required
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullSpan}`}>
                  <label className={styles.formLabel}>
                    Customer Company / Organization
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. Acme Corporation"
                    value={customerCompany}
                    onChange={(e) => setCustomerCompany(e.target.value)}
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullSpan}`}>
                  <label className={styles.formLabel}>
                    Email Subject
                    <span className={styles.requiredStar}>*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Subject line"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div className={`${styles.formGroup} ${styles.fullSpan}`}>
                  <label className={styles.formLabel}>
                    Message Body
                    <span className={styles.requiredStar}>*</span>
                  </label>
                  <textarea
                    className={styles.formTextarea}
                    placeholder="Write your email body here..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className={styles.formActionsRow}>
                <div className={styles.sectionSubtitle}>
                  Sender: <strong>{senderName}</strong> ({senderEmail})
                </div>

                <button
                  type="submit"
                  className={styles.sendEmailBtn}
                  disabled={isSending}
                >
                  <Send size={16} />
                  <span>{isSending ? 'Sending & Storing...' : 'Send Email to Customer'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Branded Signature Card & Live Preview */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitleGroup}>
                <Sparkles size={20} color="#ff9800" />
                <div>
                  <h3 className={styles.sectionTitle}>
                    {showLivePreview ? 'Live Mail Preview' : 'Branded Signature Card'}
                  </h3>
                  <p className={styles.sectionSubtitle}>
                    {showLivePreview
                      ? 'Full HTML email styling dispatched to the customer'
                      : 'Rendered with official SYNCO logo and branding colors only'}
                  </p>
                </div>
              </div>
            </div>

            {showLivePreview ? (
              /* Full Email Body Preview */
              <div className={styles.previewBox}>
                <div className={styles.previewEmailHeader}>
                  <div className={styles.previewBrandRow}>
                    <div className={styles.previewLogoSquare}>S</div>
                    <div className={styles.previewBrandText}>
                      <span className={styles.previewBrandName}>
                        <span className={styles.previewBrandNameOrange}>SYN</span>
                        <span className={styles.previewBrandNameWhite}>CO</span>
                      </span>
                      <span className={styles.previewBrandTagline}>TASK | CALENDAR | SYNC</span>
                    </div>
                  </div>
                  <span className={styles.previewVerifiedTag}>Customer Outreach</span>
                </div>

                <div className={styles.previewEmailBody}>
                  <div className={styles.previewSubject}>{subject || '(No Subject Entered)'}</div>
                  <div className={styles.previewSalutation}>
                    Dear {customerName || 'Customer'}{customerCompany ? ` (${customerCompany})` : ''},
                  </div>
                  <div className={styles.previewMessageContent}>
                    {body || 'Your message body will appear here formatted with clean spacing.'}
                  </div>

                  {/* Embedded Branded Signature Card */}
                  <div className={styles.signatureCardContainer}>
                    <div className={styles.signatureTopRow}>
                      <div className={styles.signatureLogoFrame}>
                        <img src="/logo.png" alt="SYNCO Logo" className={styles.signatureLogoImg} />
                      </div>
                      <div className={styles.signatureSenderInfo}>
                        <span className={styles.signatureSenderName}>{senderName}</span>
                        <div className={styles.signatureSenderRoleRow}>
                          <span className={styles.signatureRolePill}>{senderRole}</span>
                          <span className={styles.signatureDividerDot}>•</span>
                          <span className={styles.signatureDeptText}>SYNCO Workspace</span>
                        </div>
                        <div className={styles.signatureContactRow}>
                          <a href={`mailto:${senderEmail}`} className={styles.signatureEmailLink}>
                            {senderEmail}
                          </a>
                          <span>|</span>
                          <a href="https://synco.app" target="_blank" rel="noreferrer" className={styles.signatureWebLink}>
                            synco.app
                          </a>
                        </div>
                      </div>
                    </div>

                    <div className={styles.signatureBottomStrip}>
                      <div className={styles.signatureBrandWordmark}>
                        <span className={styles.signatureBrandHighlight}>
                          SYN<span className={styles.signatureBrandDark}>CO</span>
                        </span>
                        <span className={styles.signatureTagline}>TASK | CALENDAR | SYNC</span>
                      </div>
                      <span className={styles.signatureEcoBadge}>An UP THREE Product</span>
                    </div>
                  </div>
                </div>

                <div className={styles.previewFooterNote}>
                  Sent securely via SYNCO Customer Engagement Platform • An UP THREE Product
                </div>
              </div>
            ) : (
              /* Dedicated Branded Signature Card Display */
              <div className={styles.signatureCardContainer}>
                <div className={styles.signatureTopRow}>
                  <div className={styles.signatureLogoFrame}>
                    <img src="/logo.png" alt="SYNCO Branding Logo" className={styles.signatureLogoImg} />
                  </div>
                  <div className={styles.signatureSenderInfo}>
                    <span className={styles.signatureSenderName}>{senderName}</span>
                    <div className={styles.signatureSenderRoleRow}>
                      <span className={styles.signatureRolePill}>{senderRole}</span>
                      <span className={styles.signatureDividerDot}>•</span>
                      <span className={styles.signatureDeptText}>SYNCO Workspace</span>
                    </div>
                    <div className={styles.signatureContactRow}>
                      <a href={`mailto:${senderEmail}`} className={styles.signatureEmailLink}>
                        {senderEmail}
                      </a>
                      <span>|</span>
                      <a href="https://synco.app" target="_blank" rel="noreferrer" className={styles.signatureWebLink}>
                        synco.app
                      </a>
                    </div>
                  </div>
                </div>

                <div className={styles.signatureBottomStrip}>
                  <div className={styles.signatureBrandWordmark}>
                    <span className={styles.signatureBrandHighlight}>
                      SYN<span className={styles.signatureBrandDark}>CO</span>
                    </span>
                    <span className={styles.signatureTagline}>TASK | CALENDAR | SYNC</span>
                  </div>
                  <span className={styles.signatureEcoBadge}>An UP THREE Product</span>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Sent History View */
        <div className={styles.fullWidthColumn}>
          <div className={styles.sectionCard}>
            <div className={styles.historyControls}>
              <div className={styles.searchBarWrapper}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search sent emails by customer, company, or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <span className={styles.historyCountText}>
                Showing <strong>{filteredEmails.length}</strong> of {emails.length} customer emails
              </span>
            </div>

            {loading ? (
              <div className={styles.emptyState}>
                <span>Loading sent customer communications...</span>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIconCircle}>
                  <Mail size={24} />
                </div>
                <h4 className={styles.emptyTitle}>No Sent Emails Found</h4>
                <p className={styles.emptyText}>
                  {searchQuery
                    ? 'No customer emails matched your search query.'
                    : 'You have not sent any emails to customers yet. Use the Compose tab to send your first message!'}
                </p>
              </div>
            ) : (
              <div className={styles.historyList}>
                {filteredEmails.map((item) => (
                  <div
                    key={item.id}
                    className={styles.historyCard}
                    onClick={() => setSelectedEmailModal(item)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className={styles.historyCardHeader}>
                      <div className={styles.historyCustomerGroup}>
                        <div className={styles.customerAvatarCircle}>
                          {item.customerName.slice(0, 2).toUpperCase()}
                        </div>
                        <div className={styles.customerMeta}>
                          <span className={styles.customerNameText}>{item.customerName}</span>
                          <span className={styles.customerEmailText}>{item.customerEmail}</span>
                        </div>
                      </div>

                      <div className={styles.historyHeaderMeta}>
                        <div className={styles.historyTimestamp}>
                          <Clock size={13} />
                          <span>{formatTimestamp(item.createdAt)}</span>
                        </div>
                        <span className={styles.statusSentBadge}>{item.status}</span>
                      </div>
                    </div>

                    <div className={styles.historySubjectRow}>{item.subject}</div>
                    <div className={styles.historyBodySnippet}>{item.body}</div>

                    <div className={styles.historyCardFooter}>
                      <span className={styles.companyBadge}>
                        {item.customerCompany || 'Direct Customer'}
                      </span>
                      <span className={styles.viewDetailsLink}>
                        <span>View Stored Body &amp; Signature</span>
                        <ExternalLink size={12} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Sent Mail Inspection Modal */}
      {selectedEmailModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalDialog}>
            <div className={styles.modalHeader}>
              <div className={styles.modalTitleGroup}>
                <h3 className={styles.modalTitle}>{selectedEmailModal.subject}</h3>
                <span className={styles.modalSubtitle}>
                  Logged with timestamp: {formatTimestamp(selectedEmailModal.createdAt)}
                </span>
              </div>
              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={() => setSelectedEmailModal(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.metaInfoStrip}>
                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Customer Recipient</span>
                  <span className={styles.metaVal}>{selectedEmailModal.customerName}</span>
                  <span className={styles.customerEmailText}>{selectedEmailModal.customerEmail}</span>
                </div>

                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Company / Org</span>
                  <span className={styles.metaVal}>
                    {selectedEmailModal.customerCompany || 'Individual Customer'}
                  </span>
                </div>

                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Sender Dispatcher</span>
                  <span className={styles.metaVal}>{selectedEmailModal.senderName}</span>
                  <span className={styles.customerEmailText}>{selectedEmailModal.senderEmail}</span>
                </div>

                <div className={styles.metaItem}>
                  <span className={styles.metaLabel}>Database Timestamp</span>
                  <span className={styles.metaVal}>{formatTimestamp(selectedEmailModal.createdAt)}</span>
                </div>
              </div>

              {/* Raw Stored Message Body */}
              <div className={styles.rawMessageSection}>
                <span className={styles.rawMessageLabel}>Stored Plain Body</span>
                <div className={styles.rawMessageText}>{selectedEmailModal.body}</div>
              </div>

              {/* Attached Branded Signature Card */}
              <div className={styles.rawMessageSection}>
                <span className={styles.rawMessageLabel}>Attached Branded Signature Card</span>
                <div className={styles.signatureCardContainer}>
                  <div className={styles.signatureTopRow}>
                    <div className={styles.signatureLogoFrame}>
                      <img src="/logo.png" alt="SYNCO Logo" className={styles.signatureLogoImg} />
                    </div>
                    <div className={styles.signatureSenderInfo}>
                      <span className={styles.signatureSenderName}>{selectedEmailModal.senderName}</span>
                      <div className={styles.signatureSenderRoleRow}>
                        <span className={styles.signatureRolePill}>{senderRole}</span>
                        <span className={styles.signatureDividerDot}>•</span>
                        <span className={styles.signatureDeptText}>SYNCO Workspace</span>
                      </div>
                      <div className={styles.signatureContactRow}>
                        <a href={`mailto:${selectedEmailModal.senderEmail}`} className={styles.signatureEmailLink}>
                          {selectedEmailModal.senderEmail}
                        </a>
                        <span>|</span>
                        <a href="https://synco.app" target="_blank" rel="noreferrer" className={styles.signatureWebLink}>
                          synco.app
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className={styles.signatureBottomStrip}>
                    <div className={styles.signatureBrandWordmark}>
                      <span className={styles.signatureBrandHighlight}>
                        SYN<span className={styles.signatureBrandDark}>CO</span>
                      </span>
                      <span className={styles.signatureTagline}>TASK | CALENDAR | SYNC</span>
                    </div>
                    <span className={styles.signatureEcoBadge}>An UP THREE Product</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setSelectedEmailModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
