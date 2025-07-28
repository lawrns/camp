/**
 * Lightweight file upload client
 * Replaces client-side AWS SDK with API routes
 * Dramatically reduces bundle size
 */

export interface FileUploadOptions {
  filename: string;
  contentType: string;
  organizationId?: string;
  metadata?: Record<string, any>;
  onProgress?: (progress: number) => void;
}

export interface FileUploadResult {
  success: boolean;
  url?: string;
  key?: string;
  size?: number;
  error?: string;
}

export interface FileDownloadOptions {
  key: string;
  organizationId?: string;
}

/**
 * Upload a file using the server-side API
 */
export async function uploadFile(file: File | Buffer, options: FileUploadOptions): Promise<FileUploadResult> {
  try {
    // Step 1: Get upload configuration from server
    const configResponse = await fetch("/api/files/upload", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filename: options.filename,
        contentType: options.contentType,
        organizationId: options.organizationId,
      }),
    });

    if (!configResponse.ok) {
      const error = await configResponse.json();
      return { success: false, error: error.error || "Failed to prepare upload" };
    }

    const config = await configResponse.json();

    // Step 2: Upload based on the method returned
    if (config.method === "s3") {
      return uploadToS3(file, config, options.onProgress);
    } else if (config.method === "supabase") {
      return uploadToSupabase(file, config, options);
    } else {
      return { success: false, error: "Unknown upload method" };
    }
  } catch (error) {

    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Upload to S3 using presigned URL
 */
async function uploadToS3(
  file: File | Buffer,
  config: any,
  onProgress?: (progress: number) => void
): Promise<FileUploadResult> {
  try {
    const formData = new FormData();

    // Add required fields for S3
    Object.entries(config.fields || {}).forEach(([key, value]) => {
      formData.append(key, value as string);
    });

    // Add the file last
    if (file instanceof File) {
      formData.append("file", file);
    } else {
      formData.append("file", new Blob([file]));
    }

    // Upload with progress tracking
    const xhr = new XMLHttpRequest();

    return new Promise((resolve) => {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = (event.loaded / event.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200 || xhr.status === 204) {
          resolve({
            success: true,
            key: config.key,
            url: `https://${config.bucket || "your-bucket"}.s3.amazonaws.com/${config.key}`,
            size: file instanceof File ? file.size : file.length,
          });
        } else {
          resolve({
            success: false,
            error: `S3 upload failed with status ${xhr.status}`,
          });
        }
      });

      xhr.addEventListener("error", () => {
        resolve({
          success: false,
          error: "S3 upload network error",
        });
      });

      xhr.open("POST", config.uploadUrl);
      xhr.send(formData);
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "S3 upload failed",
    };
  }
}

/**
 * Upload to Supabase via API route
 */
async function uploadToSupabase(
  file: File | Buffer,
  config: any,
  options: FileUploadOptions
): Promise<FileUploadResult> {
  try {
    const formData = new FormData();

    if (file instanceof File) {
      formData.append("file", file);
    } else {
      formData.append("file", new Blob([file]), options.filename);
    }

    if (options.organizationId) {
      formData.append("organizationId", options.organizationId);
    }

    if (options.metadata) {
      formData.append("metadata", JSON.stringify(options.metadata));
    }

    const response = await fetch(config.uploadUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || "Supabase upload failed" };
    }

    return await response.json();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Supabase upload failed",
    };
  }
}

/**
 * Get a download URL for a file
 */
export async function getDownloadUrl(options: FileDownloadOptions): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      key: options.key,
    });

    if (options.organizationId) {
      params.append("organizationId", options.organizationId);
    }

    const response = await fetch(`/api/files/download?${params}`, {
      method: "HEAD", // Just get the URL, don't download
    });

    if (response.ok) {
      return `/api/files/download?${params}`;
    }

    return null;
  } catch (error) {

    return null;
  }
}

/**
 * Download a file directly
 */
export async function downloadFile(options: FileDownloadOptions): Promise<Blob | null> {
  try {
    const params = new URLSearchParams({
      key: options.key,
    });

    if (options.organizationId) {
      params.append("organizationId", options.organizationId);
    }

    const response = await fetch(`/api/files/download?${params}`);

    if (response.ok) {
      return await response.blob();
    }

    return null;
  } catch (error) {

    return null;
  }
}

/**
 * Check if a file exists
 */
export async function fileExists(options: FileDownloadOptions): Promise<boolean> {
  try {
    const params = new URLSearchParams({
      key: options.key,
    });

    if (options.organizationId) {
      params.append("organizationId", options.organizationId);
    }

    const response = await fetch(`/api/files/download?${params}`, {
      method: "HEAD",
    });

    return response.ok;
  } catch (error) {

    return false;
  }
}
