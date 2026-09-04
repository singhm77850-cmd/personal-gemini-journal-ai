import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  CheckCircle2,
  RefreshCw,
  PlusCircle,
  Clock,
  Layers,
  FileCheck,
  Tag,
  Smile,
  CheckSquare,
  Edit3,
} from 'lucide-react';
import Markdown from 'react-markdown';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { ChatMessage, JournalEntry, SummarizeResponse } from '../types';
import { sendChatMessage, summarizeJournalSession } from '../services/api';
import { PromptStarters } from './PromptStarters';

interface JournalChatProps {
  activeEntry: JournalEntry | null;
  onSessionSaved: (savedEntry: JournalEntry) => void;
  onStartNewSession: () => void;
}

export const JournalChat: React.FC<JournalChatProps> = ({
  activeEntry,
  onSessionSaved,
  onStartNewSession,
}) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(activeEntry?.messages || []);
  const [inputText, setInputText] = useState('');
  const [title, setTitle] = useState(activeEntry?.title || 'Reflective Journal Session');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [mode, setMode] = useState<'reflective' | 'brainstorming' | 'planning' | 'freeform'>(
    activeEntry?.mode || 'reflective'
  );
  const [journalContext, setJournalContext] = useState('');
  const [loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [summaryResult, setSummaryResult] = useState<SummarizeResponse | null>(
    activeEntry?.summary
      ? {
          title: activeEntry.title,
          summary: activeEntry.summary,
          keyThemes: activeEntry.keyThemes || [],
          mood: activeEntry.mood || 'Reflective',
          actionItems: activeEntry.actionItems || [],
        }
      : null
  );
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync state if activeEntry changes externally (e.g. user selected from history)
  useEffect(() => {
    if (activeEntry) {
      setMessages(activeEntry.messages || []);
      setTitle(activeEntry.title || 'Reflective Journal Session');
      setMode(activeEntry.mode || 'reflective');
      if (activeEntry.summary) {
        setSummaryResult({
          title: activeEntry.title,
          summary: activeEntry.summary,
          keyThemes: activeEntry.keyThemes || [],
          mood: activeEntry.mood || 'Reflective',
          actionItems: activeEntry.actionItems || [],
        });
      } else {
        setSummaryResult(null);
      }
    }
  }, [activeEntry]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading || summarizing) return;

    setError(null);
    setSaveSuccess(false);

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');

    // If first message and title is default, set an initial title hint
    if (messages.length === 0 && title === 'Reflective Journal Session') {
      const generatedTitle = text.slice(0, 35) + (text.length > 35 ? '...' : '');
      setTitle(generatedTitle);
    }

    try {
      setLoading(true);
      const reply = await sendChatMessage({
        messages: newMessages,
        mode,
        journalContext,
      });

      const modelMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        role: 'model',
        content: reply,
        timestamp: new Date().toISOString(),
      };

      setMessages([...newMessages, modelMessage]);
    } catch (err: any) {
      setError(err.message || 'Failed to receive response from Gemini. Please check connection.');
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSelectPrompt = (prompt: string, selectedMode: typeof mode) => {
    setMode(selectedMode);
    handleSendMessage(prompt);
  };

  const handleCompleteAndSummarize = async () => {
    if (!user || messages.length === 0) return;

    setError(null);
    setSummarizing(true);
    setSaveSuccess(false);

    try {
      // 1. Generate summary via server-side Gemini
      const summaryData = await summarizeJournalSession({
        messages,
        currentTitle: title,
      });

      setSummaryResult(summaryData);
      setTitle(summaryData.title || title);

      // 2. Persist to Cloud Firestore strictly under users/{userId}/journals/{journalId}
      const entryId = activeEntry?.id || doc(collection(db, 'users', user.uid, 'journals')).id;
      const now = new Date().toISOString();

      const journalRecord: JournalEntry = {
        id: entryId,
        userId: user.uid,
        title: summaryData.title || title,
        status: 'completed',
        messages,
        summary: summaryData.summary,
        keyThemes: summaryData.keyThemes,
        mood: summaryData.mood,
        actionItems: summaryData.actionItems,
        mode,
        createdAt: activeEntry?.createdAt || now,
        updatedAt: now,
      };

      const docRef = doc(db, 'users', user.uid, 'journals', entryId);
      await setDoc(docRef, journalRecord, { merge: true });

      setSaveSuccess(true);
      onSessionSaved(journalRecord);
    } catch (err: any) {
      console.error('Save & Summarize error:', err);
      setError(err.message || 'Failed to complete and summarize journal entry.');
    } finally {
      setSummarizing(false);
    }
  };

  const modeDescriptions = {
    reflective: 'Reflective Journaling • Emotional clarity, growth & gentle reframing',
    brainstorming: 'Creative Brainstorming • Divergent ideation, concepts & perspectives',
    planning: 'Strategic Planning • Turning realizations into prioritized action steps',
    freeform: 'Freeform Sounding Board • Open dialogue, active listening & validation',
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      {/* Session Controls Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Title and Status */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {isEditingTitle ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                  autoFocus
                  className="rounded-lg border border-slate-300 px-2 py-1 text-base font-bold text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-slate-900 sm:text-lg">{title}</h2>
                  <button
                    onClick={() => setIsEditingTitle(true)}
                    className="text-slate-400 hover:text-slate-700"
                    title="Edit Session Title"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                </div>
              )}
              {summaryResult && (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20 ring-inset">
                  <CheckCircle2 className="h-3 w-3" /> Saved & Summarized
                </span>
              )}
            </div>
            <p className="mt-0.5 text-xs text-slate-500">{modeDescriptions[mode]}</p>
          </div>

          {/* Actions & Mode Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              {(['reflective', 'brainstorming', 'planning', 'freeform'] as const).map((m) => (
                <button
                  key={m}
                  id={`mode-btn-${m}`}
                  onClick={() => setMode(m)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition-all ${
                    mode === m
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <button
              id="btn-new-session"
              onClick={onStartNewSession}
              title="Start New Clean Session"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <PlusCircle className="h-4 w-4 text-slate-500" />
              <span>New Entry</span>
            </button>

            <button
              id="btn-complete-summarize"
              disabled={messages.length === 0 || summarizing}
              onClick={handleCompleteAndSummarize}
              className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-40 transition-all"
            >
              {summarizing ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Summarizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>Summarize & Save</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Optional Intent/Context Drawer */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs">
          <Layers className="h-3.5 w-3.5 text-slate-400" />
          <span className="font-medium text-slate-600">Focus Intent:</span>
          <input
            type="text"
            placeholder="e.g. Processing work friction, preparing for presentation, or cultivating peace..."
            value={journalContext}
            onChange={(e) => setJournalContext(e.target.value)}
            className="flex-1 bg-transparent border-none text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Error / Success Banners */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
          <p className="font-semibold">Notice</p>
          <p className="mt-0.5">{error}</p>
        </div>
      )}

      {saveSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>
              Journal entry securely saved and isolated under your private Firestore collection!
            </span>
          </div>
        </div>
      )}

      {/* Summary Card if generated */}
      {summaryResult && (
        <div className="rounded-2xl border border-indigo-200 bg-linear-to-b from-indigo-50/70 to-white p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
                <FileCheck className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-indigo-950">Executive Journal Summary</h3>
                <p className="text-xs text-indigo-700">AI synthesized takeaways and themes</p>
              </div>
            </div>
            {summaryResult.mood && (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-800 border border-indigo-200 shadow-xs">
                <Smile className="h-3.5 w-3.5 text-amber-500" />
                Mood: {summaryResult.mood}
              </span>
            )}
          </div>

          <div className="mt-4 text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
            <p className="whitespace-pre-line">{summaryResult.summary}</p>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-indigo-100/80">
            {summaryResult.keyThemes?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                  <Tag className="h-3.5 w-3.5 text-indigo-600" /> Key Themes
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {summaryResult.keyThemes.map((theme, i) => (
                    <span
                      key={i}
                      className="rounded-md bg-indigo-100/80 px-2 py-0.5 text-xs font-medium text-indigo-900"
                    >
                      {theme}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {summaryResult.actionItems?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1.5">
                  <CheckSquare className="h-3.5 w-3.5 text-emerald-600" /> Action Items & Commitments
                </h4>
                <ul className="space-y-1">
                  {summaryResult.actionItems.map((item, i) => (
                    <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prompts for empty state */}
      {messages.length === 0 && (
        <PromptStarters onSelectPrompt={handleSelectPrompt} />
      )}

      {/* Chat Messages Container */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-xs min-h-[360px] flex flex-col">
        {messages.length === 0 ? (
          <div className="my-auto text-center py-10 text-slate-400">
            <Bot className="mx-auto h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-600">Your Journal Space is Ready</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Start by typing your thoughts or select a guided prompt starter above.
              All messages remain private and strictly isolated to your account.
            </p>
          </div>
        ) : (
          <div className="space-y-5 flex-1">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar */}
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${
                      isUser
                        ? 'bg-slate-900 text-white'
                        : 'bg-indigo-600 text-white shadow-xs'
                    }`}
                  >
                    {isUser ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-slate-900 text-white rounded-tr-xs'
                        : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-1.5 opacity-70 text-[11px]">
                      <span className="font-semibold">{isUser ? 'You' : 'Gemini'}</span>
                      <span className="flex items-center gap-1 font-mono text-[10px]">
                        <Clock className="h-3 w-3" />
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div className="prose prose-slate prose-sm max-w-none dark:prose-invert">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="rounded-2xl rounded-tl-xs bg-slate-50 border border-slate-200 p-4 text-xs text-slate-600 flex items-center gap-2">
                  <div className="flex space-x-1">
                    <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce" />
                    <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="h-2 w-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                  <span>Gemini is formulating thoughtful reflections...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input Area */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2 focus-within:border-slate-900 focus-within:bg-white focus-within:ring-1 focus-within:ring-slate-900 transition-all">
            <textarea
              ref={inputRef}
              id="journal-input-textarea"
              rows={3}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Write openly in ${mode} mode... (Press Enter to send, Shift+Enter for new line)`}
              disabled={loading || summarizing}
              className="w-full resize-none bg-transparent px-2 py-1 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />

            <div className="flex items-center justify-between pt-2 px-1">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>{inputText.length} characters</span>
                <span>•</span>
                <span>Gemini 3.6 Flash</span>
              </div>

              <button
                id="btn-send-message"
                type="button"
                disabled={!inputText.trim() || loading || summarizing}
                onClick={() => handleSendMessage()}
                className="flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 disabled:opacity-40 transition-all"
              >
                <span>Send</span>
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
