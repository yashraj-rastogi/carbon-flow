'use client';

import React, { useRef, useEffect, useCallback } from 'react';
import { Upload, X, RefreshCw } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { ACCEPTED_FILE_INPUT } from '@/constants';
import { useFileUpload } from '@/hooks/useFileUpload';
import FileDropZone from '@/components/features/upload/FileDropZone';
import VoiceRecorder, { getRecordButtonProps } from '@/components/features/upload/VoiceRecorder';

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
export default function UploadModal({
  isOpen,
  onClose,
  token,
  onUploadSuccess,
}: UploadModalProps): React.ReactElement | null {
  const {
    selectedFile,
    audioBlob,
    dragActive,
    isRecording,
    recordingDuration,
    uploading,
    error,
    fileInputRef,
    handleDrag,
    handleDrop,
    handleFileChange,
    startRecording,
    stopRecording,
    handleUpload,
  } = useFileUpload();

  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Store the previously focused element and focus the close button on open
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedRef.current = document.activeElement as HTMLElement;
      const timer = setTimeout(() => closeButtonRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Focus trap and Escape key handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

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

  const prefersReducedMotion = useReducedMotion();

  // Restore focus on close
  useEffect(() => {
    if (!isOpen && previouslyFocusedRef.current) {
      previouslyFocusedRef.current.focus();
      previouslyFocusedRef.current = null;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const recordButton = getRecordButtonProps(
    isRecording,
    audioBlob,
    startRecording,
    stopRecording
  );
  const RecordIcon = recordButton.Icon;

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
        initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95, y: prefersReducedMotion ? 0 : 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95, y: prefersReducedMotion ? 0 : 20 }}
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

        {/* Error display */}
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-4 px-3 py-2 text-xs text-rose-400 bg-rose-950/20 border border-rose-500/30 rounded-lg"
          >
            {error}
          </div>
        )}

        {/* Mode selection buttons */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            type="button"
            className={`py-3 px-4 rounded-xl text-xs font-bold border transition-all duration-300 flex flex-col items-center gap-2 ${
              selectedFile
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:border-zinc-700'
            }`}
            onClick={() => fileInputRef.current?.click()}
            aria-label={
              selectedFile
                ? `Change file (current: ${selectedFile.name})`
                : 'Upload a file'
            }
          >
            <Upload className="w-5 h-5" aria-hidden="true" />
            <span>{selectedFile ? 'Change File' : 'Upload File'}</span>
          </button>

          <button
            type="button"
            className={recordButton.className}
            onClick={recordButton.onClick}
            aria-label={recordButton.label}
          >
            <RecordIcon
              className={`w-5 h-5 ${isRecording ? 'text-rose-400' : ''}`}
              aria-hidden="true"
            />
            <span>
              {isRecording
                ? 'Stop Recording'
                : audioBlob
                  ? 'Re-record Voice'
                  : 'Record Voice'}
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

        {/* Drop zone (shown when not recording) */}
        {!isRecording && !audioBlob && (
          <FileDropZone
            selectedFile={selectedFile}
            dragActive={dragActive}
            fileInputRef={fileInputRef}
            onDrag={handleDrag}
            onDrop={handleDrop}
          />
        )}

        {/* Voice recorder states */}
        <VoiceRecorder
          isRecording={isRecording}
          recordingDuration={recordingDuration}
          audioBlob={audioBlob}
          onStartRecording={startRecording}
          onStopRecording={stopRecording}
        />

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
            onClick={() => handleUpload(token, onUploadSuccess, onClose)}
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
