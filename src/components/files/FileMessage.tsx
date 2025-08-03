/**
 * TASK-201: File Message Component
 *
 * Chat message component for displaying shared files with preview and actions.
 * Integrates with the existing chat system to show file attachments.
 */

"use client";

import { useState } from "react";
import {
  Clock,
  Download,
  Eye,
  File,
  FileText,
  Image,
  MusicNote as Music,
  Share,
  VideoCamera as Video,
} from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent } from "@/components/unified-ui/components/Card";
import { Icon } from "@/lib/ui/Icon";
import { FileMetadata } from "./FilePreview";
import { MediaViewer } from "./MediaViewer";

export interface FileMessageProps {
  file: FileMetadata;
  message?: string;
  timestamp: string;
  senderName?: string;
  senderAvatar?: string;
  isOwn?: boolean;
  onDownload?: (file: FileMetadata) => void;
  onShare?: (file: FileMetadata) => void;
  onPreview?: (file: FileMetadata) => void;
  className?: string;
}

export function FileMessage({
  file,
  message,
  timestamp,
  senderName,
  senderAvatar,
  isOwn = false,
  onDownload,
  onShare,
  onPreview,
  className = "",
}: FileMessageProps) {
  const [viewerOpen, setViewerOpen] = useState(false);

  const getFile = (type: string) => {
    if (type.startsWith("image/")) return <Image className="h-5 w-5 text-[var(--fl-color-info)]" />;
    if (type.startsWith("video/")) return <Video className="h-5 w-5 text-purple-500" />;
    if (type.startsWith("audio/")) return <Music className="text-semantic-success h-5 w-5" />;
    if (type === "application/pdf" || type.startsWith("text/"))
      return <FileText className="text-brand-mahogany-500 h-5 w-5" />;
    return <File className="h-5 w-5 text-[var(--fl-color-text-muted)]" />;
  };

  const formatFileSize = (bytes: number): string => {
    const units = ["B", "KB", "MB", "GB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileTypeLabel = (type: string): string => {
    if (type.startsWith("image/")) return "Image";
    if (type.startsWith("video/")) return "Video";
    if (type.startsWith("audio/")) return "Audio";
    if (type === "application/pdf") return "PDF";
    if (type.startsWith("text/")) return "Text";
    if (type.includes("document")) return "Document";
    if (type.includes("spreadsheet")) return "Spreadsheet";
    if (type.includes("presentation")) return "Presentation";
    if (type.includes("zip") || type.includes("archive")) return "Archive";
    return "File";
  };

  const canPreview = (type: string): boolean => {
    return type.startsWith("image/") || type.startsWith("video/") || type === "application/pdf";
  };

  const handlePreview = () => {
    if (canPreview(file.type)) {
      setViewerOpen(true);
    }
    onPreview?.(file);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(file);
    } else if (file.url) {
      // Fallback to direct download
      const link = document.createElement("a");
      link.href = file.url;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className={`file-message ${isOwn ? "ml-auto" : "mr-auto"} max-w-md ${className}`}>
      {/* Message Header */}
      <div className="mb-2 flex items-center space-x-spacing-sm">
        {!isOwn && senderAvatar && <img src={senderAvatar} alt={senderName} className="h-6 w-6 rounded-ds-full" />}
        {!isOwn && senderName && <span className="text-foreground text-sm font-medium">{senderName}</span>}
        <div className="flex items-center text-tiny text-[var(--fl-color-text-muted)]">
          <Icon icon={Clock} size={16} className="mr-1" />
          {formatTime(timestamp)}
        </div>
      </div>

      {/* Text Message (if any) */}
      {message && (
        <div className={`mb-2 rounded-ds-lg spacing-3 ${isOwn ? "bg-brand-blue-500 text-white" : "bg-gray-100 text-gray-900"}`}>
          <p className="text-sm">{message}</p>
        </div>
      )}

      {/* File Attachment */}
      <Card className="hover:border-ds-border-strong border-2 border-dashed border-[var(--fl-color-border)] transition-colors">
        <CardContent className="spacing-3">
          <div className="flex items-start space-x-3">
            {/* File Thumbnail/Icon */}
            <div className="flex-shrink-0">
              {file.thumbnailUrl ? (
                <div
                  className="h-12 w-12 cursor-pointer overflow-hidden rounded-ds-lg transition-opacity hover:opacity-80"
                  onClick={handlePreview}
                >
                  <img src={file.thumbnailUrl} alt={file.name} className="h-full w-full object-cover" />
                </div>
              ) : (
                <div className="bg-background flex h-12 w-12 items-center justify-center rounded-ds-lg">
                  {getFile(file.type)}
                </div>
              )}
            </div>

            {/* File Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h4 className="truncate text-sm font-medium text-gray-900" title={file.name}>
                    {file.name}
                  </h4>
                  <div className="mt-1 flex items-center space-x-spacing-sm">
                    <Badge variant="secondary" className="text-tiny">
                      {getFileTypeLabel(file.type)}
                    </Badge>
                    <span className="text-tiny text-[var(--fl-color-text-muted)]">{formatFileSize(file.size)}</span>
                  </div>
                </div>
              </div>

              {/* File Actions */}
              <div className="mt-3 flex items-center space-x-spacing-sm">
                {canPreview(file.type) && (
                  <Button variant="outline" size="sm" onClick={handlePreview} className="text-tiny">
                    <Icon icon={Eye} size={16} className="mr-1" />
                    Preview
                  </Button>
                )}

                <Button variant="outline" size="sm" onClick={handleDownload} className="text-tiny">
                  <Icon icon={Download} size={16} className="mr-1" />
                  Download
                </Button>

                {onShare && (
                  <Button variant="ghost" size="sm" onClick={() => onShare(file)} className="text-tiny">
                    <Icon icon={Share} size={16} />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Preview for Images */}
          {file.type.startsWith("image/") && file.thumbnailUrl && (
            <div className="mt-3 border-t border-[var(--fl-color-border)] pt-3">
              <div
                className="relative cursor-pointer overflow-hidden rounded-ds-lg transition-opacity hover:opacity-90"
                onClick={handlePreview}
              >
                <img src={file.thumbnailUrl} alt={file.name} className="max-h-48 w-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 transition-all duration-200 hover:bg-opacity-10">
                  <Icon icon={Eye} size={16} className="text-white opacity-0 transition-opacity hover:opacity-100" />
                </div>
              </div>
            </div>
          )}

          {/* Audio Player Preview */}
          {file.type.startsWith("audio/") && (
            <div className="mt-3 border-t border-[var(--fl-color-border)] pt-3">
              <audio controls className="w-full" preload="metadata">
                <source src={file.url} type={file.type} />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}

          {/* Video Preview */}
          {file.type.startsWith("video/") && (
            <div className="mt-3 border-t border-[var(--fl-color-border)] pt-3">
              <div className="relative cursor-pointer overflow-hidden rounded-ds-lg bg-black" onClick={handlePreview}>
                <video className="max-h-48 w-full object-cover" preload="metadata" poster={file.thumbnailUrl}>
                  <source src={file.url} type={file.type} />
                </video>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-ds-full bg-black bg-opacity-50 spacing-3">
                    <Icon icon={Eye} size={16} className="text-white" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media Viewer */}
      {canPreview(file.type) && (
        <MediaViewer
          isOpen={viewerOpen}
          onClose={() => setViewerOpen(false)}
          files={[file]}
          currentIndex={0}
          onDownload={onDownload}
          onShare={onShare}
        />
      )}
    </div>
  );
}

/**
 * Multiple Files Message Component
 * For when multiple files are shared in a single message
 */
export interface MultipleFilesMessageProps {
  files: FileMetadata[];
  message?: string;
  timestamp: string;
  senderName?: string;
  senderAvatar?: string;
  isOwn?: boolean;
  onDownload?: (file: FileMetadata) => void;
  onShare?: (file: FileMetadata) => void;
  onPreview?: (files: FileMetadata[], index: number) => void;
  className?: string;
}

export function MultipleFilesMessage({
  files,
  message,
  timestamp,
  senderName,
  senderAvatar,
  isOwn = false,
  onDownload,
  onShare,
  onPreview,
  className = "",
}: MultipleFilesMessageProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const formatTime = (timestamp: string): string => {
    return new Date(timestamp).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTotalSize = (): string => {
    const totalBytes = files.reduce((sum: any, file: any) => sum + file.size, 0);
    const units = ["B", "KB", "MB", "GB"];
    let size = totalBytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const handlePreview = (index: number) => {
    setViewerIndex(index);
    setViewerOpen(true);
    onPreview?.(files, index);
  };

  return (
    <div className={`multiple-files-message ${isOwn ? "ml-auto" : "mr-auto"} max-w-md ${className}`}>
      {/* Message Header */}
      <div className="mb-2 flex items-center space-x-spacing-sm">
        {!isOwn && senderAvatar && <img src={senderAvatar} alt={senderName} className="h-6 w-6 rounded-ds-full" />}
        {!isOwn && senderName && <span className="text-foreground text-sm font-medium">{senderName}</span>}
        <div className="flex items-center text-tiny text-[var(--fl-color-text-muted)]">
          <Icon icon={Clock} size={16} className="mr-1" />
          {formatTime(timestamp)}
        </div>
      </div>

      {/* Text Message (if any) */}
      {message && (
        <div className={`mb-2 rounded-ds-lg spacing-3 ${isOwn ? "bg-brand-blue-500 text-white" : "bg-gray-100 text-gray-900"}`}>
          <p className="text-sm">{message}</p>
        </div>
      )}

      {/* Files Summary */}
      <Card className="border-2 border-dashed border-[var(--fl-color-border)]">
        <CardContent className="spacing-3">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center space-x-spacing-sm">
              <Icon icon={File} size={16} className="text-[var(--fl-color-text-muted)]" />
              <span className="text-sm font-medium">
                {files.length} files ({getTotalSize()})
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                files.forEach((file: any) => onDownload?.(file));
              }}
              className="text-tiny"
            >
              <Icon icon={Download} size={16} className="mr-1" />
              Download All
            </Button>
          </div>

          {/* Files Grid */}
          <div className="grid grid-cols-3 gap-ds-2">
            {files.slice(0, 6).map((file, index) => (
              <div
                key={file.id}
                className="aspect-square cursor-pointer overflow-hidden rounded-ds-lg transition-opacity hover:opacity-80"
                onClick={() => handlePreview(index)}
              >
                {file.thumbnailUrl ? (
                  <img src={file.thumbnailUrl} alt={file.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="bg-background flex h-full w-full items-center justify-center">
                    <span className="text-base">
                      {file.type.startsWith("image/")
                        ? "🖼️"
                        : file.type.startsWith("video/")
                          ? "🎥"
                          : file.type.startsWith("audio/")
                            ? "🎵"
                            : "📄"}
                    </span>
                  </div>
                )}
                {index === 5 && files.length > 6 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <span className="font-medium text-white">+{files.length - 6}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Media Viewer */}
      <MediaViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        files={files}
        currentIndex={viewerIndex}
        onIndexChange={setViewerIndex}
        onDownload={onDownload}
        onShare={onShare}
      />
    </div>
  );
}
