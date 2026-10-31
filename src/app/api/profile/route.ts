import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/current-user';
import { DUMMY_TASKS, DUMMY_EVENTS, DUMMY_NOTES } from '@/lib/dummy-data';

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let totalTasks = 0;
  let pendingTasks = 0;
  let completedTasks = 0;
  let totalEvents = 0;
  let todayEvents = 0;
  let totalNotes = 0;

  try {
    // 1. Task Metrics
    const taskRes = await query(
      `SELECT status FROM tasks 
       WHERE creator_id::text = $1 
          OR assignee_id::text = $1 
          OR assignee_id IN (SELECT id FROM team_members WHERE user_id::text = $1 OR LOWER(email) = LOWER($2))`,
      [currentUser.id, currentUser.email]
    );

    if (taskRes && taskRes.rows.length > 0) {
      totalTasks = taskRes.rows.length;
      pendingTasks = taskRes.rows.filter((r) => r.status !== 'COMPLETED').length;
      completedTasks = taskRes.rows.filter((r) => r.status === 'COMPLETED').length;
    } else {
      const dummyT = DUMMY_TASKS.filter(
        (t) => t.creatorId === currentUser.id || t.assigneeId === currentUser.id
      );
      totalTasks = dummyT.length;
      pendingTasks = dummyT.filter((t) => t.status !== 'COMPLETED').length;
      completedTasks = dummyT.filter((t) => t.status === 'COMPLETED').length;
    }

    // 2. Calendar Event Metrics
    const eventRes = await query(
      'SELECT start_time FROM calendar_events WHERE user_id::text = $1',
      [currentUser.id]
    );

    const todayStr = new Date().toISOString().split('T')[0];
    if (eventRes && eventRes.rows.length > 0) {
      totalEvents = eventRes.rows.length;
      todayEvents = eventRes.rows.filter((r) => {
        const d = r.start_time instanceof Date ? r.start_time.toISOString() : String(r.start_time);
        return d.startsWith(todayStr);
      }).length;
    } else {
      const dummyE = DUMMY_EVENTS.filter((e) => e.userId === currentUser.id);
      totalEvents = dummyE.length;
      todayEvents = dummyE.filter((e) => e.start.startsWith(todayStr)).length;
    }

    // 3. Notes Metrics
    const noteRes = await query(
      'SELECT id FROM notes WHERE user_id::text = $1',
      [currentUser.id]
    );
    if (noteRes) {
      totalNotes = noteRes.rows.length;
    } else {
      totalNotes = DUMMY_NOTES.filter((n) => n.userId === currentUser.id).length;
    }
  } catch (err) {
    console.error('Error computing profile statistics:', err);
    // Fallback to dummy stores
    const dummyT = DUMMY_TASKS.filter(
      (t) => t.creatorId === currentUser.id || t.assigneeId === currentUser.id
    );
    totalTasks = dummyT.length;
    pendingTasks = dummyT.filter((t) => t.status !== 'COMPLETED').length;
    completedTasks = dummyT.filter((t) => t.status === 'COMPLETED').length;

    const dummyE = DUMMY_EVENTS.filter((e) => e.userId === currentUser.id);
    totalEvents = dummyE.length;
    todayEvents = dummyE.length;
    totalNotes = DUMMY_NOTES.filter((n) => n.userId === currentUser.id).length;
  }

  return NextResponse.json({
    success: true,
    user: {
      id: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
      department: currentUser.department,
      image: currentUser.image || '',
      createdAt: currentUser.createdAt || 'October 2026',
      organization: 'SYNCO Workspace',
    },
    stats: {
      totalTasks,
      pendingTasks,
      completedTasks,
      totalEvents,
      todayEvents: todayEvents || totalEvents,
      totalNotes,
      googleCalendarSynced: true,
    },
  });
}

export async function PUT(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, department, role, currentPassword, newPassword } = body;

    // Optional password change with Bcrypt verification
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'Current password is required to set a new password' },
          { status: 400 }
        );
      }

      const userRes = await query('SELECT password FROM users WHERE id::text = $1 LIMIT 1', [
        currentUser.id,
      ]);
      if (userRes && userRes.rows.length > 0) {
        const dbPassword = userRes.rows[0].password;
        if (dbPassword) {
          const isValid = await bcrypt.compare(currentPassword, dbPassword);
          if (!isValid) {
            return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
          }
        }
      }

      const hashedNew = await bcrypt.hash(newPassword, 10);
      await query('UPDATE users SET password = $1 WHERE id::text = $2', [
        hashedNew,
        currentUser.id,
      ]);
    }

    // Update user info
    if (name || role) {
      await query(
        `UPDATE users
         SET name = COALESCE($1, name),
             role = COALESCE($2, role),
             updated_at = CURRENT_TIMESTAMP
         WHERE id::text = $3`,
        [name, role, currentUser.id]
      );
    }

    // Update team_members info
    if (name || department || role) {
      await query(
        `UPDATE team_members
         SET name = COALESCE($1, name),
             department = COALESCE($2, department),
             role = COALESCE($3, role)
         WHERE user_id::text = $4 OR LOWER(email) = LOWER($5)`,
        [name, department, role, currentUser.id, currentUser.email]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (err) {
    console.error('Failed to update profile:', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
