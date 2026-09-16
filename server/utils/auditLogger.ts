import { Request } from 'express';
import { store } from '../db/store.js';
import { AuditLog, AuditSeverity, UserRole } from '../db/types.js';
import { getAuthUser } from '../routes/auth.js';

export const AUDIT_ACTIONS = {
  TUTOR_VERIFIED: 'TUTOR_VERIFIED',
  TUTOR_REJECTED: 'TUTOR_REJECTED',
  TUTOR_STATUS_CHANGED: 'TUTOR_STATUS_CHANGED',
  USER_STATUS_UPDATED: 'USER_STATUS_UPDATED',
  USER_ROLE_UPDATED: 'USER_ROLE_UPDATED',
  PLATFORM_SETTINGS_UPDATED: 'PLATFORM_SETTINGS_UPDATED',
  BOOKING_DISPUTE_REFUND: 'BOOKING_DISPUTE_REFUND',
  BOOKING_MANUAL_CANCEL: 'BOOKING_MANUAL_CANCEL',
  REVIEW_MODERATED: 'REVIEW_MODERATED',
  AUDIT_LOGS_EXPORTED: 'AUDIT_LOGS_EXPORTED',
} as const;

export type AuditActionType = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS] | string;

export interface RecordAuditParams {
  action: AuditActionType;
  entity: 'Tutor' | 'User' | 'SystemSettings' | 'Booking' | 'Review' | 'AuditTrail' | string;
  entityId: string;
  entityName?: string;
  reason?: string;
  severity?: AuditSeverity;
  confirmationTimestamp?: string;
  metadata?: Record<string, any>;
  previousState?: Record<string, any> | string;
  newState?: Record<string, any> | string;
}

/**
 * Extract client IP address safely considering reverse proxies and headers.
 */
export function extractClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    const first = forwarded.split(',')[0].trim();
    if (first) return first;
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0].trim();
  }
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp.trim()) {
    return realIp.trim();
  }
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

/**
 * Extract forensic client metadata from Express request
 */
export function extractClientInfo(req: Request) {
  return {
    ipAddress: extractClientIp(req),
    userAgent: (req.headers['user-agent'] as string) || 'Internal System / CLI',
    requestId: (req.headers['x-request-id'] as string) || `req_${Date.now()}`,
  };
}

/**
 * Core utility to record any sensitive administrative action into the audit trail.
 * Enforces structured schema, client forensics (IP, user-agent, request-id),
 * severity levels, and console diagnostics.
 */
export function recordAuditLog(req: Request, params: RecordAuditParams): AuditLog {
  const admin = getAuthUser(req);
  const clientInfo = extractClientInfo(req);

  const actorId = admin ? admin.id : 'usr_admin_system';
  const actorName = admin ? admin.name : 'System Administrator';
  const actorRole: UserRole = admin ? admin.role : 'ADMIN';

  // Determine appropriate default severity if not provided
  let severity: AuditSeverity = params.severity || 'LOW';
  if (!params.severity) {
    if (
      params.action === AUDIT_ACTIONS.TUTOR_REJECTED ||
      params.action === AUDIT_ACTIONS.USER_STATUS_UPDATED ||
      params.action === AUDIT_ACTIONS.BOOKING_DISPUTE_REFUND
    ) {
      severity = 'HIGH';
    } else if (
      params.action === AUDIT_ACTIONS.USER_ROLE_UPDATED ||
      (params.action === AUDIT_ACTIONS.USER_STATUS_UPDATED && params.newState === 'DEACTIVATED')
    ) {
      severity = 'CRITICAL';
    } else if (
      params.action === AUDIT_ACTIONS.TUTOR_VERIFIED ||
      params.action === AUDIT_ACTIONS.PLATFORM_SETTINGS_UPDATED ||
      params.action === AUDIT_ACTIONS.REVIEW_MODERATED
    ) {
      severity = 'MEDIUM';
    }
  }

  const confirmationTimestamp =
    params.confirmationTimestamp ||
    (req.body && (req.body.confirmedAt || req.body.confirmationTimestamp)) ||
    new Date().toISOString();

  const logEntry: AuditLog = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    actorId,
    actorName,
    actorRole,
    action: params.action,
    entity: params.entity,
    entityId: params.entityId,
    entityName: params.entityName,
    reason: params.reason || 'Administrative action performed',
    severity,
    metadata: params.metadata || {},
    previousState: params.previousState,
    newState: params.newState,
    ipAddress: clientInfo.ipAddress,
    userAgent: clientInfo.userAgent,
    requestId: clientInfo.requestId,
    confirmationTimestamp,
    timestamp: new Date().toISOString(),
  };

  // Prepend to audit log collection (most recent first)
  store.auditLogs.unshift(logEntry);

  // Security audit stdout logging
  console.log(
    `[SECURITY AUDIT] [${logEntry.severity}] Action=${logEntry.action} Entity=${logEntry.entity}#${logEntry.entityId} Actor=${logEntry.actorName} (${logEntry.actorId}) IP=${logEntry.ipAddress} Reason="${logEntry.reason}"`
  );

  return logEntry;
}

