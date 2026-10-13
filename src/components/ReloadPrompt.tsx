import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';

export const ReloadPrompt: React.FC = () => {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // Periodically check for updates every 10 minutes in installed PWA
        setInterval(() => {
          r.update().catch((err) => console.debug('Periodic SW update check:', err));
        }, 10 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.warn('SW registration error:', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 right-4 z-50 flex max-w-sm items-center gap-3 rounded-2xl border border-emerald-500/50 bg-slate-900/95 p-4 text-white shadow-2xl backdrop-blur-md transition-all animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
        <RefreshCw className="h-5 w-5 animate-spin" />
      </div>

      <div className="flex-1 text-xs">
        <p className="font-bold text-white text-sm">New Version Available</p>
        <p className="text-slate-300 mt-0.5">
          A new update has been published on Vercel. Click update to apply changes instantly.
        </p>
      </div>

      <div className="flex flex-col gap-1.5 shrink-0">
        <button
          onClick={() => updateServiceWorker(true)}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition-colors shadow-sm cursor-pointer"
        >
          Update
        </button>
        <button
          onClick={() => setNeedRefresh(false)}
          className="rounded-lg border border-slate-700 bg-slate-800/80 px-2 py-1 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer text-center"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
