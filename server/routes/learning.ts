import { Router, Request, Response } from 'express';
import { store } from '../db/store.js';
import { getAuthUser } from './auth.js';
import { LearningGoal, LearningProgress } from '../db/types.js';

export const learningRouter = Router();

// GET /api/learning - Student learning overview
learningRouter.get('/', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'STUDENT') {
    return res.status(403).json({ success: false, message: 'Student access required' });
  }

  // 1. Fetch learning goals
  const goals = store.learningGoals.filter(g => g.studentId === user.id);

  // 2. Compute dynamic subject progress based on real bookings
  const studentBookings = Array.from(store.bookings.values()).filter(b => b.studentId === user.id);
  const completedBookings = studentBookings.filter(b => b.status === 'COMPLETED');
  const upcomingBookings = studentBookings.filter(b => b.status === 'CONFIRMED');

  const subjectMap = new Map<string, LearningProgress>();

  // Ensure preferred subjects exist
  const profile = store.studentProfiles.get(user.id);
  const prefSubjects = profile?.preferredSubjects || ['Data Structures & Algorithms', 'React', 'Database Systems'];
  prefSubjects.forEach(sub => {
    subjectMap.set(sub, {
      subject: sub,
      masteryPercentage: 45,
      sessionsCompleted: 0,
      totalHours: 0,
      lastSessionDate: 'N/A',
      recentNotes: [],
    });
  });

  // Aggregate from bookings
  completedBookings.forEach(b => {
    const existing = subjectMap.get(b.subject) || {
      subject: b.subject,
      masteryPercentage: 20,
      sessionsCompleted: 0,
      totalHours: 0,
      lastSessionDate: b.date,
      recentNotes: [],
    };

    existing.sessionsCompleted += 1;
    existing.totalHours += (b.durationMinutes || 60) / 60;
    existing.lastSessionDate = b.date;
    if (b.sessionNotes) {
      existing.recentNotes.push(b.sessionNotes);
    }
    existing.masteryPercentage = Math.min(100, Math.round(existing.sessionsCompleted * 22));
    subjectMap.set(b.subject, existing);
  });

  // Attach upcoming dates
  upcomingBookings.forEach(b => {
    if (subjectMap.has(b.subject)) {
      subjectMap.get(b.subject)!.nextSessionDate = `${b.date} at ${b.startTime}`;
    }
  });

  const totalLearningHours = completedBookings.reduce((sum, b) => sum + ((b.durationMinutes || 60) / 60), 0);
  const totalSessionsCompleted = completedBookings.length;

  res.json({
    success: true,
    data: {
      goals,
      subjectsProgress: Array.from(subjectMap.values()),
      summary: {
        totalHours: totalLearningHours,
        totalSessionsCompleted,
        activeGoalsCount: goals.filter(g => g.status === 'IN_PROGRESS').length,
      },
    },
    timestamp: new Date().toISOString(),
  });
});

// POST /api/learning/goals - Create new learning goal
learningRouter.post('/goals', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  if (!user || user.role !== 'STUDENT') {
    return res.status(403).json({ success: false, message: 'Student access required' });
  }

  const { title, subject, targetHours, targetDate } = req.body;
  if (!title || !subject || !targetHours) {
    return res.status(400).json({ success: false, message: 'Title, subject, and target hours are required' });
  }

  const newGoal: LearningGoal = {
    id: `goal_${Date.now()}`,
    studentId: user.id,
    title,
    subject,
    targetHours: Number(targetHours),
    completedHours: 0,
    targetDate: targetDate || '2026-06-30',
    status: 'IN_PROGRESS',
  };

  store.learningGoals.push(newGoal);

  res.status(201).json({
    success: true,
    data: { goal: newGoal },
    message: 'Learning goal set successfully',
    timestamp: new Date().toISOString(),
  });
});

// PUT /api/learning/goals/:id - Update goal progress or status
learningRouter.put('/goals/:id', (req: Request, res: Response) => {
  const user = getAuthUser(req);
  const { id } = req.params;
  const { completedHours, status } = req.body;

  const goal = store.learningGoals.find(g => g.id === id);
  if (!goal) {
    return res.status(404).json({ success: false, message: 'Goal not found' });
  }

  if (completedHours !== undefined) goal.completedHours = Number(completedHours);
  if (status !== undefined) goal.status = status;

  if (goal.completedHours >= goal.targetHours) {
    goal.status = 'COMPLETED';
  }

  res.json({
    success: true,
    data: { goal },
    message: 'Goal updated successfully',
    timestamp: new Date().toISOString(),
  });
});
