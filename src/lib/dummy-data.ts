// In-memory dummy data & fallback stores for offline/sandboxed execution
// Fully synchronized with Neon PostgreSQL seed data for 3 users:
// 1. vishal@gmail.com   -> Synco@123
// 2. rajeswar@gmail.com -> Synco@123
// 3. varma@gmail.com    -> Synco@123

export interface DummyUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: string;
  department: string;
  avatar: string;
}

export interface DummyEvent {
  id: string;
  userId: string;
  title: string;
  description: string;
  start: string;
  end: string;
  allDay: boolean;
  backgroundColor: string;
  borderColor: string;
  meetingUrl?: string;
  guestsCount: number;
}

export interface DummyTask {
  id: string;
  creatorId: string;
  assigneeId: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string;
  assigneeName: string;
  assigneeAvatar: string;
  category: string;
  syncToCalendar: boolean;
  createdAt: string;
}

export interface DummyNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  color?: string;
  createdAt: string;
}

const BCRYPT_SYNCO_123 = '$2b$10$on3jNEEkzuEK.nOhz2Rx2.tu0Xw4fYUcIR.pE/CW2wT3R6yvu1d6S';

export const DUMMY_USERS: DummyUser[] = [
  {
    id: 'c64660fa-bad7-43ca-b82c-a19f126b1430',
    name: 'Vishal',
    email: 'vishal@gmail.com',
    passwordHash: BCRYPT_SYNCO_123,
    role: 'Product Manager',
    department: 'Product',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
  },
  {
    id: '975d418b-1d7d-4682-b24f-e19abd528e6c',
    name: 'Rajeswar',
    email: 'rajeswar@gmail.com',
    passwordHash: BCRYPT_SYNCO_123,
    role: 'Tech Lead',
    department: 'Engineering',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  },
  {
    id: '8b9d4ce4-49f4-4cee-be47-cc3c1a846887',
    name: 'Varma',
    email: 'varma@gmail.com',
    passwordHash: BCRYPT_SYNCO_123,
    role: 'Senior Developer',
    department: 'Engineering',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  },
];

