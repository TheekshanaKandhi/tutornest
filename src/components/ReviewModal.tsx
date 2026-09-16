import React, { useState } from 'react';
import { X, Star, CheckCircle2, AlertCircle } from 'lucide-react';
import { Booking, Review } from '../types';
import { api } from '../services/api';

interface ReviewModalProps {
  booking: Booking;
  onClose: () => void;
  onSuccess: (review: Review) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ booking, onClose, onSuccess }) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError('Please provide a brief comment describing your session experience.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await api.submitReview({
        bookingId: booking.id,
        rating,
        comment: comment.trim(),
      });
      onSuccess(res.review);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-lg">Leave a Review</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="text-center space-y-1">
            <p className="text-xs text-slate-500">How was your session with</p>
            <p className="font-bold text-slate-900 text-base">{booking.tutorName}?</p>
            <p className="text-[11px] text-blue-600 font-medium">Subject: {booking.subject}</p>
          </div>

          {/* Interactive Star Rating */}
          <div className="flex justify-center items-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map(star => {
              const active = hoverRating ? star <= hoverRating : star <= rating;
              return (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(star)}
                  className="p-1 focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      active ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                    }`}
                  />
                </button>
              );
            })}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Your Feedback
            </label>
            <textarea
              rows={4}
              required
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="What did the tutor explain well? How did this session help you understand the subject?"
              className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Post Verified Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
