'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Mic, Square, X, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { MAX_FILE_SIZE_BYTES, ACCEPTED_FILE_TYPES, ACCEPTED_FILE_INPUT } from '@/constants';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  onUploadSuccess: (result: Record<string, unknown>, latencyMs: number) => void;
}

/**
 * Modal for ingesting carbon entries via file upload or voice recording.
 *
 * Accessibility features:
 * - role="dialog" with aria-modal="true" and aria-labelledby
 * - Focus trap: Tab/Shift+Tab cycle stays inside the modal
 * - Escape key closes the modal
 * - Focus restoration to triggering element on close
 * - aria-live="assertive" on error messages
 * - aria-label on all icon-only buttons
 */
export default function UploadModal({ isOpen, onClose, token, onUploadSuccess }: UploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Store the previously focused element and focus the close button on open
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement;
      // Focus the close button after animation
      const timer = setTimeout(() => closeButtonRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Focus trap and Escape key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Close on Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      // Focus trap on Tab
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Restore focus on close
  useEffect(() => {
    if (!isOpen && previouslyFocusedRef.current) {
      previouslyFocusedRef.current.focus();
      previouslyFocusedRef.current = null;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);
    if (e.dataTransfer.files?.[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files?.[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (!(ACCEPTED_FILE_TYPES as readonly string[]).includes(file.type)) {
      setError('Unsupported file type. Please upload a JPEG, PNG, or PDF.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('File size too large. Maximum size is 8MB.');
      return;
    }
    setSelectedFile(file);
    setAudioBlob(null);
  };

  const startRecording = async () => {
    setError(null);
    setSelectedFile(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch {
      setError('Microphone access denied or unsupported.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const formatDuration = (sec: number): string => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleUpload = async () => {
    if (!selectedFile && !audioBlob) {
      setError('Please select a file or record a voice memo first.');
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    if (selectedFile) {
      formData.append('file', selectedFile);
    } else if (audioBlob) {
      formData.append('file', audioBlob, `voice-log-${Date.now()}.webm`);
    }

    const startTime = Date.now();
    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();
      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(result.error || 'Failed to extract bill information.');
      }

      onUploadSuccess(result, latencyMs);
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Server error. Please try again.';
      setError(message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={modalRef}
        className="w-full max-w-lg overflow-hidden rounded-2xl glass-panel border border-emerald-500/20 bg-zinc-950 p-6 relative"
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        style={{
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 20px rgba(16, 185, 129, 0.05)',
        }}
      >
        {/* Close Button */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 transition-colors p-1 rounded-full hover:bg-zinc-900"
          aria-label="Close upload modal"
        >
          <X className="w-5 h-5" aria-hidden="true" />
        </button>

        <h2 id="upload-modal-title" className="text-xl font-bold text-zinc-100 mb-2">
          Ingest Carbon Entry
        </h2>
        <p className="text-xs text-zinc-400 mb-6">
          Upload a utility bill (electricity/gas/water) or record a voice note detailing your
          actions.
        </p>

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-4 px-3 py-2 text-xs text-rose-400 bg-rose-950/20 border border-rose-500/30 rounded-lg"
          >
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* File Upload Tab */}
          <button
            type="button"
            className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all duration-300 flex flex-col items-center gap-2 ${
              selectedFile
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
            onClick={() => fileInputRef.current?.click()}
            aria-label={selectedFile ? `Change file (current: ${selectedFile.name})` : 'Upload a file'}
          >
            <Upload className="w-5 h-5" aria-hidden="true" />
            <span>{selectedFile ? 'Change File' : 'Upload File'}</span>
          </button>

          {/* Voice Record Tab */}
          <button
            type="button"
            className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all duration-300 flex flex-col items-center gap-2 ${
              isRecording
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 animate-pulse'
                : audioBlob
                  ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                  : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
            onClick={isRecording ? stopRecording : startRecording}
            aria-label={
              isRecording
                ? 'Stop recording voice memo'
                : audioBlob
                  ? 'Re-record voice memo'
                  : 'Record a voice memo'
            }
          >
            {isRecording ? (
              <Square className="w-5 h-5 text-rose-400" aria-hidden="true" />
            ) : (
              <Mic className="w-5 h-5" aria-hidden="true" />
            )}
            <span>
              {isRecording ? 'Stop Recording' : audioBlob ? 'Re-record Voice' : 'Record Voice'}
            </span>
          </button>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={ACCEPTED_FILE_INPUT}
          className="hidden"
          aria-hidden="true"
          tabIndex={-1}
        />

        {/* Drag and Drop Zone */}
        {!isRecording && !audioBlob && (
          <div
            className={`h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center p-4 transition-all ${
              dragActive
                ? 'border-emerald-500 bg-emerald-950/10'
                : selectedFile
                  ? 'border-emerald-500/40 bg-zinc-900/10'
                  : 'border-zinc-800 bg-zinc-900/10 hover:border-zinc-700'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                fileInputRef.current?.click();
              }
            }}
            role="button"
            tabIndex={0}
            aria-label={selectedFile ? `Selected file: ${selectedFile.name}. Click or press Enter to change.` : 'Drop zone: drag and drop a file here, or press Enter to browse'}
            style={{ cursor: 'pointer' }}
          >
            {selectedFile ? (
              <div className="flex flex-col items-center">
                <FileText className="w-10 h-10 text-emerald-400 mb-2 animate-bounce" aria-hidden="true" />
                <span className="text-xs font-semibold text-emerald-300 max-w-[200px] truncate">
                  {selectedFile.name}
                </span>
                <span className="text-[11px] text-zinc-400 mt-1">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <Upload className="w-8 h-8 text-zinc-400 mb-2" aria-hidden="true" />
                <span className="text-xs text-zinc-300">
                  Drag & drop your bill here, or{' '}
                  <span className="text-emerald-400">browse</span>
                </span>
                <span className="text-[11px] text-zinc-400 mt-1">
                  Supports PDF, JPG, PNG, WEBP (Max 8MB)
                </span>
              </div>
            )}
          </div>
        )}

        {/* Recording Overlay */}
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
                  animate={{ height: [8, Math.random() * 32 + 12, 8] }}
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

        {/* Recorded Audio Preview */}
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

        {/* Action buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleUpload}
            disabled={uploading || (!selectedFile && !audioBlob)}
            className="px-6 py-2.5 rounded-lg text-xs font-bold text-zinc-950 bg-emerald-400 hover:bg-emerald-300 disabled:bg-zinc-800 disabled:text-zinc-600 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            aria-busy={uploading}
          >
            {uploading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                <span>AI Ingesting...</span>
              </>
            ) : (
              <span>Process Carbon Entry</span>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
