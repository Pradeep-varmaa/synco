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
