import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Video,
  FileText,
  Star,
  RefreshCw,
  XCircle,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { Booking } from '../types';
import { api } from '../services/api';
import { BackButton } from './BackButton';

interface BookingsPageProps {
  onOpenInvoice: (paymentId: string) => void;
  onOpenReschedule: (booking: Booking) => void;
  onOpenReview: (booking: Booking) => void;
  onBookAgain: (tutorId: string) => void;
  onBack?: () => void;
  onNavigate?: (view: string) => void;
}

export const BookingsPage: React.FC<BookingsPageProps> = ({
  onOpenInvoice,
  onOpenReschedule,
  onOpenReview,
  onBookAgain,
  onBack,
  onNavigate,
}) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const res = await api.getBookings();
      setBookings(res.bookings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleCancelBooking = async (b: Booking) => {
    const reason = window.prompt(
      'Cancellation Policy: >24h = 100% full refund, 12-24h = 50% refund, <12h = no refund.\n\nPlease enter the reason for cancellation:'
    );
    if (!reason) return;

    try {
      const res = await api.cancelBooking(b.id, reason);
      alert(
        `Session cancelled. Policy applied: ${res.policyApplied}. Refund amount: ₹${res.refundAmount} issued to original payment method.`
      );
      loadBookings();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel booking');
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (filter === 'ALL') return true;
    return b.status === filter;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation Back Option */}
        <div className="flex items-center justify-between">
          <BackButton
            onClick={onBack || (() => onNavigate?.('student-dashboard'))}
            label="Back to Dashboard"
          />
          <span className="text-xs text-slate-500">
            Total Sessions: <strong>{bookings.length}</strong>
          </span>
        </div>

        {/* Title & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              My Bookings & Session History
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Manage scheduled sessions, access Google Meet classrooms, and download tax invoices.
            </p>
          </div>

          <div className="flex gap-1.5 p-1 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-600">
            {[
              { id: 'ALL', label: 'All Sessions' },
              { id: 'CONFIRMED', label: 'Upcoming' },
              { id: 'COMPLETED', label: 'Completed' },
              { id: 'CANCELLED', label: 'Cancelled' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  filter === tab.id
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
            Loading session records...
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-2">
            <Calendar className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="font-bold text-slate-800 text-sm">No bookings in this tab</p>
            <p className="text-xs text-slate-500">
              When you book sessions, they will be listed here with live classroom links and invoice records.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map(b => (
              <div
                key={b.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={b.tutorAvatar}
                      alt={b.tutorName}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{b.subject}</h3>
                      <p className="text-xs text-slate-600">
                        with <strong>{b.tutorName}</strong>
                      </p>
                      <span className="text-[10px] font-mono text-slate-400">
                        Ref: {b.bookingReference}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-slate-950">₹{b.totalAmount}</span>
                      <span className="text-[10px] text-slate-400 block">{b.currency}</span>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        b.status === 'CONFIRMED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : b.status === 'COMPLETED'
                          ? 'bg-blue-100 text-blue-800'
                          : b.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {b.status}
                    </span>
                  </div>
                </div>

                {/* Session details */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Scheduled Date & Time</span>
                    <span className="font-semibold text-slate-800">
                      {b.date} at {b.startTime}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Duration & Format</span>
                    <span className="font-semibold text-slate-800">
                      {b.durationMinutes} mins • {b.teachingFormat}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Payment Status</span>
                    <span className="font-semibold text-emerald-700 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified via Razorpay
                    </span>
                  </div>
                </div>

                {b.sessionNotes && (
                  <div className="text-xs text-slate-600 bg-blue-50/40 p-3 rounded-xl border border-blue-100">
                    <span className="font-bold text-blue-900 block mb-0.5">Session Goals & Notes:</span>
                    {b.sessionNotes}
                  </div>
                )}

                {b.status === 'CANCELLED' && (
                  <div className="text-xs text-red-700 bg-red-50 p-3 rounded-xl border border-red-200">
                    <strong>Cancellation Details:</strong> {b.cancellationReason || 'User requested cancellation'} •{' '}
                    <strong>Refund Processed:</strong> ₹{b.refundAmount || 0}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {b.status === 'CONFIRMED' && b.meetingLink && (
                      <a
                        href={b.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Live Classroom</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {b.paymentId && (
                      <button
                        type="button"
                        onClick={() => onOpenInvoice(b.paymentId!)}
                        className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" />
                        <span>Tax Invoice</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {b.status === 'CONFIRMED' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenReschedule(b)}
                          className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Reschedule</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCancelBooking(b)}
                          className="px-3.5 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Cancel Session</span>
                        </button>
                      </>
                    )}

                    {b.status === 'COMPLETED' && (
                      <>
                        <button
                          type="button"
                          onClick={() => onOpenReview(b)}
                          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                        >
                          <Star className="w-3.5 h-3.5" />
                          <span>Leave Verified Review</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onBookAgain(b.tutorId)}
                          className="px-3.5 py-2 border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl text-xs font-semibold"
                        >
                          Book Again
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
