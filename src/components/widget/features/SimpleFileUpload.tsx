"use client";

/**
 * Simple File Upload - Lightweight Feature Component
 *
 * Basic file upload without external dependencies.
 * Only loads when user clicks the file upload button.
 */

import React, { useRef } from "react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  className?: string;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  className = "",
  maxSize = 10, // 10MB default
  acceptedTypes = ["image/*", "application/pdf", ".doc", ".docx", ".txt"],
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    onFileSelect(file);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSize * 1024 * 1024) {
      alert(`File size must be less than ${maxSize}MB`);
      return;
    }

    onFileSelect(file);
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={`mt-2 rounded-ds-lg border border-[var(--fl-color-border)] bg-white spacing-4 shadow-lg ${className}`}>
      <h4 className="mb-3 text-sm font-medium text-gray-900">Upload File</h4>

      {/* Drag & Drop Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-ds-border-strong cursor-pointer rounded-ds-lg border-2 border-dashed p-spacing-md text-center transition-colors hover:border-[var(--fl-color-border-interactive)]"
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="text-foreground-muted">
          <svg className="mx-auto mb-2 h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-sm">
            <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
          </p>
          <p className="mt-1 text-tiny text-gray-400">Max size: {maxSize}MB</p>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        onChange={handleFileChange}
        accept={acceptedTypes.join(",")}
        className="hidden"
      />

      {/* Supported File Types */}
      <div className="text-foreground-muted mt-3 text-tiny">
        <p className="mb-1 font-medium">Supported formats:</p>
        <div className="flex flex-wrap gap-1">
          {["Images", "PDF", "Word", "Text"].map((type) => (
            <span key={type} className="bg-background rounded px-2 py-1">
              {type}
            </span>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-3 flex space-x-spacing-sm">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="bg-primary flex-1 rounded px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700"
        >
          Choose File
        </button>
        <button
          onClick={() => {
            // Simulate camera capture
            alert("Camera feature coming soon!");
          }}
          className="bg-background text-foreground rounded px-3 py-2 text-sm transition-colors hover:bg-gray-200"
        >
          📷
        </button>
      </div>
    </div>
  );
};
