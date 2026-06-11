'use client';

import React from 'react';
import { Upload, FileText } from 'lucide-react';

interface FileDropZoneProps {
  /** Currently selected file, or null. */
  selectedFile: File | null;
  /** Whether a file is being actively dragged over the zone. */
  dragActive: boolean;
  /** Ref to the hidden file input element. */
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  /** Drag event handler for enter/over/leave events. */
  onDrag: (e: React.DragEvent) => void;
  /** Drop event handler. */
  onDrop: (e: React.DragEvent) => void;
}

/**
 * Drag-and-drop file selection zone.
 * Provides visual feedback for drag states and shows the selected file preview.
 */
export default function FileDropZone({
  selectedFile,
  dragActive,
  fileInputRef,
  onDrag,
  onDrop,
}: FileDropZoneProps): React.ReactElement {
  return (
    <div
      className={`h-40 rounded-xl border-2 border-dashed flex flex-col items-center justify-center text-center p-4 transition-all ${
        dragActive
          ? 'border-emerald-500 bg-emerald-950/10'
          : selectedFile
            ? 'border-emerald-500/40 bg-zinc-900/10'
            : 'border-zinc-800 bg-zinc-900/10 hover:border-zinc-700'
      }`}
      onDragEnter={onDrag}
      onDragLeave={onDrag}
      onDragOver={onDrag}
      onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          fileInputRef.current?.click();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={
        selectedFile
          ? `Selected file: ${selectedFile.name}. Click or press Enter to change.`
          : 'Drop zone: drag and drop a file here, or press Enter to browse'
      }
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
  );
}
