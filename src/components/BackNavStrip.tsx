import React from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Home,
  GraduationCap,
  BookOpen,
  Calendar,
  MessageSquare,
  ShieldCheck,
  Search,
  DollarSign,
  User,
} from 'lucide-react';

interface BackNavStripProps {
  currentView: string;
  onBack: () => void;
  onNavigate: (view: string, params?: any) => void;
}

export const BackNavStrip: React.FC<BackNavStripProps> = ({
  currentView,
  onBack,
  onNavigate,
}) => {
  if (currentView === 'landing') return null;

  // View titles and hierarchies
  const getViewMeta = () => {
    switch (currentView) {
      // Student
      case 'student-dashboard':
        return {
          section: 'Student Workspace',
          sectionIcon: GraduationCap,
          sectionView: 'student-dashboard',
          title: 'Overview & Learning Hub',
        };
      case 'bookings':
        return {
          section: 'Student Workspace',
          sectionIcon: GraduationCap,
          sectionView: 'student-dashboard',
          title: 'My Bookings',
        };
      case 'learning':
        return {
          section: 'Student Workspace',
          sectionIcon: GraduationCap,
          sectionView: 'student-dashboard',
          title: 'Curriculum & Goals',
        };
      case 'tutors':
        return {
          section: 'Tutor Catalog',
          sectionIcon: Search,
          sectionView: 'tutors',
          title: 'Find Verified Instructors',
        };
      case 'tutor-profile':
        return {
          section: 'Tutor Catalog',
          sectionIcon: Search,
          sectionView: 'tutors',
          title: 'Instructor Profile & Booking',
        };
      // Tutor
      case 'tutor-dashboard':
      case 'tutor-bookings':
        return {
          section: 'Faculty Center',
          sectionIcon: GraduationCap,
          sectionView: 'tutor-dashboard',
          title: 'Teaching Workspace',
        };
      case 'tutor-availability':
        return {
          section: 'Faculty Center',
          sectionIcon: GraduationCap,
          sectionView: 'tutor-dashboard',
          title: 'Calendar & Availability',
        };
      case 'tutor-earnings':
        return {
          section: 'Faculty Center',
          sectionIcon: GraduationCap,
          sectionView: 'tutor-dashboard',
          title: 'Payouts & Ledger',
        };
      // Admin
      case 'admin-dashboard':
      case 'admin-users':
      case 'admin-tutors':
      case 'admin-bookings':
      case 'admin-audit':
        return {
          section: 'Admin Operations',
          sectionIcon: ShieldCheck,
          sectionView: 'admin-dashboard',
          title: 'Governance & Audits',
        };
      // General
      case 'messages':
        return {
          section: 'Communication',
          sectionIcon: MessageSquare,
          sectionView: 'messages',
          title: 'Protected Direct Messages',
        };
      case 'subjects':
        return {
          section: 'Curriculum',
          sectionIcon: BookOpen,
          sectionView: 'subjects',
          title: 'All Academic Subjects',
        };
      case 'how-it-works':
        return {
          section: 'Platform Guide',
          sectionIcon: BookOpen,
          sectionView: 'how-it-works',
          title: 'How TutorNest Works',
        };
      case 'become-tutor':
        return {
          section: 'Instructor Community',
          sectionIcon: GraduationCap,
          sectionView: 'become-tutor',
          title: 'Apply to Teach',
        };
      case 'contact':
        return {
          section: 'Support',
          sectionIcon: MessageSquare,
          sectionView: 'contact',
          title: 'Help Center & Inquiries',
        };
      case 'about':
        return {
          section: 'About',
          sectionIcon: BookOpen,
          sectionView: 'about',
          title: 'About TutorNest',
        };
      default:
        return {
          section: 'Portal',
          sectionIcon: Home,
          sectionView: 'landing',
          title: currentView,
        };
    }
  };

  const meta = getViewMeta();
  const SectionIcon = meta.sectionIcon;

  return (
    <div className="bg-white border-b border-slate-200/80 sticky top-16 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-11 flex items-center justify-between gap-3 text-xs">
        {/* Left: Back Button & Breadcrumbs */}
        <div className="flex items-center gap-3 overflow-x-auto py-1">
          {/* Universal Back Button */}
          <button
            type="button"
            onClick={onBack}
            className="group flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold transition-all flex-shrink-0"
            title="Go back to previous page"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-150 group-hover:-translate-x-0.5" />
            <span>Back</span>
          </button>

          <div className="h-4 w-px bg-slate-200 flex-shrink-0" />

          {/* Breadcrumb Path */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-slate-500 whitespace-nowrap">
            <button
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-1 text-slate-500 hover:text-blue-600 font-medium transition-colors"
              title="Return to Home"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Home</span>
            </button>

            <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />

            <button
              onClick={() => onNavigate(meta.sectionView)}
              className="flex items-center gap-1 text-slate-600 hover:text-blue-600 font-semibold transition-colors"
            >
              <SectionIcon className="w-3.5 h-3.5 text-blue-600" />
              <span>{meta.section}</span>
            </button>

            <ChevronRight className="w-3 h-3 text-slate-400 flex-shrink-0" />

            <span className="font-bold text-slate-900 truncate max-w-[140px] sm:max-w-xs">
              {meta.title}
            </span>
          </nav>
        </div>

        {/* Right Quick Action: Quick Home / Dashboard Jump */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {currentView !== 'student-dashboard' &&
            currentView !== 'tutor-dashboard' &&
            currentView !== 'admin-dashboard' && (
              <button
                onClick={() => onNavigate('landing')}
                className="hidden md:inline-flex items-center gap-1 text-slate-500 hover:text-slate-900 text-[11px] font-medium transition-colors"
              >
                <span>Return to Home</span>
              </button>
            )}
        </div>
      </div>
    </div>
  );
};
