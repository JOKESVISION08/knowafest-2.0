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

  useEffect(() => {
    const unsub = subscribeToAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      console.warn('Google sign-in canceled or blocked:', err);
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
            className="p-1 text-slate-400 hover:text-rose-400 transition-colors ml-1"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={handleSignIn}
          disabled={isSigningIn}
          title="Sign in with Google to sync bookmarks across devices"
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/40 hover:bg-emerald-900/60 text-xs font-semibold text-emerald-300 hover:text-white transition-all cursor-pointer shadow-sm"
        >
          <LogIn className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">{isSigningIn ? 'Connecting...' : 'Sign In'}</span>
        </button>
      )}
    </div>
  );
};
