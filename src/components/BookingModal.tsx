import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Lock,
  ExternalLink,
} from 'lucide-react';
import { Tutor, AvailabilitySlot, Booking } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface BookingModalProps {
  tutor: Tutor;
  onClose: () => void;
  onSuccess: (booking: Booking) => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ tutor, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [selectedSubject, setSelectedSubject] = useState(tutor.subjects[0] || 'Computer Science');
  const [availableSlots, setAvailableSlots] = useState<AvailabilitySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [teachingFormat, setTeachingFormat] = useState<'Online' | 'In-person'>(
    tutor.teachingFormat === 'In-person' ? 'In-person' : 'Online'
  );
  const [sessionNotes, setSessionNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initiated order state
  const [initiatedBooking, setInitiatedBooking] = useState<Booking | null>(null);
  const [paymentOrder, setPaymentOrder] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Razorpay UPI' | 'Card' | 'Netbanking'>('Razorpay UPI');
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);

  // Load tutor slots
  useEffect(() => {
    const fetchSlots = async () => {
      try {
        const data = await api.getTutorAvailability(tutor.id);
        const todayStr = new Date().toISOString().split('T')[0];
        const validSlots = data.slots.filter(s => !s.isBooked && (!s.date || s.date >= todayStr));
        setAvailableSlots(validSlots);

        // Group dates
        if (validSlots.length > 0 && validSlots[0].date) {
          setSelectedDate(validSlots[0].date);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchSlots();
  }, [tutor.id]);

  // Pricing calculations
  const subtotal = Math.round(tutor.hourlyRate * (durationMinutes / 60));
  const platformFee = 40;
  const totalAmount = subtotal + platformFee;

  // Distinct dates available
  const availableDates = Array.from(
    new Set(availableSlots.map(s => s.date).filter(Boolean) as string[])
  ).sort();

  const slotsForDate = availableSlots.filter(s => s.date === selectedDate);

  // Handle Step 1 -> 4 progression
  const handleProceedToPayment = async () => {
    if (!selectedSlot || !selectedDate) {
      setError('Please select an available date and time slot.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      // Initiate booking with ACID concurrency lock on backend
      const result = await api.initiateBooking({
        tutorId: tutor.id,
        subject: selectedSubject,
        date: selectedDate,
        startTime: selectedSlot.startTime,
        durationMinutes,
        teachingFormat,
        sessionNotes,
      });

      setInitiatedBooking(result.booking);
      setPaymentOrder(result.paymentOrder);
      setStep(5); // Proceed to payment
    } catch (err: any) {
      setError(err.message || 'Time slot conflict or error initiating booking.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Payment Verification (Step 5 -> 6)
  const handleVerifyPayment = async () => {
    if (!initiatedBooking || !paymentOrder) return;
    setLoading(true);
    setError(null);

    try {
      // Simulate Razorpay payment confirmation with server-side HMAC signature verification
      const verified = await api.verifyAndConfirmPayment({
        bookingId: initiatedBooking.id,
        orderId: paymentOrder.orderId,
        paymentId: `pay_TN_${Date.now().toString().slice(-6)}`,
        paymentMethod,
        signature: 'sig_verified_hmac_sha256',
      });

      setConfirmedBooking(verified.booking);
      setStep(6);
      onSuccess(verified.booking);
    } catch (err: any) {
      setError(err.message || 'Payment verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <img
              src={tutor.avatar}
              alt={tutor.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-blue-500"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-white">{tutor.name}</h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-300 bg-teal-500/20 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </span>
              </div>
              <p className="text-xs text-slate-300 truncate max-w-sm">{tutor.headline}</p>
            </div>
          </div>

          {/* Progress Steps Indicator */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800 text-xs font-medium">
            <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
                1
              </span>
              <span>Subject</span>
            </div>
            <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
                2
              </span>
              <span>Schedule</span>
            </div>
            <div className={`flex items-center gap-1.5 ${step >= 5 ? 'text-blue-400 font-bold' : 'text-slate-500'}`}>
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
                3
              </span>
              <span>Payment</span>
            </div>
            <div className={`flex items-center gap-1.5 ${step === 6 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
              <span className="w-5 h-5 rounded-full border border-current flex items-center justify-center text-[10px]">
                4
              </span>
              <span>Confirm</span>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Booking Conflict</p>
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* STEP 1: Select Subject */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  What subject do you want to learn?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {tutor.subjects.map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSubject(s)}
                      className={`p-3 text-left rounded-xl border text-xs font-semibold transition-all ${
                        selectedSubject === s
                          ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Preferred Format
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setTeachingFormat('Online')}
                    className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-semibold ${
                      teachingFormat === 'Online'
                        ? 'border-blue-600 bg-blue-50 text-blue-800'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Online (Google Meet)
                  </button>
                  {tutor.teachingFormat === 'Both' && (
                    <button
                      type="button"
                      onClick={() => setTeachingFormat('In-person')}
                      className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-semibold ${
                        teachingFormat === 'In-person'
                          ? 'border-blue-600 bg-blue-50 text-blue-800'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      In-person ({tutor.location})
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 flex items-center gap-1.5 shadow-sm"
                >
                  <span>Select Date & Time</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Select Date & Available Time Slot */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  1. Choose Date
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {availableDates.map(dateStr => {
                    const d = new Date(dateStr + 'T00:00:00');
                    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
                    const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const isSelected = selectedDate === dateStr;

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => {
                          setSelectedDate(dateStr);
                          setSelectedSlot(null);
                        }}
                        className={`p-2.5 min-w-[80px] rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-[11px] font-medium">{dayName}</div>
                        <div className="text-xs font-bold mt-0.5">{monthDay}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  2. Choose Available Time Slot ({slotsForDate.length} available)
                </label>
                {slotsForDate.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3">No available slots on this date. Please pick another day.</p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slotsForDate.map(slot => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-2 rounded-xl border text-xs font-semibold text-center transition-all ${
                          selectedSlot?.id === slot.id
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

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={!selectedSlot}
                  onClick={() => setStep(3)}
                  className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5"
                >
                  <span>Select Duration</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Duration & Price Breakdown */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Choose Session Duration
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[30, 60, 90, 120].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMinutes(mins)}
                      className={`p-3 rounded-xl border text-center font-bold text-xs transition-all ${
                        durationMinutes === mins
                          ? 'border-blue-600 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                          : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {mins} mins
                    </button>
                  ))}
                </div>
              </div>

              {/* Transparent Price Summary */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Tutor Rate ({durationMinutes} mins @ ₹{tutor.hourlyRate}/hr)</span>
                  <span className="font-semibold text-slate-900">₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="flex items-center gap-1">
                    Platform Trust & Safety Fee
                    <span className="text-[10px] text-slate-400">(Escrow guarantee)</span>
                  </span>
                  <span className="font-semibold text-slate-900">₹{platformFee}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
                  <span>Total Payable</span>
                  <span className="text-blue-600">₹{totalAmount}</span>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 flex items-center gap-1.5"
                >
                  <span>Add Learning Goals</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Session Notes & Review */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  What would you like to achieve in this session? (Optional)
                </label>
                <textarea
                  rows={3}
                  value={sessionNotes}
                  onChange={e => setSessionNotes(e.target.value)}
                  placeholder="e.g. Preparing for LeetCode medium DP interview questions, or reviewing college calculus problem sets..."
                  className="w-full p-3 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Summary Card */}
              <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl text-xs space-y-1.5">
                <div className="font-bold text-blue-900 flex items-center justify-between">
                  <span>Booking Summary</span>
                  <span className="text-blue-600 font-extrabold text-sm">₹{totalAmount}</span>
                </div>
                <p className="text-slate-700">
                  <strong>{selectedSubject}</strong> with <strong>{tutor.name}</strong>
                </p>
                <p className="text-slate-600 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>{selectedDate}</span>
                  <span>•</span>
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>{selectedSlot?.startTime} ({durationMinutes} mins)</span>
                </p>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50"
                >
                  Back
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleProceedToPayment}
                  className="px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                >
                  {loading ? 'Reserving Slot...' : 'Lock Slot & Proceed to Pay'}
                  <Lock className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Secure Payment Gateway (Razorpay Simulator) */}
          {step === 5 && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-white p-4 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Order ID: {paymentOrder?.orderId}</div>
                  <div className="text-lg font-extrabold text-white mt-0.5">₹{totalAmount}</div>
                </div>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                    <ShieldCheck className="w-3 h-3" />
                    Razorpay Secure
                  </span>
                  <div className="text-[10px] text-slate-400 mt-1">256-Bit SSL Encrypted</div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Select Payment Method
                </label>
                <div className="space-y-2">
                  {(['Razorpay UPI', 'Card', 'Netbanking'] as const).map(method => (
                    <label
                      key={method}
                      className={`flex items-center justify-between p-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all ${
                        paymentMethod === method
                          ? 'border-blue-600 bg-blue-50 text-blue-900'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="paymentMethod"
                          checked={paymentMethod === method}
                          onChange={() => setPaymentMethod(method)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <span>{method}</span>
                      </div>
                      {method === 'Razorpay UPI' && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          Instant Google Pay / PhonePe / Paytm
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 leading-relaxed">
                <strong>ACID Transaction Verification:</strong> On clicking "Authorize Payment", the server executes idempotent HMAC verification, locks the time slot permanently in the database, and issues an official tax invoice.
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleVerifyPayment}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    'Verifying Payment Server-side...'
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Authorize Payment of ₹{totalAmount}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* STEP 6: Confirmation Screen */}
          {step === 6 && confirmedBooking && (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div>
                <h4 className="text-xl font-extrabold text-slate-900">Your Session is Confirmed!</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Booking Reference: <span className="font-mono font-bold text-slate-800">{confirmedBooking.bookingReference}</span>
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tutor:</span>
                  <span className="font-semibold text-slate-900">{confirmedBooking.tutorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Subject:</span>
                  <span className="font-semibold text-slate-900">{confirmedBooking.subject}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Time:</span>
                  <span className="font-semibold text-slate-900">{confirmedBooking.date} at {confirmedBooking.startTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Duration:</span>
                  <span className="font-semibold text-slate-900">{confirmedBooking.durationMinutes} minutes</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5">
                  <span className="text-slate-500">Amount Paid:</span>
                  <span className="font-bold text-emerald-600">₹{confirmedBooking.totalAmount} (Verified)</span>
                </div>
                {confirmedBooking.meetingLink && (
                  <div className="pt-2">
                    <a
                      href={confirmedBooking.meetingLink}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:underline font-semibold"
                    >
                      <span>Join Live Meeting Room</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800"
                >
                  Done & View Dashboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
