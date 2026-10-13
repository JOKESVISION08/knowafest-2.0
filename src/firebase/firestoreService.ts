import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { db, auth } from './config';
import { LiveSymposium } from '../types';
import { SavedEventDoc } from '../services/storageService';

export async function saveBookmarkToFirestore(event: LiveSymposium): Promise<void> {
  const cleanEventId = event.id.replace(/[^a-zA-Z0-9_-]/g, '_');
  const user = auth.currentUser;
  const userId = user ? user.uid : 'local-user';

  const docId = `${userId}_${cleanEventId}`;
  const docData: SavedEventDoc = {
    id: docId,
    userId,
    eventId: cleanEventId,
    title: event.title.slice(0, 200),
    college: (event.college || 'Engineering College').slice(0, 200),
    city: (event.city || 'All Locations').slice(0, 100),
    date: (event.date || 'Upcoming 2026').slice(0, 50),
    category: (event.category || 'Technical Symposium').slice(0, 100),
    knowafestUrl: (event.knowafestUrl || '').slice(0, 500),
    savedAt: new Date().toISOString(),
  };

  if (user) {
    try {
      const docRef = doc(db, 'savedEvents', docId);
      await setDoc(docRef, docData);
    } catch (err) {
      console.warn('Failed to save bookmark in Firestore (falling back to local):', err);
    }
  }
}

export async function removeBookmarkFromFirestore(eventId: string): Promise<void> {
  const cleanEventId = eventId.replace(/[^a-zA-Z0-9_-]/g, '_');
  const user = auth.currentUser;
  const userId = user ? user.uid : 'local-user';
  const docId = `${userId}_${cleanEventId}`;

  if (user) {
    try {
      const docRef = doc(db, 'savedEvents', docId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('Failed to delete bookmark in Firestore:', err);
    }
  }
}

export function subscribeToFirestoreSavedEvents(
  userId: string,
  callback: (events: SavedEventDoc[]) => void
): () => void {
  if (!userId || userId === 'local-user') {
    return () => {};
  }

  const q = query(collection(db, 'savedEvents'), where('userId', '==', userId));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: SavedEventDoc[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as SavedEventDoc;
        items.push({
          ...data,
          id: docSnap.id,
        });
      });
      // Sort newest first
      items.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
      callback(items);
    },
    (error) => {
      console.warn('Firestore subscription warning:', error);
    }
  );
}

// -------------------------------------------------------------
// MONTH & DISTRICT-WISE EVENT DATA (Firestore <knowafest> DB)
// -------------------------------------------------------------

const MONTH_NAMES_MAP: Record<string, string> = {
  jan: 'January',
  feb: 'February',
  mar: 'March',
  apr: 'April',
  may: 'May',
  jun: 'June',
  jul: 'July',
  aug: 'August',
  sep: 'September',
  oct: 'October',
  nov: 'November',
  dec: 'December',
};

export interface MonthDistrictEventsDoc {
  id: string; // e.g. "october-2026_coimbatore"
  month: string; // e.g. "October 2026"
  monthCode: string; // e.g. "oct"
  year: number; // e.g. 2026
  district: string; // e.g. "Coimbatore"
  districtSlug: string; // e.g. "coimbatore"
  eventCount: number;
  events: LiveSymposium[];
  lastSyncedAt: string;
}

/**
 * Extracts normalized month and district information from a LiveSymposium event.
 */
export function extractMonthAndDistrict(event: LiveSymposium): {
  month: string;
  monthCode: string;
  year: number;
  district: string;
  districtSlug: string;
} {
  const dateStr = (event.date || '').toLowerCase();
  const monthMatch = dateStr.match(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/);
  const yearMatch = dateStr.match(/\b(202\d)\b/);

  const monthCode = monthMatch ? monthMatch[1] : 'oct';
  const year = yearMatch ? parseInt(yearMatch[1], 10) : 2026;
  const monthFullName = MONTH_NAMES_MAP[monthCode] || 'October';
  const month = `${monthFullName} ${year}`;

  const rawDistrict = (event.city || 'Tamil Nadu').trim();
  const district = rawDistrict.charAt(0).toUpperCase() + rawDistrict.slice(1);
  const districtSlug = district.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  return { month, monthCode, year, district, districtSlug };
}

/**
 * Organizes events month-wise and district-wise and saves them to Firestore collection 'events_by_month_district'.
 */
export async function syncEventsByMonthAndDistrict(events: LiveSymposium[]): Promise<{
  success: boolean;
  totalDocs: number;
  totalEvents: number;
}> {
  if (!events || events.length === 0) {
    return { success: false, totalDocs: 0, totalEvents: 0 };
  }

  try {
    const grouped = new Map<string, {
      month: string;
      monthCode: string;
      year: number;
      district: string;
      districtSlug: string;
      events: LiveSymposium[];
    }>();

    events.forEach((ev) => {
      const meta = extractMonthAndDistrict(ev);
      const groupKey = `${meta.monthCode}-${meta.year}_${meta.districtSlug}`;

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, {
          month: meta.month,
          monthCode: meta.monthCode,
          year: meta.year,
          district: meta.district,
          districtSlug: meta.districtSlug,
          events: [],
        });
      }
      grouped.get(groupKey)!.events.push(ev);
    });

    const nowIso = new Date().toISOString();
    let writtenDocs = 0;

    for (const [key, group] of grouped.entries()) {
      const docRef = doc(db, 'events_by_month_district', key);
      const docData: MonthDistrictEventsDoc = {
        id: key,
        month: group.month,
        monthCode: group.monthCode,
        year: group.year,
        district: group.district,
        districtSlug: group.districtSlug,
        eventCount: group.events.length,
        events: group.events,
        lastSyncedAt: nowIso,
      };

      await setDoc(docRef, docData, { merge: true });

      // Also index individual events in 'events' collection
      for (const singleEv of group.events) {
        const cleanId = singleEv.id.replace(/[^a-zA-Z0-9_-]/g, '_');
        const evRef = doc(db, 'events', cleanId);
        await setDoc(evRef, {
          ...singleEv,
          month: group.month,
          monthCode: group.monthCode,
          year: group.year,
          district: group.district,
          districtSlug: group.districtSlug,
          syncedAt: nowIso,
        }, { merge: true });
      }

      writtenDocs++;
    }

    console.log(`[Firebase] Successfully synced ${writtenDocs} monthly district docs (${events.length} events) into <knowafest> database`);
    return { success: true, totalDocs: writtenDocs, totalEvents: events.length };
  } catch (err) {
    console.warn('[Firebase] Error syncing monthly district events to Firestore:', err);
    return { success: false, totalDocs: 0, totalEvents: 0 };
  }
}

/**
 * Subscribes to real-time monthly district-wise events from Firestore.
 */
export function subscribeToMonthDistrictEvents(
  callback: (docs: MonthDistrictEventsDoc[]) => void
): () => void {
  try {
    const colRef = collection(db, 'events_by_month_district');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const docs: MonthDistrictEventsDoc[] = [];
        snapshot.forEach((snap) => {
          docs.push(snap.data() as MonthDistrictEventsDoc);
        });
        docs.sort((a, b) => a.district.localeCompare(b.district));
        callback(docs);
      },
      (err) => {
        console.warn('Real-time month-district subscription notice:', err);
      }
    );
  } catch (err) {
    console.warn('Could not initialize month-district subscription:', err);
    return () => {};
  }
}
