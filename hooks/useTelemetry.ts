'use client';

import { useState, useCallback } from 'react';
import type { TelemetryData } from '@/types';
import { STORAGE_KEY_TELEMETRY } from '@/constants';

/** Default telemetry state for a fresh session. */
const DEFAULT_TELEMETRY: TelemetryData = {
  lastLatencyMs: null,
  totalPromptTokens: 0,
  totalOutputTokens: 0,
  flashCallsCount: 0,
  proCallsCount: 0,
  totalRequestsCount: 0,
};

/** Return type for the useTelemetry hook. */
export interface UseTelemetryReturn {
  telemetry: TelemetryData;
  recordExtraction: (latencyMs: number, modelUsed: string, tokenUsage: { promptTokens: number; candidatesTokens: number }) => void;
  recordActionLog: (latencyMs: number) => void;
  resetTelemetry: () => void;
  loadTelemetry: () => void;
}

/**
 * Custom hook managing Gemini API telemetry data.
 * Persists telemetry to localStorage and provides update helpers
 * for extraction and action-log events.
 */
export function useTelemetry(): UseTelemetryReturn {
  const [telemetry, setTelemetry] = useState<TelemetryData>(DEFAULT_TELEMETRY);

  /** Load persisted telemetry from localStorage (call once on mount). */
  const loadTelemetry = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TELEMETRY);
    if (saved) {
      try {
        setTelemetry(JSON.parse(saved) as TelemetryData);
      } catch {
        // Corrupted — use defaults
      }
    }
  }, []);

  /** Record telemetry for an AI extraction event. */
  const recordExtraction = useCallback(
    (latencyMs: number, modelUsed: string, tokenUsage: { promptTokens: number; candidatesTokens: number }) => {
      setTelemetry((prev) => {
        const isPro = modelUsed === 'gemini-2.5-pro';
        const updated: TelemetryData = {
          lastLatencyMs: latencyMs,
          totalPromptTokens: prev.totalPromptTokens + (tokenUsage.promptTokens || 0),
          totalOutputTokens: prev.totalOutputTokens + (tokenUsage.candidatesTokens || 0),
          flashCallsCount: prev.flashCallsCount + (isPro ? 0 : 1),
          proCallsCount: prev.proCallsCount + (isPro ? 1 : 0),
          totalRequestsCount: prev.totalRequestsCount + 1,
        };
        localStorage.setItem(STORAGE_KEY_TELEMETRY, JSON.stringify(updated));
        return updated;
      });
    },
    []
  );

  /** Record telemetry for a simple action log event (no AI tokens). */
  const recordActionLog = useCallback((latencyMs: number) => {
    setTelemetry((prev) => {
      const updated: TelemetryData = {
        ...prev,
        lastLatencyMs: latencyMs,
        totalRequestsCount: prev.totalRequestsCount + 1,
      };
      localStorage.setItem(STORAGE_KEY_TELEMETRY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  /** Reset telemetry to defaults (e.g., on logout). */
  const resetTelemetry = useCallback(() => {
    setTelemetry(DEFAULT_TELEMETRY);
    localStorage.removeItem(STORAGE_KEY_TELEMETRY);
  }, []);

  return { telemetry, recordExtraction, recordActionLog, resetTelemetry, loadTelemetry };
}
