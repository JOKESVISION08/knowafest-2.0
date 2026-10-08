import React, { useState, useEffect, useCallback } from 'react';
import {
  Globe,
  Search,
  Copy,
  Check,
  RefreshCw,
  MapPin,
  Maximize2,
  Minimize2,
  Calendar,
  Building,
  Tag,
  ArrowLeft,
  ArrowRight,
  Home,
  X,
  Info,
  ExternalLink,
  Layers,
  Sparkles,
  Award,
  Users,
  Bookmark,
} from 'lucide-react';
import { POPULAR_LOCATIONS, TECHNICAL_DEPARTMENTS, KNOWAFEST_BASE_URL } from '../data/initialData';
import { LiveSymposium, EventFullDetails } from '../types';
import {
  saveEventBookmark,
  removeSavedEvent,
} from '../services/storageService';

interface KnowaFestLivePortalProps {
  onUrlChange?: (url: string) => void;
  onHistoryStateChange?: (canGoBack: boolean, previousLoc: string) => void;
  registerBackHandler?: (handler: () => void) => void;
  savedEventIds?: Set<string>;
}

export const KnowaFestLivePortal: React.FC<KnowaFestLivePortalProps> = ({
  onUrlChange,
  onHistoryStateChange,
  registerBackHandler,
  savedEventIds = new Set(),
}) => {
  const getInitialLocation = () => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('location') || p.get('search') || p.get('city') || '';
    }
    return '';
  };

  const initialLoc = getInitialLocation();
  const [locationInput, setLocationInput] = useState(initialLoc);
  const [activeLocation, setActiveLocation] = useState(initialLoc);
  const [streamFilter, setStreamFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [viewMode, setViewMode] = useState<'details' | 'frame'>('details');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [modalCopied, setModalCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [liveEvents, setLiveEvents] = useState<LiveSymposium[]>([]);
  const [currentUrl, setCurrentUrl] = useState(KNOWAFEST_BASE_URL);
  const [frameKey, setFrameKey] = useState(0);

  // Selected event modal and detailed scraping state
  const [selectedEvent, setSelectedEvent] = useState<LiveSymposium | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [eventFullDetails, setEventFullDetails] = useState<EventFullDetails | null>(null);

  // Navigation History Stack for moving backward and forward
  const [historyStack, setHistoryStack] = useState<string[]>([initialLoc]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const canGoBack = selectedEvent !== null || historyIndex > 0 || (activeLocation !== '' && activeLocation !== 'All Locations');
  const canGoForward = historyIndex < historyStack.length - 1;
  const previousLocation = historyIndex > 0 ? historyStack[historyIndex - 1] : '';

  // Notify parent of history status
  useEffect(() => {
    if (onHistoryStateChange) {
      onHistoryStateChange(canGoBack, previousLocation || 'All Locations');
    }
  }, [canGoBack, previousLocation, onHistoryStateChange, selectedEvent]);

  // Backward Navigation Handler
  const handleGoBack = useCallback(() => {
    if (selectedEvent) {
      setSelectedEvent(null);
      setEventFullDetails(null);
      return;
    }

    if (historyIndex > 0) {
      const prevIdx = historyIndex - 1;
      const targetLoc = historyStack[prevIdx];
      setHistoryIndex(prevIdx);
      setActiveLocation(targetLoc);
      setLocationInput(targetLoc);
      setCategoryFilter('All');
      setFrameKey((prev) => prev + 1);

      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (targetLoc) {
          url.searchParams.set('location', targetLoc);
        } else {
          url.searchParams.delete('location');
          url.searchParams.delete('city');
        }
        window.history.pushState({ location: targetLoc }, '', url.toString());
      }
    } else if (activeLocation) {
      setActiveLocation('');
      setLocationInput('');
      setCategoryFilter('All');
      setFrameKey((prev) => prev + 1);

      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.delete('location');
        url.searchParams.delete('city');
        window.history.pushState({ location: '' }, '', url.toString());
      }
    }
  }, [historyIndex, historyStack, activeLocation, selectedEvent]);

  // Register back handler for navbar
  useEffect(() => {
    if (registerBackHandler) {
      registerBackHandler(handleGoBack);
    }
  }, [handleGoBack, registerBackHandler]);

  // Forward Navigation Handler
  const handleGoForward = useCallback(() => {
    if (historyIndex < historyStack.length - 1) {
      const nextIdx = historyIndex + 1;
      const targetLoc = historyStack[nextIdx];
      setHistoryIndex(nextIdx);
      setActiveLocation(targetLoc);
      setLocationInput(targetLoc);
      setCategoryFilter('All');
      setFrameKey((prev) => prev + 1);

      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        if (targetLoc) {
          url.searchParams.set('location', targetLoc);
        } else {
          url.searchParams.delete('location');
        }
        window.history.pushState({ location: targetLoc }, '', url.toString());
      }
    }
  }, [historyIndex, historyStack]);

  // Navigate to a new location (records in history)
  const navigateToLocation = (newLoc: string) => {
    const trimmed = newLoc.trim();
    if (trimmed.toLowerCase() === activeLocation.toLowerCase()) return;

    const updatedStack = historyStack.slice(0, historyIndex + 1);
    updatedStack.push(trimmed);

    setHistoryStack(updatedStack);
    setHistoryIndex(updatedStack.length - 1);
    setActiveLocation(trimmed);
    setLocationInput(trimmed);
    setCategoryFilter('All');
    setSelectedEvent(null);
    setEventFullDetails(null);
    setFrameKey((prev) => prev + 1);

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      if (trimmed) {
        url.searchParams.set('location', trimmed);
      } else {
        url.searchParams.delete('location');
        url.searchParams.delete('city');
      }
      window.history.pushState({ location: trimmed }, '', url.toString());
    }
  };

  // Browser popstate listener (native back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const p = new URLSearchParams(window.location.search);
      const loc = p.get('location') || p.get('search') || p.get('city') || '';
      setActiveLocation(loc);
      setLocationInput(loc);
      setSelectedEvent(null);
      setEventFullDetails(null);
      setCategoryFilter('All');
      setFrameKey((prev) => prev + 1);

      const foundIdx = historyStack.lastIndexOf(loc);
      if (foundIdx !== -1) {
        setHistoryIndex(foundIdx);
      } else {
        setHistoryStack((prev) => [...prev, loc]);
        setHistoryIndex(historyStack.length);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [historyStack]);

  // Fetch real event details for the searched location from KnowaFest
  const fetchEventsForLocation = async (loc: string, stream: string) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const params = new URLSearchParams();
      if (loc) params.append('location', loc);
      if (stream) params.append('stream', stream);

      const res = await fetch(`/api/knowafest/live-events?${params.toString()}`);
      const text = await res.text();

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}: ${text}`);
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        console.error("Failed to parse JSON response:", text);
        throw new Error('Server returned an invalid response (not JSON)');
      }

      if (data.success) {
        setLiveEvents(data.events || []);
        if (data.url) {
          setCurrentUrl(data.url);
          if (onUrlChange) onUrlChange(data.url);
        }
      } else {
        setErrorMessage(data.error || 'Failed to fetch events');
      }
    } catch (err: any) {
      console.error('Failed to load events for location:', err);
      setErrorMessage(err.message || 'Unable to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsForLocation(activeLocation, streamFilter);
  }, [activeLocation, streamFilter]);

  // Fetch rich event details when an event is selected
  useEffect(() => {
    if (!selectedEvent) return;

    let isMounted = true;
    setDetailsLoading(true);
    setEventFullDetails(null);

    fetch(`/api/knowafest/event-details?url=${encodeURIComponent(selectedEvent.knowafestUrl)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.details) {
          setEventFullDetails(data.details);
        }
      })
      .catch((err) => {
        console.error('Failed to load event details:', err);
      })
      .finally(() => {
        if (isMounted) setDetailsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedEvent]);

  // Bookmark / Save Event to Local Storage
  const handleToggleBookmark = async (fest: LiveSymposium) => {
    const cleanId = fest.id.replace(/[^a-zA-Z0-9_-]/g, '_');
    const isSaved = savedEventIds.has(cleanId);

    try {
      if (isSaved) {
        await removeSavedEvent(cleanId);
      } else {
        await saveEventBookmark(fest);
      }
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateToLocation(locationInput);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyModalUrl = () => {
    if (selectedEvent?.knowafestUrl) {
      navigator.clipboard.writeText(selectedEvent.knowafestUrl);
      setModalCopied(true);
      setTimeout(() => setModalCopied(false), 2000);
    }
  };

  const handleRefresh = () => {
    setFrameKey((prev) => prev + 1);
    fetchEventsForLocation(activeLocation, streamFilter);
  };

  const allCombinedEvents = liveEvents;

  const availableCategories = ['All'];
  allCombinedEvents.forEach((ev) => {
    if (ev.category && !availableCategories.includes(ev.category)) {
      availableCategories.push(ev.category);
    }
  });

  const filteredEvents = allCombinedEvents.filter((ev) => {
    if (categoryFilter === 'All') return true;
    return ev.category.toLowerCase().includes(categoryFilter.toLowerCase());
  });

  const embeddedPortalUrl = `/api/knowafest/portal?url=${encodeURIComponent(currentUrl)}&location=${encodeURIComponent(activeLocation)}`;

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-950 p-2 sm:p-4' : 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6'}`}>

      {/* Main Search & Control Hub */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-md p-4 sm:p-6 shadow-xl space-y-5">
        
        {/* Heading & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <h1 className="font-display text-xl sm:text-2xl font-bold text-white tracking-tight">
                KnowaFest Explorer &bull; College Symposium Directory
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Live upcoming technical symposiums, hackathons, and workshops across engineering colleges.
            </p>
          </div>
        </div>

        {/* Location Search Bar with Dedicated Back Button */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            
            {/* Quick Back Button Next to Input */}
            {canGoBack && (
              <button
                type="button"
                onClick={handleGoBack}
                title={`Move backward to ${previousLocation || 'All Locations'}`}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-3 rounded-xl border border-emerald-600/50 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 hover:text-white text-xs font-semibold transition-all shrink-0 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}

            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                placeholder="Search college location (e.g. Coimbatore, Chennai, Bengaluru, Salem, Trichy, Madurai, Erode)..."
                className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-10 pr-20 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              {locationInput && (
                <button
                  type="button"
                  onClick={() => {
                    setLocationInput('');
                    navigateToLocation('');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-1 py-0.5"
                >
                  Clear
                </button>
              )}
            </div>
            
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold transition-all shadow-md shadow-emerald-950 shrink-0 flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Search Location</span>
            </button>
          </div>
        </form>

        {/* Quick Location Chips */}
        <div className="space-y-2 pt-1 border-t border-slate-800/80">
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
            <span>Popular Student Hubs:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 sm:gap-2">
            {POPULAR_LOCATIONS.map((loc) => {
              const isSelected = activeLocation.toLowerCase() === loc.query.toLowerCase();
              return (
                <button
                  key={loc.name}
                  type="button"
                  onClick={() => navigateToLocation(loc.query)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : 'border border-slate-800 bg-slate-950/70 text-slate-300 hover:border-slate-700 hover:text-white'
                  }`}
                >
                  {loc.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Technical Stream Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-800/60">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 mr-1">
            <Layers className="w-3 h-3 text-indigo-400" />
            Department / Stream:
          </span>
          {TECHNICAL_DEPARTMENTS.map((dept) => {
            const isSelected = streamFilter.toLowerCase() === dept.query.toLowerCase();
            return (
              <button
                key={dept.name}
                type="button"
                onClick={() => setStreamFilter(dept.query)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'border border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {dept.name}
              </button>
            );
          })}
        </div>

      </div>

      {/* Main Results Container with Navigation Controls */}
      <div className={`rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col ${isFullscreen ? 'flex-1' : 'min-h-[700px]'}`}>
        
        {/* Address & Navigation Controls Toolbar */}
        <div className="border-b border-slate-800 bg-slate-950 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          
          {/* Navigation Controls: Back, Forward, Home */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleGoBack}
              disabled={!canGoBack}
              title={canGoBack ? `Move backward to ${previousLocation || 'All Locations'}` : 'No previous location'}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                canGoBack
                  ? 'border-emerald-600/60 bg-emerald-950/50 hover:bg-emerald-900 text-emerald-300 hover:text-white cursor-pointer shadow-sm'
                  : 'border-slate-800 bg-slate-900/60 text-slate-600 cursor-not-allowed opacity-40'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <button
              type="button"
              onClick={handleGoForward}
              disabled={!canGoForward}
              title={canGoForward ? 'Move forward' : 'No forward history'}
              className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                canGoForward
                  ? 'border-emerald-600/60 bg-emerald-950/50 hover:bg-emerald-900 text-emerald-300 hover:text-white cursor-pointer shadow-sm'
                  : 'border-slate-800 bg-slate-900/60 text-slate-600 cursor-not-allowed opacity-40'
              }`}
            >
              <span className="hidden sm:inline">Forward</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => navigateToLocation('')}
              title="Return to All Locations"
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <Home className="w-4 h-4" />
            </button>
          </div>

          {/* Current URL Display with Copy, Open in KnowaFest, and Reload */}
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400 flex-1 overflow-hidden">
              <Globe className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
              <span className="truncate select-all text-slate-200 font-sans">
                {currentUrl}
              </span>
            </div>

            <button
              onClick={handleCopyUrl}
              title="Copy URL"
              className="p-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Direct Open in KnowaFest External Link */}
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open current location directly in KnowaFest"
              className="p-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4 text-emerald-400" />
            </a>

            <button
              onClick={handleRefresh}
              title="Reload live details"
              disabled={loading}
              className={`p-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors ${
                loading ? 'animate-spin text-emerald-400' : ''
              }`}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Switcher: Event Details vs Live Web Frame */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900 p-0.5 text-xs">
              <button
                onClick={() => setViewMode('details')}
                className={`px-3 py-1 rounded-md transition-colors flex items-center gap-1.5 ${
                  viewMode === 'details'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>Event Details</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 rounded-full font-mono font-bold">
                  {filteredEvents.length}
                </span>
              </button>

              <button
                onClick={() => setViewMode('frame')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  viewMode === 'frame'
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Live Web View
              </button>
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="p-2 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>

        </div>

        {/* View Mode 1: EVENT DETAILS */}
        {viewMode === 'details' ? (
          <div className="flex-1 bg-slate-950 p-4 sm:p-6 overflow-y-auto space-y-5">
            
            {/* Location Status Bar & Contextual Back Banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
              <div className="flex flex-wrap items-center gap-2">
                {activeLocation && (
                  <button
                    onClick={handleGoBack}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-emerald-700/60 bg-emerald-950/40 hover:bg-emerald-900 text-xs font-semibold text-emerald-300 hover:text-white transition-colors shadow-sm"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to {previousLocation || 'All Locations'}</span>
                  </button>
                )}

                <div className="flex items-center gap-2 text-white font-bold text-sm sm:text-base">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>
                    {activeLocation ? `Upcoming Events in ${activeLocation}` : 'All Live Collegiate Events'}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {filteredEvents.length} Events Found
                  </span>
                </div>
              </div>

              {/* Category Quick Filter */}
              {availableCategories.length > 2 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 uppercase font-semibold mr-1">
                    Filter:
                  </span>
                  {availableCategories.slice(0, 6).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                        categoryFilter === cat
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'border border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Error Notification Banner if backend is connecting */}
            {errorMessage && (
              <div className="rounded-xl border border-amber-600/40 bg-amber-950/30 p-3.5 text-xs text-amber-300 flex flex-wrap items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Connecting to live feed... You can retry or browse directly in Live Web View.</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleRefresh}
                    className="px-2.5 py-1 rounded bg-amber-600/40 hover:bg-amber-600 text-white font-semibold transition-colors"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => setViewMode('frame')}
                    className="px-2.5 py-1 rounded border border-amber-500/40 text-amber-200 hover:text-white transition-colors"
                  >
                    Switch to Live Web View
                  </button>
                </div>
              </div>
            )}

            {/* Loading State */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-400" />
                <p className="text-sm font-medium text-slate-300">
                  Fetching live event details for {activeLocation || 'all locations'} from KnowaFest...
                </p>
              </div>
            ) : filteredEvents.length === 0 ? (
              /* Empty Results State with One-Click Shortcuts */
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-12 text-center max-w-lg mx-auto space-y-4 my-8">
                <Globe className="w-12 h-12 text-slate-500 mx-auto" />
                <h3 className="font-display text-lg font-bold text-white">
                  No events currently found for &quot;{activeLocation}&quot;
                </h3>
                <p className="text-xs text-slate-400">
                  Try selecting one of the popular collegiate hubs or post a symposium:
                </p>
                <div className="flex flex-wrap justify-center gap-2 pt-2">
                  {canGoBack && (
                    <button
                      onClick={handleGoBack}
                      className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to Previous Location</span>
                    </button>
                  )}
                  <button
                    onClick={() => navigateToLocation('Coimbatore')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                  >
                    View Coimbatore (36+ Events)
                  </button>
                  <button
                    onClick={() => navigateToLocation('Chennai')}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold"
                  >
                    View Chennai (38+ Events)
                  </button>
                  <button
                    onClick={() => navigateToLocation('Salem')}
                    className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
                  >
                    View Salem
                  </button>
                  <button
                    onClick={() => navigateToLocation('Trichy')}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold"
                  >
                    View Trichy
                  </button>
                </div>
              </div>
            ) : (
              /* Event Details Cards Grid */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEvents.map((fest) => {
                  const cleanId = fest.id.replace(/[^a-zA-Z0-9_-]/g, '_');
                  const isSaved = savedEventIds.has(cleanId);

                  return (
                    <div
                      key={fest.id}
                      className="rounded-xl border border-slate-800 bg-slate-900/90 p-5 space-y-3 hover:border-slate-700 hover:shadow-lg transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-3">
                        {/* Badges Row with Bookmark Toggle */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              {fest.city}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                              {fest.category}
                            </span>
                          </div>

                          {/* Bookmark Button */}
                          <button
                            onClick={() => handleToggleBookmark(fest)}
                            title={isSaved ? 'Remove from saved events' : 'Save to bookmarks'}
                            className={`p-1.5 rounded-lg border transition-all ${
                              isSaved
                                ? 'border-emerald-500/60 bg-emerald-950/60 text-emerald-300 shadow-sm'
                                : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:text-white hover:border-slate-700'
                            }`}
                          >
                            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-emerald-400 text-emerald-400' : ''}`} />
                          </button>
                        </div>

                        {/* Title */}
                        <h3 className="font-display text-base font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2">
                          {fest.title}
                        </h3>

                        {/* College details */}
                        <div className="space-y-1.5 text-xs text-slate-400">
                          <p className="flex items-start gap-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                            <span className="line-clamp-2 text-slate-300">{fest.college}</span>
                          </p>

                          <p className="flex items-center gap-1.5 text-slate-300">
                            <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span className="font-medium text-emerald-300">{fest.date}</span>
                          </p>

                          <p className="flex items-center gap-1.5 text-slate-400">
                            <Tag className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                            <span className="truncate">{fest.category}</span>
                          </p>
                        </div>
                      </div>

                      {/* Card Footer Actions: View Details & Open in KnowaFest */}
                      <div className="pt-3 border-t border-slate-800/80 flex items-center gap-2">
                        {/* View Event Details Button */}
                        <button
                          onClick={() => setSelectedEvent(fest)}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition-all"
                        >
                          <Info className="w-3.5 h-3.5" />
                          <span>View Details</span>
                        </button>

                        {/* Open in KnowaFest Button */}
                        <a
                          href={fest.knowafestUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open event page"
                          className="inline-flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* View Mode 2: LIVE WEB FRAME */
          <div className="flex-1 w-full bg-white relative min-h-[640px]">
            <iframe
              key={frameKey}
              src={embeddedPortalUrl}
              title="KnowaFest Live Portal"
              className="w-full h-full min-h-[640px] border-0"
              sandbox="allow-scripts allow-popups allow-forms"
            />
          </div>
        )}

      </div>

      {/* Rich Event Details Modal with Back Button and Open in KnowaFest */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl p-6 text-slate-100 space-y-5 my-8 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <button
                  onClick={() => {
                    setSelectedEvent(null);
                    setEventFullDetails(null);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 mb-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Events List</span>
                </button>
                <div className="pt-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      {selectedEvent.city} &bull; {selectedEvent.category}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                      Verified Listing
                    </span>
                  </div>
                  <h2 className="font-display text-lg sm:text-xl font-bold text-white pt-1">
                    {selectedEvent.title}
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Save Bookmark button inside Modal */}
                <button
                  onClick={() => handleToggleBookmark(selectedEvent)}
                  title="Bookmark event"
                  className={`p-2 rounded-lg border transition-all ${
                    savedEventIds.has(selectedEvent.id.replace(/[^a-zA-Z0-9_-]/g, '_'))
                      ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                  }`}
                >
                  <Bookmark
                    className={`w-4 h-4 ${
                      savedEventIds.has(selectedEvent.id.replace(/[^a-zA-Z0-9_-]/g, '_'))
                        ? 'fill-emerald-400 text-emerald-400'
                        : ''
                    }`}
                  />
                </button>

                <button
                  onClick={() => {
                    setSelectedEvent(null);
                    setEventFullDetails(null);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="space-y-4 text-xs text-slate-300 overflow-y-auto flex-1 pr-1">
              
              {/* College & Key Facts Box */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <Building className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 text-[11px] block">College / Institute:</span>
                    <span className="font-semibold text-white text-sm">{selectedEvent.college}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-800/60">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Date: <strong className="text-white">{selectedEvent.date}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Location: <strong className="text-white">{selectedEvent.city}</strong></span>
                  </div>

                  <div className="flex items-center gap-2 text-slate-300 sm:col-span-2">
                    <Tag className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>Category: <strong className="text-white">{selectedEvent.category}</strong></span>
                  </div>
                </div>
              </div>

              {/* Detailed Description Section */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold text-xs">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>About This Event:</span>
                </div>

                {detailsLoading ? (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-center gap-2 text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                    <span>Loading real-time event description from KnowaFest...</span>
                  </div>
                ) : eventFullDetails?.about || selectedEvent.description ? (
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300 leading-relaxed space-y-2 whitespace-pre-line">
                    <p>{eventFullDetails?.about || selectedEvent.description}</p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-400 italic">
                    Annual technical symposium and academic festival featuring competitions, workshops, and project exhibitions. Click &apos;Open in KnowaFest&apos; below for official circular and brochure.
                  </div>
                )}
              </div>

              {/* Competitions / Sub-Events if available */}
              {eventFullDetails?.eventsList && eventFullDetails.eventsList.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-white font-semibold text-xs">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <span>Events & Competitions:</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap gap-2">
                    {eventFullDetails.eventsList.map((item, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 text-[11px] font-medium"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Eligibility */}
              {eventFullDetails?.whoCanAttend && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-white font-semibold text-xs">
                    <Users className="w-4 h-4 text-sky-400" />
                    <span>Who Can Attend:</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-300">
                    {eventFullDetails.whoCanAttend}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer with "Open in KnowaFest" & Back Buttons */}
            <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              
              <button
                onClick={() => {
                  setSelectedEvent(null);
                  setEventFullDetails(null);
                }}
                className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Events List</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyModalUrl}
                  title="Copy direct KnowaFest URL"
                  className="px-3.5 py-2.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-xs font-medium text-slate-300 hover:text-white inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  {modalCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{modalCopied ? 'Copied' : 'Copy Link'}</span>
                </button>

                <a
                  href={selectedEvent.knowafestUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-950"
                >
                  <span>Open</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
