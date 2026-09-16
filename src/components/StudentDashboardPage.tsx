import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Video,
  FileText,
  RefreshCw,
  XCircle,
  Star,
  CheckCircle2,
  TrendingUp,
  BookOpen,
  ArrowRight,
  ExternalLink,
  Plus,
} from 'lucide-react';
import { Booking, LearningGoal, LearningProgress, Tutor } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BackButton } from './BackButton';

interface StudentDashboardProps {
  onNavigate: (view: string, params?: any) => void;
  onBack?: () => void;
  onOpenInvoice: (paymentId: string) => void;
  onOpenReschedule: (booking: Booking) => void;
  onOpenReview: (booking: Booking) => void;
}

export const StudentDashboardPage: React.FC<StudentDashboardProps> = ({
  onNavigate,
  onBack,
  onOpenInvoice,
  onOpenReschedule,
  onOpenReview,
}) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [goals, setGoals] = useState<LearningGoal[]>([]);
  const [progressList, setProgressList] = useState<LearningProgress[]>([]);
  const [summary, setSummary] = useState<any>({ totalHours: 0, totalSessionsCompleted: 0 });
  const [loading, setLoading] = useState(true);

  // Cancellation feedback state
  const [cancelFeedback, setCancelFeedback] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bookingsData, learningData] = await Promise.all([
        api.getBookings(),
        api.getLearningOverview(),
      ]);
      setBookings(bookingsData.bookings);
      setGoals(learningData.goals);
      setProgressList(learningData.subjectsProgress);
      setSummary(learningData.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCancelBooking = async (b: Booking) => {
    const reason = window.prompt(
      'Cancellation Policy: >24h = 100% full refund, 12-24h = 50% refund, <12h = no refund.\n\nPlease enter the reason for cancellation:'
    );
    if (!reason) return;

    try {
      const res = await api.cancelBooking(b.id, reason);
      setCancelFeedback(
        `Session cancelled. Policy applied: ${res.policyApplied}. Refund amount: ₹${res.refundAmount} issued to original payment method.`
      );
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking');
    }
  };

  const upcomingBookings = bookings.filter(b => b.status === 'CONFIRMED');
  const pastBookings = bookings.filter(b => b.status === 'COMPLETED');

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation Back Option */}
        <div className="flex items-center justify-between">
          <BackButton
            onClick={onBack || (() => onNavigate('landing'))}
            label="Back to Home"
          />
          <div className="text-xs text-slate-500 font-medium">
            Student ID: <span className="font-mono font-bold text-slate-700">{user?.id || 'std-1'}</span>
          </div>
        </div>

        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">
              Student Learning Center
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
              Welcome back, {user?.name || 'Learner'}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              Track your scheduled sessions, connect directly to video classrooms, and monitor your subject mastery.
            </p>
          </div>

          <button
            onClick={() => onNavigate('tutors')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
          >
            <span>Book New Session</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Cancellation notification alert */}
        {cancelFeedback && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center justify-between">
            <span>{cancelFeedback}</span>
            <button
              onClick={() => setCancelFeedback(null)}
              className="text-xs font-bold text-emerald-900 hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Confirmed Upcoming
            </span>
            <span className="text-2xl font-extrabold text-slate-950">{upcomingBookings.length}</span>
            <span className="text-[11px] text-slate-400 block mt-1">Sessions on calendar</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Completed Sessions
            </span>
            <span className="text-2xl font-extrabold text-emerald-600">{pastBookings.length}</span>
            <span className="text-[11px] text-slate-400 block mt-1">Milestones finished</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Learning Hours
            </span>
            <span className="text-2xl font-extrabold text-blue-600">{summary.totalHours || 0} hrs</span>
            <span className="text-[11px] text-slate-400 block mt-1">One-on-one instruction</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Active Goals
            </span>
            <span className="text-2xl font-extrabold text-teal-600">
              {goals.filter(g => g.status === 'IN_PROGRESS').length}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">Tracked milestones</span>
          </div>
        </div>

        {/* Main Grid: Upcoming Sessions (Left) + Learning Goals & Mastery (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Upcoming Sessions List (Left 7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                <span>Upcoming Sessions</span>
              </h2>
              <button
                onClick={() => onNavigate('bookings')}
                className="text-xs text-blue-600 hover:underline font-bold"
              >
                View All History
              </button>
            </div>

            {loading ? (
              <div className="p-8 bg-white rounded-2xl border text-center text-xs text-slate-500">
                Loading sessions...
              </div>
            ) : upcomingBookings.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-3">
                <p className="text-xs text-slate-500">You have no upcoming sessions scheduled.</p>
                <button
                  onClick={() => onNavigate('tutors')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                >
                  Find a Tutor
                </button>
              </div>
            ) : (
              upcomingBookings.map(b => (
                <div
                  key={b.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={b.tutorAvatar}
                        alt={b.tutorName}
                        className="w-12 h-12 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <h3 className="font-bold text-sm text-slate-900">{b.subject}</h3>
                        <p className="text-xs text-slate-500">with {b.tutorName}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800">
                          Confirmed • Ref: {b.bookingReference}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-900">₹{b.totalAmount}</span>
                      <span className="text-[10px] text-slate-400 block">Paid</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex flex-wrap items-center gap-4 text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>{b.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>{b.startTime} ({b.durationMinutes} mins)</span>
                    </div>
                    <div className="text-slate-400 font-mono text-[11px]">
                      Mode: {b.teachingFormat}
                    </div>
                  </div>

                  {b.sessionNotes && (
                    <div className="text-xs text-slate-600 bg-blue-50/50 p-2.5 rounded-xl border border-blue-100">
                      <strong>Goals:</strong> {b.sessionNotes}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      {b.meetingLink && (
                        <a
                          href={b.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Join Classroom</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}

                      {b.paymentId && (
                        <button
                          type="button"
                          onClick={() => onOpenInvoice(b.paymentId!)}
                          className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Receipt</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onOpenReschedule(b)}
                        className="px-3 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Reschedule</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCancelBooking(b)}
                        className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold flex items-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Learning Progress & Goals (Right 5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Active Goals */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-teal-600" />
                  <span>Learning Goals</span>
                </h3>
                <button
                  onClick={() => onNavigate('learning')}
                  className="text-xs text-blue-600 hover:underline font-bold"
                >
                  Manage
                </button>
              </div>

              <div className="space-y-3">
                {goals.map(g => {
                  const pct = Math.min(100, Math.round((g.completedHours / g.targetHours) * 100));
                  return (
                    <div key={g.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                      <div className="flex justify-between items-start text-xs">
                        <div>
                          <span className="font-bold text-slate-900 block">{g.title}</span>
                          <span className="text-[10px] text-slate-500">{g.subject}</span>
                        </div>
                        <span className="font-bold text-teal-600">{pct}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-1.5">
                        <div
                          className="bg-teal-500 h-1.5 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>{g.completedHours} of {g.targetHours} hrs completed</span>
                        <span>Target: {g.targetDate}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Subject Mastery Overview */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Subject Mastery</span>
              </h3>

              <div className="space-y-3">
                {progressList.map(item => (
                  <div key={item.subject} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{item.subject}</span>
                      <span className="text-blue-600">{item.sessionsCompleted} sessions</span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Total Time: {item.totalHours.toFixed(1)} hrs • Last Session: {item.lastSessionDate}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
