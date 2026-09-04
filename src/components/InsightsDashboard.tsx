import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  Brain,
  HelpCircle,
  ShieldCheck,
  Compass,
  ArrowRight,
  BookOpen,
  Calendar,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import {
  collection,
  query,
  getDocs,
  doc,
  setDoc,
} from 'firebase/firestore';
import { JournalEntry, JournalInsightData } from '../types';
import { generateUserInsights } from '../services/api';

interface InsightsDashboardProps {
  onStartSessionWithPrompt: (prompt: string) => void;
  onNavigateToJournal: () => void;
}

export const InsightsDashboard: React.FC<InsightsDashboardProps> = ({
  onStartSessionWithPrompt,
  onNavigateToJournal,
}) => {
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [insightData, setInsightData] = useState<JournalInsightData | null>(null);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load user's journal entries and any existing saved insights
  useEffect(() => {
    async function loadData() {
      if (!user) return;
      setLoadingEntries(true);
      setError(null);

      try {
        // 1. Fetch user's journal entries
        const journalsRef = collection(db, 'users', user.uid, 'journals');
        const journalSnap = await getDocs(query(journalsRef));
        const userJournals: JournalEntry[] = [];
        journalSnap.forEach((d) => {
          userJournals.push({ id: d.id, ...(d.data() as any) });
        });
        userJournals.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setEntries(userJournals);

        // 2. Fetch latest saved insights doc if any
        const insightsRef = collection(db, 'users', user.uid, 'insights');
        const insightsSnap = await getDocs(query(insightsRef));
        if (!insightsSnap.empty) {
          const insightsList: JournalInsightData[] = [];
          insightsSnap.forEach((d) => {
            insightsList.push({ id: d.id, ...(d.data() as any) });
          });
          insightsList.sort(
            (a, b) =>
              new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
          );
          setInsightData(insightsList[0]);
        }
      } catch (err: any) {
        console.error('Error loading insights data:', err);
        setError('Failed to load journal entries for insights analysis.');
      } finally {
        setLoadingEntries(false);
      }
    }

    loadData();
  }, [user]);

  const handleGenerateInsights = async () => {
    if (!user || entries.length === 0) return;

    setGenerating(true);
    setError(null);
    setSavedSuccess(false);

    try {
      // Pass only current user's journal summaries
      const summariesToAnalyze = entries.map((e) => ({
        id: e.id,
        title: e.title,
        summary: e.summary || (e.messages?.[0]?.content?.slice(0, 200) ?? ''),
        keyThemes: e.keyThemes || [],
        mood: e.mood || 'Reflective',
        actionItems: e.actionItems || [],
        createdAt: e.createdAt,
      }));

      const insights = await generateUserInsights(summariesToAnalyze);

      const insightRecord: JournalInsightData = {
        ...insights,
        userId: user.uid,
        generatedAt: new Date().toISOString(),
        journalCountAnalyzed: entries.length,
      };

      // Save insight into isolated user subcollection: users/{userId}/insights/{id}
      const insightDocId = doc(collection(db, 'users', user.uid, 'insights')).id;
      const docRef = doc(db, 'users', user.uid, 'insights', insightDocId);
      await setDoc(docRef, { ...insightRecord, id: insightDocId });

      setInsightData({ ...insightRecord, id: insightDocId });
      setSavedSuccess(true);
    } catch (err: any) {
      console.error('Generate insights error:', err);
      setError(err.message || 'Failed to synthesize journal insights.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header & Generator Banner */}
      <div className="rounded-2xl border border-indigo-200 bg-linear-to-r from-indigo-900 via-slate-900 to-slate-950 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-400/30">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              <span>Personalized Cognitive Synthesis</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
              Journal Insights & Patterns
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Analyzes recurring themes, cognitive reflection patterns, and emotional trajectories
              strictly derived from your private journal history.
            </p>
          </div>

          <div className="shrink-0">
            <button
              id="btn-generate-insights"
              disabled={entries.length === 0 || generating}
              onClick={handleGenerateInsights}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs sm:text-sm font-bold text-slate-900 shadow-md hover:bg-indigo-50 disabled:opacity-40 transition-all sm:w-auto"
            >
              {generating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                  <span>Synthesizing Insights...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  <span>{insightData ? 'Refresh Insights' : 'Generate Insights'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Isolation assurance footer */}
        <div className="mt-6 flex items-center gap-2 border-t border-slate-800 pt-4 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>
            Private isolation active: Analyzing exclusively {entries.length} journal{' '}
            {entries.length === 1 ? 'entry' : 'entries'} for {user?.email}.
          </span>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
          <p className="font-semibold">Analysis Notice</p>
          <p className="mt-0.5">{error}</p>
        </div>
      )}

      {savedSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-800 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>New insights generated and securely saved to your private cloud storage.</span>
        </div>
      )}

      {/* Loading state */}
      {loadingEntries && (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
          <div className="mx-auto h-7 w-7 animate-spin rounded-full border-2 border-slate-900 border-t-transparent mb-3" />
          <p className="text-sm font-semibold text-slate-700">Loading reflection records...</p>
        </div>
      )}

      {/* Empty State when user has no entries yet */}
      {!loadingEntries && entries.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <Brain className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-900">No Journal Entries to Analyze Yet</h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            The Journal Insights dashboard synthesizes patterns from your saved conversations.
            Complete your first journal session to unlock recurring themes and personalized reflection prompts.
          </p>
          <button
            onClick={onNavigateToJournal}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-slate-800 transition-all"
          >
            <BookOpen className="h-4 w-4" />
            <span>Create First Journal Entry</span>
          </button>
        </div>
      )}

      {/* Need generation state */}
      {!loadingEntries && entries.length > 0 && !insightData && !generating && (
        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
          <Sparkles className="mx-auto h-10 w-10 text-indigo-500 mb-3" />
          <h3 className="text-base font-bold text-slate-900">
            Ready to Synthesize {entries.length} Journal {entries.length === 1 ? 'Entry' : 'Entries'}
          </h3>
          <p className="mt-1 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Click "Generate Insights" to discover the recurring themes, reflection habits,
            and tailored questions waiting in your journal history.
          </p>
          <button
            onClick={handleGenerateInsights}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-indigo-700 transition-all"
          >
            <Sparkles className="h-4 w-4 text-amber-300" />
            <span>Synthesize Insights Now</span>
          </button>
        </div>
      )}

      {/* Active Insights View */}
      {insightData && (
        <div className="space-y-6">
          {/* Metadata banner */}
          <div className="flex items-center justify-between rounded-xl bg-slate-100 px-4 py-2 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-slate-500" />
              Generated {new Date(insightData.generatedAt).toLocaleDateString()} at{' '}
              {new Date(insightData.generatedAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <span className="font-semibold text-slate-700">
              Analyzed {insightData.journalCountAnalyzed} entries
            </span>
          </div>

          {/* Emotional Trajectory Narrative */}
          {insightData.emotionalTrends && (
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-2 text-indigo-950 font-bold text-sm">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
                <span>Emotional & Cognitive Trajectory</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {insightData.emotionalTrends}
              </p>
            </div>
          )}

          {/* Section 1: Recurring Themes */}
          {insightData.recurringThemes?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Recurring Life Themes
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
                {insightData.recurringThemes.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <h4 className="text-xs font-bold text-slate-900">{item.theme}</h4>
                        <span
                          className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                            item.frequency === 'High'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : item.frequency === 'Moderate'
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {item.frequency} Presence
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed mb-3">
                        {item.description}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                      <p className="text-[11px] font-semibold text-slate-700 mb-0.5">
                        Guidance for this theme:
                      </p>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {item.actionableAdvice}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 2: Reflection Patterns & Cognitive Styles */}
          {insightData.reflectionPatterns?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-slate-700" />
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                  Reflection Patterns & Mindset Tendencies
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {insightData.reflectionPatterns.map((pat, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-800 text-xs font-bold">
                        {idx + 1}
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">{pat.pattern}</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <span className="font-semibold text-slate-800">Observation: </span>
                      {pat.observation}
                    </p>
                    <div className="rounded-xl bg-indigo-50/60 p-2.5 text-xs text-indigo-900 border border-indigo-100/60">
                      <span className="font-semibold">Reflective Tip: </span>
                      {pat.advice}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 3: Personalized Reflection Prompts */}
          {insightData.personalizedPrompts?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Compass className="h-4 w-4 text-slate-700" />
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                    Personalized Reflection Questions
                  </h3>
                </div>
                <span className="text-xs text-slate-400">Click any prompt to start a session</span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {insightData.personalizedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    id={`personalized-prompt-${idx}`}
                    onClick={() => onStartSessionWithPrompt(prompt)}
                    className="group flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-xs hover:border-slate-400 hover:bg-slate-50/50 transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600">
                        <Sparkles className="h-3 w-3" />
                        <span>Tailored Question {idx + 1}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">
                        "{prompt}"
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-slate-900 transition-colors mt-1" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 4: Growth Horizons */}
          {insightData.growthOpportunities?.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Key Growth Horizons
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {insightData.growthOpportunities.map((opp, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      ✓
                    </span>
                    <span className="mt-0.5">{opp}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
