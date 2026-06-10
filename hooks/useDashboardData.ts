'use client';

import { useState, useCallback } from 'react';
import type { CarbonLogEntry, HabitStateData, DashboardMetrics } from '@/types';
import { MDP_INITIAL_STRENGTH } from '@/constants';

/** Default habit state for users without data. */
const DEFAULT_HABIT_STATE: HabitStateData = {
  habitStrength: MDP_INITIAL_STRENGTH,
  history: [],
};

/** Default dashboard metrics. */
const DEFAULT_METRICS: DashboardMetrics = {
  totalEmissions: 0,
  categoryEmissions: { electricity: 0, gas: 0, water: 0, voice_log: 0, receipt: 0 },
  logCount: 0,
};

/** Return type for the useDashboardData hook. */
export interface UseDashboardDataReturn {
  logs: CarbonLogEntry[];
  habitState: HabitStateData;
  metrics: DashboardMetrics;
  loading: boolean;
  statusMessage: string | null;
  setStatusMessage: (msg: string | null) => void;
  fetchHistory: (token: string) => Promise<void>;
  simulateOmission: (token: string) => Promise<void>;
  resetData: () => void;
}

/**
 * Custom hook managing dashboard data: carbon logs, habit state, and metrics.
 * Encapsulates all data fetching and MDP simulation logic.
 */
export function useDashboardData(): UseDashboardDataReturn {
  const [logs, setLogs] = useState<CarbonLogEntry[]>([]);
  const [habitState, setHabitState] = useState<HabitStateData>(DEFAULT_HABIT_STATE);
  const [metrics, setMetrics] = useState<DashboardMetrics>(DEFAULT_METRICS);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  /** Fetch history, logs, and metrics from the API. */
  const fetchHistory = useCallback(async (token: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/history', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
        setHabitState(data.habitState || DEFAULT_HABIT_STATE);
        setMetrics(data.metrics || DEFAULT_METRICS);
      }
    } catch (error: unknown) {
      console.error('Failed to fetch history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Simulate an MDP omission (missed tracking cycle). */
  const simulateOmission = useCallback(async (token: string) => {
    setStatusMessage('Simulating omission (missed tracking cycle)...');
    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action: 'omission' }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage(
          `MDP transition complete! Reward: ${data.mdp.reward} points. Habit Strength: ${data.mdp.currentStrength}/10`
        );
      } else {
        setStatusMessage(`Error: ${data.error}`);
      }
    } catch {
      setStatusMessage('Simulate request failed');
    }
  }, []);

  /** Reset all dashboard data to defaults (e.g., on logout). */
  const resetData = useCallback(() => {
    setLogs([]);
    setHabitState(DEFAULT_HABIT_STATE);
    setMetrics(DEFAULT_METRICS);
    setStatusMessage(null);
  }, []);

  return {
    logs,
    habitState,
    metrics,
    loading,
    statusMessage,
    setStatusMessage,
    fetchHistory,
    simulateOmission,
    resetData,
  };
}
