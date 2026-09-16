import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';
import { getAuthUser } from './auth.js';
import { AvailabilitySlot } from '../db/types.js';

export const tutorsRouter = Router();

// GET /api/tutors - Search, multi-filtering, sorting, pagination
tutorsRouter.get('/', (req: Request, res: Response) => {
  const {
    search = '',
    subject = '',
    minPrice,
    maxPrice,
    minRating,
    minExperience,
    format, // 'Online' | 'In-person' | 'Both'
    language,
    sortBy = 'recommended', // 'recommended' | 'rating' | 'price_asc' | 'price_desc' | 'experience'
    page = '1',
    limit = '12',
  } = req.query;

  let list = Array.from(store.tutors.values()).filter(
    t => t.status === 'VERIFIED' && t.id !== 'usr_tutor_demo'
  );

  // Search keyword (name, headline, bio, skills, subjects)
  if (search && typeof search === 'string') {
    const q = search.toLowerCase().trim();
    list = list.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.headline.toLowerCase().includes(q) ||
      t.bio.toLowerCase().includes(q) ||
      t.subjects.some(s => s.toLowerCase().includes(q)) ||
      t.skills.some(sk => sk.toLowerCase().includes(q))
    );
  }

  // Subject filter
  if (subject && typeof subject === 'string' && subject !== 'all') {
    const sTerm = subject.toLowerCase().trim();
    list = list.filter(t => t.subjects.some(s => s.toLowerCase().includes(sTerm)));
  }

  // Price range
  if (minPrice) {
    const min = Number(minPrice);
    if (!isNaN(min)) list = list.filter(t => t.hourlyRate >= min);
  }
  if (maxPrice) {
    const max = Number(maxPrice);
    if (!isNaN(max)) list = list.filter(t => t.hourlyRate <= max);
  }

  // Minimum Rating
  if (minRating) {
    const ratingThreshold = Number(minRating);
    if (!isNaN(ratingThreshold)) list = list.filter(t => t.rating >= ratingThreshold);
  }

  // Minimum Experience
  if (minExperience) {
    const expThreshold = Number(minExperience);
    if (!isNaN(expThreshold)) list = list.filter(t => t.yearsExperience >= expThreshold);
  }

  // Teaching Format
  if (format && typeof format === 'string' && format !== 'all') {
    list = list.filter(t => t.teachingFormat === 'Both' || t.teachingFormat === format);
  }

  // Language
  if (language && typeof language === 'string' && language !== 'all') {
    list = list.filter(t => t.languages.some(l => l.toLowerCase() === (language as string).toLowerCase()));
  }

  // Sorting
  list.sort((a, b) => {
    if (sortBy === 'rating') {
      return b.rating - a.rating || b.reviewCount - a.reviewCount;
    }
    if (sortBy === 'price_asc') {
      return a.hourlyRate - b.hourlyRate;
    }
    if (sortBy === 'price_desc') {
      return b.hourlyRate - a.hourlyRate;
    }
    if (sortBy === 'experience') {
      return b.yearsExperience - a.yearsExperience;
    }
    // Default 'recommended': composite score of rating, sessions, reviews
    const scoreA = (a.rating * 20) + (a.reviewCount * 0.5) + (a.totalSessions * 0.1);
    const scoreB = (b.rating * 20) + (b.reviewCount * 0.5) + (b.totalSessions * 0.1);
    return scoreB - scoreA;
  });

  const total = list.length;
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const pageSize = Math.max(1, parseInt(limit as string, 10) || 12);
  const startIndex = (pageNum - 1) * pageSize;
  const paginated = list.slice(startIndex, startIndex + pageSize);

  res.json({
    success: true,
    data: {
      tutors: paginated,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    },
    message: 'Tutors fetched successfully',
    timestamp: new Date().toISOString(),
  });
});

