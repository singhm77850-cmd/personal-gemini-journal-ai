import React from 'react';
import { X, ShieldCheck, Lock, Key, Server, Cloud, CheckCircle2 } from 'lucide-react';

interface SecurityGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityGuideModal: React.FC<SecurityGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Security Architecture & Cloud Setup
              </h3>
              <p className="text-xs text-slate-500">
                Production-grade isolation, Secret Manager & Cloud Run configuration
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5 text-xs text-slate-700 leading-relaxed">
          {/* Section 1: Firestore Isolation */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-1.5">
              <Lock className="h-4 w-4 text-emerald-600" />
              <span>1. Strict User Isolation in Firestore</span>
            </div>
            <p className="text-slate-600">
              All journal entries, conversations, and synthesized insights are placed exclusively under{' '}
              <code className="rounded bg-slate-200 px-1 py-0.5 font-mono text-[11px]">
                /users/{'{userId}'}/journals
              </code>{' '}
              and{' '}
              <code className="rounded bg-slate-200 px-1 py-0.5 font-mono text-[11px]">
                /users/{'{userId}'}/insights
              </code>.
            </p>
            <p className="mt-1.5 text-slate-600">
              Our deployed Firestore security rules enforce{' '}
              <code className="font-mono text-emerald-700 font-semibold">
                request.auth.uid == userId
              </code>. Any attempt by an unauthenticated user or another user to read or modify your documents is blocked at the database engine level.
            </p>
          </div>

          {/* Section 2: Server-Side Gemini & Secret Manager */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-1.5">
              <Key className="h-4 w-4 text-amber-600" />
              <span>2. Secret Management & Server-Side AI</span>
            </div>
            <p className="text-slate-600">
              Gemini API keys and credentials are <strong>never</strong> transmitted to or stored in client-side code. All AI calls (multi-turn chat, auto-summarization, journal insights) execute through backend Express endpoints.
            </p>
            <div className="mt-2 rounded-lg bg-slate-900 p-3 text-slate-100 font-mono text-[11px]">
              # Google Cloud Secret Manager setup (CLI):<br />
              gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"<br />
              echo -n "YOUR_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-
            </div>
          </div>

          {/* Section 3: Cloud Run Deployment */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-1.5">
              <Cloud className="h-4 w-4 text-indigo-600" />
              <span>3. Cloud Run Deployment over HTTPS</span>
            </div>
            <p className="text-slate-600">
              The application runs Express + Vite on port 3000, and is built to a single CommonJS bundle for seamless Cloud Run container execution with automatic TLS/HTTPS termination.
            </p>
            <div className="mt-2 rounded-lg bg-slate-900 p-3 text-slate-100 font-mono text-[11px]">
              # Build and deploy to Cloud Run with Secret binding:<br />
              gcloud run deploy personal-gemini-journal \<br />
              &nbsp;&nbsp;--source . \<br />
              &nbsp;&nbsp;--port 3000 \<br />
              &nbsp;&nbsp;--set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest" \<br />
              &nbsp;&nbsp;--allow-unauthenticated
            </div>
          </div>

          {/* Section 4: Prompt Injection Defenses */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-1.5">
              <Server className="h-4 w-4 text-slate-700" />
              <span>4. Prompt Sanitization & Privacy</span>
            </div>
            <p className="text-slate-600">
              System instructions are anchored server-side with structured JSON output schemas, strict temperature bounds, and token ceilings. Data analyzed in the Insights engine only reads records explicitly owned by the requesting user.
            </p>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
