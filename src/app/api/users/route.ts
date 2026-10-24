import { query } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await query('SELECT * FROM users');
    return NextResponse.json({ success: true, users: res ? res.rows : [] });
  } catch (err) {
    console.error('Failed to fetch users:', err);
    return NextResponse.json({ success: false, users: [] });
  }
}
