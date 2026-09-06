import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Lightbulb,
  FileText,
  MessageCircle,
  Trash2,
  ExternalLink,
  Tag,
  Calendar,
  AlertTriangle,
  Loader2,
  PlusCircle,
  Star,
  Smile,
} from 'lucide-react';
import { JournalEntry, ReflectionMode } from '../types';
import { useAuth } from '../context/AuthContext';
import { fetchUserEntries, deleteJournalEntry, updateJournalEntry } from '../services/journalService';

interface JournalHistoryProps {
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntryClick: () => void;
}

export const JournalHistory: React.FC<JournalHistoryProps> = ({
  onSelectEntry,
  onNewEntryClick,
}) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'starred' | ReflectionMode>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadEntries = async () => {
    if (!user) return;
    setLoading(true);
    setErrorMessage(null);
    try {
      const data = await fetchUserEntries(user.uid);
      setEntries(data);
    } catch (err: any) {
      console.error('Error fetching journal history:', err);
      setErrorMessage(err?.message || 'Failed to load journal history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEntries();
  }, [user]);

  const handleToggleStar = async (entry: JournalEntry, e: React.MouseEvent) => {
    e.stopPropagation();
    const isStarred = (entry.tags || []).includes('starred');
    const newTags = isStarred
      ? (entry.tags || []).filter((t) => t !== 'starred')
      : [...(entry.tags || []).filter((t) => t !== 'starred'), 'starred'].slice(0, 5);

    try {
      await updateJournalEntry(entry.id, { tags: newTags });
      setEntries((prev) =>
        prev.map((item) => (item.id === entry.id ? { ...item, tags: newTags } : item))
      );
    } catch (err: any) {
      console.error('Error toggling star on entry:', err);
      setErrorMessage(err?.message || 'Failed to update star in Firestore.');
    }
  };

  const handleDelete = async (entryId: string) => {
    setDeletingId(entryId);
    setConfirmDeleteId(null);
    try {
      await deleteJournalEntry(entryId);
      setEntries((prev) => prev.filter((e) => e.id !== entryId));
    } catch (err: any) {
      console.error('Error deleting entry:', err);
      setErrorMessage(err?.message || 'Failed to delete entry.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredEntries = entries.filter((entry) => {
    const matchesFilter =
      selectedFilter === 'all'
        ? true
        : selectedFilter === 'starred'
        ? (entry.tags || []).includes('starred')
        : entry.mode === selectedFilter;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      entry.title.toLowerCase().includes(query) ||
      entry.content.toLowerCase().includes(query) ||
      entry.summary.toLowerCase().includes(query) ||
      entry.tags.some((tag) => tag.toLowerCase().includes(query));
    return matchesFilter && matchesSearch;
  });

  const getModeIcon = (mode: ReflectionMode) => {
    switch (mode) {
      case 'reflection':
        return <Sparkles className="h-3.5 w-3.5 text-amber-500" />;
      case 'brainstorm':
        return <Lightbulb className="h-3.5 w-3.5 text-amber-600" />;
      case 'summary':
        return <FileText className="h-3.5 w-3.5 text-blue-500" />;
      case 'conversation':
        return <MessageCircle className="h-3.5 w-3.5 text-emerald-500" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 text-left">
      {/* Page Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[10px] uppercase tracking-[0.3em] text-white/30 font-mono">
            Enduring Archive
          </div>
          <h2 className="font-serif italic text-3xl sm:text-4xl font-normal text-white">
            Journal Chronicle
          </h2>
          <p className="text-xs sm:text-sm text-white/40 font-light">
            All your private reflections and dialogues saved securely in Cloud Firestore.
          </p>
        </div>

        <button
          onClick={onNewEntryClick}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-black shadow-xl hover:bg-neutral-200 transition-all cursor-pointer self-start sm:self-auto"
        >
          <PlusCircle className="h-4 w-4" />
          <span>New Reflection</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
          <input
            type="text"
            id="journal-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries by title, thoughts, synthesis, or tag..."
            className="w-full rounded-2xl border border-white/10 bg-[#0C0C0C] pl-11 pr-4 py-3 text-xs text-white placeholder:text-white/20 focus:outline-hidden focus:border-white/30 focus:ring-1 focus:ring-white/20 shadow-xl font-sans"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'starred', 'reflection', 'brainstorm', 'summary', 'conversation'] as const).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => setSelectedFilter(tab)}
                className={`inline-flex items-center gap-1.5 capitalize px-3.5 py-2.5 rounded-xl text-[11px] font-medium tracking-wider uppercase transition-all shrink-0 cursor-pointer ${
                  selectedFilter === tab
                    ? 'bg-white text-black font-semibold shadow-md'
                    : 'bg-[#080808] border border-white/10 text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab === 'starred' && <Star className={`h-3 w-3 ${selectedFilter === tab ? 'fill-black' : 'text-amber-400'}`} />}
                <span>{tab}</span>
              </button>
            )
          )}
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs text-rose-300 font-mono">
          {errorMessage}
        </div>
      )}

      {/* Entries List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-3 text-white/30">
          <Loader2 className="h-7 w-7 animate-spin text-indigo-400" />
          <p className="text-xs font-mono uppercase tracking-widest text-white/30">Loading your reflections from Firestore...</p>
        </div>
      ) : filteredEntries.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/15 bg-[#080808] p-12 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white/40">
            <FileText className="h-6 w-6" />
          </div>
          <h3 className="font-serif italic text-xl font-normal text-white">
            {searchQuery || selectedFilter !== 'all'
              ? 'No matching reflections found'
              : 'Chronicle is empty'}
          </h3>
          <p className="text-xs text-white/40 max-w-sm mx-auto font-light leading-relaxed">
            {searchQuery || selectedFilter !== 'all'
              ? 'Try adjusting your search keywords or category filters.'
              : 'Begin your first journal entry or brainstorm session to converse with Gemini.'}
          </p>
          <button
            onClick={onNewEntryClick}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-black hover:bg-neutral-200 transition-colors cursor-pointer mt-2"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Write First Entry</span>
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredEntries.map((entry) => (
            <div
              key={entry.id}
              className="group rounded-3xl border border-white/10 bg-[#080808] p-6 shadow-xl hover:border-white/20 transition-all text-left relative overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-mono tracking-wider uppercase bg-white/5 border border-white/10 text-white/70 px-2.5 py-0.5 rounded-sm">
                      {getModeIcon(entry.mode)}
                      {entry.mode}
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] font-mono text-indigo-400/80 tracking-wider uppercase">
                      <Calendar className="h-3 w-3" />
                      {new Date(entry.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleToggleStar(entry, e)}
                      title={(entry.tags || []).includes('starred') ? 'Remove Star' : 'Star Reflection'}
                      className="ml-auto inline-flex items-center gap-1 text-[10px] font-mono text-white/40 hover:text-amber-300 transition-colors p-1 cursor-pointer"
                    >
                      <Star className={`h-3.5 w-3.5 ${(entry.tags || []).includes('starred') ? 'fill-amber-400 text-amber-400' : 'text-white/30 hover:text-white'}`} />
                    </button>
                  </div>

                  <h3
                    onClick={() => onSelectEntry(entry)}
                    className="font-serif italic text-xl sm:text-2xl font-normal text-white hover:text-white/80 cursor-pointer transition-colors leading-snug"
                  >
                    {entry.title}
                  </h3>

                  <div className="h-px w-8 bg-white/10 group-hover:w-20 group-hover:bg-indigo-400/40 transition-all duration-500" />

                  {/* Summary or Content Excerpt */}
                  {entry.summary ? (
                    <div className="rounded-2xl bg-[#0C0C0C] border border-white/10 p-4 text-xs text-white/80 leading-relaxed font-serif italic">
                      <span className="font-semibold text-indigo-300 mr-2 uppercase text-[10px] font-mono tracking-wider">
                        Gemini Synthesis:
                      </span>
                      {entry.summary}
                    </div>
                  ) : (
                    <p className="text-xs text-white/50 line-clamp-2 leading-relaxed font-sans font-light">
                      {entry.content}
                    </p>
                  )}

                  {/* Tags & Mood Badges */}
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {entry.tags.map((tag, idx) => {
                        const isMood = tag.startsWith('mood:');
                        const isStarredTag = tag === 'starred';
                        if (isStarredTag) return null; // rendered as icon above
                        return (
                          <span
                            key={idx}
                            className={`inline-flex items-center gap-1 text-[9px] font-mono uppercase px-2.5 py-0.5 rounded-sm border ${
                              isMood
                                ? 'bg-indigo-500/10 border-indigo-400/30 text-indigo-300'
                                : 'bg-white/5 border-white/10 text-white/40'
                            }`}
                          >
                            {isMood ? (
                              <Smile className="h-2.5 w-2.5 text-indigo-400" />
                            ) : (
                              <Tag className="h-2.5 w-2.5 text-indigo-400/80" />
                            )}
                            {isMood ? tag.replace('mood:', '') : tag}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col items-center sm:items-end gap-2.5 shrink-0 pt-2 sm:pt-0">
                  <button
                    onClick={() => onSelectEntry(entry)}
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 border border-white/10 px-4 py-2.5 text-[11px] font-medium tracking-[0.15em] uppercase text-white hover:bg-white hover:text-black transition-all cursor-pointer"
                  >
                    <span>Open Dialogue</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={() => setConfirmDeleteId(entry.id)}
                    disabled={deletingId === entry.id}
                    title="Delete Entry"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/30 hover:text-rose-400 hover:border-rose-400/30 hover:bg-rose-500/10 transition-colors cursor-pointer"
                  >
                    {deletingId === entry.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-white/40" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Delete Banner */}
              {confirmDeleteId === entry.id && (
                <div className="mt-5 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-rose-300 font-mono">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                    <span>Are you sure? This entry and dialogue will be permanently erased.</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-white/70 hover:bg-white/20 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition-colors font-medium tracking-wider uppercase text-[10px]"
                    >
                      Confirm Erase
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
