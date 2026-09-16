import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { AvailabilitySlot } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BackButton } from './BackButton';

interface TutorAvailabilityPageProps {
  onBack?: () => void;
  onNavigate?: (view: string) => void;
}

export const TutorAvailabilityPage: React.FC<TutorAvailabilityPageProps> = ({
  onBack,
  onNavigate,
}) => {
  const { tutorProfile } = useAuth();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);

  // New slot form state
  const [slotDate, setSlotDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState('10:00 AM');
  const [endTime, setEndTime] = useState('11:00 AM');
  const [mode, setMode] = useState<'Online' | 'In-person' | 'Both'>('Online');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadSlots = async () => {
    if (!tutorProfile) return;
    setLoading(true);
    try {
      const data = await api.getTutorAvailability(tutorProfile.id);
      setSlots(data.slots);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSlots();
  }, [tutorProfile?.id]);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await api.addAvailabilitySlot({
        date: slotDate,
        startTime,
        endTime,
        mode,
        dayOfWeek: new Date(slotDate + 'T00:00:00').getDay(),
      });
      setMessage('Availability slot opened successfully.');
      setSlots(prev => [...prev, res.slot]);
    } catch (err: any) {
      alert(err.message || 'Failed to add slot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!window.confirm('Delete this availability slot?')) return;
    try {
      await api.deleteAvailabilitySlot(slotId);
      setSlots(prev => prev.filter(s => s.id !== slotId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete slot');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation Back Option */}
        <div className="flex items-center justify-between">
          <BackButton
            onClick={onBack || (() => onNavigate?.('tutor-dashboard'))}
            label="Back to Faculty Dashboard"
          />
          <span className="text-xs text-slate-500 font-medium">
            Published Slots: <strong className="text-slate-800">{slots.length}</strong>
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Manage Availability & Teaching Slots
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Publish open hours for students to book instantly. Once booked, slots are locked automatically by our ACID database engine.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Add Slot Form (Left 4 cols) */}
          <div className="lg:col-span-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 sticky top-24">
              <h2 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Add New Teaching Slot</span>
              </h2>

              {message && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              <form onSubmit={handleAddSlot} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={slotDate}
                    onChange={e => setSlotDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Start Time
                    </label>
                    <select
                      value={startTime}
                      onChange={e => setStartTime(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                    >
                      {['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM', '07:00 PM'].map(
                        t => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      End Time
                    </label>
                    <select
                      value={endTime}
                      onChange={e => setEndTime(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                    >
                      {['10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:30 PM', '05:00 PM', '06:30 PM', '08:00 PM'].map(
                        t => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mode
                  </label>
                  <select
                    value={mode}
                    onChange={e => setMode(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  >
                    <option value="Online">Online (Google Meet)</option>
                    <option value="In-person">In-person</option>
                    <option value="Both">Both Online & In-person</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-all"
                >
                  {submitting ? 'Adding...' : 'Publish Open Slot'}
                </button>
              </form>
            </div>
          </div>

          {/* Current Slots List (Right 8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-slate-900 text-base">
                Your Published Slots ({slots.length})
              </h2>
            </div>

            {loading ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-white rounded-3xl border">
                Loading availability slots...
              </div>
            ) : slots.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 bg-white rounded-3xl border border-slate-200">
                You haven't added any open slots yet. Use the form to publish dates.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {slots.map(s => (
                  <div
                    key={s.id}
                    className={`p-4 rounded-2xl border text-xs flex items-center justify-between transition-all ${
                      s.isBooked
                        ? 'bg-amber-50/60 border-amber-200 text-amber-900'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-blue-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-sm">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>{s.date || `Day ${s.dayOfWeek}`}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600 mt-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {s.startTime} - {s.endTime}
                        </span>
                      </div>
                      <span
                        className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.isBooked
                            ? 'bg-amber-200 text-amber-900'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {s.isBooked ? 'RESERVED / BOOKED' : 'OPEN FOR BOOKING'}
                      </span>
                    </div>

                    {!s.isBooked && (
                      <button
                        onClick={() => handleDeleteSlot(s.id)}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Delete slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
