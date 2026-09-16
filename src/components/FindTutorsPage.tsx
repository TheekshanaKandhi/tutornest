import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Star,
  ShieldCheck,
  MapPin,
  Clock,
  ArrowUpDown,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Tutor, Subject } from '../types';
import { api } from '../services/api';
import { BackButton } from './BackButton';

interface FindTutorsPageProps {
  initialSubject?: string;
  initialMode?: string;
  onSelectTutor: (tutor: Tutor) => void;
  onBookTutor: (tutor: Tutor) => void;
  onBack?: () => void;
  onNavigate?: (view: string) => void;
}

export const FindTutorsPage: React.FC<FindTutorsPageProps> = ({
  initialSubject = '',
  initialMode = '',
  onSelectTutor,
  onBookTutor,
  onBack,
  onNavigate,
}) => {
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const [minPrice, setMinPrice] = useState<number>(400);
  const [maxPrice, setMaxPrice] = useState<number>(2000);
  const [minRating, setMinRating] = useState<number>(0);
  const [format, setFormat] = useState<string>(initialMode || 'ALL');
  const [sortBy, setSortBy] = useState('recommended');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Mobile filter drawer state
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Fetch subjects list
  useEffect(() => {
    api.getSubjects().then(res => setSubjects(res.subjects)).catch(console.error);
  }, []);

  // Fetch tutors based on active filters
  const fetchTutors = async () => {
    setLoading(true);
    try {
      const res = await api.getTutors({
        search,
        subject: selectedSubject,
        minPrice,
        maxPrice,
        minRating: minRating > 0 ? minRating : '',
        sortBy,
        page,
        limit: 9,
      });

      let list = res.tutors;
      if (format && format !== 'ALL') {
        list = list.filter(t => t.teachingFormat === format || t.teachingFormat === 'Both');
      }

      setTutors(list);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (err) {
      console.error('Error fetching tutors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutors();
  }, [search, selectedSubject, minPrice, maxPrice, minRating, format, sortBy, page]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedSubject('');
    setMinPrice(400);
    setMaxPrice(2000);
    setMinRating(0);
    setFormat('ALL');
    setSortBy('recommended');
    setPage(1);
  };

  const activeFilterCount =
    (selectedSubject ? 1 : 0) +
    (minPrice > 400 || maxPrice < 2000 ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (format !== 'ALL' ? 1 : 0);

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
            Directory Catalog • Verified Instructors
          </span>
        </div>

        {/* Page Title & Search Bar */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Find Your Verified Tutor
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Browse verified instructors, inspect credentials, and book flexible 1-on-1 sessions.
          </p>

          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search by tutor name, skill, topic (e.g. Dynamic Programming, Calculus)..."
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none shadow-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 flex items-center justify-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
            </button>
          </div>
        </div>

        {/* Main Content: Sidebar Filters + Results Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block lg:col-span-3 space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-6 sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-blue-600" />
                  <span>Filters</span>
                </span>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="text-xs text-blue-600 hover:underline font-semibold"
                  >
                    Reset All
                  </button>
                )}
              </div>

              {/* Subject Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={e => {
                    setSelectedSubject(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
                >
                  <option value="">All Subjects</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Range Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Hourly Rate (INR)
                  </label>
                  <span className="text-xs font-semibold text-blue-600">
                    ₹{minPrice} - ₹{maxPrice}
                  </span>
                </div>
                <input
                  type="range"
                  min="400"
                  max="2000"
                  step="50"
                  value={maxPrice}
                  onChange={e => {
                    setMaxPrice(Number(e.target.value));
                    setPage(1);
                  }}
                  className="w-full accent-blue-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>₹400/hr</span>
                  <span>₹2,000/hr</span>
                </div>
              </div>

              {/* Minimum Rating */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Minimum Rating
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-xs font-medium">
                  {[
                    { label: 'Any', val: 0 },
                    { label: '4.0+ ★', val: 4.0 },
                    { label: '4.8+ ★', val: 4.8 },
                  ].map(opt => (
                    <button
                      key={opt.val}
                      type="button"
                      onClick={() => {
                        setMinRating(opt.val);
                        setPage(1);
                      }}
                      className={`py-1.5 rounded-lg border text-center transition-all ${
                        minRating === opt.val
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Teaching Format */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Format
                </label>
                <div className="space-y-1.5 text-xs">
                  {[
                    { id: 'ALL', label: 'All Modes' },
                    { id: 'Online', label: 'Online (Video Call)' },
                    { id: 'In-person', label: 'In-person' },
                  ].map(mode => (
                    <label
                      key={mode.id}
                      className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-slate-900"
                    >
                      <input
                        type="radio"
                        name="teachingFormat"
                        checked={format === mode.id}
                        onChange={() => {
                          setFormat(mode.id);
                          setPage(1);
                        }}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span>{mode.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Results Grid */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* Sort & Count Header */}
            <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-slate-600">
                Showing <strong className="text-slate-900">{tutors.length}</strong> of{' '}
                <strong className="text-slate-900">{totalCount}</strong> verified tutors
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={e => {
                    setSortBy(e.target.value);
                    setPage(1);
                  }}
                  className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none"
                >
                  <option value="recommended">Recommended</option>
                  <option value="rating">Highest Rated</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="experience">Most Experienced</option>
                </select>
              </div>
            </div>

            {/* Tutor Cards Grid */}
            {loading ? (
              <div className="py-20 text-center text-xs text-slate-500">
                Loading available verified tutors...
              </div>
            ) : tutors.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">No tutors match your search</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting your price range, clearing the subject filter, or searching with broader keywords.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {tutors.map(tutor => (
                  <div
                    key={tutor.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between"
                  >
                    <div>
                      {/* Tutor Profile Header */}
                      <div className="flex items-start gap-3 mb-3">
                        <img
                          src={tutor.avatar}
                          alt={tutor.name}
                          className="w-14 h-14 rounded-full object-cover border border-slate-200 shadow-sm"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-sm text-slate-900 truncate">{tutor.name}</h3>
                            {tutor.status === 'VERIFIED' && (
                              <span title="Verified Academic Credentials">
                                <ShieldCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{tutor.headline}</p>
                          <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {tutor.location}
                            </span>
                            <span>•</span>
                            <span>{tutor.yearsExperience} yrs exp</span>
                          </div>
                        </div>
                      </div>

                      {/* Bio excerpt */}
                      <p className="text-xs text-slate-600 line-clamp-2 mb-3 leading-relaxed">
                        {tutor.bio}
                      </p>

                      {/* Rating & Rate Box */}
                      <div className="bg-slate-50 rounded-xl p-2.5 flex items-center justify-between text-xs mb-3 border border-slate-100">
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          <span>{tutor.rating.toFixed(1)}</span>
                          <span className="text-slate-400 font-normal">({tutor.reviewCount})</span>
                        </div>
                        <div className="font-extrabold text-slate-900">
                          ₹{tutor.hourlyRate} <span className="text-[10px] text-slate-500 font-normal">/hr</span>
                        </div>
                      </div>

                      {/* Subjects */}
                      <div className="flex flex-wrap gap-1 mb-4">
                        {tutor.subjects.slice(0, 3).map(sub => (
                          <span
                            key={sub}
                            className="px-2 py-0.5 text-[10px] font-semibold bg-blue-50 text-blue-700 rounded-md"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => onSelectTutor(tutor)}
                        className="py-2 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl text-center transition-colors"
                      >
                        View Profile
                      </button>
                      <button
                        type="button"
                        onClick={() => onBookTutor(tutor)}
                        className="py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl text-center shadow-sm transition-colors"
                      >
                        Book Session
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-6">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-white disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-semibold text-slate-700 px-3">
                  Page {page} of {totalPages}
                </span>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-white disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
