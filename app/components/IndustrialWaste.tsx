'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface IndustrialWasteProps {
  strength: number; // 0 to 4
}

export default function IndustrialWaste({ strength }: IndustrialWasteProps) {
  // More particles and darker themes when habit is closer to 0
  const urgency = 5 - strength;
  const particleCount = urgency * 5;
  const coreScale = 0.9 - (urgency / 10) * 0.15;
  
  return (
    <div className="relative w-full h-[360px] md:h-[400px] flex items-center justify-center overflow-hidden rounded-2xl border border-orange-500/20 bg-orange-950/5 shadow-[inset_0_0_50px_rgba(239,68,68,0.08)] crt-overlay">
      {/* Background Cyberpunk Grid */}
      <div className="absolute inset-0 cyber-grid-ind opacity-50" />

      {/* Flickering Red/Orange Light behind core */}
      <motion.div 
        className="absolute w-72 h-72 rounded-full filter blur-[100px] transition-all duration-300"
        style={{
          background: 'radial-gradient(circle, rgba(239, 68, 68, 0.2) 0%, rgba(249, 115, 22, 0.05) 100%)',
          transform: `scale(${coreScale * 1.3})`
        }}
        animate={{
          opacity: [0.3, 0.6, 0.2, 0.5, 0.3],
          scale: [coreScale * 1.2, coreScale * 1.3, coreScale * 1.15, coreScale * 1.2]
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Rusted Reactor Core */}
      <motion.div
        className="relative z-10 flex flex-col items-center justify-center select-none"
        animate={{
          y: [-4, 4, -4],
          x: [-1, 1, -1, 0],
          skewX: [-0.5, 0.5, -0.5, 0]
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "easeInOut",
          repeatType: "mirror"
        }}
        style={{ transform: `scale(${coreScale})` }}
      >
        {/* Outer rusted boundary */}
        <div className="absolute w-64 h-64 border border-red-500/10 rounded-full" />
        <div className="absolute w-56 h-56 border border-orange-500/10 rounded-full border-dashed" />

        {/* Central Core Globe */}
        <div 
          className="relative w-44 h-44 rounded-full flex flex-col items-center justify-center text-center glass-panel border-orange-500/30 shadow-[0_0_30px_rgba(249,115,22,0.15)]"
          style={{
            background: 'radial-gradient(circle at 70% 70%, rgba(20, 10, 5, 0.95) 0%, rgba(5, 2, 1, 0.98) 100%)'
          }}
        >
          {/* Internal warning flicker */}
          <motion.div
            className="absolute w-36 h-36 rounded-full bg-red-900/10 border border-red-500/5 filter blur-xs"
            animate={{ opacity: [0.4, 0.8, 0.4] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />

          <AlertTriangle className="text-orange-500 w-6 h-6 mb-1 animate-pulse" />
          <span className="text-orange-500/70 text-[10px] font-bold uppercase tracking-widest glitch-text">Reactor Decayed</span>
          <span className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)] glitch-text">
            {strength * 10}%
          </span>
          <span className="text-orange-300/40 text-[9px] uppercase font-semibold tracking-wider mt-2">
            Critically Weak
          </span>
        </div>
      </motion.div>

      {/* Industrial Smoke / Exhaust Particles (Orange/Grey) */}
      {Array.from({ length: particleCount }).map((_, i) => {
        const size = Math.random() * 12 + 6;
        const initialX = Math.random() * 80 - 40;
        const initialY = Math.random() * 50 + 80;
        const duration = Math.random() * 4 + 2;
        const delay = Math.random() * 2;

        return (
          <motion.div
            key={i}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: size,
              height: size,
              background: Math.random() > 0.4 
                ? 'rgba(249, 115, 22, 0.15)'  // Orange ember
                : 'rgba(50, 45, 40, 0.4)',     // Grey soot
              filter: 'blur(3px)',
              x: initialX,
              y: initialY
            }}
            animate={{
              y: -350,
              x: [initialX, initialX + (Math.random() * 80 - 40), initialX],
              scale: [1, 2.5, 4],
              opacity: [0, 0.6, 0.3, 0]
            }}
            transition={{
              duration: duration,
              repeat: Infinity,
              delay: delay,
              ease: "easeOut"
            }}
          />
        );
      })}

      {/* CRT Scanline Indicator */}
      <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1 rounded-full bg-orange-950/60 border border-orange-500/20">
        <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
        <span className="text-[10px] font-bold text-orange-400 uppercase tracking-widest glitch-text">Warning: Habit Deficit</span>
      </div>

      <div className="absolute bottom-4 right-4 text-[9px] text-orange-500/40 uppercase tracking-widest font-mono">
        SYSTEM STABILITY: 404_HABIT_MISSING
      </div>
    </div>
  );
}
