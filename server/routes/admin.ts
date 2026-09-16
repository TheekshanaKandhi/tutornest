import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';
import { requireRole, getAuthUser } from '../middleware/auth.js';
import {
  recordAuditLog,
  recordTutorVerificationAudit,
  recordUserStatusAudit,
  recordUserRoleAudit,
  recordSettingsUpdateAudit,
  recordBookingDisputeAudit,
  recordExportAudit,
  queryAuditLogs,
  formatAuditLogsAsCsv,
  AUDIT_ACTIONS,
} from '../utils/auditLogger.js';

export const adminRouter = Router();

// Strictly enforce ADMIN role: 401 if unauthenticated, 403 if unauthorized role
adminRouter.use(requireRole('ADMIN'));

// GET /api/admin/analytics - Platform KPIs, charts, and metrics
adminRouter.get('/analytics', (req: Request, res: Response) => {
  const users = Array.from(store.users.values());
  const tutors = Array.from(store.tutors.values());
  const bookings = Array.from(store.bookings.values());
  const payments = Array.from(store.payments.values());

  const totalUsers = users.length;
  const totalStudents = users.filter(u => u.role === 'STUDENT').length;
  const totalTutors = tutors.length;
  const verifiedTutors = tutors.filter(t => t.status === 'VERIFIED').length;
  const pendingTutors = tutors.filter(t => t.status === 'PENDING').length;

  const totalBookings = bookings.length;
  const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;
  const confirmedBookings = bookings.filter(b => b.status === 'CONFIRMED').length;
  const cancelledBookings = bookings.filter(b => b.status === 'CANCELLED').length;

  const totalGrossRevenue = payments
    .filter(p => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPlatformFees = payments
    .filter(p => p.status === 'SUCCESS')
    .reduce((sum, p) => sum + p.platformFee, 0);

  const totalRefundAmount = bookings
    .reduce((sum, b) => sum + (b.refundAmount || 0), 0);

  // Subject distribution
  const subjectCounts: Record<string, number> = {};
  bookings.forEach(b => {
    subjectCounts[b.subject] = (subjectCounts[b.subject] || 0) + 1;
  });

  const popularSubjects = Object.entries(subjectCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Recent 7 days activity chart data
  const chartDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dailyMetrics = chartDays.map((day, idx) => ({
    day,
    bookings: 4 + ((idx * 3) % 7),
    revenue: 4500 + ((idx * 1200) % 6000),
    newUsers: 6 + (idx % 4),
  }));

  res.json({
    success: true,
    data: {
      metrics: {
        totalUsers,
        totalStudents,
        totalTutors,
        verifiedTutors,
        pendingTutors,
        totalBookings,
        completedBookings,
        confirmedBookings,
        cancelledBookings,
        totalGrossRevenue,
        totalPlatformFees,
        totalRefundAmount,
        cancellationRate: totalBookings > 0 ? Math.round((cancelledBookings / totalBookings) * 100) : 0,
      },
      popularSubjects,
      dailyMetrics,
    },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/admin/users - Search, filter by role/status
adminRouter.get('/users', (req: Request, res: Response) => {
  const { search = '', role = 'ALL', status = 'ALL', page = '1', limit = '15' } = req.query;

  let list = Array.from(store.users.values());

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
  }

  if (role && role !== 'ALL') {
    list = list.filter(u => u.role === role);
  }

  if (status && status !== 'ALL') {
    list = list.filter(u => u.status === status);
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const total = list.length;
  const pageNum = parseInt(page as string, 10) || 1;
  const pageSize = parseInt(limit as string, 10) || 15;
  const startIndex = (pageNum - 1) * pageSize;

  res.json({
    success: true,
    data: {
      users: list.slice(startIndex, startIndex + pageSize),
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// PUT /api/admin/users/:id/status - Suspend or Reactivate user
adminRouter.put('/users/:id/status', (req: Request, res: Response) => {
  const admin = getAuthUser(req)!;
  const { id } = req.params;
  const { status, reason } = req.body; // 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED'

  const user = store.users.get(id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (user.role === 'ADMIN' && admin.id !== user.id) {
    return res.status(403).json({ success: false, message: 'Cannot modify administrator status' });
  }

  const oldStatus = user.status;
  user.status = status;
  user.updatedAt = new Date().toISOString();
  store.users.set(user.id, user);

  // Record sensitive account status change to audit trail
  const auditEntry = recordUserStatusAudit(req, {
    userId: user.id,
    userName: user.name,
    userEmail: user.email,
    oldStatus,
    newStatus: status,
    reason: reason || 'Administrative status update',
  });

  store.createNotification(
    user.id,
    'SYSTEM_ALERT',
    status === 'SUSPENDED' ? 'Account Suspended' : status === 'DEACTIVATED' ? 'Account Deactivated' : 'Account Reactivated',
    status === 'SUSPENDED'
      ? `Your account was suspended by platform administration. Reason: ${reason || 'Terms violation review'}.`
      : status === 'DEACTIVATED'
      ? `Your account has been deactivated by administration. Reason: ${reason || 'Security compliance'}.`
      : 'Your TutorNest account has been restored to good standing.'
  );

  res.json({
    success: true,
    data: { user, auditEntry },
    message: `User status changed to ${status}`,
    timestamp: new Date().toISOString(),
  });
});

// PUT /api/admin/users/:id/role - Change user role (Student <-> Tutor <-> Admin)
adminRouter.put('/users/:id/role', (req: Request, res: Response) => {
  const { id } = req.params;
  const { role, reason } = req.body;

  if (!['STUDENT', 'TUTOR', 'ADMIN'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role specified' });
  }

  const user = store.users.get(id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const oldRole = user.role;
  user.role = role;
  user.updatedAt = new Date().toISOString();
  store.users.set(user.id, user);

  // Record high-severity role change to audit log
  const auditEntry = recordUserRoleAudit(req, {
    userId: user.id,
    userName: user.name,
    oldRole,
    newRole: role,
    reason: reason || 'Privilege re-assignment by Administrator',
  });

  res.json({
    success: true,
    data: { user, auditEntry },
    message: `User role updated to ${role}`,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/admin/tutors/pending - Tutors awaiting verification
adminRouter.get('/tutors/pending', (req: Request, res: Response) => {
  const pending = Array.from(store.tutors.values()).filter(t => t.status === 'PENDING');
  res.json({
    success: true,
    data: { tutors: pending },
    timestamp: new Date().toISOString(),
  });
});

// PUT /api/admin/tutors/:id/verify - Approve or Reject tutor verification
adminRouter.put('/tutors/:id/verify', (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, reason } = req.body; // 'APPROVE' | 'REJECT'

  const tutor = store.tutors.get(id);
  if (!tutor) {
    return res.status(404).json({ success: false, message: 'Tutor not found' });
  }

  if (action === 'REJECT' && (!reason || !reason.trim())) {
    return res.status(400).json({
      success: false,
      message: 'A rejection reason is required when rejecting an application.',
      errorCode: 'REJECTION_REASON_REQUIRED',
    });
  }

  const oldStatus = tutor.status;
  tutor.status = action === 'APPROVE' ? 'VERIFIED' : 'REJECTED';
  if (action === 'REJECT') {
    tutor.rejectionReason = reason;
  }
  tutor.updatedAt = new Date().toISOString();
  store.tutors.set(tutor.id, tutor);

  // Record tutor verification decision in audit log
  const auditEntry = recordTutorVerificationAudit(req, {
    tutorId: tutor.id,
    tutorName: tutor.name,
    action,
    reason,
    oldStatus,
  });

  store.createNotification(
    tutor.id,
    'TUTOR_VERIFIED',
    action === 'APPROVE' ? 'Congratulations! Profile Verified' : 'Application Update',
    action === 'APPROVE'
      ? 'Your credentials have been verified by TutorNest administration. You now carry the Verified Tutor badge and can receive student bookings!'
      : `Your application could not be approved at this time. Reason: ${reason}`
  );

  res.json({
    success: true,
    data: { tutor, auditEntry },
    message: action === 'APPROVE' ? 'Tutor profile approved and verified' : 'Tutor application rejected',
    timestamp: new Date().toISOString(),
  });
});

// POST /api/admin/bookings/:id/dispute - Manual booking dispute resolution and refund
adminRouter.post('/bookings/:id/dispute', (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, refundAmount = 0, reason } = req.body;

  const booking = store.bookings.get(id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  if (!reason || !reason.trim()) {
    return res.status(400).json({ success: false, message: 'Dispute reason is required for administrative audit' });
  }

  const numericRefund = Math.min(Number(refundAmount) || 0, booking.totalAmount);
  booking.refundAmount = numericRefund;
  if (action === 'REFUND_AND_CANCEL') {
    booking.status = 'CANCELLED';
    booking.cancellationReason = `Admin dispute override: ${reason}`;
  }
  booking.updatedAt = new Date().toISOString();
  store.bookings.set(booking.id, booking);

  const auditEntry = recordBookingDisputeAudit(req, {
    bookingId: booking.id,
    bookingReference: booking.bookingReference,
    studentName: booking.studentName,
    tutorName: booking.tutorName,
    refundAmount: numericRefund,
    action: action || 'MANUAL_REFUND',
    reason,
  });

  res.json({
    success: true,
    data: { booking, auditEntry },
    message: `Dispute action recorded with ₹${numericRefund} refund`,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/admin/audit-logs - System audit logs with query filters & statistics
adminRouter.get('/audit-logs', (req: Request, res: Response) => {
  const { search, action, severity, entity, page, limit } = req.query;

  const results = queryAuditLogs({
    search: typeof search === 'string' ? search : undefined,
    action: typeof action === 'string' ? action : undefined,
    severity: typeof severity === 'string' ? severity : undefined,
    entity: typeof entity === 'string' ? entity : undefined,
    page: page ? parseInt(page as string, 10) : 1,
    limit: limit ? parseInt(limit as string, 10) : 25,
  });

  res.json({
    success: true,
    data: results,
    timestamp: new Date().toISOString(),
  });
});

// GET /api/admin/audit-logs/export - Export audit trail to CSV or JSON with export audit logging
adminRouter.get('/audit-logs/export', (req: Request, res: Response) => {
  const format = (req.query.format as string) === 'csv' ? 'csv' : 'json';
  const logs = [...store.auditLogs].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Record that an administrator exported the audit trail
  recordExportAudit(req, {
    format,
    recordCount: logs.length,
    filterSummary: 'Full platform export',
  });

  if (format === 'csv') {
    const csvData = formatAuditLogsAsCsv(logs);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="tutornest-audit-logs-${Date.now()}.csv"`);
    return res.send(csvData);
  }

  res.json({
    success: true,
    data: {
      exportedAt: new Date().toISOString(),
      count: logs.length,
      logs,
    },
  });
});

// GET /api/admin/audit-logs/:id - Specific audit log detail
adminRouter.get('/audit-logs/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const log = store.auditLogs.find(l => l.id === id);
  if (!log) {
    return res.status(404).json({ success: false, message: 'Audit entry not found' });
  }

  res.json({
    success: true,
    data: { log },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/admin/settings - Platform configuration
adminRouter.get('/settings', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: { settings: store.systemSettings },
    timestamp: new Date().toISOString(),
  });
});

// PUT /api/admin/settings - Update settings (fees, policies)
adminRouter.put('/settings', (req: Request, res: Response) => {
  const updates = req.body;
  const previousSettings = { ...store.systemSettings };

  store.systemSettings = {
    ...store.systemSettings,
    ...updates,
  };

  // Record platform settings modification in audit log
  const auditEntry = recordSettingsUpdateAudit(req, {
    previousSettings,
    newSettings: store.systemSettings,
    reason: req.body.reason || 'Platform policies and fee parameters updated',
  });

  res.json({
    success: true,
    data: { settings: store.systemSettings, auditEntry },
    message: 'System settings updated successfully',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/admin/contacts - View contact form messages
adminRouter.get('/contacts', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: { submissions: store.contactSubmissions },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/admin/dashboard - High-level admin dashboard summary
adminRouter.get('/dashboard', (req: Request, res: Response) => {
  const users = Array.from(store.users.values());
  const tutors = Array.from(store.tutors.values());
  const bookings = Array.from(store.bookings.values());
  const payments = Array.from(store.payments.values());

  const pendingTutors = tutors.filter(t => t.status === 'PENDING');
  const activeStudents = users.filter(u => u.role === 'STUDENT' && u.status === 'ACTIVE');
  const recentAudit = store.auditLogs.slice(0, 5);

  res.json({
    success: true,
    data: {
      stats: {
        totalUsers: users.length,
        totalStudents: activeStudents.length,
        totalTutors: tutors.length,
        verifiedTutors: tutors.filter(t => t.status === 'VERIFIED').length,
        pendingTutorsCount: pendingTutors.length,
        totalBookings: bookings.length,
        totalRevenue: payments.reduce((sum, p) => sum + p.amount, 0),
      },
      pendingVerifications: pendingTutors.slice(0, 5),
      recentAuditLogs: recentAudit,
      systemSettings: store.systemSettings,
    },
  });
});

// GET /api/admin/students - List all student accounts
adminRouter.get('/students', (req: Request, res: Response) => {
  const students = Array.from(store.users.values()).filter(u => u.role === 'STUDENT');
  const studentsWithDetails = students.map(s => {
    const profile = store.studentProfiles.get(s.id);
    const bookings = Array.from(store.bookings.values()).filter(b => b.studentId === s.id);
    return {
      ...s,
      profile,
      bookingsCount: bookings.length,
    };
  });

  res.json({
    success: true,
    data: { students: studentsWithDetails },
  });
});

// GET /api/admin/bookings - List all bookings across the platform
adminRouter.get('/bookings', (req: Request, res: Response) => {
  const bookings = Array.from(store.bookings.values())
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  res.json({
    success: true,
    data: { bookings },
  });
});

// GET /api/admin/payments - List all payment transactions
adminRouter.get('/payments', (req: Request, res: Response) => {
  const payments = Array.from(store.payments.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    data: { payments },
  });
});

// GET /api/admin/reviews - Moderate platform reviews
adminRouter.get('/reviews', (req: Request, res: Response) => {
  const reviews = Array.from(store.reviews.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    data: { reviews },
  });
});

// POST /api/admin/tutors - Add a tutor directly from the admin panel
adminRouter.post('/tutors', (req: Request, res: Response) => {
  const { name, email, headline, hourlyRate, subjects, bio, experienceYears, city, state } = req.body;
  if (!name || !email || !hourlyRate) {
    return res.status(400).json({ success: false, message: 'Name, email, and hourly rate are required.' });
  }

  const tutorId = `usr_tutor_${Date.now()}`;
  const newUser = {
    id: tutorId,
    name,
    email,
    role: 'TUTOR' as const,
    status: 'ACTIVE' as const,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    phone: req.body.phone || '+91 98000 00000',
    preferredLanguage: 'English',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  store.users.set(tutorId, newUser);

  const newTutor = {
    id: tutorId,
    name,
    email,
    avatar: newUser.avatar,
    headline: headline || 'Professional Educator & Subject Specialist',
    bio: bio || 'Experienced tutor dedicated to student success and academic excellence.',
    subjects: Array.isArray(subjects) ? subjects : ['General Education'],
    experienceYears: Number(experienceYears) || 3,
    hourlyRate: Number(hourlyRate) || 500,
    rating: 5.0,
    totalReviews: 0,
    totalStudents: 0,
    totalHoursTaught: 0,
    status: 'VERIFIED' as const,
    verificationStatus: 'APPROVED' as const,
    verifiedAt: new Date().toISOString(),
    location: {
      city: city || 'New Delhi',
      state: state || 'Delhi',
      country: 'India',
      modes: ['ONLINE' as const],
    },
    education: ['University Degree'],
    languages: ['English', 'Hindi'],
    joinedAt: new Date().toISOString(),
  };
  store.tutors.set(tutorId, newTutor as any);

  recordAuditLog(req, {
    action: AUDIT_ACTIONS.TUTOR_VERIFIED,
    entity: 'Tutor',
    entityId: tutorId,
    entityName: name,
    reason: `Direct administrative onboarding of tutor ${name} (${email})`,
    severity: 'MEDIUM',
  });

  res.status(201).json({
    success: true,
    message: 'Tutor added and verified successfully.',
    data: { tutor: newTutor },
  });
});
