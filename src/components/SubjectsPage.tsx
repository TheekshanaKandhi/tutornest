import React, { useState, useEffect } from 'react';
import { BookOpen, Search, ArrowRight, Code, Calculator, Atom, Globe, Compass } from 'lucide-react';
import { Subject } from '../types';
import { api } from '../services/api';
import { BackButton } from './BackButton';

interface SubjectsPageProps {
  onSelectSubject: (subjectName: string) => void;
  onBack?: () => void;
  onNavigate?: (view: string) => void;
}

export const SubjectsPage: React.FC<SubjectsPageProps> = ({
  onSelectSubject,
  onBack,
  onNavigate,
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  useEffect(() => {
    api.getSubjects().then(res => {
      setSubjects(res.subjects);
      setLoading(false);
    }).catch(console.error);
  }, []);

  const categories = ['ALL', 'Computer Science & Tech', 'Mathematics', 'Natural Sciences', 'Humanities & Social Sciences'];

  const filtered = subjects.filter(s => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || s.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        
        {/* Navigation Back Option */}
        <div className="flex items-center justify-between">
          <BackButton
            onClick={onBack || (() => onNavigate?.('landing'))}
            label="Back to Home"
          />
          <span className="text-xs text-slate-500 font-medium">
            Active Disciplines: <strong className="text-slate-800">{subjects.length}</strong>
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Explore Subjects & Learning Tracks
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
            Choose from comprehensive disciplines taught by verified academic scholars and engineering practitioners.
          </p>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center">
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search subjects by name or keyword..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-2 rounded-xl whitespace-nowrap font-bold transition-all ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {cat === 'ALL' ? 'All Subjects' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Subjects Grid */}
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-500">Loading catalog...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(sub => (
              <div
                key={sub.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      {sub.category}
                    </span>
                    <span className="text-xs font-bold text-slate-500">
                      {sub.tutorCount} verified instructors
                    </span>
                  </div>

                  <h3 className="font-extrabold text-base text-slate-900">{sub.name}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{sub.description}</p>
                </div>

                <div className="pt-5 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    From ₹500<span className="text-slate-400 font-normal">/hr</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectSubject(sub.name)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <span>Browse Tutors</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