const now = new Date();
const getTime = (hour: number, minute = 0, addDays = 0): string => {
  const d = new Date(now);
  d.setDate(d.getDate() + addDays);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const DUMMY_EVENTS: DummyEvent[] = [
  // Vishal's events
  {
    id: 'evt-vis-1',
    userId: 'c64660fa-bad7-43ca-b82c-a19f126b1430',
    title: 'Product Roadmap & Vision Review',
    description: 'Strategic alignment on Q4 milestones and features',
    start: getTime(10, 0, 0),
    end: getTime(11, 0, 0),
    allDay: false,
    backgroundColor: '#ea8a47',
    borderColor: '#ea8a47',
    meetingUrl: 'https://meet.google.com/vis-prod-sync',
    guestsCount: 4,
  },
  {
    id: 'evt-vis-2',
    userId: 'c64660fa-bad7-43ca-b82c-a19f126b1430',
    title: 'Customer Advisory Board Call',
    description: 'Reviewing high-priority feature requests from enterprise clients',
    start: getTime(15, 0, 1),
    end: getTime(16, 0, 1),
    allDay: false,
    backgroundColor: '#0c8388',
    borderColor: '#0c8388',
    meetingUrl: 'https://meet.google.com/vis-cust-adv',
    guestsCount: 3,
  },

  // Rajeswar's events
  {
    id: 'evt-raj-1',
    userId: '975d418b-1d7d-4682-b24f-e19abd528e6c',
    title: 'Architecture & Database Scaling Review',
    description: 'Reviewing connection pool limits and index optimization for Neon Postgres',
    start: getTime(11, 30, 0),
    end: getTime(12, 30, 0),
    allDay: false,
    backgroundColor: '#7d6ecf',
    borderColor: '#7d6ecf',
    meetingUrl: 'https://meet.google.com/raj-arch-sync',
    guestsCount: 5,
  },
  {
    id: 'evt-raj-2',
    userId: '975d418b-1d7d-4682-b24f-e19abd528e6c',
    title: 'Sprint Planning & Tech Debt Review',
    description: 'Estimating user stories for sprint 24',
    start: getTime(14, 0, 1),
    end: getTime(15, 0, 1),
    allDay: false,
    backgroundColor: '#2e8b57',
    borderColor: '#2e8b57',
    meetingUrl: 'https://meet.google.com/raj-sprint-plan',
    guestsCount: 6,
  },

  // Varma's events
  {
    id: 'evt-var-1',
    userId: '8b9d4ce4-49f4-4cee-be47-cc3c1a846887',
    title: 'FullCalendar Compression & Theme Sync',
    description: 'Pair programming on responsive calendar grid and hover cards',
    start: getTime(13, 0, 0),
    end: getTime(14, 0, 0),
    allDay: false,
    backgroundColor: '#ff5722',
    borderColor: '#ff5722',
    meetingUrl: 'https://meet.google.com/var-cal-pair',
    guestsCount: 2,
  },
  {
    id: 'evt-var-2',
    userId: '8b9d4ce4-49f4-4cee-be47-cc3c1a846887',
    title: 'Frontend Performance & Core Web Vitals',
    description: 'Analyzing bundle size and zero-inline-CSS validation',
    start: getTime(16, 30, 1),
    end: getTime(17, 30, 1),
    allDay: false,
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
    meetingUrl: 'https://meet.google.com/var-frontend-perf',
    guestsCount: 3,
  },
];

export const DUMMY_TASKS: DummyTask[] = [
  // Vishal's tasks
  {
    id: 'tsk-vis-1',
    creatorId: 'c64660fa-bad7-43ca-b82c-a19f126b1430',
    assigneeId: 'c64660fa-bad7-43ca-b82c-a19f126b1430',
    title: 'Finalize Q4 PRD & Feature Specifications',
    description: 'Detail out user stories and acceptance criteria for mobile responsive views',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: getTime(18, 0, 2),
    assigneeName: 'Vishal',
    assigneeAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    category: 'Product',
    syncToCalendar: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tsk-vis-2',
    creatorId: 'c64660fa-bad7-43ca-b82c-a19f126b1430',
    assigneeId: 'c64660fa-bad7-43ca-b82c-a19f126b1430',
    title: 'Conduct 5 User Feedback Interviews',
    description: 'Interview enterprise admins on task delegation and calendar sync workflow',
    status: 'TODO',
    priority: 'MEDIUM',
    dueDate: getTime(18, 0, 5),
    assigneeName: 'Vishal',
    assigneeAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    category: 'Research',
    syncToCalendar: false,
    createdAt: new Date().toISOString(),
  },

  // Rajeswar's tasks
  {
    id: 'tsk-raj-1',
    creatorId: '975d418b-1d7d-4682-b24f-e19abd528e6c',
    assigneeId: '975d418b-1d7d-4682-b24f-e19abd528e6c',
    title: 'Optimize PostgreSQL Queries & Add Composite Indexes',
    description: 'Profile slow queries on calendar_events and tasks tables',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: getTime(18, 0, 1),
    assigneeName: 'Rajeswar',
    assigneeAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    category: 'Engineering',
    syncToCalendar: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tsk-raj-2',
    creatorId: '975d418b-1d7d-4682-b24f-e19abd528e6c',
    assigneeId: '975d418b-1d7d-4682-b24f-e19abd528e6c',
    title: 'Review Security Architecture & Bcrypt Salt Rounds',
    description: 'Ensure 10 rounds of Bcrypt are applied on all password updates',
    status: 'COMPLETED',
    priority: 'MEDIUM',
    dueDate: getTime(18, 0, 3),
    assigneeName: 'Rajeswar',
    assigneeAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    category: 'Security',
    syncToCalendar: false,
    createdAt: new Date().toISOString(),
  },

  // Varma's tasks
  {
    id: 'tsk-var-1',
    creatorId: '8b9d4ce4-49f4-4cee-be47-cc3c1a846887',
    assigneeId: '8b9d4ce4-49f4-4cee-be47-cc3c1a846887',
    title: 'Implement User Activity Isolation Across All APIs',
    description: 'Scope calendar events, tasks, notes, and metrics to session.user.id',
    status: 'IN_PROGRESS',
    priority: 'HIGH',
    dueDate: getTime(18, 0, 1),
    assigneeName: 'Varma',
    assigneeAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    category: 'Frontend',
    syncToCalendar: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'tsk-var-2',
    creatorId: '8b9d4ce4-49f4-4cee-be47-cc3c1a846887',
    assigneeId: '8b9d4ce4-49f4-4cee-be47-cc3c1a846887',
    title: 'Refactor FullCalendar Mobile Responsive View',
    description: 'Compress cell height and attach tooltip card on hover',
    status: 'COMPLETED',
    priority: 'MEDIUM',
    dueDate: getTime(18, 0, 2),
    assigneeName: 'Varma',
    assigneeAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    category: 'UI/UX',
    syncToCalendar: false,
    createdAt: new Date().toISOString(),
  },
];

export const DUMMY_NOTES: DummyNote[] = [
  // Vishal's notes
  {
    id: 'not-vis-1',
    userId: 'c64660fa-bad7-43ca-b82c-a19f126b1430',
    title: 'Q4 Product Objectives & OKRs',
    content: '1. Increase Google Calendar sync adoption by 40%.\n2. Streamline task delegation within teams.\n3. Release compressed responsive calendar.',
    category: 'Strategy',
    isPinned: true,
    color: '#fffbeb',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'not-vis-2',
    userId: 'c64660fa-bad7-43ca-b82c-a19f126b1430',
    title: 'Enterprise Feedback Summary',
    content: 'Clients requested fine-grained permission control and instant email alerts when tasks are assigned.',
    category: 'Product',
    isPinned: false,
    color: '#ffffff',
    createdAt: new Date().toISOString(),
  },

  // Rajeswar's notes
  {
    id: 'not-raj-1',
    userId: '975d418b-1d7d-4682-b24f-e19abd528e6c',
    title: 'PostgreSQL Performance Optimization Notes',
    content: '- Ensure connection pool uses connectionTimeoutMillis: 5000\n- Index foreign keys on tasks(creator_id, assignee_id)\n- Index calendar_events(user_id, start_time)',
    category: 'Database',
    isPinned: true,
    color: '#f3e8ff',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'not-raj-2',
    userId: '975d418b-1d7d-4682-b24f-e19abd528e6c',
    title: 'Next.js 16 Security Guidelines',
    content: 'Always authenticate via getServerSession(authOptions) in route handlers and check user_id on mutations.',
    category: 'Architecture',
    isPinned: false,
    color: '#ffffff',
    createdAt: new Date().toISOString(),
  },

  // Varma's notes
  {
    id: 'not-var-1',
    userId: '8b9d4ce4-49f4-4cee-be47-cc3c1a846887',
    title: 'Dynamic User Activity Isolation Architecture',
    content: 'Rules:\n1. In /api/events, filter WHERE user_id = $userId\n2. In /api/tasks, filter WHERE assignee_id = $userId OR creator_id = $userId\n3. In /api/notes, filter WHERE user_id = $userId\n4. On mutation, always inject $userId from session',
    category: 'Development',
    isPinned: true,
    color: '#ffedd5',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'not-var-2',
    userId: '8b9d4ce4-49f4-4cee-be47-cc3c1a846887',
    title: 'Fiery & Metallic Chrome Design Tokens',
    content: 'Primary: #ff5722\nSidebar: #11161d\nCard background: #ffffff\nActive gradient: linear-gradient(135deg, #ff9800 0%, #ff5722 100%)',
    category: 'Design',
    isPinned: false,
    color: '#ffffff',
    createdAt: new Date().toISOString(),
  },
];
