'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Droplet, Sparkles, Globe, Activity, Plus, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import type { LucideProps } from 'lucide-react';
import type { ActionItem } from '@/types';
import { MDP_BASE_REWARD, MDP_HABIT_BONUS_MULTIPLIER, MDP_CARBON_PENALTY_RATE, MDP_CARBON_BASELINE_KG } from '@/constants';

/** Map icon strings from the database to Lucide components. */
const iconMap: Record<string, React.ComponentType<LucideProps>> = {
  Flame,
  Droplet,
  Sparkles,
  Globe,
  Activity,
};

interface ActionGridProps {
  currentHabitStrength: number;
  token: string;
  onActionLogged: (result: { mdp?: { reward: number; currentStrength: number } }, latencyMs: number) => void;
  statusMessageSetter: (msg: string | null) => void;
}

/**
 * Micro-habit action grid component.
 * Displays curated sustainability actions that users can log with a single tap.
 * Each card shows a reward preview calculated from the current MDP state.
 *
 * Accessible: uses role="list"/"listitem" semantics, descriptive aria-labels
 * on action buttons, and aria-busy for loading states.
 */
export default function ActionGrid({
  currentHabitStrength,
  token,
  onActionLogged,
  statusMessageSetter,
}: ActionGridProps) {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingId, setLoggingId] = useState<string | null>(null);

  useEffect(() => {
    fetchActions();
  }, []);

  const fetchActions = async () => {
    try {
      const res = await fetch('/api/actions');
      const data = await res.json();
      if (res.ok) {
        setActions(data.actions || []);
      }
    } catch (error: unknown) {
      console.error('Failed to fetch actions', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogAction = async (action: ActionItem) => {
    if (!token || loggingId) return;
    setLoggingId(action._id);
    statusMessageSetter(`Logging micro-habit: ${action.name}...`);

    const startTime = Date.now();
    try {
      const res = await fetch('/api/actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ actionId: action._id }),
      });
      const data = await res.json();
      const latencyMs = Date.now() - startTime;

      if (res.ok) {
        const points = data.mdp?.reward > 0 ? `+${data.mdp.reward}` : data.mdp?.reward;
        statusMessageSetter(
          `Logged action! Saved ${Math.abs(action.impactKg)} kg CO2. MDP Reward: ${points} points. Habit level is now ${data.mdp.currentStrength}/10.`
        );
        onActionLogged(data, latencyMs);
      } else {
        statusMessageSetter(`Error: ${data.error || 'Failed to log action'}`);
      }
    } catch (error: unknown) {
      console.error(error);
      statusMessageSetter('Failed to log action due to server error');
    } finally {
      setLoggingId(null);
    }
  };

  /** Calculate MDP reward preview for a given action impact. */
  const getRewardPreview = (impactKg: number): number => {
    const habitBonus = MDP_HABIT_BONUS_MULTIPLIER * currentHabitStrength;
    const carbonImpact = -MDP_CARBON_PENALTY_RATE * (impactKg - MDP_CARBON_BASELINE_KG);
    return parseFloat((MDP_BASE_REWARD + habitBonus + carbonImpact).toFixed(2));
  };

  /** Get category-specific styling classes. */
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'gas':
        return {
          border: 'border-orange-500/20 hover:border-orange-500/50',
          glow: 'hover:shadow-[0_0_15px_rgba(249,115,22,0.15)] bg-orange-950/5 hover:bg-orange-950/10',
          text: 'text-orange-400',
          iconBg: 'bg-orange-500/10 border-orange-500/20',
        };
      case 'water':
        return {
          border: 'border-cyan-500/20 hover:border-cyan-500/50',
          glow: 'hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] bg-cyan-950/5 hover:bg-cyan-950/10',
          text: 'text-cyan-400',
          iconBg: 'bg-cyan-500/10 border-cyan-500/20',
        };
      case 'electricity':
        return {
          border: 'border-yellow-500/20 hover:border-yellow-500/50',
          glow: 'hover:shadow-[0_0_15px_rgba(234,179,8,0.15)] bg-yellow-950/5 hover:bg-yellow-950/10',
          text: 'text-yellow-400',
          iconBg: 'bg-yellow-500/10 border-yellow-500/20',
        };
      default:
        return {
          border: 'border-emerald-500/20 hover:border-emerald-500/50',
          glow: 'hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-emerald-950/5 hover:bg-emerald-950/10',
          text: 'text-emerald-400',
          iconBg: 'bg-emerald-500/10 border-emerald-500/20',
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8" aria-busy="true" aria-label="Loading actions">
        <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" aria-hidden="true" />
        <span className="text-xs text-zinc-400 ml-2 font-mono">&gt; Synching Action Library...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" role="region" aria-label="Micro-habit library">
      <h2 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400">
        Micro-Habit Library
      </h2>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4" role="list">
        {actions.map((action) => {
          const styles = getCategoryStyles(action.category);
          const Icon = iconMap[action.icon] || Globe;
          const rewardPreview = getRewardPreview(action.impactKg);
          const isLogging = loggingId === action._id;

          return (
            <motion.li
              key={action._id}
              className={`p-4 rounded-xl border ${styles.border} ${styles.glow} transition-all duration-300 flex items-start justify-between gap-4`}
              whileHover={{ y: -2 }}
              role="listitem"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center border ${styles.iconBg} ${styles.text}`}
                    aria-hidden="true"
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest">
                    {action.name}
                  </h3>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed mb-3">
                  {action.description}
                </p>

                {/* Metrics Badges */}
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded border bg-zinc-950/60 font-mono font-bold ${styles.text} border-zinc-800`}
                  >
                    {action.impactKg.toFixed(1)} kg CO₂
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded border bg-zinc-950/60 font-mono font-bold text-emerald-400 border-zinc-800">
                    +{rewardPreview} pts preview
                  </span>
                </div>
              </div>

              {/* Log Action Button */}
              <button
                onClick={() => handleLogAction(action)}
                disabled={!!loggingId}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-900 active:scale-95 disabled:opacity-50 text-zinc-400 hover:text-emerald-400 ${
                  isLogging ? 'text-emerald-400 border-emerald-500/50' : ''
                }`}
                aria-label={`Log completed action: ${action.name}`}
                aria-busy={isLogging}
              >
                {isLogging ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                ) : (
                  <Plus className="w-4 h-4" aria-hidden="true" />
                )}
              </button>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
