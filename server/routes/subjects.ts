import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';
import { getAuthUser } from './auth.js';
import { Subject } from '../db/types.js';

export const subjectsRouter = Router();

// GET /api/subjects - List all active subjects with dynamic tutor counts
subjectsRouter.get('/', (req: Request, res: Response) => {
  const subjects = Array.from(store.subjects.values()).filter(s => s.active);

  // Recalculate live tutor counts
  const tutors = Array.from(store.tutors.values()).filter(t => t.status === 'VERIFIED');
  subjects.forEach(sub => {
    sub.tutorCount = tutors.filter(t => t.subjects.includes(sub.name)).length;
  });

  res.json({
    success: true,
    data: { subjects },
    timestamp: new Date().toISOString(),
  });
});

// POST /api/subjects - Admin creates subject
subjectsRouter.post('/', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }

  const { name, category, description, icon } = req.body;
  if (!name || !category) {
    return res.status(400).json({ success: false, message: 'Name and category are required' });
  }

  const id = `sub_${Date.now()}`;
  const subject: Subject = {
    id,
    name,
    category,
    description: description || '',
    icon: icon || 'BookOpen',
    active: true,
    tutorCount: 0,
  };

  store.subjects.set(id, subject);
  store.logAudit(user.id, user.name, user.role, 'SUBJECT_CREATED', 'Subject', id, { name, category });

  res.status(201).json({
    success: true,
    data: { subject },
    message: 'Subject added successfully',
    timestamp: new Date().toISOString(),
  });
});

// PUT /api/subjects/:id - Admin updates subject
subjectsRouter.put('/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }

  const { id } = req.params;
  const subject = store.subjects.get(id);
  if (!subject) {
    return res.status(404).json({ success: false, message: 'Subject not found' });
  }

  const { name, category, description, icon, active } = req.body;
  if (name !== undefined) subject.name = name;
  if (category !== undefined) subject.category = category;
  if (description !== undefined) subject.description = description;
  if (icon !== undefined) subject.icon = icon;
  if (active !== undefined) subject.active = active;

  store.subjects.set(id, subject);
  store.logAudit(user.id, user.name, user.role, 'SUBJECT_UPDATED', 'Subject', id);

  res.json({
    success: true,
    data: { subject },
    message: 'Subject updated successfully',
    timestamp: new Date().toISOString(),
  });
});
