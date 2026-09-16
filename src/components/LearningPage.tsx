import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  BookOpen,
  Plus,
  CheckCircle2,
  Calendar,
  Clock,
  Award,
  ArrowRight,
  X,
} from 'lucide-react';
import { LearningGoal, LearningProgress } from '../types';
import { api } from '../services/api';
import { BackButton } from './BackButton';

interface LearningPageProps {
  onNavigate: (view: string, params?: any) => void;
  onBack?: () => void;
}

export const LearningPage: React.FC<LearningPageProps> = ({ onNavigate, onBack }) => {
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [subjectsProgress, setSubjectsProgress] = useState<LearningProgress[]>([]);
  const [summary, setSummary] = useState<any>({ totalHours: 0, totalSessionsCompleted: 0 });
  const [loading, setLoading] = useState(true);

  // New goal modal
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubject, setNewSubject] = useState('Data Structures & Algorithms');
  const [newTargetHours, setNewTargetHours] = useState(15);
  const [newTargetDate, setNewTargetDate] = useState('2026-06-30');
  const [submittingGoal, setSubmittingGoal] = useState(false);

  const loadLearning = async () => {
    setLoading(true);
    try {
      const data = await api.getLearningOverview();
      setGoals(data.goals);
      setSubjectsProgress(data.subjectsProgress);
      setSummary(data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLearning();
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingGoal(true);
    try {
      await api.createLearningGoal({
        title: newTitle,
        subject: newSubject,
        targetHours: Number(newTargetHours),
        targetDate: newTargetDate,
      });
      setShowNewGoalModal(false);
      setNewTitle('');
      loadLearning();
    } catch (err: any) {
      alert(err.message || 'Failed to create goal');
    } finally {
      setSubmittingGoal(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation Back Option */}
        <div className="flex items-center justify-between">
          <BackButton
            onClick={onBack || (() => onNavigate('student-dashboard'))}
            label="Back to Dashboard"
          />
          <span className="text-xs text-slate-500">
            Active Trackers: <strong>{goals.length}</strong>
          </span>
        </div>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              Learning Goals & Curriculum Mastery
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Set milestones, monitor subject progress, and stay focused on your academic goals.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowNewGoalModal(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Set New Learning Goal</span>
          </button>
        </div>

        {/* Learning KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              One-on-One Instruction
            </span>
            <span className="text-3xl font-extrabold text-blue-600">
              {summary.totalHours.toFixed(1)} hrs
            </span>
            <span className="text-xs text-slate-400 block mt-1">Total time spent with verified tutors</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Sessions Completed
            </span>
            <span className="text-3xl font-extrabold text-emerald-600">
              {summary.totalSessionsCompleted}
            </span>
            <span className="text-xs text-slate-400 block mt-1">Classroom lessons finalized</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Active Targets
            </span>
            <span className="text-3xl font-extrabold text-purple-600">
              {goals.filter(g => g.status === 'IN_PROGRESS').length}
            </span>
            <span className="text-xs text-slate-400 block mt-1">Milestones currently tracking</span>
          </div>
        </div>

        {/* Goals List */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span>Current Goals</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goals.map(g => {
              const pct = Math.min(100, Math.round((g.completedHours / g.targetHours) * 100));
              return (
                <div
                  key={g.id}
                  className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">{g.title}</h3>
                      <span className="text-xs text-blue-600 font-semibold">{g.subject}</span>
                    </div>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        g.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}
                    >
                      {g.status === 'COMPLETED' ? 'Completed' : 'In Progress'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-600">Progress</span>
                      <span className="text-purple-600">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-200">
                    <span>
                      {g.completedHours} of {g.targetHours} hours
                    </span>
                    <span>Target: {g.targetDate}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subjects Progress Directory */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>Subject Learning Tracker</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {subjectsProgress.map(sp => (
              <div
                key={sp.subject}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
              >
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-sm text-slate-900">{sp.subject}</h3>
                  <span className="text-xs font-bold text-blue-600">
                    {sp.sessionsCompleted} sessions
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <div>
                    <span className="text-slate-400">Total Tutored:</span>{' '}
                    <strong>{sp.totalHours.toFixed(1)} hrs</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Last Session:</span>{' '}
                    <span>{sp.lastSessionDate}</span>
                  </div>
                  {sp.nextSessionDate && (
                    <div className="text-emerald-700 font-medium">
                      Next Session: {sp.nextSessionDate}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => onNavigate('tutors', { subject: sp.subject })}
                  className="w-full py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-center gap-1"
                >
                  <span>Book {sp.subject} Tutor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modal: New Learning Goal */}
      {showNewGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Create Learning Goal</h3>
              <button onClick={() => setShowNewGoalModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Goal Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Binary Search & Trees"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={e => setNewSubject(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Hours
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={newTargetHours}
                    onChange={e => setNewTargetHours(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newTargetDate}
                    onChange={e => setNewTargetDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewGoalModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingGoal}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                >
                  {submittingGoal ? 'Saving...' : 'Set Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
