"use client";

import React, { useCallback, useState } from "react";
import {
  Warning as AlertCircle,
  CheckCircle,
  Clock,
  Code,
  FileText,
  Globe,
  Link,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { Badge } from "@/components/unified-ui/components/Badge";
import { Button } from "@/components/ui/button";
// Temporarily disable animations to fix infinite loop
// import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from "@/components/unified-ui/components/textarea";
import { Icon } from "@/lib/ui/Icon";
import { useKnowledgeUpload } from "./KnowledgeUploadProvider";

interface KnowledgeUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type UploadMethod = "file" | "url" | "markdown";

const uploadMethods = [
  {
    id: "file" as const,
    title: "Upload Files",
    description: "PDF, Word, Text files",
    icon: <Icon icon={Upload} className="h-5 w-5" />,
    color: "bg-campfire-primary-50 text-campfire-primary border-campfire-primary-200",
  },
  {
    id: "url" as const,
    title: "Web URL",
    description: "Crawl website content",
    icon: <Icon icon={Globe} className="h-5 w-5" />,
    color: "bg-campfire-secondary-50 text-campfire-secondary border-campfire-secondary-200",
  },
  {
    id: "markdown" as const,
    title: "Markdown",
    description: "Create custom content",
    icon: <Icon icon={Code} className="h-5 w-5" />,
    color: "bg-campfire-accent-50 text-campfire-accent border-campfire-accent-200",
  },
];

export default function KnowledgeUploadDialog({ open, onOpenChange }: KnowledgeUploadDialogProps) {
  const [uploadMethod, setUploadMethod] = useState<UploadMethod>("file");
  const [category, setCategory] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState<string>("");
  const [url, setUrl] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const { categories, uploadProgress, uploadFile, uploadFromUrl, uploadMarkdown, bulkUpload, loading } =
    useKnowledgeUpload();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/msword": [".doc"],
      "text/plain": [".txt"],
      "text/markdown": [".md"],
      "text/html": [".html"],
    },
    multiple: true,
  });

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags((prev) => [...prev, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags((prev) => prev.filter((tag: unknown) => tag !== tagToRemove));
  };

  const handleRemoveFile = (fileToRemove: File) => {
    setSelectedFiles((prev) => prev.filter((file: unknown) => file !== fileToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalCategory = newCategory.trim() || category;
    if (!finalCategory) return;

    try {
      switch (uploadMethod) {
        case "file":
          if (selectedFiles.length === 0) return;
          if (selectedFiles.length === 1) {
            const file = selectedFiles[0];
            if (file) {
              await uploadFile(file);
            }
          } else {
            await bulkUpload(selectedFiles);
          }
          break;
        case "url":
          if (!url.trim()) return;
          await uploadFromUrl(url);
          break;
        case "markdown":
          if (!title.trim() || !content.trim()) return;
          await uploadMarkdown(content, title);
          break;
      }
      resetForm();
      onOpenChange(false);
    } catch (error) {}
  };

  const resetForm = () => {
    setCategory("");
    setNewCategory("");
    setTags([]);
    setTagInput("");
    setUrl("");
    setTitle("");
    setContent("");
    setSelectedFiles([]);
  };

  const getFile = (file: File) => {
    if (file.type.includes("pdf")) return "📄";
    if (file.type.includes("word")) return "📝";
    if (file.type.includes("text")) return "📋";
    if (file.type.includes("html")) return "🌐";
    return "📄";
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-ds-2">
            <Icon icon={FileText} className="h-5 w-5 text-campfire-primary" />
            Add Knowledge Content
          </DialogTitle>
          <DialogDescription>
            Upload files, web content, or create markdown articles to build your knowledge base.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload Method Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Upload Method</Label>
            <div className="grid grid-cols-3 gap-3">
              {uploadMethods.map((method: unknown) => (
                <div
                  key={method.id}
                  className={`cursor-pointer rounded-ds-lg border-2 spacing-4 transition-all hover:scale-[1.02] active:scale-[0.98] ${
                    uploadMethod === method.id
                      ? "border-campfire-primary bg-campfire-primary-50"
                      : "border-campfire-neutral-200 hover:border-campfire-neutral-300"
                  }`}
                  onClick={() => setUploadMethod(method.id)}
                >
                  <div className="text-center">
                    <div className={`mb-2 inline-flex rounded-ds-lg spacing-3 ${method.color}`}>{method.icon}</div>
                    <h4 className="mb-1 font-medium text-campfire-neutral-900">{method.title}</h4>
                    <p className="text-tiny text-campfire-neutral-600">{method.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Upload Content */}
          <div>
            {uploadMethod === "file" && (
              <div key="file" className="space-y-3">
                {/* File Drop Zone */}
                <div
                  {...getRootProps()}
                  className={`cursor-pointer rounded-ds-lg border-2 border-dashed spacing-8 text-center transition-colors ${
                    isDragActive
                      ? "border-campfire-primary bg-campfire-primary-50"
                      : "border-campfire-neutral-300 hover:border-campfire-primary"
                  }`}
                >
                  <input {...getInputProps()} />
                  <Icon icon={Upload} className="mx-auto mb-4 h-12 w-12 text-campfire-neutral-400" />
                  <p className="mb-2 text-base font-medium text-campfire-neutral-700">
                    {isDragActive ? "Drop files here" : "Drag & drop files or click to browse"}
                  </p>
                  <p className="text-sm text-campfire-neutral-500">
                    Supports PDF, Word, Text, Markdown, and HTML files
                  </p>
                </div>

                {/* Selected Files */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-spacing-sm">
                    <Label>Selected Files ({selectedFiles.length})</Label>
                    <div className="max-h-32 space-y-1 overflow-y-auto">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between rounded-ds-lg bg-campfire-neutral-50 p-spacing-sm"
                        >
                          <div className="flex items-center gap-ds-2">
                            <span className="text-base">{getFile(file)}</span>
                            <div>
                              <div className="text-sm font-medium">{file.name}</div>
                              <div className="text-tiny text-campfire-neutral-500">{formatFileSize(file.size)}</div>
                            </div>
                          </div>
                          <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveFile(file)}>
                            <Icon icon={X} className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {uploadMethod === "url" && (
              <div key="url" className="space-y-3">
                <Label>Website URL</Label>
                <Input
                  type="url"
                  placeholder="https://example.com/docs"
                  value={url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                  className="focus-campfire"
                  required
                />
                <p className="text-tiny text-campfire-neutral-500">
                  We'll crawl the page and extract the main content automatically
                </p>
              </div>
            )}

            {uploadMethod === "markdown" && (
              <div key="markdown" className="space-y-3">
                <div className="space-y-3">
                  <Label>Document Title</Label>
                  <Input
                    placeholder="Enter document title..."
                    value={title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                    className="focus-campfire"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <Label>Content (Markdown)</Label>
                  <Textarea
                    placeholder="# Your content here...&#10;&#10;Write your knowledge base article in Markdown format."
                    value={content}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                    className="focus-campfire min-h-[200px] font-mono text-sm"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {/* Category Selection */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-3">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat: unknown) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label>Or Create New</Label>
              <Input
                placeholder="New category name..."
                value={newCategory}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewCategory(e.target.value)}
                className="focus-campfire"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-3">
            <Label>Tags</Label>
            <div className="flex gap-ds-2">
              <Input
                placeholder="Add tag..."
                value={tagInput}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                className="focus-campfire flex-1"
              />
              <Button type="button" onClick={handleAddTag} size="sm">
                <Icon icon={Plus} className="h-4 w-4" />
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-ds-2">
                {tags.map((tag: unknown) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="border-campfire-primary-200 bg-campfire-primary-50 text-campfire-primary"
                  >
                    {tag}
                    <button type="button" onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-red-600">
                      <Icon icon={X} className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Upload Progress */}
          {uploadProgress > 0 && (
            <div className="space-y-3">
              <Label>Upload Progress</Label>
              <div className="space-y-spacing-sm">
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Uploading...</span>
                    <div className="flex items-center gap-ds-2">
                      {uploadProgress === 100 && (
                        <Icon icon={CheckCircle} className="text-semantic-success-dark h-4 w-4" />
                      )}
                      {uploadProgress < 100 && (
                        <Icon icon={Clock} className="h-4 w-4 animate-spin text-campfire-primary" />
                      )}
                      <span className="text-tiny text-campfire-neutral-600">{uploadProgress}%</span>
                    </div>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="btn-campfire-primary"
              disabled={
                loading ||
                (!category && !newCategory) ||
                (uploadMethod === "file" && selectedFiles.length === 0) ||
                (uploadMethod === "url" && !url.trim()) ||
                (uploadMethod === "markdown" && (!title.trim() || !content.trim()))
              }
            >
              {loading ? (
                <>
                  <Icon icon={Clock} className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Icon icon={Upload} className="mr-2 h-4 w-4" />
                  Upload Content
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
