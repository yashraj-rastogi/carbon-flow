'use client';

import { useState, useRef, useCallback } from 'react';
import { MAX_FILE_SIZE_BYTES, ACCEPTED_FILE_TYPES } from '@/constants';

/** State and handlers returned by the useFileUpload hook. */
export interface UseFileUploadReturn {
  selectedFile: File | null;
  audioBlob: Blob | null;
  dragActive: boolean;
  isRecording: boolean;
  recordingDuration: number;
  uploading: boolean;
  error: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  setError: (error: string | null) => void;
  handleDrag: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  handleUpload: (token: string, onSuccess: (result: Record<string, unknown>, latencyMs: number) => void, onClose: () => void) => Promise<void>;
}

/**
 * Custom hook encapsulating all file upload and voice recording state.
 *
 * Manages file selection (drag-and-drop + click), voice recording via
 * MediaRecorder API, file validation, and upload submission.
 */
export function useFileUpload(): UseFileUploadReturn {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /** Validates and stores a selected file. */
  const validateAndSetFile = useCallback((file: File): void => {
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
  }, []);

  const handleDrag = useCallback((e: React.DragEvent): void => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent): void => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      setError(null);
      if (e.dataTransfer.files?.[0]) {
        validateAndSetFile(e.dataTransfer.files[0]);
      }
    },
    [validateAndSetFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>): void => {
      setError(null);
      if (e.target.files?.[0]) {
        validateAndSetFile(e.target.files[0]);
      }
    },
    [validateAndSetFile]
  );

  const startRecording = useCallback(async (): Promise<void> => {
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
  }, []);

  const stopRecording = useCallback((): void => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  }, [isRecording]);

  const handleUpload = useCallback(
    async (
      token: string,
      onSuccess: (result: Record<string, unknown>, latencyMs: number) => void,
      onClose: () => void
    ): Promise<void> => {
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

        onSuccess(result, latencyMs);
        onClose();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Server error. Please try again.';
        setError(message);
      } finally {
        setUploading(false);
      }
    },
    [selectedFile, audioBlob]
  );

  return {
    selectedFile,
    audioBlob,
    dragActive,
    isRecording,
    recordingDuration,
    uploading,
    error,
    fileInputRef,
    setError,
    handleDrag,
    handleDrop,
    handleFileChange,
    startRecording,
    stopRecording,
    handleUpload,
  };
}
