-- SYNCO Database Tables (Neon PostgreSQL)
-- Plain table structures without constraints or insert statements

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    email VARCHAR(255),
    password VARCHAR(255),
    image TEXT,
    role VARCHAR(50) DEFAULT 'Member',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Accounts Table (NextAuth & Google OAuth tokens)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    type VARCHAR(50),
    provider VARCHAR(50),
    provider_account_id VARCHAR(255),
    refresh_token TEXT,
    access_token TEXT,
    expires_at BIGINT,
    token_type VARCHAR(50),
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Sessions Table (NextAuth)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token VARCHAR(255),
    user_id UUID,
    expires TIMESTAMP WITH TIME ZONE
);

-- 4. Verification Tokens Table
CREATE TABLE IF NOT EXISTS verification_tokens (
    identifier VARCHAR(255),
    token VARCHAR(255),
    expires TIMESTAMP WITH TIME ZONE
);

-- 5. Team Members Table (Task delegation directory)
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

-- 6. Calendar Events Table (FullCalendar & Google Calendar sync)
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

-- 7. Tasks Table (Task management & person assignment)
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

-- 8. Notes Table
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

-- 9. Mail Templates Table (Dynamic email notification templates)
CREATE TABLE IF NOT EXISTS mail_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE,
    subject VARCHAR(255),
    body TEXT,
    variables TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
