import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';
import { getAuthUser } from './auth.js';

export const paymentsRouter = Router();

// GET /api/payments/history - Transactions list
paymentsRouter.get('/history', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  let list = Array.from(store.payments.values());

  if (user.role === 'STUDENT') {
    list = list.filter(p => p.studentId === user.id);
  } else if (user.role === 'TUTOR') {
    list = list.filter(p => p.tutorId === user.id);
  }

  list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    data: { payments: list },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/payments/invoice/:id - Generate structured invoice payload
paymentsRouter.get('/invoice/:id?', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({ success: false, message: 'Invoice ID is required' });
  }

  let payment =
    store.payments.get(id) ||
    Array.from(store.payments.values()).find(
      p => p.id === id || p.paymentId === id || p.bookingId === id || p.orderId === id || p.invoiceNumber === id
    );

  // If not found in payments table, check if there is an associated booking
  if (!payment) {
    const booking =
      store.bookings.get(id) ||
      Array.from(store.bookings.values()).find(b => b.paymentId === id || b.id === id);
    if (booking && booking.paymentId) {
      payment = {
        id: `txn_${booking.id}`,
        orderId: `order_${booking.bookingReference}`,
        paymentId: booking.paymentId,
        bookingId: booking.id,
        studentId: booking.studentId,
        studentName: booking.studentName,
        tutorId: booking.tutorId,
        amount: booking.totalAmount,
        currency: booking.currency || 'INR',
        status: 'SUCCESS',
        paymentMethod: 'Razorpay UPI',
        gatewayFee: Math.round(booking.totalAmount * 0.02),
        platformFee: booking.platformFee || 40,
        tutorPayout: booking.subtotal,
        invoiceNumber: `INV-${booking.bookingReference.replace('TN-', '')}`,
        createdAt: booking.createdAt,
        completedAt: booking.createdAt,
      };
      store.payments.set(payment.id, payment);
    }
  }

  if (!payment) {
    return res.status(404).json({ success: false, message: 'Payment transaction or invoice not found' });
  }

  if (user && user.role !== 'ADMIN' && payment.studentId !== user.id && payment.tutorId !== user.id) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const booking = store.bookings.get(payment.bookingId);
  const tutor = store.tutors.get(payment.tutorId);

  res.json({
    success: true,
    data: {
      invoiceNumber: payment.invoiceNumber,
      issuedDate: payment.createdAt,
      paymentId: payment.paymentId,
      orderId: payment.orderId,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      currency: payment.currency,
      student: {
        name: payment.studentName,
      },
      tutor: {
        name: tutor?.name || 'Tutor',
        headline: tutor?.headline || '',
      },
      session: {
        reference: booking?.bookingReference || '',
        subject: booking?.subject || 'Tutoring Session',
        date: booking?.date || '',
        time: `${booking?.startTime} - ${booking?.endTime}`,
        duration: `${booking?.durationMinutes} mins`,
      },
      lineItems: [
        { description: `Tutoring Session (${booking?.durationMinutes || 60}m) by ${tutor?.name}`, amount: payment.tutorPayout },
        { description: 'Platform Trust & Safe Booking Fee', amount: payment.platformFee },
      ],
      subtotal: payment.amount - payment.platformFee,
      platformFee: payment.platformFee,
      totalAmount: payment.amount,
    },
  });
});
