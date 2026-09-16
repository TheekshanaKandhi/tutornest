import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Download,
  CreditCard,
  CheckCircle2,
  Calendar,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { PaymentTransaction, Booking } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { BackButton } from './BackButton';

interface TutorEarningsPageProps {
  onBack?: () => void;
  onNavigate?: (view: string) => void;
}

export const TutorEarningsPage: React.FC<TutorEarningsPageProps> = ({
  onBack,
  onNavigate,
}) => {
  const { tutorProfile } = useAuth();
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadEarnings = async () => {
      setLoading(true);
      try {
        const res = await api.getPaymentHistory();
        setPayments(res.payments);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadEarnings();
  }, []);

  const totalGross = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPlatformFees = payments.reduce((sum, p) => sum + p.platformFee, 0);
  const totalNetPayout = payments.reduce((sum, p) => sum + p.tutorPayout, 0);

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation Back Option */}
        <div className="flex items-center justify-between">
          <BackButton
            onClick={onBack || (() => onNavigate?.('tutor-dashboard'))}
            label="Back to Faculty Dashboard"
          />
          <span className="text-xs text-slate-500 font-medium">
            Payout Schedule: <strong className="text-slate-800">Weekly Auto-Disbursement</strong>
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Earnings & Payout Ledger
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Real-time financial statement for your completed teaching sessions and platform payouts.
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Net Faculty Payout
            </span>
            <span className="text-3xl font-extrabold text-emerald-600">₹{totalNetPayout}</span>
            <span className="text-xs text-slate-400 block mt-1">Settled to your verified bank account</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Gross Student Bookings
            </span>
            <span className="text-3xl font-extrabold text-slate-900">₹{totalGross}</span>
            <span className="text-xs text-slate-400 block mt-1">Total volume generated</span>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Platform Service Fees
            </span>
            <span className="text-3xl font-extrabold text-blue-600">₹{totalPlatformFees}</span>
            <span className="text-xs text-slate-400 block mt-1">₹40 fixed escrow safety fee per booking</span>
          </div>
        </div>

        {/* Payout Security Assurance */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700 flex-shrink-0" />
            <span>
              <strong>Automated Weekly Payouts:</strong> Earnings are settled every Monday via direct IMPS/NEFT bank transfer with zero withdrawal delays.
            </span>
          </div>
          <button
            onClick={() => window.print()}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center gap-1 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Statement</span>
          </button>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-base">Session Settlement Ledger</h3>
            <span className="text-xs text-slate-500 font-medium">{payments.length} transactions recorded</span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-xs text-slate-500">Loading payout records...</div>
          ) : payments.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500">No payout records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3">Invoice & Order ID</th>
                    <th className="px-6 py-3">Student</th>
                    <th className="px-6 py-3">Method</th>
                    <th className="px-6 py-3">Gross</th>
                    <th className="px-6 py-3">Platform Fee</th>
                    <th className="px-6 py-3">Net Payout</th>
                    <th className="px-6 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {payments.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-mono font-semibold text-slate-900">
                        {p.invoiceNumber}
                        <span className="block text-[10px] text-slate-400 font-normal">
                          {p.orderId}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-900">{p.studentName}</td>
                      <td className="px-6 py-4">{p.paymentMethod}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">₹{p.amount}</td>
                      <td className="px-6 py-4 text-slate-500">-₹{p.platformFee}</td>
                      <td className="px-6 py-4 font-extrabold text-emerald-600">₹{p.tutorPayout}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
