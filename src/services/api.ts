import {
  User,
  Tutor,
  StudentProfile,
  Subject,
  AvailabilitySlot,
  Booking,
  PaymentTransaction,
  Review,
  Notification,
  Conversation,
  Message,
  LearningGoal,
  LearningProgress,
  AuditLog,
  AuditLogStats,
  AuditFilterParams,
  SystemSettings,
} from '../types';
import { getResolvedApiBaseUrl } from '../config/environment';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('tutornest_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getResolvedApiBaseUrl();
  const fullUrl = `${baseUrl}${endpoint}`;

  let res: Response;
  try {
    res = await fetch(fullUrl, {
      ...options,
      credentials: 'include', // Ensures cross-origin cookies are transmitted securely
      headers: {
        ...getHeaders(),
        ...options.headers,
      },
    });
  } catch (netErr: any) {
    console.error(`[API Network Error] ${options.method || 'GET'} ${fullUrl}:`, netErr);
    throw new Error(
      netErr.message ||
        'Unable to reach TutorNest services. Please verify your internet connection or try again later.'
    );
  }

  // Guard against HTML error pages or SPA fallback responses that cause
  // "Unexpected token '<', "<html><hea"... is not valid JSON"
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text();
    console.warn(`[API] Non-JSON response received (${contentType}) for ${fullUrl}:`, text.slice(0, 150));
    if (res.status === 404) {
      throw new Error(`The requested endpoint (${endpoint}) was not found on the server.`);
    } else if (res.status >= 500) {
      throw new Error('TutorNest backend service encountered a temporary error. Please try again shortly.');
    }
    throw new Error(`Server returned status ${res.status}: ${res.statusText || 'Unexpected response format'}`);
  }

  let json: any;
  try {
    json = await res.json();
  } catch (parseErr: any) {
    console.error(`[API Parse Error] ${fullUrl}:`, parseErr);
    throw new Error('Invalid JSON received from server.');
  }

  if (!res.ok || json.success === false) {
    const errorMessage =
      json.message ||
      json.error ||
      (res.status === 401
        ? 'Session expired or invalid credentials. Please sign in again.'
        : res.status === 403
        ? 'You do not have administrative clearance for this operation.'
        : `Request failed with status ${res.status}`);
    throw new Error(errorMessage);
  }
  return json.data;
}

