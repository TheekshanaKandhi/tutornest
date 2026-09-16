import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';
import { getAuthUser } from './auth.js';
import { Message, Conversation } from '../db/types.js';

export const messagesRouter = Router();

// Helper: Check if student and tutor have an active or past booking relationship
function hasBookingRelationship(studentId: string, tutorId: string): boolean {
  return Array.from(store.bookings.values()).some(
    b => b.studentId === studentId && b.tutorId === tutorId
  );
}

// GET /api/messages/conversations - List conversations for authenticated user
messagesRouter.get('/conversations', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  let list = Array.from(store.conversations.values()).filter(c =>
    user.role === 'STUDENT' ? c.studentId === user.id : c.tutorId === user.id
  );

  list.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

  res.json({
    success: true,
    data: { conversations: list },
    timestamp: new Date().toISOString(),
  });
});

// GET /api/messages/:conversationId - Get messages in a conversation
messagesRouter.get('/:conversationId', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { conversationId } = req.params;

  const conv = store.conversations.get(conversationId);
  if (!conv) {
    return res.status(404).json({ success: false, message: 'Conversation not found' });
  }

  if (user && user.role !== 'ADMIN' && conv.studentId !== user.id && conv.tutorId !== user.id) {
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  const messages = store.messages
    .filter(m => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Mark unread as read
  messages.forEach(m => {
    if (m.senderId !== user?.id) {
      m.read = true;
    }
  });

  if (user?.role === 'STUDENT') conv.unreadCountStudent = 0;
  if (user?.role === 'TUTOR') conv.unreadCountTutor = 0;

  res.json({
    success: true,
    data: {
      conversation: conv,
      messages,
    },
    timestamp: new Date().toISOString(),
  });
});

// POST /api/messages/:conversationId - Send message (strictly verified booking relationship)
messagesRouter.post('/:conversationId', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  const { conversationId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, message: 'Message content cannot be empty' });
  }

  const conv = store.conversations.get(conversationId);
  if (!conv) {
    return res.status(404).json({ success: false, message: 'Conversation not found' });
  }

  // Security: only student or tutor of this conversation can send
  if (conv.studentId !== user.id && conv.tutorId !== user.id) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }

  // Strict Business Rule: Check active or past booking relationship
  if (!hasBookingRelationship(conv.studentId, conv.tutorId)) {
    return res.status(403).json({
      success: false,
      message: 'Messaging is only permitted between students and tutors with a confirmed booking history.',
      errorCode: 'BOOKING_RELATIONSHIP_REQUIRED',
    });
  }

  const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const message: Message = {
    id: msgId,
    conversationId,
    senderId: user.id,
    senderName: user.name,
    senderRole: user.role,
    content: content.trim(),
    timestamp: new Date().toISOString(),
    read: false,
  };

  store.messages.push(message);

  // Update conversation last message
  conv.lastMessage = message.content;
  conv.lastMessageTime = message.timestamp;
  if (user.role === 'STUDENT') {
    conv.unreadCountTutor += 1;
  } else {
    conv.unreadCountStudent += 1;
  }
  store.conversations.set(conv.id, conv);

  res.status(201).json({
    success: true,
    data: { message },
    timestamp: new Date().toISOString(),
  });
});
