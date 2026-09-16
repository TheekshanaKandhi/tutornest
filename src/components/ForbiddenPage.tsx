import React from 'react';
import {
  ShieldAlert,
  ArrowRight,
  UserCheck,
  Lock,
  LogOut,
  Home,
  CheckCircle2,
} from 'lucide-react';
import { useAuth, getDashboardRoute } from '../context/AuthContext';

interface ForbiddenPageProps {
  requiredRole?: string;
  attemptedPath?: string;
  onNavigate: (view: string, params?: any) => void;
}

export const ForbiddenPage: React.FC<ForbiddenPageProps> = ({
  requiredRole = 'ADMIN',
  attemptedPath = '/admin/dashboard',
  onNavigate,
}) => {
  const { user, logout } = useAuth();
  const currentRole = user?.role || 'UNAUTHENTICATED';
  const myDashboardRoute = getDashboardRoute(user?.role);

  const handleSignOutAndSwitch = async () => {
    await logout();
    onNavigate('login');
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-red-100 text-center relative overflow-hidden">
        {/* Subtle red ambient glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-red-100 rounded-full blur-2xl pointer-events-none opacity-60" />
        <div className="absolute -bottom-12 -left-12 w-36 h-36 bg-amber-100 rounded-full blur-2xl pointer-events-none opacity-60" />

        <div className="relative z-10">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center shadow-inner">
            <ShieldAlert className="w-8 h-8 text-red-600" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold mb-3">
            <Lock className="w-3.5 h-3.5" />
            <span>HTTP 403 FORBIDDEN</span>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Role Access Denied
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
            You do not have clearance to access this portal. The requested endpoint requires{' '}
            <span className="font-bold text-slate-900 uppercase">{requiredRole}</span> privileges.
          </p>

          {/* Session Diagnostic Card */}
          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-500">
              <span>Current Account:</span>
              <span className="font-semibold text-slate-900 truncate max-w-[200px]">
                {user?.name || 'Guest'} ({user?.email || 'None'})
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Authenticated Role:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-800">
                {currentRole}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500">
              <span>Required Role:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                {requiredRole}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500 pt-1 border-t border-slate-200">
              <span>Restricted Route:</span>
              <span className="font-mono text-[11px] text-slate-700">{attemptedPath}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 space-y-2.5">
            {user && (
              <button
                id="btn-return-my-dashboard"
                onClick={() => onNavigate(myDashboardRoute.replace('/', ''))}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all"
              >
                <Home className="w-4 h-4" />
                <span>Return to My {user.role.toLowerCase()} Dashboard</span>
                <ArrowRight className="w-4 h-4 ml-auto" />
              </button>
            )}

            <button
              id="btn-forbidden-switch-account"
              onClick={handleSignOutAndSwitch}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>Sign In with a Different Account</span>
            </button>
          </div>

          <div className="mt-6 text-[11px] text-slate-400">
            TutorNest Spring Boot Spring Security strictly isolates student, tutor, and admin domains.
          </div>
        </div>
      </div>
    </div>
  );
};
