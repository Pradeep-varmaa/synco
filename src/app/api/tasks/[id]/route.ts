import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/current-user';
import { sendTaskAssignmentMail } from '@/lib/sendmail';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { status, priority, title, description, assigneeId, dueDate } = body;

    const dbRes = await query(
      `UPDATE tasks
       SET status = COALESCE($1, status),
           priority = COALESCE($2, priority),
           title = COALESCE($3, title),
           description = COALESCE($4, description),
           assignee_id = COALESCE($5, assignee_id),
           due_date = COALESCE($6, due_date),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [status, priority, title, description, assigneeId, dueDate, id]
    );

    if (dbRes && dbRes.rows.length > 0) {
      const updatedTask = dbRes.rows[0];

      // If task was assigned to a member, notify them via email asynchronously
      if (assigneeId && updatedTask.assignee_id) {
        query(
          `SELECT email, name FROM team_members WHERE id::text = $1
           UNION
           SELECT email, name FROM users WHERE id::text = $1
           LIMIT 1`,
          [String(updatedTask.assignee_id)]
        )
          .then((memberRes) => {
            if (memberRes && memberRes.rows.length > 0) {
              const assignee = memberRes.rows[0];
              if (assignee.email) {
                sendTaskAssignmentMail({
                  assigneeEmail: assignee.email,
                  assigneeName: assignee.name || 'Team Member',
                  taskTitle: updatedTask.title,
                  priority: updatedTask.priority,
                  dueDate: updatedTask.due_date,
                  description: updatedTask.description,
                }).catch((mailErr) => console.error('Task update notification email error:', mailErr));
              }
            }
          })
          .catch((err) => console.warn('Could not query assignee for update email notification:', err));
      }

      return NextResponse.json({ success: true, task: updatedTask });
    }

    return NextResponse.json({ success: true, updatedId: id });
  } catch (error) {
    console.error('Failed to update task:', error);
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    await query('DELETE FROM tasks WHERE id = $1', [id]);
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Failed to delete task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
