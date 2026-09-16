import React, { useState } from 'react';
import {
  Search,
  Calendar,
  Clock,
  ShieldCheck,
  Star,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BookOpen,
  Award,
  CreditCard,
  Lock,
  GraduationCap,
  Users,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { Tutor, Subject } from '../types';

interface LandingPageProps {
  tutors: Tutor[];
  subjects: Subject[];
  onSelectTutor: (tutor: Tutor) => void;
  onBookTutor: (tutor: Tutor) => void;
  onNavigate: (view: string, params?: any) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  tutors,
  subjects,
  onSelectTutor,
  onBookTutor,
  onNavigate,
}) => {
  const [searchSubject, setSearchSubject] = useState('');
  const [teachingMode, setTeachingMode] = useState<'All' | 'Online' | 'In-person'>('All');

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('tutors', {
      subject: searchSubject,
      mode: teachingMode !== 'All' ? teachingMode : undefined,
    });
  };

  const featuredTutors = tutors.slice(0, 4);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* ──────────────────────────────────────────────────────────
          HERO SECTION (Matches exact wireframe in user prompt)
      ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-16 lg:pb-28 bg-gradient-to-b from-white via-blue-50/25 to-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Copy & Search Form */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold tracking-wide">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>TRUSTED LEARNING STARTS HERE</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-950 tracking-tight leading-[1.12]">
                Find the right tutor. <br />
                <span className="text-blue-600">Learn with confidence.</span>
              </h1>

              {/* Subheading */}
              <p className="text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
                Discover experienced tutors, book flexible one-on-one sessions, and make measurable progress toward your learning goals.
              </p>

              {/* Interactive Search Box */}
              <form
                onSubmit={handleHeroSearch}
                className="bg-white p-3 sm:p-4 rounded-2xl shadow-lg shadow-slate-200/70 border border-slate-200 max-w-xl space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-7 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      placeholder="What do you want to learn? (e.g. Data Structures, React)"
                      value={searchSubject}
                      onChange={e => setSearchSubject(e.target.value)}
                      className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-5">
                    <select
                      value={teachingMode}
                      onChange={e => setTeachingMode(e.target.value as any)}
                      className="w-full py-2.5 px-3 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-700 font-medium"
                    >
                      <option value="All">Online & In-person</option>
                      <option value="Online">Online Only</option>
                      <option value="In-person">In-person</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                    <span className="text-slate-400 font-medium">Popular:</span>
                    <button
                      type="button"
                      onClick={() => onNavigate('tutors', { subject: 'Data Structures & Algorithms' })}
                      className="hover:text-blue-600 underline font-medium"
                    >
                      DSA
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => onNavigate('tutors', { subject: 'React' })}
                      className="hover:text-blue-600 underline font-medium"
                    >
                      React
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() => onNavigate('tutors', { subject: 'Calculus' })}
                      className="hover:text-blue-600 underline font-medium"
                    >
                      Calculus
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all"
                  >
                    <span>Find Tutors</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Trust Indicators below CTA */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 text-xs text-slate-500 font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Verified Credentials</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Free Cancellation (&gt;24h)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Instant Booking</span>
                </div>
              </div>
            </div>

            {/* Right Column: Floating UI Cards Composition (Matches [Tutor UI], [Calendar], [Progress]) */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md space-y-4">
                
                {/* 1. Tutor UI Card */}
                <div className="bg-white p-5 rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-200/90 relative z-20 transform hover:-translate-y-1 transition-transform">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
                        alt="Featured Tutor"
                        className="w-12 h-12 rounded-full object-cover border-2 border-blue-500 shadow-sm"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-bold text-slate-900 text-sm">Featured Tutor</h4>
                          <ShieldCheck className="w-4 h-4 text-teal-600" />
                        </div>
                        <p className="text-xs text-slate-500">Ph.D. Computer Science • Ex-IIT</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-base font-extrabold text-slate-900">₹850</span>
                      <span className="text-[11px] text-slate-500 block">/ hour</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-3 text-xs">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-md text-[10px]">
                      Data Structures
                    </span>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-semibold rounded-md text-[10px]">
                      Algorithms
                    </span>
                    <div className="ml-auto flex items-center gap-1 text-amber-500 font-bold text-xs">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>4.9</span>
                      <span className="text-slate-400 font-normal">(48 reviews)</span>
                    </div>
                  </div>
                </div>

                {/* 2. Interactive Calendar Availability Card */}
                <div className="bg-white p-4 rounded-2xl shadow-lg border border-slate-200 relative z-10 -mt-2">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" />
                      <span>Tomorrow's Available Slots</span>
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Instant Booking
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-center font-bold text-xs cursor-pointer hover:bg-blue-100">
                      10:00 AM
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 text-center font-semibold text-xs cursor-pointer hover:bg-slate-100">
                      02:30 PM
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50 text-slate-700 border border-slate-200 text-center font-semibold text-xs cursor-pointer hover:bg-slate-100">
                      05:00 PM
                    </div>
                  </div>
                </div>

                {/* 3. Progress Tracking Card */}
                <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-lg border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-teal-400" />
                      <span>Learning Milestone Progress</span>
                    </span>
                    <span className="text-teal-400 font-bold">85% Complete</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-500 to-teal-400 h-2 rounded-full w-[85%]" />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-2">
                    <span>14 hours completed</span>
                    <span>Goal: LeetCode Interview Prep</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          STATS BAR
      ────────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-slate-100">
            <div className="pt-2 md:pt-0">
              <div className="text-3xl font-extrabold text-slate-900">4.9 / 5</div>
              <div className="text-xs font-medium text-slate-500 mt-1 flex items-center justify-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>Average Tutor Rating</span>
              </div>
            </div>
            <div className="pt-2 md:pt-0">
              <div className="text-3xl font-extrabold text-slate-900">10,000+</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Learning Sessions Completed</div>
            </div>
            <div className="pt-2 md:pt-0">
              <div className="text-3xl font-extrabold text-slate-900">500+</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Verified Academic Tutors</div>
            </div>
            <div className="pt-2 md:pt-0">
              <div className="text-3xl font-extrabold text-slate-900">98%</div>
              <div className="text-xs font-medium text-slate-500 mt-1">Goal Achievement Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          HOW TUTORNEST WORKS (4 Steps)
      ────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">
              Simple & Transparent
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-950 tracking-tight">
              How TutorNest Works
            </h3>
            <p className="text-sm text-slate-600 mt-3 leading-relaxed">
              Book your session in under 2 minutes with verified subject-matter experts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all group">
              <div className="text-3xl font-black text-blue-600/30 group-hover:text-blue-600 transition-colors mb-3">
                01
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Find the Right Tutor</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Filter by specific subjects, hourly rates, verified qualifications, and genuine student reviews.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all group">
              <div className="text-3xl font-black text-blue-600/30 group-hover:text-blue-600 transition-colors mb-3">
                02
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Choose a Flexible Time</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                View real-time calendar availability slots and lock in sessions that match your schedule.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all group">
              <div className="text-3xl font-black text-blue-600/30 group-hover:text-blue-600 transition-colors mb-3">
                03
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Book Sessions Securely</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pay with peace of mind via encrypted checkout. Funds are released to tutors only after session completion.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:border-blue-300 transition-all group">
              <div className="text-3xl font-black text-blue-600/30 group-hover:text-blue-600 transition-colors mb-3">
                04
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-2">Learn with Confidence</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Join live video sessions, exchange notes, track learning progress, and achieve academic milestones.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          MEET OUR TUTORS (Featured Grid)
      ────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
                Expert Faculty
              </h2>
              <h3 className="text-3xl font-extrabold text-slate-950 tracking-tight">
                Meet Our Tutors
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-1">
                Hand-vetted instructors from top universities and leading tech organizations.
              </p>
            </div>
            <button
              onClick={() => onNavigate('tutors')}
              className="mt-4 md:mt-0 inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 group"
            >
              <span>Explore All Tutors</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredTutors.map(tutor => (
              <div
                key={tutor.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={tutor.avatar}
                      alt={tutor.name}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <h4 className="font-bold text-sm text-slate-900 truncate">{tutor.name}</h4>
                        {tutor.status === 'VERIFIED' && (
                          <ShieldCheck className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 truncate">{tutor.headline}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs py-2 border-y border-slate-100 my-3">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{tutor.rating.toFixed(1)}</span>
                      <span className="text-slate-400 font-normal">({tutor.reviewCount})</span>
                    </div>
                    <div className="font-extrabold text-slate-900">
                      ₹{tutor.hourlyRate} <span className="text-[10px] text-slate-500 font-normal">/hr</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {tutor.subjects.slice(0, 3).map(sub => (
                      <span
                        key={sub}
                        className="px-2 py-0.5 text-[10px] font-semibold bg-slate-100 text-slate-700 rounded-md"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onSelectTutor(tutor)}
                    className="py-2 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl text-center"
                  >
                    View Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => onBookTutor(tutor)}
                    className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl text-center shadow-sm"
                  >
                    Book Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          POPULAR SUBJECTS (Grid of interactive subjects)
      ────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
              Curated Curriculum
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-950 tracking-tight">
              Popular Subjects
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              From computer science algorithms to advanced calculus and language fluency.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {subjects.map(sub => (
              <div
                key={sub.id}
                onClick={() => onNavigate('tutors', { subject: sub.name })}
                className="p-5 rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all bg-slate-50/50 hover:bg-white group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-100/60 text-blue-600 flex items-center justify-center mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                  {sub.name}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">{sub.category}</p>
                <div className="mt-3 text-[11px] font-semibold text-blue-600 flex items-center gap-1">
                  <span>{sub.tutorCount || 3} tutors available</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          BUILT AROUND TRUST (6 Core Principles)
      ────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
              Safety & Integrity
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-950 tracking-tight">
              Built Around Trust
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Every feature on TutorNest is engineered to protect students and respect tutors.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1.5">Verified Tutors</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Academic degrees, identity, and teaching qualifications are vetted before any tutor profile goes live.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <CreditCard className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1.5">Secure Escrow Payments</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Payments are safely held until the session is completed, ensuring total accountability.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1.5">Flexible Booking & Refunds</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Life happens. Cancel up to 24 hours in advance for a 100% full refund with instant processing.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1.5">Transparent Pricing</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                No hidden costs or surprise recurring subscriptions. You pay only for the exact duration booked.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <Star className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1.5">Verified Student Reviews</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Only students who have paid for and attended a session can leave public ratings and reviews.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-900 text-sm mb-1.5">Privacy-First Architecture</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Personal contact information remains private. Direct messaging is guarded by active booking relationships.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          LEARNING STORIES (Testimonials)
      ────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">
              Student Success
            </h2>
            <h3 className="text-3xl font-extrabold text-slate-950 tracking-tight">
              Learning Stories
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              See how regular sessions with TutorNest mentors transform academic careers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                "I struggled with Graph algorithms and DP for months. Two focused sessions completely unlocked how I trace recursive states. I just received my software engineer internship offer!"
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="Student testimonial"
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <div className="font-bold text-xs text-slate-900">Student testimonial</div>
                  <div className="text-[10px] text-slate-500">CS Student, BITS Pilani</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                "Finding an experienced Organic Chemistry teacher who actually explains reaction mechanisms step-by-step was a game-changer for my college exams. The booking process is seamless."
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                <img
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80"
                  alt="Ananya Roy"
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <div className="font-bold text-xs text-slate-900">Ananya Roy</div>
                  <div className="text-[10px] text-slate-500">Biochem Major, Delhi University</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 italic leading-relaxed">
                "I needed to prepare for technical system design interviews. Rahul S. gave me real-world architecture feedback and live whiteboard exercises that gave me immense confidence."
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
                <img
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                  alt="Rohan Verma"
                  className="w-9 h-9 rounded-full object-cover"
                />
                <div>
                  <div className="font-bold text-xs text-slate-900">Rohan Verma</div>
                  <div className="text-[10px] text-slate-500">Associate Engineer, Bengaluru</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────
          FINAL CALL TO ACTION BANNER
      ────────────────────────────────────────────────────────── */}
      <section className="py-16 sm:py-20 bg-blue-600 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Ready to achieve your academic breakthrough?
          </h2>
          <p className="text-sm sm:text-base text-blue-100 max-w-2xl mx-auto leading-relaxed">
            Join thousands of learners discovering top-rated educators. Schedule your first 1-on-1 session today.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('tutors')}
              className="px-6 py-3 bg-white text-blue-600 font-bold text-xs sm:text-sm rounded-xl shadow-lg hover:bg-blue-50 transition-all flex items-center gap-2"
            >
              <span>Explore Verified Tutors</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('become-tutor')}
              className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all"
            >
              Teach on TutorNest
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
