"use client";

import React, { useCallback, useRef, useState } from "react";
import { CheckCircle, File, FileText, Image, Paperclip, Upload, AlertTriangle, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { supabase } from "@/lib/supabase";
import { Icon } from "@/lib/ui/Icon";

interface AttachmentFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadProgress?: number;
  error?: string;
}

interface AttachmentUploaderProps {
  conversationId: string;
  onUploadComplete: (files: AttachmentFile[]) => void;
  maxFileSize?: number;
  allowedTypes?: string[];
  className?: string;
}

export const AttachmentUploader: React.FC<AttachmentUploaderProps> = ({
  conversationId,
  onUploadComplete,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  allowedTypes = ["image/*", "application/pdf", ".doc", ".docx", ".txt"],
  className = "",
}) => {
  const [files, setFiles] = useState<AttachmentFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return Image;
    if (type.includes("pdf")) return FileText;
    if (type.includes("doc")) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `File size exceeds ${formatFileSize(maxFileSize)} limit`;
    }

    const isAllowed = allowedTypes.some((type) => {
      if (type.includes("*")) {
        return file.type.startsWith(type.replace("*", ""));
      }
      return file.type === type || file.name.toLowerCase().endsWith(type);
    });

    if (!isAllowed) {
      return "File type not allowed";
    }

    return null;
  };

  const uploadFile = async (file: File): Promise<AttachmentFile> => {
    const fileId = `${Date.now()}-${file.name}`;
    const filePath = `conversations/${conversationId}/attachments/${fileId}`;

    try {
      const { data, error } = await supabase.browser().storage.from("attachments").upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (error) throw error;

      const { data: urlData } = supabase.browser().storage.from("attachments").getPublicUrl(filePath);

      return {
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        url: urlData.publicUrl,
        uploadProgress: 100,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? (error instanceof Error ? error.message : String(error)) : String(error);
      throw new Error(`Failed to upload ${file.name}: ${errorMessage}`);
    }
  };

  const handleFiles = useCallback(
    async (acceptedFiles: File[]) => {
      const newFiles: AttachmentFile[] = acceptedFiles.map((file) => {
        const error = validateFile(file);
        return {
          id: `temp-${Date.now()}-${file.name}`,
          name: file.name,
          size: file.size,
          type: file.type,
          uploadProgress: error ? undefined : 0,
          error,
        };
      });

      setFiles((prev) => [...prev, ...newFiles]);

      // Upload valid files
      const validFiles = acceptedFiles.filter((_, index) => !newFiles[index].error);

      if (validFiles.length > 0) {
        setIsUploading(true);

        try {
          const uploadPromises = validFiles.map(async (file, index) => {
            const fileIndex = files.length + index;

            try {
              const uploadedFile = await uploadFile(file);

              setFiles((prev) => prev.map((f, i) => (i === fileIndex ? { ...f, ...uploadedFile } : f)));

              return uploadedFile;
            } catch (error) {
              setFiles((prev) =>
                prev.map((f, i) => (i === fileIndex ? { ...f, error: (error instanceof Error ? error.message : String(error)), uploadProgress: undefined } : f))
              );
              throw error;
            }
          });

          const uploadedFiles = await Promise.allSettled(uploadPromises);
          const successfulUploads = uploadedFiles
            .filter((result) => result.status === "fulfilled")
            .map((result) => (result as PromiseFulfilledResult<AttachmentFile>).value);

          if (successfulUploads.length > 0) {
            onUploadComplete(successfulUploads);
          }
        } finally {
          setIsUploading(false);
        }
      }
    },
    [conversationId, files.length, maxFileSize, allowedTypes, onUploadComplete]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFiles,
    accept: allowedTypes.reduce(
      (acc, type) => {
        acc[type] = [];
        return acc;
      },
      {} as Record<string, string[]>
    ),
    maxSize: maxFileSize,
    multiple: true,
  });

  const removeFile = (fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`cursor-pointer rounded-ds-lg border-2 border-dashed spacing-4 text-center transition-colors ${isDragActive ? "border-[var(--fl-color-border-interactive)] bg-[var(--fl-color-info-subtle)]" : "border-[var(--fl-color-border-strong)] bg-[var(--fl-color-background-subtle)] hover:border-[var(--fl-color-border-hover)]"} `}
      >
        <input {...getInputProps()} ref={fileInputRef} />
        <Icon icon={Upload} className="mx-auto mb-2 h-8 w-8 text-gray-400" />
        <p className="text-foreground text-sm">
          {isDragActive ? "Drop files here..." : "Drag & drop files here, or click to select"}
        </p>
        <p className="mt-1 text-tiny text-[var(--fl-color-text-muted)]">
          Max {formatFileSize(maxFileSize)} • {allowedTypes.join(", ")}
        </p>
      </div>

      {/* Attachment Button */}
      <button
        onClick={triggerFileInput}
        disabled={isUploading}
        className="border-ds-border-strong bg-background text-foreground inline-flex items-center space-x-spacing-sm rounded-ds-md border px-3 py-2 text-sm font-medium hover:bg-[var(--fl-color-background-subtle)] focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
      >
        <Icon icon={Paperclip} className="h-4 w-4" />
        <span>Attach Files</span>
      </button>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-spacing-sm">
          <h4 className="text-foreground text-sm font-medium">Attachments</h4>
          {files.map((file) => (
            <div
              key={file.id}
              className="bg-background flex items-center justify-between rounded-ds-lg border border-[var(--fl-color-border)] spacing-3"
            >
              <div className="flex items-center space-x-3">
                <Icon icon={getFileIcon(file.type)} className="h-5 w-5 text-[var(--fl-color-text-muted)]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-tiny text-[var(--fl-color-text-muted)]">{formatFileSize(file.size)}</p>
                </div>
              </div>

              <div className="flex items-center space-x-spacing-sm">
                {/* Upload Progress */}
                {file.uploadProgress !== undefined && file.uploadProgress < 100 && (
                  <div className="h-2 w-16 rounded-ds-full bg-gray-200">
                    <div
                      className="bg-primary h-2 rounded-ds-full transition-all duration-300"
                      style={{ width: `${file.uploadProgress}%` }}
                    ></div>
                  </div>
                )}

                {/* Status Icons */}
                {file.error && <Icon icon={AlertTriangle} className="text-brand-mahogany-500 h-4 w-4" title={file.error} />}
                {file.uploadProgress === 100 && <Icon icon={CheckCircle} className="text-semantic-success h-4 w-4" />}

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(file.id)}
                  className="hover:text-brand-mahogany-500 spacing-1 text-gray-400 transition-colors"
                  title="Remove file"
                >
                  <Icon icon={X} className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Status */}
      {isUploading && (
        <div className="flex items-center space-x-spacing-sm text-sm text-blue-600">
          <div className="h-4 w-4 animate-spin rounded-ds-full border-b-2 border-[var(--fl-color-brand)]"></div>
          <span>Uploading files...</span>
        </div>
      )}
    </div>
  );
};
