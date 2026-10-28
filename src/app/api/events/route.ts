import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/current-user';
import { DUMMY_EVENTS } from '@/lib/dummy-data';

export interface CalendarEventItem {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  meetingUrl?: string;
  guestsCount?: number;
  description?: string;
}

export async function GET() {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    return NextResponse.json([]);
  }

  try {
    const res = await query(
      'SELECT * FROM calendar_events WHERE user_id::text = $1 ORDER BY start_time ASC',
      [currentUser.id]
    );

    if (res && res.rows.length > 0) {
      const formatted: CalendarEventItem[] = res.rows.map((r) => ({
        id: String(r.id),
        title: r.title,
        start: r.start_time instanceof Date ? r.start_time.toISOString() : r.start_time,
        end: r.end_time instanceof Date ? r.end_time.toISOString() : r.end_time || r.start_time,
        allDay: Boolean(r.all_day),
        backgroundColor: r.color || '#0c8388',
        borderColor: r.color || '#0c8388',
        meetingUrl: r.meeting_url || '',
        guestsCount: Number(r.guests_count) || 1,
        description: r.description || '',
      }));
      return NextResponse.json(formatted);
    }
  } catch (err) {
    console.error('Database query for calendar_events failed:', err);
  }

  // Fallback to user-isolated dummy events if DB is empty or unreachable
  const userDummyEvents = DUMMY_EVENTS.filter((e) => e.userId === currentUser.id);
  return NextResponse.json(userDummyEvents);
}

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, start, end, allDay, color, meetingUrl, guestsCount, description } = body;

    const eventColor = color || '#0c8388';

    const dbRes = await query(
      `INSERT INTO calendar_events (user_id, title, description, start_time, end_time, all_day, meeting_url, color, guests_count)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        currentUser.id,
        title || 'Untitled Event',
        description || '',
        start,
        end || start,
        Boolean(allDay),
        meetingUrl || '',
        eventColor,
        Number(guestsCount) || 1,
      ]
    );

    if (dbRes && dbRes.rows.length > 0) {
      const row = dbRes.rows[0];
      return NextResponse.json({
        success: true,
        event: {
          id: String(row.id),
          title: row.title,
          start: row.start_time,
          end: row.end_time,
          allDay: row.all_day,
          backgroundColor: row.color,
          borderColor: row.color,
          meetingUrl: row.meeting_url,
          guestsCount: row.guests_count,
          description: row.description,
        },
      });
    }

    return NextResponse.json({
      success: true,
      event: {
        id: `evt-${Date.now()}`,
        title: title || 'Untitled Event',
        start,
        end: end || start,
        allDay: Boolean(allDay),
        backgroundColor: eventColor,
        borderColor: eventColor,
        meetingUrl: meetingUrl || '',
        guestsCount: guestsCount || 1,
        description: description || '',
      },
    });
  } catch (error) {
    console.error('Failed to create event:', error);
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
  }
}
