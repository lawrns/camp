"use client";

import React, { useCallback, useState } from "react";
import {
  Warning as AlertCircle,
  FileText,
  Globe,
  Link,
  Plus,
  Upload,
  X,
  Zap,
  CheckCircle,
  Clock,
  Download,
  File,
  FolderOpen,
  AlertCircle,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/Button-unified";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/unified-ui/components/Card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/unified-ui/components/dialog";
import { Input } from "@/components/unified-ui/components/input";
import { Label } from "@/components/unified-ui/components/label";
import { Progress } from "@/components/unified-ui/components/Progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/unified-ui/components/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/unified-ui/components/Tabs";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";

interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: "pending" | "uploading" | "processing" | "completed" | "error";
  progress: number;
  error?: string;
  extractedText?: string;
  chunks?: number;
  category?: string;
  tags?: string[];
}

interface DocumentUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (files: UploadFile[]) => void;
  categories: string[];
  availableTags: string[];
}

const supportedFileTypes = {
  "application/pdf": { icon: FileText, label: "PDF" },
  "text/plain": { icon: FileText, label: "Text" },
  "text/markdown": { icon: FileText, label: "Markdown" },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { icon: FileText, label: "Word" },
  "text/html": { icon: Globe, label: "HTML" },
  "application/json": { icon: File, label: "JSON" },
};

