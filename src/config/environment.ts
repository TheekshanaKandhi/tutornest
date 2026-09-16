/**
 * TutorNest — Centralized Environment & Production Domain Configuration
 * Official Frontend: https://tutornest.in
 * Official API:      https://api.tutornest.in
 */

export interface AppEnvironment {
  env: 'development' | 'production' | 'staging';
  siteUrl: string;
  apiBaseUrl: string;
  isProduction: boolean;
  isDevelopment: boolean;
}

const rawEnv = (import.meta.env.VITE_APP_ENV || import.meta.env.MODE || 'development').toLowerCase();
const isProductionEnv = rawEnv === 'production';

// Production custom domain defaults
export const PRODUCTION_SITE_URL = 'https://tutornest.in';
export const PRODUCTION_API_URL = 'https://api.tutornest.in';

/**
 * Determine the canonical base website URL
 */
export function getCanonicalSiteUrl(): string {
  if (import.meta.env.VITE_SITE_URL) {
    return import.meta.env.VITE_SITE_URL.replace(/\/$/, '');
  }
  return PRODUCTION_SITE_URL;
}

/**
 * Dynamically resolves the API base URL based on runtime environment and domain context:
 * - On the official custom domain (tutornest.in), targets https://api.tutornest.in/api
 * - In local dev / container preview without active external DNS, uses the local relative proxy /api
 * - When VITE_API_BASE_URL is explicitly set and reachable, routes requests to that endpoint
 */
export function getResolvedApiBaseUrl(): string {
  const envApi = (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // When served from the custom domain or when explicitly accessing production
    if (hostname === 'tutornest.in' || hostname === 'www.tutornest.in') {
      return `${PRODUCTION_API_URL}/api`;
    }
  }

  // If a custom API base is set and differs from the current host
  if (envApi) {
    return `${envApi}/api`;
  }

  // Fallback to relative /api for local dev server and preview containers
  return '/api';
}

export const environment: AppEnvironment = {
  env: isProductionEnv ? 'production' : 'development',
  siteUrl: getCanonicalSiteUrl(),
  apiBaseUrl: getResolvedApiBaseUrl(),
  isProduction: isProductionEnv,
  isDevelopment: !isProductionEnv,
};
