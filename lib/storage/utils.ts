/**
 * Storage Utilities
 * Provides file storage, upload, and management utilities
 */

export interface StorageConfig {
  provider: "local" | "s3" | "gcs" | "azure";
  bucket?: string;
  region?: string;
  endpoint?: string;
  credentials?: {
    accessKeyId?: string;
    secretAccessKey?: string;
    projectId?: string;
    keyFilename?: string;
  };
  maxFileSize: number; // bytes
  allowedMimeTypes: string[];
  uploadPath: string;
}

export interface FileMetadata {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  url: string;
  uploadedAt: Date;
  uploadedBy?: string;
  organizationId?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export interface UploadResult {
  success: boolean;
  file?: FileMetadata;
  error?: string;
  url?: string;
}

export interface StorageQuota {
  used: number; // bytes
  limit: number; // bytes
  percentage: number;
  files: number;
  maxFiles?: number;
}

export class StorageManager {
  private config: StorageConfig;
  private files: Map<string, FileMetadata> = new Map();

  constructor(
    config: StorageConfig = {
      provider: "local",
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedMimeTypes: [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "text/plain",
        "text/csv",
        "application/json",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ],
      uploadPath: "/uploads",
    }
  ) {
    this.config = config;
  }

  async uploadFile(
    file: File | Buffer,
    options?: {
      filename?: string;
      organizationId?: string;
      userId?: string;
      tags?: string[];
      metadata?: Record<string, unknown>;
      overwrite?: boolean;
    }
  ): Promise<UploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error!,
        };
      }

      // Generate file metadata
      const fileId = this.generateFileId();
      const filename = options?.filename || (file instanceof File ? file.name : `file-${fileId}`);
      const sanitizedFilename = this.sanitizeFilename(filename);
      const path = `${this.config.uploadPath}/${options?.organizationId || "default"}/${sanitizedFilename}`;

      const metadata: FileMetadata = {
        id: fileId,
        filename: sanitizedFilename,
        originalName: filename,
        mimeType: file instanceof File ? file.type : "application/octet-stream",
        size: file instanceof File ? file.size : file.length,
        path,
        url: this.generateFileUrl(path),
        uploadedAt: new Date(),
        ...(options?.userId && { uploadedBy: options.userId }),
        ...(options?.organizationId && { organizationId: options.organizationId }),
        tags: options?.tags || [],
        metadata: options?.metadata || {},
      };

      // Check if file exists and handle overwrite
      if (!options?.overwrite && this.fileExists(path)) {
        return {
          success: false,
          error: "File already exists. Use overwrite option to replace.",
        };
      }

      // Simulate upload process
      await this.performUpload(file, path);

      // Store metadata
      this.files.set(fileId, metadata);

      return {
        success: true,
        file: metadata,
        url: metadata.url,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  private validateFile(file: File | Buffer): { valid: boolean; error?: string } {
    const size = file instanceof File ? file.size : file.length;
    const mimeType = file instanceof File ? file.type : "application/octet-stream";

    if (size > this.config.maxFileSize) {
      return {
        valid: false,
        error: `File size exceeds limit of ${this.formatFileSize(this.config.maxFileSize)}`,
      };
    }

    if (this.config.allowedMimeTypes.length > 0 && !this.config.allowedMimeTypes.includes(mimeType)) {
      return {
        valid: false,
        error: `File type ${mimeType} is not allowed`,
      };
    }

    return { valid: true };
  }

  private sanitizeFilename(filename: string): string {
    // Remove or replace invalid characters
    return filename
      .replace(/[^a-zA-Z0-9.-]/g, "_")
      .replace(/_{2,}/g, "_")
      .replace(/^_|_$/g, "")
      .toLowerCase();
  }

  private generateFileId(): string {
    return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateFileUrl(path: string): string {
    // Generate URL based on provider
    switch (this.config.provider) {
      case "s3":
        return `https://${this.config.bucket}.s3.${this.config.region}.amazonaws.com${path}`;
      case "gcs":
        return `https://storage.googleapis.com/${this.config.bucket}${path}`;
      case "azure":
        return `https://${this.config.bucket}.blob.core.windows.net${path}`;
      case "local":
      default:
        return `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3012"}/api/files${path}`;
    }
  }

  private fileExists(path: string): boolean {
    // Check if file exists
    return Array.from(this.files.values()).some((file) => file.path === path);
  }

  private async performUpload(file: File | Buffer, path: string): Promise<void> {
    // For Supabase Storage implementation
    if (this.config.provider === "s3" || !this.config.provider || this.config.provider === "local") {
      try {
        // Use consolidated supabase client
        const supabaseClient = supabase.admin();

        // Convert File to ArrayBuffer if needed
        const buffer = file instanceof File ? await file.arrayBuffer() : file;

        const { error } = await supabase.storage.from("conversation-files").upload(path, buffer, {
          contentType: file instanceof File ? file.type : "application/octet-stream",
          upsert: true,
        });

        if (error) {
          throw new Error(`Upload failed: ${error.message}`);
        }
      } catch (error) {
        throw new Error(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    } else {
      // For other providers, implement as needed
      throw new Error(`Provider ${this.config.provider} not implemented`);
    }
  }

  async deleteFile(fileId: string): Promise<boolean> {
    const file = this.files.get(fileId);
    if (!file) return false;

    try {
      // Simulate deletion
      await this.performDeletion(file.path);
      this.files.delete(fileId);
      return true;
    } catch (error) {
      return false;
    }
  }

  private async performDeletion(path: string): Promise<void> {
    // For Supabase Storage implementation
    if (this.config.provider === "s3" || !this.config.provider || this.config.provider === "local") {
      try {
        // Use consolidated supabase client
        const supabaseClient = supabase.admin();

        const { error } = await supabase.storage.from("conversation-files").remove([path]);

        if (error) {
          throw new Error(`Deletion failed: ${error.message}`);
        }
      } catch (error) {
        throw new Error(`Deletion failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    } else {
      throw new Error(`Provider ${this.config.provider} not implemented`);
    }
  }

  async getFile(fileId: string): Promise<FileMetadata | null> {
    return this.files.get(fileId) || null;
  }

  async getFilesByOrganization(organizationId: string): Promise<FileMetadata[]> {
    return Array.from(this.files.values()).filter((file: unknown) => file.organizationId === organizationId);
  }

  async getFilesByUser(userId: string): Promise<FileMetadata[]> {
    return Array.from(this.files.values()).filter((file: unknown) => file.uploadedBy === userId);
  }

  async searchFiles(query: {
    organizationId?: string;
    userId?: string;
    mimeType?: string;
    tags?: string[];
    filename?: string;
    uploadedAfter?: Date;
    uploadedBefore?: Date;
  }): Promise<FileMetadata[]> {
    let results = Array.from(this.files.values());

    if (query.organizationId) {
      results = results.filter((file: unknown) => file.organizationId === query.organizationId);
    }

    if (query.userId) {
      results = results.filter((file: unknown) => file.uploadedBy === query.userId);
    }

    if (query.mimeType) {
      results = results.filter((file: unknown) => file.mimeType === query.mimeType);
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter((file: unknown) => query.tags!.some((tag) => file.tags?.includes(tag)));
    }

    if (query.filename) {
      const searchTerm = query.filename.toLowerCase();
      results = results.filter(
        (file) =>
          file.filename.toLowerCase().includes(searchTerm) || file.originalName.toLowerCase().includes(searchTerm)
      );
    }

    if (query.uploadedAfter) {
      results = results.filter((file: unknown) => file.uploadedAt >= query.uploadedAfter!);
    }

    if (query.uploadedBefore) {
      results = results.filter((file: unknown) => file.uploadedAt <= query.uploadedBefore!);
    }

    return results.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
  }

  async getStorageQuota(organizationId?: string): Promise<StorageQuota> {
    let relevantFiles = Array.from(this.files.values());

    if (organizationId) {
      relevantFiles = relevantFiles.filter((file: unknown) => file.organizationId === organizationId);
    }

    const used = relevantFiles.reduce((sum: unknown, file: unknown) => sum + file.size, 0);
    const files = relevantFiles.length;
    const limit = 1024 * 1024 * 1024; // 1GB default limit
    const percentage = (used / limit) * 100;

    return {
      used,
      limit,
      percentage,
      files,
      maxFiles: 10000, // Default max files
    };
  }

  formatFileSize(bytes: number): string {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(unitIndex > 0 ? 2 : 0)} ${units[unitIndex]}`;
  }

  async generateSignedUrl(fileId: string, expiresIn: number = 3600): Promise<string | null> {
    const file = this.files.get(fileId);
    if (!file) return null;

    // In a real implementation, this would generate a signed URL for secure access
    const expiry = Date.now() + expiresIn * 1000;
    const signature = Buffer.from(`${fileId}:${expiry}`).toString("base64");

    return `${file.url}?signature=${signature}&expires=${expiry}`;
  }

  async updateFileMetadata(
    fileId: string,
    updates: Partial<Pick<FileMetadata, "tags" | "metadata">>
  ): Promise<boolean> {
    const file = this.files.get(fileId);
    if (!file) return false;

    const updatedFile = {
      ...file,
      ...updates,
    };

    this.files.set(fileId, updatedFile);
    return true;
  }

  async moveFile(fileId: string, newPath: string): Promise<boolean> {
    const file = this.files.get(fileId);
    if (!file) return false;

    try {
      // Simulate move operation
      await this.performMove(file.path, newPath);

      const updatedFile = {
        ...file,
        path: newPath,
        url: this.generateFileUrl(newPath),
      };

      this.files.set(fileId, updatedFile);
      return true;
    } catch (error) {
      return false;
    }
  }

  private async performMove(oldPath: string, newPath: string): Promise<void> {
    // Simulate move process
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  async copyFile(fileId: string, newPath: string): Promise<UploadResult> {
    const file = this.files.get(fileId);
    if (!file) {
      return {
        success: false,
        error: "File not found",
      };
    }

    try {
      // Simulate copy operation
      await this.performCopy(file.path, newPath);

      const newFileId = this.generateFileId();
      const copiedFile: FileMetadata = {
        ...file,
        id: newFileId,
        path: newPath,
        url: this.generateFileUrl(newPath),
        uploadedAt: new Date(),
      };

      this.files.set(newFileId, copiedFile);

      return {
        success: true,
        file: copiedFile,
        url: copiedFile.url,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Copy failed",
      };
    }
  }

  private async performCopy(sourcePath: string, targetPath: string): Promise<void> {
    // Simulate copy process
    await new Promise((resolve) => setTimeout(resolve, 75));
  }

  getConfig(): StorageConfig {
    return { ...this.config };
  }

  updateConfig(updates: Partial<StorageConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// Default instance
export const storageManager = new StorageManager();

// Utility functions
export async function uploadFile(
  file: File | Buffer,
  options?: Parameters<StorageManager["uploadFile"]>[1]
): Promise<UploadResult> {
  return storageManager.uploadFile(file, options);
}

export async function deleteFile(fileId: string): Promise<boolean> {
  return storageManager.deleteFile(fileId);
}

export async function getFile(fileId: string): Promise<FileMetadata | null> {
  return storageManager.getFile(fileId);
}

export async function getStorageQuota(organizationId?: string): Promise<StorageQuota> {
  return storageManager.getStorageQuota(organizationId);
}

export function formatFileSize(bytes: number): string {
  return storageManager.formatFileSize(bytes);
}

export async function generateSignedUrl(fileId: string, expiresIn?: number): Promise<string | null> {
  return storageManager.generateSignedUrl(fileId, expiresIn);
}
