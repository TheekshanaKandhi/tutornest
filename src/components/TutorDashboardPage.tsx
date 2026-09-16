import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Video,
  CheckCircle2,
  DollarSign,
  Star,
  Users,
  ExternalLink,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { Booking, Review } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BackButton } from './BackButton';

interface TutorDashboardProps {
  onNavigate: (view: string) => void;
  onBack?: () => void;
}

export const TutorDashboardPage: React.FC<TutorDashboardProps> = ({ onNavigate, onBack }) => {
  const { user, tutorProfile } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<Record<string, string>>({});

  const loadTutorData = async () => {
    setLoading(true);
    try {
      const [bRes, pRes] = await Promise.all([
        api.getBookings(),
        tutorProfile ? api.getTutorReviews(tutorProfile.id) : Promise.resolve({ reviews: [] }),
      ]);
      setBookings(bRes.bookings);
      setReviews(pRes.reviews);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTutorData();
  }, [tutorProfile?.id]);

  const handleCompleteSession = async (b: Booking) => {
    if (!window.confirm(`Mark session for ${b.studentName} as completed? This will finalize tutor payout.`)) return;

    try {
      await api.completeSession(b.id);
      alert('Session marked as completed! Payout has been recorded in your earnings ledger.');
      loadTutorData();
    } catch (err: any) {
      alert(err.message || 'Failed to complete session');
    }
  };

  const handleReplyReview = async (reviewId: string) => {
    const text = replyText[reviewId];
    if (!text || !text.trim()) return;

    try {
      await api.replyToReview(reviewId, text);
      alert('Your response has been published!');
      setReplyText(prev => ({ ...prev, [reviewId]: '' }));
      loadTutorData();
    } catch (err: any) {
      alert(err.message || 'Failed to reply to review');
    }
  };

  const upcomingSessions = bookings.filter(b => b.status === 'CONFIRMED');
  const completedSessions = bookings.filter(b => b.status === 'COMPLETED');
  const totalEarnings = completedSessions.reduce((sum, b) => sum + (b.subtotal || b.totalAmount - 40), 0);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation Back Option */}
        <div className="flex items-center justify-between">
          <BackButton
            onClick={onBack || (() => onNavigate('landing'))}
            label="Back to Home"
          />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              Faculty Account: <strong className="text-slate-800">{tutorProfile?.name || user?.name}</strong>
            </span>
          </div>
        </div>

        {/* Tutor Welcome Header */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-teal-400 uppercase tracking-widest">
              Faculty Workspace
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
              Welcome, {tutorProfile?.name || user?.name}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              {tutorProfile?.headline || 'Verified Instructor'} • Manage your teaching calendar, student appointments, and payout earnings.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onNavigate('tutor-availability')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              Manage Slots
            </button>
            <button
              onClick={() => onNavigate('tutor-earnings')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition-all"
            >
              Earnings Ledger
            </button>
          </div>
        </div>

        {/* Tutor KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Net Earnings
            </span>
            <span className="text-2xl font-extrabold text-emerald-600">₹{totalEarnings}</span>
            <span className="text-[11px] text-slate-400 block mt-1">Direct bank payout ready</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Upcoming Sessions
            </span>
            <span className="text-2xl font-extrabold text-blue-600">{upcomingSessions.length}</span>
            <span className="text-[11px] text-slate-400 block mt-1">Confirmed student lessons</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Completed Lessons
            </span>
            <span className="text-2xl font-extrabold text-slate-950">{completedSessions.length}</span>
            <span className="text-[11px] text-slate-400 block mt-1">Delivered curriculum</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Student Rating
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-950">
                {tutorProfile?.rating?.toFixed(1) || '4.9'}
              </span>
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <span className="text-[11px] text-slate-400 block mt-1">
              Based on {tutorProfile?.reviewCount || 12} reviews
            </span>
          </div>
        </div>

        {/* Main Grid: Scheduled Sessions (Left) + Student Reviews & Feedback (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Upcoming Sessions to Conduct */}
          <div className="lg:col-span-7 space-y-4">
            <h2 className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span>Teaching Schedule ({upcomingSessions.length} upcoming)</span>
            </h2>

            {upcomingSessions.length === 0 ? (
              <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-2">
                <p className="text-xs text-slate-500">No pending sessions scheduled right now.</p>
                <button
                  onClick={() => onNavigate('tutor-availability')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                >
                  Open More Slots
                </button>
              </div>
            ) : (
              upcomingSessions.map(b => (
                <div
                  key={b.id}
                  className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{b.subject}</h3>
                      <p className="text-xs text-slate-600">Student: <strong>{b.studentName}</strong> ({b.studentEmail})</p>
                      <span className="text-[10px] text-slate-400 font-mono">Ref: {b.bookingReference}</span>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-extrabold text-emerald-700">
                        ₹{b.subtotal || b.totalAmount - 40}
                      </span>
                      <span className="text-[10px] text-slate-400 block">Net Payout</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl text-xs flex flex-wrap items-center gap-4 text-slate-700 border border-slate-100">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      {b.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      {b.startTime} ({b.durationMinutes} mins)
                    </span>
                    <span className="text-slate-500 font-medium">Format: {b.teachingFormat}</span>
                  </div>

                  {b.sessionNotes && (
                    <div className="p-2.5 bg-blue-50/50 rounded-xl text-xs text-slate-700 border border-blue-100">
                      <strong>Student Goal:</strong> {b.sessionNotes}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                    {b.meetingLink && (
                      <a
                        href={b.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Launch Google Meet Room</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCompleteSession(b)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Session Completed</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Student Reviews & Replies */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-lg font-extrabold text-slate-950 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <span>Student Reviews & Feedback</span>
            </h2>

            {reviews.length === 0 ? (
              <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center text-xs text-slate-500">
                No reviews received yet. Reviews will appear here once students complete sessions.
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map(rev => (
                  <div
                    key={rev.id}
                    className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={rev.studentAvatar}
                          alt={rev.studentName}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div>
                          <span className="font-bold text-slate-900">{rev.studentName}</span>
                          <span className="text-[10px] text-slate-400 block">{rev.subject}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 text-amber-400">
                        {[...Array(rev.rating)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-current" />
                        ))}
                      </div>
                    </div>

                    <p className="text-slate-700 leading-relaxed italic">"{rev.comment}"</p>

                    {rev.tutorResponse ? (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-700 space-y-0.5">
                        <strong className="text-slate-900 block">Your Reply:</strong>
                        <p>{rev.tutorResponse}</p>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <input
                          type="text"
                          placeholder="Reply publicly to this review..."
                          value={replyText[rev.id] || ''}
                          onChange={e =>
                            setReplyText(prev => ({ ...prev, [rev.id]: e.target.value }))
                          }
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        />
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleReplyReview(rev.id)}
                            className="px-3 py-1 bg-slate-900 text-white rounded-lg font-bold text-[11px] hover:bg-slate-800"
                          >
                            Post Reply
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
