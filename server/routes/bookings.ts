import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';
import { getAuthUser } from './auth.js';
import { Booking, BookingHistory, PaymentTransaction } from '../db/types.js';

export const bookingsRouter = Router();

// GET /api/bookings - Filtered by role (Student, Tutor, Admin)
bookingsRouter.get('/', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const { status, studentId, tutorId } = req.query;

  let list = Array.from(store.bookings.values());

  if (user.role === 'STUDENT') {
    list = list.filter(b => b.studentId === user.id);
  } else if (user.role === 'TUTOR') {
    list = list.filter(b => b.tutorId === user.id);
  } else if (user.role === 'ADMIN') {
    if (studentId) list = list.filter(b => b.studentId === studentId);
    if (tutorId) list = list.filter(b => b.tutorId === tutorId);
  }

  if (status && typeof status === 'string' && status !== 'ALL') {
    list = list.filter(b => b.status === status);
  }

  // Sort by date and startTime descending
  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    data: { bookings: list },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/bookings/:id - Booking details & timeline
bookingsRouter.get('/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { id } = req.params;

  const booking = store.bookings.get(id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  // Security check: only involved student, tutor, or admin can view
  if (user && user.role !== 'ADMIN' && booking.studentId !== user.id && booking.tutorId !== user.id) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  const history = store.bookingHistory.filter(h => h.bookingId === id);
  const payment = Array.from(store.payments.values()).find(p => p.bookingId === id);

  res.json({
    success: true,
    data: {
      booking,
      history,
      payment,
    },
    timestamp: new Date().toISOString(),
  });
});

// POST /api/bookings/initiate - STEP 1: Lock slot & Create order (ACID Transaction)
bookingsRouter.post('/initiate', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'You must be logged in as a student to book a session.',
      errorCode: 'UNAUTHENTICATED',
    });
  }

  if (user.status === 'SUSPENDED') {
    return res.status(403).json({
      success: false,
      message: 'Suspended users cannot book sessions.',
      errorCode: 'ACCOUNT_SUSPENDED',
    });
  }

  const {
    tutorId,
    subject,
    date, // YYYY-MM-DD
    startTime, // HH:mm
    durationMinutes = 60, // 30, 60, 90, 120
    teachingFormat = 'Online',
    sessionNotes = '',
  } = req.body;

  // 1. Validate tutor exists
  const tutor = store.tutors.get(tutorId);
  if (!tutor) {
    return res.status(404).json({
      success: false,
      message: 'Tutor not found',
      errorCode: 'TUTOR_NOT_FOUND',
    });
  }

  // 2. Validate tutor is verified
  if (tutor.status !== 'VERIFIED') {
    return res.status(400).json({
      success: false,
      message: 'Only verified tutors can accept bookings',
      errorCode: 'TUTOR_NOT_VERIFIED',
    });
  }

  // 3. Students cannot book themselves
  if (user.id === tutorId) {
    return res.status(400).json({
      success: false,
      message: 'Tutors cannot book sessions with themselves',
      errorCode: 'SELF_BOOKING_FORBIDDEN',
    });
  }

  // 4. Validate slot is not in the past
  const now = new Date();
  const sessionDateTime = new Date(`${date}T${startTime}:00`);
  if (sessionDateTime <= now) {
    return res.status(400).json({
      success: false,
      message: 'Cannot book past time slots',
      errorCode: 'PAST_SLOT_NOT_ALLOWED',
    });
  }

  // 5. DOUBLE-BOOKING PROTECTION: Atomic concurrency lock & check
  const lockAcquired = store.acquireSlotLock(tutorId, date, startTime);
  if (!lockAcquired) {
    return res.status(409).json({
      success: false,
      message: 'This time slot is currently being reserved by another learner. Please select another slot.',
      errorCode: 'SLOT_LOCK_CONFLICT',
    });
  }

  try {
    // Check if already booked in DB
    if (store.isSlotBooked(tutorId, date, startTime)) {
      store.releaseSlotLock(tutorId, date, startTime);
      return res.status(409).json({
        success: false,
        message: 'The selected time slot has already been booked. Please choose an alternative slot.',
        errorCode: 'BOOKING_CONFLICT_DOUBLE_BOOKING',
      });
    }

    // 6. Calculate pricing strictly on backend
    const durationMins = Number(durationMinutes) || 60;
    const durationFraction = durationMins / 60;
    const subtotal = Math.round(tutor.hourlyRate * durationFraction);
    const platformFee = store.systemSettings.platformFeeFixed; // default 40 INR
    const totalAmount = subtotal + platformFee;

    // Calculate end time
    const [startH, startM] = startTime.split(':').map(Number);
    const totalEndM = startH * 60 + startM + durationMins;
    const endH = Math.floor(totalEndM / 60);
    const endM = totalEndM % 60;
    const endTime = `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;

    // 7. Create unique Booking Reference & ID
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const bookingReference = `TN-${now.getFullYear()}-${randomSuffix}`;
    const bookingId = `bk_${Date.now()}_${randomSuffix}`;

    // 8. Generate Razorpay / Payment Order record
    const orderId = `order_${bookingReference.replace('-', '_')}`;

    const newBooking: Booking = {
      id: bookingId,
      bookingReference,
      studentId: user.id,
      studentName: user.name,
      studentEmail: user.email,
      tutorId: tutor.id,
      tutorName: tutor.name,
      tutorAvatar: tutor.avatar,
      tutorHeadline: tutor.headline,
      subject,
      date,
      startTime,
      endTime,
      durationMinutes: durationMins,
      teachingFormat,
      sessionNotes,
      hourlyRate: tutor.hourlyRate,
      subtotal,
      platformFee,
      totalAmount,
      currency: store.systemSettings.currency,
      status: 'PENDING_PAYMENT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.bookings.set(newBooking.id, newBooking);

    // Record initial history
    store.bookingHistory.push({
      id: `bh_${Date.now()}`,
      bookingId,
      action: 'BOOKING_INITIATED',
      toStatus: 'PENDING_PAYMENT',
      performedBy: user.id,
      notes: `Order ${orderId} created for ${totalAmount} INR`,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json({
      success: true,
      data: {
        booking: newBooking,
        paymentOrder: {
          orderId,
          amount: totalAmount,
          currency: 'INR',
          keyId: 'rzp_live_tutornest_demo',
          studentName: user.name,
          studentEmail: user.email,
          tutorName: tutor.name,
          description: `${durationMins} min ${subject} session with ${tutor.name}`,
        },
      },
      message: 'Booking initiated. Complete payment to confirm session.',
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    store.releaseSlotLock(tutorId, date, startTime);
    return res.status(500).json({
      success: false,
      message: 'Internal error initiating booking transaction',
      errorCode: 'TRANSACTION_FAILURE',
    });
  }
});

// POST /api/bookings/verify-and-confirm - STEP 2: Server-side Payment Verification (Idempotent)
bookingsRouter.post('/verify-and-confirm', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const {
    bookingId,
    orderId,
    paymentId,
    paymentMethod = 'Razorpay UPI',
    signature,
  } = req.body;

  if (!bookingId || !orderId) {
    return res.status(400).json({
      success: false,
      message: 'Booking ID and Order ID are required',
      errorCode: 'MISSING_PAYMENT_PAYLOAD',
    });
  }

  const booking = store.bookings.get(bookingId);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  // Idempotency check: If already confirmed, return existing confirmation safely
  if (booking.status === 'CONFIRMED') {
    return res.json({
      success: true,
      data: {
        booking,
        message: 'Payment was already verified and booking is active',
        alreadyProcessed: true,
      },
    });
  }

  // Server-side payment verification simulation
  const generatedPaymentId = paymentId || `pay_TN_${Date.now().toString().slice(-6)}`;
  const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

  // Update Booking Status to CONFIRMED
  booking.status = 'CONFIRMED';
  booking.paymentId = generatedPaymentId;
  booking.meetingLink = `https://meet.tutornest.in/session-${booking.bookingReference.toLowerCase()}`;
  booking.updatedAt = new Date().toISOString();
  store.bookings.set(booking.id, booking);

  // Mark availability slot as booked in store
  const slotKey = `slot_${booking.tutorId}_${booking.date}_${booking.startTime.replace(':', '')}`;
  if (store.availabilitySlots.has(slotKey)) {
    store.availabilitySlots.get(slotKey)!.isBooked = true;
  }

  // Release lock safely
  store.releaseSlotLock(booking.tutorId, booking.date, booking.startTime);

  // Create Payment Transaction Record
  const txnId = `txn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const paymentTxn: PaymentTransaction = {
    id: txnId,
    orderId,
    paymentId: generatedPaymentId,
    bookingId: booking.id,
    studentId: booking.studentId,
    studentName: booking.studentName,
    tutorId: booking.tutorId,
    amount: booking.totalAmount,
    currency: booking.currency,
    status: 'SUCCESS',
    paymentMethod,
    gatewayFee: Math.round(booking.totalAmount * 0.02 * 100) / 100,
    platformFee: booking.platformFee,
    tutorPayout: booking.subtotal,
    invoiceNumber,
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };
  store.payments.set(txnId, paymentTxn);

  // Update tutor total sessions
  const tutor = store.tutors.get(booking.tutorId);
  if (tutor) {
    tutor.totalSessions += 1;
    store.tutors.set(tutor.id, tutor);
  }

  // Record audit & history
  store.bookingHistory.push({
    id: `bh_${Date.now()}`,
    bookingId: booking.id,
    action: 'PAYMENT_VERIFIED_AND_CONFIRMED',
    fromStatus: 'PENDING_PAYMENT',
    toStatus: 'CONFIRMED',
    performedBy: user.id,
    notes: `Payment verified via ${paymentMethod}. Invoice ${invoiceNumber} issued.`,
    timestamp: new Date().toISOString(),
  });

  // Create notifications
  store.createNotification(
    booking.studentId,
    'BOOKING_CONFIRMED',
    'Your Tutoring Session is Confirmed!',
    `Session with ${booking.tutorName} on ${booking.date} at ${booking.startTime} is confirmed. Meeting link generated.`,
    `/bookings`
  );

  store.createNotification(
    booking.tutorId,
    'BOOKING_CONFIRMED',
    'New Confirmed Booking Received',
    `${booking.studentName} booked a ${booking.durationMinutes}-minute session for ${booking.subject} on ${booking.date} at ${booking.startTime}.`,
    `/tutor/bookings`
  );

  // Auto-establish conversation thread between student and tutor
  const convId = `conv_${booking.studentId}_${booking.tutorId}`;
  if (!store.conversations.has(convId)) {
    store.conversations.set(convId, {
      id: convId,
      studentId: booking.studentId,
      studentName: booking.studentName,
      tutorId: booking.tutorId,
      tutorName: booking.tutorName,
      subject: booking.subject,
      lastMessage: `Session confirmed for ${booking.date} at ${booking.startTime}. Let's get ready!`,
      lastMessageTime: new Date().toISOString(),
      unreadCountStudent: 0,
      unreadCountTutor: 1,
      activeBookingId: booking.id,
    });
  }

  res.json({
    success: true,
    data: {
      booking,
      payment: paymentTxn,
    },
    message: 'Payment verified and session confirmed successfully!',
    timestamp: new Date().toISOString(),
  });
});

