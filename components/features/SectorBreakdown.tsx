'use client';

import React from 'react';
import { Sparkles, Flame, Droplet, Mic } from 'lucide-react';
import type { CategoryEmissions } from '@/types';

/** Configuration for each utility sector display. */
const SECTOR_CONFIG = {
  electricity: { label: 'Electricity', icon: Sparkles, color: 'text-yellow-400' },
  gas: { label: 'Natural Gas', icon: Flame, color: 'text-orange-400' },
  water: { label: 'Water Resources', icon: Droplet, color: 'text-cyan-400' },
  voice_log: { label: 'Voice Actions', icon: Mic, color: 'text-emerald-400' },
} as const;

interface SectorBreakdownProps {
  categoryEmissions: CategoryEmissions;
  totalEmissions: number;
}

/**
 * Emissions breakdown by utility sector with visual progress bars.
 * Each sector shows its icon, label, proportional bar, and kg value.
 * Accessible with proper ARIA labels and progressbar roles.
 */
export default function SectorBreakdown({ categoryEmissions, totalEmissions }: SectorBreakdownProps) {
  return (
    <div className="glass-panel p-4 rounded-xl" role="region" aria-label="Emissions by utility sector">
      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest block mb-4">
        Emissions by Utility Sector
      </span>
      <div className="space-y-3">
        {Object.entries(SECTOR_CONFIG).map(([key, details]) => {
          const amount = categoryEmissions?.[key as keyof CategoryEmissions] || 0;
          const percent = totalEmissions > 0 ? (amount / totalEmissions) * 100 : 0;
          const Icon = details.icon;

          return (
            <div key={key} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-zinc-400">
                <Icon className={`w-3.5 h-3.5 ${details.color}`} aria-hidden="true" />
                <span>{details.label}</span>
              </div>
              <div className="flex items-center gap-4">
                <div
                  className="w-24 bg-zinc-900 h-1.5 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={Math.round(percent)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${details.label}: ${percent.toFixed(0)}% of total emissions`}
                >
                  <div
                    className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="font-bold text-zinc-200 w-12 text-right">
                  {amount.toFixed(1)} kg
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
