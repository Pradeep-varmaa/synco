import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

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

  // Return empty list when no team members exist
  return NextResponse.json([]);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, avatar, role, department } = body;

    const dbRes = await query(
      `INSERT INTO team_members (name, email, avatar, role, department)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, email, avatar || '', role || 'Team Member', department || 'General']
    );

    if (dbRes && dbRes.rows.length > 0) {
      return NextResponse.json({ success: true, member: dbRes.rows[0] });
    }

    return NextResponse.json({
      success: true,
      member: {
        id: `tm-${Date.now()}`,
        name,
        email,
        avatar: avatar || '',
        role: role || 'Team Member',
        department: department || 'General',
      },
    });
  } catch (e) {
    console.error('Failed to create team member:', e);
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 });
  }
}
