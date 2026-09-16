import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  DollarSign,
  Calendar,
  Users,
  Award,
} from 'lucide-react';
import { api } from '../services/api';
import { BackButton } from './BackButton';

interface BecomeTutorPageProps {
  onSuccess: () => void;
  onBack?: () => void;
  onNavigate?: (view: string) => void;
}

export const BecomeTutorPage: React.FC<BecomeTutorPageProps> = ({
  onSuccess,
  onBack,
  onNavigate,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [headline, setHeadline] = useState('');
  const [subjects, setSubjects] = useState('Data Structures & Algorithms');
  const [hourlyRate, setHourlyRate] = useState(850);
  const [education, setEducation] = useState('');
  const [yearsExperience, setYearsExperience] = useState(4);
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('Bengaluru, KA');
  const [format, setFormat] = useState<'Online' | 'In-person' | 'Both'>('Online');

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg(null);

    try {
      await api.registerTutor({
        name,
        email,
        headline,
        subjects: subjects.split(',').map(s => s.trim()),
        hourlyRate: Number(hourlyRate),
        education,
        yearsExperience: Number(yearsExperience),
        bio,
        location,
        teachingFormat: format,
      });

      setSuccessMsg(
        'Thank you! Your tutor application has been submitted to the Admin review queue. Our compliance team will audit your credentials shortly.'
      );
    } catch (err: any) {
      alert(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        
        {/* Navigation Back Option */}
        <div>
          <BackButton
            onClick={onBack || (() => onNavigate ? onNavigate('landing') : onSuccess())}
            label="Back to Home"
          />
        </div>

        {/* Banner */}
        <div className="text-center space-y-3">
          <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
            Educator Recruitment
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950 tracking-tight">
            Teach on TutorNest & Empower Learners
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
            Set your own hourly rates, manage your calendar, and receive guaranteed weekly bank payouts with automated escrow protection.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <DollarSign className="w-6 h-6 text-emerald-600" />
            <h3 className="font-extrabold text-slate-900 text-sm">Keep 100% of Your Rate</h3>
            <p className="text-xs text-slate-500">
              Only a flat ₹40 student escrow fee is charged per booking. Your hourly rate goes directly to your bank.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            <h3 className="font-extrabold text-slate-900 text-sm">Flexible Schedule</h3>
            <p className="text-xs text-slate-500">
              Publish or block availability slots whenever you want. Students can only book your confirmed open windows.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <ShieldCheck className="w-6 h-6 text-teal-600" />
            <h3 className="font-extrabold text-slate-900 text-sm">Verified Credentials Badge</h3>
            <p className="text-xs text-slate-500">
              Stand out with an official accreditation badge verified by our academic admissions committee.
            </p>
          </div>
        </div>

        {/* Application Form */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-extrabold text-slate-900">Instructor Accreditation Form</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Please enter accurate credentials. Transcripts and background records will be reviewed prior to activation.
            </p>
          </div>

          {successMsg ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-4">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h3 className="font-extrabold text-emerald-950 text-base">Application Submitted!</h3>
              <p className="text-xs text-emerald-800 max-w-md mx-auto">{successMsg}</p>
              <button
                type="button"
                onClick={onSuccess}
                className="px-5 py-2.5 bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm"
              >
                Return to Home
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. Rajesh Verma"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Work or University Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rajesh@university.edu"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Professional Headline
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Software Architect & IIT Delhi CS Alumnus"
                  value={headline}
                  onChange={e => setHeadline(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Subjects Taught (comma-separated)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Calculus, Physics"
                    value={subjects}
                    onChange={e => setSubjects(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Hourly Rate (INR ₹)
                  </label>
                  <input
                    type="number"
                    required
                    min="300"
                    max="5000"
                    value={hourlyRate}
                    onChange={e => setHourlyRate(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Years of Teaching Experience
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="40"
                    value={yearsExperience}
                    onChange={e => setYearsExperience(Number(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Highest University Degree & Alma Mater
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. M.Tech in Computer Science, IIT Bombay"
                    value={education}
                    onChange={e => setEducation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                    City / Location
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Bengaluru, Karnataka"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Teaching Mode
                </label>
                <select
                  value={format}
                  onChange={e => setFormat(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                >
                  <option value="Online">Online Video Lessons (Google Meet)</option>
                  <option value="In-person">In-person</option>
                  <option value="Both">Both Online & In-person</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Teaching Philosophy & Academic Bio
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe your pedagogical approach, experience with competitive exams, or mentoring philosophy..."
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  {submitting ? 'Submitting Application...' : 'Submit Application for Review'}
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
