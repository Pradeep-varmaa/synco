import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

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
  try {
    const res = await query(`
      SELECT t.*, tm.name as assignee_name, tm.avatar as assignee_avatar
      FROM tasks t
      LEFT JOIN team_members tm ON t.assignee_id = tm.id
      ORDER BY t.created_at DESC
    `);

    if (res && res.rows.length > 0) {
      const formatted: TaskItem[] = res.rows.map((r) => ({
        id: String(r.id),
        title: r.title,
        description: r.description || '',
        status: r.status || 'TODO',
        priority: r.priority || 'MEDIUM',
        dueDate: r.due_date instanceof Date ? r.due_date.toISOString() : r.due_date || '',
        assigneeId: r.assignee_id || '',
        assigneeName: r.assignee_name || 'Unassigned',
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

  // Return empty list when no tasks exist
  return NextResponse.json([]);
}

export async function POST(req: Request) {
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

    const dbRes = await query(
      `INSERT INTO tasks (title, description, priority, due_date, assignee_id, category, sync_to_calendar)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        title || 'Untitled Task',
        description || '',
        priority || 'MEDIUM',
        dueDate || null,
        assigneeId || null,
        category || 'General',
        Boolean(syncToCalendar),
      ]
    );

    if (dbRes && dbRes.rows.length > 0) {
      const r = dbRes.rows[0];
      return NextResponse.json({
        success: true,
        task: {
          id: String(r.id),
          title: r.title,
          description: r.description || '',
          status: r.status,
          priority: r.priority,
          dueDate: r.due_date,
          assigneeId: r.assignee_id,
          assigneeName: assigneeName || 'Unassigned',
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
        assigneeId: assigneeId || '',
        assigneeName: assigneeName || 'Unassigned',
        assigneeAvatar: assigneeAvatar || '',
        category: category || 'General',
        syncToCalendar: Boolean(syncToCalendar),
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to create task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
