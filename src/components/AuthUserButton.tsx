import React from 'react';
import { Bookmark } from 'lucide-react';

interface AuthUserButtonProps {
  onOpenSaved: () => void;
  savedCount: number;
}

export const AuthUserButton: React.FC<AuthUserButtonProps> = ({
  onOpenSaved,
  savedCount,
}) => {
  return (
    <div className="flex items-center gap-2">
      {/* Saved Events Button */}
      <button
        onClick={onOpenSaved}
        title="View your saved symposia & events"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 hover:text-white transition-all shadow-sm cursor-pointer"
      >
        <Bookmark className="w-3.5 h-3.5 text-emerald-400" />
        <span className="hidden sm:inline">Saved</span>
        {savedCount > 0 && (
          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-bold leading-none">
            {savedCount}
          </span>
        )}
      </button>
    </div>
  );
};
