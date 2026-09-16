import React from 'react';
import {
  Compass,
  Search,
  Home,
  BookOpen,
  ArrowRight,
  HelpCircle,
  Mail,
  ShieldCheck,
} from 'lucide-react';

interface NotFoundPageProps {
  attemptedPath?: string;
  onNavigate: (view: string, params?: any) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  attemptedPath = window.location.pathname,
  onNavigate,
}) => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center py-16 px-4 sm:px-6 lg:px-8 bg-slate-50">
      <div className="max-w-2xl w-full text-center">
        {/* Animated Icon & Badge */}
        <div className="inline-flex items-center justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm">
              <Compass className="w-12 h-12 stroke-[1.75]" />
            </div>
            <span className="absolute -bottom-2 -right-2 px-2.5 py-1 bg-slate-900 text-white text-[11px] font-mono font-bold rounded-lg shadow">
              404
            </span>
          </div>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          Page Not Found
        </h1>

        <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto mb-4 leading-relaxed">
          The address <span className="font-mono text-xs bg-slate-200/70 text-slate-800 px-2 py-0.5 rounded">{attemptedPath || '/'}</span> is not recognized on <strong className="text-slate-800 font-semibold">tutornest.in</strong>. It may have been moved, renamed, or temporarily retired.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <button
            onClick={() => onNavigate('landing')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm"
          >
            <Home className="w-4 h-4" />
            <span>Return to Homepage</span>
          </button>

          <button
            onClick={() => onNavigate('tutors')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white text-slate-800 font-bold text-xs border border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all"
          >
            <Search className="w-4 h-4 text-blue-600" />
            <span>Find a Verified Tutor</span>
          </button>
        </div>

        {/* Popular Destination Cards */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 text-left shadow-sm mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">
            Popular TutorNest Destinations
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => onNavigate('subjects')}
              className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-200 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
              </div>
              <div className="text-xs font-bold text-slate-900">Subjects Directory</div>
              <p className="text-[11px] text-slate-500 line-clamp-1">Maths, Coding, Physics & more</p>
            </button>

            <button
              onClick={() => onNavigate('how-it-works')}
              className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-200 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <HelpCircle className="w-4 h-4 text-teal-600" />
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-teal-600 transition-colors" />
              </div>
              <div className="text-xs font-bold text-slate-900">How It Works</div>
              <p className="text-[11px] text-slate-500 line-clamp-1">1-on-1 booking & guarantees</p>
            </button>

            <button
              onClick={() => onNavigate('become-tutor')}
              className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-100 hover:border-slate-200 text-left transition-all group"
            >
              <div className="flex items-center justify-between mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              </div>
              <div className="text-xs font-bold text-slate-900">Apply as Tutor</div>
              <p className="text-[11px] text-slate-500 line-clamp-1">Teach and earn on your schedule</p>
            </button>
          </div>
        </div>

        {/* Contact Support Footer Note */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
          <Mail className="w-3.5 h-3.5 text-slate-400" />
          <span>Need help finding a learning session?</span>
          <button
            onClick={() => onNavigate('contact')}
            className="text-blue-600 font-bold hover:underline"
          >
            Contact TutorNest Support
          </button>
        </div>
      </div>
    </div>
  );
};
