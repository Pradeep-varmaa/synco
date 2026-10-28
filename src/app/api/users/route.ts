import { query } from "@/lib/db";
import { NextResponse } from "next/server";
import { DUMMY_USERS } from "@/lib/dummy-data";

export async function GET() {
  try {
    const res = await query('SELECT id, name, email, role, image, created_at FROM users');
    if (res && res.rows.length > 0) {
      return NextResponse.json({ success: true, users: res.rows });
    }
  } catch (err) {
    console.warn('Failed to fetch users from database, using fallback:', err);
  }

  const fallback = DUMMY_USERS.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    image: u.avatar,
  }));
  return NextResponse.json({ success: true, users: fallback });
}
