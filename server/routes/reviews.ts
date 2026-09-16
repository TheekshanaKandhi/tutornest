import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';
import { getAuthUser } from './auth.js';
import { Review } from '../db/types.js';

export const reviewsRouter = Router();

// GET /api/reviews/tutor/:id
reviewsRouter.get('/tutor/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const reviews = Array.from(store.reviews.values())
    .filter(r => r.tutorId === id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    success: true,
    data: { reviews },
    timestamp: new Date().toISOString(),
  });
});

// POST /api/reviews - Add review (Student only, after COMPLETED booking)
reviewsRouter.post('/', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'STUDENT') {
    return res.status(403).json({ success: false, message: 'Only students can submit reviews' });
  }

  const { bookingId, rating, comment } = req.body;

  if (!bookingId || !rating || !comment) {
    return res.status(400).json({
      success: false,
      message: 'Booking ID, rating (1-5), and comment are required',
    });
  }

  const numRating = Number(rating);
  if (numRating < 1 || numRating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
  }

  // 1. Validate booking exists
  const booking = store.bookings.get(bookingId);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  // 2. Validate booking belongs to student
  if (booking.studentId !== user.id) {
    return res.status(403).json({ success: false, message: 'You can only review your own sessions' });
  }

  // 3. Validate booking is strictly COMPLETED
  if (booking.status !== 'COMPLETED') {
    return res.status(400).json({
      success: false,
      message: 'Reviews can only be submitted after a session has been successfully completed.',
      errorCode: 'SESSION_NOT_COMPLETED',
    });
  }

  // 4. Prevent duplicate review for same booking
  const existingReview = Array.from(store.reviews.values()).find(r => r.bookingId === bookingId);
  if (existingReview) {
    return res.status(409).json({
      success: false,
      message: 'A review has already been submitted for this session.',
      errorCode: 'DUPLICATE_REVIEW',
    });
  }

  const newReview: Review = {
    id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    bookingId,
    tutorId: booking.tutorId,
    studentId: user.id,
    studentName: user.name,
    studentAvatar: user.avatar,
    rating: numRating,
    comment: comment.trim(),
    subject: booking.subject,
    createdAt: new Date().toISOString(),
  };

  store.reviews.set(newReview.id, newReview);

  // Recalculate tutor average rating & review count
  const tutorReviews = Array.from(store.reviews.values()).filter(r => r.tutorId === booking.tutorId);
  const totalRating = tutorReviews.reduce((sum, r) => sum + r.rating, 0);
  const avgRating = Math.round((totalRating / tutorReviews.length) * 100) / 100;

  const tutor = store.tutors.get(booking.tutorId);
  if (tutor) {
    tutor.rating = avgRating;
    tutor.reviewCount = tutorReviews.length;
    store.tutors.set(tutor.id, tutor);
  }

  // Notify tutor
  store.createNotification(
    booking.tutorId,
    'SYSTEM_ALERT',
    `New ${numRating}★ Review Received!`,
    `${user.name} reviewed your ${booking.subject} session: "${comment.slice(0, 80)}..."`,
    `/tutor/reviews`
  );

  res.status(201).json({
    success: true,
    data: { review: newReview },
    message: 'Thank you! Your verified review has been published.',
    timestamp: new Date().toISOString(),
  });
});

// POST /api/reviews/:id/reply - Tutor replies to a student review
reviewsRouter.post('/:id/reply', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { id } = req.params;
  const { responseText } = req.body;

  const review = store.reviews.get(id);
  if (!review) {
    return res.status(404).json({ success: false, message: 'Review not found' });
  }

  if (user && user.role !== 'ADMIN' && review.tutorId !== user.id) {
    return res.status(403).json({ success: false, message: 'Only the reviewed tutor can reply' });
  }

  review.tutorResponse = responseText;
  review.tutorRespondedAt = new Date().toISOString();
  store.reviews.set(review.id, review);

  res.json({
    success: true,
    data: { review },
    message: 'Reply posted successfully',
    timestamp: new Date().toISOString(),
  });
});
