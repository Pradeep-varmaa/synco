import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { query } from '@/lib/db';

const INITIAL_TEMPLATES = [
  {
    name: 'task_assigned',
    subject: 'New Task Assigned: {task_title}',
    variables: '{user_name}, {task_title}, {priority}, {due_date}, {category}, {description}, {task_url}',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
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
      <a href="{task_url}" style="background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%); color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">View Task in SYNCO</a>
    </div>
  </div>
  <div style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
    SYNCO Platform • An UP THREE Product
  </div>
</div>`,
  },
  {
    name: 'user_invitation',
    subject: 'Welcome to {organization_name} on SYNCO - Your Account Details',
    variables: '{user_name}, {organization_name}, {email}, {default_password}, {role}, {login_url}',
    body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
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

    <p style="font-size: 13px; color: #64748b; line-height: 1.5;">Please log in using your email and default password. You can manage your tasks, sync your calendar, and change your password in your Settings.</p>

    <div style="text-align: center; margin: 28px 0 16px 0;">
      <a href="{login_url}" style="background: linear-gradient(135deg, #ff9800 0%, #ff5722 100%); color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; display: inline-block;">Sign In to Your Workspace</a>
    </div>
  </div>
  <div style="background-color: #f8fafc; padding: 16px 24px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center;">
    SYNCO Platform • An UP THREE Product
  </div>
</div>`,
  },
];

// Ensure mail_templates table exists and seed defaults if empty
async function ensureTemplatesTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS mail_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) UNIQUE,
      subject VARCHAR(255),
      body TEXT,
      variables TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )
  `);

  for (const t of INITIAL_TEMPLATES) {
    try {
      await query(
        `INSERT INTO mail_templates (name, subject, body, variables)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (name) DO NOTHING`,
        [t.name, t.subject, t.body, t.variables]
      );
    } catch {
      // Ignore conflict
    }
  }
}

export async function GET() {
  try {
    await ensureTemplatesTable();
    const res = await query('SELECT * FROM mail_templates ORDER BY name ASC');
    if (res && res.rows.length > 0) {
      return NextResponse.json({ success: true, templates: res.rows });
    }
    return NextResponse.json({ success: true, templates: INITIAL_TEMPLATES });
  } catch (err) {
    console.error('Failed to get mail templates:', err);
    return NextResponse.json({ success: true, templates: INITIAL_TEMPLATES });
  }
}

export async function PUT(req: Request) {
  try {
    // Only authenticated members can edit templates
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized: Members only' }, { status: 401 });
    }

    const body = await req.json();
    const { name, subject, body: templateBody } = body;

    if (!name || !subject || !templateBody) {
      return NextResponse.json({ error: 'Name, subject, and body are required' }, { status: 400 });
    }

    await ensureTemplatesTable();

    const dbRes = await query(
      `INSERT INTO mail_templates (name, subject, body, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (name) DO UPDATE
       SET subject = EXCLUDED.subject,
           body = EXCLUDED.body,
           updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [name, subject, templateBody]
    );

    if (dbRes && dbRes.rows.length > 0) {
      return NextResponse.json({ success: true, template: dbRes.rows[0] });
    }

    return NextResponse.json({ success: true, template: { name, subject, body: templateBody } });
  } catch (err) {
    console.error('Failed to update mail template:', err);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}
