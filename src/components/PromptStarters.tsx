import React from 'react';
import { Compass, Lightbulb, Heart, Zap, Target } from 'lucide-react';

interface PromptStartersProps {
  onSelectPrompt: (prompt: string, mode: 'reflective' | 'brainstorming' | 'planning' | 'freeform') => void;
}

export const PromptStarters: React.FC<PromptStartersProps> = ({ onSelectPrompt }) => {
  const starters = [
    {
      icon: Heart,
      title: 'Daily Reflection & Gratitude',
      prompt: 'What was a meaningful moment or unexpected win today, and how did it make me feel?',
      mode: 'reflective' as const,
      color: 'text-rose-600 bg-rose-50 border-rose-100',
    },
    {
      icon: Compass,
      title: 'Untangling Overwhelm',
      prompt: 'I feel overwhelmed by several competing priorities right now. Help me untangle what matters most.',
      mode: 'reflective' as const,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      icon: Lightbulb,
      title: 'Creative Brainstorming',
      prompt: "I want to brainstorm new creative directions or solutions for a project I'm working on.",
      mode: 'brainstorming' as const,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-100',
    },
    {
      icon: Target,
      title: 'Strategic Decision Clarifier',
      prompt: 'I need to make an important decision and want to explore the trade-offs, risks, and second-order effects.',
      mode: 'planning' as const,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      icon: Zap,
      title: 'Energy & Habit Audit',
      prompt: 'What activities drained or energized me this week, and what subtle adjustments can I make?',
      mode: 'reflective' as const,
      color: 'text-cyan-600 bg-cyan-50 border-cyan-100',
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Journal & Brainstorming Prompts</h3>
          <p className="text-xs text-slate-500">Select a prompt starter to kick off a guided multi-turn dialogue</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {starters.map((starter, index) => {
          const Icon = starter.icon;
          return (
            <button
              key={index}
              id={`prompt-starter-${index}`}
              onClick={() => onSelectPrompt(starter.prompt, starter.mode)}
              className="group flex flex-col justify-between rounded-xl border border-slate-200 p-3.5 text-left transition-all hover:border-slate-400 hover:shadow-xs bg-slate-50/50 hover:bg-white"
            >
              <div>
                <div className="flex items-center gap-2">
                  <div className={`flex h-6 w-6 items-center justify-center rounded-md border ${starter.color}`}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-800">{starter.title}</span>
                </div>
                <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  "{starter.prompt}"
                </p>
              </div>
              <span className="mt-3 text-[11px] font-medium text-slate-400 group-hover:text-slate-900 transition-colors">
                Start conversation →
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
