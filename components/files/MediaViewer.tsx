/**
 * TASK-201: Media Viewer Modal
 *
 * Full-screen media viewer with advanced controls for images, videos, and documents.
 * Supports keyboard navigation, zoom, pan, and slideshow functionality.
 */

"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { CaretLeft as ChevronLeft, CaretRight as ChevronRight, Download, Info, ArrowsOut as Maximize, ArrowsIn as Minimize, Pause, Play, ArrowClockwise as RotateCw, Share, SpeakerHigh as Volume2, SpeakerSlash as VolumeX, X, MagnifyingGlassPlus as ZoomIn, MagnifyingGlassMinus as ZoomOut,  } from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/unified-ui/components/dialog";
import { Icon } from "@/lib/ui/Icon";
import { FileMetadata } from "./FilePreview";

export interface MediaViewerProps {
  isOpen: boolean;
  onClose: () => void;
  files: FileMetadata[];
  currentIndex: number;
  onIndexChange?: ((index: number) => void) | undefined;
  onDownload?: ((file: FileMetadata) => void) | undefined;
  onShare?: ((file: FileMetadata) => void) | undefined;
}

export function MediaViewer({
  isOpen,
  onClose,
  files,
  currentIndex,
  onIndexChange,
  onDownload,
  onShare,
}: MediaViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const currentFile = files[currentIndex];

  // Reset zoom and rotation when file changes
  useEffect(() => {
    setZoom(1);
    setRotation(0);
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          goToPrevious();
          break;
        case "ArrowRight":
          goToNext();
          break;
        case "+":
        case "=":
          handleZoomIn();
          break;
        case "-":
          handleZoomOut();
          break;
        case "r":
        case "R":
          handleRotate();
          break;
        case "i":
        case "I":
          setShowInfo(!showInfo);
          break;
        case "f":
        case "F":
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, showInfo, currentIndex]);

  const goToPrevious = useCallback(() => {
    if (files.length > 1) {
      const newIndex = currentIndex > 0 ? currentIndex - 1 : files.length - 1;
      onIndexChange?.(newIndex);
    }
  }, [currentIndex, files.length, onIndexChange]);

  const goToNext = useCallback(() => {
    if (files.length > 1) {
      const newIndex = currentIndex < files.length - 1 ? currentIndex + 1 : 0;
      onIndexChange?.(newIndex);
    }
  }, [currentIndex, files.length, onIndexChange]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev * 1.2, 5));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev / 1.2, 0.1));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const resetView = () => {
    setZoom(1);
    setRotation(0);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
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

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!currentFile) return null;

  const renderMediaContent = () => {
    if (currentFile.type.startsWith("image/")) {
      return (
        <div className="flex h-full items-center justify-center">
          <img
            ref={imageRef}
            src={currentFile.url}
            alt={currentFile.name}
            className="max-h-full max-w-full cursor-grab object-contain transition-transform duration-200 active:cursor-grabbing"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
            draggable={false}
          />
        </div>
      );
    }

    if (currentFile.type.startsWith("video/")) {
      return (
        <div className="flex h-full items-center justify-center">
          <video src={currentFile.url} controls className="max-h-full max-w-full" autoPlay={false}>
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    if (currentFile.type === "application/pdf") {
      return (
        <div className="h-full w-full">
          <iframe src={currentFile.url} className="h-full w-full border-0" title={currentFile.name} />
        </div>
      );
    }

    // Generic file view
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-6xl">📄</div>
          <h3 className="mb-2 text-lg font-medium">{currentFile.name}</h3>
          <p className="text-foreground mb-4">This file type cannot be previewed</p>
          <Button onClick={() => window.open(currentFile.url, "_blank")} leftIcon={<Icon icon={Download} className="h-4 w-4" />}>
            Download
          </Button>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="h-[90vh] w-full max-w-screen-xl bg-black p-0" ref={containerRef}>
        {/* Header */}
        <div className="absolute left-0 right-0 top-0 z-10 bg-black bg-opacity-75 spacing-3 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-spacing-md">
              <h2 className="max-w-md truncate text-base font-medium">{currentFile.name}</h2>
              <Badge variant="secondary">
                {currentIndex + 1} of {files.length}
              </Badge>
            </div>

            <div className="flex items-center space-x-spacing-sm">
              {/* Image Controls */}
              {currentFile.type.startsWith("image/") && (
                <>
                  <Button variant="ghost" size="sm" onClick={handleZoomOut}>
                    <Icon icon={ZoomOut} className="h-4 w-4" />
                  </Button>
                  <span className="px-2 text-sm">{Math.round(zoom * 100)}%</span>
                  <Button variant="ghost" size="sm" onClick={handleZoomIn}>
                    <Icon icon={ZoomIn} className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleRotate}>
                    <Icon icon={RotateCw} className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={resetView}>
                    Reset
                  </Button>
                </>
              )}

              {/* General Controls */}
              <Button variant="ghost" size="sm" onClick={() => setShowInfo(!showInfo)}>
                <Icon icon={Info} className="h-4 w-4" />
              </Button>

              {onShare && (
                <Button variant="ghost" size="sm" onClick={() => onShare(currentFile)}>
                  <Icon icon={Share} className="h-4 w-4" />
                </Button>
              )}

              {onDownload && (
                <Button variant="ghost" size="sm" onClick={() => onDownload(currentFile)}>
                  <Icon icon={Download} className="h-4 w-4" />
                </Button>
              )}

              <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
                {isFullscreen ? (
                  <Icon icon={Minimize} className="h-4 w-4" />
                ) : (
                  <Icon icon={Maximize} className="h-4 w-4" />
                )}
              </Button>

              <Button variant="ghost" size="sm" onClick={onClose}>
                <Icon icon={X} className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        {files.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="absolute left-4 top-1/2 z-10 -translate-y-1/2 transform bg-black bg-opacity-50 text-white hover:bg-opacity-75"
              onClick={goToPrevious}
            >
              <Icon icon={ChevronLeft} className="h-6 w-6" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-4 top-1/2 z-10 -translate-y-1/2 transform bg-black bg-opacity-50 text-white hover:bg-opacity-75"
              onClick={goToNext}
            >
              <Icon icon={ChevronRight} className="h-6 w-6" />
            </Button>
          </>
        )}

        {/* Media Content */}
        <div className="h-full w-full pb-4 pt-16">{renderMediaContent()}</div>

        {/* File Info Panel */}
        {showInfo && (
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-90 spacing-3 text-white">
            <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
              <div>
                <span className="text-gray-400">File Name:</span>
                <p className="font-medium">{currentFile.name}</p>
              </div>
              <div>
                <span className="text-gray-400">File Size:</span>
                <p className="font-medium">{formatFileSize(currentFile.size)}</p>
              </div>
              <div>
                <span className="text-gray-400">File Type:</span>
                <p className="font-medium">{currentFile.type}</p>
              </div>
              <div>
                <span className="text-gray-400">Uploaded:</span>
                <p className="font-medium">{formatDate(currentFile.uploadedAt)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Thumbnail Strip for Multiple Files */}
        {files.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 transform rounded-ds-lg bg-black bg-opacity-75 p-spacing-sm">
            <div className="flex max-w-md space-x-spacing-sm overflow-x-auto">
              {files.map((file, index) => (
                <button
                  key={file.id}
                  className={`h-12 w-12 flex-shrink-0 overflow-hidden rounded border-2 ${
                    index === currentIndex ? "border-white" : "border-gray-600"
                  }`}
                  onClick={() => onIndexChange?.(index)}
                >
                  {file.thumbnailUrl ? (
                    <img src={file.thumbnailUrl} alt={file.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-neutral-700 text-tiny text-white">
                      {file.type.startsWith("image/")
                        ? "🖼️"
                        : file.type.startsWith("video/")
                          ? "🎥"
                          : file.type.startsWith("audio/")
                            ? "🎵"
                            : "📄"}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
