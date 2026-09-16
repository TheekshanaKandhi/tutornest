import {
  User,
  Tutor,
  StudentProfile,
  Subject,
  AvailabilitySlot,
  Booking,
  BookingHistory,
  PaymentTransaction,
  Review,
  Notification,
  Conversation,
  Message,
  LearningGoal,
  LearningProgress,
  AuditLog,
  SystemSettings,
  ContactSubmission,
} from './types.js';
import crypto from 'crypto';
import { Pool } from 'pg';

const STATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS tutornest_store (
    id text PRIMARY KEY,
    state jsonb NOT NULL,
    updated_at timestamptz NOT NULL DEFAULT now()
  )
`;

type StoreSnapshot = {
  users: Record<string, User>;
  passwordHashes: Record<string, string>;
  sessions: Record<string, string>;
  tutors: Record<string, Tutor>;
  studentProfiles: Record<string, StudentProfile>;
  subjects: Record<string, Subject>;
  availabilitySlots: Record<string, AvailabilitySlot>;
  bookings: Record<string, Booking>;
  bookingHistory: BookingHistory[];
  payments: Record<string, PaymentTransaction>;
  reviews: Record<string, Review>;
  notifications: Notification[];
  conversations: Record<string, Conversation>;
  messages: Message[];
  learningGoals: LearningGoal[];
  auditLogs: AuditLog[];
  contactSubmissions: ContactSubmission[];
  systemSettings: SystemSettings;
};

class PostgresStore {
  users: Map<string, User> = new Map();
  passwordHashes: Map<string, string> = new Map();
  sessions: Map<string, string> = new Map();
  tutors: Map<string, Tutor> = new Map();
  studentProfiles: Map<string, StudentProfile> = new Map();
  subjects: Map<string, Subject> = new Map();
  availabilitySlots: Map<string, AvailabilitySlot> = new Map();
  bookings: Map<string, Booking> = new Map();
  bookingHistory: BookingHistory[] = [];
  payments: Map<string, PaymentTransaction> = new Map();
  reviews: Map<string, Review> = new Map();
  notifications: Notification[] = [];
  conversations: Map<string, Conversation> = new Map();
  messages: Message[] = [];
  learningGoals: LearningGoal[] = [];
  auditLogs: AuditLog[] = [];
  contactSubmissions: ContactSubmission[] = [];

  systemSettings: SystemSettings = {
    platformFeeFixed: 40,
    platformFeePercentage: 5,
    cancellationFullRefundHours: 24,
    cancellationPartialRefundHours: 12,
    partialRefundPercentage: 50,
    currency: 'INR',
    currencySymbol: '₹',
    autoApproveTutors: false,
    maintenanceMode: false,
  };

  // Mutex lock for double booking prevention
  private slotLocks: Set<string> = new Set();
  private readonly pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  });
  private persistenceReady = false;
  private persistenceQueue: Promise<void> = Promise.resolve();

  constructor() {
    this.seedInitialData();
  }

  /**
   * Initialize the durable state store. The seed is only written when no
   * state exists, so restarts and migrations never overwrite user data.
   */
  async initialize(): Promise<void> {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required to start the Node backend.');
    }
    if (
      process.env.NODE_ENV === 'production' &&
      (!process.env.INITIAL_ADMIN_EMAIL || !process.env.INITIAL_ADMIN_PASSWORD)
    ) {
      throw new Error(
        'INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD are required for production initialization.'
      );
    }

    await this.pool.query(STATE_TABLE_SQL);
    const result = await this.pool.query<{ state: StoreSnapshot }>(
      'SELECT state FROM tutornest_store WHERE id = $1',
      ['primary']
    );

    if (result.rowCount) {
      this.restoreSnapshot(result.rows[0].state);
    } else {
      await this.writeSnapshot(this.createSnapshot());
    }

    this.persistenceReady = true;
  }

  /**
   * Persist the current in-process view after a request. Routes intentionally
   * keep their existing synchronous map-based API; this durable snapshot is
   * written transactionally by PostgreSQL and includes every active entity.
   */
  async persist(): Promise<void> {
    if (!this.persistenceReady) return;
    const snapshot = this.createSnapshot();
    this.persistenceQueue = this.persistenceQueue
      .then(() => this.writeSnapshot(snapshot))
      .catch(error => {
        console.error('[TutorNest] Failed to persist state:', error);
      });
    await this.persistenceQueue;
  }

  async close(): Promise<void> {
    await this.persist();
    await this.pool.end();
  }

  private createSnapshot(): StoreSnapshot {
    return {
      users: Object.fromEntries(this.users),
      passwordHashes: Object.fromEntries(this.passwordHashes),
      sessions: Object.fromEntries(this.sessions),
      tutors: Object.fromEntries(this.tutors),
      studentProfiles: Object.fromEntries(this.studentProfiles),
      subjects: Object.fromEntries(this.subjects),
      availabilitySlots: Object.fromEntries(this.availabilitySlots),
      bookings: Object.fromEntries(this.bookings),
      bookingHistory: this.bookingHistory,
      payments: Object.fromEntries(this.payments),
      reviews: Object.fromEntries(this.reviews),
      notifications: this.notifications,
      conversations: Object.fromEntries(this.conversations),
      messages: this.messages,
      learningGoals: this.learningGoals,
      auditLogs: this.auditLogs,
      contactSubmissions: this.contactSubmissions,
      systemSettings: this.systemSettings,
    };
  }

  private restoreSnapshot(snapshot: StoreSnapshot): void {
    const restoreMap = <T>(target: Map<string, T>, source?: Record<string, T>) => {
      target.clear();
      for (const [key, value] of Object.entries(source || {})) target.set(key, value);
    };
    const restoreArray = <T>(target: T[], source?: T[]) => {
      target.splice(0, target.length, ...(source || []));
    };

    restoreMap(this.users, snapshot.users);
    restoreMap(this.passwordHashes, snapshot.passwordHashes);
    restoreMap(this.sessions, snapshot.sessions);
    restoreMap(this.tutors, snapshot.tutors);
    restoreMap(this.studentProfiles, snapshot.studentProfiles);
    restoreMap(this.subjects, snapshot.subjects);
    restoreMap(this.availabilitySlots, snapshot.availabilitySlots);
    restoreMap(this.bookings, snapshot.bookings);
    restoreArray(this.bookingHistory, snapshot.bookingHistory);
    restoreMap(this.payments, snapshot.payments);
    restoreMap(this.reviews, snapshot.reviews);
    restoreArray(this.notifications, snapshot.notifications);
    restoreMap(this.conversations, snapshot.conversations);
    restoreArray(this.messages, snapshot.messages);
    restoreArray(this.learningGoals, snapshot.learningGoals);
    restoreArray(this.auditLogs, snapshot.auditLogs);
    restoreArray(this.contactSubmissions, snapshot.contactSubmissions);
    if (snapshot.systemSettings) this.systemSettings = snapshot.systemSettings;
  }

  private async writeSnapshot(snapshot: StoreSnapshot): Promise<void> {
    await this.pool.query(
      `INSERT INTO tutornest_store (id, state, updated_at)
       VALUES ($1, $2::jsonb, now())
       ON CONFLICT (id) DO UPDATE SET state = EXCLUDED.state, updated_at = now()`,
      ['primary', JSON.stringify(snapshot)]
    );
  }

  setPassword(userId: string, password: string): void {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    this.passwordHashes.set(userId, `${salt}:${hash}`);
  }

  verifyPassword(userId: string, password: string): boolean {
    const stored = this.passwordHashes.get(userId);
    if (!stored) return false;
    const [salt, expected] = stored.split(':');
    const actual = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
  }

  createSession(userId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    this.sessions.set(token, userId);
    return token;
  }

  revokeSession(token: string): void {
    this.sessions.delete(token);
  }

  getUserForToken(token: string): User | null {
    const userId = this.sessions.get(token);
    return userId ? this.users.get(userId) || null : null;
  }

  // ACID Concurrency Lock
  acquireSlotLock(tutorId: string, date: string, startTime: string): boolean {
    const key = `${tutorId}_${date}_${startTime}`;
    if (this.slotLocks.has(key)) {
      return false;
    }
    this.slotLocks.add(key);
    return true;
  }

  releaseSlotLock(tutorId: string, date: string, startTime: string): void {
    const key = `${tutorId}_${date}_${startTime}`;
    this.slotLocks.delete(key);
  }

  isSlotBooked(tutorId: string, date: string, startTime: string): boolean {
    for (const booking of this.bookings.values()) {
      if (
        booking.tutorId === tutorId &&
        booking.date === date &&
        booking.startTime === startTime &&
        ['CONFIRMED', 'PENDING_PAYMENT'].includes(booking.status)
      ) {
        return true;
      }
    }
    return false;
  }

  logAudit(
    actorId: string,
    actorName: string,
    actorRole: any,
    action: string,
    entity: string,
    entityId: string,
    metadata?: Record<string, any>
  ) {
    const log: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      actorId,
      actorName,
      actorRole,
      action,
      entity,
      entityId,
      metadata,
      ipAddress: '127.0.0.1',
      timestamp: new Date().toISOString(),
    };
    this.auditLogs.unshift(log);
  }

  createNotification(
    userId: string,
    type: any,
    title: string,
    message: string,
    link?: string
  ) {
    const notif: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      type,
      title,
      message,
      read: false,
      link,
      createdAt: new Date().toISOString(),
    };
    this.notifications.unshift(notif);
    return notif;
  }

  private seedProductionData() {
    if (!process.env.INITIAL_ADMIN_EMAIL || !process.env.INITIAL_ADMIN_PASSWORD) {
      return;
    }
    const now = new Date().toISOString();
    const admin: User = {
      id: 'usr_admin_initial',
      name: 'Platform Administrator',
      email: process.env.INITIAL_ADMIN_EMAIL!,
      role: 'ADMIN',
      status: 'ACTIVE',
      avatar: '',
      preferredLanguage: 'English',
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(admin.id, admin);
    this.setPassword(admin.id, process.env.INITIAL_ADMIN_PASSWORD!);
  }

  private seedInitialData() {
    if (process.env.NODE_ENV === 'production' && process.env.SEED_DEMO_DATA !== 'true') {
      this.seedProductionData();
      return;
    }

    // 1. Seed Core Subjects (16 subjects across STEM, Software, Languages, Academics)
    const seedSubjects: Subject[] = [
      { id: 'sub_math', name: 'Mathematics', category: 'STEM', description: 'Calculus, Linear Algebra, Statistics & Geometry', icon: 'Calculator', active: true, tutorCount: 8 },
      { id: 'sub_phys', name: 'Physics', category: 'STEM', description: 'Classical Mechanics, Electromagnetism, Quantum Basics', icon: 'Atom', active: true, tutorCount: 6 },
      { id: 'sub_chem', name: 'Chemistry', category: 'STEM', description: 'Organic, Inorganic and Physical Chemistry', icon: 'FlaskConical', active: true, tutorCount: 5 },
      { id: 'sub_cs', name: 'Computer Science', category: 'Technology', description: 'Operating Systems, Networking, Algorithms', icon: 'Cpu', active: true, tutorCount: 9 },
      { id: 'sub_java', name: 'Java', category: 'Technology', description: 'Core Java, Spring Boot, OOPs and Enterprise Dev', icon: 'Coffee', active: true, tutorCount: 7 },
      { id: 'sub_python', name: 'Python', category: 'Technology', description: 'Python programming, Automation, Data Analysis', icon: 'Terminal', active: true, tutorCount: 11 },
      { id: 'sub_react', name: 'React', category: 'Technology', description: 'Modern React, Hooks, Next.js, Redux, State Management', icon: 'Code', active: true, tutorCount: 8 },
      { id: 'sub_dsa', name: 'Data Structures & Algorithms', category: 'Technology', description: 'LeetCode, Graph Theory, DP, Placement Prep', icon: 'GitBranch', active: true, tutorCount: 9 },
      { id: 'sub_db', name: 'Database Systems', category: 'Technology', description: 'SQL, MySQL, PostgreSQL, Query Optimization, NoSQL', icon: 'Database', active: true, tutorCount: 6 },
      { id: 'sub_ml', name: 'Machine Learning', category: 'Technology', description: 'Scikit-learn, Neural Networks, Computer Vision, NLP', icon: 'Brain', active: true, tutorCount: 5 },
      { id: 'sub_web', name: 'Web Development', category: 'Technology', description: 'HTML5, CSS3, Tailwind, JavaScript, Full-Stack Architecture', icon: 'Globe', active: true, tutorCount: 10 },
      { id: 'sub_eng', name: 'English', category: 'Languages', description: 'Business Communication, IELTS, Academic Writing', icon: 'BookOpen', active: true, tutorCount: 6 },
      { id: 'sub_bio', name: 'Biology', category: 'STEM', description: 'Genetics, Cell Biology, Human Physiology', icon: 'Microscope', active: true, tutorCount: 4 },
      { id: 'sub_econ', name: 'Economics', category: 'Business', description: 'Microeconomics, Macroeconomics, Financial Modeling', icon: 'TrendingUp', active: true, tutorCount: 4 },
      { id: 'sub_stats', name: 'Statistics & Probability', category: 'STEM', description: 'Hypothesis Testing, Regression, Data Science Stats', icon: 'BarChart3', active: true, tutorCount: 5 },
      { id: 'sub_french', name: 'French Language', category: 'Languages', description: 'DELF preparation, Conversational fluency, Grammar', icon: 'Languages', active: true, tutorCount: 3 },
    ];
    seedSubjects.forEach(s => this.subjects.set(s.id, s));

    // 2. Demo Users (Student, Tutor, Admin)
    const demoStudent: User = {
      id: 'usr_student_demo',
      name: 'Aarav Sharma',
      email: 'student@demo.tutornest.in',
      role: 'STUDENT',
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      phone: '+91 98765 43210',
      preferredLanguage: 'English',
      createdAt: '2026-01-15T10:00:00Z',
      updatedAt: '2026-02-01T10:00:00Z',
    };
    this.users.set(demoStudent.id, demoStudent);
    this.setPassword(demoStudent.id, process.env.SEED_USER_PASSWORD || crypto.randomBytes(24).toString('hex'));
    this.studentProfiles.set(demoStudent.id, {
      userId: demoStudent.id,
      learningGoals: 'Master Data Structures & System Design for top tech placement interviews.',
      preferredSubjects: ['Data Structures & Algorithms', 'React', 'Database Systems', 'Java'],
      experienceLevel: 'Intermediate',
      preferredFormat: 'Online',
    });

    const demoTutorUser: User = {
      id: 'usr_tutor_demo',
      name: 'Dr. Neha Verma',
      email: 'tutor@demo.tutornest.in',
      role: 'TUTOR',
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      phone: '+91 98111 22334',
      preferredLanguage: 'English',
      createdAt: '2025-11-10T10:00:00Z',
      updatedAt: '2026-02-15T10:00:00Z',
    };
    this.users.set(demoTutorUser.id, demoTutorUser);
    this.setPassword(demoTutorUser.id, process.env.SEED_USER_PASSWORD || crypto.randomBytes(24).toString('hex'));

    const demoAdmin: User = {
      id: 'usr_admin_demo',
      name: 'Platform Administrator',
      email: process.env.INITIAL_ADMIN_EMAIL || 'admin@tutornest.in',
      role: 'ADMIN',
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      phone: '+91 99000 11223',
      preferredLanguage: 'English',
      createdAt: '2025-01-01T10:00:00Z',
      updatedAt: '2026-01-01T10:00:00Z',
    };
    this.users.set(demoAdmin.id, demoAdmin);
    this.setPassword(
      demoAdmin.id,
      process.env.INITIAL_ADMIN_PASSWORD || crypto.randomBytes(32).toString('hex')
    );

    // 3. 22 Verified & Diverse Tutors
    const seedTutorsData: Tutor[] = [
      {
        id: 'usr_tutor_demo',
        name: 'Dr. Neha Verma',
        email: 'tutor@demo.tutornest.in',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
        headline: 'Ph.D. in Computer Science | Former Senior Engineer @ Microsoft | DSA Specialist',
        bio: 'Over 9 years of hands-on teaching experience guiding 400+ students into top product companies. Specializes in intuitive algorithm visualization, dynamic programming, and scalable system design.',
        subjects: ['Data Structures & Algorithms', 'Java', 'Database Systems', 'Computer Science'],
        skills: ['Dynamic Programming', 'Graph Theory', 'System Design', 'Core Java', 'Spring Boot', 'MySQL Optimization'],
        yearsExperience: 9,
        education: 'Ph.D. in Computer Science, IIT Delhi',
        certifications: ['AWS Certified Solutions Architect', 'Oracle Certified Java Professional'],
        languages: ['English', 'Hindi'],
        hourlyRate: 1200,
        teachingFormat: 'Online',
        location: 'Bengaluru, India',
        rating: 4.96,
        reviewCount: 142,
        totalSessions: 520,
        status: 'VERIFIED',
        createdAt: '2025-11-10T10:00:00Z',
        updatedAt: '2026-02-15T10:00:00Z',
      },
      {
        id: 'usr_tutor_2',
        name: 'Prof. Rajesh Kulkarni',
        email: 'rajesh.k@tutornest.in',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
        headline: 'Senior Mathematics Faculty | 12+ Years Coaching JEE Advanced & Olympiad',
        bio: 'Passionate mathematician with a knack for making complex calculus and linear algebra feel intuitive and playful. Helped over 80 students achieve 99+ percentile.',
        subjects: ['Mathematics', 'Statistics & Probability', 'Physics'],
        skills: ['Differential Calculus', 'Integral Transforms', 'Linear Algebra', 'Bayesian Probability', 'Coordinate Geometry'],
        yearsExperience: 12,
        education: 'M.Sc. Applied Mathematics, BITS Pilani',
        certifications: ['National Mathematics Olympiad Mentor', 'AP Calculus BC Certified'],
        languages: ['English', 'Hindi', 'Marathi'],
        hourlyRate: 950,
        teachingFormat: 'Both',
        location: 'Pune, India',
        rating: 4.92,
        reviewCount: 98,
        totalSessions: 380,
        status: 'VERIFIED',
        createdAt: '2025-08-12T10:00:00Z',
        updatedAt: '2026-02-10T10:00:00Z',
      },
      {
        id: 'usr_tutor_3',
        name: 'Sarah Jenkins',
        email: 'sarah.jenkins@tutornest.in',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
        headline: 'Lead Frontend Architect | React & TypeScript Mentor | Ex-Shopify',
        bio: 'Building enterprise React and Next.js applications for 8 years. I mentor aspiring software engineers and career switchers to write clean, component-driven production frontend code.',
        subjects: ['React', 'Web Development', 'Python'],
        skills: ['React 19', 'Next.js App Router', 'TypeScript', 'Tailwind CSS', 'Redux Toolkit', 'State Machines'],
        yearsExperience: 8,
        education: 'B.S. Software Engineering, University of Waterloo',
        certifications: ['Meta Certified Frontend Specialist', 'Google Cloud Web Developer'],
        languages: ['English'],
        hourlyRate: 1400,
        teachingFormat: 'Online',
        location: 'Singapore (UTC+8)',
        rating: 4.98,
        reviewCount: 114,
        totalSessions: 430,
        status: 'VERIFIED',
        createdAt: '2025-09-01T10:00:00Z',
        updatedAt: '2026-02-20T10:00:00Z',
      },
      {
        id: 'usr_tutor_4',
        name: 'Ananya Deshmukh',
        email: 'ananya.d@tutornest.in',
        avatar: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=200&auto=format&fit=crop&q=80',
        headline: 'AI/ML Research Scientist | Python & Deep Learning Educator',
        bio: 'Research engineer focusing on transformers, generative modeling, and computer vision. I break down mathematical proofs into intuitive Python implementations with real-world datasets.',
        subjects: ['Machine Learning', 'Python', 'Statistics & Probability', 'Computer Science'],
        skills: ['PyTorch', 'TensorFlow', 'LLM Fine-tuning', 'NumPy/Pandas', 'Transformers', 'Mathematics for ML'],
        yearsExperience: 6,
        education: 'M.Tech AI, IISc Bangalore',
        certifications: ['DeepLearning.AI Fellow', 'NVIDIA Certified Jetson Specialist'],
        languages: ['English', 'Hindi'],
        hourlyRate: 1600,
        teachingFormat: 'Online',
        location: 'Hyderabad, India',
        rating: 4.89,
        reviewCount: 76,
        totalSessions: 290,
        status: 'VERIFIED',
        createdAt: '2025-10-05T10:00:00Z',
        updatedAt: '2026-02-18T10:00:00Z',
      },
      {
        id: 'usr_tutor_5',
        name: 'Michael Chen',
        email: 'michael.c@tutornest.in',
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=80',
        headline: 'Applied Physicist & Engineering Tutor | Quantum Mechanics & Mechanics',
        bio: 'Making physics approachable and engaging through interactive simulations and real-world experiments. Prepared students for AP Physics 1, 2, and C with 5/5 scores.',
        subjects: ['Physics', 'Mathematics'],
        skills: ['Electromagnetism', 'Classical Mechanics', 'Thermodynamics', 'Wave Optics', 'Experimental Physics'],
        yearsExperience: 7,
        education: 'M.S. Applied Physics, Stanford University',
        certifications: ['National Physics Teacher Guild', 'STEM Excellence Awardee'],
        languages: ['English', 'Mandarin'],
        hourlyRate: 1100,
        teachingFormat: 'Online',
        location: 'London, UK',
        rating: 4.91,
        reviewCount: 82,
        totalSessions: 310,
        status: 'VERIFIED',
        createdAt: '2025-07-20T10:00:00Z',
        updatedAt: '2026-02-12T10:00:00Z',
      },
      {
        id: 'usr_tutor_6',
        name: 'Pooja Bhattacharya',
        email: 'pooja.b@tutornest.in',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
        headline: 'IELTS 9.0 Band Instructor | Executive Business English Coach',
        bio: 'Certified corporate communication coach with 10+ years polishing international speaking fluency, essay structure, business pitch presentations, and IELTS/TOEFL exam prep.',
        subjects: ['English'],
        skills: ['IELTS Speaking & Writing', 'Business Communication', 'Accent Neutralization', 'Grammar Mastery', 'Creative Writing'],
        yearsExperience: 10,
        education: 'M.A. English Literature, Jadavpur University',
        certifications: ['Cambridge CELTA Certified', 'British Council IELTS Trainer'],
        languages: ['English', 'Bengali', 'Hindi'],
        hourlyRate: 750,
        teachingFormat: 'Online',
        location: 'Kolkata, India',
        rating: 4.95,
        reviewCount: 165,
        totalSessions: 610,
        status: 'VERIFIED',
        createdAt: '2025-06-15T10:00:00Z',
        updatedAt: '2026-02-14T10:00:00Z',
      },
      {
        id: 'usr_tutor_7',
        name: 'Karthik Sreenivasan',
        email: 'karthik.s@tutornest.in',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80',
        headline: 'Database Architect & Backend Engineer | MySQL, PostgreSQL & NoSQL Guru',
        bio: 'Specialized in schema modeling, ACID transactions, relational index tuning, query performance analysis, and data pipelines. 8 years architecting high-throughput fintech engines.',
        subjects: ['Database Systems', 'Java', 'Computer Science'],
        skills: ['MySQL Query Optimization', 'PostgreSQL Internals', 'Transaction Isolation Levels', 'Redis Caching', 'Database Sharding'],
        yearsExperience: 8,
        education: 'B.Tech CS, NIT Trichy',
        certifications: ['Oracle Database Certified Master', 'MongoDB Certified Professional'],
        languages: ['English', 'Tamil'],
        hourlyRate: 1150,
        teachingFormat: 'Online',
        location: 'Chennai, India',
        rating: 4.88,
        reviewCount: 64,
        totalSessions: 240,
        status: 'VERIFIED',
        createdAt: '2025-09-18T10:00:00Z',
        updatedAt: '2026-02-05T10:00:00Z',
      },
      {
        id: 'usr_tutor_8',
        name: 'Dr. Emily Watson',
        email: 'emily.w@tutornest.in',
        avatar: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=200&auto=format&fit=crop&q=80',
        headline: 'Doctor of Chemistry | Organic Synthesis Specialist & MCAT Coach',
        bio: 'Demystifying reaction mechanisms, stereochemistry, and orbital theory for pre-med and undergraduate students. Interactive 3D visual models during every session.',
        subjects: ['Chemistry', 'Biology'],
        skills: ['Organic Reaction Mechanisms', 'Spectroscopy NMR/IR', 'Biochemistry Pathways', 'Physical Chemistry Kinetics'],
        yearsExperience: 11,
        education: 'Ph.D. Organic Chemistry, University of Oxford',
        certifications: ['Royal Society of Chemistry Member'],
        languages: ['English'],
        hourlyRate: 1350,
        teachingFormat: 'Online',
        location: 'Oxford, UK',
        rating: 4.94,
        reviewCount: 88,
        totalSessions: 340,
        status: 'VERIFIED',
        createdAt: '2025-05-10T10:00:00Z',
        updatedAt: '2026-02-11T10:00:00Z',
      },
      {
        id: 'usr_tutor_9',
        name: 'Rohan Mehta',
        email: 'rohan.m@tutornest.in',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80',
        headline: 'Full-Stack JavaScript & Node.js Engineer | Web Dev Bootcamp Lead',
        bio: 'Have coached over 200 beginners from writing their first `console.log` to deploying full-stack web applications with authentication, responsive layouts, and payments.',
        subjects: ['Web Development', 'React', 'Python'],
        skills: ['JavaScript ESNext', 'Node.js', 'Express', 'Tailwind CSS', 'REST API Design', 'Git & GitHub'],
        yearsExperience: 5,
        education: 'B.E. Information Technology, Mumbai University',
        certifications: ['FullStack Academy Certified Educator'],
        languages: ['English', 'Hindi', 'Gujarati'],
        hourlyRate: 650,
        teachingFormat: 'Both',
        location: 'Mumbai, India',
        rating: 4.87,
        reviewCount: 92,
        totalSessions: 360,
        status: 'VERIFIED',
        createdAt: '2025-10-22T10:00:00Z',
        updatedAt: '2026-02-17T10:00:00Z',
      },
      {
        id: 'usr_tutor_10',
        name: 'Divya Nair',
        email: 'divya.nair@tutornest.in',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
        headline: 'Data Scientist & Statistical Analyst | Python, R, & Econometrics',
        bio: 'Empowering students and working professionals in exploratory data analysis, hypothesis testing, predictive modeling, and clean data visualization.',
        subjects: ['Python', 'Statistics & Probability', 'Economics'],
        skills: ['Pandas', 'Seaborn/Plotly', 'Hypothesis Testing', 'Time Series Analysis', 'A/B Testing'],
        yearsExperience: 6,
        education: 'M.S. Quantitative Economics, ISI Kolkata',
        certifications: ['SAS Certified Statistical Analyst', 'DataCamp Certified Expert'],
        languages: ['English', 'Malayalam', 'Hindi'],
        hourlyRate: 850,
        teachingFormat: 'Online',
        location: 'Kochi, India',
        rating: 4.90,
        reviewCount: 52,
        totalSessions: 210,
        status: 'VERIFIED',
        createdAt: '2025-11-01T10:00:00Z',
        updatedAt: '2026-02-09T10:00:00Z',
      },
      {
        id: 'usr_tutor_11',
        name: 'Amitabh Sen',
        email: 'amitabh.sen@tutornest.in',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
        headline: 'Enterprise Java & Cloud Systems Specialist | 10+ Years Experience',
        bio: 'Senior consultant specialized in Java 21, Microservices, Spring Cloud, Kafka, and Kubernetes. Passionate about helping developers transition into senior software engineering roles.',
        subjects: ['Java', 'Computer Science', 'Database Systems'],
        skills: ['Spring Boot 3', 'Microservices', 'Kafka', 'Docker', 'JUnit & Mockito', 'Design Patterns'],
        yearsExperience: 10,
        education: 'B.Tech Computer Science, Jadavpur University',
        certifications: ['Pivotal Certified Spring Professional', 'Kubernetes CKA'],
        languages: ['English', 'Hindi', 'Bengali'],
        hourlyRate: 1300,
        teachingFormat: 'Online',
        location: 'Noida, India',
        rating: 4.93,
        reviewCount: 78,
        totalSessions: 310,
        status: 'VERIFIED',
        createdAt: '2025-07-15T10:00:00Z',
        updatedAt: '2026-02-16T10:00:00Z',
      },
      {
        id: 'usr_tutor_12',
        name: 'Claire Beauchamp',
        email: 'claire.b@tutornest.in',
        avatar: 'https://images.unsplash.com/photo-1548142813-c348350df52b?w=200&auto=format&fit=crop&q=80',
        headline: 'Native French Teacher & Alliance Française Certified Examiner',
        bio: 'Learn practical French from a Paris-born educator. Focused on spontaneous everyday speaking, French cultural idioms, and comprehensive DELF A1-C1 certification preparation.',
        subjects: ['French Language'],
        skills: ['Conversational French', 'DELF / DALF Exam Prep', 'French Grammar', 'Phonetics & Pronunciation'],
        yearsExperience: 7,
        education: 'Master in FLE (French as a Foreign Language), Sorbonne University',
        certifications: ['Alliance Française Certified Examiner', 'FLE Level 2'],
        languages: ['French', 'English', 'Spanish'],
        hourlyRate: 900,
        teachingFormat: 'Online',
        location: 'Paris, France',
        rating: 4.97,
        reviewCount: 89,
        totalSessions: 390,
        status: 'VERIFIED',
        createdAt: '2025-08-01T10:00:00Z',
        updatedAt: '2026-02-15T10:00:00Z',
      },
      {
        id: 'usr_tutor_13',
        name: 'Arjun Mathur',
        email: 'arjun.m@tutornest.in',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
        headline: 'Competitive Programmer & LeetCode Guardian (Rating: 2350+)',
        bio: 'Cracked interviews at Google, Uber and Atlassian. I teach how to approach unknown problem patterns, recognize constraints, and write bug-free solutions within timed pressure.',
        subjects: ['Data Structures & Algorithms', 'Python', 'Computer Science'],
        skills: ['Segment Trees', 'Dynamic Programming', 'Trie & Binary Lifting', 'Bit Manipulation', 'Mock Interviews'],
        yearsExperience: 4,
        education: 'B.Tech IT, IIIT Hyderabad',
        certifications: ['Codeforces Candidate Master', 'ICPC Regionalist'],
        languages: ['English', 'Hindi'],
        hourlyRate: 1500,
        teachingFormat: 'Online',
        location: 'Hyderabad, India',
        rating: 4.99,
        reviewCount: 135,
        totalSessions: 490,
        status: 'VERIFIED',
        createdAt: '2025-09-12T10:00:00Z',
        updatedAt: '2026-02-21T10:00:00Z',
      },
      {
        id: 'usr_tutor_14',
        name: 'Sunita Rao',
        email: 'sunita.rao@tutornest.in',
        avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&auto=format&fit=crop&q=80',
        headline: 'Senior Biology Lecturer | NEET Medical Entrance Specialist',
        bio: 'Over 11 years coaching prospective doctors. Special focus on Human Physiology, Genetics, Biotechnology, and Botany mnemonics with detailed visual mind maps.',
        subjects: ['Biology', 'Chemistry'],
        skills: ['Human Anatomy', 'Molecular Genetics', 'Biotechnology Principles', 'Ecology', 'NEET Past Papers'],
        yearsExperience: 11,
        education: 'M.Sc. Life Sciences, Delhi University',
        certifications: ['National Pre-Med Mentor of the Year (2023)'],
        languages: ['English', 'Hindi'],
        hourlyRate: 800,
        teachingFormat: 'Both',
        location: 'New Delhi, India',
        rating: 4.91,
        reviewCount: 110,
        totalSessions: 450,
        status: 'VERIFIED',
        createdAt: '2025-06-01T10:00:00Z',
        updatedAt: '2026-02-19T10:00:00Z',
      },
      {
        id: 'usr_tutor_15',
        name: 'Tanya Gupta',
        email: 'tanya.gupta@tutornest.in',
        avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&auto=format&fit=crop&q=80',
        headline: 'Financial Analyst & Macroeconomics Educator | CFA Charterholder',
        bio: 'Demystifying macroeconomic policy, monetary theory, corporate valuation, and econometric modeling for university students and career professionals.',
        subjects: ['Economics', 'Mathematics'],
        skills: ['DCF Valuation', 'Macroeconomic Indicators', 'Monetary Policy', 'Financial Statement Analysis'],
        yearsExperience: 6,
        education: 'B.A. (Hons) Economics, St. Stephen\'s College',
        certifications: ['CFA Charterholder', 'FRM Certified'],
        languages: ['English', 'Hindi'],
        hourlyRate: 1050,
        teachingFormat: 'Online',
        location: 'Gurugram, India',
        rating: 4.86,
        reviewCount: 44,
        totalSessions: 180,
        status: 'VERIFIED',
        createdAt: '2025-10-10T10:00:00Z',
        updatedAt: '2026-02-08T10:00:00Z',
      },
      {
        id: 'usr_tutor_16',
        name: 'Harsh Vardhan',
        email: 'harsh.v@tutornest.in',
        avatar: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?w=200&auto=format&fit=crop&q=80',
        headline: 'Applied Math & Calculus Specialist | Engineering Mathematics Coach',
        bio: 'Focus on Vector Calculus, Ordinary and Partial Differential Equations, Complex Variables, and Fourier Transforms for engineering and science students.',
        subjects: ['Mathematics', 'Physics'],
        skills: ['Multivariable Calculus', 'Laplace Transforms', 'Fourier Analysis', 'Probability Models'],
        yearsExperience: 5,
        education: 'M.Sc. Mathematics, IIT Kanpur',
        certifications: ['GATE Mathematics Qualified (AIR 48)'],
        languages: ['English', 'Hindi'],
        hourlyRate: 700,
        teachingFormat: 'Online',
        location: 'Kanpur, India',
        rating: 4.84,
        reviewCount: 39,
        totalSessions: 160,
        status: 'VERIFIED',
        createdAt: '2025-11-20T10:00:00Z',
        updatedAt: '2026-02-13T10:00:00Z',
      },
      {
        id: 'usr_tutor_17',
        name: 'Elena Rostova',
        email: 'elena.r@tutornest.in',
        avatar: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?w=200&auto=format&fit=crop&q=80',
        headline: 'Computer Vision & Deep Learning Engineer | PyTorch Mentor',
        bio: 'Experienced in developing state-of-the-art vision models for autonomous robotics and medical imaging. Hands-on coding sessions focusing on OpenCV, PyTorch, and YOLO architectures.',
        subjects: ['Machine Learning', 'Python'],
        skills: ['OpenCV', 'CNN Architectures', 'YOLO Object Detection', 'Transfer Learning', 'Edge AI Deployment'],
        yearsExperience: 7,
        education: 'M.S. Robotics, ETH Zurich',
        certifications: ['NVIDIA DLI Certified Instructor'],
        languages: ['English', 'Russian'],
        hourlyRate: 1750,
        teachingFormat: 'Online',
        location: 'Zurich, Switzerland',
        rating: 4.95,
        reviewCount: 62,
        totalSessions: 220,
        status: 'VERIFIED',
        createdAt: '2025-08-25T10:00:00Z',
        updatedAt: '2026-02-14T10:00:00Z',
      },
      {
        id: 'usr_tutor_18',
        name: 'Aditya Kulkarni',
        email: 'aditya.kulkarni@tutornest.in',
        avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80',
        headline: 'Modern Web Developer | Full-Stack MERN & Next.js Mentor',
        bio: 'Passionate about pragmatic software engineering. Learn to build modern responsive websites, manage databases, write clean APIs, and implement secure JWT authentication.',
        subjects: ['Web Development', 'React', 'Database Systems'],
        skills: ['React.js', 'Express.js', 'MongoDB', 'PostgreSQL', 'REST APIs', 'CSS Grid/Flexbox'],
        yearsExperience: 4,
        education: 'B.E. CS, Pune Institute of Computer Technology',
        certifications: ['Meta Certified Professional'],
        languages: ['English', 'Marathi', 'Hindi'],
        hourlyRate: 600,
        teachingFormat: 'Both',
        location: 'Pune, India',
        rating: 4.88,
        reviewCount: 47,
        totalSessions: 195,
        status: 'VERIFIED',
        createdAt: '2025-11-15T10:00:00Z',
        updatedAt: '2026-02-16T10:00:00Z',
      },
      {
        id: 'usr_tutor_19',
        name: 'Dr. Suresh Narayan',
        email: 'suresh.n@tutornest.in',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
        headline: 'Professor Emeritus of Physics | 20+ Years Mentoring Academics',
        bio: 'Retired physics department chair offering deep, fundamental mastery in classical mechanics, relativity, and electromagnetic fields for university undergrads.',
        subjects: ['Physics', 'Mathematics'],
        skills: ['Special Relativity', 'Quantum Mechanics', 'Hamiltonian Formalism', 'Optics'],
        yearsExperience: 22,
        education: 'Ph.D. Theoretical Physics, TIFR Mumbai',
        certifications: ['Fellow of Indian Academy of Sciences'],
        languages: ['English', 'Hindi', 'Tamil'],
        hourlyRate: 1500,
        teachingFormat: 'Online',
        location: 'Chennai, India',
        rating: 4.97,
        reviewCount: 140,
        totalSessions: 580,
        status: 'VERIFIED',
        createdAt: '2025-04-10T10:00:00Z',
        updatedAt: '2026-02-10T10:00:00Z',
      },
      {
        id: 'usr_tutor_20',
        name: 'Meera Nambiar',
        email: 'meera.n@tutornest.in',
        avatar: 'https://images.unsplash.com/photo-1534751516642-a171edd2521d?w=200&auto=format&fit=crop&q=80',
        headline: 'Senior Speech & Language Specialist | Academic Writing Mentor',
        bio: 'Helping high school and university students develop persuasive thesis statements, research paper citations (APA/MLA), and clear speech delivery.',
        subjects: ['English'],
        skills: ['Academic Essay Writing', 'Public Speaking', 'Vocabulary Building', 'Critical Reading'],
        yearsExperience: 8,
        education: 'M.A. Linguistics, University of Edinburgh',
        certifications: ['TESOL Master Practitioner'],
        languages: ['English', 'Malayalam'],
        hourlyRate: 750,
        teachingFormat: 'Online',
        location: 'Bengaluru, India',
        rating: 4.92,
        reviewCount: 73,
        totalSessions: 290,
        status: 'VERIFIED',
        createdAt: '2025-08-18T10:00:00Z',
        updatedAt: '2026-02-09T10:00:00Z',
      },
      // Pending verification tutors for Admin verification workflow
      {
        id: 'usr_tutor_pending_1',
        name: 'Varun Somani',
        email: 'varun.somani@example.com',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80',
        headline: 'Full-Stack Developer & Blockchain Enthusiast | Applying for Solidity & React',
        bio: '4 years developing decentralized applications and modern frontends. Looking to teach Web3 fundamentals and modern JavaScript on TutorNest.',
        subjects: ['Web Development', 'React', 'Computer Science'],
        skills: ['Solidity', 'Web3.js', 'React', 'Node.js'],
        yearsExperience: 4,
        education: 'B.Tech IT, VIT Vellore',
        certifications: ['Ethereum Developer Certified'],
        languages: ['English', 'Hindi'],
        hourlyRate: 850,
        teachingFormat: 'Online',
        location: 'Bengaluru, India',
        rating: 0,
        reviewCount: 0,
        totalSessions: 0,
        status: 'PENDING',
        createdAt: '2026-02-18T14:30:00Z',
        updatedAt: '2026-02-18T14:30:00Z',
      },
      {
        id: 'usr_tutor_pending_2',
        name: 'Deepika Iyer',
        email: 'deepika.iyer@example.com',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
        headline: 'M.Sc. Organic Chemistry Candidate | Applying for Chemistry Mentorship',
        bio: 'Passionate about making high school and college chemistry accessible through molecular structure visualization.',
        subjects: ['Chemistry'],
        skills: ['Organic Chemistry', 'Physical Chemistry', 'Lab Safety'],
        yearsExperience: 2,
        education: 'M.Sc. Chemistry, University of Hyderabad',
        certifications: ['CSIR NET Qualified'],
        languages: ['English', 'Tamil', 'Telugu'],
        hourlyRate: 500,
        teachingFormat: 'Online',
        location: 'Hyderabad, India',
        rating: 0,
        reviewCount: 0,
        totalSessions: 0,
        status: 'PENDING',
        createdAt: '2026-02-20T09:15:00Z',
        updatedAt: '2026-02-20T09:15:00Z',
      },
    ];

    seedTutorsData.forEach(t => {
      this.tutors.set(t.id, t);
      // Ensure user record exists
      if (!this.users.has(t.id)) {
        this.users.set(t.id, {
          id: t.id,
          name: t.name,
          email: t.email,
          role: 'TUTOR',
          status: 'ACTIVE',
          avatar: t.avatar,
          phone: '+91 98765 00000',
          preferredLanguage: t.languages[0] || 'English',
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
        });
      }
    });

    // 4. Seed 50+ Students
    const studentNames = [
      'Riya Kapoor', 'Kabir Sen', 'Tanvi Mehta', 'Ishaan Gupta', 'Ananya Roy',
      'Rohan Singhania', 'Siddharth Patel', 'Diya Joshi', 'Aryan Nair', 'Sneha Rao',
      'Aditya Sharma', 'Pooja Reddy', 'Manish Agarwal', 'Kavya Pillai', 'Nikhil Saxena',
      'Simran Kaur', 'Akash Jain', 'Shreya Banerjee', 'Raghav Verma', 'Neha Choudhury',
      'Pranav Kulkarni', 'Anushka Sengupta', 'Devansh Bhat', 'Tara Namboodiri', 'Dhruv Malhotra',
      'Pallavi Swaminathan', 'Varun Goswami', 'Bhavna Menon', 'Gautam Trivedi', 'Kriti Chopra',
      'Rishi Mukherjee', 'Juhi Saxena', 'Karan Oberoi', 'Natasha Mehra', 'Ayush Tyagi',
      'Rachita Pillai', 'Mihir Godbole', 'Swati Deshmukh', 'Yash Vashisht', 'Preeti Sundaram',
      'Kartik Somani', 'Lavanya Iyer', 'Sanjay Bhatt', 'Mallika Sen', 'Abhishek Deodhar',
      'Radhika Mittal', 'Udayan Ghosh', 'Rhea Madhavan', 'Sameer Alva', 'Geetika Das'
    ];

    studentNames.forEach((name, idx) => {
      const id = `usr_student_${idx + 1}`;
      const email = `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`;
      this.users.set(id, {
        id,
        name,
        email,
        role: 'STUDENT',
        status: 'ACTIVE',
        avatar: `https://images.unsplash.com/photo-${1534528741775 + (idx % 10)}?w=100&auto=format&fit=crop&q=80`,
        phone: `+91 98${idx.toString().padStart(8, '1')}`,
        preferredLanguage: 'English',
        createdAt: '2026-01-10T10:00:00Z',
        updatedAt: '2026-02-01T10:00:00Z',
      });
      this.studentProfiles.set(id, {
        userId: id,
        learningGoals: 'Prepare for campus placements and master software engineering fundamentals.',
        preferredSubjects: ['Data Structures & Algorithms', 'React', 'Mathematics'],
        experienceLevel: idx % 3 === 0 ? 'Beginner' : idx % 3 === 1 ? 'Intermediate' : 'Advanced',
        preferredFormat: idx % 2 === 0 ? 'Online' : 'Either',
      });
    });

    // 5. Seed 120+ Availability Slots for Tutors (Dates: Today + next 7 days)
    const today = new Date();
    const timeSlots = ['09:00', '10:30', '14:00', '15:30', '17:00', '18:30', '20:00'];
    const tutorsList = Array.from(this.tutors.values()).filter(t => t.status === 'VERIFIED');

    tutorsList.forEach(tutor => {
      for (let dayOffset = 0; dayOffset <= 6; dayOffset++) {
        const slotDate = new Date(today);
        slotDate.setDate(today.getDate() + dayOffset);
        const dateStr = slotDate.toISOString().split('T')[0];
        const dayOfWeek = slotDate.getDay();

        // 3-4 slots per day
        const dailySlots = timeSlots.slice(dayOffset % 2, (dayOffset % 2) + 4);
        dailySlots.forEach((st, sIdx) => {
          const slotId = `slot_${tutor.id}_${dateStr}_${st.replace(':', '')}`;
          const [h, m] = st.split(':').map(Number);
          const endHour = h + 1;
          const endTime = `${endHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

          this.availabilitySlots.set(slotId, {
            id: slotId,
            tutorId: tutor.id,
            dayOfWeek,
            date: dateStr,
            startTime: st,
            endTime,
            isBooked: false,
            mode: tutor.teachingFormat === 'Both' ? 'Both' : tutor.teachingFormat,
          });
        });
      }
    });

    // 6. Seed Realistic Bookings (Confirmed, Completed with reviews, Cancelled)
    const sampleDates = [
      new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0], // 5 days ago
      new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0], // 3 days ago
      new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0], // yesterday
      new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0], // tomorrow
      new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0], // 3 days ahead
    ];

    // Booking 1: Upcoming confirmed booking for demo student with demo tutor
    const b1Id = 'bk_demo_confirmed_1';
    const b1: Booking = {
      id: b1Id,
      bookingReference: 'TN-2026-8941',
      studentId: demoStudent.id,
      studentName: demoStudent.name,
      studentEmail: demoStudent.email,
      tutorId: demoTutorUser.id,
      tutorName: demoTutorUser.name,
      tutorAvatar: demoTutorUser.avatar,
      tutorHeadline: 'Ph.D. in Computer Science | Former Senior Engineer @ Microsoft',
      subject: 'Data Structures & Algorithms',
      date: sampleDates[3], // Tomorrow
      startTime: '10:30',
      endTime: '11:30',
      durationMinutes: 60,
      teachingFormat: 'Online',
      sessionNotes: 'Need deep-dive on Dynamic Programming memoization vs tabulation.',
      meetingLink: 'https://meet.google.com/tn-ds-algo-live',
      hourlyRate: 1200,
      subtotal: 1200,
      platformFee: 40,
      totalAmount: 1240,
      currency: 'INR',
      status: 'CONFIRMED',
      paymentId: 'pay_demo_8941',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    };
    this.bookings.set(b1.id, b1);
    // Mark slot as booked
    const slotKey1 = `slot_${demoTutorUser.id}_${sampleDates[3]}_1030`;
    if (this.availabilitySlots.has(slotKey1)) {
      this.availabilitySlots.get(slotKey1)!.isBooked = true;
    }

    // Payment for Booking 1
    const p1: PaymentTransaction = {
      id: 'txn_demo_8941',
      orderId: 'order_TN_8941',
      paymentId: 'pay_demo_8941',
      bookingId: b1.id,
      studentId: demoStudent.id,
      studentName: demoStudent.name,
      tutorId: demoTutorUser.id,
      amount: 1240,
      currency: 'INR',
      status: 'SUCCESS',
      paymentMethod: 'Razorpay UPI',
      gatewayFee: 24.8,
      platformFee: 40,
      tutorPayout: 1200,
      invoiceNumber: 'INV-2026-0041',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      completedAt: new Date(Date.now() - 86400000).toISOString(),
    };
    this.payments.set(p1.id, p1);

    // Payment for Booking 2
    const p2: PaymentTransaction = {
      id: 'txn_demo_8210',
      orderId: 'order_TN_8210',
      paymentId: 'pay_demo_8210',
      bookingId: 'bk_demo_completed_2',
      studentId: demoStudent.id,
      studentName: demoStudent.name,
      tutorId: 'usr_tutor_3',
      amount: 1440,
      currency: 'INR',
      status: 'SUCCESS',
      paymentMethod: 'Netbanking',
      gatewayFee: 28.8,
      platformFee: 40,
      tutorPayout: 1400,
      invoiceNumber: 'INV-2026-0042',
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      completedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    };
    this.payments.set(p2.id, p2);

    // Booking 2: Completed session with Review
    const b2Id = 'bk_demo_completed_2';
    const b2: Booking = {
      id: b2Id,
      bookingReference: 'TN-2026-8210',
      studentId: demoStudent.id,
      studentName: demoStudent.name,
      studentEmail: demoStudent.email,
      tutorId: 'usr_tutor_3', // Sarah Jenkins
      tutorName: 'Sarah Jenkins',
      tutorAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&auto=format&fit=crop&q=80',
      tutorHeadline: 'Lead Frontend Architect | React & TypeScript Mentor',
      subject: 'React',
      date: sampleDates[1], // 3 days ago
      startTime: '15:30',
      endTime: '16:30',
      durationMinutes: 60,
      teachingFormat: 'Online',
      sessionNotes: 'React 19 Server Components and Suspense architectural patterns.',
      meetingLink: 'https://meet.google.com/tn-react-arch',
      hourlyRate: 1400,
      subtotal: 1400,
      platformFee: 40,
      totalAmount: 1440,
      currency: 'INR',
      status: 'COMPLETED',
      paymentId: 'pay_demo_8210',
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    };
    this.bookings.set(b2.id, b2);

    const r2: Review = {
      id: 'rev_demo_8210',
      bookingId: b2.id,
      tutorId: 'usr_tutor_3',
      studentId: demoStudent.id,
      studentName: demoStudent.name,
      studentAvatar: demoStudent.avatar,
      rating: 5,
      comment: 'Sarah is an outstanding instructor! She walked through React 19 concurrent features with crystal clarity and reviewed my code live. Boosted my confidence immensely.',
      subject: 'React',
      tutorResponse: 'Thank you Aarav! You asked brilliant architectural questions. Keep pushing your state management skills!',
      tutorRespondedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      createdAt: new Date(Date.now() - 2.5 * 86400000).toISOString(),
    };
    this.reviews.set(r2.id, r2);

    // Booking 3: Cancelled session
    const b3Id = 'bk_demo_cancelled_3';
    const b3: Booking = {
      id: b3Id,
      bookingReference: 'TN-2026-7734',
      studentId: demoStudent.id,
      studentName: demoStudent.name,
      studentEmail: demoStudent.email,
      tutorId: 'usr_tutor_2', // Prof. Rajesh
      tutorName: 'Prof. Rajesh Kulkarni',
      tutorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
      tutorHeadline: 'Senior Mathematics Faculty | JEE Advanced Specialist',
      subject: 'Mathematics',
      date: sampleDates[0],
      startTime: '14:00',
      endTime: '15:00',
      durationMinutes: 60,
      teachingFormat: 'Online',
      sessionNotes: 'Vector calculus Stokes theorem problem set.',
      hourlyRate: 950,
      subtotal: 950,
      platformFee: 40,
      totalAmount: 990,
      currency: 'INR',
      status: 'CANCELLED',
      cancellationReason: 'Student had university exam conflict; cancelled >24h prior for 100% refund.',
      refundAmount: 990,
      createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 86400000).toISOString(),
    };
    this.bookings.set(b3.id, b3);

    // 7. Seed 20 more bookings across other students to populate Admin and Tutor metrics
    const moreSubjects = ['Data Structures & Algorithms', 'Python', 'React', 'Physics', 'Mathematics', 'Machine Learning', 'Java', 'English'];
    for (let i = 1; i <= 25; i++) {
      const stUser = this.users.get(`usr_student_${i}`) || demoStudent;
      const tut = tutorsList[i % tutorsList.length];
      const subj = moreSubjects[i % moreSubjects.length];
      const status: any = i % 5 === 0 ? 'COMPLETED' : i % 7 === 0 ? 'CANCELLED' : 'CONFIRMED';
      const bId = `bk_seed_${i}`;
      const rate = tut.hourlyRate;
      const subtotal = rate;
      const total = subtotal + 40;

      const bk: Booking = {
        id: bId,
        bookingReference: `TN-2026-${9100 + i}`,
        studentId: stUser.id,
        studentName: stUser.name,
        studentEmail: stUser.email,
        tutorId: tut.id,
        tutorName: tut.name,
        tutorAvatar: tut.avatar,
        tutorHeadline: tut.headline,
        subject: subj,
        date: sampleDates[i % sampleDates.length],
        startTime: timeSlots[i % timeSlots.length],
        endTime: '11:00',
        durationMinutes: 60,
        teachingFormat: 'Online',
        hourlyRate: rate,
        subtotal,
        platformFee: 40,
        totalAmount: total,
        currency: 'INR',
        status,
        meetingLink: status === 'CONFIRMED' ? `https://meet.google.com/tn-seed-${i}` : undefined,
        createdAt: new Date(Date.now() - (i * 3600000 * 12)).toISOString(),
        updatedAt: new Date(Date.now() - (i * 3600000 * 6)).toISOString(),
      };
      this.bookings.set(bId, bk);

      // Payment for each
      const pay: PaymentTransaction = {
        id: `txn_seed_${i}`,
        orderId: `order_seed_${i}`,
        paymentId: `pay_seed_${i}`,
        bookingId: bId,
        studentId: stUser.id,
        studentName: stUser.name,
        tutorId: tut.id,
        amount: total,
        currency: 'INR',
        status: status === 'CANCELLED' ? 'REFUNDED' : 'SUCCESS',
        paymentMethod: i % 2 === 0 ? 'Razorpay UPI' : 'Card',
        gatewayFee: total * 0.02,
        platformFee: 40,
        tutorPayout: rate,
        invoiceNumber: `INV-2026-${(1000 + i).toString()}`,
        createdAt: bk.createdAt,
        completedAt: bk.updatedAt,
      };
      this.payments.set(pay.id, pay);

      // Seed Reviews for completed bookings
      if (status === 'COMPLETED') {
        const reviewText = [
          'Excellent session! Explained each step systematically and ensured I could reproduce the logic independently.',
          'Truly professional tutor. The visual diagrams made the concepts instantly click for me.',
          'Very patient and thorough. Solved all my edge cases with clear explanation.',
        ][i % 3];

        const rev: Review = {
          id: `rev_seed_${i}`,
          bookingId: bId,
          tutorId: tut.id,
          studentId: stUser.id,
          studentName: stUser.name,
          studentAvatar: stUser.avatar,
          rating: 5,
          comment: reviewText,
          subject: subj,
          createdAt: new Date(Date.now() - (i * 3600000 * 4)).toISOString(),
        };
        this.reviews.set(rev.id, rev);
      }
    }

    // 8. Seed Learning Goals for Demo Student
    this.learningGoals = [
      {
        id: 'goal_1',
        studentId: demoStudent.id,
        title: 'Master Dynamic Programming Patterns',
        subject: 'Data Structures & Algorithms',
        targetHours: 20,
        completedHours: 14,
        targetDate: '2026-03-31',
        status: 'IN_PROGRESS',
      },
      {
        id: 'goal_2',
        studentId: demoStudent.id,
        title: 'Complete Production React 19 Architecture',
        subject: 'React',
        targetHours: 15,
        completedHours: 10,
        targetDate: '2026-04-15',
        status: 'IN_PROGRESS',
      },
      {
        id: 'goal_3',
        studentId: demoStudent.id,
        title: 'SQL Index Tuning & Transaction Isolation',
        subject: 'Database Systems',
        targetHours: 12,
        completedHours: 12,
        targetDate: '2026-02-15',
        status: 'COMPLETED',
      },
    ];

    // 9. Seed Messaging between Demo Student & Demo Tutor
    const convId = 'conv_demo_student_tutor';
    this.conversations.set(convId, {
      id: convId,
      studentId: demoStudent.id,
      studentName: demoStudent.name,
      tutorId: demoTutorUser.id,
      tutorName: demoTutorUser.name,
      subject: 'Data Structures & Algorithms',
      lastMessage: 'Looking forward to our session tomorrow at 10:30 AM! Please have your LeetCode setup ready.',
      lastMessageTime: new Date(Date.now() - 3600000 * 2).toISOString(),
      unreadCountStudent: 0,
      unreadCountTutor: 0,
      activeBookingId: b1.id,
    });

    this.messages.push(
      {
        id: 'msg_1',
        conversationId: convId,
        senderId: demoStudent.id,
        senderName: demoStudent.name,
        senderRole: 'STUDENT',
        content: 'Hi Dr. Neha, I booked our session for tomorrow on Dynamic Programming. Looking forward to it!',
        timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
        read: true,
      },
      {
        id: 'msg_2',
        conversationId: convId,
        senderId: demoTutorUser.id,
        senderName: demoTutorUser.name,
        senderRole: 'TUTOR',
        content: 'Hi Aarav! Looking forward to our session tomorrow at 10:30 AM! Please have your LeetCode setup ready.',
        timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
        read: true,
      }
    );

    // 10. Seed Notifications for Demo Student & Demo Tutor
    this.notifications.push(
      {
        id: 'notif_1',
        userId: demoStudent.id,
        type: 'BOOKING_CONFIRMED',
        title: 'Session Confirmed with Dr. Neha Verma',
        message: 'Your Data Structures & Algorithms session on tomorrow at 10:30 AM is confirmed. Meeting link ready.',
        read: false,
        link: '/bookings',
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      },
      {
        id: 'notif_2',
        userId: demoStudent.id,
        type: 'PAYMENT_SUCCESS',
        title: 'Payment Successful (₹1,240)',
        message: 'Transaction TN-2026-8941 processed via Razorpay UPI. Receipt INV-2026-0041 generated.',
        read: false,
        link: '/bookings',
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      },
      {
        id: 'notif_3',
        userId: demoTutorUser.id,
        type: 'BOOKING_CONFIRMED',
        title: 'New Booking from Aarav Sharma',
        message: 'Aarav booked a 60-minute session for Data Structures & Algorithms on tomorrow at 10:30 AM.',
        read: false,
        link: '/tutor/bookings',
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
      }
    );

    // 11. Seed Audit Logs for Admins
    this.auditLogs.push(
      {
        id: 'audit_init_1',
        actorId: demoAdmin.id,
        actorName: demoAdmin.name,
        actorRole: 'ADMIN',
        action: 'TUTOR_VERIFIED',
        entity: 'Tutor',
        entityId: demoTutorUser.id,
        metadata: { tutorName: demoTutorUser.name, credentialsVerified: true },
        ipAddress: '10.0.4.12',
        timestamp: '2025-11-12T14:20:00Z',
      },
      {
        id: 'audit_init_2',
        actorId: demoAdmin.id,
        actorName: demoAdmin.name,
        actorRole: 'ADMIN',
        action: 'PLATFORM_SETTINGS_UPDATED',
        entity: 'SystemSettings',
        entityId: 'global_settings',
        metadata: { platformFeeFixed: 40, cancellationFullRefundHours: 24 },
        ipAddress: '10.0.4.12',
        timestamp: '2026-01-05T09:30:00Z',
      }
    );
  }
}

export const store = new PostgresStore();
