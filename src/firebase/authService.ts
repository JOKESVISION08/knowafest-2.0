import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from './config';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous: boolean;
  providerId?: string;
  lastSignInTime?: string;
  lastSignInTimestamp?: number;
  createdAt?: string;
  userAgent?: string;
}

// Ensure user profile document exists in Firestore and record every sign-in
export async function syncUserProfile(user: User): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    const nowIso = new Date().toISOString();
    const nowTime = Date.now();
    const provider = user.providerData && user.providerData[0] ? user.providerData[0].providerId : (user.isAnonymous ? 'anonymous' : 'google.com');

    const profileData: any = {
      uid: user.uid,
      email: user.email || (user.isAnonymous ? 'guest@knowafest.local' : 'student@knowafest.local'),
      displayName: user.displayName || (user.isAnonymous ? 'Guest Student' : 'Student User'),
      photoURL: user.photoURL || '',
      isAnonymous: user.isAnonymous,
      providerId: provider,
      lastSignInTime: nowIso,
      lastSignInTimestamp: nowTime,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'web-client',
    };

    if (!snap.exists()) {
      profileData.createdAt = user.metadata.creationTime || nowIso;
      profileData.createdTimestamp = nowTime;
    }

    await setDoc(userRef, profileData, { merge: true });
    console.log(`[Firebase] User sign-in recorded in <knowafest> database: ${user.uid} (${profileData.email})`);
  } catch (err) {
    console.warn('[Firebase] Could not sync user document to Firestore:', err);
  }
}

export async function checkRedirectAuthResult(): Promise<User | null> {
  try {
    const res = await getRedirectResult(auth);
    if (res && res.user) {
      await syncUserProfile(res.user);
      return res.user;
    }
  } catch (err) {
    console.warn('Redirect sign-in check notice:', err);
  }
  return null;
}

export async function loginWithGoogle(): Promise<User | void> {
  googleProvider.setCustomParameters({ prompt: 'select_account' });

  // Standalone installed PWA check
  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true);

  if (isStandalone) {
    // Mobile installed PWAs handle redirects much better than popup windows
    await signInWithRedirect(auth, googleProvider);
    return;
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    await syncUserProfile(result.user);
    return result.user;
  } catch (error: any) {
    // If popup was blocked or closed by installed browser window, fallback to redirect
    if (
      error.code === 'auth/popup-blocked' ||
      error.code === 'auth/popup-closed-by-user' ||
      error.code === 'auth/cancelled-popup-request'
    ) {
      console.info('Popup blocked/closed, redirecting for sign-in...');
      await signInWithRedirect(auth, googleProvider);
      return;
    }
    console.error('Google sign-in error:', error);
    throw error;
  }
}

export async function loginAsGuest(): Promise<User> {
  try {
    const result = await signInAnonymously(auth);
    await syncUserProfile(result.user);
    return result.user;
  } catch (error: any) {
    console.error('Anonymous sign-in error:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      syncUserProfile(user);
    }
    callback(user);
  });
}
