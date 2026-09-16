import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { FindTutorsPage } from './components/FindTutorsPage';
import { TutorProfilePage } from './components/TutorProfilePage';
import { StudentDashboardPage } from './components/StudentDashboardPage';
import { BookingsPage } from './components/BookingsPage';
import { LearningPage } from './components/LearningPage';
import { MessagesPage } from './components/MessagesPage';
import { TutorDashboardPage } from './components/TutorDashboardPage';
import { TutorAvailabilityPage } from './components/TutorAvailabilityPage';
import { TutorEarningsPage } from './components/TutorEarningsPage';
import { AdminDashboardPage } from './components/AdminDashboardPage';
import { SubjectsPage } from './components/SubjectsPage';
import { HowItWorksPage } from './components/HowItWorksPage';
import { BecomeTutorPage } from './components/BecomeTutorPage';
import { ContactPage } from './components/ContactPage';
import { AboutPage } from './components/AboutPage';
import { BackNavStrip } from './components/BackNavStrip';
import { NotFoundPage } from './components/NotFoundPage';
import { LoginPage } from './components/LoginPage';
import { RegisterPage } from './components/RegisterPage';
import { ForbiddenPage } from './components/ForbiddenPage';

// Modals
import { BookingModal } from './components/BookingModal';
import { InvoiceModal } from './components/InvoiceModal';
import { RescheduleModal } from './components/RescheduleModal';
import { ReviewModal } from './components/ReviewModal';
import { ArchitectureModal } from './components/ArchitectureModal';

import { Tutor, Subject, Booking } from './types';
import { api } from './services/api';
import {
  resolveRouteFromPath,
  getPathForView,
  syncDocumentMetadata,
} from './utils/routing';

