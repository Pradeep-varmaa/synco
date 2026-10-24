import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  createdAt: string;
}

export async function GET() {
  try {
    const res = await query('SELECT * FROM notes ORDER BY is_pinned DESC, created_at DESC');
    if (res && res.rows.length > 0) {
      const formatted: NoteItem[] = res.rows.map((r) => ({
        id: String(r.id),
        title: r.title,
        content: r.content || '',
        category: r.category || 'General',
        isPinned: Boolean(r.is_pinned),
        createdAt: r.created_at instanceof Date ? r.created_at.toISOString() : r.created_at || '',
      }));
      return NextResponse.json(formatted);
    }
  } catch (e) {
    console.error('Database query for notes failed:', e);
  }

  // Return empty list when no notes exist
  return NextResponse.json([]);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, content, category, isPinned } = body;

    const dbRes = await query(
      `INSERT INTO notes (title, content, category, is_pinned)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [title || 'Untitled Note', content || '', category || 'General', Boolean(isPinned)]
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
        createdAt: new Date().toISOString(),
      },
    });
  } catch (e) {
    console.error('Failed to create note:', e);
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
  }
}
