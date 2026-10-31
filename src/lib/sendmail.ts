import nodemailer from 'nodemailer';
import { query } from '@/lib/db';

// SMTP Transporter configured from .env.local Email credentials
const emailUser = process.env.Email_id || process.env.EMAIL_ID || '';
const emailPass = process.env.Email_pass || process.env.EMAIL_PASS || '';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

export interface MailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Default Fallback Templates (used if database has not been seeded yet)
const DEFAULT_TEMPLATES: Record<string, { subject: string; body: string }> = {
  task_assigned: {
    subject: 'New Task Assigned: {task_title}',
    body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #11161d 0%, #1e293b 100%); padding: 24px; color: #ffffff; border-bottom: 2px solid #ff5722;">
        <h2 style="margin: 0; font-size: 20px; color: #ffffff;">SYNCO Task Assignment</h2>
        <span style="font-size: 11px; color: #94a3b8; letter-spacing: 0.1em; text-transform: uppercase;">TASK | CALENDAR | SYNC</span>
      </div>
      <div style="padding: 24px; color: #1e293b;">
        <p style="font-size: 16px; margin: 0 0 16px 0;">Hello <strong>{user_name}</strong>,</p>
        <p style="margin: 0 0 16px 0; color: #475569;">You have been assigned a new task in your organization workspace:</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid #ff5722; padding: 16px; border-radius: 6px; margin: 20px 0;">
          <h3 style="margin: 0 0 10px 0; font-size: 18px; color: #0f172a;">{task_title}</h3>
          <p style="margin: 4px 0; font-size: 14px; color: #475569;"><strong>Priority:</strong> <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 12px; font-weight: bold; background-color: #fff3e0; color: #e64a19;">{priority}</span></p>
          <p style="margin: 4px 0; font-size: 14px; color: #475569;"><strong>Due Date:</strong> {due_date}</p>
          <p style="margin: 4px 0; font-size: 14px; color: #475569;"><strong>Category:</strong> {category}</p>
          <p style="margin: 12px 0 0 0; font-size: 14px; color: #334155; line-height: 1.5;">{description}</p>
        </div>

        <div style="text-align: center; margin: 28px 0 16px 0;">
          <a href="{task_url}" style="background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%); color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(255, 87, 34, 0.35);">View Task in SYNCO</a>
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
        SYNCO Platform • An UP THREE Product
      </div>
    </div>`,
  },
  user_invitation: {
    subject: 'Welcome to {organization_name} on SYNCO - Your Account Details',
    body: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #11161d 0%, #1e293b 100%); padding: 24px; color: #ffffff; border-bottom: 2px solid #ff5722;">
        <h2 style="margin: 0; font-size: 20px; color: #ffffff;">Welcome to SYNCO</h2>
        <span style="font-size: 11px; color: #94a3b8; letter-spacing: 0.1em; text-transform: uppercase;">TASK | CALENDAR | SYNC</span>
      </div>
      <div style="padding: 24px; color: #1e293b;">
        <p style="font-size: 16px; margin: 0 0 16px 0;">Hello <strong>{user_name}</strong>,</p>
        <p style="margin: 0 0 16px 0; color: #475569;">You have been invited to join <strong>{organization_name}</strong> on SYNCO.</p>
        
        <p style="margin: 0 0 8px 0; color: #475569;">Your account has been created with the following login credentials:</p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 4px 0; font-size: 14px;"><strong>Login Portal:</strong> <a href="{login_url}" style="color: #ff5722; text-decoration: underline;">{login_url}</a></p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> {email}</p>
          <p style="margin: 8px 0 4px 0; font-size: 14px;"><strong>Default Temporary Password:</strong></p>
          <div style="display: inline-block; background-color: #fff3e0; border: 1px solid #ffcc80; color: #e64a19; font-family: monospace; font-size: 16px; font-weight: bold; padding: 8px 14px; border-radius: 6px; margin-top: 4px;">
            {default_password}
          </div>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">Please log in using your email and default password. You can manage your tasks, sync your calendar, and change your password at any time in your Settings.</p>

        <div style="text-align: center; margin: 28px 0 16px 0;">
          <a href="{login_url}" style="background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%); color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(255, 87, 34, 0.35);">Sign In to Your Workspace</a>
        </div>
      </div>
      <div style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
        SYNCO Platform • An UP THREE Product
      </div>
    </div>`,
  },
};

