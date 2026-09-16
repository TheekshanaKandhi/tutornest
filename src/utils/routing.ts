/**
 * TutorNest — SEO-Friendly Production Routing & Metadata Synchronization
 * Official Production Domain: https://tutornest.in
 */

import { PRODUCTION_SITE_URL } from '../config/environment';

export interface RouteResolution {
  view: string;
  params: Record<string, any>;
  isNotFound?: boolean;
}

/**
 * Resolves application view and parameters from current browser pathname and search params
 */
export function resolveRouteFromPath(pathname: string, search: string = ''): RouteResolution {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const urlParams = new URLSearchParams(search);

  // Exact Root / Home
  if (cleanPath === '/' || cleanPath === '/home' || cleanPath === '/index.html') {
    return { view: 'landing', params: {} };
  }

  // Find Tutors directory
  if (cleanPath === '/tutors') {
    const subject = urlParams.get('subject') || '';
    const mode = urlParams.get('mode') || '';
    return { view: 'tutors', params: { subject, mode } };
  }

  // Tutor Profile: /tutor/:id or /tutors/:id
  const tutorMatch = cleanPath.match(/^\/(?:tutors?)\/([a-zA-Z0-9_-]+)$/);
  if (tutorMatch) {
    return { view: 'tutor-profile', params: { tutorId: tutorMatch[1] } };
  }

  // Auth & Access Control Views
  if (cleanPath === '/login' || cleanPath === '/signin') {
    const redirect = urlParams.get('redirect') || '';
    return { view: 'login', params: { redirect } };
  }
  if (cleanPath === '/register' || cleanPath === '/signup') {
    const role = urlParams.get('role') || 'STUDENT';
    return { view: 'register', params: { role } };
  }
  if (cleanPath === '/forbidden' || cleanPath === '/403') {
    const required = urlParams.get('required') || 'ADMIN';
    const attempted = urlParams.get('attempted') || '';
    return { view: 'forbidden', params: { requiredRole: required, attemptedPath: attempted } };
  }

  // Student Views
  if (cleanPath === '/student' || cleanPath === '/student/dashboard') {
    return { view: 'student-dashboard', params: {} };
  }
  if (cleanPath === '/student/profile') {
    return { view: 'student-profile', params: {} };
  }
  if (cleanPath === '/student/reviews') {
    return { view: 'student-reviews', params: {} };
  }
  if (cleanPath === '/bookings' || cleanPath === '/student/bookings') {
    return { view: 'bookings', params: {} };
  }
  if (cleanPath === '/learning' || cleanPath === '/student/learning') {
    return { view: 'learning', params: {} };
  }
  if (cleanPath === '/messages') {
    return { view: 'messages', params: {} };
  }

  // Tutor Role Views
  if (cleanPath === '/tutor/dashboard' || cleanPath === '/tutor') {
    return { view: 'tutor-dashboard', params: {} };
  }
  if (cleanPath === '/tutor/students') {
    return { view: 'tutor-students', params: {} };
  }
  if (cleanPath === '/tutor/availability') {
    return { view: 'tutor-availability', params: {} };
  }
  if (cleanPath === '/tutor/earnings') {
    return { view: 'tutor-earnings', params: {} };
  }
  if (cleanPath === '/tutor/bookings') {
    return { view: 'tutor-bookings', params: {} };
  }
  if (cleanPath === '/tutor/reviews') {
    return { view: 'tutor-reviews', params: {} };
  }
  if (cleanPath === '/tutor/profile') {
    return { view: 'tutor-profile-edit', params: {} };
  }

  // Admin Views
  if (cleanPath === '/admin' || cleanPath === '/admin/dashboard') {
    return { view: 'admin-dashboard', params: {} };
  }
  if (cleanPath === '/admin/students') {
    return { view: 'admin-students', params: {} };
  }
  if (cleanPath === '/admin/tutors') {
    return { view: 'admin-tutors', params: {} };
  }
  if (cleanPath === '/admin/add-tutor') {
    return { view: 'admin-add-tutor', params: {} };
  }
  if (cleanPath === '/admin/bookings') {
    return { view: 'admin-bookings', params: {} };
  }
  if (cleanPath === '/admin/payments') {
    return { view: 'admin-payments', params: {} };
  }
  if (cleanPath === '/admin/reviews') {
    return { view: 'admin-reviews', params: {} };
  }
  if (cleanPath === '/admin/analytics') {
    return { view: 'admin-analytics', params: {} };
  }
  if (cleanPath === '/admin/audit') {
    return { view: 'admin-audit', params: {} };
  }
  if (cleanPath === '/admin/settings') {
    return { view: 'admin-settings', params: {} };
  }
  if (cleanPath === '/admin/users') {
    return { view: 'admin-users', params: {} };
  }

  // Informational & Content Pages
  if (cleanPath === '/subjects') {
    return { view: 'subjects', params: {} };
  }
  if (cleanPath === '/how-it-works') {
    return { view: 'how-it-works', params: {} };
  }
  if (cleanPath === '/become-tutor') {
    return { view: 'become-tutor', params: {} };
  }
  if (cleanPath === '/contact') {
    return { view: 'contact', params: {} };
  }
  if (cleanPath === '/about') {
    return { view: 'about', params: {} };
  }

  // Any unmatched path renders the 404 view
  return { view: '404', params: { attemptedPath: cleanPath }, isNotFound: true };
}

/**
 * Converts a view name and optional params into an SEO-friendly URL path
 */
