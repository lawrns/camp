"use client";

import React, { useRef, useState } from "react";
import { File, Paperclip, X } from "@phosphor-icons/react";
import { Icon } from "@/lib/ui/Icon";
import { cn } from "@/lib/utils";
import type { AttachmentFile, ComposerPluginProps } from "../types";

export function AttachmentPlugin({ pluginId, content, onContentChange, onAction, disabled }: ComposerPluginProps) {
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    const newAttachments: AttachmentFile[] = files.map((file: unknown) => ({
      id: crypto.randomUUID(),
      file,
      progress: 0,
      status: "pending",
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);
    onAction(pluginId, "files-added", newAttachments);

    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((att: unknown) => att.id !== id));
    onAction(pluginId, "file-removed", { id });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
  };

  return (
    <>
      {/* Attachment Button */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-ds-md",
          "transition-colors duration-200 hover:bg-[--bg-subtle]",
          "text-[--text-muted] hover:text-[--text-primary]",
          disabled && "cursor-not-allowed opacity-50"
        )}
        title="Attach files"
      >
        <Icon icon={Paperclip} className="h-4 w-4" />
      </button>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,.pdf,.doc,.docx,.txt,.csv,.xlsx"
      />

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="border-t border-[--border-subtle] px-3 py-2">
          <div className="flex flex-wrap gap-ds-2">
            {attachments.map((attachment: unknown) => (
              <div
                key={attachment.id}
                className={cn(
                  "flex items-center gap-2 rounded-ds-lg bg-[--bg-subtle] px-3 py-2",
                  "border border-[--border-subtle]"
                )}
              >
                <Icon icon={File} className="h-4 w-4 text-[--text-muted]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[--text-primary]">{attachment.file.name}</p>
                  <p className="text-tiny text-[--text-muted]">{formatFileSize(attachment.file.size)}</p>
                </div>
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded",
                    "hover:bg-[--status-late]/10 text-[--text-muted] hover:text-[--status-late]",
                    "transition-colors duration-200"
                  )}
                  title="Remove attachment"
                >
                  <Icon icon={X} className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
