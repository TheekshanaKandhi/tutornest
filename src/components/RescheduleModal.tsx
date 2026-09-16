import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, AlertCircle } from 'lucide-react';
import { Booking, AvailabilitySlot } from '../types';
import { api } from '../services/api';

interface RescheduleModalProps {
  booking: Booking;
  onClose: () => void;
  onSuccess: (updated: Booking) => void;
}

export const RescheduleModal: React.FC<RescheduleModalProps> = ({ booking, onClose, onSuccess }) => {
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadSlots = async () => {
      try {
        const data = await api.getTutorAvailability(booking.tutorId);
        const todayStr = new Date().toISOString().split('T')[0];
        const unbooked = data.slots.filter(s => !s.isBooked && (!s.date || s.date >= todayStr));
        setSlots(unbooked);
        if (unbooked.length > 0 && unbooked[0].date) {
          setSelectedDate(unbooked[0].date);
        }
      } catch (err) {
        console.error(err);
      }
    };
    loadSlots();
  }, [booking.tutorId]);

  const dates = Array.from(new Set(slots.map(s => s.date).filter(Boolean) as string[])).sort();
  const slotsForDate = slots.filter(s => s.date === selectedDate);

  const handleReschedule = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Please choose a new date and time slot.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await api.rescheduleBooking(booking.id, selectedDate, selectedTime);
      onSuccess(res.booking);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reschedule booking.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-lg">Reschedule Session</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500">Current Session:</span>
            <p className="font-bold text-slate-800 text-sm mt-0.5">{booking.subject} with {booking.tutorName}</p>
            <p className="text-slate-600 mt-1">
              Currently set for: <strong>{booking.date} at {booking.startTime}</strong>
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select New Date
            </label>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {dates.map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setSelectedDate(d);
                    setSelectedTime('');
                  }}
                  className={`p-2 min-w-[70px] rounded-xl border text-center transition-all ${
                    selectedDate === d
                      ? 'border-blue-600 bg-blue-600 text-white font-bold'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {d.slice(5)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select New Time
            </label>
            {slotsForDate.length === 0 ? (
              <p className="text-slate-500 py-2">No available slots on this date.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slotsForDate.map(slot => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedTime(slot.startTime)}
                    className={`p-2 rounded-xl border text-center font-semibold transition-all ${
                      selectedTime === slot.startTime
                        ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {slot.startTime}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={loading || !selectedTime}
              onClick={handleReschedule}
              className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Rescheduling...' : 'Confirm New Time'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
