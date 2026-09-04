/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AuthScreen } from './components/AuthScreen';
import { JournalChat } from './components/JournalChat';
import { PastEntries } from './components/PastEntries';
import { InsightsDashboard } from './components/InsightsDashboard';
import { SecurityGuideModal } from './components/SecurityGuideModal';
import { JournalEntry, ViewTab } from './types';
import { BookOpen } from 'lucide-react';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState<ViewTab>('journal');
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [isSecurityGuideOpen, setIsSecurityGuideOpen] = useState(false);

  // If Firebase Auth is still initializing state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm mb-3">
            <BookOpen className="h-6 w-6 animate-pulse" />
          </div>
          <p className="text-sm font-semibold text-slate-700">Loading Personal Gemini Journal...</p>
          <p className="text-xs text-slate-400 mt-1">Verifying encrypted security session</p>
        </div>
      </div>
    );
  }

  // If user is not signed in, show the clean Auth Screen
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onOpenSecurityGuide={() => setIsSecurityGuideOpen(true)}
        />
        <main>
          <AuthScreen />
        </main>
        <SecurityGuideModal
          isOpen={isSecurityGuideOpen}
          onClose={() => setIsSecurityGuideOpen(false)}
        />
      </div>
    );
  }

  // Handle opening a past entry in the active chat
  const handleSelectPastEntry = (entry: JournalEntry) => {
    setActiveEntry(entry);
    setCurrentTab('journal');
  };

  // Handle starting a fresh session
  const handleStartNewSession = () => {
    setActiveEntry(null);
    setCurrentTab('journal');
  };

  // Handle starting a session from an Insights prompt
  const handleStartSessionWithPrompt = (prompt: string) => {
    setActiveEntry(null);
    setCurrentTab('journal');
    // Note: The user will see the prompt ready or they can start right away
    setTimeout(() => {
      const textarea = document.getElementById('journal-input-textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.value = prompt;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.focus();
      }
    }, 150);
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-900 flex flex-col">
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenSecurityGuide={() => setIsSecurityGuideOpen(true)}
      />

      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {currentTab === 'journal' && (
          <JournalChat
            activeEntry={activeEntry}
            onSessionSaved={(saved) => setActiveEntry(saved)}
            onStartNewSession={handleStartNewSession}
          />
        )}

        {currentTab === 'history' && (
          <PastEntries
            onSelectEntry={handleSelectPastEntry}
            onNavigateToJournal={() => setCurrentTab('journal')}
          />
        )}

        {currentTab === 'insights' && (
          <InsightsDashboard
            onStartSessionWithPrompt={handleStartSessionWithPrompt}
            onNavigateToJournal={() => setCurrentTab('journal')}
          />
        )}
      </main>

      {/* Security Architecture Modal */}
      <SecurityGuideModal
        isOpen={isSecurityGuideOpen}
        onClose={() => setIsSecurityGuideOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
