// Neon PostgreSQL Seed Script: Create Users & Activities
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// 1. Load environment variables from .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=');
        const val = values.join('=').replace(/^["']|["']$/g, '');
        if (key && !process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
} catch (e) {
  console.error('Error reading .env.local:', e.message);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL is missing in .env.local');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function seed() {
  const client = await pool.connect();
  console.log('⚡ Connected to Neon DB. Setting up tables and user data...');

  try {
    // 1. Ensure tables exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255),
        email VARCHAR(255) UNIQUE,
        password VARCHAR(255),
        image TEXT,
        role VARCHAR(50) DEFAULT 'Member',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'Member';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

      CREATE TABLE IF NOT EXISTS team_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        name VARCHAR(255),
        email VARCHAR(255),
        avatar TEXT,
        role VARCHAR(100) DEFAULT 'Team Member',
        department VARCHAR(100) DEFAULT 'Engineering',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS calendar_events (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        title VARCHAR(255),
        description TEXT,
        start_time TIMESTAMP WITH TIME ZONE,
        end_time TIMESTAMP WITH TIME ZONE,
        all_day BOOLEAN DEFAULT FALSE,
        meeting_url TEXT,
        location TEXT,
        color VARCHAR(50) DEFAULT '#0c8388',
        guests_count INT DEFAULT 1,
        google_event_id VARCHAR(255),
        etag VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        creator_id UUID,
        assignee_id UUID,
        title VARCHAR(255),
        description TEXT,
        status VARCHAR(50) DEFAULT 'TODO',
        priority VARCHAR(50) DEFAULT 'MEDIUM',
        due_date TIMESTAMP WITH TIME ZONE,
        category VARCHAR(100) DEFAULT 'General',
        sync_to_calendar BOOLEAN DEFAULT FALSE,
        calendar_event_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        title VARCHAR(255),
        content TEXT,
        category VARCHAR(100) DEFAULT 'General',
        is_pinned BOOLEAN DEFAULT FALSE,
        color VARCHAR(50) DEFAULT '#ffffff',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Hash password 'Synco@123' with Bcrypt
    const plainPassword = 'Synco@123';
    const hashedPassword = bcrypt.hashSync(plainPassword, 10);
    console.log(`🔑 Generated Bcrypt hash for '${plainPassword}'`);

    const usersData = [
      {
        name: 'Vishal',
        email: 'vishal@gmail.com',
        role: 'Product Manager',
        department: 'Product',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      },
      {
        name: 'Rajeswar',
        email: 'rajeswar@gmail.com',
        role: 'Tech Lead',
        department: 'Engineering',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      },
      {
        name: 'Varma',
        email: 'varma@gmail.com',
        role: 'Senior Developer',
        department: 'Engineering',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      },
    ];

    const userMap = {};

    for (const u of usersData) {
      // Find or create in users table
      const existingUser = await client.query(
        `SELECT id FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`,
        [u.email]
      );
      let userId;
      if (existingUser.rows.length > 0) {
        userId = existingUser.rows[0].id;
        await client.query(
          `UPDATE users SET name = $1, password = $2, image = $3, role = $4 WHERE id = $5`,
          [u.name, hashedPassword, u.avatar, u.role, userId]
        );
      } else {
        const insertRes = await client.query(
          `INSERT INTO users (name, email, password, image, role)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id`,
          [u.name, u.email, hashedPassword, u.avatar, u.role]
        );
        userId = insertRes.rows[0].id;
      }

      userMap[u.email] = { id: userId, name: u.name };
      console.log(`👤 User ready: ${u.name} (${u.email}) [ID: ${userId}]`);

      // Upsert into team_members table
      const tmRes = await client.query(
        `SELECT id FROM team_members WHERE email = $1 LIMIT 1`,
        [u.email]
      );
      let tmId;
      if (tmRes.rows.length > 0) {
        tmId = tmRes.rows[0].id;
        await client.query(
          `UPDATE team_members SET user_id = $1, name = $2, avatar = $3, role = $4, department = $5 WHERE id = $6`,
          [userId, u.name, u.avatar, u.role, u.department, tmId]
        );
      } else {
        const newTm = await client.query(
          `INSERT INTO team_members (user_id, name, email, avatar, role, department)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [userId, u.name, u.email, u.avatar, u.role, u.department]
        );
        tmId = newTm.rows[0].id;
      }
      userMap[u.email].teamMemberId = tmId;
    }

    // 3. Clear existing activity data for these users so we populate fresh clean dynamic activities
    const userIds = Object.values(userMap).map((u) => u.id);
    await client.query(
      `DELETE FROM calendar_events WHERE user_id = ANY($1::uuid[])`,
      [userIds]
    );
    await client.query(
      `DELETE FROM tasks WHERE creator_id = ANY($1::uuid[]) OR assignee_id = ANY($1::uuid[])`,
      [userIds]
    );
    await client.query(
      `DELETE FROM notes WHERE user_id = ANY($1::uuid[])`,
      [userIds]
    );

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Helper for times
    const getTime = (hour, minute = 0, addDays = 0) => {
      const d = new Date(now);
      d.setDate(d.getDate() + addDays);
      d.setHours(hour, minute, 0, 0);
      return d.toISOString();
    };

    // 4. Seed unique Activities for Vishal (Product Manager)
    const vishal = userMap['vishal@gmail.com'];
    await client.query(
      `INSERT INTO calendar_events (user_id, title, description, start_time, end_time, color, guests_count, meeting_url)
       VALUES
       ($1, 'Product Roadmap & Vision Review', 'Strategic alignment on Q4 milestones and features', $2, $3, '#ea8a47', 4, 'https://meet.google.com/vis-prod-sync'),
       ($1, 'Customer Advisory Board Call', 'Reviewing high-priority feature requests from enterprise clients', $4, $5, '#0c8388', 3, 'https://meet.google.com/vis-cust-adv')`,
      [vishal.id, getTime(10, 0, 0), getTime(11, 0, 0), getTime(15, 0, 1), getTime(16, 0, 1)]
    );

    await client.query(
      `INSERT INTO tasks (creator_id, assignee_id, title, description, status, priority, due_date, category)
       VALUES
       ($1, $2, 'Finalize Q4 PRD & Feature Specifications', 'Detail out user stories and acceptance criteria for mobile responsive views', 'IN_PROGRESS', 'HIGH', $3, 'Product'),
       ($1, $2, 'Conduct 5 User Feedback Interviews', 'Interview enterprise admins on task delegation and calendar sync workflow', 'TODO', 'MEDIUM', $4, 'Research')`,
      [vishal.id, vishal.teamMemberId || vishal.id, getTime(18, 0, 2), getTime(18, 0, 5)]
    );

    await client.query(
      `INSERT INTO notes (user_id, title, content, category, is_pinned, color)
       VALUES
       ($1, 'Q4 Product Objectives & OKRs', '1. Increase Google Calendar sync adoption by 40%.\n2. Streamline task delegation within teams.\n3. Release compressed responsive calendar.', 'Strategy', true, '#fffbeb'),
       ($1, 'Enterprise Feedback Summary', 'Clients requested fine-grained permission control and instant email alerts when tasks are assigned.', 'Product', false, '#ffffff')`,
      [vishal.id]
    );

    // 5. Seed unique Activities for Rajeswar (Tech Lead)
    const rajeswar = userMap['rajeswar@gmail.com'];
    await client.query(
      `INSERT INTO calendar_events (user_id, title, description, start_time, end_time, color, guests_count, meeting_url)
       VALUES
       ($1, 'Architecture & Database Scaling Review', 'Reviewing connection pool limits and index optimization for Neon Postgres', $2, $3, '#7d6ecf', 5, 'https://meet.google.com/raj-arch-sync'),
       ($1, 'Sprint Planning & Tech Debt Review', 'Estimating user stories for sprint 24', $4, $5, '#2e8b57', 6, 'https://meet.google.com/raj-sprint-plan')`,
      [rajeswar.id, getTime(11, 30, 0), getTime(12, 30, 0), getTime(14, 0, 1), getTime(15, 0, 1)]
    );

    await client.query(
      `INSERT INTO tasks (creator_id, assignee_id, title, description, status, priority, due_date, category)
       VALUES
       ($1, $2, 'Optimize PostgreSQL Queries & Add Composite Indexes', 'Profile slow queries on calendar_events and tasks tables', 'IN_PROGRESS', 'HIGH', $3, 'Engineering'),
       ($1, $2, 'Review Security Architecture & Bcrypt Salt Rounds', 'Ensure 10 rounds of Bcrypt are applied on all password updates', 'COMPLETED', 'MEDIUM', $4, 'Security')`,
      [rajeswar.id, rajeswar.teamMemberId || rajeswar.id, getTime(18, 0, 1), getTime(18, 0, 3)]
    );

    await client.query(
      `INSERT INTO notes (user_id, title, content, category, is_pinned, color)
       VALUES
       ($1, 'PostgreSQL Performance Optimization Notes', '- Ensure connection pool uses connectionTimeoutMillis: 5000\n- Index foreign keys on tasks(creator_id, assignee_id)\n- Index calendar_events(user_id, start_time)', 'Database', true, '#f3e8ff'),
       ($1, 'Next.js 16 Security Guidelines', 'Always authenticate via getServerSession(authOptions) in route handlers and check user_id on mutations.', 'Architecture', false, '#ffffff')`,
      [rajeswar.id]
    );

    // 6. Seed unique Activities for Varma (Senior Developer)
    const varma = userMap['varma@gmail.com'];
    await client.query(
      `INSERT INTO calendar_events (user_id, title, description, start_time, end_time, color, guests_count, meeting_url)
       VALUES
       ($1, 'FullCalendar Compression & Theme Sync', 'Pair programming on responsive calendar grid and hover cards', $2, $3, '#ff5722', 2, 'https://meet.google.com/var-cal-pair'),
       ($1, 'Frontend Performance & Core Web Vitals', 'Analyzing bundle size and zero-inline-CSS validation', $4, $5, '#2563eb', 3, 'https://meet.google.com/var-frontend-perf')`,
      [varma.id, getTime(13, 0, 0), getTime(14, 0, 0), getTime(16, 30, 1), getTime(17, 30, 1)]
    );

    await client.query(
      `INSERT INTO tasks (creator_id, assignee_id, title, description, status, priority, due_date, category)
       VALUES
       ($1, $2, 'Implement User Activity Isolation Across All APIs', 'Scope calendar events, tasks, notes, and metrics to session.user.id', 'IN_PROGRESS', 'HIGH', $3, 'Frontend'),
       ($1, $2, 'Refactor FullCalendar Mobile Responsive View', 'Compress cell height and attach tooltip card on hover', 'COMPLETED', 'MEDIUM', $4, 'UI/UX')`,
      [varma.id, varma.teamMemberId || varma.id, getTime(18, 0, 1), getTime(18, 0, 2)]
    );

    await client.query(
      `INSERT INTO notes (user_id, title, content, category, is_pinned, color)
       VALUES
       ($1, 'Dynamic User Activity Isolation Architecture', 'Rules:\n1. In /api/events, filter WHERE user_id = $userId\n2. In /api/tasks, filter WHERE assignee_id = $userId OR creator_id = $userId\n3. In /api/notes, filter WHERE user_id = $userId\n4. On mutation, always inject $userId from session', 'Development', true, '#ffedd5'),
       ($1, 'Fiery & Metallic Chrome Design Tokens', 'Primary: #ff5722\nSidebar: #11161d\nCard background: #ffffff\nActive gradient: linear-gradient(135deg, #ff9800 0%, #ff5722 100%)', 'Design', false, '#ffffff')`,
      [varma.id]
    );

    console.log('✅ Successfully seeded users and user-isolated activities!');
    console.log('Login credentials:');
    console.log('1. vishal@gmail.com   -> Synco@123');
    console.log('2. rajeswar@gmail.com -> Synco@123');
    console.log('3. varma@gmail.com    -> Synco@123');
  } catch (err) {
    console.error('❌ Seeding error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
