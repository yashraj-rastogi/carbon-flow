'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Droplet, Sparkles, Globe, Activity, Plus, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

// Map icon strings to Lucide components
const iconMap: Record<string, any> = {
  Flame,
  Droplet,
  Sparkles,
  Globe,
  Activity
};

interface ActionItem {
  _id: string;
  name: string;
  category: string;
  impactKg: number;
  icon: string;
  description: string;
}

interface ActionGridProps {
  currentHabitStrength: number;
  token: string;
  onActionLogged: (result: any, latencyMs: number) => void;
  statusMessageSetter: (msg: string | null) => void;
}

export default function ActionGrid({
  currentHabitStrength,
  token,
  onActionLogged,
  statusMessageSetter
}: ActionGridProps) {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingId, setLoggingId] = useState<string | null>(null);

  // Fetch actions on mount
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
    } catch (err) {
      console.error('Failed to fetch actions', err);
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
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ actionId: action._id })
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
    } catch (err) {
      console.error(err);
      statusMessageSetter('Failed to log action due to server error');
    } finally {
      setLoggingId(null);
    }
  };

  // Helper to calculate reward preview
  const getRewardPreview = (impactKg: number) => {
    const baseReward = 10.0;
    const habitBonus = 1.5 * currentHabitStrength;
    // impactKg is negative for savings (e.g. -1.2), which boosts reward
    const carbonImpact = -0.15 * (impactKg - 10);
    return parseFloat((baseReward + habitBonus + carbonImpact).toFixed(2));
  };

  // Helper to get category classes
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'gas':
        return {
          border: 'border-orange-500/20 hover:border-orange-500/50',
          glow: 'hover:shadow-[0_0_15px_rgba(249,115,22,0.15)] bg-orange-950/5 hover:bg-orange-950/10',
          text: 'text-orange-400',
          iconBg: 'bg-orange-500/10 border-orange-500/20'
        };
      case 'water':
        return {
          border: 'border-cyan-500/20 hover:border-cyan-500/50',
          glow: 'hover:shadow-[0_0_15px_rgba(6,182,212,0.15)] bg-cyan-950/5 hover:bg-cyan-950/10',
          text: 'text-cyan-400',
          iconBg: 'bg-cyan-500/10 border-cyan-500/20'
        };
      case 'electricity':
        return {
          border: 'border-yellow-500/20 hover:border-yellow-500/50',
          glow: 'hover:shadow-[0_0_15px_rgba(234,179,8,0.15)] bg-yellow-950/5 hover:bg-yellow-950/10',
          text: 'text-yellow-400',
          iconBg: 'bg-yellow-500/10 border-yellow-500/20'
        };
      default: // conservation
        return {
          border: 'border-emerald-500/20 hover:border-emerald-500/50',
          glow: 'hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] bg-emerald-950/5 hover:bg-emerald-950/10',
          text: 'text-emerald-400',
          iconBg: 'bg-emerald-500/10 border-emerald-500/20'
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-5 h-5 text-emerald-400 animate-spin" />
        <span className="text-xs text-zinc-500 ml-2 font-mono">&gt; Synching Action Library...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-xs font-extrabold uppercase tracking-widest text-zinc-400">Micro-Habit Library</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {actions.map((action) => {
          const styles = getCategoryStyles(action.category);
          const Icon = iconMap[action.icon] || Globe;
          const rewardPreview = getRewardPreview(action.impactKg);
          const isLogging = loggingId === action._id;

          return (
            <motion.div
              key={action._id}
              className={`p-4 rounded-xl border ${styles.border} ${styles.glow} transition-all duration-300 flex items-start justify-between gap-4`}
              whileHover={{ y: -2 }}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${styles.iconBg} ${styles.text}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-zinc-100 uppercase tracking-widest">{action.name}</h4>
                </div>
                <p className="text-[10px] text-zinc-400 leading-relaxed mb-3">{action.description}</p>
                
                {/* Metrics Badges */}
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] px-2 py-0.5 rounded border bg-zinc-950/60 font-mono font-bold ${styles.text} border-zinc-800`}>
                    {action.impactKg.toFixed(1)} kg CO₂
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded border bg-zinc-950/60 font-mono font-bold text-emerald-400 border-zinc-800">
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
                title="Log completed action"
              >
                {isLogging ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
