import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';
import { ContactSubmission } from '../db/types.js';

export const contactRouter = Router();

// POST /api/contact - Submit inquiry/contact
contactRouter.post('/', (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      success: false,
      message: 'All fields (name, email, subject, message) are required',
      errorCode: 'MISSING_FIELDS',
    });
  }

  const submission: ContactSubmission = {
    id: `cont_${Date.now()}`,
    name,
    email,
    subject,
    message,
    createdAt: new Date().toISOString(),
    status: 'UNREAD',
  };

  store.contactSubmissions.unshift(submission);

  res.status(201).json({
    success: true,
    message: 'Thank you for reaching out! Our academic support team will respond within 24 hours.',
    timestamp: new Date().toISOString(),
  });
});