export const api = {
  // Auth
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const data = await request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('tutornest_token', data.token);
    return data;
  },

  async register(payload: any): Promise<{ user: User; token: string }> {
    const data = await request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    localStorage.setItem('tutornest_token', data.token);
    return data;
  },

  async registerTutor(payload: any): Promise<{ user: User; token: string }> {
    const data = await request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...payload, role: 'TUTOR', password: 'Password@123' }),
    });
    return data;
  },

  async getMe(): Promise<{ user: User; tutorProfile?: Tutor; studentProfile?: StudentProfile }> {
    return request<{ user: User; tutorProfile?: Tutor; studentProfile?: StudentProfile }>('/auth/me');
  },

  async logout(): Promise<void> {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('tutornest_token');
    }
  },

  // Tutors
  async getTutors(params: Record<string, string | number> = {}): Promise<{
    tutors: Tutor[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== '') searchParams.append(key, String(val));
    });
    return request(`/tutors?${searchParams.toString()}`);
  },

  async getTutor(id: string): Promise<{ tutor: Tutor; reviews: Review[]; slots: AvailabilitySlot[] }> {
    if (!id) throw new Error('A tutor must be selected before viewing a profile.');
    return request(`/tutors/${id}`);
  },

  async getTutorAvailability(id: string, date?: string): Promise<{ slots: AvailabilitySlot[] }> {
    if (!id) throw new Error('A tutor must be selected before viewing availability.');
    const url = date ? `/tutors/${id}/availability?date=${date}` : `/tutors/${id}/availability`;
    return request(url);
  },

  async updateTutorProfile(updates: Partial<Tutor>): Promise<{ tutor: Tutor }> {
    return request('/tutors/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async addAvailabilitySlot(slot: Partial<AvailabilitySlot>): Promise<{ slot: AvailabilitySlot }> {
    return request('/tutors/availability', {
      method: 'POST',
      body: JSON.stringify(slot),
    });
  },

  async deleteAvailabilitySlot(slotId: string): Promise<void> {
    await request(`/tutors/availability/${slotId}`, { method: 'DELETE' });
  },

  // Bookings
  async getBookings(status?: string): Promise<{ bookings: Booking[] }> {
    const url = status ? `/bookings?status=${status}` : '/bookings';
    return request(url);
  },

  async getBooking(id: string): Promise<{ booking: Booking; history: any[]; payment?: PaymentTransaction }> {
    return request(`/bookings/${id}`);
  },

  async initiateBooking(payload: {
    tutorId: string;
    subject: string;
    date: string;
    startTime: string;
    durationMinutes: number;
    teachingFormat?: string;
    sessionNotes?: string;
  }): Promise<{ booking: Booking; paymentOrder: any }> {
    return request('/bookings/initiate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async verifyAndConfirmPayment(payload: {
    bookingId: string;
    orderId: string;
    paymentId?: string;
    paymentMethod: string;
    signature?: string;
  }): Promise<{ booking: Booking; payment: PaymentTransaction }> {
    return request('/bookings/verify-and-confirm', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async cancelBooking(id: string, reason: string): Promise<{ booking: Booking; refundAmount: number; policyApplied: string }> {
    return request(`/bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async rescheduleBooking(id: string, newDate: string, newStartTime: string): Promise<{ booking: Booking }> {
    return request(`/bookings/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({ newDate, newStartTime }),
    });
  },

  async completeSession(id: string): Promise<{ booking: Booking }> {
    return request(`/bookings/${id}/complete`, { method: 'POST' });
  },

  // Payments
  async getPaymentHistory(): Promise<{ payments: PaymentTransaction[] }> {
    return request('/payments/history');
  },

  async getInvoice(paymentId: string): Promise<any> {
    if (!paymentId) {
      throw new Error('Valid payment or invoice ID is required');
    }
    return request(`/payments/invoice/${paymentId}`);
  },

  // Reviews
  async getTutorReviews(tutorId: string): Promise<{ reviews: Review[] }> {
    if (!tutorId) return { reviews: [] };
    return request(`/reviews/tutor/${tutorId}`);
  },

  async submitReview(payload: { bookingId: string; rating: number; comment: string }): Promise<{ review: Review }> {
    return request('/reviews', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async replyToReview(reviewId: string, responseText: string): Promise<{ review: Review }> {
    return request(`/reviews/${reviewId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ responseText }),
    });
  },

  // Subjects
  async getSubjects(): Promise<{ subjects: Subject[] }> {
    return request('/subjects');
  },

  async createSubject(data: Partial<Subject>): Promise<{ subject: Subject }> {
    return request('/subjects', { method: 'POST', body: JSON.stringify(data) });
  },

  async updateSubject(id: string, data: Partial<Subject>): Promise<{ subject: Subject }> {
    return request(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },

  // Learning
  async getLearningOverview(): Promise<{
    goals: LearningGoal[];
    subjectsProgress: LearningProgress[];
    summary: { totalHours: number; totalSessionsCompleted: number; activeGoalsCount: number };
  }> {
    return request('/learning');
  },

  async createLearningGoal(goal: Partial<LearningGoal>): Promise<{ goal: LearningGoal }> {
    return request('/learning/goals', { method: 'POST', body: JSON.stringify(goal) });
  },

  async updateLearningGoal(id: string, updates: Partial<LearningGoal>): Promise<{ goal: LearningGoal }> {
    return request(`/learning/goals/${id}`, { method: 'PUT', body: JSON.stringify(updates) });
  },

  // Messages
  async getConversations(): Promise<{ conversations: Conversation[] }> {
    return request('/messages/conversations');
  },

  async getMessages(conversationId: string): Promise<{ conversation: Conversation; messages: Message[] }> {
    if (!conversationId) return { conversation: null as any, messages: [] };
    return request(`/messages/${conversationId}`);
  },

  async sendMessage(conversationId: string, content: string): Promise<{ message: Message }> {
    if (!conversationId) throw new Error('Conversation ID is required');
    return request(`/messages/${conversationId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  // Notifications
  async getNotifications(): Promise<{ notifications: Notification[]; unreadCount: number }> {
    return request('/notifications');
  },

  async markNotificationRead(id: string): Promise<void> {
    await request(`/notifications/${id}/read`, { method: 'PUT' });
  },

  async markAllNotificationsRead(): Promise<void> {
    await request('/notifications/read-all', { method: 'PUT' });
  },

  // Admin
  async getAdminAnalytics(): Promise<any> {
    return request('/admin/analytics');
  },

  async getAdminUsers(params: Record<string, string> = {}): Promise<{ users: User[]; pagination: any }> {
    const searchParams = new URLSearchParams(params);
    return request(`/admin/users?${searchParams.toString()}`);
  },

  async updateAdminUserStatus(
    id: string,
    status: string,
    reason?: string,
    confirmedAt?: string
  ): Promise<{ user: User; auditEntry?: AuditLog }> {
    return request(`/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, reason, confirmedAt }),
    });
  },

  async getPendingTutors(): Promise<{ tutors: Tutor[] }> {
    return request('/admin/tutors/pending');
  },

  async verifyTutor(
    id: string,
    action: 'APPROVE' | 'REJECT',
    reason?: string,
    confirmedAt?: string
  ): Promise<{ tutor: Tutor; auditEntry?: AuditLog }> {
    return request(`/admin/tutors/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ action, reason, confirmedAt }),
    });
  },

  async getAuditLogs(
    params?: AuditFilterParams
  ): Promise<{ logs: AuditLog[]; pagination: any; stats: AuditLogStats }> {
    const searchParams = new URLSearchParams();
    if (params) {
      if (params.search) searchParams.set('search', params.search);
      if (params.action && params.action !== 'ALL') searchParams.set('action', params.action);
      if (params.severity && params.severity !== 'ALL') searchParams.set('severity', params.severity);
      if (params.entity && params.entity !== 'ALL') searchParams.set('entity', params.entity);
      if (params.page) searchParams.set('page', params.page.toString());
      if (params.limit) searchParams.set('limit', params.limit.toString());
    }
    const queryStr = searchParams.toString();
    return request(`/admin/audit-logs${queryStr ? `?${queryStr}` : ''}`);
  },

  async getAuditLogById(id: string): Promise<{ log: AuditLog }> {
    return request(`/admin/audit-logs/${id}`);
  },

  async updateAdminUserRole(
    id: string,
    role: string,
    reason?: string,
    confirmedAt?: string
  ): Promise<{ user: User; auditEntry?: AuditLog }> {
    return request(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role, reason, confirmedAt }),
    });
  },

  async resolveBookingDispute(
    id: string,
    action: string,
    refundAmount: number,
    reason: string,
    confirmedAt?: string
  ): Promise<any> {
    return request(`/admin/bookings/${id}/dispute`, {
      method: 'POST',
      body: JSON.stringify({ action, refundAmount, reason, confirmedAt }),
    });
  },

  async getAdminSettings(): Promise<{ settings: SystemSettings }> {
    return request('/admin/settings');
  },

  async updateAdminSettings(
    settings: Partial<SystemSettings> & { confirmedAt?: string; reason?: string }
  ): Promise<{ settings: SystemSettings; auditEntry?: AuditLog }> {
    return request('/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  // Contact
  async submitContact(data: { name: string; email: string; subject: string; message: string }): Promise<any> {
    return request('/contact', { method: 'POST', body: JSON.stringify(data) });
  },

  // Student portal
  async getStudentDashboard(): Promise<any> {
    return request('/student/dashboard');
  },
  async getStudentProfile(): Promise<{ user: User; profile: StudentProfile }> {
    return request('/student/profile');
  },
  async updateStudentProfile(data: any): Promise<any> {
    return request('/student/profile', { method: 'PUT', body: JSON.stringify(data) });
  },

  // Tutor portal
  async getTutorDashboard(): Promise<any> {
    return request('/tutor/dashboard');
  },
  async getTutorStudents(): Promise<{ students: any[] }> {
    return request('/tutor/students');
  },
  async getTutorEarnings(): Promise<any> {
    return request('/tutor/earnings');
  },

  // Admin portal
  async getAdminStudents(): Promise<{ students: any[] }> {
    return request('/admin/students');
  },
  async getAdminDashboard(): Promise<any> {
    return request('/admin/dashboard');
  },
  async addAdminTutor(data: any): Promise<{ tutor: Tutor }> {
    return request('/admin/tutors', { method: 'POST', body: JSON.stringify(data) });
  },
  async getAdminBookings(): Promise<{ bookings: any[] }> {
    return request('/admin/bookings');
  },
  async getAdminPayments(): Promise<{ payments: any[] }> {
    return request('/admin/payments');
  },
  async getAdminReviews(): Promise<{ reviews: any[] }> {
    return request('/admin/reviews');
  },

  // Docs OpenAPI Spec
  async getOpenApiSpec(): Promise<any> {
    return request('/docs/spec');
  },
};