export function DocumentUpload({ isOpen, onClose, onUploadComplete, categories, availableTags }: DocumentUploadProps) {
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [defaultCategory, setDefaultCategory] = useState("");
  const [defaultTags, setDefaultTags] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles: UploadFile[] = acceptedFiles.map((file: any) => ({
        id: `file-${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "pending",
        progress: 0,
        category: defaultCategory,
        tags: [...defaultTags],
      }));

      setUploadFiles((prev) => [...prev, ...newFiles]);
    },
    [defaultCategory, defaultTags]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: Object.keys(supportedFileTypes).reduce<Record<string, string[]>>((acc, type) => {
      acc[type] = [];
      return acc;
    }, {}),
    multiple: true,
  });

  const removeFile = (fileId: string) => {
    setUploadFiles((prev) => prev.filter((f: any) => f.id !== fileId));
  };

  const updateFileMetadata = (fileId: string, updates: Partial<UploadFile>) => {
    setUploadFiles((prev) => prev.map((f: any) => (f.id === fileId ? { ...f, ...updates } : f)));
  };

  const addUrlDocument = () => {
    if (!urlInput.trim()) return;

    // Create a file-like object for URLs
    const fileName = urlInput.split("/").pop() || "url-document.html";
    const fileContent = urlInput;

    // Create a mock file object for URL content
    const mockFile = {
      name: fileName,
      size: fileContent.length,
      type: "text/html",
      lastModified: Date.now(),
      webkitRelativePath: "",
      stream: () => new ReadableStream(),
      text: () => Promise.resolve(fileContent),
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
      slice: () => new Blob(),
    } as File;

    const urlFile: UploadFile = {
      id: `url-${Date.now()}`,
      file: mockFile,
      name: urlInput,
      size: fileContent.length,
      type: "text/html",
      status: "pending",
      progress: 0,
      category: defaultCategory,
      tags: [...defaultTags],
    };

    setUploadFiles((prev) => [...prev, urlFile]);
    setUrlInput("");
  };

  const processFiles = async () => {
    setIsProcessing(true);

    for (const file of uploadFiles) {
      if (file.status !== "pending") continue;

      try {
        // Update status to uploading
        updateFileMetadata(file.id, { status: "uploading", progress: 0 });

        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          updateFileMetadata(file.id, { progress });
        }

        // Update status to processing
        updateFileMetadata(file.id, { status: "processing", progress: 100 });

        // Simulate text extraction and chunking
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const extractedText = `Extracted text from ${file.name}. This would contain the actual content of the document that has been processed and prepared for vector embedding.`;
        const chunks = Math.floor(Math.random() * 20) + 5; // Random chunk count

        updateFileMetadata(file.id, {
          status: "completed",
          extractedText,
          chunks,
        });
      } catch (error) {
        updateFileMetadata(file.id, {
          status: "error",
          error: "Failed to process file",
        });
      }
    }

    setIsProcessing(false);
  };

  const handleComplete = () => {
    const completedFiles = uploadFiles.filter((f: any) => f.status === "completed");
    onUploadComplete(completedFiles);
    setUploadFiles([]);
    onClose();
  };

  const getFile = (type: string) => {
    const fileType = supportedFileTypes[type as keyof typeof supportedFileTypes];
    return fileType?.icon || File;
  };

  const getStatusIcon = (status: UploadFile["status"]) => {
    switch (status) {
      case "completed":
        return CheckCircle;
      case "error":
        return AlertCircle;
      case "uploading":
      case "processing":
        return Clock;
      default:
        return File;
    }
  };

  const getStatusColor = (status: UploadFile["status"]) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "error":
        return "text-red-600";
      case "uploading":
      case "processing":
        return "text-blue-600";
      default:
        return "text-gray-600";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  const completedCount = uploadFiles.filter((f: any) => f.status === "completed").length;
  const errorCount = uploadFiles.filter((f: any) => f.status === "error").length;
  const totalChunks = uploadFiles.reduce((sum: any, f: any) => sum + (f.chunks || 0), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-ds-2">
            <Icon icon={Upload} className="h-5 w-5" />
            Upload Knowledge Documents
          </DialogTitle>
          <DialogDescription>
            Add documents to your knowledge base with automatic text extraction and chunking
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="files" className="flex h-full flex-col">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="files">File Upload</TabsTrigger>
              <TabsTrigger value="url">URL Import</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="files" className="flex-1 space-y-3 overflow-y-auto">
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={cn(
                  "cursor-pointer rounded-ds-lg border-2 border-dashed spacing-8 text-center transition-colors",
                  isDragActive
                    ? "bg-status-info-light border-brand-blue-500"
                    : "border-[var(--fl-color-border-strong)] hover:border-neutral-400"
                )}
              >
                <input {...getInputProps()} />
                <Icon icon={Upload} className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <p className="mb-2 text-base font-medium">
                  {isDragActive ? "Drop files here" : "Drag & drop files here"}
                </p>
                <p className="mb-4 text-sm text-[var(--fl-color-text-muted)]">or click to select files</p>
                <div className="flex flex-wrap justify-center gap-ds-2">
                  {Object.entries(supportedFileTypes).map(([type, { label }]) => (
                    <Badge key={type} variant="outline" className="text-tiny">
                      {label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* File List */}
              {uploadFiles.length > 0 && (
                <div className="space-y-spacing-sm">
                  <h3 className="font-medium">Files to Process ({uploadFiles.length})</h3>
                  {uploadFiles.map((file: any) => {
                    const File = getFile(file.type);
                    const StatusIcon = getStatusIcon(file.status);

                    return (
                      <Card key={file.id}>
                        <CardContent className="spacing-3">
                          <div className="flex items-center gap-3">
                            <File className="h-8 w-8 text-gray-400" />
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center justify-between">
                                <p className="truncate font-medium">{file.name}</p>
                                <div className="flex items-center gap-ds-2">
                                  <StatusIcon className={cn("h-4 w-4", getStatusColor(file.status))} />
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(file.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <Icon icon={X} className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              <div className="mb-2 flex items-center gap-3 text-tiny text-[var(--fl-color-text-muted)]">
                                <span>{formatFileSize(file.size)}</span>
                                <span className="capitalize">{file.status}</span>
                                {file.chunks && <span>{file.chunks} chunks</span>}
                              </div>

                              {(file.status === "uploading" || file.status === "processing") && (
                                <Progress value={file.progress} className="h-2" />
                              )}

                              {file.error && <p className="mt-1 text-tiny text-red-600">{file.error}</p>}

                              {file.status === "completed" && file.extractedText && (
                                <p className="text-foreground mt-1 line-clamp-2 text-tiny">{file.extractedText}</p>
                              )}

                              {/* File metadata */}
                              <div className="mt-2 flex items-center gap-ds-2">
                                {file.category && (
                                  <Badge variant="outline" className="text-tiny">
                                    {file.category}
                                  </Badge>
                                )}
                                {file.tags?.map((tag: any) => (
                                  <Badge key={tag} variant="secondary" className="text-tiny">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="url" className="space-y-3">
              <div>
                <Label htmlFor="url">Website URL</Label>
                <div className="mt-1 flex gap-ds-2">
                  <Input
                    id="url"
                    value={urlInput}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrlInput(e.target.value)}
                    placeholder="https://example.com/docs"
                  />
                  <Button onClick={addUrlDocument} disabled={!urlInput.trim()}>
                    <Icon icon={Plus} className="h-4 w-4" />
                  </Button>
                </div>
                <p className="mt-1 text-tiny text-[var(--fl-color-text-muted)]">
                  Import content from web pages, documentation sites, or APIs
                </p>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-3">
              <div>
                <Label>Default Category</Label>
                <Select value={defaultCategory} onValueChange={setDefaultCategory}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select default category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category: any) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Default Tags</Label>
                <Select
                  onValueChange={(tag) => {
                    if (!defaultTags.includes(tag)) {
                      setDefaultTags((prev) => [...prev, tag]);
                    }
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Add default tags" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTags
                      .filter((tag: any) => !defaultTags.includes(tag))
                      .map((tag: any) => (
                        <SelectItem key={tag} value={tag}>
                          {tag}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <div className="mt-2 flex flex-wrap gap-1">
                  {defaultTags.map((tag: any) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer hover:bg-[var(--fl-color-danger-subtle)]"
                      onClick={() => setDefaultTags((prev) => prev.filter((t: any) => t !== tag))}
                    >
                      {tag}
                      <Icon icon={X} className="ml-1 h-3 w-3" />
                    </Badge>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Summary */}
        {uploadFiles.length > 0 && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-4 gap-3 text-center text-sm">
              <div>
                <div className="font-medium">{uploadFiles.length}</div>
                <div className="text-[var(--fl-color-text-muted)]">Total Files</div>
              </div>
              <div>
                <div className="text-semantic-success-dark font-medium">{completedCount}</div>
                <div className="text-[var(--fl-color-text-muted)]">Completed</div>
              </div>
              <div>
                <div className="font-medium text-red-600">{errorCount}</div>
                <div className="text-[var(--fl-color-text-muted)]">Errors</div>
              </div>
              <div>
                <div className="font-medium text-blue-600">{totalChunks}</div>
                <div className="text-[var(--fl-color-text-muted)]">Total Chunks</div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {uploadFiles.length > 0 && (
            <>
              <Button
                onClick={processFiles}
                disabled={isProcessing || uploadFiles.every((f) => f.status !== "pending")}
                className="gap-ds-2"
              >
                {isProcessing ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-ds-full border-b-2 border-current" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Icon icon={Brain} className="h-4 w-4" />
                    Process Files
                  </>
                )}
              </Button>
              {completedCount > 0 && (
                <Button onClick={handleComplete} className="gap-ds-2">
                  <Icon icon={CheckCircle} className="h-4 w-4" />
                  Complete Upload
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
