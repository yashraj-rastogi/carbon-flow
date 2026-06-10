'use client';

import React from 'react';
import { Terminal, Cpu, Zap, Activity } from 'lucide-react';
import type { TelemetryData } from '@/types';
import { CO2_PER_API_CALL_KG } from '@/constants';

interface TelemetryPanelProps {
  telemetry: TelemetryData;
}

/**
 * System telemetry panel displaying API diagnostics.
 * Shows latency, operational carbon footprint, token usage,
 * and the Gemini Flash/Pro cascade ratio.
 *
 * Uses proper ARIA roles for progress bars and descriptive labels
 * for all diagnostic metrics.
 */
export default function TelemetryPanel({ telemetry }: TelemetryPanelProps) {
  const totalTokens = telemetry.totalPromptTokens + telemetry.totalOutputTokens;
  const operationalEmissionsKg = telemetry.totalRequestsCount * CO2_PER_API_CALL_KG;

  const totalModelCalls = telemetry.flashCallsCount + telemetry.proCallsCount;
  const flashPercentage = totalModelCalls > 0 ? (telemetry.flashCallsCount / totalModelCalls) * 100 : 100;
  const proPercentage = totalModelCalls > 0 ? (telemetry.proCallsCount / totalModelCalls) * 100 : 0;

  return (
    <div
      className="glass-panel p-5 rounded-2xl border border-zinc-800 bg-black/40 backdrop-blur-md relative overflow-hidden font-mono text-xs text-emerald-400"
      role="region"
      aria-label="System telemetry diagnostics"
    >
      {/* Decorative scanline overlay */}
      <div className="absolute inset-0 bg-scanlines opacity-10 pointer-events-none" aria-hidden="true" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-500 animate-pulse" aria-hidden="true" />
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-zinc-400">
            System Telemetry Log
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" aria-hidden="true" />
          <span className="text-[11px] uppercase text-emerald-500 font-bold">Diagnostics Online</span>
        </div>
      </div>

      {/* Grid of Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Latency and footprint */}
        <div className="space-y-2.5">
          <div role="group" aria-label="Last action latency">
            <span className="text-zinc-500 uppercase text-[11px] block">Last Action Latency</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Zap className="w-3.5 h-3.5 text-yellow-400" aria-hidden="true" />
              <span className="text-sm font-bold text-zinc-100">
                {telemetry.lastLatencyMs !== null ? `${telemetry.lastLatencyMs} ms` : '0 ms'}
              </span>
            </div>
          </div>

          <div role="group" aria-label="Application operational carbon footprint">
            <span className="text-zinc-500 uppercase text-[11px] block">App Operational Footprint</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Activity className="w-3.5 h-3.5 text-cyan-400" aria-hidden="true" />
              <span className="text-sm font-bold text-zinc-100">
                {operationalEmissionsKg.toFixed(5)}{' '}
                <span className="text-[11px] text-zinc-400">kg CO₂eq</span>
              </span>
            </div>
            <span className="text-[11px] text-zinc-500 block mt-0.5">
              (Calculated at 0.15g per API call)
            </span>
          </div>
        </div>

        {/* Token consumption */}
        <div className="space-y-2.5">
          <div role="group" aria-label="Gemini token usage">
            <span className="text-zinc-500 uppercase text-[11px] block font-bold">
              Gemini Token Economics
            </span>
            <div className="mt-1 space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-400">Prompt Tokens:</span>
                <span className="text-zinc-300 font-bold">
                  {telemetry.totalPromptTokens.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-400">Output Tokens:</span>
                <span className="text-zinc-300 font-bold">
                  {telemetry.totalOutputTokens.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between border-t border-zinc-900/60 pt-1 text-[11px] font-bold">
                <span className="text-zinc-400">Total Tokens:</span>
                <span className="text-emerald-400">{totalTokens.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Model Cascade Ratio */}
      <div className="mt-4 border-t border-zinc-900 pt-3">
        <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1.5">
          <span className="flex items-center gap-1">
            <Cpu className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
            <span>GEMINI API CASCADE RATIO</span>
          </span>
          <span className="font-bold text-zinc-400">
            {telemetry.flashCallsCount} Flash / {telemetry.proCallsCount} Pro
          </span>
        </div>

        {/* Cascade Bar */}
        <div
          className="w-full h-2 rounded bg-zinc-950 flex overflow-hidden border border-zinc-900"
          role="group"
          aria-label="Gemini model usage distribution"
        >
          <div
            className="h-full bg-emerald-400 transition-all duration-500"
            style={{ width: `${flashPercentage}%` }}
            role="progressbar"
            aria-valuenow={Math.round(flashPercentage)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Gemini 2.5 Flash: ${flashPercentage.toFixed(0)}%`}
          />
          <div
            className="h-full bg-cyan-400 transition-all duration-500"
            style={{ width: `${proPercentage}%` }}
            role="progressbar"
            aria-valuenow={Math.round(proPercentage)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Gemini 2.5 Pro: ${proPercentage.toFixed(0)}%`}
          />
        </div>

        {/* Legends */}
        <div className="flex items-center gap-4 text-[11px] mt-1.5 text-zinc-500">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded bg-emerald-400" aria-hidden="true" />
            <span>2.5 Flash ({flashPercentage.toFixed(0)}%)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded bg-cyan-400" aria-hidden="true" />
            <span>2.5 Pro ({proPercentage.toFixed(0)}%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
