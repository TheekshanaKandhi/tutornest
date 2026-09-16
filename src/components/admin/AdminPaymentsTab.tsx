import React, { useState, useEffect } from 'react';
import { CreditCard, Search, DollarSign, Download, ArrowUpRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '../../services/api';

export const AdminPaymentsTab: React.FC = () => {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const res = await api.getAdminPayments();
        setPayments(res.payments || []);
      } catch (err) {
        console.error('Failed to load payments', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const totalGross = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const totalPlatformFees = payments.reduce((acc, p) => acc + (p.platformFee || 0), 0);
  const totalTutorNet = payments.reduce((acc, p) => acc + (p.netAmount || 0), 0);

  const filtered = payments.filter(p => {
    return (
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      (p.bookingId && p.bookingId.toLowerCase().includes(search.toLowerCase())) ||
      (p.method && p.method.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-blue-600" />
            <span>Escrow & Financial Ledger</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor gross merchandise value, automated 15% platform commissions, GST invoices, and tutor bank payouts.
          </p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Transaction Volume</div>
          <div className="text-2xl font-black text-slate-900 mt-1">₹{totalGross.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>100% Escrow Protected</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Platform Retained Commission</div>
          <div className="text-2xl font-black text-blue-600 mt-1">₹{totalPlatformFees.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 mt-1">15% platform take rate (exclusive of GST)</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tutor Payout Disbursals</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">₹{totalTutorNet.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 mt-1">Direct NEFT/UPI bank transfers</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search payment ID, booking reference..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>
        <div className="text-xs text-slate-500 font-medium">
          Showing {filtered.length} transactions
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs font-semibold">Loading financial records...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
          <p className="text-sm font-semibold">No payment entries found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50/80 text-slate-700 uppercase text-[10px] tracking-wider font-extrabold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Payment ID</th>
                  <th className="py-3 px-4">Booking Ref</th>
                  <th className="py-3 px-4">Gross Amount</th>
                  <th className="py-3 px-4">Platform Fee (15%)</th>
                  <th className="py-3 px-4">Net Tutor Payout</th>
                  <th className="py-3 px-4">Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {p.id}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500">
                      {p.bookingId}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      ₹{p.amount}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-blue-600">
                      ₹{p.platformFee}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-700">
                      ₹{p.netAmount}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-[10px]">
                        {p.method || 'Razorpay UPI'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-500">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
