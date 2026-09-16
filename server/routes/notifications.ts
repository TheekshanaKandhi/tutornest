import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';
import { getAuthUser } from './auth.js';

export const notificationsRouter = Router();

// GET /api/notifications - List notifications for current user
notificationsRouter.get('/', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const list = store.notifications
    .filter(n => n.userId === user.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = list.filter(n => !n.read).length;

  res.json({
    success: true,
    data: {
      notifications: list,
      unreadCount,
    },
    timestamp: new Date().toISOString(),
  });
});

// PUT /api/notifications/:id/read - Mark single notification as read
notificationsRouter.put('/:id/read', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { id } = req.params;

  const notif = store.notifications.find(n => n.id === id);
  if (notif && (!user || notif.userId === user.id)) {
    notif.read = true;
  }

  res.json({
    success: true,
    message: 'Notification marked as read',
    timestamp: new Date().toISOString(),
  });
});

// PUT /api/notifications/read-all - Mark all as read
notificationsRouter.put('/read-all', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  store.notifications.forEach(n => {
    if (n.userId === user.id) {
      n.read = true;
    }
  });

  res.json({
    success: true,
    message: 'All notifications marked as read',
    timestamp: new Date().toISOString(),
  });
});
