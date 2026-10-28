import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { query } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE LOWER(email) = $1 LIMIT 1', [cleanEmail]);
    if (existing && existing.rows.length > 0) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409 }
      );
    }

    // Hash password with Bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    const res = await query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
      [name || 'User', cleanEmail, hashedPassword, 'Member']
    );

    if (!res || res.rows.length === 0) {
      return NextResponse.json(
        { error: 'Failed to create user in database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: res.rows[0],
    });
  } catch (err: unknown) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { error: 'An unexpected registration error occurred' },
      { status: 500 }
    );
  }
}
