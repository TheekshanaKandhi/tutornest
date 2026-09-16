import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingUp,
  Settings,
  Search,
  BookOpen,
  Calendar,
  Lock,
  Check,
  GraduationCap,
  UserPlus,
  CreditCard,
  Star,
  BarChart3,
} from 'lucide-react';
import { User, Tutor, AuditLog, SystemSettings } from '../types';
import { api } from '../services/api';
import { BackButton } from './BackButton';
import { AdminAuditTab } from './admin/AdminAuditTab';
import { AdminAuditActionModal, AuditActionModalConfig } from './admin/AdminAuditActionModal';
import { AdminDashboardLayout, AdminViewTab } from './admin/AdminDashboardLayout';
import { AdminStudentsTab } from './admin/AdminStudentsTab';
import { AdminAddTutorTab } from './admin/AdminAddTutorTab';
import { AdminBookingsTab } from './admin/AdminBookingsTab';
import { AdminPaymentsTab } from './admin/AdminPaymentsTab';
import { AdminReviewsTab } from './admin/AdminReviewsTab';
import { AdminAnalyticsTab } from './admin/AdminAnalyticsTab';

interface AdminDashboardPageProps {
  onBack?: () => void;
  onNavigate?: (view: string) => void;
  initialTab?: AdminViewTab | 'verifications' | 'users';
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  onBack,
  onNavigate,
  initialTab = 'overview',
}) => {
  const normalizeInitialTab = (tab?: string): AdminViewTab => {
    if (tab === 'verifications') return 'tutors';
    if (tab === 'users') return 'students';
    return (tab as AdminViewTab) || 'overview';
  };

  const [activeTab, setActiveTab] = useState<AdminViewTab>(normalizeInitialTab(initialTab));
  const [analytics, setAnalytics] = useState<any>(null);
  const [pendingTutors, setPendingTutors] = useState<Tutor[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [settingsReason, setSettingsReason] = useState('');
  const [loading, setLoading] = useState(true);

  // Sensitive Action Modal & Notification Toast
  const [auditModalConfig, setAuditModalConfig] = useState<AuditActionModalConfig | null>(null);
  const [actionToast, setActionToast] = useState<{ message: string; auditId?: string } | null>(null);

  // User search & filter
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [previewRole, setPreviewRole] = useState<'STUDENT' | 'TUTOR' | 'ADMIN'>('STUDENT');

  // Sync initialTab when props change
  useEffect(() => {
    if (initialTab) {
      setActiveTab(normalizeInitialTab(initialTab));
    }
  }, [initialTab]);

  // Clear toast after 6s
  useEffect(() => {
    if (actionToast) {
      const timer = setTimeout(() => setActionToast(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [actionToast]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [anData, pendData, uData, aLogs, settData] = await Promise.all([
        api.getAdminAnalytics(),
        api.getPendingTutors(),
        api.getAdminUsers(),
        api.getAuditLogs(),
        api.getAdminSettings(),
      ]);
      setAnalytics(anData);
      setPendingTutors(pendData.tutors);
      setUsers(uData.users);
      setAuditLogs(aLogs.logs);
      setSettings(settData.settings);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const initiateVerifyTutor = (tutor: Tutor, action: 'APPROVE' | 'REJECT') => {
    const isApprove = action === 'APPROVE';
    setAuditModalConfig({
      isOpen: true,
      actionTitle: isApprove ? 'Approve & Verify Tutor' : 'Reject Tutor Application',
      actionType: isApprove ? 'TUTOR_VERIFIED' : 'TUTOR_REJECTED',
      severity: isApprove ? 'MEDIUM' : 'HIGH',
      entityType: 'Tutor',
      entityId: tutor.id,
      entityName: tutor.name,
      currentStateSummary: `Status: ${tutor.status}`,
      nextStateSummary: `Status: ${isApprove ? 'VERIFIED' : 'REJECTED'}`,
      warningMessage: isApprove
        ? 'Approving this tutor awards them the official Verified badge, publishes their profile to public search, and authorizes them to accept student bookings.'
        : 'Rejecting this application will notify the candidate with the mandatory reason and remove them from the active review queue.',
      isDestructive: !isApprove,
      requiresReason: !isApprove,
      defaultReason: isApprove
        ? 'Identity and degree verified against official registry. Application satisfies TutorNest criteria.'
        : '',
      onConfirm: async (reason: string, confirmedAt: string) => {
        const res = await api.verifyTutor(tutor.id, action, reason, confirmedAt);
        setActionToast({
          message: `Tutor ${tutor.name} ${isApprove ? 'approved and awarded Verified badge' : 'application rejected'}.`,
          auditId: (res as any).auditEntry?.id,
        });
        loadAdminData();
      },
      onClose: () => setAuditModalConfig(null),
    });
  };

  const initiateToggleUserStatus = (user: User) => {
    const isSuspending = user.status === 'ACTIVE';
    const newStatus = isSuspending ? 'SUSPENDED' : 'ACTIVE';
    setAuditModalConfig({
      isOpen: true,
      actionTitle: isSuspending ? 'Suspend User Account' : 'Reactivate User Account',
      actionType: 'USER_STATUS_UPDATED',
      severity: isSuspending ? 'HIGH' : 'MEDIUM',
      entityType: 'User',
      entityId: user.id,
      entityName: user.name,
      currentStateSummary: `Account: ${user.status} (${user.role})`,
      nextStateSummary: `Account: ${newStatus}`,
      warningMessage: isSuspending
        ? 'Suspending this account immediately terminates all active sessions, revokes authentication tokens, and freezes any upcoming session bookings.'
        : 'Reactivating this account restores login access, unlocks messaging, and allows platform bookings immediately.',
      isDestructive: isSuspending,
      requiresReason: isSuspending,
      defaultReason: isSuspending
        ? 'Account access suspended pending administrative review of user activity.'
        : 'User compliance issue resolved; access restored.',
      onConfirm: async (reason: string, confirmedAt: string) => {
        const res = await api.updateAdminUserStatus(user.id, newStatus, reason, confirmedAt);
        setActionToast({
          message: `Account status for ${user.name} changed to ${newStatus}.`,
          auditId: (res as any).auditEntry?.id,
        });
        loadAdminData();
      },
      onClose: () => setAuditModalConfig(null),
    });
  };

  const initiateChangeUserRole = (user: User, newRole: string) => {
    if (user.role === newRole) return;
    const isElevatingToAdmin = newRole === 'ADMIN';
    setAuditModalConfig({
      isOpen: true,
      actionTitle: `Change User Role to ${newRole}`,
      actionType: 'USER_ROLE_UPDATED',
      severity: isElevatingToAdmin ? 'CRITICAL' : 'HIGH',
      entityType: 'User',
      entityId: user.id,
      entityName: user.name,
      currentStateSummary: `Role: ${user.role}`,
      nextStateSummary: `Role: ${newRole}`,
      warningMessage: isElevatingToAdmin
        ? 'CRITICAL PRIVILEGE ELEVATION: Granting Administrator privileges conveys complete control over user data, tutor verification, platform pricing, and audit trail logs.'
        : `Modifying role from ${user.role} to ${newRole} alters permissions, portal navigation, and capability privileges.`,
      isDestructive: isElevatingToAdmin,
      requiresReason: true,
      defaultReason: `Administrative role reassignment to ${newRole}.`,
      onConfirm: async (reason: string, confirmedAt: string) => {
        const res = await api.updateAdminUserRole(user.id, newRole, reason, confirmedAt);
        setActionToast({
          message: `User role for ${user.name} updated to ${newRole}.`,
          auditId: (res as any).auditEntry?.id,
        });
        loadAdminData();
      },
      onClose: () => setAuditModalConfig(null),
    });
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setAuditModalConfig({
      isOpen: true,
      actionTitle: 'Update Platform Financial & Refund Policies',
      actionType: 'PLATFORM_SETTINGS_UPDATED',
      severity: settings.maintenanceMode ? 'CRITICAL' : 'MEDIUM',
      entityType: 'SystemSettings',
      entityId: 'global_settings',
      entityName: 'TutorNest Global Configuration',
      currentStateSummary: 'Active Fee & Refund Rules',
      nextStateSummary: `Fixed: ₹${settings.platformFeeFixed} | Refund: ${settings.cancellationFullRefundHours}h`,
      warningMessage:
        'Updating financial and escrow rules modifies checkout fee calculations, platform revenue deductions, and cancellation refund windows across all active and future bookings.',
      isDestructive: false,
      requiresReason: true,
      defaultReason: settingsReason || 'Periodic platform governance and escrow policy update.',
      onConfirm: async (reason: string, confirmedAt: string) => {
        const res = await api.updateAdminSettings({
          ...settings,
          reason,
          confirmedAt,
        });
        setActionToast({
          message: 'Platform financial and refund rules updated.',
          auditId: (res as any).auditEntry?.id,
        });
        setSettingsReason('');
        loadAdminData();
      },
      onClose: () => setAuditModalConfig(null),
    });
  };

  const initiateUpdateUserStatus = (userId: string, newStatus: string, userName: string) => {
    const isSuspend = newStatus === 'SUSPENDED';
    setAuditModalConfig({
      isOpen: true,
      actionTitle: isSuspend ? 'Suspend User Account' : 'Reactivate User Account',
      actionType: isSuspend ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
      severity: isSuspend ? 'HIGH' : 'MEDIUM',
      entityType: 'User',
      entityId: userId,
      entityName: userName,
      currentStateSummary: `Status: ${isSuspend ? 'ACTIVE' : 'SUSPENDED'}`,
      nextStateSummary: `Status: ${newStatus}`,
      warningMessage: isSuspend
        ? 'Suspending this account immediately revokes login access and pauses active student bookings.'
        : 'Reactivating this user restores their full platform access and role permissions.',
      isDestructive: isSuspend,
      requiresReason: isSuspend,
      defaultReason: isSuspend ? 'Account security review triggered by platform policy compliance.' : '',
      onConfirm: async (reason: string, confirmedAt: string) => {
        const res = await api.updateAdminUserStatus(userId, newStatus, reason, confirmedAt);
        setActionToast({
          message: `User ${userName} ${isSuspend ? 'suspended' : 'reactivated'}.`,
          auditId: (res as any).auditEntry?.id,
        });
        loadAdminData();
      },
      onClose: () => setAuditModalConfig(null),
    });
  };

  const initiateDisputeResolution = (bookingId: string) => {
    setAuditModalConfig({
      isOpen: true,
      actionTitle: 'Resolve Booking Dispute',
      actionType: 'DISPUTE_REFUNDED',
      severity: 'HIGH',
      entityType: 'Booking',
      entityId: bookingId,
      entityName: `Booking #${bookingId}`,
      currentStateSummary: 'Status: DISPUTED (Escrow on hold)',
      nextStateSummary: 'Status: CANCELLED (Full refund granted to student)',
      warningMessage: 'Resolving this dispute will disburse escrow funds back to the student account and record the incident on the tutor history.',
      isDestructive: true,
      requiresReason: true,
      defaultReason: 'Student demonstrated tutor absence via logged verification records.',
      onConfirm: async (reason: string, confirmedAt: string) => {
        const res = await api.resolveBookingDispute(bookingId, 'REFUND_STUDENT', 500, reason, confirmedAt);
        setActionToast({
          message: `Dispute on Booking #${bookingId} resolved and refunded.`,
          auditId: (res as any).auditEntry?.id,
        });
        loadAdminData();
      },
      onClose: () => setAuditModalConfig(null),
    });
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <AdminDashboardLayout
      currentTab={activeTab}
      onSelectTab={tab => setActiveTab(tab)}
      onNavigate={onNavigate || (() => {})}
      pendingCount={pendingTutors.length}
    >
      <div className="space-y-6">
        {/* Navigation Back Option */}
        <div className="flex items-center justify-between">
          <BackButton
            onClick={onBack || (() => onNavigate?.('landing'))}
            label="Back to Main Site"
          />
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-900 border border-amber-200 rounded-full text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>Restricted Super-Admin Access</span>
            </span>
          </div>
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && analytics && (
          <div className="space-y-8">
            <section className="bg-slate-950 text-white rounded-3xl p-6 shadow-lg border border-slate-800">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                    <h2 className="text-base font-extrabold">Interactive Demo Mode</h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Demo / Preview Mode — administrative UI preview only. It does not change authentication.</p>
                </div>
                <span className="text-[10px] uppercase tracking-wider font-bold text-amber-300 border border-amber-400/30 rounded-full px-2.5 py-1">
                  Admin only
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-5 mb-3">Switch role instantly:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {([
                  ['STUDENT', 'Student — Aarav'],
                  ['TUTOR', 'Tutor — Dr. Neha'],
                  ['ADMIN', 'Admin — Vikram'],
                ] as const).map(([role, label]) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setPreviewRole(role)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-bold text-left border transition-colors ${
                      previewRole === role
                        ? 'bg-blue-600 border-blue-400 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-400 mt-3">
                Previewing the {previewRole.toLowerCase()} experience. Real account permissions remain unchanged.
              </p>
            </section>
            {/* Top KPI Metrics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Total Gross Revenue
                </span>
                <span className="text-2xl font-extrabold text-slate-900">
                  ₹{analytics.metrics.totalGrossRevenue}
                </span>
                <span className="text-[11px] text-emerald-600 block mt-1">
                  ₹{analytics.metrics.totalPlatformFees} Platform Fees collected
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Total Bookings
                </span>
                <span className="text-2xl font-extrabold text-blue-600">
                  {analytics.metrics.totalBookings}
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  {analytics.metrics.completedBookings} Completed • {analytics.metrics.confirmedBookings} Upcoming
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Registered Users
                </span>
                <span className="text-2xl font-extrabold text-slate-900">
                  {analytics.metrics.totalUsers}
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  {analytics.metrics.totalStudents} Students • {analytics.metrics.totalTutors} Faculty
                </span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Refund & Cancellation Rate
                </span>
                <span className="text-2xl font-extrabold text-amber-600">
                  {analytics.metrics.cancellationRate}%
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  ₹{analytics.metrics.totalRefundAmount} total refunded
                </span>
              </div>
            </div>

            {/* Popular Subjects & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm">Most Booked Subjects</h3>
                <div className="space-y-3">
                  {analytics.popularSubjects.map((item: any) => (
                    <div key={item.name} className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">{item.name}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold">
                        {item.count} sessions
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-extrabold text-slate-900 text-sm">7-Day Transaction Trends</h3>
                <div className="space-y-2">
                  {analytics.dailyMetrics.map((dm: any) => (
                    <div key={dm.day} className="flex items-center justify-between text-xs py-1 border-b border-slate-50">
                      <span className="font-bold text-slate-700 w-12">{dm.day}</span>
                      <div className="flex-1 mx-4 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (dm.revenue / 6000) * 100)}%` }}
                        />
                      </div>
                      <span className="font-semibold text-slate-900">₹{dm.revenue}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: STUDENTS */}
        {activeTab === 'students' && (
          <AdminStudentsTab onUpdateStatus={initiateUpdateUserStatus} />
        )}

        {/* TAB 3: TUTORS (Pending Verifications & Faculty) */}
        {activeTab === 'tutors' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-blue-600" />
                  <span>Pending Tutor Verifications ({pendingTutors.length})</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review academic qualifications, university degrees, and identity verification before onboarding.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('add-tutor')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm self-start sm:self-auto"
              >
                + Onboard New Tutor
              </button>
            </div>

            {pendingTutors.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-xs text-slate-500">
                All tutor applications are vetted! No pending reviews in queue.
              </div>
            ) : (
              <div className="space-y-4">
                {pendingTutors.map(t => (
                  <div
                    key={t.id}
                    className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={t.avatar}
                          alt={t.name}
                          className="w-14 h-14 rounded-2xl object-cover border border-slate-200"
                        />
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm">{t.name}</h3>
                          <p className="text-xs text-slate-500">{t.headline}</p>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {t.email} • {t.location}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-base font-extrabold text-slate-900">₹{t.hourlyRate}/hr</span>
                        <span className="text-[10px] text-slate-400 block">{t.yearsExperience} yrs experience</span>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                      <span className="font-bold text-slate-800">Academic Background & Degree:</span>
                      <p className="text-slate-600">{t.education}</p>
                      <div className="pt-1">
                        <span className="font-bold text-slate-800">Bio: </span>
                        <span className="text-slate-600">{t.bio}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div className="flex gap-1">
                        {t.subjects.map(s => (
                          <span
                            key={s}
                            className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 rounded-md"
                          >
                            {s}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => initiateVerifyTutor(t, 'REJECT')}
                          className="px-3.5 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-xl text-xs font-semibold flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject Application</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => initiateVerifyTutor(t, 'APPROVE')}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Grant Verified Badge</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ADD TUTOR */}
        {activeTab === 'add-tutor' && (
          <AdminAddTutorTab onSuccess={loadAdminData} />
        )}

        {/* TAB 5: BOOKINGS */}
        {activeTab === 'bookings' && (
          <AdminBookingsTab onResolveDispute={initiateDisputeResolution} />
        )}

        {/* TAB 6: PAYMENTS */}
        {activeTab === 'payments' && (
          <AdminPaymentsTab />
        )}

        {/* TAB 7: REVIEWS */}
        {activeTab === 'reviews' && (
          <AdminReviewsTab />
        )}

        {/* TAB 8: ANALYTICS */}
        {activeTab === 'analytics' && (
          <AdminAnalyticsTab analytics={analytics} />
        )}

        {/* TAB 9: AUDIT LOGS */}
        {activeTab === 'audit' && <AdminAuditTab />}

        {/* TAB 10: SETTINGS */}
        {activeTab === 'settings' && settings && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 max-w-2xl space-y-6">
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Platform Financial & Refund Rules</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Modifications here adjust global escrow fees and automated dispute cancellation windows.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Fixed Platform Escrow Fee (INR ₹)
                </label>
                <input
                  type="number"
                  value={settings.platformFeeFixed}
                  onChange={e =>
                    setSettings({ ...settings, platformFeeFixed: Number(e.target.value) })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
                <span className="text-[10px] text-slate-400">
                  Default: ₹40 per session booking to cover verification & escrow guarantees.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Refund Window (Hours before session)
                </label>
                <input
                  type="number"
                  value={settings.cancellationFullRefundHours}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      cancellationFullRefundHours: Number(e.target.value),
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
                <span className="text-[10px] text-slate-400">
                  Cancellations &gt;24 hours receive 100% full refund.
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Partial Refund Window (Hours before session)
                </label>
                <input
                  type="number"
                  value={settings.cancellationPartialRefundHours}
                  onChange={e =>
                    setSettings({
                      ...settings,
                      cancellationPartialRefundHours: Number(e.target.value),
                    })
                  }
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
                <span className="text-[10px] text-slate-400">
                  Cancellations between 12 and 24 hours receive 50% partial refund.
                </span>
              </div>

              <div className="pt-1">
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Audit Rationale / Justification
                </label>
                <input
                  type="text"
                  placeholder="e.g. Quarterly platform escrow fee review and adjustment"
                  value={settingsReason}
                  onChange={e => setSettingsReason(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
                <span className="text-[10px] text-slate-400">
                  Mandatory for system governance and compliance records.
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors"
                >
                  Save Platform Configuration
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* Sensitive Action Audit Modal */}
      {auditModalConfig && <AdminAuditActionModal {...auditModalConfig} />}

      {/* Action Recorded Toast */}
      {actionToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-slate-800 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <Check className="w-4 h-4" />
          </div>
          <div className="space-y-0.5 text-xs">
            <p className="font-bold text-slate-100">{actionToast.message}</p>
            {actionToast.auditId && (
              <p className="text-[11px] text-slate-400 font-mono">
                Audit Trail Recorded • ID: {actionToast.auditId}
              </p>
            )}
          </div>
        </div>
      )}
    </AdminDashboardLayout>
  );
};