/**
 * Utility: Record tutor verification decisions (Approve / Reject)
 */
export function recordTutorVerificationAudit(
  req: Request,
  params: {
    tutorId: string;
    tutorName: string;
    action: 'APPROVE' | 'REJECT';
    reason?: string;
    oldStatus: string;
  }
): AuditLog {
  const isApproved = params.action === 'APPROVE';
  return recordAuditLog(req, {
    action: isApproved ? AUDIT_ACTIONS.TUTOR_VERIFIED : AUDIT_ACTIONS.TUTOR_REJECTED,
    entity: 'Tutor',
    entityId: params.tutorId,
    entityName: params.tutorName,
    reason: params.reason || (isApproved ? 'Credentials & documents verified by administration' : 'Application declined'),
    severity: isApproved ? 'MEDIUM' : 'HIGH',
    previousState: { status: params.oldStatus },
    newState: { status: isApproved ? 'VERIFIED' : 'REJECTED' },
    metadata: {
      action: params.action,
      verifiedBadgeAwarded: isApproved,
      rejectionReason: !isApproved ? params.reason : undefined,
    },
  });
}

/**
 * Utility: Record user account status changes (Activate / Suspend / Deactivate)
 */
export function recordUserStatusAudit(
  req: Request,
  params: {
    userId: string;
    userName: string;
    userEmail: string;
    oldStatus: string;
    newStatus: string;
    reason?: string;
  }
): AuditLog {
  const isSuspension = params.newStatus === 'SUSPENDED' || params.newStatus === 'DEACTIVATED';
  return recordAuditLog(req, {
    action: AUDIT_ACTIONS.USER_STATUS_UPDATED,
    entity: 'User',
    entityId: params.userId,
    entityName: params.userName,
    reason: params.reason || `Account status changed from ${params.oldStatus} to ${params.newStatus}`,
    severity: params.newStatus === 'DEACTIVATED' ? 'CRITICAL' : isSuspension ? 'HIGH' : 'MEDIUM',
    previousState: { status: params.oldStatus, email: params.userEmail },
    newState: { status: params.newStatus, email: params.userEmail },
    metadata: {
      userEmail: params.userEmail,
      statusTransition: `${params.oldStatus} -> ${params.newStatus}`,
      effectiveImmediately: true,
    },
  });
}

/**
 * Utility: Record user role changes (e.g. promoting to ADMIN or TUTOR)
 */
export function recordUserRoleAudit(
  req: Request,
  params: {
    userId: string;
    userName: string;
    oldRole: string;
    newRole: string;
    reason?: string;
  }
): AuditLog {
  return recordAuditLog(req, {
    action: AUDIT_ACTIONS.USER_ROLE_UPDATED,
    entity: 'User',
    entityId: params.userId,
    entityName: params.userName,
    reason: params.reason || `User role modified from ${params.oldRole} to ${params.newRole}`,
    severity: 'CRITICAL',
    previousState: { role: params.oldRole },
    newState: { role: params.newRole },
    metadata: {
      roleElevation: params.newRole === 'ADMIN',
    },
  });
}

/**
 * Utility: Record system-wide configuration / platform settings updates
 */
export function recordSettingsUpdateAudit(
  req: Request,
  params: {
    previousSettings: Record<string, any>;
    newSettings: Record<string, any>;
    reason?: string;
  }
): AuditLog {
  const changedKeys = Object.keys(params.newSettings).filter(
    k => params.previousSettings[k] !== params.newSettings[k]
  );

  return recordAuditLog(req, {
    action: AUDIT_ACTIONS.PLATFORM_SETTINGS_UPDATED,
    entity: 'SystemSettings',
    entityId: 'global_settings',
    entityName: 'TutorNest Platform Global Config',
    reason: params.reason || 'Platform policies and fee schedules updated',
    severity: params.newSettings.maintenanceMode ? 'CRITICAL' : 'MEDIUM',
    previousState: params.previousSettings,
    newState: params.newSettings,
    metadata: {
      changedKeys,
      maintenanceModeToggled: changedKeys.includes('maintenanceMode'),
    },
  });
}

/**
 * Utility: Record booking dispute resolution and admin-mandated refunds
 */
export function recordBookingDisputeAudit(
  req: Request,
  params: {
    bookingId: string;
    bookingReference: string;
    studentName: string;
    tutorName: string;
    refundAmount: number;
    action: string;
    reason: string;
  }
): AuditLog {
  return recordAuditLog(req, {
    action: AUDIT_ACTIONS.BOOKING_DISPUTE_REFUND,
    entity: 'Booking',
    entityId: params.bookingId,
    entityName: `Session #${params.bookingReference} (${params.studentName} with ${params.tutorName})`,
    reason: params.reason,
    severity: 'HIGH',
    metadata: {
      bookingReference: params.bookingReference,
      refundAmount: params.refundAmount,
      action: params.action,
      studentName: params.studentName,
      tutorName: params.tutorName,
    },
  });
}

