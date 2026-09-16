import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  X,
  CheckCircle2,
  Lock,
  ArrowRight,
  Clock,
  AlertOctagon,
  CheckSquare,
  Square,
} from 'lucide-react';
import { AuditSeverity } from '../../types';

export interface AuditActionModalConfig {
  isOpen: boolean;
  actionTitle: string;
  actionType: string;
  severity: AuditSeverity;
  entityType: string;
  entityId: string;
  entityName: string;
  currentStateSummary: string;
  nextStateSummary: string;
  warningMessage?: string;
  isDestructive?: boolean;
  requiresReason?: boolean;
  defaultReason?: string;
  onConfirm: (reason: string, confirmedAt: string) => Promise<void>;
  onClose: () => void;
}

export const AdminAuditActionModal: React.FC<AuditActionModalConfig> = ({
  isOpen,
  actionTitle,
  actionType,
  severity,
  entityType,
  entityId,
  entityName,
  currentStateSummary,
  nextStateSummary,
  warningMessage,
  isDestructive = false,
  requiresReason = true,
  defaultReason = '',
  onConfirm,
  onClose,
}) => {
  const [reason, setReason] = useState(defaultReason);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAcknowledgedWarning, setHasAcknowledgedWarning] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [confirmationRecordedTime, setConfirmationRecordedTime] = useState<string | null>(null);

  if (!isOpen) return null;

  // Default warning message based on action context if not explicitly provided
  const resolvedWarning =
    warningMessage ||
    (isDestructive
      ? `CRITICAL WARNING: This administrative intervention alters live account access or application state. The affected user/entity will immediately experience platform restrictions.`
      : `SECURITY NOTICE: This administrative change will be applied immediately across the TutorNest production network and cannot be silently undone.`);

  const handleIntentionalConfirm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasAcknowledgedWarning) {
      setValidationError('You must acknowledge the warning message before confirming.');
      return;
    }

    if (requiresReason && !reason.trim()) {
      setValidationError('An administrative reason is mandatory to record this sensitive action.');
      return;
    }

    // Capture the exact moment of the intentional confirm click
    const confirmedAt = new Date().toISOString();
    setConfirmationRecordedTime(confirmedAt);

    try {
      setIsSubmitting(true);
      setValidationError('');
      await onConfirm(reason.trim(), confirmedAt);
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to complete action');
      setConfirmationRecordedTime(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSeverityBadge = () => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-500/15 text-red-700 border-red-300';
      case 'HIGH':
        return 'bg-rose-500/15 text-rose-700 border-rose-300';
      case 'MEDIUM':
        return 'bg-amber-500/15 text-amber-700 border-amber-300';
      default:
        return 'bg-slate-500/15 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                isDestructive
                  ? 'bg-rose-100 text-rose-600'
                  : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              {isDestructive ? (
                <AlertOctagon className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">{actionTitle}</h3>
                <span
                  className={`text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full border ${getSeverityBadge()}`}
                >
                  {severity}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {entityType}: <span className="font-semibold text-slate-800">{entityName}</span> (#{entityId})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleIntentionalConfirm} className="p-6 space-y-4 overflow-y-auto">
          {/* Prominent Visual Warning Banner */}
          <div
            className={`p-4 rounded-2xl border flex items-start gap-3 text-xs leading-relaxed ${
              isDestructive
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl shrink-0 ${
                isDestructive ? 'bg-rose-200/70 text-rose-800' : 'bg-amber-200/70 text-amber-800'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <span className="font-extrabold uppercase text-[11px] tracking-wide block">
                {isDestructive ? 'Critical Security & Impact Warning' : 'Administrative Warning'}
              </span>
              <p className="font-medium text-slate-800">{resolvedWarning}</p>
            </div>
          </div>

          {/* State Transition Diff Box */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
              State Transition Review
            </span>
            <div className="flex items-center justify-between gap-3 font-semibold">
              <div className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-slate-700 max-w-[45%] truncate">
                {currentStateSummary}
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              <div
                className={`px-3 py-1.5 rounded-xl border max-w-[45%] truncate font-bold ${
                  isDestructive
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}
              >
                {nextStateSummary}
              </div>
            </div>
          </div>

          {/* Audit Trail Mandate Notice */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>
              Confirmation timestamp will be cryptographically captured and bound to this audit record.
            </span>
          </div>

          {/* Mandatory Reason Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800">
              Administrative Rationale / Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required={requiresReason}
              value={reason}
              onChange={e => {
                setReason(e.target.value);
                if (validationError) setValidationError('');
              }}
              placeholder="Provide a detailed, professional justification for this intervention..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 resize-none text-slate-800"
            />
          </div>

          {/* Intentional Confirmation Acknowledgment Checkbox */}
          <div
            onClick={() => {
              setHasAcknowledgedWarning(!hasAcknowledgedWarning);
              if (validationError) setValidationError('');
            }}
            className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start gap-2.5 text-xs select-none ${
              hasAcknowledgedWarning
                ? 'bg-blue-50/70 border-blue-200 text-blue-900 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100/60'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {hasAcknowledgedWarning ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <div className="leading-snug">
              <strong className="block font-bold">Intentional Confirmation:</strong>
              I have read the warning message above and intentionally authorize this administrative action on{' '}
              <span className="font-mono text-[11px]">{entityName}</span>.
            </div>
          </div>

          {validationError && (
            <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold p-2 bg-rose-50 rounded-xl border border-rose-100">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100">
            <span className="text-[10px] text-slate-400">
              {hasAcknowledgedWarning ? '✓ Ready to confirm' : 'Acknowledge warning to enable'}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || !hasAcknowledgedWarning}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-2 transition-all ${
                  !hasAcknowledgedWarning
                    ? 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'
                    : isDestructive
                    ? 'bg-rose-600 hover:bg-rose-700 active:scale-[0.98]'
                    : 'bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]'
                }`}
              >
                {isSubmitting ? (
                  <span>Recording Confirmation...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Administrative Action</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
