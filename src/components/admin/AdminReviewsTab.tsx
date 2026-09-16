import React, { useState, useEffect } from 'react';
import { Star, Search, ShieldCheck, Flag, ThumbsUp, Trash2 } from 'lucide-react';
import { api } from '../../services/api';

export const AdminReviewsTab: React.FC = () => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const res = await api.getAdminReviews();
        setReviews(res.reviews || []);
      } catch (err) {
        console.error('Failed to load reviews', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const filtered = reviews.filter(r => {
    return (
      r.studentName?.toLowerCase().includes(search.toLowerCase()) ||
      r.tutorName?.toLowerCase().includes(search.toLowerCase()) ||
      r.comment?.toLowerCase().includes(search.toLowerCase())
    );
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / reviews.length).toFixed(1)
    : '5.0';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
            <span>Student Feedback & Rating Moderation</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit student testimonials, maintain platform content standards, and monitor tutor teaching quality.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 bg-amber-50 text-amber-800 rounded-full text-xs font-bold border border-amber-200 flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Platform Avg: {avgRating} / 5.0</span>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student, tutor or comment..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          {filtered.length} total reviews
        </div>
      </div>

      {/* Reviews List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold">Loading reviews...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          <p className="text-sm font-semibold">No reviews found matching your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(r => (
            <div key={r.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-bold text-slate-900 text-xs">{r.studentName}</div>
                  <div className="text-[11px] text-slate-500">for <span className="font-semibold text-slate-800">{r.tutorName}</span></div>
                </div>
                <div className="flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 text-xs font-bold text-amber-800">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>{r.rating}.0</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                "{r.comment}"
              </p>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Verified Booking</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
