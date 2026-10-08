import React from 'react';
import { X, Bookmark, ExternalLink, Trash2, Calendar, Building, MapPin } from 'lucide-react';
import { SavedEventDoc, removeSavedEvent } from '../services/storageService';

interface SavedEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedEvents: SavedEventDoc[];
}

export const SavedEventsModal: React.FC<SavedEventsModalProps> = ({
  isOpen,
  onClose,
  savedEvents,
}) => {
  if (!isOpen) return null;

  const handleRemove = async (eventId: string) => {
    try {
      await removeSavedEvent(eventId);
    } catch (err) {
      console.error('Failed to remove saved event:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 text-slate-100 space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Bookmark className="w-5 h-5 text-emerald-400" />
            <h2 className="font-display text-lg font-bold text-white">
              My Saved Events ({savedEvents.length})
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {savedEvents.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Bookmark className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">No saved events yet</p>
              <p className="text-xs">
                Click the bookmark icon on any symposium card to save it directly to your bookmarks.
              </p>
            </div>
          ) : (
            savedEvents.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-slate-800 bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-all"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {item.city}
                    </span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      {item.category}
                    </span>
                  </div>

                  <h3 className="font-semibold text-white text-sm truncate">{item.title}</h3>

                  <div className="text-xs text-slate-400 space-y-0.5">
                    <p className="flex items-center gap-1.5 truncate">
                      <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{item.college}</span>
                    </p>
                    <p className="flex items-center gap-1.5 text-slate-300">
                      <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{item.date}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                  <a
                    href={item.knowafestUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => handleRemove(item.eventId)}
                    title="Remove from saved events"
                    className="p-2 rounded-lg border border-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
