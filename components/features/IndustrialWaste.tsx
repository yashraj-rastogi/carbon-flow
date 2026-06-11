'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface IndustrialWasteProps {
  /** Current habit strength (0–4 for Industrial state). */
  strength: number;
}

function getPseudoRandom(index: number, seed: number): number {
  const x = Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Industrial-waste-themed visual for low habit strength (< 5).
 * Renders a glitching reactor core with smoke particles,
 * CRT scanline overlay, and warning indicators.
 *
 * Decorative elements are hidden from screen readers; the
 * component exposes its meaning via role="img" and aria-label.
 */
export default function IndustrialWaste({ strength }: IndustrialWasteProps) {
  const shouldReduceMotion = useReducedMotion();
  const urgency = 5 - strength;
  const particleCount = shouldReduceMotion ? 0 : urgency * 5;
  const coreScale = 0.9 - (urgency / 10) * 0.15;

  return (
    <div
      className="relative w-full h-[360px] md:h-[400px] flex items-center justify-center overflow-hidden rounded-2xl border border-orange-500/20 bg-orange-950/5 shadow-[inset_0_0_50px_rgba(239,68,68,0.08)] crt-overlay"
      role="img"
      aria-label={`Habit strength visualization: Industrial Waste state at ${strength * 10}% strength. Warning — habit deficit detected.`}
    >
      {/* Background Cyberpunk Grid */}
      <div className="absolute inset-0 cyber-grid-ind opacity-50" aria-hidden="true" />

      {/* Flickering Red/Orange Light behind core */}
      <motion.div
        className="absolute w-72 h-72 rounded-full filter blur-[100px] transition-all duration-300"
        style={{
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, rgba(249, 115, 22, 0.05) 100%)',
          transform: `scale(${coreScale * 1.3})`,
        }}
        animate={shouldReduceMotion ? { opacity: 0.5, scale: coreScale * 1.2 } : {
          opacity: [0.3, 0.6, 0.2, 0.5, 0.3],
          scale: [coreScale * 1.2, coreScale * 1.3, coreScale * 1.15, coreScale * 1.2],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
        aria-hidden="true"
      />

      {/* Rusted Reactor Core */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center select-none"
        animate={shouldReduceMotion ? { y: 0, x: 0, skewX: 0 } : { y: [-4, 4, -4], x: [-1, 1, -1, 0], skewX: [-0.5, 0.5, -0.5, 0] }}
        transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', repeatType: 'mirror' }}
        style={{ transform: `scale(${coreScale})` }}
        aria-hidden="true"
      >
        {/* Outer rusted boundary */}
        <div className="absolute w-64 h-64 border border-red-500/10 rounded-full" />
        <div className="absolute w-56 h-56 border border-orange-500/10 rounded-full border-dashed" />

        {/* Central Core Globe */}
        <div
          className="relative w-44 h-44 rounded-full flex flex-col items-center justify-center text-center glass-panel border-orange-500/30 shadow-[0_0_30px_rgba(249,115,22,0.15)]"
          style={{
            background: 'radial-gradient(circle at 70% 70%, rgba(20, 10, 5, 0.95) 0%, rgba(5, 2, 1, 0.98) 100%)',
          }}
        >
          {/* Internal warning flicker */}
          <motion.div
            className="absolute w-36 h-36 rounded-full bg-red-900/10 border border-red-500/5 filter blur-xs"
            animate={{ opacity: shouldReduceMotion ? 0.8 : [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />

          <AlertTriangle className="text-orange-500 w-6 h-6 mb-1 animate-pulse" />
          <span className="text-orange-500/70 text-[11px] font-bold uppercase tracking-widest glitch-text">
            Reactor Decayed
          </span>
          <span className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)] glitch-text">
            {strength * 10}%
          </span>
          <span className="text-orange-300/40 text-[11px] uppercase font-semibold tracking-wider mt-2">
            Critically Weak
          </span>
        </div>
      </motion.div>

      {/* Industrial Smoke / Exhaust Particles */}
      {Array.from({ length: particleCount }).map((_, i) => {
        const size = getPseudoRandom(i, 1) * 12 + 6;
        const initialX = getPseudoRandom(i, 2) * 80 - 40;
        const initialY = getPseudoRandom(i, 3) * 50 + 80;
        const duration = getPseudoRandom(i, 4) * 4 + 2;
        const delay = getPseudoRandom(i, 5) * 2;
        const bgCheck = getPseudoRandom(i, 6);
        const background = bgCheck > 0.4 ? 'rgba(249, 115, 22, 0.15)' : 'rgba(50, 45, 40, 0.4)';
        const xOffset = getPseudoRandom(i, 7) * 80 - 40;

        return (
          <motion.div
            key={`ind-particle-${i}`}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: size,
              height: size,
              background,
              filter: 'blur(3px)',
              x: initialX,
              y: initialY,
            }}
            animate={{
              y: -350,
              x: [initialX, initialX + xOffset, initialX],
              scale: [1, 2.5, 4],
              opacity: [0, 0.6, 0.3, 0],
            }}
            transition={{ duration, repeat: Infinity, delay, ease: 'easeOut' }}
            aria-hidden="true"
          />
        );
      })}

      {/* CRT Scanline Indicator */}
      <div
        className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-orange-950/60 border border-orange-500/20"
        aria-hidden="true"
      >
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
        <span className="text-[11px] font-bold text-orange-400 uppercase tracking-widest glitch-text">
          Warning: Habit Deficit
        </span>
      </div>

      <div className="absolute bottom-4 right-4 text-[11px] text-orange-500/40 uppercase tracking-widest font-mono" aria-hidden="true">
        SYSTEM STABILITY: 404_HABIT_MISSING
      </div>
    </div>
  );
}
