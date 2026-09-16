import React, { useState } from 'react';
import {
  Search,
  ShieldCheck,
  Calendar,
  Video,
  CreditCard,
  CheckCircle2,
  ChevronDown,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';
import { BackButton } from './BackButton';

interface HowItWorksPageProps {
  onNavigate: (view: string) => void;
  onBack?: () => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({ onNavigate, onBack }) => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const studentSteps = [
    {
      num: '01',
      title: 'Find Your Tutor',
      desc: 'Filter verified tutors by subject, price range, format (online or in-person), and peer review ratings.',
    },
    {
      num: '02',
      title: 'Inspect Qualifications',
      desc: 'Examine background checks, university transcripts, certifications, and authentic student reviews.',
    },
    {
      num: '03',
      title: 'Book Instantly with Escrow',
      desc: 'Select an open slot from the tutor’s live calendar. Payments are safely held in escrow until the lesson completes.',
    },
    {
      num: '04',
      title: 'Learn in HD Video',
      desc: 'Join your 1-on-1 session with one click via integrated Google Meet video and shared workspace.',
    },
  ];

  const faqs = [
    {
      q: 'How does the 100% Satisfaction Guarantee work?',
      a: 'If you are not completely satisfied with your first session with any tutor, notify us within 24 hours of completion. We will either rematch you with another tutor for free or issue a 100% full refund.',
    },
    {
      q: 'What is the session cancellation policy?',
      a: 'Cancellations made more than 24 hours before session start receive a 100% full refund. Cancellations made between 12 and 24 hours receive a 50% refund. Cancellations under 12 hours are non-refundable to honor the tutor’s reserved time.',
    },
    {
      q: 'Are all tutors background-checked and credentialed?',
      a: 'Yes. Every instructor on TutorNest undergoes strict manual transcript verification, government identity check, and subject matter screening before receiving a Verified Badge.',
    },
    {
      q: 'How are payments processed?',
      a: 'All transactions are processed using 256-bit encrypted Razorpay infrastructure supporting UPI, Net Banking, Credit/Debit cards, and Wallets.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Navigation Back Option */}
        <div>
          <BackButton
            onClick={onBack || (() => onNavigate('landing'))}
            label="Back to Home"
          />
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
            <ShieldCheck className="w-4 h-4" />
            <span>Transparent, Safe & Guaranteed</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            How TutorNest Works
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Connecting ambitious students with vetted academic experts through secure escrow payments and instant video classrooms.
          </p>
        </div>

        {/* 4 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {studentSteps.map(step => (
            <div
              key={step.num}
              className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-3 relative"
            >
              <span className="text-3xl font-black text-blue-600/20">{step.num}</span>
              <h3 className="font-extrabold text-slate-900 text-base">{step.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>

        {/* Cancellation & Escrow Policy Table */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="max-w-xl">
            <h2 className="text-xl font-extrabold text-slate-950">
              Clear & Fair Cancellation Policy
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              We respect both student flexibility and our tutors' dedicated time.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2">
              <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider block">
                &gt; 24 Hours Notice
              </span>
              <div className="text-2xl font-black text-emerald-950">100% Refund</div>
              <p className="text-xs text-emerald-800">
                Cancel or reschedule anytime up to 24 hours prior with zero penalty.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
              <span className="text-xs font-extrabold text-amber-800 uppercase tracking-wider block">
                12 – 24 Hours Notice
              </span>
              <div className="text-2xl font-black text-amber-950">50% Refund</div>
              <p className="text-xs text-amber-800">
                Partial compensation provided to the tutor for reserved slot time.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-100 border border-slate-200 space-y-2">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                &lt; 12 Hours Notice
              </span>
              <div className="text-2xl font-black text-slate-900">No Refund</div>
              <p className="text-xs text-slate-600">
                Full amount released to the instructor to safeguard faculty scheduling.
              </p>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-extrabold text-slate-950">Frequently Asked Questions</h2>
          </div>

          <div className="divide-y divide-slate-100">
            {faqs.map((f, i) => {
              const isOpen = activeFaq === i;
              return (
                <div key={i} className="py-4">
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between text-left font-bold text-sm text-slate-900"
                  >
                    <span>{f.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">{f.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-blue-900 to-slate-950 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ready to find your ideal tutor?
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
            Join thousands of students excelling in mathematics, computer science, languages, and more.
          </p>
          <button
            onClick={() => onNavigate('tutors')}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-all"
          >
            Browse Verified Tutors
          </button>
        </div>

      </div>
    </div>
  );
};
