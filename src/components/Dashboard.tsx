import React, { useState } from 'react';
import { Navbar } from './Navbar';
import { JournalEditor } from './JournalEditor';
import { ConversationView } from './ConversationView';
import { JournalHistory } from './JournalHistory';
import { JournalEntry } from '../types';

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'editor' | 'history' | 'conversation'>('editor');
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);

  const handleEntryStarted = (entry: JournalEntry) => {
    setCurrentEntry(entry);
    setActiveTab('conversation');
  };

  const handleSelectFromHistory = (entry: JournalEntry) => {
    setCurrentEntry(entry);
    setActiveTab('conversation');
  };

  const handleReturnToConversation = () => {
    if (currentEntry) {
      setActiveTab('conversation');
    }
  };

  const handleEntryUpdated = (updated: JournalEntry) => {
    setCurrentEntry(updated);
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col text-[#E0E0E0]">
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => setActiveTab(tab)}
        hasActiveConversation={currentEntry !== null}
        onReturnToConversation={handleReturnToConversation}
      />

      <main className="flex-1 px-4 sm:px-8 py-10 max-w-6xl w-full mx-auto">
        {activeTab === 'editor' && (
          <JournalEditor onEntryStarted={handleEntryStarted} />
        )}

        {activeTab === 'history' && (
          <JournalHistory
            onSelectEntry={handleSelectFromHistory}
            onNewEntryClick={() => setActiveTab('editor')}
          />
        )}

        {activeTab === 'conversation' && currentEntry && (
          <ConversationView
            entry={currentEntry}
            onBack={() => setActiveTab('history')}
            onEntryUpdated={handleEntryUpdated}
          />
        )}
      </main>

      <footer className="border-t border-white/10 bg-[#080808] py-6 text-center text-[10px] uppercase tracking-[0.25em] text-white/30 font-mono">
        <p>VibeCheck &bull; Cryptographic Isolation &bull; Cloud Firestore &bull; Gemini 3.8 Flash</p>
      </footer>
    </div>
  );
};
