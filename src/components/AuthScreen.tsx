import React, { useState } from 'react';
import { BookOpen, ShieldCheck, Lock, Mail, ArrowRight, CheckCircle2, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthScreen: React.FC = () => {
  const { signIn, signUp, resetPassword, error, clearError } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup' | 'reset'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email.trim()) {
      setLocalError('Please enter your email address.');
      return;
    }

    if (mode === 'reset') {
      try {
        setSubmitting(true);
        await resetPassword(email);
        setResetSuccess(true);
      } catch (err: any) {
        // handled in context
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (!password) {
      setLocalError('Please enter your password.');
      return;
    }

    if (mode === 'signup' && password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    if (mode === 'signup' && password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }

    try {
      setSubmitting(true);
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (err: any) {
      // handled in context
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoCredentials = () => {
    setEmail('journaler@example.com');
    setPassword('SecurePassword123!');
    setConfirmPassword('SecurePassword123!');
    setLocalError(null);
    clearError();
  };

  return (
    <div className="flex min-h-[calc(100vh-65px)] items-center justify-center bg-slate-50/70 p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        {/* Main Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <BookOpen className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
              {mode === 'signin' && 'Welcome Back'}
              {mode === 'signup' && 'Create Your Private Journal'}
              {mode === 'reset' && 'Reset Password'}
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              {mode === 'signin' && 'Sign in to access your private conversations and insights.'}
              {mode === 'signup' && 'Isolated Firestore storage secured by authenticated user ID.'}
              {mode === 'reset' && 'Enter your email to receive a password reset link.'}
            </p>
          </div>

          {/* Mode Switcher */}
          {mode !== 'reset' && (
            <div className="mt-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-medium">
              <button
                type="button"
                id="btn-switch-signin"
                onClick={() => {
                  setMode('signin');
                  clearError();
                  setLocalError(null);
                }}
                className={`rounded-lg py-2 transition-all ${
                  mode === 'signin'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                id="btn-switch-signup"
                onClick={() => {
                  setMode('signup');
                  clearError();
                  setLocalError(null);
                }}
                className={`rounded-lg py-2 transition-all ${
                  mode === 'signup'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Feedback messages */}
          {(error || localError) && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-800">
              <p className="font-semibold">Authentication Notice</p>
              <p className="mt-0.5">{error || localError}</p>
            </div>
          )}

          {resetSuccess && (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
              <div className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="h-4 w-4" /> Password Reset Email Sent
              </div>
              <p className="mt-0.5">Please check your inbox for instructions to reset your password.</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Email Address
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="auth-email-input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                />
              </div>
            </div>

            {mode !== 'reset' && (
              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      id="btn-forgot-password"
                      onClick={() => {
                        setMode('reset');
                        setResetSuccess(false);
                        clearError();
                      }}
                      className="text-xs text-slate-600 hover:text-slate-900 underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="auth-password-input"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Confirm Password
                </label>
                <div className="relative mt-1.5">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <input
                    id="auth-confirm-password-input"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>
              </div>
            )}

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={submitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-50 transition-all"
            >
              {submitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <span>
                    {mode === 'signin' && 'Sign In to Journal'}
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'reset' && 'Send Reset Link'}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 p-3 text-center">
            <p className="text-xs text-slate-600">
              Want to try quickly? Use demo autofill to sign in or register:
            </p>
            <button
              type="button"
              id="btn-autofill-demo"
              onClick={handleDemoCredentials}
              className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors shadow-xs"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              Fill Demo Credentials
            </button>
          </div>

          {mode === 'reset' && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setResetSuccess(false);
                  clearError();
                }}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 underline"
              >
                Back to Sign In
              </button>
            </div>
          )}
        </div>

        {/* Security & Privacy Guarantee */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white/70 p-4 text-xs text-slate-600 backdrop-blur-xs">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-900">End-to-End User Isolation</p>
              <p className="mt-0.5 text-slate-500 leading-relaxed">
                All journal entries and summaries are strictly bound to your authenticated Firebase UID.
                Firestore security rules prevent any cross-user access, and Gemini API calls are securely
                handled server-side without exposing API keys.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
