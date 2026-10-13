import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X, Smartphone, CheckCircle2 } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);
  const [installedSuccess, setInstalledSuccess] = useState(false);

  // If already installed and running standalone, do not show button
  if (isInstalled) {
    return (
      <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-[11px] font-medium text-emerald-400">
        <Smartphone className="w-3.5 h-3.5" />
        <span>Installed App</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome) {
        setInstalledSuccess(true);
        setTimeout(() => setInstalledSuccess(false), 4000);
      }
    } else {
      // Show guided instructions for iOS or other browsers
      setShowGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        title="Install as Mobile App"
        className={`inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold shadow-sm transition-all shadow-emerald-950 hover:shadow-emerald-900/40 whitespace-nowrap ${
          compact
            ? 'px-2.5 py-1.5 text-xs'
            : 'px-3 py-1.5 text-xs'
        }`}
      >
        <Download className="w-3.5 h-3.5 animate-bounce" />
        <span>Install App</span>
      </button>

      {/* Success notification */}
      {installedSuccess && (
        <div className="fixed top-20 right-4 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-3 shadow-2xl text-xs font-semibold animate-in slide-in-from-top">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>App installed successfully! Added to your home screen.</span>
        </div>
      )}

      {/* Guided installation instructions modal for iOS or browsers */}
      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <h3 className="font-display text-base font-bold text-white">
                  {isIOS ? 'Install on iPhone / iPad' : 'Install Mobile App'}
                </h3>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isIOS ? (
              <div className="space-y-3 text-xs text-slate-300">
                <p className="text-slate-400">
                  Follow these 2 quick steps to add KnowaFest Connect to your home screen:
                </p>
                <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[11px] shrink-0">
                      1
                    </span>
                    <p className="flex items-center gap-1.5 flex-wrap">
                      <span>Tap the</span>
                      <strong className="text-white inline-flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded">
                        <Share2 className="w-3 h-3 text-sky-400" /> Share
                      </strong>
                      <span>button in the Safari toolbar.</span>
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[11px] shrink-0">
                      2
                    </span>
                    <p className="flex items-center gap-1.5 flex-wrap">
                      <span>Scroll down and tap</span>
                      <strong className="text-white inline-flex items-center gap-1 bg-slate-800 px-1.5 py-0.5 rounded">
                        <PlusSquare className="w-3 h-3 text-emerald-400" /> Add to Home Screen
                      </strong>
                      <span>.</span>
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 text-xs text-slate-300">
                <p className="text-slate-400">
                  To install this app on your mobile device or browser:
                </p>
                <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[11px] shrink-0">
                      1
                    </span>
                    <p>Open browser options or tap the <strong>⋮ menu</strong>.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[11px] shrink-0">
                      2
                    </span>
                    <p>Select <strong>&quot;Install App&quot;</strong> or <strong>&quot;Add to Home Screen&quot;</strong>.</p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
};
