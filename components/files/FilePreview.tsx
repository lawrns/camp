/**
 * TASK-201: File Preview Components
 *
 * Comprehensive file preview system supporting multiple file types
 * with optimized rendering and user interactions.
 */

"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Archive,
  ArrowSquareOut,
  Download,
  Eye,
  File,
  FileText,
  Image as ImageIcon,
  MusicNote as Music,
  Pause,
  Play,
  ArrowClockwise as RotateCw,
  Share,
  VideoCamera as Video,
  SpeakerHigh as Volume2,
  SpeakerSlash as VolumeX,
  X,
  MagnifyingGlassPlus as ZoomIn,
  MagnifyingGlassMinus as ZoomOut,
} from "@phosphor-icons/react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent } from "@/components/unified-ui/components/Card";
import { FileMetadata } from "@/lib/files/FileService";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/utils/date";

// Re-export FileMetadata for other components
export type { FileMetadata };

export interface FilePreviewProps {
  file: FileMetadata;
  className?: string;
  showActions?: boolean;
  onDownload?: (file: FileMetadata) => void;
  onDelete?: (file: FileMetadata) => void;
  size?: "sm" | "md" | "lg";
}

/**
 * Main File Preview Component
 * Automatically selects the appropriate preview based on file type
 */
export function FilePreview({
  file,
  className,
  showActions = true,
  onDownload,
  onDelete,
  size = "md",
}: FilePreviewProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get file type category
  const getFileCategory = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    if (mimeType.includes("pdf")) return "pdf";
    if (mimeType.includes("text/") || mimeType.includes("document")) return "document";
    if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("7z")) return "archive";
    return "file";
  };

  // Get appropriate icon
  const getFile = (mimeType: string): React.ComponentType<any> => {
    const category = getFileCategory(mimeType);
    switch (category) {
      case "image":
        return ImageIcon;
      case "video":
        return Video;
      case "audio":
        return Music;
      case "pdf":
      case "document":
        return FileText;
      case "archive":
        return Archive;
      default:
        return File;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Handle file download
  const handleDownload = () => {
    if (onDownload) {
      onDownload(file);
    } else if (file.url) {
      // Create a temporary link and click it
      const link = document.createElement("a");
      link.href = file.url;
      link.download = file.originalName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Handle file deletion
  const handleDelete = () => {
    if (onDelete && confirm(`Are you sure you want to delete "${file.originalName}"?`)) {
      onDelete(file);
    }
  };

  // Open external link
  const handleOpenExternal = () => {
    if (file.url) {
      window.open(file.url, "_blank");
    }
  };

  const File: React.ComponentType<any> = getFile(file.mimeType);
  const category = getFileCategory(file.mimeType);

  // Size configurations
  const sizeConfig = {
    sm: {
      container: "spacing-2",
      image: "w-8 h-8",
      icon: "w-8 h-8",
      title: "text-xs",
      subtitle: "text-xs",
      actions: "space-x-1",
    },
    md: {
      container: "spacing-3",
      image: "w-12 h-12",
      icon: "w-12 h-12",
      title: "text-sm",
      subtitle: "text-xs",
      actions: "space-x-2",
    },
    lg: {
      container: "spacing-4",
      image: "w-16 h-16",
      icon: "w-16 h-16",
      title: "text-base",
      subtitle: "text-sm",
      actions: "space-x-3",
    },
  };

  const config = sizeConfig[size];

  return (
    <>
      <div
        className={cn(
          "flex items-center rounded-ds-lg border border-[var(--fl-color-border)] bg-white transition-colors hover:border-[var(--fl-color-border-strong)]",
          config.container,
          className
        )}
      >
        {/* File Icon/Thumbnail */}
        <div className="mr-3 flex-shrink-0">
          {file.thumbnailUrl && !imageError ? (
            <img
              src={file.thumbnailUrl}
              alt={file.originalName}
              className={cn("rounded-ds-md object-cover", config.image)}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className={cn("flex items-center justify-center rounded-ds-md bg-neutral-100", config.image)}>
              <File
                className={cn(
                  "text-[var(--fl-color-text-muted)]",
                  size === "sm" ? "h-4 w-4" : size === "md" ? "h-6 w-6" : "h-8 w-8"
                )}
              />
            </div>
          )}
        </div>

        {/* File Info */}
        <div className="min-w-0 flex-1">
          <div className={cn("truncate font-medium text-neutral-900", config.title)}>{file.originalName}</div>
          <div className={cn("flex items-center space-x-2 text-neutral-500", config.subtitle)}>
            <span>{formatFileSize(file.size)}</span>
            <span>•</span>
            <span>{formatDate(file.uploadedAt)}</span>
          </div>
          {file.description && (
            <div className={cn("mt-1 truncate text-neutral-600", config.subtitle)}>{file.description}</div>
          )}
          {file.tags && file.tags.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {file.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="inline-block rounded-ds-full bg-[var(--fl-color-info-subtle)] px-2 py-0.5 text-tiny text-blue-800"
                >
                  {tag}
                </span>
              ))}
              {file.tags.length > 3 && (
                <span className="text-tiny text-[var(--fl-color-text-muted)]">+{file.tags.length - 3} more</span>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className={cn("flex items-center", config.actions)}>
            {/* Preview button for supported file types */}
            {(category === "image" || category === "pdf") && (
              <button
                onClick={() => setIsPreviewOpen(true)}
                className="spacing-1 text-gray-400 transition-colors hover:text-blue-600"
                title="Preview"
              >
                <Icon icon={Eye} className="h-4 w-4" />
              </button>
            )}

            {/* Download button */}
            <button
              onClick={handleDownload}
              className="hover:text-semantic-success-dark spacing-1 text-gray-400 transition-colors"
              title="Download"
            >
              <Icon icon={Download} className="h-4 w-4" />
            </button>

            {/* External link button */}
            {file.url && (
              <button
                onClick={handleOpenExternal}
                className="spacing-1 text-gray-400 transition-colors hover:text-blue-600"
                title="Open in new tab"
              >
                <Icon icon={ArrowSquareOut} className="h-4 w-4" />
              </button>
            )}

            {/* Delete button */}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="spacing-1 text-gray-400 transition-colors hover:text-red-600"
                title="Delete"
              >
                <Icon icon={X} className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="relative max-h-full max-w-4xl spacing-3">
            {/* Close button */}
            <button
              onClick={() => setIsPreviewOpen(false)}
              className="absolute right-4 top-4 z-10 rounded-ds-full bg-black bg-opacity-50 p-spacing-sm text-white transition-colors hover:bg-opacity-75"
            >
              <Icon icon={X} className="h-6 w-6" />
            </button>

            {/* Preview content */}
            <div className="bg-background max-h-[90vh] max-w-[90vw] overflow-hidden rounded-ds-lg">
              {category === "image" && file.url && (
                <img src={file.url} alt={file.originalName} className="max-h-[80vh] max-w-full object-contain" />
              )}

              {category === "pdf" && file.url && (
                <iframe src={file.url} className="h-[80vh] w-full" title={file.originalName} />
              )}

              {/* File info in preview */}
              <div className="border-t bg-[var(--fl-color-background-subtle)] spacing-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{file.originalName}</div>
                    <div className="text-sm text-[var(--fl-color-text-muted)]">
                      {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                    </div>
                  </div>
                  <div className="flex space-x-spacing-sm">
                    <Button variant="outline" onClick={handleDownload} leftIcon={<Icon icon={Download} className="h-4 w-4" />}>
                      Download
                    </Button>
                    {file.url && (
                      <Button variant="outline" onClick={handleOpenExternal} leftIcon={<Icon icon={ArrowSquareOut} className="h-4 w-4" />}>
                        Open in new tab
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Image Preview Component with zoom and pan
 */
function ImagePreview({
  file,
  maxWidth,
  maxHeight,
  onFullscreen,
}: {
  file: FileMetadata;
  maxWidth: number;
  maxHeight: number;
  onFullscreen?: (file: FileMetadata) => void;
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const handleImageLoad = () => {
    setLoading(false);
  };

  const handleImageError = () => {
    setLoading(false);
    setError(true);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.2, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.2, 0.5));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  if (error) {
    return (
      <div className="bg-background flex h-48 items-center justify-center rounded-ds-lg">
        <div className="text-center">
          <ImageIcon className="mx-auto mb-2 h-12 w-12 text-gray-400" />
          <p className="text-[var(--fl-color-text-muted)]">Failed to load image</p>
        </div>
      </div>
    );
  }

  return (
    <div className="image-preview">
      {/* Image Controls */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center space-x-spacing-sm">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <Icon icon={ZoomOut} className="h-4 w-4" />
          </Button>
          <span className="text-foreground text-sm">{Math.round(zoom * 100)}%</span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <Icon icon={ZoomIn} className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleRotate}>
            <Icon icon={RotateCw} className="h-4 w-4" />
          </Button>
        </div>
        {onFullscreen && (
          <Button variant="outline" size="sm" onClick={() => onFullscreen(file)} leftIcon={<Icon icon={Eye} className="h-4 w-4" />}>
            Fullscreen
          </Button>
        )}
      </div>

      {/* Image Container */}
      <div
        className="image-container bg-background flex items-center justify-center overflow-hidden rounded-ds-lg"
        style={{ maxWidth, maxHeight }}
      >
        {loading && (
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-ds-full border-b-2 border-[var(--fl-color-brand)]"></div>
          </div>
        )}
        <img
          src={file.thumbnailUrl || file.url}
          alt={file.name}
          className="max-h-full max-w-full object-contain transition-transform duration-200"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            display: loading ? "none" : "block",
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onClick={() => onFullscreen?.(file)}
        />
      </div>
    </div>
  );
}

/**
 * Video Preview Component with controls
 */
function VideoPreview({ file, maxWidth, maxHeight }: { file: FileMetadata; maxWidth: number; maxHeight: number }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <div className="video-preview">
      <div className="video-container overflow-hidden rounded-ds-lg bg-black" style={{ maxWidth, maxHeight }}>
        <video
          ref={videoRef}
          src={file.url}
          className="h-full w-full"
          controls
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          Your browser does not support the video tag.
        </video>
      </div>

      {/* Custom Controls */}
      <div className="mt-2 flex items-center justify-center space-x-spacing-sm">
        <Button variant="outline" size="sm" onClick={togglePlay}>
          {isPlaying ? <Icon icon={Pause} className="h-4 w-4" /> : <Icon icon={Play} className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="sm" onClick={toggleMute}>
          {isMuted ? <Icon icon={VolumeX} className="h-4 w-4" /> : <Icon icon={Volume2} className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

/**
 * Audio Preview Component with player
 */
function AudioPreview({ file }: { file: FileMetadata }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (time: number): string => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="audio-preview rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-3">
      <audio
        ref={audioRef}
        src={file.url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="flex items-center space-x-spacing-md">
        <Button variant="outline" size="sm" onClick={togglePlay}>
          {isPlaying ? <Icon icon={Pause} className="h-4 w-4" /> : <Icon icon={Play} className="h-4 w-4" />}
        </Button>

        <div className="flex-1">
          <div className="text-foreground mb-1 flex items-center justify-between text-sm">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="h-2 w-full rounded-ds-full bg-gray-200">
            <div
              className="h-2 rounded-ds-full bg-brand-blue-500 transition-all duration-100"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
        </div>

        <Icon icon={Music} className="text-semantic-success h-5 w-5" />
      </div>
    </div>
  );
}

/**
 * Document Preview Component (PDF)
 */
function DocumentPreview({ file, maxWidth, maxHeight }: { file: FileMetadata; maxWidth: number; maxHeight: number }) {
  return (
    <div className="document-preview">
      <div className="document-container overflow-hidden rounded-ds-lg border" style={{ maxWidth, maxHeight }}>
        <iframe src={`${file.url}#toolbar=0`} className="h-96 w-full" title={file.name} />
      </div>
      <div className="mt-2 text-center">
        <Button variant="outline" onClick={() => window.open(file.url, "_blank")} leftIcon={<Icon icon={ArrowSquareOut} className="h-4 w-4" />}>
          Open PDF
        </Button>
      </div>
    </div>
  );
}

/**
 * Generic File Preview for unsupported types
 */
function GenericFilePreview({ file }: { file: FileMetadata }) {
  const getFileTypeLabel = (type: string): string => {
    if (type.includes("zip")) return "Archive";
    if (type.includes("text")) return "Text Document";
    if (type.includes("json")) return "JSON Data";
    if (type.includes("xml")) return "XML Document";
    return "File";
  };

  return (
    <div className="generic-file-preview rounded-ds-lg bg-[var(--fl-color-background-subtle)] p-spacing-lg text-center">
      <Icon icon={File} className="mx-auto mb-4 h-16 w-16 text-gray-400" />
      <h3 className="mb-2 text-base font-medium text-gray-900">{file.name}</h3>
      <Badge variant="secondary" className="mb-4">
        {getFileTypeLabel(file.type)}
      </Badge>
      <p className="text-foreground mb-4">This file type cannot be previewed in the browser.</p>
      <Button onClick={() => window.open(file.url, "_blank")} leftIcon={<Icon icon={Download} className="h-4 w-4" />}>
        Download to View
      </Button>
    </div>
  );
}
