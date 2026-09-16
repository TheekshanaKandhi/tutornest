import React from 'react';
import {
  X,
  Shield,
  Clock,
  Globe,
  Terminal,
  User,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { AuditLog } from '../../types';

interface AdminAuditDetailModalProps {
  log: AuditLog | null;
  onClose: () => void;
}

export const AdminAuditDetailModal: React.FC<AdminAuditDetailModalProps> = ({
  log,
  onClose,
}) => {
  if (!log) return null;

  const getSeverityStyle = (sev?: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'HIGH':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'MEDIUM':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 font-mono">{log.action}</h3>
                <span
                  className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full border ${getSeverityStyle(
                    log.severity
                  )}`}
                >
                  {log.severity || 'LOW'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Log ID: <span className="font-mono">{log.id}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs">
          {/* Rationale Banner */}
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 block">
              Administrative Justification / Reason
            </span>
            <p className="text-sm font-medium text-slate-800 leading-relaxed">
              "{log.reason || 'Standard administrative operation'}"
            </p>
          </div>

          {/* Actor & Forensics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Actor Card */}
            <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2.5">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <User className="w-4 h-4 text-slate-500" />
                <span>Admin Actor</span>
              </div>
              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Name:</span>
                  <span className="font-semibold text-slate-800">{log.actorName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Role:</span>
                  <span className="font-mono text-slate-800">{log.actorRole}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ID:</span>
                  <span className="font-mono text-[11px] text-slate-500">{log.actorId}</span>
                </div>
              </div>
            </div>

            {/* Forensics Card */}
            <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2.5">
              <div className="flex items-center gap-2 text-slate-800 font-bold">
                <Globe className="w-4 h-4 text-slate-500" />
                <span>Forensics & Confirmation</span>
              </div>
              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">IP Address:</span>
                  <span className="font-mono font-bold text-slate-800">{log.ipAddress}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Confirmed At:</span>
                  <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100 text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {new Date(log.confirmationTimestamp || log.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Logged At:</span>
                  <span className="text-slate-700">{new Date(log.timestamp).toLocaleString()}</span>
                </div>
                {log.requestId && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Request ID:</span>
                    <span className="font-mono text-[10px] text-slate-500">{log.requestId}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Target Entity */}
          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">Target Entity</span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                {log.entity}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 text-slate-600">
              <div>
                <span className="text-slate-400">Entity ID: </span>
                <span className="font-mono font-semibold text-slate-800">{log.entityId}</span>
              </div>
              {log.entityName && (
                <div>
                  <span className="text-slate-400">Target Name: </span>
                  <span className="font-bold text-slate-900">{log.entityName}</span>
                </div>
              )}
            </div>
          </div>

          {/* State Comparison (Diff) if available */}
          {(log.previousState || log.newState) && (
            <div className="space-y-2">
              <span className="font-bold text-slate-800 block">State Comparison (Before vs After)</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100 font-mono text-[11px] overflow-x-auto">
                  <span className="text-[10px] uppercase font-bold text-rose-600 block mb-1">
                    Previous State
                  </span>
                  <pre className="text-rose-900 whitespace-pre-wrap">
                    {typeof log.previousState === 'object'
                      ? JSON.stringify(log.previousState, null, 2)
                      : String(log.previousState || 'None')}
                  </pre>
                </div>
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 font-mono text-[11px] overflow-x-auto">
                  <span className="text-[10px] uppercase font-bold text-emerald-600 block mb-1">
                    New State
                  </span>
                  <pre className="text-emerald-900 whitespace-pre-wrap">
                    {typeof log.newState === 'object'
                      ? JSON.stringify(log.newState, null, 2)
                      : String(log.newState || 'None')}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* Raw Metadata Details */}
          {log.metadata && Object.keys(log.metadata).length > 0 && (
            <div className="space-y-2">
              <span className="font-bold text-slate-800 block">Operation Metadata</span>
              <div className="p-3.5 bg-slate-900 text-slate-200 rounded-2xl font-mono text-[11px] overflow-x-auto">
                <pre>{JSON.stringify(log.metadata, null, 2)}</pre>
              </div>
            </div>
          )}

          {/* User-Agent */}
          {log.userAgent && (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-[11px] text-slate-500">
              <span className="font-semibold text-slate-700">Client User-Agent: </span>
              <span className="font-mono text-[10px] break-all">{log.userAgent}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-end bg-slate-50/30">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
