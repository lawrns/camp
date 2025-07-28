"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface FileUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: File) => void;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
}

const DEFAULT_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/quicktime",
  "audio/mpeg",
  "audio/wav",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

export const FileUpload: React.FC<FileUploadProps> = ({
  isOpen,
  onClose,
  onFileSelect,
  maxSize = DEFAULT_MAX_SIZE,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): { isValid: boolean; error?: string } => {
      if (file.size > maxSize) {
        return {
          isValid: false,
          error: `File "${file.name}" is too large. Maximum size is ${Math.round(maxSize / 1024 / 1024)}MB.`,
        };
      }

      if (!allowedTypes.includes(file.type)) {
        return {
          isValid: false,
          error: `File type "${file.type}" is not supported.`,
        };
      }

      return { isValid: true };
    },
    [maxSize, allowedTypes]
  );

  const handleFiles = useCallback(
    (files: FileList) => {
      const file = files[0]; // Handle single file for now
      if (!file) return;

      const validation = validateFile(file);
      if (!validation.isValid) {
        setError(validation.error || "Invalid file");
        return;
      }

      setError(null);
      onFileSelect(file);
      onClose();
    },
    [validateFile, onFileSelect, onClose]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFiles(files);
      }
    },
    [handleFiles]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => prev + 1);
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsDragOver(false);
      }
      return newCounter;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      setDragCounter(0);

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        handleFiles(files);
      }
    },
    [handleFiles]
  );

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Clear error when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileTypeDescription = (): string => {
    const types = allowedTypes.map((type) => {
      if (type.startsWith("image/")) return "Images";
      if (type.startsWith("video/")) return "Videos";
      if (type.startsWith("audio/")) return "Audio";
      if (type.includes("pdf")) return "PDF";
      if (type.includes("word")) return "Word docs";
      if (type.includes("text")) return "Text files";
      return type;
    });

    const uniqueTypes = [...new Set(types)];
    return uniqueTypes.join(", ");
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 spacing-3"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="bg-background max-h-[90vh] w-full max-w-md overflow-hidden rounded-ds-xl shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--fl-color-border)] spacing-3">
            <h3 className="text-base font-semibold text-gray-900">Upload File</h3>
            <button
              onClick={onClose}
              className="hover:text-foreground hover:bg-background rounded-ds-lg p-spacing-sm text-gray-400 transition-colors"
              aria-label="Close file upload"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="spacing-3">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 rounded-ds-lg border border-[var(--fl-color-danger-muted)] bg-[var(--fl-color-danger-subtle)] spacing-3 text-sm text-red-700"
              >
                {error}
              </motion.div>
            )}

            {/* Dropzone */}
            <div
              className={`relative cursor-pointer rounded-ds-xl border-2 border-dashed spacing-8 text-center transition-all ${
                isDragOver
                  ? "border-[var(--fl-color-border-interactive)] bg-[var(--fl-color-info-subtle)]"
                  : "border-[var(--fl-color-border-strong)] hover:border-[var(--fl-color-border-hover)] hover:bg-[var(--fl-color-background-subtle)]"
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={handleBrowseClick}
            >
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileInputChange}
                accept={allowedTypes.join(",")}
                className="hidden"
              />

              <div className="space-y-3">
                {/* Upload Icon */}
                <div
                  className={`mx-auto flex h-12 w-12 items-center justify-center rounded-ds-full ${
                    isDragOver ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"
                  }`}
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>

                {/* Text */}
                <div>
                  <p className={`text-sm font-medium ${isDragOver ? "text-blue-600" : "text-gray-900"}`}>
                    {isDragOver ? "Drop your file here" : "Drag and drop your file here"}
                  </p>
                  <p className="mt-1 text-tiny text-[var(--fl-color-text-muted)]">or click to browse</p>
                </div>

                {/* Browse Button */}
                <button
                  type="button"
                  onClick={handleBrowseClick}
                  className="border-ds-border-strong text-foreground bg-background inline-flex items-center rounded-ds-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--fl-color-background-subtle)] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Choose File
                </button>
              </div>
            </div>

            {/* File Info */}
            <div className="mt-4 space-y-1 text-tiny text-[var(--fl-color-text-muted)]">
              <p>
                <strong>Supported formats:</strong> {getFileTypeDescription()}
              </p>
              <p>
                <strong>Maximum size:</strong> {formatFileSize(maxSize)}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
