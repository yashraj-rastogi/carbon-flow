'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface HabitOasisProps {
  /** Current habit strength (5–10 for Oasis state). */
  strength: number;
}

/**
 * Oasis-themed visual display for high habit strength (≥ 5).
 * Renders a floating bioluminescent orb with orbital rings,
 * rising particle spores, and a glowing ground line.
 *
 * Decorative elements are hidden from screen readers; the
 * component exposes its meaning via role="img" and aria-label.
 */
export default function HabitOasis({ strength }: HabitOasisProps) {
  const particleCount = strength * 3;
  const coreScale = 0.8 + (strength / 10) * 0.4;
  const glowIntensity = strength * 2.5;

  return (
    <div
      className="relative w-full h-[360px] md:h-[400px] flex items-center justify-center overflow-hidden rounded-2xl border border-emerald-500/20 bg-emerald-950/10 shadow-[inset_0_0_50px_rgba(16,185,129,0.05)]"
      role="img"
      aria-label={`Habit strength visualization: Oasis state at ${strength * 10}% strength. Your ecosystem is thriving.`}
    >
      {/* Background Cyberpunk Grid */}
      <div className="absolute inset-0 cyber-grid-oasis opacity-60" aria-hidden="true" />

      {/* Radial Gradient Glow behind core */}
      <div
        className="absolute w-72 h-72 rounded-full filter blur-[80px] opacity-40 transition-all duration-1000"
        style={{
          background: 'radial-gradient(circle, var(--oasis-neon) 0%, var(--oasis-neon-secondary) 100%)',
          transform: `scale(${coreScale * 1.2})`,
          boxShadow: `0 0 ${glowIntensity}px rgba(16, 185, 129, 0.4)`,
        }}
        aria-hidden="true"
      />

      {/* Floating Oasis Core */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center cursor-pointer select-none"
        animate={{ y: [-12, 12, -12], rotate: [0, 3, -3, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transform: `scale(${coreScale})` }}
        aria-hidden="true"
      >
        {/* Orbital Ring 1 */}
        <motion.div
          className="absolute w-64 h-64 border-2 border-emerald-400/30 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />

        {/* Orbital Ring 2 (Counter-rotated) */}
        <motion.div
          className="absolute w-56 h-56 border border-cyan-400/20 rounded-full"
          style={{ transform: 'rotateX(60deg)' }}
          animate={{ rotate: -360 }}
          transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
        />

        {/* Central Core Globe */}
        <div
          className="relative w-44 h-44 rounded-full flex flex-col items-center justify-center text-center glass-panel border-emerald-400/40 shadow-[0_0_40px_rgba(16,185,129,0.3)]"
          style={{
            background: 'radial-gradient(circle at 30% 30%, rgba(4, 47, 31, 0.8) 0%, rgba(2, 18, 12, 0.95) 100%)',
          }}
        >
          {/* Inner pulsating node */}
          <motion.div
            className="absolute w-36 h-36 rounded-full bg-emerald-500/10 border border-emerald-400/30 filter blur-xs"
            animate={{ scale: [0.9, 1.05, 0.9] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />

          <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">
            Oasis Core
          </span>
          <span className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-cyan-300 drop-shadow-[0_0_15px_rgba(16,185,129,0.4)]">
            {strength * 10}%
          </span>
          <span className="text-emerald-300/80 text-[11px] uppercase font-semibold tracking-wider mt-2">
            Habit Strength
          </span>
        </div>
      </motion.div>

      {/* Bioluminescent Floating Particles */}
      {Array.from({ length: particleCount }).map((_, i) => {
        const size = Math.random() * 6 + 4;
        const initialX = Math.random() * 400 - 200;
        const initialY = Math.random() * 200 + 100;
        const duration = Math.random() * 6 + 4;
        const delay = Math.random() * 3;

        return (
          <motion.div
            key={`oasis-particle-${i}`}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: size,
              height: size,
              background: Math.random() > 0.5 ? 'var(--oasis-neon)' : 'var(--oasis-neon-secondary)',
              filter: 'blur(1px)',
              boxShadow: '0 0 8px currentColor',
              x: initialX,
              y: initialY,
            }}
            animate={{
              y: -350,
              x: [initialX, initialX + (Math.random() * 60 - 30), initialX],
              opacity: [0, 0.8, 0.8, 0],
            }}
            transition={{ duration, repeat: Infinity, delay, ease: 'easeInOut' }}
            aria-hidden="true"
          />
        );
      })}

      {/* Bottom Glowing Ground Lines */}
      <div
        className="absolute bottom-0 w-full h-1/3 bg-gradient-to-t from-emerald-950/40 to-transparent flex items-end justify-center pointer-events-none"
        aria-hidden="true"
      >
        <div className="w-[80%] h-[2px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent filter blur-xs" />
      </div>

      {/* Status Indicator */}
      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/20" aria-hidden="true">
        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[11px] font-bold text-emerald-300 uppercase tracking-widest">
          Flora System Stable
        </span>
      </div>
    </div>
  );
}
