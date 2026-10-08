import React from 'react';
import { Globe, RefreshCw, ArrowLeft } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { AuthUserButton } from './AuthUserButton';

interface NavbarProps {
  currentUrl: string;
  onRefresh: () => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  previousLocationName?: string;
  onOpenSaved?: () => void;
  savedCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUrl,
  onRefresh,
  canGoBack = false,
  onGoBack,
  previousLocationName,
  onOpenSaved = () => {},
  savedCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand & Live URL Status & Back Button */}
        <div className="flex items-center gap-3">
          {onGoBack && (
            <button
              onClick={onGoBack}
              disabled={!canGoBack}
              title={canGoBack ? `Move backward to ${previousLocationName || 'previous view'}` : 'No previous location to go back to'}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                canGoBack
                  ? 'border-emerald-600/60 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 hover:text-white cursor-pointer shadow-sm hover:scale-[1.02]'
                  : 'border-slate-800 bg-slate-900/40 text-slate-600 cursor-not-allowed opacity-50'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5 animate-pulse text-emerald-400" />
          </div>
          <div>
            <div className="font-display text-base font-bold text-white tracking-tight flex items-center gap-2">
              <span>KnowaFest Explorer</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-800/60">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                LIVE
              </span>
            </div>
            <div className="text-[11px] text-slate-400 hidden sm:block truncate max-w-xs md:max-w-md">
              Real-time collegiate symposium & event directory
            </div>
          </div>
        </div>

        {/* Right Actions: Saved Fests + Install Mobile App + Refresh */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* Saved Fests */}
          <AuthUserButton
            onOpenSaved={onOpenSaved}
            savedCount={savedCount}
          />

          {/* Prominent In-App Mobile Install Button */}
          <PWAInstallButton />

          <button
            onClick={onRefresh}
            title="Reload live page"
            className="p-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
};
