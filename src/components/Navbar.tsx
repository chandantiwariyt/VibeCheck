import React from 'react';
import { BookOpen, LogOut, PlusCircle, History, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: 'editor' | 'history' | 'conversation';
  setActiveTab: (tab: 'editor' | 'history') => void;
  hasActiveConversation: boolean;
  onReturnToConversation?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  hasActiveConversation,
  onReturnToConversation,
}) => {
  const { user, signOutUser } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#080808]/95 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-4 sm:px-8">
        {/* Brand */}
        <div className="flex items-center space-x-3.5">
          <div className="w-9 h-9 rounded-sm bg-white flex items-center justify-center shrink-0 shadow-lg">
            <div className="w-5 h-5 border-2 border-black rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className="text-base sm:text-lg font-light tracking-[0.25em] uppercase text-white">
                VibeCheck
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-sm bg-white/5 px-2 py-0.5 text-[9px] font-mono tracking-widest text-indigo-400/80 border border-white/10 uppercase">
                <ShieldCheck className="h-3 w-3 text-indigo-400" />
                Isolated
              </span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 hidden sm:block">
              Vibe &amp; Reflection Journal &bull; Gemini 3.8 Flash
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1.5 sm:space-x-3">
          <button
            id="nav-new-entry-btn"
            onClick={() => setActiveTab('editor')}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[11px] font-medium tracking-[0.15em] uppercase transition-all ${
              activeTab === 'editor'
                ? 'bg-white text-black font-semibold shadow-xs'
                : 'text-white/60 hover:text-white hover:bg-white/5 border border-white/5 hover:border-white/15'
            }`}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Entry</span>
            <span className="sm:hidden">New</span>
          </button>

          {hasActiveConversation && onReturnToConversation && (
            <button
              id="nav-current-session-btn"
              onClick={onReturnToConversation}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[11px] font-medium tracking-[0.15em] uppercase transition-all ${
                activeTab === 'conversation'
                  ? 'bg-white text-black font-semibold shadow-xs'
                  : 'text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Active Resonance</span>
              <span className="sm:hidden">Active</span>
            </button>
          )}

          <button
            id="nav-history-btn"
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-[11px] font-medium tracking-[0.15em] uppercase transition-all ${
              activeTab === 'history'
                ? 'bg-white text-black font-semibold shadow-xs'
                : 'text-white/60 hover:text-white hover:bg-white/5 border border-white/5 hover:border-white/15'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Chronicle</span>
          </button>
        </nav>

        {/* User profile & Logout */}
        <div className="flex items-center space-x-3.5">
          {user && (
            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right leading-tight">
                <div className="text-[9px] text-white/30 uppercase tracking-[0.2em] mb-0.5">
                  Secure Session
                </div>
                <p className="text-xs font-medium text-white/80 truncate max-w-[130px]">
                  {user.displayName || user.email}
                </p>
              </div>
              <div className="w-9 h-9 rounded-full ring-1 ring-white/20 p-0.5 flex items-center justify-center">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-full h-full rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gradient-to-br from-neutral-700 to-neutral-900 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                    {(user.displayName || user.email || 'U')[0]}
                  </div>
                )}
              </div>
            </div>
          )}

          <button
            id="nav-logout-btn"
            onClick={signOutUser}
            title="Terminate Session"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/40 hover:text-rose-400 hover:border-rose-400/30 hover:bg-rose-500/10 transition-colors cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
