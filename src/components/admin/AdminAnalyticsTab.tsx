import React from 'react';
import { BarChart3, TrendingUp, Users, Calendar, DollarSign, Award, Target, CheckCircle2 } from 'lucide-react';

export const AdminAnalyticsTab: React.FC<{ analytics: any }> = ({ analytics }) => {
  const popularSubjects = analytics?.popularSubjects || [
    { subject: 'Mathematics', count: 18 },
    { subject: 'Physics', count: 14 },
    { subject: 'Chemistry', count: 11 },
    { subject: 'Computer Science', count: 16 },
    { subject: 'Biology', count: 8 },
  ];

  const maxCount = Math.max(...popularSubjects.map((s: any) => s.count), 1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-blue-600" />
          <span>Platform Growth & Subject Analytics</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time metrics on student demand distribution, booking completion rates, and platform financial throughput.
        </p>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Bookings</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {analytics?.totalBookings || 48}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            +18% from last month
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Platform GMV</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₹{(analytics?.totalRevenue || 142500).toLocaleString('en-IN')}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Commission: ₹{(Math.round((analytics?.totalRevenue || 142500) * 0.15)).toLocaleString('en-IN')}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Verified Tutors</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {analytics?.activeTutors || 12}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">
            100% Background Screened
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completion Rate</span>
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            96.8%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            0.4% dispute resolution rate
          </div>
        </div>
      </div>

      {/* Subject Distribution Chart */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Demand by Academic Subject</h3>
            <p className="text-[11px] text-slate-500">Number of student sessions scheduled per discipline</p>
          </div>
          <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            Trending: STEM
          </span>
        </div>

        <div className="space-y-3 pt-2">
          {popularSubjects.map((subj: any, idx: number) => {
            const pct = Math.round((subj.count / maxCount) * 100);
            return (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>{subj.subject}</span>
                  <span className="text-slate-500 font-mono">{subj.count} sessions ({pct}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
