import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  BookOpen,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Lock,
  Mail,
  User,
  Phone,
  Briefcase,
  IndianRupee,
} from 'lucide-react';
import { useAuth, getDashboardRoute } from '../context/AuthContext';
import { Logo } from './Logo';

interface RegisterPageProps {
  onNavigate: (view: string, params?: any) => void;
  initialRole?: 'STUDENT' | 'TUTOR';
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigate, initialRole = 'STUDENT' }) => {
  const { user, register } = useAuth();
  // Role is restricted strictly to STUDENT or TUTOR; ADMIN is never exposed
  const [selectedRole, setSelectedRole] = useState<'STUDENT' | 'TUTOR'>(initialRole);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Student specific
  const [learningGoals, setLearningGoals] = useState('');
  const [preferredFormat, setPreferredFormat] = useState('Online');

  // Tutor specific
  const [headline, setHeadline] = useState('');
  const [subject, setSubject] = useState('Computer Science');
  const [hourlyRate, setHourlyRate] = useState('650');
  const [yearsExperience, setYearsExperience] = useState('3');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to existing dashboard
  useEffect(() => {
    if (user) {
      const destination = getDashboardRoute(user.role);
      onNavigate(destination.replace('/', ''));
    }
  }, [user, onNavigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError(null);

    const payload: any = {
      name: name.trim(),
      email: email.trim(),
      password,
      role: selectedRole, // Strictly 'STUDENT' or 'TUTOR'
      phone: phone.trim() || '+91 98000 00000',
    };

    if (selectedRole === 'STUDENT') {
      payload.learningGoals = learningGoals || 'Improve skills and prepare for exams';
      payload.preferredFormat = preferredFormat;
      payload.preferredSubjects = ['General Studies'];
    } else {
      payload.headline = headline || 'Dedicated Educator & Subject Specialist';
      payload.hourlyRate = Number(hourlyRate) || 500;
      payload.yearsExperience = Number(yearsExperience) || 3;
      payload.subjects = [subject];
      payload.bio = `Qualified tutor specializing in ${subject}.`;
    }

    try {
      const res = await register(payload);
      // Immediately redirect to newly authenticated role's dashboard
      const targetRoute = getDashboardRoute(res.role);
      onNavigate(targetRoute.replace('/', ''));
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4">
          <Logo size="lg" onClick={() => onNavigate('landing')} />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Create your TutorNest account
        </h2>
        <p className="mt-1.5 text-xs text-slate-500">
          Join India's premier 1-on-1 verified tutoring network.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 border border-slate-200 rounded-3xl sm:px-10">

          {/* Role Selector: Strictly STUDENT or TUTOR */}
          <div className="mb-6">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Account Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                id="btn-select-student-role"
                onClick={() => setSelectedRole('STUDENT')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  selectedRole === 'STUDENT'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>I am a Student</span>
              </button>
              <button
                type="button"
                id="btn-select-tutor-role"
                onClick={() => setSelectedRole('TUTOR')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  selectedRole === 'TUTOR'
                    ? 'bg-white text-teal-600 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BookOpen className="w-4 h-4" />
                <span>I am a Tutor</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5 text-center">
              {selectedRole === 'STUDENT'
                ? 'Find verified mentors, schedule lessons, and track progress.'
                : 'Teach students across India, set your hourly rate, and receive escrow payouts.'}
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-700">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="reg-name" className="block text-xs font-semibold text-slate-700">
                Full Name
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="reg-name"
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Rohan Mehra"
                  className="block w-full pl-10 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold text-slate-700">
                Email Address
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="reg-email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="rohan@example.com"
                  className="block w-full pl-10 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="reg-password"
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="block w-full pl-10 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="reg-phone" className="block text-xs font-semibold text-slate-700">
                Phone Number
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="reg-phone"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="block w-full pl-10 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Dynamic fields based on role */}
            {selectedRole === 'STUDENT' ? (
              <div>
                <label htmlFor="reg-goals" className="block text-xs font-semibold text-slate-700">
                  Primary Learning Goal
                </label>
                <input
                  id="reg-goals"
                  type="text"
                  value={learningGoals}
                  onChange={e => setLearningGoals(e.target.value)}
                  placeholder="e.g. Master CBSE Class 12 Physics or Python DSA"
                  className="mt-1 block w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>
            ) : (
              <div className="space-y-3 pt-1 border-t border-slate-100">
                <div>
                  <label htmlFor="reg-headline" className="block text-xs font-semibold text-slate-700">
                    Professional Headline
                  </label>
                  <input
                    id="reg-headline"
                    type="text"
                    value={headline}
                    onChange={e => setHeadline(e.target.value)}
                    placeholder="e.g. M.Tech in CS | 5+ Years Teaching JEE Maths"
                    className="mt-1 block w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="reg-subject" className="block text-xs font-semibold text-slate-700">
                      Primary Subject
                    </label>
                    <select
                      id="reg-subject"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="English">English</option>
                      <option value="Biology">Biology</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="reg-rate" className="block text-xs font-semibold text-slate-700">
                      Hourly Rate (₹)
                    </label>
                    <input
                      id="reg-rate"
                      type="number"
                      min="200"
                      max="5000"
                      value={hourlyRate}
                      onChange={e => setHourlyRate(e.target.value)}
                      className="mt-1 block w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            <button
              id="btn-submit-register"
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-sm text-xs sm:text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 ${
                selectedRole === 'STUDENT'
                  ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-600'
                  : 'bg-teal-600 hover:bg-teal-700 focus:ring-teal-600'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating Account & Redirecting...</span>
                </>
              ) : (
                <>
                  <span>Complete Registration ({selectedRole === 'STUDENT' ? 'Student' : 'Tutor'})</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <button
                onClick={() => onNavigate('login')}
                className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                Log in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
