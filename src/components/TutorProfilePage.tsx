import React, { useState, useEffect } from 'react';
import {
  Star,
  ShieldCheck,
  MapPin,
  Clock,
  Calendar,
  Award,
  BookOpen,
  GraduationCap,
  MessageSquare,
  ArrowLeft,
  CheckCircle2,
  Globe,
  Share2,
} from 'lucide-react';
import { Tutor, Review, AvailabilitySlot } from '../types';
import { api } from '../services/api';
import { BackButton } from './BackButton';

interface TutorProfilePageProps {
  tutorId: string;
  onBack: () => void;
  onBook: (tutor: Tutor) => void;
}

export const TutorProfilePage: React.FC<TutorProfilePageProps> = ({ tutorId, onBack, onBook }) => {
  const [tutor, setTutor] = useState<Tutor | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const data = await api.getTutor(tutorId);
        setTutor(data.tutor);
        setReviews(data.reviews);
        setSlots(data.slots);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [tutorId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 text-center text-xs text-slate-500">
        Loading tutor profile and reviews...
      </div>
    );
  }

  if (!tutor) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 text-center">
        <p className="text-sm font-bold text-slate-800">Tutor profile not found.</p>
        <button
          onClick={onBack}
          className="mt-3 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl"
        >
          Back to Directory
        </button>
      </div>
    );
  }

  const unbookedSlots = slots.filter(s => !s.isBooked);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <BackButton
            onClick={onBack}
            label="Back to Tutors Catalog"
          />
          <span className="text-xs text-slate-500">
            Instructor ID: <span className="font-mono font-bold text-slate-700">{tutor.id}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Profile Info (Left 8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Header Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                <img
                  src={tutor.avatar}
                  alt={tutor.name}
                  className="w-24 h-24 rounded-2xl object-cover border-2 border-blue-500 shadow-md"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-extrabold text-slate-950 tracking-tight">{tutor.name}</h1>
                    {tutor.status === 'VERIFIED' && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                        Verified Tutor
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1">{tutor.headline}</p>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{tutor.rating.toFixed(1)}</span>
                      <span className="text-slate-400 font-normal">({tutor.reviewCount} reviews)</span>
                    </div>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {tutor.location}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {tutor.yearsExperience} Years Experience
                    </span>
                    <span>•</span>
                    <span>{tutor.totalSessions} Sessions</span>
                  </div>
                </div>
              </div>
            </div>

            {/* About / Bio */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>About Me & Teaching Philosophy</span>
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {tutor.bio}
              </p>
            </div>

            {/* Academic Credentials & Certifications */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>Verified Qualifications</span>
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">Highest Degree / Alma Mater</h3>
                    <p className="text-xs text-slate-600">{tutor.education}</p>
                    <span className="text-[10px] font-semibold text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded inline-block mt-1">
                      Transcript Verified by TutorNest
                    </span>
                  </div>
                </div>

                {tutor.certifications.length > 0 && (
                  <div className="flex items-start gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-900">Certifications & Accreditations</h3>
                      <ul className="list-disc list-inside text-xs text-slate-600 mt-1 space-y-0.5">
                        {tutor.certifications.map(c => (
                          <li key={c}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Subjects & Skills */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900">Subjects Taught</h2>
              <div className="flex flex-wrap gap-2">
                {tutor.subjects.map(s => (
                  <span
                    key={s}
                    className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl text-xs font-semibold"
                  >
                    {s}
                  </span>
                ))}
              </div>

              <h2 className="text-base font-bold text-slate-900 pt-3">Specialized Topics & Skills</h2>
              <div className="flex flex-wrap gap-1.5">
                {tutor.skills.map(skill => (
                  <span
                    key={skill}
                    className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Verified Student Reviews Section */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-blue-600" />
                    <span>Verified Student Reviews</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Reviews from verified completed learning sessions.
                  </p>
                </div>
                <div className="flex items-center gap-1 text-amber-500 font-extrabold text-lg">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span>{tutor.rating.toFixed(1)}</span>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No public reviews posted yet. Be the first to book a session!
                </div>
              ) : (
                <div className="divide-y divide-slate-100 space-y-4">
                  {reviews.map(rev => (
                    <div key={rev.id} className="pt-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={rev.studentAvatar}
                            alt={rev.studentName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div>
                            <span className="font-bold text-xs text-slate-900">{rev.studentName}</span>
                            <span className="text-[10px] text-slate-400 block">
                              Studied {rev.subject} • {new Date(rev.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 text-amber-400">
                          {[...Array(rev.rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">{rev.comment}</p>

                      {rev.tutorResponse && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl ml-4 mt-2 text-xs space-y-1">
                          <span className="font-bold text-slate-900 text-[11px] block">
                            Tutor's Response:
                          </span>
                          <p className="text-slate-600">{rev.tutorResponse}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Sticky Booking Card (Right 4 cols) */}
          <div className="lg:col-span-4">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl sticky top-24 space-y-6">
              <div className="flex items-baseline justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-2xl font-extrabold text-slate-950">₹{tutor.hourlyRate}</span>
                  <span className="text-xs text-slate-500 font-medium"> / 60-min session</span>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{tutor.rating.toFixed(1)}</span>
                </div>
              </div>

              {/* Guarantees list */}
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>100% Satisfaction or full refund guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Free cancellation up to 24h before session</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>Instant calendar sync & Google Meet room</span>
                </div>
              </div>

              {/* Next available slot highlight */}
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl text-xs space-y-1">
                <span className="font-bold text-blue-950 block">Next Available Slots</span>
                <p className="text-blue-700">
                  {unbookedSlots.length} open slots ready for instant booking.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onBook(tutor)}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-500/25 transition-all text-center"
              >
                Book a Session Now
              </button>

              <div className="text-center">
                <span className="text-[11px] text-slate-400">
                  Protected by 256-bit SSL encrypted checkout
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
