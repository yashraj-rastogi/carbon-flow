'use client';

import React, { useEffect } from 'react';
import { Plus, Activity, ShieldAlert, LogOut, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Hooks
import { useAuth } from '@/hooks/useAuth';
import { useDashboardData } from '@/hooks/useDashboardData';
import { useTelemetry } from '@/hooks/useTelemetry';

// Components
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import AuthScreen from '@/components/features/AuthScreen';
import HabitOasis from '@/components/features/HabitOasis';
import IndustrialWaste from '@/components/features/IndustrialWaste';
import UploadModal from '@/components/features/UploadModal';
import ActionGrid from '@/components/features/ActionGrid';
import TelemetryPanel from '@/components/features/TelemetryPanel';
import MetricsDashboard from '@/components/features/MetricsDashboard';
import SectorBreakdown from '@/components/features/SectorBreakdown';
import HistoryTable from '@/components/features/HistoryTable';

// Constants
import { OASIS_THRESHOLD } from '@/constants';

// Types
import type { ExtractResponse } from '@/types';

/**
 * Main Dashboard page.
 *
 * Composes the authentication screen (when logged out) or the full
 * sustainability dashboard (when authenticated). All business logic
 * is delegated to custom hooks; this component is purely compositional.
 */
export default function Dashboard() {
  const auth = useAuth();
  const dashboard = useDashboardData();
  const { telemetry, recordExtraction, recordActionLog, resetTelemetry, loadTelemetry } =
    useTelemetry();

  const [isUploadOpen, setIsUploadOpen] = React.useState(false);

  // Load telemetry from localStorage on mount
  useEffect(() => {
    loadTelemetry();
  }, [loadTelemetry]);

  // Fetch history when token changes
  useEffect(() => {
    if (auth.token) {
      dashboard.fetchHistory(auth.token);
    }
  }, [auth.token]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Handle logout — reset all state. */
  const handleLogout = () => {
    auth.handleLogout();
    dashboard.resetData();
    resetTelemetry();
  };

  /** Handle successful AI extraction from upload modal. */
  const handleUploadSuccess = (result: Record<string, unknown>, latencyMs: number) => {
    const typedResult = result as unknown as ExtractResponse;
    const points =
      typedResult.mdp?.reward > 0 ? `+${typedResult.mdp.reward}` : typedResult.mdp?.reward;
    dashboard.setStatusMessage(
      `AI Extraction complete! Extracted ${typedResult.co2EmissionsKg} kg CO2 emission. MDP Reward: ${points} points.`
    );

    recordExtraction(latencyMs, typedResult.modelUsed || 'gemini-2.5-flash', {
      promptTokens: typedResult.tokenUsage?.promptTokens || 0,
      candidatesTokens: typedResult.tokenUsage?.candidatesTokens || 0,
    });

    if (auth.token) dashboard.fetchHistory(auth.token);
  };

  /** Handle action logged from ActionGrid. */
  const handleActionLogged = (
    _result: { mdp?: { reward: number; currentStrength: number } },
    latencyMs: number
  ) => {
    recordActionLog(latencyMs);
    if (auth.token) dashboard.fetchHistory(auth.token);
  };

  // Determine theme
  const habitStrength = dashboard.habitState.habitStrength ?? 5;
  const isOasis = habitStrength >= OASIS_THRESHOLD;
  const themeClass = isOasis ? 'theme-oasis' : 'theme-industrial';

  // Loading state (initial mount)
  if (auth.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex flex-col items-center gap-3" role="status" aria-label="Loading application">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
            Synchronizing...
          </span>
        </div>
      </div>
    );
  }

  // Auth screen
  if (!auth.token) {
    return (
      <AuthScreen
        usernameInput={auth.usernameInput}
        isRegistering={auth.isRegistering}
        authError={auth.authError}
        onUsernameChange={auth.setUsernameInput}
        onToggleMode={() => auth.setIsRegistering(!auth.isRegistering)}
        onSubmit={auth.handleAuth}
      />
    );
  }

  // Main dashboard
  return (
    <ErrorBoundary>
      <div className={`min-h-screen relative pb-16 ${themeClass}`}>
        {/* Background and grid pattern */}
        <div
          className="absolute inset-0 bg-transition duration-1000"
          style={{ background: 'var(--background)' }}
          aria-hidden="true"
        />
        <div
          className={`absolute inset-0 bg-transition duration-1000 ${isOasis ? 'cyber-grid-oasis' : 'cyber-grid-ind'}`}
          aria-hidden="true"
        />

        {/* Skip to main content link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-emerald-400 focus:text-zinc-950 focus:rounded-lg focus:text-sm focus:font-bold"
        >
          Skip to main content
        </a>

        {/* Header */}
        <header className="relative z-10 border-b border-zinc-800/20 bg-zinc-950/30 backdrop-blur-md px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400"
              aria-hidden="true"
            >
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-widest text-zinc-100 uppercase">
                Carbon-Flow
              </h1>
              <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-widest">
                Pilot Node: {auth.user?.username}
              </span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/40 border border-zinc-800 text-[11px] font-bold uppercase tracking-widest text-zinc-400 hover:text-rose-400 hover:border-rose-500/20 transition-all"
            aria-label="Log out of Carbon-Flow"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Exit Node</span>
          </button>
        </header>

        {/* Main Grid */}
        <main
          id="main-content"
          className="relative z-10 max-w-6xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8"
        >
          {/* Left Column: Habit Core display */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <section className="glass-panel p-4 rounded-2xl flex flex-col gap-4" aria-label="Decarbonization engine">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                <span>Decarbonization Engine</span>
              </h2>

              {isOasis ? (
                <HabitOasis strength={habitStrength} />
              ) : (
                <IndustrialWaste strength={habitStrength} />
              )}

              {/* Status Message Bar */}
              {dashboard.statusMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-2.5 rounded-lg text-[11px] font-mono border ${
                    isOasis
                      ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-400'
                      : 'bg-orange-950/20 border-orange-500/20 text-orange-400'
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  &gt; {dashboard.statusMessage}
                </motion.div>
              )}
            </section>

            <TelemetryPanel telemetry={telemetry} />
          </div>

          {/* Right Column: Actions and Metrics */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* Command Actions */}
            <section className="glass-panel p-6 rounded-2xl" aria-label="Command actions">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400 mb-4">
                Command Actions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Upload Button */}
                <button
                  onClick={() => setIsUploadOpen(true)}
                  className="group p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/5 hover:bg-emerald-950/15 hover:border-emerald-400 transition-all duration-300 flex items-center justify-between text-left cursor-pointer"
                  aria-label="Upload a utility bill or voice memo for AI extraction"
                >
                  <div>
                    <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest mb-1">
                      Upload Bill/Memo
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Ingest via Gemini multimodal pipeline
                    </p>
                  </div>
                  <div
                    className="w-8 h-8 rounded-lg bg-emerald-400 text-zinc-950 flex items-center justify-center group-hover:scale-105 active:scale-95 transition-all"
                    aria-hidden="true"
                  >
                    <Plus className="w-4 h-4" />
                  </div>
                </button>

                {/* Simulate Omission */}
                <button
                  onClick={() => {
                    if (auth.token) dashboard.simulateOmission(auth.token);
                  }}
                  className="group p-4 rounded-xl border border-orange-500/20 bg-orange-950/5 hover:bg-orange-950/15 hover:border-orange-400 transition-all duration-300 flex items-center justify-between text-left cursor-pointer"
                  aria-label="Simulate a missed tracking cycle to test MDP decay"
                >
                  <div>
                    <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest mb-1">
                      Simulate Omission
                    </h3>
                    <p className="text-[11px] text-zinc-400">
                      Trigger MDP state decay & UI glitch
                    </p>
                  </div>
                  <div
                    className="w-8 h-8 rounded-lg bg-orange-500 text-zinc-950 flex items-center justify-center group-hover:scale-105 active:scale-95 transition-all"
                    aria-hidden="true"
                  >
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                </button>
              </div>
            </section>

            <ActionGrid
              currentHabitStrength={habitStrength}
              token={auth.token}
              onActionLogged={handleActionLogged}
              statusMessageSetter={dashboard.setStatusMessage}
            />

            <MetricsDashboard
              metrics={dashboard.metrics}
              habitStrength={habitStrength}
              isOasis={isOasis}
            />

            <SectorBreakdown
              categoryEmissions={dashboard.metrics.categoryEmissions}
              totalEmissions={dashboard.metrics.totalEmissions}
            />
          </div>
        </main>

        {/* History Log Table */}
        <HistoryTable logs={dashboard.logs} />

        {/* Upload Modal */}
        <AnimatePresence>
          {isUploadOpen && (
            <UploadModal
              isOpen={isUploadOpen}
              onClose={() => setIsUploadOpen(false)}
              token={auth.token}
              onUploadSuccess={handleUploadSuccess}
            />
          )}
        </AnimatePresence>
      </div>
    </ErrorBoundary>
  );
}