export function getPathForView(view: string, params: Record<string, any> = {}): string {
  switch (view) {
    case 'landing':
      return '/';
    case 'login':
      return params.redirect ? `/login?redirect=${encodeURIComponent(params.redirect)}` : '/login';
    case 'register':
      return params.role ? `/register?role=${params.role}` : '/register';
    case 'forbidden':
      return `/forbidden?required=${params.requiredRole || 'ADMIN'}&attempted=${encodeURIComponent(params.attemptedPath || '')}`;
    case 'tutors': {
      const search = new URLSearchParams();
      if (params.subject) search.set('subject', params.subject);
      if (params.mode) search.set('mode', params.mode);
      const query = search.toString();
      return query ? `/tutors?${query}` : '/tutors';
    }
    case 'tutor-profile':
      return params.tutorId ? `/tutors/${params.tutorId}` : '/tutors';
    case 'student-dashboard':
      return '/student/dashboard';
    case 'student-profile':
      return '/student/profile';
    case 'student-reviews':
      return '/student/reviews';
    case 'bookings':
      return '/bookings';
    case 'learning':
      return '/learning';
    case 'messages':
      return '/messages';
    case 'tutor-dashboard':
      return '/tutor/dashboard';
    case 'tutor-students':
      return '/tutor/students';
    case 'tutor-availability':
      return '/tutor/availability';
    case 'tutor-earnings':
      return '/tutor/earnings';
    case 'tutor-bookings':
      return '/tutor/bookings';
    case 'tutor-reviews':
      return '/tutor/reviews';
    case 'tutor-profile-edit':
      return '/tutor/profile';
    case 'admin-dashboard':
      return '/admin/dashboard';
    case 'admin-students':
      return '/admin/students';
    case 'admin-tutors':
      return '/admin/tutors';
    case 'admin-add-tutor':
      return '/admin/add-tutor';
    case 'admin-bookings':
      return '/admin/bookings';
    case 'admin-payments':
      return '/admin/payments';
    case 'admin-reviews':
      return '/admin/reviews';
    case 'admin-analytics':
      return '/admin/analytics';
    case 'admin-audit':
      return '/admin/audit';
    case 'admin-settings':
      return '/admin/settings';
    case 'admin-users':
      return '/admin/users';
    case 'subjects':
      return '/subjects';
    case 'how-it-works':
      return '/how-it-works';
    case 'become-tutor':
      return '/become-tutor';
    case 'contact':
      return '/contact';
    case 'about':
      return '/about';
    case '404':
      return params.attemptedPath || '/404';
    default:
      return '/';
  }
}

/**
 * Updates document.title and canonical link dynamically for SEO & branding
 */
export function syncDocumentMetadata(view: string, params: Record<string, any> = {}): void {
  if (typeof document === 'undefined') return;

  const DEFAULT_TITLE = 'TutorNest — Learn. Connect. Grow.';
  let pageTitle = DEFAULT_TITLE;

  switch (view) {
    case 'landing':
      pageTitle = DEFAULT_TITLE;
      break;
    case 'tutors':
      pageTitle = params.subject
        ? `Top ${params.subject} Tutors — TutorNest`
        : 'Find Verified Expert Tutors — TutorNest';
      break;
    case 'tutor-profile':
      pageTitle = 'Tutor Profile & Availability — TutorNest';
      break;
    case 'student-dashboard':
      pageTitle = 'Student Learning Hub — TutorNest';
      break;
    case 'bookings':
      pageTitle = 'My Session Bookings — TutorNest';
      break;
    case 'learning':
      pageTitle = 'My Learning Progress & Notes — TutorNest';
      break;
    case 'messages':
      pageTitle = 'Messages & Chat — TutorNest';
      break;
    case 'tutor-dashboard':
      pageTitle = 'Tutor Portal — TutorNest';
      break;
    case 'tutor-availability':
      pageTitle = 'Manage Schedule & Availability — TutorNest';
      break;
    case 'tutor-earnings':
      pageTitle = 'Earnings & Payouts — TutorNest';
      break;
    case 'admin-dashboard':
      pageTitle = 'Admin Operations Dashboard — TutorNest';
      break;
    case 'admin-audit':
      pageTitle = 'Security Audit Trail & Governance — TutorNest';
      break;
    case 'admin-users':
      pageTitle = 'User Management — TutorNest';
      break;
    case 'admin-tutors':
      pageTitle = 'Tutor Verification Queue — TutorNest';
      break;
    case 'subjects':
      pageTitle = 'Browse Tutoring Subjects & Disciplines — TutorNest';
      break;
    case 'how-it-works':
      pageTitle = 'How It Works — TutorNest Platform Guide';
      break;
    case 'become-tutor':
      pageTitle = 'Become a Verified Tutor — TutorNest';
      break;
    case 'contact':
      pageTitle = 'Contact Support & Help Center — TutorNest';
      break;
    case 'about':
      pageTitle = 'About Us — TutorNest';
      break;
    case '404':
      pageTitle = '404 Page Not Found — TutorNest';
      break;
  }

  document.title = pageTitle;

  // Canonical tag synchronization
  const path = getPathForView(view, params);
  const canonicalUrl = `${PRODUCTION_SITE_URL}${path === '/' ? '' : path.split('?')[0]}`;
  
  let canonicalEl = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.setAttribute('rel', 'canonical');
    document.head.appendChild(canonicalEl);
  }
  canonicalEl.setAttribute('href', canonicalUrl);

  // OpenGraph URL tag synchronization
  const ogUrlEl = document.querySelector('meta[property="og:url"]');
  if (ogUrlEl) {
    ogUrlEl.setAttribute('content', canonicalUrl);
  }
}
