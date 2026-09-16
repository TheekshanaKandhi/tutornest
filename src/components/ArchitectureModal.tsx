import React, { useState } from 'react';
import {
  X,
  Database,
  Lock,
  Server,
  Layers,
  ShieldCheck,
  CheckCircle2,
  FileCode,
  Code2,
  ExternalLink,
  Copy,
  Check,
  Globe,
} from 'lucide-react';

interface ArchitectureModalProps {
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'acid_lock' | 'payments' | 'spring_boot' | 'schema' | 'production_domain'>('architecture');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-slate-900 text-slate-100 rounded-3xl shadow-2xl border border-slate-800 max-w-4xl w-full overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                TutorNest System Architecture & Engineering Spec
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Production Design
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Placement & Technical Portfolio Documentation • Full-Stack ACID Engine • Spring Boot Reference
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 gap-2 text-xs overflow-x-auto">
          {[
            { id: 'architecture', label: '1. Full-Stack Arch', icon: Layers },
            { id: 'production_domain', label: '2. Production Domain', icon: Globe },
            { id: 'acid_lock', label: '3. Double-Booking Lock', icon: Lock },
            { id: 'payments', label: '4. Payment Verification', icon: ShieldCheck },
            { id: 'spring_boot', label: '5. Spring Boot Core', icon: Server },
            { id: 'schema', label: '6. SQL Schema DDL', icon: Database },
          ].map(tab => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3 flex items-center gap-1.5 font-semibold transition-colors border-b-2 -mb-px whitespace-nowrap ${
                  isSel
                    ? 'border-blue-500 text-blue-400 bg-slate-800/50 rounded-t-lg'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed text-slate-300 flex-1">
          {/* TAB 1: ARCHITECTURE */}
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 space-y-3">
                <h4 className="font-bold text-white text-sm">Application Layering & Responsibility</h4>
                <p>
                  TutorNest is built with strict separation of concerns, ensuring zero mock data and realistic relational integrity:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="font-bold text-blue-400 block mb-1">Presentation Layer</span>
                    <p className="text-[11px] text-slate-400">
                      React 18 + TypeScript, Tailwind CSS, Lucide icons. Modularized dashboards for Students, Tutors, and Admins with real-time state synchronization.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="font-bold text-teal-400 block mb-1">Service & API Gateway</span>
                    <p className="text-[11px] text-slate-400">
                      Express REST routers with strict Bearer-token authentication, role-based authorization (RBAC), and global exception translation.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900/80 rounded-xl border border-slate-800">
                    <span className="font-bold text-emerald-400 block mb-1">Persistence & ACID Store</span>
                    <p className="text-[11px] text-slate-400">
                      Concurrent in-memory relational store with mutex-style slot locking, seed fixtures, and Spring Boot 3 + MySQL 8 JPA schema compatibility.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800 space-y-2">
                <h5 className="font-bold text-white">Live Production Features Active:</h5>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <li className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Role-Based Access Control (STUDENT / TUTOR / ADMIN)</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Server-side double-booking concurrency conflict check</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Idempotent payment order generation & verification</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Fair cancellation refund rules (&gt;24h 100%, 12-24h 50%)</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tutor credential verification admin audit workflow</span>
                  </li>
                  <li className="flex items-center gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Guarded messaging limited to confirmed student-tutor pairs</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB: PRODUCTION DOMAIN & DEPLOYMENT */}
          {activeTab === 'production_domain' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-800/70 rounded-2xl border border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-400" />
                    Production Architecture & Official Custom Domain
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    HTTPS TLS 1.3
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">
                  TutorNest is configured with dedicated production routing separating the client-side SPA from the Spring Boot REST API:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-400">Frontend Public URL</span>
                      <span className="text-[9px] font-mono uppercase text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">React SPA</span>
                    </div>
                    <code className="text-xs font-mono font-bold text-emerald-400 block bg-slate-950 px-2 py-1 rounded border border-slate-800/80">
                      https://tutornest.in
                    </code>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Served via high-performance CDN / Nginx reverse proxy with SPA HTML fallback, canonical tags, and OpenGraph SEO cards.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-400">Backend API URL</span>
                      <span className="text-[9px] font-mono uppercase text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">Spring Boot REST</span>
                    </div>
                    <code className="text-xs font-mono font-bold text-emerald-400 block bg-slate-950 px-2 py-1 rounded border border-slate-800/80">
                      https://api.tutornest.in
                    </code>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      Configured with strict Spring Boot CORS allowing <span className="text-slate-200">tutornest.in</span>, SameSite=None secure cookies, and zero exposed database secrets.
                    </p>
                  </div>
                </div>
              </div>

              {/* Security & Deployment Checklist */}
              <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800 space-y-2.5">
                <h5 className="font-bold text-white text-xs">Production Hardening Checklist</h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-start gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white block">Zero Hardcoded Localhost</span>
                      <span className="text-[10px] text-slate-400">All URLs resolved dynamically via VITE_API_BASE_URL and environment profiles.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white block">Cross-Origin Isolation</span>
                      <span className="text-[10px] text-slate-400">Spring Boot CorsConfig and Nginx proxy headers restrict origin access.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white block">Strict Transport Security</span>
                      <span className="text-[10px] text-slate-400">HSTS max-age=31536000 with subdomains and preload directive enabled.</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white block">Production Error Sanitization</span>
                      <span className="text-[10px] text-slate-400">Spring @RestControllerAdvice masks internal stack traces with clean JSON.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACID LOCK */}
          {activeTab === 'acid_lock' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-950/40 rounded-2xl border border-blue-900/60 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-400" />
                  Preventing Double-Booking Conflicts (Pessimistic / Mutex Locking)
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  In production systems, race conditions occur when two students attempt to book the exact same tutor time slot at the same second. TutorNest resolves this with an atomic lock:
                </p>
                <div className="bg-slate-950 p-3 rounded-xl font-mono text-[11px] text-slate-300 overflow-x-auto border border-slate-800">
                  <span className="text-purple-400">// In Node/Express runtime:</span>
                  <br />
                  <span className="text-blue-400">const</span> slotKey = <span className="text-emerald-300">{`\`${'${tutorId}'}_${'${date}'}_${'${startTime}'}\``}</span>;
                  <br />
                  <span className="text-blue-400">if</span> (!store.acquireSlotLock(slotKey)) &#123;
                  <br />
                  &nbsp;&nbsp;<span className="text-blue-400">return</span> res.status(<span className="text-amber-300">409</span>).json(&#123;
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;success: <span className="text-red-400">false</span>,
                  <br />
                  &nbsp;&nbsp;&nbsp;&nbsp;message: <span className="text-emerald-300">'Slot is currently locked or already reserved.'</span>
                  <br />
                  &nbsp;&nbsp;&#125;);
                  <br />
                  &#125;
                  <br /><br />
                  <span className="text-purple-400">-- In MySQL / PostgreSQL:</span>
                  <br />
                  <span className="text-blue-400">SELECT</span> * <span className="text-blue-400">FROM</span> availability_slots
                  <br />
                  <span className="text-blue-400">WHERE</span> tutor_id = ? <span className="text-blue-400">AND</span> slot_date = ? <span className="text-blue-400">AND</span> start_time = ?
                  <br />
                  <span className="text-blue-400">FOR UPDATE</span>; <span className="text-purple-400">-- Acquires row-level pessimistic write lock</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-950/30 rounded-2xl border border-emerald-900/60 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Razorpay Webhook & Payment Verification Flow
                </h4>
                <p className="text-[11px] text-slate-300">
                  Client-side payments can never be trusted without server-side validation. TutorNest implements cryptographic verification:
                </p>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800">
                  <li>Student initiates booking &rarr; server computes price and issues Razorpay Order ID.</li>
                  <li>Client completes payment in Razorpay Checkout modal.</li>
                  <li>Client transmits <code className="text-teal-300 font-mono">order_id</code>, <code className="text-teal-300 font-mono">payment_id</code>, and <code className="text-teal-300 font-mono">razorpay_signature</code>.</li>
                  <li>Server calculates HMAC-SHA256 signature using the secret key.</li>
                  <li>If signature matches, booking status moves from <code className="text-amber-300">PENDING_PAYMENT</code> to <code className="text-emerald-400">CONFIRMED</code>, releasing the temporary lock into a permanent reservation.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 4: SPRING BOOT */}
          {activeTab === 'spring_boot' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">Java Spring Boot 3 Controller Reference</span>
                <button
                  onClick={() => copyToClipboard(`@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {
    private final BookingService bookingService;

    @PostMapping("/initiate")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<BookingInitiateResponse> initiateBooking(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody BookingInitiateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookingService.initiateBooking(user.getUsername(), request));
    }
}`)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
              <pre className="bg-slate-950 p-4 rounded-xl font-mono text-[11px] text-emerald-300 overflow-x-auto border border-slate-800">
{`@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping("/initiate")
    @PreAuthorize("hasRole('STUDENT')")
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public ResponseEntity<BookingResponse> initiateBooking(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody BookingInitiateRequest request) {
        
        // 1. Acquire pessimistic lock on availability slot
        // 2. Validate tutor verified status
        // 3. Calculate hourly rate * duration + platform fee
        // 4. Create pending transaction order
        Booking booking = bookingService.initiate(user.getUsername(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(new BookingResponse(booking));
    }
}`}
              </pre>
            </div>
          )}

          {/* TAB 5: SCHEMA */}
          {activeTab === 'schema' && (
            <div className="space-y-3">
              <span className="font-bold text-white text-sm block">Relational MySQL 8 / PostgreSQL Schema DDL</span>
              <pre className="bg-slate-950 p-4 rounded-xl font-mono text-[11px] text-cyan-300 overflow-x-auto border border-slate-800">
{`CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('STUDENT', 'TUTOR', 'ADMIN') NOT NULL,
    status ENUM('ACTIVE', 'SUSPENDED', 'DEACTIVATED') DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tutors (
    id VARCHAR(36) PRIMARY KEY REFERENCES users(id),
    headline VARCHAR(255) NOT NULL,
    hourly_rate DECIMAL(10, 2) NOT NULL,
    rating DECIMAL(3, 2) DEFAULT 5.00,
    review_count INT DEFAULT 0,
    status ENUM('PENDING', 'VERIFIED', 'REJECTED') DEFAULT 'PENDING'
);

CREATE TABLE bookings (
    id VARCHAR(36) PRIMARY KEY,
    booking_reference VARCHAR(20) UNIQUE NOT NULL,
    student_id VARCHAR(36) NOT NULL REFERENCES users(id),
    tutor_id VARCHAR(36) NOT NULL REFERENCES tutors(id),
    subject VARCHAR(100) NOT NULL,
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_minutes INT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    status ENUM('PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'COMPLETED') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);`}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs">
          <span className="text-slate-400">
            OpenAPI 3.0 Documentation available at <code className="text-blue-400 font-mono">/api/docs/spec</code>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl"
          >
            Close Architecture View
          </button>
        </div>
      </div>
    </div>
  );
};
