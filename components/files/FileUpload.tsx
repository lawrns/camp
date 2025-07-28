/**
 * TASK-201: File Upload Component
 *
 * React component for secure file upload with drag-and-drop,
 * progress tracking, and real-time notifications.
 */

"use client";

import React, { useCallback, useRef, useState } from "react";
import {
  Warning as AlertCircle,
  Archive,
  CheckCircle,
  File,
  FileText,
  Image,
  MusicNote as Music,
  Upload,
  VideoCamera as Video,
  X,
} from "@phosphor-icons/react";
import { FileMetadata, fileService, FileUploadOptions } from "@/lib/files/FileService";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  organizationId: string;
  conversationId?: string;
  uploadedBy: string;
  onUploadComplete?: (files: FileMetadata[]) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  maxFiles?: number;
  accept?: string;
  disabled?: boolean;
}

interface UploadProgress {
  completed: number;
  total: number;
  currentFile: string;
  percentage: number;
}

interface FileWithPreview extends File {
  preview?: string;
  id: string;
}

export function FileUpload({
  organizationId,
  conversationId,
  uploadedBy,
  onUploadComplete,
  onUploadError,
  className,
  maxFiles = 10,
  accept,
  disabled = false,
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileMetadata[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // File type icons mapping
  const getFile = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return Image;
    if (mimeType.startsWith("video/")) return Video;
    if (mimeType.startsWith("audio/")) return Music;
    if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("7z")) return Archive;
    if (mimeType.includes("pdf") || mimeType.includes("document") || mimeType.includes("text")) return FileText;
    return File;
  };

  // Handle file selection
  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || disabled) return;

      const newFiles: FileWithPreview[] = [];
      const newErrors: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i] as FileWithPreview;

        // Check if we're exceeding max files
        if (selectedFiles.length + newFiles.length >= maxFiles) {
          newErrors.push(`Maximum ${maxFiles} files allowed`);
          break;
        }

        // Validate file
        const validation = fileService.validateFile(file);
        if (!validation.isValid) {
          newErrors.push(`${file.name}: ${validation.errors.join(", ")}`);
          continue;
        }

        // Add unique ID and preview for images
        file.id = Math.random().toString(36).substr(2, 9);
        if (file.type.startsWith("image/")) {
          file.preview = URL.createObjectURL(file);
        }

        newFiles.push(file);
      }

      setSelectedFiles((prev) => [...prev, ...newFiles]);
      setErrors(newErrors);
    },
    [selectedFiles.length, maxFiles, disabled]
  );

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
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
      dragCounter.current = 0;

      if (disabled) return;

      const files = e.dataTransfer.files;
      handleFileSelect(files);
    },
    [handleFileSelect, disabled]
  );

  // Remove selected file
  const removeFile = useCallback((fileId: string) => {
    setSelectedFiles((prev) => {
      const updated = prev.filter((f: any) => f.id !== fileId);
      // Revoke object URL to prevent memory leaks
      const removedFile = prev.find((f) => f.id === fileId);
      if (removedFile?.preview) {
        URL.revokeObjectURL(removedFile.preview);
      }
      return updated;
    });
  }, []);

  // Upload files
  const uploadFiles = useCallback(async () => {
    if (selectedFiles.length === 0 || isUploading || disabled) return;

    setIsUploading(true);
    setErrors([]);
    setUploadProgress({ completed: 0, total: selectedFiles.length, currentFile: "", percentage: 0 });

    try {
      const options: FileUploadOptions = {
        organizationId,
        uploadedBy,
        generateThumbnail: true,
        ...(conversationId && { conversationId }),
      };

      const results = await fileService.uploadMultipleFiles(selectedFiles, options, (progress) => {
        const percentage = Math.round((progress.completed / progress.total) * 100);
        setUploadProgress({
          ...progress,
          percentage,
        });
      });

      setUploadedFiles(results);
      setSelectedFiles([]);
      onUploadComplete?.(results);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      setErrors([errorMessage]);
      onUploadError?.(errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  }, [
    selectedFiles,
    isUploading,
    disabled,
    organizationId,
    conversationId,
    uploadedBy,
    onUploadComplete,
    onUploadError,
  ]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className={cn("w-full", className)}>
      {/* Upload Area */}
      <div
        className={cn(
          "relative rounded-ds-lg border-2 border-dashed spacing-4 transition-all duration-200",
          isDragOver ? "border-primary-500 bg-primary-50" : "border-[var(--fl-color-border-strong)]",
          disabled ? "cursor-not-allowed opacity-50" : "hover:border-primary-400 cursor-pointer",
          isUploading && "pointer-events-none"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        <div className="text-center">
          <Icon
            icon={Upload}
            className={cn("mx-auto mb-4 h-12 w-12", isDragOver ? "text-primary-500" : "text-gray-400")}
          />

          <div className="mb-2 text-base font-medium text-gray-900">
            {isDragOver ? "Drop files here" : "Upload files"}
          </div>

          <div className="text-sm text-[var(--fl-color-text-muted)]">
            Drag and drop files here, or click to select files
          </div>

          <div className="mt-2 text-tiny text-gray-400">Maximum {maxFiles} files, up to 50MB each</div>
        </div>

        {/* Upload Progress */}
        {isUploading && uploadProgress && (
          <div className="bg-background/90 absolute inset-0 flex items-center justify-center rounded-ds-lg">
            <div className="text-center">
              <div className="relative mb-4 h-32 w-32">
                <svg className="h-32 w-32 -rotate-90 transform">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-neutral-200"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - uploadProgress.percentage / 100)}`}
                    className="text-primary-500 transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-primary-600 text-3xl font-bold">{uploadProgress.percentage}%</span>
                </div>
              </div>

              <div className="text-foreground text-sm">
                Uploading {uploadProgress.completed + 1} of {uploadProgress.total}
              </div>

              {uploadProgress.currentFile && (
                <div className="mt-1 max-w-48 truncate text-tiny text-[var(--fl-color-text-muted)]">
                  {uploadProgress.currentFile}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="mt-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Selected Files ({selectedFiles.length})</h4>
            <button
              onClick={uploadFiles}
              disabled={isUploading || disabled}
              className="bg-primary-600 hover:bg-primary-700 rounded-ds-md px-4 py-2 text-sm font-medium text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading ? "Uploading..." : "Upload Files"}
            </button>
          </div>

          <div className="space-y-spacing-sm">
            {selectedFiles.map((file: any) => {
              const File = getFile(file.type);

              return (
                <div key={file.id} className="flex items-center rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-3">
                  {file.preview ? (
                    <img src={file.preview} alt={file.name} className="mr-3 h-10 w-10 rounded-ds-md object-cover" />
                  ) : (
                    <File className="mr-3 h-10 w-10 text-gray-400" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-900">{file.name}</div>
                    <div className="text-tiny text-[var(--fl-color-text-muted)]">
                      {formatFileSize(file.size)} • {file.type}
                    </div>
                  </div>

                  <button
                    onClick={() => removeFile(file.id)}
                    disabled={isUploading}
                    className="hover:text-brand-mahogany-500 ml-3 spacing-1 text-gray-400 disabled:opacity-50"
                  >
                    <Icon icon={X} className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-4">
          <h4 className="mb-3 flex items-center text-sm font-medium text-gray-900">
            <Icon icon={CheckCircle} className="text-semantic-success mr-2 h-4 w-4" />
            Successfully Uploaded ({uploadedFiles.length})
          </h4>

          <div className="space-y-spacing-sm">
            {uploadedFiles.map((file: any) => {
              const File = getFile(file.mimeType);

              return (
                <div
                  key={file.id}
                  className="border-status-success-light flex items-center rounded-ds-lg border bg-[var(--fl-color-success-subtle)] spacing-3"
                >
                  {file.thumbnailUrl ? (
                    <img
                      src={file.thumbnailUrl}
                      alt={file.originalName}
                      className="mr-3 h-10 w-10 rounded-ds-md object-cover"
                    />
                  ) : (
                    <File className="text-semantic-success-dark mr-3 h-10 w-10" />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-gray-900">{file.originalName}</div>
                    <div className="text-tiny text-[var(--fl-color-text-muted)]">
                      {formatFileSize(file.size)} • Uploaded successfully
                    </div>
                  </div>

                  <Icon icon={CheckCircle} className="text-semantic-success ml-3 h-5 w-5" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="mt-4">
          <div className="border-status-error-light rounded-ds-lg border bg-[var(--fl-color-danger-subtle)] spacing-3">
            <div className="mb-2 flex items-center">
              <Icon icon={AlertCircle} className="text-brand-mahogany-500 mr-2 h-4 w-4" />
              <span className="text-sm font-medium text-red-800">Upload Errors</span>
            </div>
            <ul className="text-red-600-dark space-y-1 text-sm">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