/**
 * Utility: Record review moderation (e.g. deletion of inappropriate content)
 */
export function recordReviewModerationAudit(
  req: Request,
  params: {
    reviewId: string;
    tutorName: string;
    studentName: string;
    action: 'DELETED' | 'FLAGGED';
    reason: string;
  }
): AuditLog {
  return recordAuditLog(req, {
    action: AUDIT_ACTIONS.REVIEW_MODERATED,
    entity: 'Review',
    entityId: params.reviewId,
    entityName: `Review by ${params.studentName} for ${params.tutorName}`,
    reason: params.reason,
    severity: 'MEDIUM',
    metadata: {
      action: params.action,
    },
  });
}

/**
 * Utility: Record audit log export events
 */
export function recordExportAudit(
  req: Request,
  params: {
    format: 'json' | 'csv';
    recordCount: number;
    filterSummary?: string;
  }
): AuditLog {
  return recordAuditLog(req, {
    action: AUDIT_ACTIONS.AUDIT_LOGS_EXPORTED,
    entity: 'AuditTrail',
    entityId: `export_${Date.now()}`,
    entityName: `Security Audit Export (${params.format.toUpperCase()})`,
    reason: `Administrative export of ${params.recordCount} audit entries`,
    severity: 'LOW',
    metadata: {
      format: params.format,
      exportedRecordsCount: params.recordCount,
      filter: params.filterSummary,
    },
  });
}

/**
 * Query and filter audit logs with pagination and summary KPIs
 */
export function queryAuditLogs(params: {
  search?: string;
  action?: string;
  severity?: string;
  entity?: string;
  page?: number;
  limit?: number;
}) {
  const { search = '', action = 'ALL', severity = 'ALL', entity = 'ALL', page = 1, limit = 20 } = params;

  let filtered = [...store.auditLogs];

  if (search.trim()) {
    const q = search.toLowerCase().trim();
    filtered = filtered.filter(
      l =>
        l.action.toLowerCase().includes(q) ||
        l.actorName.toLowerCase().includes(q) ||
        (l.entityName && l.entityName.toLowerCase().includes(q)) ||
        l.entityId.toLowerCase().includes(q) ||
        l.ipAddress.toLowerCase().includes(q) ||
        (l.reason && l.reason.toLowerCase().includes(q))
    );
  }

  if (action && action !== 'ALL') {
    filtered = filtered.filter(l => l.action === action);
  }

  if (severity && severity !== 'ALL') {
    filtered = filtered.filter(l => (l.severity || 'LOW') === severity);
  }

  if (entity && entity !== 'ALL') {
    filtered = filtered.filter(l => l.entity === entity);
  }

  // Sort newest first
  filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Aggregate stats across ALL logs for dashboard indicators
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  const allLogs = store.auditLogs;
  const criticalCount = allLogs.filter(l => l.severity === 'CRITICAL').length;
  const highCount = allLogs.filter(l => l.severity === 'HIGH').length;
  const todayCount = allLogs.filter(l => new Date(l.timestamp).getTime() >= startOfToday).length;

  const actorCounts: Record<string, number> = {};
  allLogs.forEach(l => {
    actorCounts[l.actorName] = (actorCounts[l.actorName] || 0) + 1;
  });
  const topActors = Object.entries(actorCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  // Pagination
  const total = filtered.length;
  const startIndex = (page - 1) * limit;
  const paginatedLogs = filtered.slice(startIndex, startIndex + limit);

  return {
    logs: paginatedLogs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    stats: {
      total: allLogs.length,
      filteredTotal: total,
      criticalCount,
      highCount,
      todayCount,
      topActors,
    },
  };
}

/**
 * Format audit logs as CSV for compliance exports
 */
export function formatAuditLogsAsCsv(logs: AuditLog[]): string {
  const headers = ['ID', 'Timestamp', 'Confirmation Timestamp', 'Severity', 'Action', 'Entity', 'Entity ID', 'Entity Name', 'Actor Name', 'Actor Role', 'IP Address', 'Reason'];
  const rows = logs.map(l => [
    l.id,
    l.timestamp,
    l.confirmationTimestamp || l.timestamp,
    l.severity || 'LOW',
    l.action,
    l.entity,
    l.entityId,
    `"${(l.entityName || '').replace(/"/g, '""')}"`,
    `"${l.actorName.replace(/"/g, '""')}"`,
    l.actorRole,
    l.ipAddress,
    `"${(l.reason || '').replace(/"/g, '""')}"`,
  ]);

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
}