// Dynamically fetch template from database with fallback to default
export async function getMailTemplate(name: string): Promise<{ subject: string; body: string }> {
  try {
    const res = await query('SELECT subject, body FROM mail_templates WHERE name = $1 LIMIT 1', [name]);
    if (res && res.rows.length > 0) {
      return {
        subject: res.rows[0].subject,
        body: res.rows[0].body,
      };
    }
  } catch (err) {
    console.warn(`Could not fetch mail template '${name}' from DB, falling back to default:`, err);
  }

  return DEFAULT_TEMPLATES[name] || {
    subject: 'Notification from SYNCO',
    body: '<p>You have a new notification from SYNCO.</p>',
  };
}

// Substitute placeholder tokens {variable_name} with actual values
export function populateTemplate(template: string, vars: Record<string, string>): string {
  let output = template;
  for (const [key, val] of Object.entries(vars)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    output = output.replace(regex, val || '');
  }
  return output;
}

// Send standard email
export async function sendMail(options: MailOptions) {
  if (!emailUser || !emailPass) {
    console.warn('⚠️ Mailer warning: Email credentials (Email_id/Email_pass) not configured in environment.');
    return { success: false, reason: 'Credentials not configured' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"SYNCO Workspace" <${emailUser}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.subject,
    });

    console.log(`📧 Email dispatched successfully to ${options.to} (Message ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ Failed to send email to ${options.to}:`, error);
    return { success: false, error };
  }
}

