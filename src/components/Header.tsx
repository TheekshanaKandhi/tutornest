import React, { useState, useEffect } from 'react';
import {
  Bell,
  Search,
  CheckCircle2,
  Calendar,
  BookOpen,
  MessageSquare,
  BarChart2,
  Shield,
  User,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Code2,
  ArrowRight,
} from 'lucide-react';
import { Logo } from './Logo';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Notification } from '../types';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string, params?: any) => void;
  onOpenArchitecture: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate, onOpenArchitecture }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await api.getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [user]);

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const navItemClass = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
      active
        ? 'text-blue-600 bg-blue-50 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="bg-slate-900 text-slate-200 px-4 py-1.5 text-xs font-medium border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex justify-end items-center gap-3">
          <div className="flex items-center gap-3">
            <button
              id="btn-open-arch"
              onClick={onOpenArchitecture}
              className="inline-flex items-center gap-1 text-slate-300 hover:text-white transition-colors underline-offset-4 hover:underline"
            >
              <Code2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Architecture & API Docs</span>
            </button>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:inline text-slate-400">
              Status: <span className="text-emerald-400 font-mono">ACID Lock Enabled</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-8">
            <Logo
              size="md"
              onClick={() => onNavigate('landing')}
              className="py-1"
            />

            {/* Desktop Navigation Links based on role */}
            <nav className="hidden lg:flex items-center gap-1">
              {!user || currentView === 'landing' ? (
                <>
                  <button
                    onClick={() => onNavigate('tutors')}
                    className={navItemClass(currentView === 'tutors')}
                  >
                    Find Tutors
                  </button>
                  <button
                    onClick={() => onNavigate('subjects')}
                    className={navItemClass(currentView === 'subjects')}
                  >
                    Subjects
                  </button>
                  <button
                    onClick={() => onNavigate('how-it-works')}
                    className={navItemClass(currentView === 'how-it-works')}
                  >
                    How It Works
                  </button>
                  <button
                    onClick={() => onNavigate('become-tutor')}
                    className={navItemClass(currentView === 'become-tutor')}
                  >
                    Become a Tutor
                  </button>
                  <button
                    onClick={() => onNavigate('about')}
                    className={navItemClass(currentView === 'about')}
                  >
                    About
                  </button>
                </>
              ) : null}

              {user?.role === 'STUDENT' && currentView !== 'landing' && (
                <>
                  <button
                    onClick={() => onNavigate('student-dashboard')}
                    className={navItemClass(currentView === 'student-dashboard')}
                  >
                    Student Dashboard
                  </button>
                  <button
                    onClick={() => onNavigate('tutors')}
                    className={navItemClass(currentView === 'tutors')}
                  >
                    Find Tutors
                  </button>
                  <button
                    onClick={() => onNavigate('bookings')}
                    className={navItemClass(currentView === 'bookings')}
                  >
                    My Bookings
                  </button>
                  <button
                    onClick={() => onNavigate('learning')}
                    className={navItemClass(currentView === 'learning')}
                  >
                    Learning Progress
                  </button>
                  <button
                    onClick={() => onNavigate('messages')}
                    className={navItemClass(currentView === 'messages')}
                  >
                    Messages
                  </button>
                  <button
                    onClick={() => onNavigate('student-reviews')}
                    className={navItemClass(currentView === 'student-reviews')}
                  >
                    Reviews
                  </button>
                  <button
                    onClick={() => onNavigate('student-profile')}
                    className={navItemClass(currentView === 'student-profile')}
                  >
                    Profile
                  </button>
                </>
              )}

              {user?.role === 'TUTOR' && currentView !== 'landing' && (
                <>
                  <button
                    onClick={() => onNavigate('tutor-dashboard')}
                    className={navItemClass(currentView === 'tutor-dashboard')}
                  >
                    Tutor Dashboard
                  </button>
                  <button
                    onClick={() => onNavigate('tutor-students')}
                    className={navItemClass(currentView === 'tutor-students')}
                  >
                    My Students
                  </button>
                  <button
                    onClick={() => onNavigate('tutor-availability')}
                    className={navItemClass(currentView === 'tutor-availability')}
                  >
                    Availability
                  </button>
                  <button
                    onClick={() => onNavigate('tutor-bookings')}
                    className={navItemClass(currentView === 'tutor-bookings')}
                  >
                    Bookings
                  </button>
                  <button
                    onClick={() => onNavigate('tutor-earnings')}
                    className={navItemClass(currentView === 'tutor-earnings')}
                  >
                    Earnings
                  </button>
                  <button
                    onClick={() => onNavigate('tutor-reviews')}
                    className={navItemClass(currentView === 'tutor-reviews')}
                  >
                    Reviews
                  </button>
                  <button
                    onClick={() => onNavigate('messages')}
                    className={navItemClass(currentView === 'messages')}
                  >
                    Messages
                  </button>
                  <button
                    onClick={() => onNavigate('tutor-profile-edit')}
                    className={navItemClass(currentView === 'tutor-profile-edit')}
                  >
                    Profile
                  </button>
                </>
              )}

              {user?.role === 'ADMIN' && currentView !== 'landing' && (
                <>
                  <button
                    onClick={() => onNavigate('admin-dashboard')}
                    className={navItemClass(currentView === 'admin-dashboard')}
                  >
                    Admin Dashboard
                  </button>
                  <button
                    onClick={() => onNavigate('admin-students')}
                    className={navItemClass(currentView === 'admin-students')}
                  >
                    Students
                  </button>
                  <button
                    onClick={() => onNavigate('admin-tutors')}
                    className={navItemClass(currentView === 'admin-tutors')}
                  >
                    Tutors
                  </button>
                  <button
                    onClick={() => onNavigate('admin-add-tutor')}
                    className={navItemClass(currentView === 'admin-add-tutor')}
                  >
                    Add Tutor
                  </button>
                  <button
                    onClick={() => onNavigate('admin-bookings')}
                    className={navItemClass(currentView === 'admin-bookings')}
                  >
                    Bookings
                  </button>
                  <button
                    onClick={() => onNavigate('admin-payments')}
                    className={navItemClass(currentView === 'admin-payments')}
                  >
                    Payments
                  </button>
                  <button
                    onClick={() => onNavigate('admin-reviews')}
                    className={navItemClass(currentView === 'admin-reviews')}
                  >
                    Reviews
                  </button>
                  <button
                    onClick={() => onNavigate('admin-analytics')}
                    className={navItemClass(currentView === 'admin-analytics')}
                  >
                    Analytics
                  </button>
                  <button
                    onClick={() => onNavigate('admin-audit')}
                    className={navItemClass(currentView === 'admin-audit')}
                  >
                    Audit Logs
                  </button>
                  <button
                    onClick={() => onNavigate('admin-settings')}
                    className={navItemClass(currentView === 'admin-settings')}
                  >
                    Settings
                  </button>
                </>
              )}
            </nav>
          </div>

          {/* Right Action Icons & Profile */}
          <div className="flex items-center gap-3">
            {/* Find Tutors quick action button if on landing */}
            {currentView === 'landing' && (
              <button
                onClick={() => onNavigate('tutors')}
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5"
              >
                <Search className="w-4 h-4" />
                <span>Search Tutors</span>
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-2">
                {/* Notification Dropdown */}
                <div className="relative">
                  <button
                    id="btn-notifications"
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl relative transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50">
                      <div className="flex items-center justify-between px-4 pb-2 border-b border-slate-100">
                        <span className="font-semibold text-slate-900 text-sm">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-xs text-blue-600 hover:underline font-medium"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-500">
                            You're all caught up! No notifications.
                          </div>
                        ) : (
                          notifications.slice(0, 6).map(n => (
                            <div
                              key={n.id}
                              className={`p-3 text-xs transition-colors hover:bg-slate-50 cursor-pointer ${
                                !n.read ? 'bg-blue-50/50' : ''
                              }`}
                              onClick={() => {
                                if (n.link) onNavigate(n.link.replace('/', ''));
                                setNotificationsOpen(false);
                              }}
                            >
                              <div className="flex items-start gap-2">
                                <span className="w-2 h-2 rounded-full mt-1.5 bg-blue-600 flex-shrink-0" />
                                <div>
                                  <div className="font-medium text-slate-800">{n.title}</div>
                                  <div className="text-slate-600 mt-0.5 leading-relaxed">{n.message}</div>
                                  <div className="text-[10px] text-slate-400 mt-1">
                                    {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="relative">
                  <button
                    id="btn-user-menu"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-slate-200"
                    />
                    <div className="hidden md:block text-left text-xs leading-tight">
                      <div className="font-semibold text-slate-900 truncate max-w-[120px]">{user.name}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                        {user.role}
                      </div>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs font-semibold text-slate-900">{user.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700">
                          {user.role} ACCOUNT
                        </span>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            if (user.role === 'STUDENT') onNavigate('student-dashboard');
                            else if (user.role === 'TUTOR') onNavigate('tutor-dashboard');
                            else onNavigate('admin-dashboard');
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <BarChart2 className="w-4 h-4 text-slate-400" />
                          <span>My Dashboard</span>
                        </button>
                        {user.role === 'STUDENT' && (
                          <button
                            onClick={() => {
                              onNavigate('bookings');
                              setUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>My Bookings</span>
                          </button>
                        )}
                        {user.role === 'TUTOR' && (
                          <button
                            onClick={() => {
                              onNavigate('tutor-availability');
                              setUserDropdownOpen(false);
                            }}
                            className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                          >
                            <Calendar className="w-4 h-4 text-slate-400" />
                            <span>Manage Availability</span>
                          </button>
                        )}
                        <button
                          onClick={() => {
                            onOpenArchitecture();
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Code2 className="w-4 h-4 text-slate-400" />
                          <span>System Architecture Spec</span>
                        </button>
                      </div>

                      <div className="border-t border-slate-100 pt-1">
                        <button
                          onClick={() => {
                            logout();
                            setUserDropdownOpen(false);
                            onNavigate('landing');
                          }}
                          className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('login')}
                  className="px-3.5 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => onNavigate('register')}
                  className="px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
                >
                  Get Started
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-2 pb-4 space-y-1">
          <button
            onClick={() => {
              onNavigate('landing');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            Home
          </button>
          <button
            onClick={() => {
              onNavigate('tutors');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            Find Tutors
          </button>
          <button
            onClick={() => {
              onNavigate('subjects');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            Subjects
          </button>
          <button
            onClick={() => {
              onNavigate('how-it-works');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            How It Works
          </button>

          {user && (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {user.role} Navigation
              </div>
              {user.role === 'STUDENT' && (
                <>
                  <button
                    onClick={() => { onNavigate('student-dashboard'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    Student Dashboard
                  </button>
                  <button
                    onClick={() => { onNavigate('bookings'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    My Bookings
                  </button>
                  <button
                    onClick={() => { onNavigate('learning'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    Learning Progress
                  </button>
                  <button
                    onClick={() => { onNavigate('messages'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    Messages
                  </button>
                  <button
                    onClick={() => { onNavigate('student-reviews'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    Reviews
                  </button>
                  <button
                    onClick={() => { onNavigate('student-profile'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    Profile
                  </button>
                </>
              )}

              {user.role === 'TUTOR' && (
                <>
                  <button
                    onClick={() => { onNavigate('tutor-dashboard'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs font-semibold text-teal-600 hover:bg-teal-50 rounded-lg"
                  >
                    Tutor Dashboard
                  </button>
                  <button
                    onClick={() => { onNavigate('tutor-students'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    My Students
                  </button>
                  <button
                    onClick={() => { onNavigate('tutor-availability'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    Availability
                  </button>
                  <button
                    onClick={() => { onNavigate('tutor-bookings'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    Bookings
                  </button>
                  <button
                    onClick={() => { onNavigate('tutor-earnings'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    Earnings
                  </button>
                  <button
                    onClick={() => { onNavigate('tutor-reviews'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    Reviews
                  </button>
                  <button
                    onClick={() => { onNavigate('messages'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    Messages
                  </button>
                  <button
                    onClick={() => { onNavigate('tutor-profile-edit'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    Profile
                  </button>
                </>
              )}

              {user.role === 'ADMIN' && (
                <>
                  <button
                    onClick={() => { onNavigate('admin-dashboard'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-50 rounded-lg"
                  >
                    Admin Dashboard
                  </button>
                  <button
                    onClick={() => { onNavigate('admin-students'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    Students
                  </button>
                  <button
                    onClick={() => { onNavigate('admin-tutors'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    Tutors
                  </button>
                  <button
                    onClick={() => { onNavigate('admin-add-tutor'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    Add Tutor
                  </button>
                  <button
                    onClick={() => { onNavigate('admin-bookings'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    Bookings
                  </button>
                  <button
                    onClick={() => { onNavigate('admin-payments'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    Payments
                  </button>
                  <button
                    onClick={() => { onNavigate('admin-reviews'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    Reviews
                  </button>
                  <button
                    onClick={() => { onNavigate('admin-analytics'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    Analytics
                  </button>
                  <button
                    onClick={() => { onNavigate('admin-audit'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    Audit Logs
                  </button>
                  <button
                    onClick={() => { onNavigate('admin-settings'); setMobileMenuOpen(false); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 rounded-lg"
                  >
                    Settings
                  </button>
                </>
              )}

              <button
                onClick={async () => {
                  await logout();
                  onNavigate('login');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg mt-1"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
