/**
 * S3 Utilities - Optimized with Lazy Loading
 * Enhanced S3 operations with lazy-loaded AWS SDK and Supabase Storage fallback
 * PERFORMANCE: AWS SDK is lazy-loaded to reduce initial bundle size by ~2MB
 */

import { getFile, uploadFile as uploadFileToStorage } from "@/lib/storage/utils";

// S3 Configuration
const s3Config = {
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
};

// Lazy-loaded AWS SDK modules
let S3Client: any;
let PutObjectCommand: any;
let GetObjectCommand: any;
let DeleteObjectCommand: any;
let getSignedUrl: any;

// Cache for AWS SDK modules to avoid repeated imports
let awsSdkLoaded = false;

/**
 * Lazy load AWS SDK modules to reduce initial bundle size
 * Only loads when S3 operations are actually needed
 */
async function loadAwsSdk() {
  if (awsSdkLoaded) return;

  try {

    const startTime = Date.now();

    // Dynamically import AWS SDK modules
    const [clientS3, s3Presigner] = await Promise.all([
      import("@aws-sdk/client-s3"),
      import("@aws-sdk/s3-request-presigner"),
    ]);

    S3Client = clientS3.S3Client;
    PutObjectCommand = clientS3.PutObjectCommand;
    GetObjectCommand = clientS3.GetObjectCommand;
    DeleteObjectCommand = clientS3.DeleteObjectCommand;
    getSignedUrl = s3Presigner.getSignedUrl;

    awsSdkLoaded = true;

    const loadTime = Date.now() - startTime;

  } catch (error) {

    throw new Error("AWS SDK failed to load");
  }
}

/**
 * Get or create S3 client with lazy loading
 */
async function getS3Client() {
  await loadAwsSdk();
  return new S3Client(s3Config);
}

const S3_BUCKET = process.env.S3_BUCKET || process.env.AWS_S3_BUCKET || "";

