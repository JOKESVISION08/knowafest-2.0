import React from 'react';
import { Globe } from 'lucide-react';

interface FooterProps {
  onSelectLocation: (loc: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectLocation }) => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-slate-400 mt-auto">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-slate-800/60">
          <div className="space-y-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-white font-semibold text-sm">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>KnowaFest Explorer &bull; Live Connect</span>
            </div>
            <p className="text-xs text-slate-400">
              Live collegiate technical symposiums, hackathons, and workshops directory connected with knowafest.com.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span>Quick Locations:</span>
            <button
              onClick={() => onSelectLocation('coimbatore')}
              className="text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Coimbatore
            </button>
            <span>&bull;</span>
            <button
              onClick={() => onSelectLocation('chennai')}
              className="text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Chennai
            </button>
            <span>&bull;</span>
            <button
              onClick={() => onSelectLocation('bengaluru')}
              className="text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Bengaluru
            </button>
            <span>&bull;</span>
            <button
              onClick={() => onSelectLocation('salem')}
              className="text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Salem
            </button>
            <span>&bull;</span>
            <button
              onClick={() => onSelectLocation('trichy')}
              className="text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Trichy
            </button>
            <span>&bull;</span>
            <button
              onClick={() => onSelectLocation('hyderabad')}
              className="text-emerald-400 hover:text-emerald-300 font-medium"
            >
              Hyderabad
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Collegiate Technical Symposiums & Events Directory
          </div>
          <div className="text-[11px]">
            Live verified data from KnowaFest.com
          </div>
        </div>
      </div>
    </footer>
  );
};
