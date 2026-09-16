export type UserRole = 'STUDENT' | 'TUTOR' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';
export type TutorStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export type BookingStatus = 
  | 'PENDING_PAYMENT' 
  | 'CONFIRMED' 
  | 'CANCELLED' 
  | 'COMPLETED' 
  | 'NO_SHOW' 
  | 'REFUNDED';

export type PaymentStatus = 
  | 'CREATED' 
  | 'PENDING' 
  | 'SUCCESS' 
  | 'FAILED' 
  | 'REFUNDED' 
  | 'PARTIALLY_REFUNDED';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar: string;
  phone?: string;
  preferredLanguage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StudentProfile {
  userId: string;
  learningGoals: string;
  preferredSubjects: string[];
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  preferredFormat: 'Online' | 'In-person' | 'Either';
}

export interface Subject {
  id: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  active: boolean;
  tutorCount?: number;
}

export interface AvailabilitySlot {
  id: string;
  tutorId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday...
  date?: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isBooked: boolean;
  mode: 'Online' | 'In-person' | 'Both';
}

export interface Tutor {
  id: string; // matches userId
  name: string;
  email: string;
  avatar: string;
  headline: string;
  bio: string;
  subjects: string[];
  skills: string[];
  yearsExperience: number;
  education: string;
  certifications: string[];
  languages: string[];
  hourlyRate: number;
  teachingFormat: 'Online' | 'In-person' | 'Both';
  location: string;
  rating: number;
  reviewCount: number;
  totalSessions: number;
  status: TutorStatus;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Booking {
  id: string;
  bookingReference: string; // e.g., TN-2026-8941
  studentId: string;
  studentName: string;
  studentEmail: string;
  tutorId: string;
  tutorName: string;
  tutorAvatar: string;
  tutorHeadline: string;
  subject: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number; // 30, 60, 90, 120
  teachingFormat: 'Online' | 'In-person';
  sessionNotes?: string;
  meetingLink?: string;
  hourlyRate: number;
  subtotal: number;
  platformFee: number;
  totalAmount: number;
  currency: string;
  status: BookingStatus;
  paymentId?: string;
  cancellationReason?: string;
  refundAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface BookingHistory {
  id: string;
  bookingId: string;
  action: string;
  fromStatus?: BookingStatus;
  toStatus: BookingStatus;
  performedBy: string; // User ID or 'SYSTEM'
  notes?: string;
  timestamp: string;
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  paymentId: string; // Gateway transaction ID (e.g. pay_TN...)
  bookingId: string;
  studentId: string;
  studentName: string;
  tutorId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: 'Razorpay UPI' | 'Card' | 'Netbanking' | 'Stripe Checkout';
  gatewayFee: number;
  platformFee: number;
  tutorPayout: number;
  invoiceNumber: string;
  createdAt: string;
  completedAt?: string;
}

export interface Review {
  id: string;
  bookingId: string;
  tutorId: string;
  studentId: string;
  studentName: string;
  studentAvatar: string;
  rating: number; // 1 to 5
  comment: string;
  subject: string;
  tutorResponse?: string;
  tutorRespondedAt?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 
    | 'BOOKING_CONFIRMED'
    | 'PAYMENT_SUCCESS'
    | 'PAYMENT_FAILED'
    | 'BOOKING_CANCELLED'
    | 'SESSION_REMINDER'
    | 'TUTOR_VERIFIED'
    | 'RESCHEDULE_REQUEST'
    | 'REVIEW_REMINDER'
    | 'SYSTEM_ALERT';
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  content: string;
  timestamp: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  studentId: string;
  studentName: string;
  tutorId: string;
  tutorName: string;
  subject: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCountStudent: number;
  unreadCountTutor: number;
  activeBookingId: string;
}

export interface LearningGoal {
  id: string;
  studentId: string;
  title: string;
  subject: string;
  targetHours: number;
  completedHours: number;
  targetDate: string;
  status: 'IN_PROGRESS' | 'COMPLETED';
}

export interface LearningProgress {
  subject: string;
  masteryPercentage: number;
  sessionsCompleted: number;
  totalHours: number;
  lastSessionDate: string;
  nextSessionDate?: string;
  recentNotes: string[];
}

export type AuditSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  entity: string;
  entityId: string;
  entityName?: string;
  reason?: string;
  severity?: AuditSeverity;
  metadata?: Record<string, any>;
  previousState?: Record<string, any> | string;
  newState?: Record<string, any> | string;
  ipAddress: string;
  userAgent?: string;
  requestId?: string;
  confirmationTimestamp?: string;
  timestamp: string;
}

export interface SystemSettings {
  platformFeeFixed: number; // e.g. 40 (INR)
  platformFeePercentage: number; // e.g. 5%
  cancellationFullRefundHours: number; // 24
  cancellationPartialRefundHours: number; // 12
  partialRefundPercentage: number; // 50%
  currency: string; // 'INR'
  currencySymbol: string; // '₹'
  autoApproveTutors: boolean;
  maintenanceMode: boolean;
}

export interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  status: 'UNREAD' | 'READ' | 'RESPONDED';
}