// File type validation
const ALLOWED_FILE_TYPES = {
  images: ["image/jpeg", "image/png", "image/gif", "image/webp"],
  documents: [
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  archives: ["application/zip", "application/x-rar-compressed"],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileType?: string;
}

export function validateFile(file: { size: number; type: string; name: string }): FileValidationResult {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  // Check file type
  const allAllowedTypes = [
    ...ALLOWED_FILE_TYPES.images,
    ...ALLOWED_FILE_TYPES.documents,
    ...ALLOWED_FILE_TYPES.archives,
  ];
  if (!allAllowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  // Determine file category
  let fileType = "other";
  if (ALLOWED_FILE_TYPES.images.includes(file.type)) fileType = "image";
  else if (ALLOWED_FILE_TYPES.documents.includes(file.type)) fileType = "document";
  else if (ALLOWED_FILE_TYPES.archives.includes(file.type)) fileType = "archive";

  return {
    isValid: true,
    fileType,
  };
}

export async function downloadFile(fileId: string): Promise<Buffer> {
  try {
    const file = await getFile(fileId);
    if (!file) {
      throw new Error("File not found");
    }

    // For Supabase Storage, we can fetch the file directly from the URL
    const response = await fetch(file.url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    throw new Error(`Download failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export function generateS3Key(organizationId: string, filename: string, fileType?: string): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
  const category = fileType || "files";
  return `org/${organizationId}/${category}/${timestamp}-${sanitizedFilename}`;
}

/**
 * Generate a presigned URL for secure file uploads
 */
export async function getPresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<{ uploadUrl: string; key: string }> {
  try {
    if (!S3_BUCKET) {
      throw new Error("S3 bucket not configured");
    }

    // Lazy load AWS SDK
    await loadAwsSdk();
    const s3Client = await getS3Client();

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

    return {
      uploadUrl,
      key,
    };
  } catch (error) {
    throw new Error(`Failed to generate presigned URL: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Generate a presigned URL for secure file downloads
 */
export async function getPresignedDownloadUrl(key: string, expiresIn: number = 3600): Promise<string> {
  try {
    if (!S3_BUCKET) {
      throw new Error("S3 bucket not configured");
    }

    // Lazy load AWS SDK
    await loadAwsSdk();
    const s3Client = await getS3Client();

    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  } catch (error) {
    throw new Error(`Failed to generate download URL: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Enhanced file upload with S3 and fallback to Supabase Storage
 */
export async function uploadFile(
  file: Buffer,
  key: string,
  options?: { contentType?: string; organizationId?: string; metadata?: Record<string, string> }
): Promise<{ url: string; key: string; size: number }> {
  try {
    // Try S3 upload first if configured
    if (S3_BUCKET && s3Config.credentials.accessKeyId) {
      // Lazy load AWS SDK
      await loadAwsSdk();
      const s3Client = await getS3Client();

      const command = new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: file,
        ContentType: options?.contentType || "application/octet-stream",
        Metadata: options?.metadata || {},
      });

      await s3Client.send(command);

      // Generate public URL (or use CloudFront if configured)
      const url = `https://${S3_BUCKET}.s3.${s3Config.region}.amazonaws.com/${key}`;

      return {
        url,
        key,
        size: file.length,
      };
    }

    // Fallback to Supabase Storage
    const result = await uploadFileToStorage(file, {
      filename: key.split("/").pop() || "uploaded-file",
      ...(options?.organizationId !== undefined && { organizationId: options.organizationId }),
      metadata: {
        s3Key: key,
        ...(options?.contentType !== undefined && { contentType: options.contentType }),
        ...options?.metadata,
      },
    });

    if (!result.success) {
      throw new Error(result.error || "Upload failed");
    }

    return {
      url: result.url!,
      key,
      size: file.length,
    };
  } catch (error) {
    throw new Error(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Upload file with progress tracking (for large files)
 */
export async function uploadFileWithProgress(
  file: Buffer,
  key: string,
  options?: {
    contentType?: string;
    organizationId?: string;
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void;
  }
): Promise<{ url: string; key: string; size: number }> {
  const fileSize = file.length;

  // For small files, use regular upload
  if (fileSize < 1024 * 1024) {
    // 1MB
    return uploadFile(file, key, options);
  }

  // For larger files, simulate progress (in a real implementation, you'd use multipart upload)
  const progressCallback = options?.onProgress;

  if (progressCallback) {
    // Simulate progress updates
    const intervals = [0.1, 0.3, 0.5, 0.7, 0.9];
    for (const progress of intervals) {
      setTimeout(() => {
        progressCallback({
          loaded: Math.floor(fileSize * progress),
          total: fileSize,
          percentage: Math.floor(progress * 100),
        });
      }, 100 * progress);
    }
  }

  const result = await uploadFile(file, key, options);

  if (progressCallback) {
    progressCallback({
      loaded: fileSize,
      total: fileSize,
      percentage: 100,
    });
  }

  return result;
}

/**
 * Get public URL for a file (S3 or Supabase Storage)
 */
export async function getS3Url(key: string): Promise<string> {
  try {
    // If S3 is configured, return S3 URL
    if (S3_BUCKET) {
      return `https://${S3_BUCKET}.s3.${s3Config.region}.amazonaws.com/${key}`;
    }

    // Fallback to Supabase Storage
    const { supabase } = await import("@/lib/supabase");
    const supabaseClient = supabase.admin();

    const { data } = supabaseClient.storage.from("conversation-files").getPublicUrl(key);
    return data.publicUrl;
  } catch (error) {
    throw new Error(`Failed to generate URL: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Delete file from S3 or Supabase Storage
 */
export async function deleteS3File(key: string): Promise<void> {
  try {
    // Try S3 deletion first if configured
    if (S3_BUCKET && s3Config.credentials.accessKeyId) {
      const command = new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      });

      await s3Client.send(command);
      return;
    }

    // Fallback to Supabase Storage
    const { supabase } = await import("@/lib/supabase");
    const supabaseClient = supabase.admin();

    const { error } = await supabaseClient.storage.from("conversation-files").remove([key]);

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  } catch (error) {
    throw new Error(`Deletion failed: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

export interface S3UploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  acl?: "private" | "public-read" | "public-read-write";
  organizationId?: string;
}

/**
 * Upload multiple files with progress tracking
 */
export async function uploadMultipleFiles(
  files: Array<{ buffer: Buffer; key: string; options?: S3UploadOptions }>,
  onProgress?: (progress: { completed: number; total: number; percentage: number }) => void
): Promise<Array<{ url: string; key: string; size: number }>> {
  const total = files.length;
  let completed = 0;

  const results = await Promise.all(
    files.map(async ({ buffer, key, options }) => {
      const result = await uploadFile(buffer, key, options);
      completed++;

      if (onProgress) {
        onProgress({
          completed,
          total,
          percentage: Math.floor((completed / total) * 100),
        });
      }

      return result;
    })
  );

  return results;
}

/**
 * Create an API endpoint for file upload with presigned URLs
 */
export async function createUploadEndpoint(
  organizationId: string,
  filename: string,
  contentType: string,
  fileSize: number
): Promise<{
  uploadUrl: string;
  key: string;
  fields?: Record<string, string>;
}> {
  // Validate file
  const validation = validateFile({ size: fileSize, type: contentType, name: filename });
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // Generate key
  const key = generateS3Key(organizationId, filename, validation.fileType);

  // Get presigned URL
  const { uploadUrl } = await getPresignedUploadUrl(key, contentType);

  return {
    uploadUrl,
    key,
    // For S3, additional fields can be added for browser uploads
    fields: {
      "Content-Type": contentType,
      "x-amz-meta-organization": organizationId,
      "x-amz-meta-original-name": filename,
    },
  };
}

/**
 * Utility to check if S3 is properly configured
 */
export function isS3Configured(): boolean {
  return !!(S3_BUCKET && s3Config.credentials.accessKeyId && s3Config.credentials.secretAccessKey);
}

/**
 * Get file info from S3 or Supabase Storage
 */
export async function getFileInfo(key: string): Promise<{
  size: number;
  lastModified: Date;
  contentType: string;
  exists: boolean;
}> {
  try {
    if (isS3Configured()) {
      const command = new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      });

      const response = await s3Client.send(command);

      return {
        size: response.ContentLength || 0,
        lastModified: response.LastModified || new Date(),
        contentType: response.ContentType || "application/octet-stream",
        exists: true,
      };
    }

    // Fallback to Supabase Storage (limited info available)
    const url = await getS3Url(key);
    const response = await fetch(url, { method: "HEAD" });

    if (!response.ok) {
      return {
        size: 0,
        lastModified: new Date(),
        contentType: "application/octet-stream",
        exists: false,
      };
    }

    return {
      size: parseInt(response.headers.get("content-length") || "0"),
      lastModified: new Date(response.headers.get("last-modified") || Date.now()),
      contentType: response.headers.get("content-type") || "application/octet-stream",
      exists: true,
    };
  } catch (error) {
    return {
      size: 0,
      lastModified: new Date(),
      contentType: "application/octet-stream",
      exists: false,
    };
  }
}
