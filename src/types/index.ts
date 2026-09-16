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

export interface Tutor {
  id: string;
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
  dayOfWeek: number;
  date?: string;
  startTime: string;
  endTime: string;
  isBooked: boolean;
  mode: 'Online' | 'In-person' | 'Both';
}

export interface Booking {
  id: string;
  bookingReference: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  tutorId: string;
  tutorName: string;
  tutorAvatar: string;
  tutorHeadline: string;
  subject: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
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

export interface PaymentTransaction {
  id: string;
  orderId: string;
  paymentId: string;
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
  rating: number;
  comment: string;
  subject: string;
  tutorResponse?: string;
  tutorRespondedAt?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
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

export interface AuditLogStats {
  total: number;
  filteredTotal: number;
  criticalCount: number;
  highCount: number;
  todayCount: number;
  topActors: Array<{ name: string; count: number }>;
}

export interface AuditFilterParams {
  search?: string;
  action?: string;
  severity?: string;
  entity?: string;
  page?: number;
  limit?: number;
}

export interface SystemSettings {
  platformFeeFixed: number;
  platformFeePercentage: number;
  cancellationFullRefundHours: number;
  cancellationPartialRefundHours: number;
  partialRefundPercentage: number;
  currency: string;
  currencySymbol: string;
  autoApproveTutors: boolean;
  maintenanceMode: boolean;
}
