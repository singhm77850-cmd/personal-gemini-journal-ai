import React from 'react';
import { BookOpen, Sparkles, History, LogOut, ShieldCheck, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ViewTab } from '../types';

interface NavbarProps {
  currentTab: ViewTab;
  setCurrentTab: (tab: ViewTab) => void;
  onOpenSecurityGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenSecurityGuide,
}) => {
  const { user, signOutUser } = useAuth();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold tracking-tight text-slate-900 sm:text-lg">
                Personal Gemini Journal
              </h1>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20 ring-inset">
                <ShieldCheck className="h-3 w-3" />
                Isolated & Encrypted
              </span>
            </div>
            <p className="hidden text-xs text-slate-500 sm:block">
              Private AI-assisted reflection, multi-turn brainstorming & insights
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        {user && (
          <nav className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
            <button
              id="nav-tab-journal"
              onClick={() => setCurrentTab('journal')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all sm:text-sm ${
                currentTab === 'journal'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="h-4 w-4" />
              <span>Active Session</span>
            </button>

            <button
              id="nav-tab-history"
              onClick={() => setCurrentTab('history')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all sm:text-sm ${
                currentTab === 'history'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="h-4 w-4" />
              <span>Past Entries</span>
            </button>

            <button
              id="nav-tab-insights"
              onClick={() => setCurrentTab('insights')}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-all sm:text-sm ${
                currentTab === 'insights'
                  ? 'bg-white text-indigo-900 shadow-xs ring-1 ring-indigo-500/20'
                  : 'text-slate-600 hover:text-indigo-900'
              }`}
            >
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span>Journal Insights</span>
            </button>
          </nav>
        )}

        {/* User Profile & Actions */}
        {user && (
          <div className="flex items-center gap-2">
            <button
              id="btn-security-guide"
              onClick={onOpenSecurityGuide}
              title="Architecture & Security Details"
              className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <HelpCircle className="h-3.5 w-3.5 text-slate-500" />
              <span className="hidden md:inline">Security & Cloud Setup</span>
            </button>

            <div className="hidden flex-col text-right sm:flex">
              <span className="text-xs font-semibold text-slate-800 truncate max-w-[140px]">
                {user.email}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                UID: {user.uid.slice(0, 6)}...
              </span>
            </div>

            <button
              id="btn-sign-out"
              onClick={signOutUser}
              title="Sign Out"
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50 hover:border-rose-200 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
