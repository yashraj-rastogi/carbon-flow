'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';
import type { UserProfile } from '@/types';

interface AuthScreenProps {
  usernameInput: string;
  isRegistering: boolean;
  authError: string | null;
  onUsernameChange: (value: string) => void;
  onToggleMode: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

/**
 * Authentication screen component.
 * Renders the login/register form with accessible form controls,
 * proper label associations, and ARIA error announcements.
 */
export default function AuthScreen({
  usernameInput,
  isRegistering,
  authError,
  onUsernameChange,
  onToggleMode,
  onSubmit,
}: AuthScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-sans relative">
      <div className="absolute inset-0 cyber-grid-oasis opacity-10" aria-hidden="true" />

      <motion.div
        className="w-full max-w-md glass-panel border border-zinc-800 bg-zinc-900/60 p-8 rounded-2xl relative z-10"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        role="region"
        aria-label="Authentication"
      >
        <div className="flex justify-center mb-6">
          <div
            className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
            aria-hidden="true"
          >
            <Globe className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <h1 className="text-2xl font-extrabold text-center text-zinc-100 tracking-tight">
          Carbon-Flow
        </h1>
        <p className="text-xs text-center text-zinc-500 mt-1 mb-8">
          Autonomous Sustainability Gamification Platform
        </p>

        {authError && (
          <div
            role="alert"
            className="mb-4 px-3 py-2 text-xs text-rose-400 bg-rose-950/20 border border-rose-500/30 rounded-lg"
          >
            {authError}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4" aria-label="Login form">
          <div>
            <label
              htmlFor="auth-username"
              className="block text-[11px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5"
            >
              Agent Username
            </label>
            <input
              id="auth-username"
              type="text"
              value={usernameInput}
              onChange={(e) => onUsernameChange(e.target.value)}
              placeholder="Enter pilot username"
              className="w-full px-4 py-2.5 rounded-lg bg-zinc-950/50 border border-zinc-800 focus:border-emerald-500/60 text-zinc-100 text-sm focus:outline-none transition-all placeholder:text-zinc-600"
              required
              autoComplete="username"
              maxLength={50}
              aria-describedby={authError ? 'auth-error' : undefined}
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-lg text-xs font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)]"
          >
            {isRegistering ? 'Register Carbon Agent' : 'Authorize Credentials'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs">
          <button
            type="button"
            onClick={onToggleMode}
            className="text-zinc-500 hover:text-emerald-400 transition-colors"
          >
            {isRegistering
              ? 'Already registered? Log in'
              : 'First time? Initialize new profile'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
