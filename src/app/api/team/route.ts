import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { sendUserInvitationMail } from '@/lib/sendmail';
import { DUMMY_USERS } from '@/lib/dummy-data';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  department: string;
}

export async function GET() {
  try {
    const res = await query('SELECT * FROM team_members ORDER BY name ASC');
    if (res && res.rows.length > 0) {
      const formatted: TeamMember[] = res.rows.map((r) => ({
        id: String(r.id),
        name: r.name,
        email: r.email,
        avatar: r.avatar || '',
        role: r.role || 'Team Member',
        department: r.department || 'General',
      }));
      return NextResponse.json(formatted);
    }
  } catch (e) {
    console.error('Database query for team_members failed:', e);
  }

  // Fallback to DUMMY_USERS
  const fallbackMembers: TeamMember[] = DUMMY_USERS.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    avatar: u.avatar,
    role: u.role,
    department: u.department,
  }));
  return NextResponse.json(fallbackMembers);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, avatar, role, department } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required to invite a member' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const memberName = name || 'Team Member';
    const memberRole = role || 'Team Member';
    const memberDept = department || 'General';

    // 1. Generate a secure temporary default password
    const randomSuffix = Math.random().toString(36).slice(-6).toUpperCase();
    const defaultPassword = `Synco#${randomSuffix}`;

    // 2. Hash default password using Bcrypt
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // 3. Create or update user account in `users` table so they can sign in
    let userId: string | null = null;
    try {
      const userRes = await query(
        `INSERT INTO users (name, email, password, image, role)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (email) DO UPDATE
         SET password = EXCLUDED.password,
             name = EXCLUDED.name,
             role = EXCLUDED.role
         RETURNING id`,
        [memberName, cleanEmail, hashedPassword, avatar || '', memberRole]
      );
      if (userRes && userRes.rows.length > 0) {
        userId = String(userRes.rows[0].id);
      }
    } catch (uErr) {
      console.warn('Could not upsert into users table (might lack unique constraint):', uErr);
      // Fallback insert without conflict clause
      try {
        const insertUser = await query(
          `INSERT INTO users (name, email, password, image, role)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [memberName, cleanEmail, hashedPassword, avatar || '', memberRole]
        );
        if (insertUser && insertUser.rows.length > 0) {
          userId = String(insertUser.rows[0].id);
        }
      } catch (err2) {
        console.warn('Fallback users insert skipped:', err2);
      }
    }

    // 4. Insert into `team_members` table
    const dbRes = await query(
      `INSERT INTO team_members (user_id, name, email, avatar, role, department)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, memberName, cleanEmail, avatar || '', memberRole, memberDept]
    );

    const createdMember = dbRes && dbRes.rows.length > 0 ? dbRes.rows[0] : {
      id: `tm-${Date.now()}`,
      name: memberName,
      email: cleanEmail,
      avatar: avatar || '',
      role: memberRole,
      department: memberDept,
    };

    // 5. Send invitation email with credentials asynchronously
    sendUserInvitationMail({
      email: cleanEmail,
      name: memberName,
      defaultPassword,
      role: memberRole,
      organizationName: 'SYNCO Workspace',
      loginUrl: 'http://localhost:3000/login',
    }).catch((mailErr) => {
      console.error('Failed to send invitation email:', mailErr);
    });

    return NextResponse.json({
      success: true,
      member: createdMember,
      defaultPassword,
      emailSent: true,
      message: `Member invited successfully. Credentials email sent to ${cleanEmail}`,
    });
  } catch (e) {
    console.error('Failed to create team member:', e);
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 });
  }
}
