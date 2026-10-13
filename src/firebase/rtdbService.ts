import {
  ref,
  set,
  remove,
  onValue,
  runTransaction,
  Unsubscribe,
} from 'firebase/database';
import { rtdb } from './config';
import { LiveSymposium } from '../types';

// 1. Live Symposium View & Interest Counter
export async function trackEventView(eventId: string): Promise<void> {
  const cleanId = eventId.replace(/[^a-zA-Z0-9_-]/g, '_');
  try {
    const viewRef = ref(rtdb, `eventInterest/${cleanId}`);
    await runTransaction(viewRef, (current) => {
      return (current || 0) + 1;
    });
  } catch (err) {
    // Non-blocking RTDB tracking
    console.debug('RTDB track view notice:', err);
  }
}

export function subscribeToEventInterest(
  eventId: string,
  callback: (count: number) => void
): Unsubscribe {
  const cleanId = eventId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const viewRef = ref(rtdb, `eventInterest/${cleanId}`);

  return onValue(
    viewRef,
    (snapshot) => {
      const val = snapshot.val();
      callback(typeof val === 'number' ? val : 0);
    },
    (err) => {
      console.debug('RTDB event interest listener notice:', err);
    }
  );
}

// 2. Mirror User Bookmarks to Realtime Database
export async function syncBookmarkToRTDB(userId: string, event: LiveSymposium): Promise<void> {
  if (!userId || userId === 'local-user') return;
  const cleanId = event.id.replace(/[^a-zA-Z0-9_-]/g, '_');

  try {
    const bookmarkRef = ref(rtdb, `users/${userId}/savedEvents/${cleanId}`);
    await set(bookmarkRef, {
      id: cleanId,
      title: event.title,
      college: event.college,
      city: event.city,
      date: event.date,
      category: event.category,
      knowafestUrl: event.knowafestUrl,
      savedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.warn('RTDB bookmark sync warning:', err);
  }
}

export async function removeBookmarkFromRTDB(userId: string, eventId: string): Promise<void> {
  if (!userId || userId === 'local-user') return;
  const cleanId = eventId.replace(/[^a-zA-Z0-9_-]/g, '_');

  try {
    const bookmarkRef = ref(rtdb, `users/${userId}/savedEvents/${cleanId}`);
    await remove(bookmarkRef);
  } catch (err) {
    console.warn('RTDB bookmark removal warning:', err);
  }
}

// 3. Monitor Realtime Database Connection state
export function subscribeToRTDBConnection(callback: (connected: boolean) => void): Unsubscribe {
  const connectedRef = ref(rtdb, '.info/connected');
  return onValue(connectedRef, (snap) => {
    callback(snap.val() === true);
  });
}