// GET /api/tutors/:id - Tutor Profile with availability slots and verified reviews
tutorsRouter.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const tutor = store.tutors.get(id);

  if (!tutor) {
    return res.status(404).json({
      success: false,
      message: 'Tutor profile not found',
      errorCode: 'TUTOR_NOT_FOUND',
      timestamp: new Date().toISOString(),
    });
  }

  const effectiveId = tutor.id;

  // Fetch verified reviews for this tutor
  const reviews = Array.from(store.reviews.values())
    .filter(r => r.tutorId === effectiveId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Fetch upcoming available slots
  const todayStr = new Date().toISOString().split('T')[0];
  const slots = Array.from(store.availabilitySlots.values())
    .filter(s => s.tutorId === effectiveId && (!s.date || s.date >= todayStr))
    .sort((a, b) => {
      const dateA = a.date || '';
      const dateB = b.date || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return a.startTime.localeCompare(b.startTime);
    });

  res.json({
    success: true,
    data: {
      tutor,
      reviews,
      slots,
    },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/tutors/:id/availability - Availability slots
tutorsRouter.get('/:id/availability', (req: Request, res: Response) => {
  const { id } = req.params;
  const { date } = req.query;

  let slots = Array.from(store.availabilitySlots.values()).filter(s => s.tutorId === id);

  if (date && typeof date === 'string') {
    slots = slots.filter(s => s.date === date);
  }

  res.json({
    success: true,
    data: { slots },
    timestamp: new Date().toISOString(),
  });
});

// PUT /api/tutors/profile - Update tutor profile (Self or Admin)
tutorsRouter.put('/profile', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user || (user.role !== 'TUTOR' && user.role !== 'ADMIN')) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized to edit tutor profile',
      errorCode: 'FORBIDDEN',
    });
  }

  const tutor = store.tutors.get(user.id);
  if (!tutor) {
    return res.status(404).json({ success: false, message: 'Tutor not found' });
  }

  const {
    headline,
    bio,
    subjects,
    skills,
    yearsExperience,
    education,
    certifications,
    languages,
    hourlyRate,
    teachingFormat,
    location,
  } = req.body;

  if (headline) tutor.headline = headline;
  if (bio) tutor.bio = bio;
  if (Array.isArray(subjects)) tutor.subjects = subjects;
  if (Array.isArray(skills)) tutor.skills = skills;
  if (yearsExperience !== undefined) tutor.yearsExperience = Number(yearsExperience);
  if (education) tutor.education = education;
  if (Array.isArray(certifications)) tutor.certifications = certifications;
  if (Array.isArray(languages)) tutor.languages = languages;
  if (hourlyRate !== undefined) tutor.hourlyRate = Number(hourlyRate);
  if (teachingFormat) tutor.teachingFormat = teachingFormat;
  if (location) tutor.location = location;

  tutor.updatedAt = new Date().toISOString();
  store.tutors.set(tutor.id, tutor);

  store.logAudit(user.id, user.name, user.role, 'TUTOR_PROFILE_UPDATED', 'Tutor', tutor.id);

  res.json({
    success: true,
    data: { tutor },
    message: 'Tutor profile updated successfully',
    timestamp: new Date().toISOString(),
  });
});

// POST /api/tutors/availability - Manage availability slots (Tutor self)
tutorsRouter.post('/availability', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'TUTOR') {
    return res.status(403).json({ success: false, message: 'Only tutors can manage availability' });
  }

  const { date, startTime, endTime, mode } = req.body;
  if (!date || !startTime || !endTime) {
    return res.status(400).json({ success: false, message: 'Date, start time, and end time are required' });
  }

  const slotId = `slot_${user.id}_${date}_${startTime.replace(':', '')}`;
  const slotDate = new Date(date);

  const slot: AvailabilitySlot = {
    id: slotId,
    tutorId: user.id,
    dayOfWeek: slotDate.getDay(),
    date,
    startTime,
    endTime,
    isBooked: false,
    mode: mode || 'Online',
  };

  store.availabilitySlots.set(slotId, slot);

  res.json({
    success: true,
    data: { slot },
    message: 'Availability slot added successfully',
    timestamp: new Date().toISOString(),
  });
});

// DELETE /api/tutors/availability/:slotId
tutorsRouter.delete('/availability/:slotId', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { slotId } = req.params;

  const slot = store.availabilitySlots.get(slotId);
  if (!slot) {
    return res.status(404).json({ success: false, message: 'Slot not found' });
  }

  if (slot.tutorId !== user?.id && user?.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Cannot delete another tutor slot' });
  }

  if (slot.isBooked) {
    return res.status(400).json({ success: false, message: 'Cannot delete an already booked slot' });
  }

  store.availabilitySlots.delete(slotId);

  res.json({
    success: true,
    message: 'Slot removed successfully',
    timestamp: new Date().toISOString(),
  });
});
