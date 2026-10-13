import React, { useState, useEffect } from 'react';
import { Bookmark, LogIn, LogOut, User as UserIcon } from 'lucide-react';
import { User } from 'firebase/auth';
import { loginWithGoogle, logoutUser, subscribeToAuth } from '../firebase/authService';

interface AuthUserButtonProps {
  onOpenSaved: () => void;
  savedCount: number;
}

export const AuthUserButton: React.FC<AuthUserButtonProps> = ({
  onOpenSaved,
  savedCount,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const unsub = subscribeToAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  const handleSignInGoogle = async () => {
    setIsSigningIn(true);
    setErrorMessage('');
    try {
      await loginWithGoogle();
      setShowModal(false);
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      let msg = err.message || 'Failed to sign in with Google';
      if (err.code === 'auth/unauthorized-domain') {
        msg = `Domain not authorized in Firebase! Please add "${window.location.hostname}" to Firebase Console -> Authentication -> Settings -> Authorized domains.`;
      } else if (err.code === 'auth/operation-not-allowed') {
        msg = 'Google provider is not enabled! Enable "Google" under Firebase Console -> Authentication -> Sign-in method.';
      } else if (err.code === 'auth/popup-blocked') {
        msg = 'Browser popup blocked. Redirecting...';
      }
      setErrorMessage(msg);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignInGuest = async () => {
    setIsSigningIn(true);
    setErrorMessage('');
    try {
      await loginAsGuest();
      setShowModal(false);
    } catch (err: any) {
      console.error('Guest sign-in error:', err);
      let msg = err.message || 'Failed to sign in as guest';
      if (err.code === 'auth/operation-not-allowed') {
        msg = 'Anonymous login is not enabled! Enable "Anonymous" under Firebase Console -> Authentication -> Sign-in method.';
      }
      setErrorMessage(msg);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await logoutUser();
    } catch (err) {
      console.warn('Sign-out error:', err);
    }
  };

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

      {/* Firebase User Authentication */}
      {currentUser ? (
        <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded-lg pl-1.5 pr-2 py-1">
          {currentUser.photoURL ? (
            <img
              src={currentUser.photoURL}
              alt={currentUser.displayName || 'User'}
              className="w-5 h-5 rounded-full object-cover"
            />
          ) : (
            <div className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 flex items-center justify-center text-[10px] font-bold">
              {currentUser.displayName ? currentUser.displayName[0].toUpperCase() : <UserIcon className="w-3 h-3" />}
            </div>
          )}
          <span className="text-xs font-medium text-slate-200 hidden md:inline max-w-[100px] truncate">
            {currentUser.displayName || 'Signed In'}
          </span>
          <button
            onClick={handleSignOut}
            title="Sign out of Firebase"
            className="p-1 text-slate-400 hover:text-rose-400 transition-colors ml-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          disabled={isSigningIn}
          title="Sign in to sync bookmarks and profile"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-900/60 text-xs font-semibold text-emerald-300 hover:text-white transition-all cursor-pointer shadow-sm"
        >
          <LogIn className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">{isSigningIn ? 'Connecting...' : 'Sign In'}</span>
        </button>
      )}

      {/* Sign In Options Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-base text-white">Sign In to KnowaFest</h3>
              <button
                onClick={() => { setShowModal(false); setErrorMessage(''); }}
                className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Choose how you want to sign in to save symposium bookmarks and record your profile:
            </p>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/70 border border-rose-500/50 text-rose-200 text-xs leading-relaxed">
                <p className="font-bold mb-1">⚠️ Sign-in Issue:</p>
                <p>{errorMessage}</p>
              </div>
            )}

            <div className="space-y-2.5 pt-1">
              <button
                onClick={handleSignInGoogle}
                disabled={isSigningIn}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50 shadow"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{isSigningIn ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>

              <button
                onClick={handleSignInGuest}
                disabled={isSigningIn}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <UserIcon className="w-4 h-4 text-emerald-400" />
                <span>{isSigningIn ? 'Connecting...' : 'Continue as Student Guest'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
