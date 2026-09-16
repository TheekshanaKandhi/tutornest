import React, { useState } from 'react';
import { UserPlus, CheckCircle2, AlertCircle, Shield, Sparkles } from 'lucide-react';
import { api } from '../../services/api';

export const AdminAddTutorTab: React.FC<{
  onSuccess?: () => void;
}> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    headline: '',
    bio: '',
    hourlyRate: 800,
    experience: 4,
    subjects: 'Mathematics, Physics',
    education: 'B.Tech in Computer Science, IIT Bombay',
    city: 'Bangalore',
    teachingMode: 'BOTH' as 'ONLINE' | 'OFFLINE' | 'BOTH',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const subjectArray = formData.subjects.split(',').map(s => s.trim()).filter(Boolean);
      await api.addAdminTutor({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        headline: formData.headline,
        bio: formData.bio,
        hourlyRate: Number(formData.hourlyRate),
        experience: Number(formData.experience),
        subjects: subjectArray,
        education: formData.education,
        city: formData.city,
        teachingMode: formData.teachingMode,
      });

      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        headline: '',
        bio: '',
        hourlyRate: 800,
        experience: 4,
        subjects: 'Mathematics, Physics',
        education: 'B.Tech in Computer Science, IIT Bombay',
        city: 'Bangalore',
        teachingMode: 'BOTH',
      });
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to onboard tutor. Please verify inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <UserPlus className="w-6 h-6 text-blue-600" />
          <span>Direct Tutor Onboarding</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Manually register and verify certified tutors directly into the TutorNest system. An account will be established with pre-verified credentials.
        </p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <span className="font-bold">Tutor successfully added!</span> Their verified profile is now published to the public search index and available for student bookings.
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-800 text-xs">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div>{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Full Legal Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Dr. Rajesh Sharma"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              placeholder="tutor@tutornest.in"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              placeholder="+91 98765 43210"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              City / Location
            </label>
            <input
              type="text"
              placeholder="e.g. Bangalore, Delhi, Mumbai"
              value={formData.city}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Headline / Tagline <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Senior IIT JEE Mathematics Mentor with 10+ Years Experience"
            value={formData.headline}
            onChange={e => setFormData({ ...formData, headline: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Hourly Rate (₹ INR) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="100"
              step="50"
              required
              value={formData.hourlyRate}
              onChange={e => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Experience (Years)
            </label>
            <input
              type="number"
              min="0"
              value={formData.experience}
              onChange={e => setFormData({ ...formData, experience: Number(e.target.value) })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Teaching Mode
            </label>
            <select
              value={formData.teachingMode}
              onChange={e => setFormData({ ...formData, teachingMode: e.target.value as any })}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
            >
              <option value="BOTH">Online & Offline (Hybrid)</option>
              <option value="ONLINE">Online Only</option>
              <option value="OFFLINE">Offline / In-Person</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Subjects (comma separated) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Mathematics, Calculus, Algebra, Physics"
            value={formData.subjects}
            onChange={e => setFormData({ ...formData, subjects: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Education / Degrees
          </label>
          <input
            type="text"
            placeholder="e.g. M.Sc. in Applied Physics, Delhi University"
            value={formData.education}
            onChange={e => setFormData({ ...formData, education: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            Biography & Pedagogy Approach
          </label>
          <textarea
            rows={3}
            placeholder="Detail the tutor's background, past student achievements, and customized teaching methodology..."
            value={formData.bio}
            onChange={e => setFormData({ ...formData, bio: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Profile will be auto-approved and added to the audit log.</span>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Creating Tutor Account...' : 'Register & Verify Tutor'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
