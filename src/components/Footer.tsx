import React from 'react';
import { ShieldCheck, CreditCard, Lock, Heart, Award, Globe } from 'lucide-react';
import { Logo } from './Logo';

interface FooterProps {
  onNavigate: (view: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      {/* Trust & Guarantee Banner */}
      <div className="border-b border-slate-800 py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">Verified Tutors Only</div>
              <div className="text-xs text-slate-400">Rigorous credential and experience review</div>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">256-Bit Secure Payments</div>
              <div className="text-xs text-slate-400">Escrow-style holding until session is confirmed</div>
            </div>
          </div>

          <div className="flex items-center justify-center md:justify-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">100% Satisfaction Guarantee</div>
              <div className="text-xs text-slate-400">Fair cancellation & full refund window (&gt;24h)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Link Columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Col */}
          <div className="col-span-2">
            <div className="mb-3">
              <Logo
                size="md"
                theme="dark"
                onClick={() => onNavigate('landing')}
              />
            </div>
            <p className="text-sm text-slate-400 max-w-sm mb-4 leading-relaxed">
              “Learn from the right tutor. Grow with confidence.” Find trusted tutors, book flexible sessions, and make measurable progress toward your learning goals.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Globe className="w-4 h-4 text-slate-500" />
              <span>Primary Currency: <strong>Indian Rupee (INR ₹)</strong></span>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('tutors')} className="hover:text-white transition-colors">
                  Find Tutors
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('subjects')} className="hover:text-white transition-colors">
                  Subjects Directory
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('how-it-works')} className="hover:text-white transition-colors">
                  How It Works
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('become-tutor')} className="hover:text-white transition-colors">
                  Become a Tutor
                </button>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Company</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('about')} className="hover:text-white transition-colors">
                  About TutorNest
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">
                  Contact Support
                </button>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">Careers (Hiring)</span>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Support & Legal</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => onNavigate('how-it-works')} className="hover:text-white transition-colors">
                  Cancellation Policy
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-white transition-colors">
                  Help Center
                </button>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white cursor-pointer">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white cursor-pointer">
                  Terms of Service
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} TutorNest. All rights reserved. Production-style EdTech application.
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Built with precision for software engineering excellence.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
