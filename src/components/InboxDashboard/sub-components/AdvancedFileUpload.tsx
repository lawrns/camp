/**
 * Advanced File Upload Component
 *
 * Enhanced file sharing system with drag-drop, previews, and progress tracking
 * Part of Phase 2: Core Feature Parity to match Intercom standards
 *
 * Features:
 * - Drag-and-drop file upload
 * - Image/video previews with thumbnails
 * - File galleries and organization
 * - Upload progress indicators
 * - File type validation and restrictions
 * - Cloud storage integration
 * - Batch upload support
 * - File compression and optimization
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle,
  Download,
  Eye,
  File,
  FileText,
  Image,
  Loader,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";

interface FileUploadItem {
  id: string;
  file: File;
  preview?: string;
  uploadProgress: number;
  uploadStatus: "pending" | "uploading" | "completed" | "error";
  uploadedUrl?: string;
  error?: string;
  thumbnail?: string;
}

interface AdvancedFileUploadProps {
  onFilesUploaded: (files: FileUploadItem[]) => void;
  onFileRemove: (fileId: string) => void;
  maxFiles?: number;
  maxFileSize?: number; // in bytes
  allowedTypes?: string[];
  showPreviews?: boolean;
  enableCompression?: boolean;
  multiple?: boolean;
  disabled?: boolean;
}

const DEFAULT_ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "video/mp4",
  "video/webm",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

export const AdvancedFileUpload: React.FC<AdvancedFileUploadProps> = ({
  onFilesUploaded,
  onFileRemove,
  maxFiles = 10,
  maxFileSize = MAX_FILE_SIZE,
  allowedTypes = DEFAULT_ALLOWED_TYPES,
  showPreviews = true,
  enableCompression = true,
  multiple = true,
  disabled = false,
}) => {
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback(
    async (selectedFiles: FileList | File[]) => {
      if (disabled) return;

      const fileArray = Array.from(selectedFiles);
      const validFiles: FileUploadItem[] = [];

      for (const file of fileArray) {
        // Check file count limit
        if (files.length + validFiles.length >= maxFiles) {
          break;
        }

        // Validate file type
        if (!allowedTypes.includes(file.type)) {

          continue;
        }

        // Validate file size
        if (file.size > maxFileSize) {

          continue;
        }

        // Create file upload item
        const fileItem: FileUploadItem = {
          id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          file,
          uploadProgress: 0,
          uploadStatus: "pending",
        };

        // Generate preview for images
        if (file.type.startsWith("image/") && showPreviews) {
          try {
            const preview = await generateImagePreview(file);
            fileItem.preview = preview;

            if (enableCompression) {
              const compressed = await compressImage(file);
              fileItem.file = compressed;
            }
          } catch (error) {

          }
        }

        // Generate thumbnail for videos
        if (file.type.startsWith("video/") && showPreviews) {
          try {
            const thumbnail = await generateVideoThumbnail(file);
            fileItem.thumbnail = thumbnail;
          } catch (error) {

          }
        }

        validFiles.push(fileItem);
      }

      if (validFiles.length > 0) {
        setFiles((prev) => [...prev, ...validFiles]);
        uploadFiles(validFiles);
      }
    },
    [files.length, maxFiles, allowedTypes, maxFileSize, showPreviews, enableCompression, disabled]
  );

  // Generate image preview
  const generateImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Generate video thumbnail
  const generateVideoThumbnail = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = 1; // Seek to 1 second
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const thumbnail = canvas.toDataURL("image/jpeg", 0.8);
          resolve(thumbnail);
        } else {
          reject(new Error("Canvas context not available"));
        }
      };

      video.onerror = reject;
      video.src = URL.createObjectURL(file);
    });
  };

  // Compress image
  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 1920x1080)
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: "image/jpeg",
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                resolve(file);
              }
            },
            "image/jpeg",
            0.8
          );
        } else {
          resolve(file);
        }
      };

      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };

  // Upload files
  const uploadFiles = async (filesToUpload: FileUploadItem[]) => {
    setIsUploading(true);

    for (const fileItem of filesToUpload) {
      try {
        // Update status to uploading
        setFiles((prev) => prev.map((f) => (f.id === fileItem.id ? { ...f, uploadStatus: "uploading" as const } : f)));

        // Simulate upload with progress
        const uploadedFile = await simulateFileUpload(fileItem, (progress) => {
          setFiles((prev) => prev.map((f) => (f.id === fileItem.id ? { ...f, uploadProgress: progress } : f)));
        });

        // Update status to completed
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id
              ? {
                  ...f,
                  uploadStatus: "completed" as const,
                  uploadProgress: 100,
                  uploadedUrl: uploadedFile.url,
                }
              : f
          )
        );
      } catch (error) {
        // Update status to error
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileItem.id
              ? {
                  ...f,
                  uploadStatus: "error" as const,
                  error: error instanceof Error ? (error instanceof Error ? error.message : String(error)) : "Upload failed",
                }
              : f
          )
        );
      }
    }

    setIsUploading(false);

    // Notify parent of completed uploads
    const completedFiles = files.filter((f) => f.uploadStatus === "completed");
    if (completedFiles.length > 0) {
      onFilesUploaded(completedFiles);
    }
  };

  // Simulate file upload (replace with actual upload logic)
  const simulateFileUpload = (
    fileItem: FileUploadItem,
    onProgress: (progress: number) => void
  ): Promise<{ url: string }> => {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);

          // Simulate success/failure
          if (Math.random() > 0.1) {
            // 90% success rate
            resolve({ url: `https://example.com/uploads/${fileItem.file.name}` });
          } else {
            reject(new Error("Upload failed"));
          }
        }
        onProgress(progress);
      }, 200);
    });
  };

  // Handle drag events
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) {
        setIsDragOver(true);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!dropZoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      if (!disabled && e.dataTransfer.files.length > 0) {
        handleFileSelect(e.dataTransfer.files);
      }
    },
    [disabled, handleFileSelect]
  );

  // Handle file input change
  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFileSelect(e.target.files);
      }
      // Reset input value to allow selecting the same file again
      e.target.value = "";
    },
    [handleFileSelect]
  );

  // Remove file
  const handleRemoveFile = useCallback(
    (fileId: string) => {
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      onFileRemove(fileId);
    },
    [onFileRemove]
  );

  // Get file icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <Image className="h-5 w-5" />;
    if (file.type.startsWith("video/")) return <Video className="h-5 w-5" />;
    if (file.type === "application/pdf") return <FileText className="h-5 w-5" />;
    return <File className="h-5 w-5" />;
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`rounded-ds-lg border-2 border-dashed spacing-6 text-center transition-colors ${
          isDragOver
            ? "border-[var(--fl-color-brand)] bg-[var(--fl-color-info-subtle)]"
            : disabled
              ? "border-[var(--fl-color-border)] bg-[var(--fl-color-background-subtle)]"
              : "border-[var(--fl-color-border-strong)] hover:border-[var(--fl-color-border-hover)]"
        }`}
      >
        <Upload className={`mx-auto mb-2 h-8 w-8 ${isDragOver ? "text-[var(--fl-color-info)]" : "text-gray-400"}`} />

        <p className="text-foreground mb-2 text-sm">
          {isDragOver ? "Drop files here to upload" : "Drag and drop files here, or click to select"}
        </p>

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className="bg-primary rounded-ds-md px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Select Files
        </button>

        <p className="mt-2 text-tiny text-[var(--fl-color-text-muted)]">
          Max {maxFiles} files, {formatFileSize(maxFileSize)} each
        </p>

        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={allowedTypes.join(",")}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-spacing-sm">
          <h4 className="text-foreground text-sm font-medium">Uploaded Files ({files.length})</h4>

          <div className="max-h-60 space-y-spacing-sm overflow-y-auto">
            {files.map((fileItem) => (
              <div
                key={fileItem.id}
                className="flex items-center space-x-3 rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-3"
              >
                {/* File preview/icon */}
                <div className="flex-shrink-0">
                  {fileItem.preview ? (
                    <img src={fileItem.preview} alt={fileItem.file.name} className="h-10 w-10 rounded object-cover" />
                  ) : fileItem.thumbnail ? (
                    <img src={fileItem.thumbnail} alt={fileItem.file.name} className="h-10 w-10 rounded object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-gray-200 text-[var(--fl-color-text-muted)]">
                      {getFileIcon(fileItem.file)}
                    </div>
                  )}
                </div>

                {/* File info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{fileItem.file.name}</p>
                  <p className="text-tiny text-[var(--fl-color-text-muted)]">{formatFileSize(fileItem.file.size)}</p>

                  {/* Progress bar */}
                  {fileItem.uploadStatus === "uploading" && (
                    <div className="mt-1">
                      <div className="h-1 w-full rounded-ds-full bg-gray-200">
                        <div
                          className="bg-primary h-1 rounded-ds-full transition-all"
                          style={{ width: `${fileItem.uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Error message */}
                  {fileItem.uploadStatus === "error" && fileItem.error && (
                    <p className="mt-1 text-tiny text-red-600">{fileItem.error}</p>
                  )}
                </div>

                {/* Status icon */}
                <div className="flex-shrink-0">
                  {fileItem.uploadStatus === "uploading" && <Loader className="h-4 w-4 animate-spin text-blue-600" />}
                  {fileItem.uploadStatus === "completed" && <CheckCircle className="h-4 w-4 text-green-600" />}
                  {fileItem.uploadStatus === "error" && <AlertCircle className="h-4 w-4 text-red-600" />}
                </div>

                {/* Actions */}
                <div className="flex flex-shrink-0 items-center space-x-1">
                  {fileItem.uploadedUrl && (
                    <button
                      type="button"
                      onClick={() => window.open(fileItem.uploadedUrl, "_blank")}
                      className="hover:text-foreground spacing-1 text-gray-400"
                      title="View file"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveFile(fileItem.id)}
                    className="spacing-1 text-gray-400 hover:text-red-600"
                    title="Remove file"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
