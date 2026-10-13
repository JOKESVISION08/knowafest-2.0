import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { KnowaFestLivePortal } from './components/KnowaFestLivePortal';
import { Footer } from './components/Footer';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ReloadPrompt } from './components/ReloadPrompt';
import { SavedEventsModal } from './components/SavedEventsModal';
import { KNOWAFEST_BASE_URL } from './data/initialData';
import {
  subscribeToSavedEvents,
  SavedEventDoc,
} from './services/storageService';
import { subscribeToAuth } from './firebase/authService';
import { syncEventsByMonthAndDistrict } from './firebase/firestoreService';
import { CURATED_EVENTS } from './data/curatedEvents';

export default function App() {
  const [currentUrl, setCurrentUrl] = useState<string>(KNOWAFEST_BASE_URL);
  const [refreshKey, setRefreshKey] = useState(0);

  // History state for Back button
  const [canGoBack, setCanGoBack] = useState(false);
  const [previousLocationName, setPreviousLocationName] = useState('All Locations');
  const backHandlerRef = useRef<(() => void) | null>(null);

  // Saved events state (Local storage + Firebase Firestore)
  const [savedEvents, setSavedEvents] = useState<SavedEventDoc[]>([]);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('local-user');

  // Auto-sync monthly district event data to Firestore <knowafest> database on app load
  useEffect(() => {
    syncEventsByMonthAndDistrict(CURATED_EVENTS).catch((err) => {
      console.warn('Initial district-wise event sync to Firestore notice:', err);
    });
  }, []);

  // Track Firebase Auth user
  useEffect(() => {
    const unsubAuth = subscribeToAuth((user) => {
      setCurrentUserId(user ? user.uid : 'local-user');
    });
    return () => unsubAuth();
  }, []);

  // Subscribe to user saved events in local storage & Firestore
  useEffect(() => {
    const unsubSaved = subscribeToSavedEvents(currentUserId, (events) => {
      setSavedEvents(events);
    });
    return () => unsubSaved();
  }, [currentUserId]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleSelectFooterLocation = (loc: string) => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('location', loc);
      window.history.pushState({ location: loc }, '', url.toString());
      window.dispatchEvent(new PopStateEvent('popstate', { state: { location: loc } }));
    }
  };

  const handleGoBackNavbar = () => {
    if (backHandlerRef.current) {
      backHandlerRef.current();
    } else if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    }
  };

  const handleRegisterBackHandler = useCallback((handler: () => void) => {
    backHandlerRef.current = handler;
  }, []);

  const handleHistoryStateChange = useCallback((canBack: boolean, prevLoc: string) => {
    setCanGoBack(canBack);
    setPreviousLocationName(prevLoc);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar with Back Button, Firebase User Profile, and Saved Events */}
      <Navbar
        currentUrl={currentUrl}
        onRefresh={handleRefresh}
        canGoBack={canGoBack}
        onGoBack={handleGoBackNavbar}
        previousLocationName={previousLocationName}
        onOpenSaved={() => setIsSavedModalOpen(true)}
        savedCount={savedEvents.length}
      />

      {/* Main Live Portal with Location Search, Saved Events */}
      <main className="flex-1" key={refreshKey}>
        <KnowaFestLivePortal
          onUrlChange={(url) => setCurrentUrl(url)}
          onHistoryStateChange={handleHistoryStateChange}
          registerBackHandler={handleRegisterBackHandler}
          savedEventIds={new Set(savedEvents.map((s) => s.eventId))}
        />
      </main>

      {/* Footer */}
      <Footer onSelectLocation={handleSelectFooterLocation} />

      {/* PWA Offline Indicator & Auto-Update Notification */}
      <OfflineIndicator />
      <ReloadPrompt />

      {/* Saved Events Modal */}
      <SavedEventsModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedEvents={savedEvents}
      />
    </div>
  );
}
