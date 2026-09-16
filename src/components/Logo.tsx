import React from 'react';

interface LogoSymbolProps {
  size?: number;
  className?: string;
  variant?: 'color' | 'monochrome-white' | 'monochrome-navy';
}

/**
 * TutorNest Minimalist Brand Symbol
 * Represents the foundational "Nest" (mentorship cradle) and the ascending trajectory of learner growth,
 * crowned with the signature Teal (#14B8A6) breakthrough apex.
 * Strictly adheres to clean geometric SaaS design (no graduation caps, books, or generic lightbulbs).
 */
export const TutorNestSymbol: React.FC<LogoSymbolProps> = ({
  size = 32,
  className = '',
  variant = 'color',
}) => {
  const blueColor = variant === 'monochrome-white' ? '#FFFFFF' : variant === 'monochrome-navy' ? '#0F172A' : '#2563EB';
  const tealColor = variant === 'monochrome-white' ? '#FFFFFF' : variant === 'monochrome-navy' ? '#0F172A' : '#14B8A6';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`flex-shrink-0 transition-transform ${className}`}
      aria-label="TutorNest Brand Symbol"
    >
      {/* Foundational Mentorship Cradle (The Nest) */}
      <path
        d="M 6.5 17.5 C 6.5 26 11.5 30.5 18 30.5 C 24.5 30.5 29.5 26 29.5 17.5"
        stroke={blueColor}
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Ascending Learning & Guidance Trajectory */}
      <path
        d="M 12.5 20 C 13.5 13.8 17.5 9 23.5 7.5"
        stroke={blueColor}
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Breakthrough Growth Node (Signature Teal Accent) */}
      <circle
        cx="26.5"
        cy="7.5"
        r="3.2"
        fill={tealColor}
      />
    </svg>
  );
};

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  theme?: 'dark' | 'light'; // dark theme means white/light text for dark headers/footers
  showTagline?: boolean;
  taglineText?: string;
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  theme = 'light',
  showTagline = true,
  taglineText = 'Verified Learning',
  className = '',
  onClick,
}) => {
  const isDark = theme === 'dark';

  const symbolSizes = {
    sm: 26,
    md: 34,
    lg: 44,
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const containerPadding = {
    sm: 'p-1 rounded-lg',
    md: 'p-1.5 rounded-xl',
    lg: 'p-2 rounded-2xl',
  };

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 select-none ${onClick ? 'cursor-pointer group' : ''} ${className}`}
    >
      {/* Symbol Container with subtle brand framing */}
      <div
        className={`flex items-center justify-center transition-all ${containerPadding[size]} ${
          isDark
            ? 'bg-slate-800/80 border border-slate-700/60 shadow-sm'
            : 'bg-blue-50/70 border border-blue-100/80 shadow-xs group-hover:border-blue-200'
        }`}
      >
        <TutorNestSymbol
          size={symbolSizes[size]}
          variant={isDark ? 'color' : 'color'}
          className="group-hover:scale-105 transition-transform"
        />
      </div>

      {/* Wordmark */}
      <div className="flex flex-col justify-center">
        <div className={`font-extrabold tracking-tight leading-none ${textSizes[size]}`}>
          <span className={isDark ? 'text-white' : 'text-[#0F172A]'}>Tutor</span>
          <span className="text-[#2563EB]">Nest</span>
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#14B8A6] ml-0.5 align-baseline" />
        </div>
        {showTagline && (
          <span
            className={`text-[10px] font-semibold tracking-wider uppercase mt-0.5 ${
              isDark ? 'text-slate-400' : 'text-[#64748B]'
            }`}
          >
            {taglineText}
          </span>
        )}
      </div>
    </div>
  );
};
