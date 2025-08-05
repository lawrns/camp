// AttachmentPreview component for file previews

import * as React from "react";
import { RotateCw, File, Image, AlertTriangle, X } from "lucide-react";
import type { FileAttachment } from "../types";

interface AttachmentPreviewProps {
  attachments: FileAttachment[];
  setAttachments: React.Dispatch<React.SetStateAction<FileAttachment[]>>;
}

/**
 * Preview component for file attachments
 */
export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ attachments, setAttachments }) => {
  // Remove attachment
  const removeAttachment = (attachmentId: string) => {
    setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
  };

  // Retry upload (placeholder - would need original file)
  const retryUpload = (attachmentId: string) => {
    setAttachments((prev) =>
      prev.map((att) => (att.id === attachmentId ? { ...att, uploadStatus: "uploading" } : att))
    );
    // In a real implementation, you'd re-upload the file here

  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (attachments.length === 0) return null;

  return (
    <div className="border-b border-[var(--fl-color-border)] spacing-3">
      <div className="flex flex-wrap gap-3">
        {attachments.map((attachment) => {
          const isImage = attachment.type.startsWith("image/");
          const isUploading = attachment.uploadStatus === "uploading";
          const hasError = attachment.uploadStatus === "error";
          const isSuccess = attachment.uploadStatus === "success";

          return (
            <div
              key={attachment.id}
              className={`relative min-w-[200px] max-w-[250px] rounded-ds-lg border bg-white spacing-3 ${
                hasError ? "border-[var(--fl-color-danger-muted)] bg-[var(--fl-color-danger-subtle)]" : "border-[var(--fl-color-border)]"
              }`}
            >
              {/* Remove button */}
              <button
                onClick={() => removeAttachment(attachment.id)}
                className="absolute -right-2 -top-2 z-10 rounded-ds-full bg-gray-600 spacing-1 text-white transition-colors hover:bg-gray-700"
                aria-label="Remove attachment"
              >
                <X className="h-3 w-3" />
              </button>

              {/* Image preview */}
              {isImage && attachment.preview && (
                <div className="mb-2">
                  <img src={attachment.preview} alt={attachment.name} className="h-24 w-full rounded object-cover" />
                </div>
              )}

              {/* File info */}
              <div className="flex items-start space-x-spacing-sm">
                {/* File icon */}
                <div className="mt-1 flex-shrink-0">
                  {hasError ? (
                    <AlertTriangle className="h-5 w-5 text-[var(--fl-color-danger)]" />
                  ) : isImage ? (
                    <Image
                      className={`h-5 w-5 ${isSuccess ? "text-[var(--fl-color-success)]" : "text-[var(--fl-color-text-muted)]"}`}
                    />
                  ) : (
                    <File
                      className={`h-5 w-5 ${isSuccess ? "text-[var(--fl-color-success)]" : "text-[var(--fl-color-text-muted)]"}`}
                    />
                  )}
                </div>

                {/* File details */}
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-medium ${hasError ? "text-red-700" : "text-gray-900"}`}>
                    {attachment.name}
                  </p>
                  <p className={`text-xs ${hasError ? "text-red-600" : "text-[var(--fl-color-text-muted)]"}`}>
                    {formatFileSize(attachment.size)}
                  </p>

                  {/* Status */}
                  <div className="mt-1">
                    {isUploading && (
                      <div className="flex items-center space-x-spacing-sm">
                        <div className="h-3 w-3 animate-spin rounded-ds-full border-b-2 border-[var(--fl-color-brand)]"></div>
                        <span className="text-tiny text-blue-600">Uploading...</span>
                      </div>
                    )}

                    {hasError && (
                      <div className="flex items-center space-x-spacing-sm">
                        <span className="text-tiny text-red-600">Upload failed</span>
                        <button
                          onClick={() => retryUpload(attachment.id)}
                          className="flex items-center space-x-1 text-tiny text-red-600 underline hover:text-red-700"
                        >
                          <RotateCw className="h-3 w-3" />
                          <span>Retry</span>
                        </button>
                      </div>
                    )}

                    {isSuccess && <span className="text-tiny text-green-600">✓ Uploaded</span>}
                  </div>
                </div>
              </div>

              {/* Upload progress overlay */}
              {isUploading && (
                <div className="bg-background absolute inset-0 flex items-center justify-center rounded-ds-lg bg-opacity-75">
                  <div className="text-center">
                    <div className="mx-auto mb-2 h-6 w-6 animate-spin rounded-ds-full border-b-2 border-[var(--fl-color-brand)]"></div>
                    <span className="text-foreground text-tiny">Uploading...</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-3 text-tiny text-[var(--fl-color-text-muted)]">
        {attachments.length} file{attachments.length !== 1 ? "s" : ""} attached
        {attachments.some((att) => att.uploadStatus === "uploading") && (
          <span className="ml-2 text-blue-600">• Uploading...</span>
        )}
        {attachments.some((att) => att.uploadStatus === "error") && (
          <span className="ml-2 text-red-600">• Some uploads failed</span>
        )}
      </div>
    </div>
  );
};

export default AttachmentPreview;