// POST /api/bookings/:id/cancel - Cancellation with dynamic policy & refunds
bookingsRouter.post('/:id/cancel', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const { id } = req.params;
  const { reason = 'Cancelled by user' } = req.body;

  const booking = store.bookings.get(id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  if (user.role !== 'ADMIN' && booking.studentId !== user.id && booking.tutorId !== user.id) {
    return res.status(403).json({ success: false, message: 'Cannot cancel this booking' });
  }

  if (booking.status === 'CANCELLED') {
    return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
  }

  if (booking.status === 'COMPLETED') {
    return res.status(400).json({ success: false, message: 'Cannot cancel a completed session' });
  }

  // Calculate refund policy based on hours until session
  const now = new Date();
  const sessionTime = new Date(`${booking.date}T${booking.startTime}:00`);
  const hoursUntilSession = (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  let refundAmount = 0;
  const settings = store.systemSettings;

  if (user.role === 'ADMIN' || user.id === booking.tutorId) {
    // If cancelled by tutor or admin, student always gets 100% full refund
    refundAmount = booking.totalAmount;
  } else {
    // If student cancels:
    if (hoursUntilSession >= settings.cancellationFullRefundHours) {
      // Full refund (> 24h)
      refundAmount = booking.totalAmount;
    } else if (hoursUntilSession >= settings.cancellationPartialRefundHours) {
      // Partial refund (12h - 24h)
      refundAmount = Math.round((booking.subtotal * (settings.partialRefundPercentage / 100)));
    } else {
      // < 12 hours: 0% refund
      refundAmount = 0;
    }
  }

  const previousStatus = booking.status;
  booking.status = 'CANCELLED';
  booking.cancellationReason = reason;
  booking.refundAmount = refundAmount;
  booking.updatedAt = new Date().toISOString();
  store.bookings.set(booking.id, booking);

  // Free availability slot
  const slotKey = `slot_${booking.tutorId}_${booking.date}_${booking.startTime.replace(':', '')}`;
  if (store.availabilitySlots.has(slotKey)) {
    store.availabilitySlots.get(slotKey)!.isBooked = false;
  }

  // Update payment transaction if exists
  const paymentTxn = Array.from(store.payments.values()).find(p => p.bookingId === booking.id);
  if (paymentTxn) {
    paymentTxn.status = refundAmount === booking.totalAmount ? 'REFUNDED' : refundAmount > 0 ? 'PARTIALLY_REFUNDED' : 'SUCCESS';
    store.payments.set(paymentTxn.id, paymentTxn);
  }

  // Record audit history
  store.bookingHistory.push({
    id: `bh_${Date.now()}`,
    bookingId: booking.id,
    action: 'BOOKING_CANCELLED',
    fromStatus: previousStatus,
    toStatus: 'CANCELLED',
    performedBy: user.id,
    notes: `Reason: ${reason}. Refund calculated: ₹${refundAmount}`,
    timestamp: new Date().toISOString(),
  });

  // Notify student
  store.createNotification(
    booking.studentId,
    'BOOKING_CANCELLED',
    'Booking Cancelled',
    `Your session on ${booking.date} was cancelled. ${refundAmount > 0 ? `Refund of ₹${refundAmount} has been initiated.` : 'No refund applied as per cancellation policy.'}`
  );

  // Notify tutor
  store.createNotification(
    booking.tutorId,
    'BOOKING_CANCELLED',
    'Session Cancelled',
    `Session with ${booking.studentName} on ${booking.date} at ${booking.startTime} has been cancelled.`
  );

  res.json({
    success: true,
    data: {
      booking,
      refundAmount,
      policyApplied: hoursUntilSession >= 24 ? '100% Full Refund (>24h)' : hoursUntilSession >= 12 ? '50% Partial Refund (12-24h)' : '0% Refund (<12h)',
    },
    message: `Booking cancelled successfully. Refund: ₹${refundAmount}`,
    timestamp: new Date().toISOString(),
  });
});

// POST /api/bookings/:id/reschedule - Rescheduling with slot check
bookingsRouter.post('/:id/reschedule', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const { id } = req.params;
  const { newDate, newStartTime } = req.body;

  if (!newDate || !newStartTime) {
    return res.status(400).json({ success: false, message: 'New date and time are required' });
  }

  const booking = store.bookings.get(id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  // Validate new slot is not already booked
  if (store.isSlotBooked(booking.tutorId, newDate, newStartTime)) {
    return res.status(409).json({
      success: false,
      message: 'Requested new time slot is not available.',
      errorCode: 'SLOT_UNAVAILABLE',
    });
  }

  // Free old slot
  const oldSlotKey = `slot_${booking.tutorId}_${booking.date}_${booking.startTime.replace(':', '')}`;
  if (store.availabilitySlots.has(oldSlotKey)) {
    store.availabilitySlots.get(oldSlotKey)!.isBooked = false;
  }

  // Update booking
  const oldDate = booking.date;
  const oldTime = booking.startTime;
  booking.date = newDate;
  booking.startTime = newStartTime;

  // Calculate new end time
  const [h, m] = newStartTime.split(':').map(Number);
  const totalM = h * 60 + m + booking.durationMinutes;
  booking.endTime = `${Math.floor(totalM / 60).toString().padStart(2, '0')}:${(totalM % 60).toString().padStart(2, '0')}`;
  booking.updatedAt = new Date().toISOString();

  // Book new slot
  const newSlotKey = `slot_${booking.tutorId}_${newDate}_${newStartTime.replace(':', '')}`;
  if (store.availabilitySlots.has(newSlotKey)) {
    store.availabilitySlots.get(newSlotKey)!.isBooked = true;
  }

  store.bookings.set(booking.id, booking);

  store.bookingHistory.push({
    id: `bh_${Date.now()}`,
    bookingId: booking.id,
    action: 'BOOKING_RESCHEDULED',
    toStatus: booking.status,
    performedBy: user.id,
    notes: `Rescheduled from ${oldDate} ${oldTime} to ${newDate} ${newStartTime}`,
    timestamp: new Date().toISOString(),
  });

  store.createNotification(
    booking.studentId,
    'RESCHEDULE_REQUEST',
    'Session Rescheduled',
    `Your session with ${booking.tutorName} is now confirmed for ${newDate} at ${newStartTime}.`
  );

  store.createNotification(
    booking.tutorId,
    'RESCHEDULE_REQUEST',
    'Session Rescheduled',
    `Session with ${booking.studentName} has been rescheduled to ${newDate} at ${newStartTime}.`
  );

  res.json({
    success: true,
    data: { booking },
    message: 'Booking rescheduled successfully',
    timestamp: new Date().toISOString(),
  });
});

// POST /api/bookings/:id/complete - Mark session complete (Tutor or Admin)
bookingsRouter.post('/:id/complete', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { id } = req.params;

  const booking = store.bookings.get(id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  if (user && user.role !== 'ADMIN' && booking.tutorId !== user.id) {
    return res.status(403).json({ success: false, message: 'Only tutor or admin can mark session completed' });
  }

  booking.status = 'COMPLETED';
  booking.updatedAt = new Date().toISOString();
  store.bookings.set(booking.id, booking);

  store.bookingHistory.push({
    id: `bh_${Date.now()}`,
    bookingId: booking.id,
    action: 'SESSION_COMPLETED',
    toStatus: 'COMPLETED',
    performedBy: user?.id || 'SYSTEM',
    notes: 'Session marked as successfully conducted.',
    timestamp: new Date().toISOString(),
  });

  // Notify student to review tutor
  store.createNotification(
    booking.studentId,
    'REVIEW_REMINDER',
    `How was your session with ${booking.tutorName}?`,
    `Your ${booking.subject} session is completed. Rate your experience and leave a review.`,
    `/bookings`
  );

  res.json({
    success: true,
    data: { booking },
    message: 'Session completed successfully. Student prompted for review.',
    timestamp: new Date().toISOString(),
  });
});
