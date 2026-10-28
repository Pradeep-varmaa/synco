import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/current-user';

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
    const { title, content, category, isPinned, color } = body;

    const dbRes = await query(
      `UPDATE notes
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           category = COALESCE($3, category),
           is_pinned = COALESCE($4, is_pinned),
           color = COALESCE($5, color),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND (user_id::text = $7 OR user_id IS NULL)
       RETURNING *`,
      [title, content, category, isPinned, color, id, currentUser.id]
    );

    if (dbRes && dbRes.rows.length > 0) {
      return NextResponse.json({ success: true, note: dbRes.rows[0] });
    }

    return NextResponse.json({ success: true, updatedId: id });
  } catch (error) {
    console.error('Failed to update note:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
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
    await query('DELETE FROM notes WHERE id = $1 AND (user_id::text = $2 OR user_id IS NULL)', [
      id,
      currentUser.id,
    ]);
    return NextResponse.json({ success: true, deletedId: id });
  } catch (e) {
    console.error('Failed to delete note:', e);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
}
