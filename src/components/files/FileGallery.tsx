/**
 * TASK-201: File Gallery Component
 *
 * Comprehensive file browser with search, filtering, sorting, and management capabilities.
 * Supports grid and list views with bulk operations.
 */

"use client";

import React, { useMemo, useState } from "react";
import {
  Calendar,
  Download,
  Eye,
  File,
  FileText,
  Filter,
  Grid3X3,
  ImageIcon,
  List,
  MoreVertical,
  Music,
  Search,
  Share,
  ArrowUp as SortAsc,
  ArrowDown as SortDesc,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/unified-ui/components/dropdown-menu";
import { Input } from "@/components/unified-ui/components/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Icon } from "@/lib/ui/Icon";
import { FileMetadata } from "./FilePreview";
import { MediaViewer } from "./MediaViewer";

export interface FileGalleryProps {
  files: FileMetadata[];
  onFileSelect?: (file: FileMetadata) => void;
  onFileDownload?: (file: FileMetadata) => void;
  onFileShare?: (file: FileMetadata) => void;
  onFileDelete?: (file: FileMetadata) => void;
  onUpload?: () => void;
  loading?: boolean;
  className?: string;
}

type ViewMode = "grid" | "list";
type SortField = "name" | "size" | "type" | "uploadedAt";
type SortOrder = "asc" | "desc";
type FileTypeFilter = "all" | "images" | "videos" | "audio" | "documents" | "other";

export function FileGallery({
  files,
  onFileSelect,
  onFileDownload,
  onFileShare,
  onFileDelete,
  onUpload,
  loading = false,
  className = "",
}: FileGalleryProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<FileTypeFilter>("all");
  const [sortField, setSortField] = useState<SortField>("uploadedAt");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  // Filter and sort files
  const filteredAndSortedFiles = useMemo(() => {
    let filtered = files;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((file: unknown) => file.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((file: unknown) => {
        switch (typeFilter) {
          case "images":
            return file.type.startsWith("image/");
          case "videos":
            return file.type.startsWith("video/");
          case "audio":
            return file.type.startsWith("audio/");
          case "documents":
            return (
              file.type === "application/pdf" ||
              file.type.startsWith("text/") ||
              file.type.includes("document") ||
              file.type.includes("spreadsheet") ||
              file.type.includes("presentation")
            );
          case "other":
            return (
              !file.type.startsWith("image/") &&
              !file.type.startsWith("video/") &&
              !file.type.startsWith("audio/") &&
              file.type !== "application/pdf" &&
              !file.type.startsWith("text/") &&
              !file.type.includes("document") &&
              !file.type.includes("spreadsheet") &&
              !file.type.includes("presentation")
            );
          default:
            return true;
        }
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: unknown, bValue: unknown;

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "size":
          aValue = a.size;
          bValue = b.size;
          break;
        case "type":
          aValue = a.type;
          bValue = b.type;
          break;
        case "uploadedAt":
          aValue = new Date(a.uploadedAt).getTime();
          bValue = new Date(b.uploadedAt).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [files, searchQuery, typeFilter, sortField, sortOrder]);

  const getFile = (type: string) => {
    if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-[var(--fl-color-info)]" />;
    if (type.startsWith("video/")) return <Icon icon={Video} className="h-4 w-4 text-purple-500" />;
    if (type.startsWith("audio/")) return <Icon icon={Music} className="text-semantic-success h-4 w-4" />;
    if (type === "application/pdf" || type.startsWith("text/"))
      return <Icon icon={FileText} className="text-brand-mahogany-500 h-4 w-4" />;
    return <Icon icon={File} className="h-4 w-4 text-[var(--fl-color-text-muted)]" />;
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
      month: "short",
      day: "numeric",
    });
  };

  const handleFileClick = (file: FileMetadata, index: number) => {
    if (file.type.startsWith("image/") || file.type.startsWith("video/") || file.type === "application/pdf") {
      setViewerIndex(index);
      setViewerOpen(true);
    } else {
      onFileSelect?.(file);
    }
  };

  const toggleFileSelection = (fileId: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  const clearSelection = () => {
    setSelectedFiles(new Set());
  };

  const getFileTypeCount = (type: FileTypeFilter): number => {
    if (type === "all") return files.length;
    return files.filter((file: unknown) => {
      switch (type) {
        case "images":
          return file.type.startsWith("image/");
        case "videos":
          return file.type.startsWith("video/");
        case "audio":
          return file.type.startsWith("audio/");
        case "documents":
          return file.type === "application/pdf" || file.type.startsWith("text/");
        case "other":
          return (
            !file.type.startsWith("image/") &&
            !file.type.startsWith("video/") &&
            !file.type.startsWith("audio/") &&
            file.type !== "application/pdf" &&
            !file.type.startsWith("text/")
          );
        default:
          return false;
      }
    }).length;
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-ds-full border-b-2 border-[var(--fl-color-brand)]"></div>
      </div>
    );
  }

  return (
    <div className={`file-gallery ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Files ({filteredAndSortedFiles.length})</CardTitle>
            <div className="flex items-center space-x-spacing-sm">
              {onUpload && (
                <Button onClick={onUpload} leftIcon={<Icon icon={Upload} className="h-4 w-4" />}>
                  Upload Files
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
                {viewMode === "grid" ? (
                  <Icon icon={List} className="h-4 w-4" />
                ) : (
                  <Icon icon={Grid3X3} className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Icon
                icon={Search}
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400"
              />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={typeFilter} onValueChange={(value: string) => setTypeFilter(value as FileTypeFilter)}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Files ({getFileTypeCount("all")})</SelectItem>
                <SelectItem value="images">Images ({getFileTypeCount("images")})</SelectItem>
                <SelectItem value="videos">Videos ({getFileTypeCount("videos")})</SelectItem>
                <SelectItem value="audio">Audio ({getFileTypeCount("audio")})</SelectItem>
                <SelectItem value="documents">Documents ({getFileTypeCount("documents")})</SelectItem>
                <SelectItem value="other">Other ({getFileTypeCount("other")})</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={`${sortField}-${sortOrder}`}
              onValueChange={(value: string) => {
                const [field, order] = value.split("-") as [SortField, SortOrder];
                setSortField(field);
                setSortOrder(order);
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
                <SelectItem value="uploadedAt-desc">Newest First</SelectItem>
                <SelectItem value="uploadedAt-asc">Oldest First</SelectItem>
                <SelectItem value="size-desc">Largest First</SelectItem>
                <SelectItem value="size-asc">Smallest First</SelectItem>
                <SelectItem value="type-asc">Type A-Z</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedFiles.size > 0 && (
            <div className="flex items-center justify-between rounded-ds-lg bg-[var(--fl-color-info-subtle)] spacing-3">
              <span className="text-sm font-medium">
                {selectedFiles.size} file{selectedFiles.size > 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center space-x-spacing-sm">
                <Button variant="outline" size="sm" onClick={clearSelection}>
                  Clear
                </Button>
                <Button variant="outline" size="sm" leftIcon={<Icon icon={Download} className="h-4 w-4" />}>
                  Download
                </Button>
                <Button variant="outline" size="sm" leftIcon={<Icon icon={Trash2} className="h-4 w-4" />}>
                  Delete
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent>
          {filteredAndSortedFiles.length === 0 ? (
            <div className="py-12 text-center">
              <Icon icon={File} className="mx-auto mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-base font-medium text-gray-900">No files found</h3>
              <p className="text-foreground mb-4">
                {searchQuery || typeFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Upload some files to get started"}
              </p>
              {onUpload && (
                <Button onClick={onUpload} leftIcon={<Icon icon={Upload} className="h-4 w-4" />}>
                  Upload Files
                </Button>
              )}
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6"
                  : "space-y-2"
              }
            >
              {filteredAndSortedFiles.map((file, index) => (
                <div
                  key={file.id}
                  className={` ${
                    viewMode === "grid"
                      ? "aspect-square cursor-pointer overflow-hidden rounded-ds-lg border transition-shadow hover:shadow-md"
                      : "flex cursor-pointer items-center rounded-ds-lg border spacing-3 hover:bg-[var(--fl-color-background-subtle)]"
                  } ${selectedFiles.has(file.id) ? "ring-2 ring-blue-500" : ""} `}
                  onClick={() => handleFileClick(file, index)}
                >
                  {viewMode === "grid" ? (
                    <div className="flex h-full w-full flex-col">
                      <div className="bg-background relative flex flex-1 items-center justify-center">
                        {file.thumbnailUrl ? (
                          <img src={file.thumbnailUrl} alt={file.name} className="h-full w-full object-cover" />
                        ) : (
                          <div className="text-3xl">
                            {file.type.startsWith("image/")
                              ? "🖼️"
                              : file.type.startsWith("video/")
                                ? "🎥"
                                : file.type.startsWith("audio/")
                                  ? "🎵"
                                  : "📄"}
                          </div>
                        )}
                        <input
                          type="checkbox"
                          checked={selectedFiles.has(file.id)}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            e.stopPropagation();
                            toggleFileSelection(file.id);
                          }}
                          className="absolute left-2 top-2"
                        />
                      </div>
                      <div className="p-spacing-sm">
                        <p className="truncate text-tiny font-medium" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-tiny text-[var(--fl-color-text-muted)]">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.id)}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          e.stopPropagation();
                          toggleFileSelection(file.id);
                        }}
                        className="mr-3"
                      />
                      <div className="flex min-w-0 flex-1 items-center space-x-3">
                        {getFile(file.type)}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{file.name}</p>
                          <p className="text-sm text-[var(--fl-color-text-muted)]">
                            {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                            <Icon icon={MoreVertical} className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => handleFileClick(file, index)}>
                            <Icon icon={Eye} className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          {onFileDownload && (
                            <DropdownMenuItem onClick={() => onFileDownload(file)}>
                              <Icon icon={Download} className="mr-2 h-4 w-4" />
                              Download
                            </DropdownMenuItem>
                          )}
                          {onFileShare && (
                            <DropdownMenuItem onClick={() => onFileShare(file)}>
                              <Icon icon={Share} className="mr-2 h-4 w-4" />
                              Share
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {onFileDelete && (
                            <DropdownMenuItem onClick={() => onFileDelete(file)} className="text-red-600">
                              <Icon icon={Trash2} className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Media Viewer */}
      <MediaViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        files={filteredAndSortedFiles}
        currentIndex={viewerIndex}
        onIndexChange={setViewerIndex}
        onDownload={onFileDownload}
        onShare={onFileShare}
      />
    </div>
  );
}
