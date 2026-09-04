import React, { useState, useEffect } from 'react';
import {
  Search,
  Calendar,
  Tag,
  Smile,
  Trash2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  BookOpen,
  MessageSquare,
  FileCheck,
  CheckSquare,
  Sparkles,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { JournalEntry } from '../types';

interface PastEntriesProps {
  onSelectEntry: (entry: JournalEntry) => void;
  onNavigateToJournal: () => void;
}

export const PastEntries: React.FC<PastEntriesProps> = ({
  onSelectEntry,
  onNavigateToJournal,
}) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchEntries = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      // Query user's isolated subcollection: users/{userId}/journals
      const journalsRef = collection(db, 'users', user.uid, 'journals');
      const q = query(journalsRef);
      const snapshot = await getDocs(q);

      const items: JournalEntry[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) });
      });

      // Sort client-side by date descending
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setEntries(items);
    } catch (err: any) {
      console.error('Error fetching journal entries:', err);
      setError('Failed to load past journal entries from Firestore.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [user]);

  const handleDelete = async (entryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    if (!window.confirm('Are you sure you want to delete this journal entry?')) return;

    try {
      setDeletingId(entryId);
      await deleteDoc(doc(db, 'users', user.uid, 'journals', entryId));
      setEntries((prev) => prev.filter((item) => item.id !== entryId));
    } catch (err: any) {
      console.error('Error deleting entry:', err);
      alert('Failed to delete entry: ' + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  // Collect all unique themes for filter pills
  const allThemes = Array.from(
    new Set(
      entries.flatMap((e) => e.keyThemes || [])
    )
  ).slice(0, 12);

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      searchQuery === '' ||
      entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (entry.summary && entry.summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (entry.messages &&
        entry.messages.some((m) => m.content.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesTag =
      !selectedTag || (entry.keyThemes && entry.keyThemes.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      {/* Header & Search */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Your Journal Archive</h2>
            <p className="text-xs text-slate-500">
              {entries.length} private {entries.length === 1 ? 'entry' : 'entries'} stored in your encrypted cloud partition
            </p>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="search-journal-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reflections, topics..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>
        </div>

        {/* Theme Tag Filters */}
        {allThemes.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-slate-400 mr-1">Filter by Theme:</span>
              <button
                onClick={() => setSelectedTag(null)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  selectedTag === null
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>
              {allThemes.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    selectedTag === tag
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-900 border-t-transparent mb-3" />
          <p className="text-sm font-semibold text-slate-700">Loading your private archive...</p>
          <p className="text-xs text-slate-400 mt-1">Connecting to authenticated Firestore collection</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-xs text-rose-800">
          <p className="font-bold text-sm">Failed to Load Entries</p>
          <p className="mt-1">{error}</p>
          <button
            onClick={fetchEntries}
            className="mt-3 rounded-lg bg-rose-600 px-3 py-1.5 font-semibold text-white hover:bg-rose-700"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filteredEntries.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-900">
            {searchQuery || selectedTag ? 'No matching entries found' : 'Your Journal is Empty'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || selectedTag
              ? 'Try adjusting your search filter or clear your selected tags.'
              : 'Begin your journaling journey by starting a conversation with Gemini.'}
          </p>
          <button
            id="btn-start-first-entry"
            onClick={onNavigateToJournal}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-all"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>Start a Journal Session</span>
          </button>
        </div>
      )}

      {/* Entries List */}
      <div className="space-y-3">
        {filteredEntries.map((entry) => {
          const isExpanded = expandedEntryId === entry.id;
          const dateStr = new Date(entry.createdAt).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={entry.id}
              className="rounded-2xl border border-slate-200 bg-white shadow-xs transition-all hover:border-slate-300"
            >
              {/* Card Header */}
              <div
                onClick={() => setExpandedEntryId(isExpanded ? null : entry.id)}
                className="cursor-pointer p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-slate-900 hover:text-indigo-900 transition-colors">
                      {entry.title}
                    </h3>
                    {entry.mode && (
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 capitalize">
                        {entry.mode}
                      </span>
                    )}
                    {entry.mood && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 border border-amber-200/60">
                        <Smile className="h-3 w-3 text-amber-600" />
                        {entry.mood}
                      </span>
                    )}
                  </div>

                  {entry.summary && (
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                      {entry.summary}
                    </p>
                  )}

                  {/* Metadata Row */}
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {dateStr}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" /> {entry.messages?.length || 0} messages
                    </span>
                  </div>

                  {/* Themes tags */}
                  {entry.keyThemes && entry.keyThemes.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      {entry.keyThemes.map((t, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions & Expand Chevron */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectEntry(entry);
                    }}
                    title="Open / Resume in Session"
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>Open</span>
                  </button>

                  <button
                    onClick={(e) => handleDelete(entry.id, e)}
                    disabled={deletingId === entry.id}
                    title="Delete Entry"
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>

                  <div className="text-slate-400 p-1">
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </div>
              </div>

              {/* Expanded Detailed Transcript & Summary */}
              {isExpanded && (
                <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-6 space-y-6">
                  {/* Full Summary Box */}
                  {entry.summary && (
                    <div className="rounded-xl border border-indigo-100 bg-white p-4 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                        <FileCheck className="h-4 w-4 text-indigo-600" />
                        <span>Executive Summary & Reflection</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                        {entry.summary}
                      </p>

                      {entry.actionItems && entry.actionItems.length > 0 && (
                        <div className="pt-3 border-t border-slate-100 mt-2">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                            <CheckSquare className="h-3.5 w-3.5 text-emerald-600" />
                            Action Items:
                          </span>
                          <ul className="space-y-1">
                            {entry.actionItems.map((action, i) => (
                              <li key={i} className="text-xs text-slate-600 flex items-start gap-1.5">
                                <span className="text-emerald-500 font-bold">•</span>
                                <span>{action}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Transcript */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      Complete Session Transcript
                    </h4>
                    <div className="space-y-3">
                      {entry.messages?.map((msg) => {
                        const isUser = msg.role === 'user';
                        return (
                          <div
                            key={msg.id}
                            className={`rounded-xl p-3.5 text-xs sm:text-sm ${
                              isUser
                                ? 'bg-white border border-slate-200 text-slate-900'
                                : 'bg-indigo-50/50 border border-indigo-100 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[11px] font-semibold mb-1 opacity-70">
                              <span>{isUser ? 'You' : 'Gemini'}</span>
                              <span>
                                {new Date(msg.timestamp).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                            <div className="prose prose-slate prose-sm max-w-none">
                              <Markdown>{msg.content}</Markdown>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
