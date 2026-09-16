import { Request, Response, NextFunction } from 'express';
import { store } from '../db/store.js';
import { User } from '../db/types.js';

export function getAuthUser(req: Request): User | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;
  return store.getUserForToken(token);
}

/**
 * Enforces that a valid authenticated session exists.
 * Returns 401 Unauthorized if missing or invalid.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({
      success: false,
      status: 401,
      error: 'Unauthorized',
      message: 'Authentication token is missing, invalid, or expired. Please log in.',
      errorCode: 'UNAUTHENTICATED',
      timestamp: new Date().toISOString(),
      path: req.originalUrl || req.path,
    });
  }
  if (user.status !== 'ACTIVE') {
    return res.status(403).json({
      success: false,
      status: 403,
      error: 'Forbidden',
      message: 'Account is not active. Access restricted.',
      errorCode: 'ACCOUNT_SUSPENDED',
      timestamp: new Date().toISOString(),
      path: req.originalUrl || req.path,
    });
  }
  (req as any).user = user;
  next();
}

/**
 * Enforces that the authenticated user possesses one of the specified roles.
 * Returns 401 if unauthenticated, and 403 Forbidden if role does not match.
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = getAuthUser(req);
    if (!user) {
      return res.status(401).json({
        success: false,
        status: 401,
        error: 'Unauthorized',
        message: 'Authentication required to access this resource. Please log in.',
        errorCode: 'UNAUTHENTICATED',
        timestamp: new Date().toISOString(),
        path: req.originalUrl || req.path,
      });
    }

    if (user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        status: 403,
        error: 'Forbidden',
        message: 'Account is not active. Access restricted.',
        errorCode: 'ACCOUNT_SUSPENDED',
        timestamp: new Date().toISOString(),
        path: req.originalUrl || req.path,
      });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        status: 403,
        error: 'Forbidden',
        message: `Access denied. Role '${user.role}' is not authorized to access this resource. Required clearance: ${allowedRoles.join(' or ')}.`,
        errorCode: 'FORBIDDEN_ROLE',
        userRole: user.role,
        requiredRoles: allowedRoles,
        timestamp: new Date().toISOString(),
        path: req.originalUrl || req.path,
      });
    }

    (req as any).user = user;
    next();
  };
}
