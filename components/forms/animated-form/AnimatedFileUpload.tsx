"use client";

import { Button } from "@/components/ui/Button-unified";
import { OptimizedAnimatePresence, OptimizedMotion } from "@/lib/animations/OptimizedMotion";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import { AlertTriangle as AlertCircle, File, FileText, Image, Info, Upload, X } from "lucide-react";
import { useAnimation } from "framer-motion";
import React, { useEffect, useRef, useState } from "react";
import { FileUploadFieldProps } from "./types";

export function AnimatedFileUpload({
  id,
  label,
  onChange,
  accept,
  multiple,
  error,
  success,
  disabled,
  helper,
  className,
  variant = "default",
}: FileUploadFieldProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const controls = useAnimation();

  useEffect(() => {
    if (error) {
      controls.start({
        x: [0, -5, 5, -5, 0],
        transition: { duration: 0.5 },
      });
    }
  }, [error, controls]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (!disabled && e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(newFiles);
      onChange(e.dataTransfer.files);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles(newFiles);
      onChange(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    const dt = new DataTransfer();
    newFiles.forEach((file: unknown) => dt.items.add(file));
    onChange(dt.files);
  };

  const getFile = (file: File) => {
    if (file.type.startsWith("image/")) return <Icon icon={Image} className="h-4 w-4" />;
    if (file.type.includes("pdf")) return <Icon icon={FileText} className="h-4 w-4" />;
    return <Icon icon={File} className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "glass":
        return cn(
          "rounded-ds-lg border-2 border-dashed border-white/30 spacing-8",
          "bg-white/10 backdrop-blur-md transition-all duration-200",
          "hover:border-white/50 hover:bg-white/20",
          isDragOver && "border-brand-blue-500/50 bg-brand-blue-500/10",
          error && "border-brand-mahogany-500/50 bg-brand-mahogany-500/10",
          success && "bg-semantic-success/10 border-[var(--fl-color-success)]/50",
          disabled && "cursor-not-allowed opacity-50"
        );
      case "dropzone":
        return cn(
          "rounded-ds-lg border-2 border-dashed border-[var(--fl-color-border-strong)] spacing-8",
          "bg-neutral-50 transition-all duration-200 hover:bg-neutral-100",
          "cursor-pointer hover:border-neutral-400",
          isDragOver && "bg-status-info-light border-brand-blue-500",
          error && "border-brand-mahogany-500 bg-status-error-light",
          success && "bg-status-success-light border-[var(--fl-color-success)]",
          disabled && "cursor-not-allowed opacity-50"
        );
      default:
        return "space-y-2";
    }
  };

  if (variant === "dropzone" || variant === "glass") {
    return (
      <OptimizedMotion.div animate={controls} className={cn("space-y-2", className)}>
        {/* Label */}
        <label className="text-foreground block text-sm font-medium">{label}</label>

        {/* Dropzone */}
        <OptimizedMotion.div
          className={getVariantStyles()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
          whileHover={!disabled ? { scale: 1.01 } : {}}
          whileTap={!disabled ? { scale: 0.99 } : {}}
        >
          <input
            ref={fileInputRef}
            id={id}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />

          <div className="text-center">
            <OptimizedMotion.div
              animate={{
                y: isDragOver ? -5 : 0,
                scale: isDragOver ? 1.1 : 1,
              }}
              transition={{ duration: 0.2 }}
              className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-ds-full bg-[var(--fl-color-info-subtle)]"
            >
              <Icon icon={Upload} className="h-8 w-8 text-blue-600" />
            </OptimizedMotion.div>

            <p className="text-foreground mb-1 font-medium">
              {isDragOver ? "Drop files here" : "Drag and drop files here"}
            </p>
            <p className="text-sm text-[var(--fl-color-text-muted)]">
              or <span className="text-blue-600 hover:underline">browse from your computer</span>
            </p>
            {accept && <p className="mt-2 text-tiny text-gray-400">Accepted file types: {accept}</p>}
          </div>
        </OptimizedMotion.div>

        {/* File List */}
        {files.length > 0 && (
          <div className="space-y-spacing-sm">
            <OptimizedAnimatePresence>
              {files.map((file, index) => (
                <OptimizedMotion.div
                  key={`${file.name}-${index}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 rounded-ds-lg bg-[var(--fl-color-background-subtle)] spacing-3"
                >
                  {getFile(file)}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900">{file.name}</p>
                    <p className="text-tiny text-[var(--fl-color-text-muted)]">{formatFileSize(file.size)}</p>
                  </div>
                  <OptimizedMotion.button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="text-gray-400 transition-colors hover:text-red-600"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Icon icon={X} className="h-4 w-4" />
                  </OptimizedMotion.button>
                </OptimizedMotion.div>
              ))}
            </OptimizedAnimatePresence>
          </div>
        )}

        {/* Helper Text & Error Messages */}
        <OptimizedAnimatePresence>
          {(helper || error) && (
            <OptimizedMotion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-ds-2 text-sm"
            >
              {error ? (
                <>
                  <Icon icon={AlertCircle} className="text-brand-mahogany-500 mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span className="text-red-600">{error}</span>
                </>
              ) : helper ? (
                <>
                  <Icon icon={Info} className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                  <span className="text-foreground">{helper}</span>
                </>
              ) : null}
            </OptimizedMotion.div>
          )}
        </OptimizedAnimatePresence>
      </OptimizedMotion.div>
    );
  }

  // Default variant (button style)
  return (
    <OptimizedMotion.div animate={controls} className={cn("space-y-2", className)}>
      <label htmlFor={id} className="text-foreground block text-sm font-medium">
        {label}
      </label>

      <div className="flex items-center gap-3">
        <input
          ref={fileInputRef}
          id={id}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled}
        />

        <Button
          type="button"
          variant="outline"
          onClick={() => !disabled && fileInputRef.current?.click()}
          disabled={disabled}
          className="flex items-center gap-ds-2"
        >
          <Icon icon={Upload} className="h-4 w-4" />
          Choose File{multiple && "s"}
        </Button>

        {files.length > 0 && (
          <span className="text-foreground text-sm">
            {files.length} file{files.length > 1 ? "s" : ""} selected
          </span>
        )}
      </div>

      {/* Helper Text & Error Messages */}
      <OptimizedAnimatePresence>
        {(helper || error) && (
          <OptimizedMotion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-ds-2 text-sm"
          >
            {error ? (
              <>
                <Icon icon={AlertCircle} className="text-brand-mahogany-500 mt-0.5 h-4 w-4 flex-shrink-0" />
                <span className="text-red-600">{error}</span>
              </>
            ) : helper ? (
              <>
                <Icon icon={Info} className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />
                <span className="text-foreground">{helper}</span>
              </>
            ) : null}
          </OptimizedMotion.div>
        )}
      </OptimizedAnimatePresence>
    </OptimizedMotion.div>
  );
}
