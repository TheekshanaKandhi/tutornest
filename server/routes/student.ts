import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';
import { requireRole } from '../middleware/auth.js';

export const studentRouter = Router();

// Strictly enforce STUDENT role across all /api/student/** routes
studentRouter.use(requireRole('STUDENT'));

// GET /api/student/dashboard
studentRouter.get('/dashboard', (req: Request, res: Response) => {
  const user = (req as any).user;
  const studentProfile = store.studentProfiles.get(user.id);
  const bookings = Array.from(store.bookings.values()).filter(b => b.studentId === user.id);
  const goals = store.learningGoals.filter(g => g.studentId === user.id);

  const upcomingBookings = bookings.filter(b => b.status === 'CONFIRMED');
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
  const totalHours = completedBookings.reduce((sum, b) => sum + (b.durationMinutes || 60) / 60, 0);

  const subjectMap = new Map<string, { sessions: number; hours: number; lastDate: string }>();
  for (const b of completedBookings) {
    const existing = subjectMap.get(b.subject) || { sessions: 0, hours: 0, lastDate: b.date };
    existing.sessions += 1;
    existing.hours += (b.durationMinutes || 60) / 60;
    if (b.date > existing.lastDate) existing.lastDate = b.date;
    subjectMap.set(b.subject, existing);
  }
  const progress = Array.from(subjectMap.entries()).map(([subject, data]) => ({
    subject,
    masteryPercentage: Math.min(100, Math.round((data.sessions / 5) * 100)),
    sessionsCompleted: data.sessions,
    totalHours: Math.round(data.hours * 10) / 10,
    lastSessionDate: data.lastDate,
    recentNotes: [`Completed ${data.sessions} lesson(s) in ${subject}`],
  }));

  res.json({
    success: true,
    data: {
      user,
      profile: studentProfile,
      stats: {
        totalBookings: bookings.length,
        upcomingSessions: upcomingBookings.length,
        completedSessions: completedBookings.length,
        totalLearningHours: Math.round(totalHours * 10) / 10,
        activeGoalsCount: goals.filter(g => g.status === 'IN_PROGRESS').length,
      },
      upcomingSessions: upcomingBookings.slice(0, 5),
      recentBookings: bookings.slice(0, 5),
      learningProgress: progress,
      learningGoals: goals,
    },
  });
});

// GET /api/student/profile
studentRouter.get('/profile', (req: Request, res: Response) => {
  const user = (req as any).user;
  const profile = store.studentProfiles.get(user.id);
  res.json({
    success: true,
    data: {
      user,
      profile,
    },
  });
});

// PUT /api/student/profile
studentRouter.put('/profile', (req: Request, res: Response) => {
  const user = (req as any).user;
  const { learningGoals, preferredSubjects, experienceLevel, preferredFormat, phone, preferredLanguage } = req.body;

  if (phone || preferredLanguage) {
    const updatedUser = {
      ...user,
      phone: phone !== undefined ? phone : user.phone,
      preferredLanguage: preferredLanguage !== undefined ? preferredLanguage : user.preferredLanguage,
      updatedAt: new Date().toISOString(),
    };
    store.users.set(user.id, updatedUser);
  }

  const currentProfile = store.studentProfiles.get(user.id) || {
    userId: user.id,
    learningGoals: '',
    preferredSubjects: [],
    experienceLevel: 'Beginner',
    preferredFormat: 'Online',
  };

  const updatedProfile = {
    ...currentProfile,
    learningGoals: learningGoals !== undefined ? learningGoals : currentProfile.learningGoals,
    preferredSubjects: preferredSubjects !== undefined ? preferredSubjects : currentProfile.preferredSubjects,
    experienceLevel: experienceLevel !== undefined ? experienceLevel : currentProfile.experienceLevel,
    preferredFormat: preferredFormat !== undefined ? preferredFormat : currentProfile.preferredFormat,
  };
  store.studentProfiles.set(user.id, updatedProfile);

  res.json({
    success: true,
    message: 'Student profile updated successfully.',
    data: {
      user: store.users.get(user.id),
      profile: updatedProfile,
    },
  });
});

// GET /api/student/bookings
studentRouter.get('/bookings', (req: Request, res: Response) => {
  const user = (req as any).user;
  const bookings = Array.from(store.bookings.values())
    .filter(b => b.studentId === user.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  res.json({
    success: true,
    data: { bookings },
  });
});

// GET /api/student/reviews
studentRouter.get('/reviews', (req: Request, res: Response) => {
  const user = (req as any).user;
  const reviews = Array.from(store.reviews.values())
    .filter(r => r.studentId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    data: { reviews },
  });
});
