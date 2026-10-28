import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/current-user';
import { DUMMY_NOTES } from '@/lib/dummy-data';

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  color?: string;
  createdAt: string;
}

export async function GET() {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json([]);
  }

  try {
    const res = await query(
      'SELECT * FROM notes WHERE user_id::text = $1 ORDER BY is_pinned DESC, created_at DESC',
      [currentUser.id]
    );

    if (res && res.rows.length > 0) {
      const formatted: NoteItem[] = res.rows.map((r) => ({
        id: String(r.id),
        title: r.title,
        content: r.content || '',
        category: r.category || 'General',
        isPinned: Boolean(r.is_pinned),
        color: r.color || '#ffffff',
        createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at || '',
      }));
      return NextResponse.json(formatted);
    }
  } catch (e) {
    console.error('Database query for notes failed:', e);
  }

  // Fallback to user-isolated dummy notes if DB is empty or unreachable
  const userDummyNotes = DUMMY_NOTES.filter((n) => n.userId === currentUser.id);
  return NextResponse.json(userDummyNotes);
}

export async function POST(req: Request) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, content, category, isPinned, color } = body;

    const noteColor = color || '#ffffff';

    const dbRes = await query(
      `INSERT INTO notes (user_id, title, content, category, is_pinned, color)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [currentUser.id, title || 'Untitled Note', content || '', category || 'General', Boolean(isPinned), noteColor]
    );

    if (dbRes && dbRes.rows.length > 0) {
      const r = dbRes.rows[0];
      return NextResponse.json({
        success: true,
        note: {
          id: String(r.id),
          title: r.title,
          content: r.content,
          category: r.category,
          isPinned: r.is_pinned,
          color: r.color,
          createdAt: r.created_at,
        },
      });
    }

    return NextResponse.json({
      success: true,
      note: {
        id: `note-${Date.now()}`,
        title: title || 'Untitled Note',
        content: content || '',
        category: category || 'General',
        isPinned: Boolean(isPinned),
        color: noteColor,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (e) {
    console.error('Failed to create note:', e);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
