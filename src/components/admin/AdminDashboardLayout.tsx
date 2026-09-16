import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserPlus,
  Calendar,
  CreditCard,
  Star,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Shield,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type AdminViewTab =
  | 'overview'
  | 'students'
  | 'tutors'
  | 'add-tutor'
  | 'bookings'
  | 'payments'
  | 'reviews'
  | 'analytics'
  | 'audit'
  | 'settings';

interface AdminDashboardLayoutProps {
  currentTab: AdminViewTab;
  onSelectTab: (tab: AdminViewTab) => void;
  onNavigate: (view: string, params?: any) => void;
  pendingCount?: number;
  children: React.ReactNode;
}

export const AdminDashboardLayout: React.FC<AdminDashboardLayoutProps> = ({
  currentTab,
  onSelectTab,
  onNavigate,
  pendingCount = 0,
  children,
}) => {
  const { user, logout } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const navItems: { id: AdminViewTab; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'overview', label: 'Admin Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Students', icon: GraduationCap },
    { id: 'tutors', label: 'Tutors', icon: Users, badge: pendingCount > 0 ? pendingCount : undefined },
    { id: 'add-tutor', label: 'Add Tutor', icon: UserPlus },
    { id: 'bookings', label: 'Bookings', icon: Calendar },
    { id: 'payments', label: 'Payments', icon: CreditCard },
    { id: 'reviews', label: 'Reviews', icon: Star },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'audit', label: 'Audit Logs', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    onNavigate('login');
  };

  const renderNavContent = () => (
    <div className="flex flex-col h-full bg-slate-950 text-slate-300">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="text-sm font-extrabold text-white tracking-tight">TutorNest</span>
            <span className="text-[10px] ml-1.5 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
              Admin
            </span>
          </div>
        </div>
        <button
          onClick={() => setMobileNavOpen(false)}
          className="lg:hidden p-1 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Admin User Card */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/50">
        <div className="flex items-center gap-3">
          <img
            src={user?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
            alt="Admin"
            className="w-9 h-9 rounded-full object-cover border border-amber-500/40"
          />
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-white truncate">{user?.name || 'Administrator'}</div>
            <div className="text-[10px] text-amber-400 font-mono">ROLE_ADMIN</div>
          </div>
        </div>
      </div>

      {/* Main Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        <div className="px-3 pb-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Operations & Control
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`admin-nav-${item.id}`}
              onClick={() => {
                onSelectTab(item.id);
                setMobileNavOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Navigation */}
      <div className="p-3 border-t border-slate-800 space-y-1">
        <button
          onClick={() => onNavigate('landing')}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-900 hover:text-slate-200 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Public Website</span>
          </div>
          <span className="text-[10px] text-slate-500">tutornest.in</span>
        </button>

        <button
          id="btn-admin-logout"
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-400 hover:bg-red-950/40 hover:text-red-300 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col lg:flex-row">
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-0 h-screen shadow-xl z-30">
        {renderNavContent()}
      </aside>

      {/* Mobile Top Header */}
      <div className="lg:hidden bg-slate-950 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-40 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <button
            id="btn-open-admin-drawer"
            onClick={() => setMobileNavOpen(true)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
          <span className="text-sm font-bold tracking-tight">Admin Console</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
            {navItems.find(n => n.id === currentTab)?.label}
          </span>
          <button
            onClick={handleLogout}
            className="p-1.5 text-xs text-red-400 hover:text-red-300"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Slideover Drawer */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          <div className="relative w-64 max-w-xs flex-1 flex flex-col z-10 shadow-2xl">
            {renderNavContent()}
          </div>
        </div>
      )}

      {/* Main Admin Page Content */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
