'use client';

import Odometer from '@/components/ui/Odometer';
import type { DashboardMetrics } from '@/types';

interface MetricsDashboardProps {
  metrics: DashboardMetrics;
  habitStrength: number;
  isOasis: boolean;
}

/**
 * Metrics dashboard displaying key performance indicators.
 * Shows total CO₂ logged (with odometer animation), current habit level,
 * and total log count in accessible card format.
 */
export default function MetricsDashboard({ metrics, habitStrength, isOasis }: MetricsDashboardProps) {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 gap-4"
      role="region"
      aria-label="Dashboard metrics"
    >
      {/* Total Emissions card */}
      <div className="glass-panel p-4 rounded-xl flex flex-col justify-between" role="group" aria-label="Total CO2 logged">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
          Total CO2 Logged
        </span>
        <div className="mt-2 flex items-baseline">
          <Odometer value={metrics.totalEmissions || 0} />
          <span className="text-[11px] font-bold text-zinc-400 ml-1">kg</span>
        </div>
      </div>

      {/* Habit Strength card */}
      <div className="glass-panel p-4 rounded-xl flex flex-col justify-between" role="group" aria-label={`Habit level: ${habitStrength} out of 10`}>
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
          Habit Level
        </span>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`text-2xl font-extrabold ${isOasis ? 'text-emerald-400' : 'text-orange-500'}`}
          >
            {habitStrength}
          </span>
          <span className="text-[11px] text-zinc-400">/ 10</span>
        </div>
      </div>

      {/* Log Count card */}
      <div className="glass-panel p-4 rounded-xl flex flex-col justify-between col-span-2 sm:col-span-1" role="group" aria-label={`Log count: ${metrics.logCount || 0} entries`}>
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">
          Log Count
        </span>
        <div className="mt-2">
          <span className="text-2xl font-extrabold text-zinc-100">
            {metrics.logCount || 0}
          </span>
          <span className="text-[11px] font-bold text-zinc-400 ml-1">entries</span>
        </div>
      </div>
    </div>
  );
}
