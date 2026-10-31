import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/current-user';
import { sendCustomerMail } from '@/lib/sendmail';
import { DUMMY_CUSTOMER_EMAILS, addDummyCustomerEmail, DummyCustomerEmail } from '@/lib/dummy-data';

// Auto-ensure table exists in Neon PostgreSQL
async function ensureCustomerEmailsTable() {
  try {
    await query(`
      CREATE TABLE IF NOT EXISTS customer_emails (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        sender_name VARCHAR(255),
        sender_email VARCHAR(255),
        customer_name VARCHAR(255),
        customer_email VARCHAR(255) NOT NULL,
        customer_company VARCHAR(255),
        subject VARCHAR(255) NOT NULL,
        body TEXT NOT NULL,
        html_content TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'SENT',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
  } catch (err) {
    console.warn('Could not ensure customer_emails table exists:', err);
  }
}

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await ensureCustomerEmailsTable();

  try {
    const res = await query(
      `SELECT * FROM customer_emails
       WHERE user_id::text = $1
       ORDER BY created_at DESC`,
      [currentUser.id]
    );

    if (res && res.rows.length > 0) {
      const formatted = res.rows.map((r) => ({
        id: String(r.id),
        userId: String(r.user_id),
        senderName: r.sender_name || currentUser.name,
        senderEmail: r.sender_email || currentUser.email,
        customerName: r.customer_name,
        customerEmail: r.customer_email,
        customerCompany: r.customer_company || '',
        subject: r.subject,
        body: r.body,
        htmlContent: r.html_content || '',
        status: r.status || 'SENT',
        createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at || new Date().toISOString(),
      }));
      return NextResponse.json(formatted);
    }
  } catch (err) {
    console.warn('Database query for customer_emails failed, using fallback:', err);
  }

  // Fallback to user-isolated dummy customer emails
  const userEmails = DUMMY_CUSTOMER_EMAILS.filter((e) => e.userId === currentUser.id);
  return NextResponse.json(userEmails);
}

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await req.json();
    const { customerName, customerEmail, customerCompany, subject, body } = data;

    if (!customerEmail || !customerEmail.trim()) {
      return NextResponse.json({ error: 'Recipient customer email is required' }, { status: 400 });
    }

    if (!subject || !subject.trim()) {
      return NextResponse.json({ error: 'Email subject is required' }, { status: 400 });
    }

    if (!body || !body.trim()) {
      return NextResponse.json({ error: 'Email body cannot be empty' }, { status: 400 });
    }

    const cleanCustomerName = customerName?.trim() || 'Valued Customer';
    const cleanCustomerEmail = customerEmail.trim();
    const cleanCustomerCompany = customerCompany?.trim() || '';
    const cleanSubject = subject.trim();
    const cleanBody = body.trim();

    // 1. Dispatch email with stylized body and branded signature card
    const dispatchResult = await sendCustomerMail({
      senderName: currentUser.name,
      senderEmail: currentUser.email,
      senderRole: currentUser.role,
      senderDepartment: currentUser.department,
      customerName: cleanCustomerName,
      customerEmail: cleanCustomerEmail,
      customerCompany: cleanCustomerCompany,
      subject: cleanSubject,
      body: cleanBody,
    });

    const htmlContent = dispatchResult.html;
    const nowIso = new Date().toISOString();

    // 2. Persist email in Neon DB with timestamp and full body
    await ensureCustomerEmailsTable();
    let storedId = `mail-${Date.now()}`;

    try {
      const insertRes = await query(
        `INSERT INTO customer_emails 
         (user_id, sender_name, sender_email, customer_name, customer_email, customer_company, subject, body, html_content, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, created_at`,
        [
          currentUser.id,
          currentUser.name,
          currentUser.email,
          cleanCustomerName,
          cleanCustomerEmail,
          cleanCustomerCompany,
          cleanSubject,
          cleanBody,
          htmlContent,
          'SENT',
        ]
      );

      if (insertRes && insertRes.rows.length > 0) {
        storedId = String(insertRes.rows[0].id);
      }
    } catch (dbErr) {
      console.warn('Failed to insert customer email to database, storing in-memory:', dbErr);
    }

    // 3. Keep in-memory store synchronized
    const newRecord: DummyCustomerEmail = {
      id: storedId,
      userId: currentUser.id,
      senderName: currentUser.name,
      senderEmail: currentUser.email,
      customerName: cleanCustomerName,
      customerEmail: cleanCustomerEmail,
      customerCompany: cleanCustomerCompany,
      subject: cleanSubject,
      body: cleanBody,
      htmlContent,
      status: 'SENT',
      createdAt: nowIso,
    };
    addDummyCustomerEmail(newRecord);

    return NextResponse.json({
      success: true,
      message: 'Email dispatched and stored with timestamp successfully',
      email: newRecord,
    });
  } catch (err) {
    console.error('Failed to send customer email:', err);
    return NextResponse.json({ error: 'Failed to process and send customer email' }, { status: 500 });
  }
}
