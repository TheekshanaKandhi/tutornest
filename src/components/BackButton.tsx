import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  subLabel?: string;
  variant?: 'light' | 'dark' | 'ghost' | 'glass';
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  label = 'Back',
  subLabel,
  variant = 'light',
  className = '',
}) => {
  const baseStyles =
    'group inline-flex items-center gap-2 text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:ring-offset-1';

  let variantStyles = '';
  switch (variant) {
    case 'dark':
      variantStyles =
        'px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 shadow-sm';
      break;
    case 'ghost':
      variantStyles =
        'px-2 py-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100/70';
      break;
    case 'glass':
      variantStyles =
        'px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs border border-white/20 shadow-xs';
      break;
    case 'light':
    default:
      variantStyles =
        'px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 shadow-2xs hover:shadow-xs';
      break;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`${baseStyles} ${variantStyles} ${className}`}
    >
      <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
      <span>{label}</span>
      {subLabel && (
        <span className="opacity-60 text-[10px] font-normal border-l border-current/20 pl-2">
          {subLabel}
        </span>
      )}
    </button>
  );
};
