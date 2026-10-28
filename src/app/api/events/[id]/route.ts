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
    const { title, start, end, allDay, color, meetingUrl, description, guestsCount } = body;

    const dbRes = await query(
      `UPDATE calendar_events
       SET start_time = COALESCE($1, start_time),
           end_time = COALESCE($2, end_time),
           all_day = COALESCE($3, all_day),
           title = COALESCE($4, title),
           color = COALESCE($5, color),
           meeting_url = COALESCE($6, meeting_url),
           description = COALESCE($7, description),
           guests_count = COALESCE($8, guests_count),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $9 AND (user_id::text = $10 OR user_id IS NULL)
       RETURNING *`,
      [start, end, allDay, title, color, meetingUrl, description, guestsCount, id, currentUser.id]
    );

    if (dbRes && dbRes.rows.length > 0) {
      return NextResponse.json({ success: true, event: dbRes.rows[0] });
    }

    return NextResponse.json({ success: true, updatedId: id });
  } catch (error) {
    console.error('Failed to update event:', error);
    return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
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
    await query('DELETE FROM calendar_events WHERE id = $1 AND (user_id::text = $2 OR user_id IS NULL)', [
      id,
      currentUser.id,
    ]);
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error) {
    console.error('Failed to delete event:', error);
    return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
  }
}
