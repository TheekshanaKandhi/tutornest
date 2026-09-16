import React from 'react';
import { ShieldCheck, Award, Heart, CheckCircle2 } from 'lucide-react';
import { BackButton } from './BackButton';

interface AboutPageProps {
  onBack?: () => void;
  onNavigate?: (view: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onBack, onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Navigation Back Option */}
        <div>
          <BackButton
            onClick={onBack || (() => onNavigate?.('landing'))}
            label="Back to Home"
          />
        </div>

        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">Our Mission</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Democratizing High-Caliber Tutoring
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
            TutorNest was founded on the belief that every student deserves individual academic mentorship from vetted, passionate instructors without predatory pricing or lock-in contracts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <ShieldCheck className="w-8 h-8 text-teal-600" />
            <h3 className="font-extrabold text-slate-900 text-base">Academic Integrity</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every instructor is manually verified through rigorous transcript checks, identity records, and peer teaching demonstrations.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <Award className="w-8 h-8 text-amber-500" />
            <h3 className="font-extrabold text-slate-900 text-base">Escrow Guarantee</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Payments are safely protected in escrow and only released to tutors once lessons are completed successfully to your satisfaction.
            </p>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
            <Heart className="w-8 h-8 text-rose-500" />
            <h3 className="font-extrabold text-slate-900 text-base">Learner-First Culture</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Transparent hourly pricing, flexible cancellation windows, and instant HD video classrooms make learning seamless.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900">The 4 Pillars of TutorNest</h2>
          <div className="space-y-3 text-xs text-slate-700">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>No hidden subscriptions:</strong> Pay only for the sessions you book. No monthly membership fees.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Atomic booking concurrency:</strong> ACID transaction safeguards protect against double-booking tutor slots.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Automated tax invoices:</strong> Instant download of GST/VAT compliant digital receipts for every payment.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <span><strong>Direct faculty settlements:</strong> Weekly direct deposits to tutor bank accounts with full platform fee transparency.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
