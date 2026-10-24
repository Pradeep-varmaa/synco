import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
      return NextResponse.json({ success: true, task: dbRes.rows[0] });
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
  try {
    const { id } = await params;
    await query('DELETE FROM tasks WHERE id = $1', [id]);
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Failed to delete task:', error);
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
