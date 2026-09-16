import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  FileText,
  ChevronLeft,
  ChevronRight,
  Clock,
  Globe,
  User,
  ArrowUpDown,
  CheckCircle2,
} from 'lucide-react';
import { AuditLog, AuditLogStats, AuditSeverity } from '../../types';
import { api } from '../../services/api';
import { AdminAuditDetailModal } from './AdminAuditDetailModal';

export const AdminAuditTab: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await api.getAuditLogs({
        search,
        severity: severityFilter,
        action: actionFilter,
        entity: entityFilter,
        page,
        limit: 15,
      });

      setLogs(res.logs || []);
      setStats(res.stats || null);
      if (res.pagination) {
        setTotalPages(res.pagination.totalPages || 1);
        setTotalCount(res.pagination.total || 0);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [search, severityFilter, actionFilter, entityFilter]);

  useEffect(() => {
    fetchLogs();
  }, [search, severityFilter, actionFilter, entityFilter, page]);

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await fetch(`/api/admin/audit-logs/export?format=${format}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('tutornest_token') || 'usr_admin_demo'}`,
        },
      });

      if (!response.ok) throw new Error('Export failed');

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tutornest-security-audit-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tutornest-security-audit-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      // Re-fetch to display the newly recorded AUDIT_LOGS_EXPORTED event!
      fetchLogs(true);
    } catch (err) {
      console.error('Export error:', err);
    }
  };

  const getSeverityBadge = (sev?: AuditSeverity) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-500/15 text-red-700 border-red-200';
      case 'HIGH':
        return 'bg-rose-500/15 text-rose-700 border-rose-200';
      case 'MEDIUM':
        return 'bg-amber-500/15 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-500/10 text-slate-700 border-slate-200';
    }
  };

  const getActionTagColor = (action: string) => {
    if (action.includes('VERIFIED') || action.includes('RESTORE')) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('REJECT') || action.includes('SUSPEND') || action.includes('DEACTIVATED')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (action.includes('SETTINGS') || action.includes('DISPUTE')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (action.includes('ROLE')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="space-y-6">
      {/* Top Stat Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Audit Events</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats?.total || logs.length}</div>
          <p className="text-[11px] text-slate-400">Permanently recorded trail</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Critical & High Events</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600">
            {(stats?.criticalCount || 0) + (stats?.highCount || 0)}
          </div>
          <p className="text-[11px] text-slate-400">Suspensions, rejections & roles</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Actions Today</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">{stats?.todayCount ?? 0}</div>
          <p className="text-[11px] text-slate-400">Last 24 hours activity</p>
        </div>

        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Admin Accountability</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-purple-700">{stats?.topActors?.length || 1}</div>
          <p className="text-[11px] text-slate-400">Unique administrator actors</p>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header & Tooling Bar */}
        <div className="p-6 border-b border-slate-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">System Security Audit Trail</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                  {totalCount} Entries
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cryptographically tracked administrative interventions, credential verifications, and permission updates.
              </p>
            </div>

            {/* Export & Refresh Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchLogs(true)}
                disabled={refreshing}
                title="Refresh audit trail"
                className="p-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
              </button>

              <div className="flex items-center rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <button
                  type="button"
                  onClick={() => handleExport('csv')}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 border-r border-slate-200 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>CSV Export</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport('json')}
                  className="px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" />
                  <span>JSON</span>
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by admin name, target entity, action, IP, or reason..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
              />
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Severity:</span>
              <select
                value={severityFilter}
                onChange={e => setSeverityFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>

            {/* Entity Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Entity:</span>
              <select
                value={entityFilter}
                onChange={e => setEntityFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
              >
                <option value="ALL">All Entities</option>
                <option value="Tutor">Tutors</option>
                <option value="User">Users</option>
                <option value="SystemSettings">Settings</option>
                <option value="Booking">Bookings</option>
                <option value="AuditTrail">Audit Exports</option>
              </select>
            </div>

            {/* Action Filter */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Action:</span>
              <select
                value={actionFilter}
                onChange={e => setActionFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none"
              >
                <option value="ALL">All Actions</option>
                <option value="TUTOR_VERIFIED">Tutor Verified</option>
                <option value="TUTOR_REJECTED">Tutor Rejected</option>
                <option value="USER_STATUS_UPDATED">User Status Updated</option>
                <option value="USER_ROLE_UPDATED">User Role Updated</option>
                <option value="PLATFORM_SETTINGS_UPDATED">Platform Settings Updated</option>
                <option value="BOOKING_DISPUTE_REFUND">Dispute Refund</option>
                <option value="AUDIT_LOGS_EXPORTED">Logs Exported</option>
              </select>
            </div>
          </div>
        </div>

        {/* Audit Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Severity & Action</th>
                <th className="px-6 py-3">Target Entity</th>
                <th className="px-6 py-3">Administrator Actor</th>
                <th className="px-6 py-3">Stated Rationale / Reason</th>
                <th className="px-6 py-3">Forensics & Time</th>
                <th className="px-6 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2 text-xs">
                      <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Loading immutable audit records...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-600">No matching audit logs found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Adjust your search terms or filter criteria.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map(log => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    {/* Severity & Action */}
                    <td className="px-6 py-3.5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border tracking-wider ${getSeverityBadge(
                              log.severity
                            )}`}
                          >
                            {log.severity || 'LOW'}
                          </span>
                        </div>
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border font-mono ${getActionTagColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </div>
                    </td>

                    {/* Target Entity */}
                    <td className="px-6 py-3.5">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">
                          {log.entityName || log.entity}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {log.entity} #{log.entityId}
                        </div>
                      </div>
                    </td>

                    {/* Administrator Actor */}
                    <td className="px-6 py-3.5">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <span>{log.actorName}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {log.actorRole} ({log.actorId})
                        </div>
                      </div>
                    </td>

                    {/* Stated Reason */}
                    <td className="px-6 py-3.5 max-w-xs">
                      <p className="text-slate-600 truncate text-[11px] font-medium" title={log.reason}>
                        {log.reason || '—'}
                      </p>
                    </td>

                    {/* Forensics & Time */}
                    <td className="px-6 py-3.5">
                      <div className="space-y-0.5 text-[11px]">
                        <div className="text-slate-700 font-medium">
                          {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>Confirmed: {new Date(log.confirmationTimestamp || log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <Globe className="w-3 h-3 text-slate-300" />
                          <span>IP: {log.ipAddress}</span>
                        </div>
                      </div>
                    </td>

                    {/* Details Action */}
                    <td className="px-6 py-3.5 text-right">
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-white transition-colors"
                        title="Inspect full audit diff & metadata"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 text-xs">
            <span className="text-slate-500">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> ({totalCount} total events)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent font-semibold flex items-center gap-1 transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent font-semibold flex items-center gap-1 transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Detail Modal */}
      <AdminAuditDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
};
