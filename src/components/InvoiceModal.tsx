import React, { useState, useEffect } from 'react';
import { X, Printer, Download, CheckCircle2, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import { Logo } from './Logo';

interface InvoiceModalProps {
  paymentId: string;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ paymentId, onClose }) => {
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!paymentId) {
        setLoading(false);
        return;
      }
      try {
        const data = await api.getInvoice(paymentId);
        setInvoice(data);
      } catch (err) {
        console.error('Invoice load error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInvoice();
  }, [paymentId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden my-8">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-900 text-lg">Tax Invoice / Receipt</span>
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full">
              Paid
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading invoice details...</div>
        ) : !invoice ? (
          <div className="p-8 text-center text-xs text-red-500">Invoice not found.</div>
        ) : (
          <div className="p-6 space-y-6 text-xs">
            {/* Invoice Top Meta */}
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <div className="mb-2">
                  <Logo size="sm" />
                </div>
                <p className="font-bold text-slate-900 text-xs">TutorNest EdTech Inc.</p>
                <p className="text-slate-500 text-[11px]">GSTIN: 29AAACT9841N1Z5</p>
                <p className="text-slate-500 text-[11px]">Bangalore, Karnataka, India</p>
              </div>
              <div className="text-right">
                <p className="font-mono font-bold text-slate-800">{invoice.invoiceNumber}</p>
                <p className="text-slate-500">Date: {new Date(invoice.issuedDate).toLocaleDateString()}</p>
                <p className="text-slate-500">Method: {invoice.paymentMethod}</p>
              </div>
            </div>

            {/* Bill To & Tutor */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Billed To</span>
                <p className="font-bold text-slate-800 mt-1">{invoice.student.name}</p>
                <p className="text-slate-500">Registered Student</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tutor</span>
                <p className="font-bold text-slate-800 mt-1">{invoice.tutor.name}</p>
                <p className="text-slate-500 truncate">{invoice.tutor.headline}</p>
              </div>
            </div>

            {/* Session details */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Session Details</span>
              <p className="font-semibold text-slate-800 mt-1">{invoice.session.subject}</p>
              <p className="text-slate-500">
                {invoice.session.date} • {invoice.session.time} ({invoice.session.duration})
              </p>
              <p className="font-mono text-[10px] text-slate-400 mt-1">Ref: {invoice.session.reference}</p>
            </div>

            {/* Line Items */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100 px-3 py-2 text-slate-700 font-bold flex justify-between">
                <span>Description</span>
                <span>Amount (INR)</span>
              </div>
              <div className="divide-y divide-slate-100">
                {invoice.lineItems.map((item: any, idx: number) => (
                  <div key={idx} className="px-3 py-2 flex justify-between text-slate-700">
                    <span>{item.description}</span>
                    <span className="font-semibold">₹{item.amount}</span>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 p-3 border-t border-slate-200 space-y-1">
                <div className="flex justify-between font-bold text-slate-900 text-sm">
                  <span>Total Paid</span>
                  <span className="text-blue-600">₹{invoice.totalAmount}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified Transaction ID: {invoice.paymentId}</span>
              </div>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 hover:bg-slate-800"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