function MainApp() {
  const { user, loading } = useAuth();

  // Initialize view from browser URL on load (supports deep links and clean custom domain paths)
  const initialRoute = typeof window !== 'undefined'
    ? resolveRouteFromPath(window.location.pathname, window.location.search)
    : { view: 'landing', params: {} };

  const [currentView, setCurrentView] = useState<string>(initialRoute.view);
  const [viewParams, setViewParams] = useState<any>(initialRoute.params);
  const [history, setHistory] = useState<{ view: string; params: any }[]>([]);

  // Global data
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Active Modals state
  const [bookingTutor, setBookingTutor] = useState<Tutor | null>(null);
  const [invoicePaymentId, setInvoicePaymentId] = useState<string | null>(null);
  const [rescheduleBooking, setRescheduleBooking] = useState<Booking | null>(null);
  const [reviewBooking, setReviewBooking] = useState<Booking | null>(null);
  const [architectureOpen, setArchitectureOpen] = useState(false);

  // Sync document title and canonical tag whenever view changes
  useEffect(() => {
    syncDocumentMetadata(currentView, viewParams);
  }, [currentView, viewParams]);

  // Handle browser Back / Forward history events
  useEffect(() => {
    const handlePopState = () => {
      const resolved = resolveRouteFromPath(window.location.pathname, window.location.search);
      setCurrentView(resolved.view);
      setViewParams(resolved.params);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Load initial tutors and subjects for landing and directory
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [tutorsRes, subjectsRes] = await Promise.all([
          api.getTutors({ limit: 12 }),
          api.getSubjects(),
        ]);
        setTutors(tutorsRes.tutors);
        setSubjects(subjectsRes.subjects);
      } catch (err) {
        console.error('Initial data load error:', err);
      }
    };
    loadInitialData();
  }, []);

  const handleNavigate = (view: string, params: any = {}) => {
    if (view !== currentView) {
      setHistory(prev => [...prev, { view: currentView, params: viewParams }]);
    }
    setCurrentView(view);
    setViewParams(params);

    // Push new SEO-friendly path to browser URL if it differs
    const newPath = getPathForView(view, params);
    if (typeof window !== 'undefined' && (window.location.pathname + window.location.search) !== newPath) {
      window.history.pushState({ view, params }, '', newPath);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (loading) return;
    const requiredRole =
      currentView === 'student-dashboard' || currentView.startsWith('student-') || ['bookings', 'learning', 'messages'].includes(currentView)
        ? 'STUDENT'
        : currentView === 'tutor-dashboard' || currentView.startsWith('tutor-')
        ? 'TUTOR'
        : currentView === 'admin-dashboard' || currentView.startsWith('admin-')
        ? 'ADMIN'
        : null;

    if (requiredRole && !user) {
      handleNavigate('login', { redirect: getPathForView(currentView, viewParams) });
    } else if (requiredRole && user?.role !== requiredRole) {
      handleNavigate('forbidden', {
        requiredRole,
        attemptedPath: getPathForView(currentView, viewParams),
      });
    }
  }, [currentView, loading, user, viewParams]);

  const handleBack = () => {
    if (history.length > 0) {
      const last = history[history.length - 1];
      setHistory(prev => prev.slice(0, -1));
      setCurrentView(last.view);
      setViewParams(last.params || {});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Contextual fallbacks
      if (currentView.startsWith('tutor-') && currentView !== 'tutor-dashboard') {
        setCurrentView('tutor-dashboard');
      } else if (currentView.startsWith('admin-') && currentView !== 'admin-dashboard') {
        setCurrentView('admin-dashboard');
      } else if (['bookings', 'learning', 'messages'].includes(currentView)) {
        if (user?.role === 'TUTOR') {
          setCurrentView('tutor-dashboard');
        } else if (user?.role === 'ADMIN') {
          setCurrentView('admin-dashboard');
        } else {
          setCurrentView('student-dashboard');
        }
      } else if (currentView === 'tutor-profile') {
        setCurrentView('tutors');
      } else {
        setCurrentView('landing');
      }
      setViewParams({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSelectTutor = (tutor: Tutor) => {
    handleNavigate('tutor-profile', { tutorId: tutor.id });
  };

  const handleBookTutor = (tutor: Tutor) => {
    setBookingTutor(tutor);
  };

  const handleBookingSuccess = (booking: Booking) => {
    setBookingTutor(null);
    handleNavigate('bookings');
  };

  return (
    <>
      {currentView === 'login' && (
        <LoginPage onNavigate={handleNavigate} redirectParam={viewParams.redirect} />
      )}
      {currentView === 'register' && (
        <RegisterPage onNavigate={handleNavigate} initialRole={viewParams.role === 'TUTOR' ? 'TUTOR' : 'STUDENT'} />
      )}
      {currentView === 'forbidden' && (
        <ForbiddenPage
          requiredRole={viewParams.requiredRole}
          attemptedPath={viewParams.attemptedPath}
          onNavigate={handleNavigate}
        />
      )}
      {!['login', 'register', 'forbidden'].includes(currentView) && (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Sticky Global Navigation with Role Switcher & Notifications */}
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenArchitecture={() => setArchitectureOpen(true)}
      />

      {/* Global Contextual Back & Breadcrumb Navigation Bar */}
      <BackNavStrip
        currentView={currentView}
        onBack={handleBack}
        onNavigate={handleNavigate}
      />

      {/* Main Content View Switcher */}
      <main className="flex-1">
        {currentView === 'landing' && (
          <LandingPage
            tutors={tutors}
            subjects={subjects}
            onSelectTutor={handleSelectTutor}
            onBookTutor={handleBookTutor}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'tutors' && (
          <FindTutorsPage
            initialSubject={viewParams.subject || ''}
            initialMode={viewParams.mode || ''}
            onSelectTutor={handleSelectTutor}
            onBookTutor={handleBookTutor}
            onBack={handleBack}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'tutor-profile' && (
          <TutorProfilePage
            tutorId={viewParams.tutorId || tutors[0]?.id || ''}
            onBack={handleBack}
            onBook={handleBookTutor}
          />
        )}

        {currentView === 'student-dashboard' && (
          <StudentDashboardPage
            onNavigate={handleNavigate}
            onBack={handleBack}
            onOpenInvoice={paymentId => setInvoicePaymentId(paymentId)}
            onOpenReschedule={booking => setRescheduleBooking(booking)}
            onOpenReview={booking => setReviewBooking(booking)}
          />
        )}

        {currentView === 'bookings' && (
          <BookingsPage
            onOpenInvoice={paymentId => setInvoicePaymentId(paymentId)}
            onOpenReschedule={booking => setRescheduleBooking(booking)}
            onOpenReview={booking => setReviewBooking(booking)}
            onBookAgain={tutorId => handleNavigate('tutor-profile', { tutorId })}
            onBack={handleBack}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'learning' && (
          <LearningPage
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        )}

        {currentView === 'messages' && (
          <MessagesPage
            onBack={handleBack}
            onNavigate={handleNavigate}
          />
        )}

        {/* Tutor Role Views */}
        {(currentView === 'tutor-dashboard' || currentView === 'tutor-bookings') && (
          <TutorDashboardPage
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        )}

        {currentView === 'tutor-availability' && (
          <TutorAvailabilityPage
            onBack={handleBack}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'tutor-earnings' && (
          <TutorEarningsPage
            onBack={handleBack}
            onNavigate={handleNavigate}
          />
        )}

        {/* Admin Role Views */}
        {(currentView === 'admin-dashboard' ||
          currentView.startsWith('admin-')) && (
          <AdminDashboardPage
            onBack={handleBack}
            onNavigate={handleNavigate}
            initialTab={
              currentView === 'admin-audit'
                ? 'audit'
                : currentView === 'admin-students' || currentView === 'admin-users'
                ? 'students'
                : currentView === 'admin-tutors'
                ? 'tutors'
                : currentView === 'admin-add-tutor'
                ? 'add-tutor'
                : currentView === 'admin-bookings'
                ? 'bookings'
                : currentView === 'admin-payments'
                ? 'payments'
                : currentView === 'admin-reviews'
                ? 'reviews'
                : currentView === 'admin-analytics'
                ? 'analytics'
                : currentView === 'admin-settings'
                ? 'settings'
                : 'overview'
            }
          />
        )}

        {/* Informational & Static Pages */}
        {currentView === 'subjects' && (
          <SubjectsPage
            onSelectSubject={subjectName => handleNavigate('tutors', { subject: subjectName })}
            onBack={handleBack}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'how-it-works' && (
          <HowItWorksPage
            onNavigate={handleNavigate}
            onBack={handleBack}
          />
        )}

        {currentView === 'become-tutor' && (
          <BecomeTutorPage
            onSuccess={() => handleNavigate('landing')}
            onBack={handleBack}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'contact' && (
          <ContactPage
            onBack={handleBack}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'about' && (
          <AboutPage
            onBack={handleBack}
            onNavigate={handleNavigate}
          />
        )}

        {/* Professional 404 Page for Unrecognized URLs */}
        {currentView === '404' && (
          <NotFoundPage
            attemptedPath={viewParams.attemptedPath || (typeof window !== 'undefined' ? window.location.pathname : '')}
            onNavigate={handleNavigate}
          />
        )}
      </main>

      {/* Global Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Global Modals */}
      {bookingTutor && (
        <BookingModal
          tutor={bookingTutor}
          onClose={() => setBookingTutor(null)}
          onSuccess={handleBookingSuccess}
        />
      )}

      {invoicePaymentId && (
        <InvoiceModal
          paymentId={invoicePaymentId}
          onClose={() => setInvoicePaymentId(null)}
        />
      )}

      {rescheduleBooking && (
        <RescheduleModal
          booking={rescheduleBooking}
          onClose={() => setRescheduleBooking(null)}
          onSuccess={() => {
            setRescheduleBooking(null);
            handleNavigate(currentView);
          }}
        />
      )}

      {reviewBooking && (
        <ReviewModal
          booking={reviewBooking}
          onClose={() => setReviewBooking(null)}
          onSuccess={() => {
            setReviewBooking(null);
            handleNavigate(currentView);
          }}
        />
      )}

      {architectureOpen && (
        <ArchitectureModal onClose={() => setArchitectureOpen(false)} />
      )}
    </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
