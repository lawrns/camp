/**
 * Widget Upload Types
 * Type definitions for the widget file upload functionality
 */

export interface WidgetUploadFile {
  id: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  url: string;
  uploadedAt: string;
  storagePath: string;
  conversationId: string;
  organizationId: string;
  uploaderType: "visitor" | "agent";
  uploaderId: string;
  status: "uploading" | "uploaded" | "failed" | "deleted";
}

export interface WidgetUploadProgress {
  uploadId: string;
  progress: number;
  status: "connecting" | "uploading" | "processing" | "complete" | "error";
  error?: string;
  timestamp: number;
}

export interface WidgetUploadResponse {
  success: boolean;
  data?: {
    file: WidgetUploadFile;
    message?: {
      id: string;
      content: string;
      createdAt: string;
    };
  };
  error?: string;
  details?: string;
}

export interface WidgetUploadRequest {
  file: File;
  conversationId: string;
  visitorId: string;
  metadata?: Record<string, unknown>;
}

export interface WidgetUploadConfig {
  maxFileSize: number; // in bytes
  allowedTypes: string[];
  maxFiles: number;
  enableProgress: boolean;
  autoUpload: boolean;
  compressionEnabled: boolean;
  malwareScanEnabled: boolean;
}

export interface WidgetUploadListResponse {
  success: boolean;
  data?: {
    attachments: WidgetUploadFile[];
    conversationId: string;
    total: number;
  };
  error?: string;
  details?: string;
}

export interface WidgetUploadError {
  code: string;
  message: string;
  details?: string;
  field?: string;
}

export interface WidgetUploadValidation {
  isValid: boolean;
  errors: WidgetUploadError[];
  warnings: WidgetUploadError[];
}

export interface WidgetUploadProgressEvent {
  type: "connected" | "progress" | "complete" | "error";
  uploadId: string;
  progress?: number;
  timestamp: number;
  error?: string;
}

// Utility types for upload handling
export type WidgetUploadStatus = "idle" | "uploading" | "success" | "error";

export interface WidgetUploadState {
  files: WidgetUploadFile[];
  uploading: boolean;
  progress: number;
  status: WidgetUploadStatus;
  error: string | null;
}

// Constants for upload configuration
export const WIDGET_UPLOAD_CONSTANTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/zip",
    "application/x-zip-compressed",
    "text/csv",
    "application/json",
    "application/xml",
    "text/xml",
  ],
  DANGEROUS_EXTENSIONS: ["exe", "bat", "cmd", "scr", "pif", "vbs", "js", "jar", "com", "msi"],
  MAX_FILES: 5,
  CHUNK_SIZE: 1024 * 1024, // 1MB chunks for large file uploads
} as const;

// Validation helper types
export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface UploadSecurityScan {
  scanned: boolean;
  threats: string[];
  safe: boolean;
  scanTimestamp: number;
}

// Database types for attachments
export interface AttachmentRecord {
  id: string;
  conversation_id: string;
  organization_id: string;
  uploader_id: string;
  uploader_type: "visitor" | "agent";
  original_name: string;
  file_name: string;
  file_path: string;
  file_url: string;
  file_size: number;
  file_type: string;
  mime_type: string;
  status: "uploading" | "uploaded" | "failed" | "deleted";
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

// API Response wrapper
export interface WidgetAPIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
  timestamp: number;
}

// Upload event types for real-time updates
export interface WidgetUploadEvent {
  type: "upload_started" | "upload_progress" | "upload_complete" | "upload_failed" | "upload_deleted";
  fileId: string;
  conversationId: string;
  organizationId: string;
  data: Record<string, unknown>;
  timestamp: number;
}
