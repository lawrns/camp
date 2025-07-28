/**
 * 🔥 Campfire File Service
 *
 * Enterprise-grade file handling with security validation,
 * real-time events, and comprehensive metadata management
 */

import { v4 as uuidv4 } from "uuid";
import { supabase } from "@/lib/supabase";

// File type definitions
export interface FileMetadata {
  id: string;
  filename: string;
  originalName: string;
  name: string; // Display name (alias for filename)
  mimeType: string;
  type: string; // File type (alias for mimeType)
  size: number;
  organizationId: string;
  conversationId?: string;
  uploadedBy: string;
  uploadedAt: string;
  url?: string;
  thumbnailUrl?: string;
  isPublic: boolean;
  tags?: string[];
  description?: string;
}

// Utility function to ensure FileMetadata has computed properties
export function normalizeFileMetadata(
  metadata: Omit<FileMetadata, "name" | "type"> & { filename: string; mimeType: string }
): FileMetadata {
  return {
    ...metadata,
    name: metadata.filename,
    type: metadata.mimeType,
  };
}

export interface FileUploadOptions {
  organizationId: string;
  conversationId?: string;
  uploadedBy: string;
  isPublic?: boolean;
  tags?: string[];
  description?: string;
  generateThumbnail?: boolean;
}

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

