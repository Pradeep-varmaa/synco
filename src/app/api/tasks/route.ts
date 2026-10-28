import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/current-user';
import { DUMMY_TASKS } from '@/lib/dummy-data';
import { sendTaskAssignmentMail } from '@/lib/sendmail';

export interface TaskItem {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string;
  assigneeId: string;
  assigneeName: string;
  assigneeAvatar?: string;
  category: string;
  syncToCalendar: boolean;
  createdAt: string;
}

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json([]);
  }

  try {
    const res = await query(
      `SELECT t.*, tm.name as assignee_name, tm.avatar as assignee_avatar
       FROM tasks t
       LEFT JOIN team_members tm ON t.assignee_id = tm.id
       WHERE t.creator_id::text = $1 
          OR t.assignee_id::text = $1 
          OR t.assignee_id IN (SELECT id FROM team_members WHERE user_id::text = $1 OR LOWER(email) = LOWER($2))
       ORDER BY t.created_at DESC`,
      [currentUser.id, currentUser.email]
    );

    if (res && res.rows.length > 0) {
      const formatted: TaskItem[] = res.rows.map((r) => ({
        id: String(r.id),
        title: r.title,
        description: r.description || '',
        status: r.status || 'TODO',
        priority: r.priority || 'MEDIUM',
        dueDate: r.due_date instanceof Date ? r.due_date.toISOString() : r.due_date || '',
        assigneeId: r.assignee_id || '',
        assigneeName: r.assignee_name || currentUser.name || 'Assigned to me',
        assigneeAvatar: r.assignee_avatar || '',
        category: r.category || 'General',
        syncToCalendar: Boolean(r.sync_to_calendar),
        createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at || '',
      }));
      return NextResponse.json(formatted);
    }
  } catch (e) {
    console.error('Database query for tasks failed:', e);
  }

  // Fallback to user-isolated dummy tasks if DB is empty or unreachable
  const userDummyTasks = DUMMY_TASKS.filter(
    (t) => t.creatorId === currentUser.id || t.assigneeId === currentUser.id
  );
  return NextResponse.json(userDummyTasks);
}

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      priority,
      dueDate,
      assigneeId,
      assigneeName,
      assigneeAvatar,
      category,
      syncToCalendar,
    } = body;

    const assignedTargetId = assigneeId || currentUser.id;

    const dbRes = await query(
      `INSERT INTO tasks (creator_id, assignee_id, title, description, priority, due_date, category, sync_to_calendar)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        currentUser.id,
        assignedTargetId,
        title || 'Untitled Task',
        description || '',
        priority || 'MEDIUM',
        dueDate || null,
        category || 'General',
        Boolean(syncToCalendar),
      ]
    );

    if (dbRes && dbRes.rows.length > 0) {
      const r = dbRes.rows[0];

      // Send email notification to assignee asynchronously
      if (r.assignee_id) {
        query(
          `SELECT email, name FROM team_members WHERE id::text = $1
           UNION
           SELECT email, name FROM users WHERE id::text = $1
           LIMIT 1`,
          [String(r.assignee_id)]
        )
          .then((memberRes) => {
            if (memberRes && memberRes.rows.length > 0) {
              const assignee = memberRes.rows[0];
              if (assignee.email) {
                sendTaskAssignmentMail({
                  assigneeEmail: assignee.email,
                  assigneeName: assignee.name || 'Team Member',
                  taskTitle: r.title,
                  priority: r.priority,
                  dueDate: r.due_date,
                  description: r.description,
                }).catch((mailErr) => console.error('Task notification email error:', mailErr));
              }
            }
          })
          .catch((err) => console.warn('Could not query assignee for email notification:', err));
      }

      return NextResponse.json({
        success: true,
        task: {
          id: String(r.id),
          title: r.title,
          description: r.description,
          status: r.status,
          priority: r.priority,
          dueDate: r.due_date,
          assigneeId: r.assignee_id,
          assigneeName: assigneeName || currentUser.name,
          assigneeAvatar: assigneeAvatar || '',
          category: r.category,
          syncToCalendar: r.sync_to_calendar,
          createdAt: r.created_at,
        },
      });
    }

    return NextResponse.json({
      success: true,
      task: {
        id: `task-${Date.now()}`,
        title: title || 'Untitled Task',
        description: description || '',
        status: 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate || '',
        assigneeId: assignedTargetId,
        assigneeName: assigneeName || currentUser.name,
        assigneeAvatar: assigneeAvatar || '',
        category: category || 'General',
        syncToCalendar: Boolean(syncToCalendar),
        createdAt: new Date().toISOString(),
      },
    });
  } catch (e) {
    console.error('Failed to create task:', e);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
