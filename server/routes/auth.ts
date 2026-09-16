import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';
import { User, StudentProfile, Tutor } from '../db/types.js';

export const authRouter = Router();

// Helper to get authenticated user from request header
export function getAuthUser(req: Request): User | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  return store.getUserForToken(token);
}

// POST /api/auth/login
authRouter.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
      errorCode: 'MISSING_CREDENTIALS',
      timestamp: new Date().toISOString(),
    });
  }

  // Find users by their registered email only. Role switching is not authentication.
  const cleanInput = (email || '').trim().toLowerCase();
  const user = Array.from(store.users.values()).find(u => {
    return u.email.toLowerCase() === cleanInput;
  });

  if (!user || !store.verifyPassword(user.id, password)) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password',
      errorCode: 'INVALID_CREDENTIALS',
      timestamp: new Date().toISOString(),
    });
  }

  if (user.status !== 'ACTIVE') {
    return res.status(403).json({
      success: false,
      message: 'This account is not active. Please contact support.',
      errorCode: 'ACCOUNT_SUSPENDED',
      timestamp: new Date().toISOString(),
    });
  }

  const token = store.createSession(user.id);

  res.json({
    success: true,
    data: {
      user,
      token,
      tutorProfile: user.role === 'TUTOR' ? store.tutors.get(user.id) : undefined,
      studentProfile: user.role === 'STUDENT' ? store.studentProfiles.get(user.id) : undefined,
    },
    message: 'Logged in successfully',
    timestamp: new Date().toISOString(),
  });
});

// POST /api/auth/register
authRouter.post('/register', (req: Request, res: Response) => {
  const {
    name,
    email,
    password,
    role, // 'STUDENT' | 'TUTOR' (ADMIN blocked)
    phone,
    preferredLanguage,
    // Student fields
    learningGoals,
    preferredSubjects,
    experienceLevel,
    preferredFormat,
    // Tutor fields
    headline,
    bio,
    subjects,
    skills,
    yearsExperience,
    education,
    hourlyRate,
  } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({
      success: false,
      message: 'Name, email, password, and role are required',
      errorCode: 'VALIDATION_ERROR',
      timestamp: new Date().toISOString(),
    });
  }

  if (role !== 'STUDENT' && role !== 'TUTOR') {
    return res.status(403).json({
      success: false,
      message: 'Admin accounts cannot be registered publicly',
      errorCode: 'FORBIDDEN_ROLE',
      timestamp: new Date().toISOString(),
    });
  }

  // Check if email already registered
  const existingUser = Array.from(store.users.values()).find(
    u => u.email.toLowerCase() === email.toLowerCase()
  );

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'Email is already registered. Please login.',
      errorCode: 'EMAIL_ALREADY_EXISTS',
      timestamp: new Date().toISOString(),
    });
  }

  const newUserId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const newUser: User = {
    id: newUserId,
    name,
    email,
    role,
    status: 'ACTIVE',
    avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
    phone: phone || '+91 98000 00000',
    preferredLanguage: preferredLanguage || 'English',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  store.users.set(newUser.id, newUser);
  store.setPassword(newUser.id, password);

  let tutorRecord: Tutor | undefined = undefined;
  let studentRecord: StudentProfile | undefined = undefined;

  if (role === 'STUDENT') {
    studentRecord = {
      userId: newUserId,
      learningGoals: learningGoals || 'Master concepts and build practical skills.',
      preferredSubjects: preferredSubjects || ['Mathematics', 'Computer Science'],
      experienceLevel: experienceLevel || 'Beginner',
      preferredFormat: preferredFormat || 'Online',
    };
    store.studentProfiles.set(newUserId, studentRecord);

    store.createNotification(
      newUserId,
      'SYSTEM_ALERT',
      'Welcome to TutorNest!',
      'Find your ideal tutor, book flexible sessions, and make real progress toward your goals.'
    );
  } else if (role === 'TUTOR') {
    tutorRecord = {
      id: newUserId,
      name,
      email,
      avatar: newUser.avatar,
      headline: headline || 'Passionate Educator & Mentor',
      bio: bio || 'Dedicated to student success with structured conceptual learning.',
      subjects: Array.isArray(subjects) ? subjects : ['Computer Science'],
      skills: Array.isArray(skills) ? skills : ['Mentorship', 'Problem Solving'],
      yearsExperience: Number(yearsExperience) || 3,
      education: education || 'Bachelor of Science / Engineering',
      certifications: ['Certified Educator'],
      languages: [preferredLanguage || 'English'],
      hourlyRate: Number(hourlyRate) || 800,
      teachingFormat: 'Online',
      location: 'India',
      rating: 5.0,
      reviewCount: 0,
      totalSessions: 0,
      status: store.systemSettings.autoApproveTutors ? 'VERIFIED' : 'PENDING',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.tutors.set(newUserId, tutorRecord);

    // Create availability slots for this new tutor
    const today = new Date();
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i + 1);
      const dateStr = d.toISOString().split('T')[0];
      ['10:00', '14:00', '17:00'].forEach(st => {
        const slotId = `slot_${newUserId}_${dateStr}_${st.replace(':', '')}`;
        const [h, m] = st.split(':').map(Number);
        store.availabilitySlots.set(slotId, {
          id: slotId,
          tutorId: newUserId,
          dayOfWeek: d.getDay(),
          date: dateStr,
          startTime: st,
          endTime: `${(h + 1).toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
          isBooked: false,
          mode: 'Online',
        });
      });
    }

    store.createNotification(
      newUserId,
      'TUTOR_VERIFIED',
      tutorRecord.status === 'VERIFIED' ? 'Profile Verified!' : 'Application Submitted for Review',
      tutorRecord.status === 'VERIFIED'
        ? 'Your profile is live! Students can now discover and book sessions with you.'
        : 'Our academic review team is reviewing your credentials. Approval takes within 24 hours.'
    );

    // Admin audit
    store.logAudit('SYSTEM', 'System Auto-Log', 'ADMIN', 'TUTOR_REGISTERED', 'Tutor', newUserId, {
      name,
      email,
      status: tutorRecord.status,
    });
  }

  res.status(201).json({
    success: true,
    data: {
      user: newUser,
      token: store.createSession(newUser.id),
      tutorProfile: tutorRecord,
      studentProfile: studentRecord,
    },
    message: role === 'TUTOR' 
      ? 'Tutor application registered successfully' 
      : 'Account created successfully',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/auth/me
authRouter.get('/me', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Unauthenticated session',
      errorCode: 'UNAUTHORIZED',
      timestamp: new Date().toISOString(),
    });
  }

  res.json({
    success: true,
    data: {
      user,
      tutorProfile: user.role === 'TUTOR' ? store.tutors.get(user.id) : undefined,
      studentProfile: user.role === 'STUDENT' ? store.studentProfiles.get(user.id) : undefined,
    },
    timestamp: new Date().toISOString(),
  });
});

// POST /api/auth/logout
authRouter.post('/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    store.revokeSession(authHeader.replace('Bearer ', '').trim());
  }
  res.json({
    success: true,
    message: 'Logged out successfully',
    timestamp: new Date().toISOString(),
  });
});