// Task assignment notification mail
export async function sendTaskAssignmentMail(params: {
  assigneeEmail: string;
  assigneeName: string;
  taskTitle: string;
  priority?: string;
  dueDate?: string;
  category?: string;
  description?: string;
  taskUrl?: string;
}) {
  const template = await getMailTemplate('task_assigned');

  const formattedDate = params.dueDate
    ? new Date(params.dueDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No due date set';

  const vars: Record<string, string> = {
    user_name: params.assigneeName || 'Team Member',
    task_title: params.taskTitle,
    priority: params.priority || 'MEDIUM',
    due_date: formattedDate,
    category: params.category || 'General',
    description: params.description || 'No additional details provided.',
    taskUrl: params.taskUrl || 'http://localhost:3000/tasks',
    task_url: params.taskUrl || 'http://localhost:3000/tasks',
  };

  const subject = populateTemplate(template.subject, vars);
  const html = populateTemplate(template.body, vars);

  return sendMail({
    to: params.assigneeEmail,
    subject,
    html,
  });
}

// User invitation / account creation notification mail with default password
export async function sendUserInvitationMail(params: {
  email: string;
  name: string;
  defaultPassword: string;
  role?: string;
  organizationName?: string;
  loginUrl?: string;
}) {
  const template = await getMailTemplate('user_invitation');

  const vars: Record<string, string> = {
    user_name: params.name || 'Team Member',
    organization_name: params.organizationName || 'SYNCO Workspace',
    email: params.email,
    default_password: params.defaultPassword,
    role: params.role || 'Member',
    login_url: params.loginUrl || 'http://localhost:3000/login',
  };

  const subject = populateTemplate(template.subject, vars);
  const html = populateTemplate(template.body, vars);

  return sendMail({
    to: params.email,
    subject,
    html,
  });
}

// Generate styled HTML body with the Branded Signature Card
export function generateCustomerMailHtml(params: {
  senderName: string;
  senderEmail: string;
  senderRole?: string;
  senderDepartment?: string;
  customerName: string;
  customerCompany?: string;
  subject: string;
  body: string;
}): string {
  const {
    senderName,
    senderEmail,
    senderRole = 'Solutions Specialist',
    senderDepartment = 'Customer Success',
    customerName,
    customerCompany,
    subject,
    body,
  } = params;

  // Format body text with paragraphs
  const paragraphs = body
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map(
      (line) =>
        `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.65; color: #334155;">${line}</p>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 24px 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width: 620px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);">
    
    <!-- Branded Header with SYNCO Fiery Theme -->
    <tr>
      <td style="background: linear-gradient(135deg, #11161d 0%, #1e293b 100%); padding: 24px 30px; border-bottom: 3px solid #ff5722;">
        <table cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="vertical-align: middle;">
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="vertical-align: middle; padding-right: 12px;">
                    <!-- Logo Avatar / Badge -->
                    <div style="width: 42px; height: 42px; border-radius: 10px; background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%); display: inline-block; text-align: center; line-height: 42px; color: #ffffff; font-weight: 800; font-size: 20px; box-shadow: 0 2px 10px rgba(255, 87, 34, 0.45);">
                      S
                    </div>
                  </td>
                  <td style="vertical-align: middle;">
                    <div style="font-size: 20px; font-weight: 800; letter-spacing: -0.02em; line-height: 1.1;">
                      <span style="color: #ff9800;">SYN</span><span style="color: #ffffff;">CO</span>
                    </div>
                    <div style="font-size: 10px; font-weight: 700; letter-spacing: 0.12em; color: #94a3b8; text-transform: uppercase; margin-top: 2px;">
                      TASK <span style="color: #ff5722;">|</span> CALENDAR <span style="color: #ff5722;">|</span> SYNC
                    </div>
                  </td>
                </tr>
              </table>
            </td>
            <td style="text-align: right; vertical-align: middle;">
              <span style="display: inline-block; background-color: rgba(255, 87, 34, 0.15); border: 1px solid #ff5722; color: #ff9800; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 4px 10px; border-radius: 9999px;">
                Verified Outreach
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Main Message Body -->
    <tr>
      <td style="padding: 30px 32px 20px 32px; background-color: #ffffff;">
        <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 18px;">
          Dear ${customerName}${customerCompany ? ` (${customerCompany})` : ''},
        </div>

        ${paragraphs}

        <!-- Branded Signature Card with Logo and Brand Colors Only -->
        <table cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top: 28px; background-color: #ffffff; border: 1.5px solid #ffedd5; border-left: 4px solid #ff5722; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(255, 87, 34, 0.07);">
          <tr>
            <td style="padding: 18px 22px;">
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="width: 56px; vertical-align: middle; padding-right: 16px;">
                    <div style="width: 52px; height: 52px; border-radius: 12px; background: linear-gradient(135deg, #11161d 0%, #1e293b 100%); border: 2px solid #ff5722; text-align: center; line-height: 50px; box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);">
                      <span style="font-size: 22px; font-weight: 800; color: #ff5722; font-family: sans-serif;">S</span>
                    </div>
                  </td>
                  <td style="vertical-align: middle;">
                    <div style="font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">
                      ${senderName}
                    </div>
                    <div style="font-size: 12px; font-weight: 700; color: #ff5722; letter-spacing: 0.03em; text-transform: uppercase; margin-bottom: 4px;">
                      ${senderRole} <span style="color: #cbd5e1; font-weight: normal;">•</span> <span style="color: #475569;">${senderDepartment}</span>
                    </div>
                    <div style="font-size: 12px; color: #64748b; line-height: 1.4;">
                      <a href="mailto:${senderEmail}" style="color: #ff5722; text-decoration: none; font-weight: 500;">${senderEmail}</a>
                      <span style="color: #cbd5e1; margin: 0 6px;">|</span>
                      <a href="https://synco.app" style="color: #0f172a; text-decoration: none; font-weight: 600;">synco.app</a>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Bottom Signature Branding Strip -->
              <div style="margin-top: 14px; padding-top: 10px; border-top: 1px dashed #fed7aa; display: flex; align-items: center; justify-content: space-between;">
                <span style="font-size: 11px; font-weight: 800; color: #ff5722; letter-spacing: 0.08em; text-transform: uppercase;">
                  SYN<span style="color: #0f172a;">CO</span>
                  <span style="font-size: 10px; color: #94a3b8; font-weight: 600; margin-left: 6px; letter-spacing: 0.05em;">TASK | CALENDAR | SYNC</span>
                </span>
                <span style="font-size: 11px; color: #ff5722; font-weight: 600;">
                  An UP THREE Product
                </span>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Footer Security Notice -->
    <tr>
      <td style="background-color: #f8fafc; padding: 18px 32px; border-top: 1px solid #edf2f7; text-align: center;">
        <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b; font-weight: 500;">
          Sent securely via SYNCO Customer Engagement Platform
        </p>
        <p style="margin: 0; font-size: 11px; color: #94a3b8;">
          © ${new Date().getFullYear()} SYNCO • All-in-one Productivity & Calendar Synchronization
        </p>
      </td>
    </tr>

  </table>
</body>
</html>
  `.trim();
}

// Customer email dispatch function
export async function sendCustomerMail(params: {
  senderName: string;
  senderEmail: string;
  senderRole?: string;
  senderDepartment?: string;
  customerName: string;
  customerEmail: string;
  customerCompany?: string;
  subject: string;
  body: string;
}) {
  const html = generateCustomerMailHtml(params);

  const mailResult = await sendMail({
    to: params.customerEmail,
    subject: params.subject,
    html,
    text: `${params.body}\n\n--\n${params.senderName} (${params.senderRole || 'SYNCO Team'})\n${params.senderEmail}\nSYNCO - TASK | CALENDAR | SYNC`,
  });

  return {
    ...mailResult,
    html,
  };
}
