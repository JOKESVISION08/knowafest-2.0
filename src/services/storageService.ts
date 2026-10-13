import { LiveSymposium } from '../types';
import {
  saveBookmarkToFirestore,
  removeBookmarkFromFirestore,
  subscribeToFirestoreSavedEvents,
} from '../firebase/firestoreService';
import {
  syncBookmarkToRTDB,
  removeBookmarkFromRTDB,
} from '../firebase/rtdbService';
import { auth } from '../firebase/config';

export interface SavedEventDoc {
  id: string;
  userId: string;
  eventId: string;
  title: string;
  college: string;
  city: string;
  date: string;
  category: string;
  knowafestUrl: string;
  savedAt: string;
}

const SAVED_EVENTS_KEY = 'knowafest_saved_events';

// Event listeners for real-time reactivity in-app
type Listener<T> = (data: T) => void;
const savedListeners: Set<Listener<SavedEventDoc[]>> = new Set();

function notifySaved() {
  const current = getLocalSavedEvents();
  savedListeners.forEach((listener) => listener(current));
}

// 1. Get Saved Events from local storage
export function getLocalSavedEvents(): SavedEventDoc[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SAVED_EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.warn('Error reading saved events from storage:', err);
    return [];
  }
}

// 2. Save Event Bookmark (local + Firestore)
export async function saveEventBookmark(event: LiveSymposium): Promise<void> {
  const cleanEventId = event.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const current = getLocalSavedEvents();

  const existingIndex = current.findIndex((item) => item.eventId === cleanEventId);
  const newDoc: SavedEventDoc = {
    id: cleanEventId,
    userId: 'user',
    eventId: cleanEventId,
    title: event.title.slice(0, 200),
    college: (event.college || 'Engineering College').slice(0, 200),
    city: (event.city || 'All Locations').slice(0, 100),
    date: (event.date || 'Upcoming 2026').slice(0, 50),
    category: (event.category || 'Technical Symposium').slice(0, 100),
    knowafestUrl: (event.knowafestUrl || '').slice(0, 500),
    savedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    current[existingIndex] = newDoc;
  } else {
    current.unshift(newDoc);
  }

  try {
    localStorage.setItem(SAVED_EVENTS_KEY, JSON.stringify(current));
    notifySaved();
  } catch (err) {
    console.error('Failed to save event locally:', err);
  }

  // Also sync to Cloud Firestore
  try {
    await saveBookmarkToFirestore(event);
  } catch (err) {
    console.warn('Could not mirror bookmark to Firestore:', err);
  }

  // Also sync to Firebase Realtime Database
  const currentUser = auth.currentUser;
  if (currentUser) {
    syncBookmarkToRTDB(currentUser.uid, event);
  }
}

// 3. Remove Saved Event (local + Firestore + RTDB)
export async function removeSavedEvent(eventId: string): Promise<void> {
  const cleanEventId = eventId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const current = getLocalSavedEvents().filter(
    (item) => item.eventId !== cleanEventId && item.id !== cleanEventId
  );

  try {
    localStorage.setItem(SAVED_EVENTS_KEY, JSON.stringify(current));
    notifySaved();
  } catch (err) {
    console.error('Failed to remove event from storage:', err);
  }

  // Also remove from Cloud Firestore
  try {
    await removeBookmarkFromFirestore(cleanEventId);
  } catch (err) {
    console.warn('Could not delete from Firestore:', err);
  }

  // Also remove from Firebase Realtime Database
  const currentUser = auth.currentUser;
  if (currentUser) {
    removeBookmarkFromRTDB(currentUser.uid, cleanEventId);
  }
}

// 4. Subscribe to Saved Events (local + Firestore)
export function subscribeToSavedEvents(
  userId: string,
  callback: (events: SavedEventDoc[]) => void
): () => void {
  savedListeners.add(callback);
  callback(getLocalSavedEvents());

  const handleStorage = (e: StorageEvent) => {
    if (e.key === SAVED_EVENTS_KEY) {
      callback(getLocalSavedEvents());
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }

  // If user is signed in to Firebase, also sync from Firestore
  let unsubFirestore: (() => void) | null = null;
  if (userId && userId !== 'local-user') {
    unsubFirestore = subscribeToFirestoreSavedEvents(userId, (firestoreEvents) => {
      if (firestoreEvents && firestoreEvents.length > 0) {
        // Merge with local storage
        try {
          localStorage.setItem(SAVED_EVENTS_KEY, JSON.stringify(firestoreEvents));
        } catch {
          // Ignore
        }
        callback(firestoreEvents);
      }
    });
  }

  return () => {
    savedListeners.delete(callback);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
    if (unsubFirestore) {
      unsubFirestore();
    }
  };
}
