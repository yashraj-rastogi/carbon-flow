'use client';

import React from 'react';
import { Mic, Square, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface VoiceRecorderProps {
  /** Whether a recording is currently in progress. */
  isRecording: boolean;
  /** Duration of the current recording in seconds. */
  recordingDuration: number;
  /** The recorded audio blob, or null if none exists. */
  audioBlob: Blob | null;
  /** Starts a new voice recording. */
  onStartRecording: () => void;
  /** Stops the current recording. */
  onStopRecording: () => void;
}

/**
 * Formats a duration in seconds to an MM:SS string.
 */
function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60).toString().padStart(2, '0');
  const s = (sec % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * Voice recording controls and preview.
 * Handles start/stop recording UI, live waveform animation,
 * and audio playback preview of recorded memos.
 */
export default function VoiceRecorder({
  isRecording,
  recordingDuration,
  audioBlob,
}: VoiceRecorderProps): React.ReactElement | null {
  const waveHeights = [20, 36, 16, 42, 28, 24];

  return (
    <>
      {/* Recording in progress */}
      {isRecording && (
        <div
          className="h-40 rounded-xl border border-rose-500/20 bg-rose-950/5 flex flex-col items-center justify-center text-center p-4"
          role="status"
          aria-label={`Recording in progress: ${formatDuration(recordingDuration)}`}
        >
          <div className="flex items-center gap-1.5 mb-3" aria-hidden="true">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`wave-${i}`}
                className="w-1 bg-rose-500 rounded-full"
                style={{ height: 16 }}
                animate={{ height: [8, waveHeights[i % waveHeights.length] || 16, 8] }}
                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.08 }}
              />
            ))}
          </div>
          <span className="text-xs text-rose-300 font-bold mb-1">Recording Audio...</span>
          <span className="text-lg font-mono text-rose-400 font-semibold">
            {formatDuration(recordingDuration)}
          </span>
        </div>
      )}

      {/* Recorded audio preview */}
      {!isRecording && audioBlob && (
        <div className="h-40 rounded-xl border border-cyan-500/20 bg-cyan-950/5 flex flex-col items-center justify-center text-center p-4">
          <CheckCircle2 className="w-8 h-8 text-cyan-400 mb-2 animate-pulse" aria-hidden="true" />
          <span className="text-xs text-cyan-300 font-bold mb-1">Voice Log Compiled</span>
          <audio
            src={URL.createObjectURL(audioBlob)}
            controls
            className="h-8 max-w-full scale-90 opacity-80 mt-2"
            aria-label="Preview of recorded voice memo"
          />
        </div>
      )}

      {/* Record button (shown in the parent grid) */}
      {/* The button is rendered by the parent UploadModal for layout consistency */}
    </>
  );
}

/**
 * Returns the appropriate button props and label for the record toggle.
 */
export function getRecordButtonProps(
  isRecording: boolean,
  audioBlob: Blob | null,
  onStartRecording: () => void,
  onStopRecording: () => void
): { onClick: () => void; label: string; Icon: typeof Mic | typeof Square; className: string } {
  const baseClass =
    'py-3 px-4 rounded-xl text-xs font-bold border transition-all duration-300 flex flex-col items-center gap-2';

  if (isRecording) {
    return {
      onClick: onStopRecording,
      label: 'Stop recording voice memo',
      Icon: Square,
      className: `${baseClass} bg-rose-500/10 border-rose-500/30 text-rose-300 animate-pulse`,
    };
  }

  if (audioBlob) {
    return {
      onClick: onStartRecording,
      label: 'Re-record voice memo',
      Icon: Mic,
      className: `${baseClass} bg-cyan-500/10 border-cyan-500/30 text-cyan-300`,
    };
  }

  return {
    onClick: onStartRecording,
    label: 'Record a voice memo',
    Icon: Mic,
    className: `${baseClass} bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700`,
  };
}
