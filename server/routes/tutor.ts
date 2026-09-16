import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';
import { requireRole } from '../middleware/auth.js';

export const tutorRouter = Router();

// Strictly enforce TUTOR role across all /api/tutor/** routes
tutorRouter.use(requireRole('TUTOR'));

// GET /api/tutor/dashboard
tutorRouter.get('/dashboard', (req: Request, res: Response) => {
  const user = (req as any).user;
  const tutor = store.tutors.get(user.id);
  const bookings = Array.from(store.bookings.values()).filter(b => b.tutorId === user.id);
  const slots = Array.from(store.availabilitySlots.values()).filter(s => s.tutorId === user.id);
  const reviews = Array.from(store.reviews.values()).filter(r => r.tutorId === user.id);

  const completed = bookings.filter(b => b.status === 'COMPLETED');
  const confirmed = bookings.filter(b => b.status === 'CONFIRMED');
  const totalEarnings = completed.reduce((sum, b) => sum + (b.subtotal || b.totalAmount - b.platformFee), 0);

  // Get distinct students who have booked sessions
  const studentIds = Array.from(new Set(bookings.map(b => b.studentId)));
  const students = studentIds
    .map(id => store.users.get(id))
    .filter(Boolean);

  res.json({
    success: true,
    data: {
      user,
      tutorProfile: tutor,
      stats: {
        totalEarnings,
        totalSessions: completed.length,
        upcomingSessions: confirmed.length,
        rating: tutor?.rating || 5.0,
        reviewsCount: reviews.length,
        totalStudentsCount: students.length,
      },
      upcomingBookings: confirmed.slice(0, 5),
      recentBookings: bookings.slice(0, 5),
      recentReviews: reviews.slice(0, 5),
      students: students.slice(0, 10),
      slotsCount: slots.length,
    },
  });
});

// GET /api/tutor/students
tutorRouter.get('/students', (req: Request, res: Response) => {
  const user = (req as any).user;
  const bookings = Array.from(store.bookings.values()).filter(b => b.tutorId === user.id);
  const studentMap = new Map<string, any>();

  for (const b of bookings) {
    if (!studentMap.has(b.studentId)) {
      const studentUser = store.users.get(b.studentId);
      const studentProfile = store.studentProfiles.get(b.studentId);
      studentMap.set(b.studentId, {
        id: b.studentId,
        name: studentUser?.name || 'Student',
        email: studentUser?.email || '',
        avatar: studentUser?.avatar || '',
        phone: studentUser?.phone || '',
        preferredFormat: studentProfile?.preferredFormat || 'Online',
        sessionsCount: 0,
        lastSessionDate: b.date,
      });
    }
    const record = studentMap.get(b.studentId);
    record.sessionsCount += 1;
    if (new Date(b.date) > new Date(record.lastSessionDate)) {
      record.lastSessionDate = b.date;
    }
  }

  res.json({
    success: true,
    data: { students: Array.from(studentMap.values()) },
  });
});

// GET /api/tutor/availability
tutorRouter.get('/availability', (req: Request, res: Response) => {
  const user = (req as any).user;
  const slots = Array.from(store.availabilitySlots.values()).filter(s => s.tutorId === user.id);
  res.json({
    success: true,
    data: { slots },
  });
});

// GET /api/tutor/earnings
tutorRouter.get('/earnings', (req: Request, res: Response) => {
  const user = (req as any).user;
  const bookings = Array.from(store.bookings.values()).filter(b => b.tutorId === user.id);
  const completed = bookings.filter(b => b.status === 'COMPLETED');
  const totalEarnings = completed.reduce((sum, b) => sum + (b.subtotal || b.totalAmount - b.platformFee), 0);
  const platformFeesDeducted = completed.reduce((sum, b) => sum + b.platformFee, 0);

  res.json({
    success: true,
    data: {
      totalEarnings,
      platformFeesDeducted,
      totalCompletedSessions: completed.length,
      earningsHistory: completed.map(b => ({
        bookingId: b.id,
        date: b.date,
        subject: b.subject,
        studentName: b.studentName,
        grossAmount: b.totalAmount,
        platformFee: b.platformFee,
        netPayout: b.subtotal || b.totalAmount - b.platformFee,
        payoutStatus: 'SETTLED',
      })),
    },
  });
});

// GET /api/tutor/bookings
tutorRouter.get('/bookings', (req: Request, res: Response) => {
  const user = (req as any).user;
  const bookings = Array.from(store.bookings.values())
    .filter(b => b.tutorId === user.id)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  res.json({
    success: true,
    data: { bookings },
  });
});

// GET /api/tutor/reviews
tutorRouter.get('/reviews', (req: Request, res: Response) => {
  const user = (req as any).user;
  const reviews = Array.from(store.reviews.values())
    .filter(r => r.tutorId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    data: { reviews },
  });
});

// GET /api/tutor/profile
tutorRouter.get('/profile', (req: Request, res: Response) => {
  const user = (req as any).user;
  const tutor = store.tutors.get(user.id);
  res.json({
    success: true,
    data: {
      user,
      tutor,
    },
  });
});