// Security configuration
const ALLOWED_FILE_TYPES = [
  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  // Documents
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  // Audio/Video
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "video/mp4",
  "video/webm",
  "video/ogg",
  // Archives
  "application/zip",
  "application/x-rar-compressed",
  "application/x-7z-compressed",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_FILES_PER_UPLOAD = 10;

/**
 * Comprehensive File Service Class
 */
export class FileService {
  private supabase = supabase.browser();

  /**
   * Validate file before upload
   */
  validateFile(file: File): FileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      errors.push(
        `File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${this.formatFileSize(MAX_FILE_SIZE)})`
      );
    }

    // Check file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      errors.push(`File type '${file.type}' is not allowed`);
    }

    // Check filename for security
    if (this.containsUnsafeCharacters(file.name)) {
      errors.push("Filename contains unsafe characters");
    }

    // Warnings for large files
    if (file.size > 10 * 1024 * 1024) {
      // 10MB
      warnings.push("Large file may take longer to upload");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Upload single file with comprehensive error handling
   */
  async uploadFile(file: File, options: FileUploadOptions): Promise<FileMetadata> {
    // Validate file first
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(`File validation failed: ${validation.errors.join(", ")}`);
    }

    try {
      // Generate unique filename
      const fileExtension = this.getFileExtension(file.name);
      const uniqueFilename = `${uuidv4()}${fileExtension}`;
      const filePath = `${options.organizationId}/${options.conversationId || "general"}/${uniqueFilename}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await this.supabase.storage
        .from("files")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage.from("files").getPublicUrl(filePath);

      // Create file metadata
      const metadata: FileMetadata = {
        id: uuidv4(),
        filename: uniqueFilename,
        originalName: file.name,
        name: uniqueFilename, // Display name
        mimeType: file.type,
        type: file.type, // File type
        size: file.size,
        organizationId: options.organizationId,
        uploadedBy: options.uploadedBy,
        uploadedAt: new Date().toISOString(),
        url: urlData.publicUrl,
        isPublic: options.isPublic || false,
        tags: options.tags || [],
      };

      if (options.conversationId !== undefined) {
        metadata.conversationId = options.conversationId;
      }

      if (options.description !== undefined) {
        metadata.description = options.description;
      }

      // Generate thumbnail for images
      if (options.generateThumbnail && this.isImage(file.type)) {
        const thumbnailUrl = await this.generateThumbnail(file, filePath);
        if (thumbnailUrl) {
          metadata.thumbnailUrl = thumbnailUrl;
        }
      }

      // Save metadata to database
      await this.saveFileMetadata(metadata);

      // Broadcast file upload event
      await this.broadcastFileEvent("file_uploaded", metadata);

      return metadata;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload multiple files with progress tracking
   */
  async uploadMultipleFiles(
    files: File[],
    options: FileUploadOptions,
    onProgress?: (progress: { completed: number; total: number; currentFile: string }) => void
  ): Promise<FileMetadata[]> {
    if (files.length > MAX_FILES_PER_UPLOAD) {
      throw new Error(`Cannot upload more than ${MAX_FILES_PER_UPLOAD} files at once`);
    }

    const results: FileMetadata[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) continue;

      try {
        onProgress?.({ completed: i, total: files.length, currentFile: file.name });

        const metadata = await this.uploadFile(file, options);
        results.push(metadata);
      } catch (error) {
        errors.push(`${file.name}: ${error.message}`);
      }
    }

    onProgress?.({ completed: files.length, total: files.length, currentFile: "" });

    if (errors.length > 0 && results.length === 0) {
      throw new Error(`All uploads failed: ${errors.join("; ")}`);
    }

    return results;
  }

  /**
   * Get file metadata by ID
   */
  async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    try {
      const { data, error } = await this.supabase.from("file_metadata").select("*").eq("id", fileId).single();

      if (error) {
        return null;
      }

      return data as FileMetadata;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get files for a conversation
   */
  async getConversationFiles(conversationId: string): Promise<FileMetadata[]> {
    try {
      const { data, error } = await this.supabase
        .from("file_metadata")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("uploaded_at", { ascending: false });

      if (error) {
        return [];
      }

      return data as FileMetadata[];
    } catch (error) {
      return [];
    }
  }

  /**
   * Delete file and its metadata
   */
  async deleteFile(fileId: string, organizationId: string): Promise<boolean> {
    try {
      // Get file metadata first
      const metadata = await this.getFileMetadata(fileId);
      if (!metadata) {
        throw new Error("File not found");
      }

      // Verify organization access
      if (metadata.organizationId !== organizationId) {
        throw new Error("Unauthorized: File belongs to different organization");
      }

      // Delete from storage
      const filePath = this.getFilePathFromUrl(metadata.url);
      if (filePath) {
        const { error: storageError } = await this.supabase.storage.from("files").remove([filePath]);

        if (storageError) {
        }
      }

      // Delete thumbnail if exists
      if (metadata.thumbnailUrl) {
        const thumbnailPath = this.getFilePathFromUrl(metadata.thumbnailUrl);
        if (thumbnailPath) {
          await this.supabase.storage.from("files").remove([thumbnailPath]);
        }
      }

      // Delete metadata from database
      const { error: dbError } = await this.supabase.from("file_metadata").delete().eq("id", fileId);

      if (dbError) {
        throw new Error(`Database deletion failed: ${dbError.message}`);
      }

      // Broadcast file deletion event
      await this.broadcastFileEvent("file_deleted", metadata);

      return true;
    } catch (error) {
      return false;
    }
  }

  // Helper methods

  private containsUnsafeCharacters(filename: string): boolean {
    const unsafeChars = /[<>:"/\\|?*\x00-\x1f]/;
    return unsafeChars.test(filename);
  }

  private getFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf(".");
    return lastDot !== -1 ? filename.substring(lastDot) : "";
  }

  private formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  private isImage(mimeType: string): boolean {
    return mimeType.startsWith("image/");
  }

  private getFilePathFromUrl(url?: string): string | null {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      const pathSegments = urlObj.pathname.split("/");
      return pathSegments.slice(-3).join("/"); // organization/conversation/filename
    } catch {
      return null;
    }
  }

  private async generateThumbnail(file: File, filePath: string): Promise<string | undefined> {
    try {
      // Create canvas for thumbnail generation
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      return new Promise((resolve) => {
        img.onload = async () => {
          // Set thumbnail dimensions
          const maxSize = 200;
          let { width, height } = img;

          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to blob
          canvas.toBlob(
            async (blob) => {
              if (blob) {
                const thumbnailPath = filePath.replace(/(\.[^.]+)$/, "_thumb$1");

                const { data, error } = await this.supabase.storage.from("files").upload(thumbnailPath, blob);

                if (!error) {
                  const { data: urlData } = this.supabase.storage.from("files").getPublicUrl(thumbnailPath);

                  resolve(urlData.publicUrl);
                } else {
                  resolve(undefined);
                }
              } else {
                resolve(undefined);
              }
            },
            "image/jpeg",
            0.8
          );
        };

        img.onerror = () => resolve(undefined);
        img.src = URL.createObjectURL(file);
      });
    } catch (error) {
      return undefined;
    }
  }

  private async saveFileMetadata(metadata: FileMetadata): Promise<void> {
    const { error } = await this.supabase.from("file_metadata").insert(metadata);

    if (error) {
      throw new Error(`Failed to save file metadata: ${error.message}`);
    }
  }

  private async broadcastFileEvent(event: string, metadata: FileMetadata): Promise<void> {
    try {
      const channel = this.supabase.channel(`org:${metadata.organizationId}`);

      await channel.send({
        type: "broadcast",
        event,
        payload: {
          file: metadata,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {}
  }
}

// Singleton instance
export const fileService = new FileService();

// Export types
export type { FileMetadata, FileUploadOptions, FileValidationResult };
