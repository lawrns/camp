import { useCallback, useRef, useState } from "react";

export interface UploadState {
  uploading: boolean;
  progress: number;
  error?: Error;
  fileUrl?: string;
}

export interface UploadOptions {
  onProgress?: (progress: number) => void;
  onError?: (error: Error) => void;
  onComplete?: (url: string) => void;
}

export interface UseFileUploadOptions extends UploadOptions {
  conversationId?: string;
  onSuccess?: (fileUrl: string, file: File) => void;
  onFailure?: (error: Error, file: File) => void;
}

// Real file upload implementation using the API
class FileUploadManager {
  private activeUploads = new Map<string, AbortController>();

  async uploadFile(file: File, conversationId: string, path: string, options: UploadOptions): Promise<string> {
    const abortController = new AbortController();
    const uploadKey = `${file.name}_${Date.now()}`;
    this.activeUploads.set(uploadKey, abortController);

    try {
      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      formData.append("conversationId", conversationId);

      // Make upload request
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          options.onProgress?.(progress);
        }
      });

      // Handle completion
      return new Promise((resolve, reject) => {
        xhr.addEventListener("load", () => {
          this.activeUploads.delete(uploadKey);

          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.success && response.data?.file?.url) {
                options.onComplete?.(response.data.file.url);
                resolve(response.data.file.url);
              } else {
                const error = new Error(response.error || "Upload failed");
                options.onError?.(error);
                reject(error);
              }
            } catch (parseError) {
              const error = new Error("Invalid response format");
              options.onError?.(error);
              reject(error);
            }
          } else {
            const error = new Error(`Upload failed with status ${xhr.status}`);
            options.onError?.(error);
            reject(error);
          }
        });

        xhr.addEventListener("error", () => {
          this.activeUploads.delete(uploadKey);
          const error = new Error("Network error during upload");
          options.onError?.(error);
          reject(error);
        });

        xhr.addEventListener("abort", () => {
          this.activeUploads.delete(uploadKey);
          const error = new Error("Upload cancelled");
          options.onError?.(error);
          reject(error);
        });

        // Handle abort signal
        abortController.signal.addEventListener("abort", () => {
          xhr.abort();
        });

        xhr.open("POST", "/api/upload");
        xhr.send(formData);
      });
    } catch (error) {
      this.activeUploads.delete(uploadKey);
      const uploadError = error instanceof Error ? error : new Error("Upload failed");
      options.onError?.(uploadError);
      throw uploadError;
    }
  }

  cancelUpload(fileName: string): void {
    // Find and abort matching uploads
    for (const [key, controller] of this.activeUploads.entries()) {
      if (key.includes(fileName)) {
        controller.abort();
        this.activeUploads.delete(key);
      }
    }
  }
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [uploadStates, setUploadStates] = useState<Map<string, UploadState>>(new Map());
  const uploaderRef = useRef(new FileUploadManager());
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const getFileKey = (file: File) => `${file.name}_${file.size}_${file.lastModified}`;

  const uploadFile = useCallback(
    async (file: File, customOptions: Partial<UseFileUploadOptions> = {}): Promise<string> => {
      const fileKey = getFileKey(file);
      const mergedOptions = { ...options, ...customOptions };

      const conversationId = mergedOptions.conversationId;
      if (!conversationId) {
        throw new Error("conversationId is required for file uploads");
      }

      // Initialize upload state
      setUploadStates(
        (prev) =>
          new Map(
            prev.set(fileKey, {
              uploading: true,
              progress: 0,
            })
          )
      );

      // Create abort controller
      const abortController = new AbortController();
      abortControllersRef.current.set(fileKey, abortController);

      try {
        const fileUrl = await uploaderRef.current.uploadFile(file, conversationId, "", {
          ...mergedOptions,
          onProgress: (progress: number) => {
            setUploadStates(
              (prev) =>
                new Map(
                  prev.set(fileKey, {
                    ...prev.get(fileKey)!,
                    progress,
                  })
                )
            );
            mergedOptions.onProgress?.(progress);
          },
          onError: (error: Error) => {
            setUploadStates(
              (prev) =>
                new Map(
                  prev.set(fileKey, {
                    ...prev.get(fileKey)!,
                    uploading: false,
                    error,
                  })
                )
            );
            mergedOptions.onError?.(error);
            mergedOptions.onFailure?.(error, file);
          },
          onComplete: (url: string) => {
            setUploadStates(
              (prev) =>
                new Map(
                  prev.set(fileKey, {
                    ...prev.get(fileKey)!,
                    uploading: false,
                    progress: 100,
                    fileUrl: url,
                  })
                )
            );
            mergedOptions.onComplete?.(url);
            mergedOptions.onSuccess?.(url, file);
          },
        });

        // Clean up
        abortControllersRef.current.delete(fileKey);

        return fileUrl;
      } catch (error) {
        // Update error state
        setUploadStates(
          (prev) =>
            new Map(
              prev.set(fileKey, {
                ...prev.get(fileKey)!,
                uploading: false,
                error: error instanceof Error ? error : new Error("Upload failed"),
              })
            )
        );

        // Clean up
        abortControllersRef.current.delete(fileKey);

        throw error;
      }
    },
    [options]
  );

  const uploadMultipleFiles = useCallback(
    async (files: File[], customOptions: Partial<UseFileUploadOptions> = {}): Promise<string[]> => {
      const uploadPromises = files.map((file: any) => uploadFile(file, customOptions));

      try {
        return await Promise.all(uploadPromises);
      } catch (error) {
        // Some files may have succeeded, some failed
        // Return the URLs of successful uploads
        const results = await Promise.allSettled(uploadPromises);
        return results
          .filter((result: any): result is PromiseFulfilledResult<string> => result.status === "fulfilled")
          .map((result: any) => result.value);
      }
    },
    [uploadFile]
  );

  const cancelUpload = useCallback((file: File) => {
    const fileKey = getFileKey(file);
    const abortController = abortControllersRef.current.get(fileKey);

    if (abortController) {
      abortController.abort();
      abortControllersRef.current.delete(fileKey);
    }

    // Cancel in upload manager
    uploaderRef.current.cancelUpload(file.name);

    // Update state
    setUploadStates((prev) => {
      const newMap = new Map(prev);
      newMap.delete(fileKey);
      return newMap;
    });
  }, []);

  const retryUpload = useCallback(
    async (file: File): Promise<string> => {
      const fileKey = getFileKey(file);

      // Clear previous error state
      setUploadStates((prev) => {
        const newMap = new Map(prev);
        newMap.delete(fileKey);
        return newMap;
      });

      return uploadFile(file);
    },
    [uploadFile]
  );

  const clearUploadState = useCallback((file: File) => {
    const fileKey = getFileKey(file);
    setUploadStates((prev) => {
      const newMap = new Map(prev);
      newMap.delete(fileKey);
      return newMap;
    });
  }, []);

  const clearAllUploadStates = useCallback(() => {
    setUploadStates(new Map());
  }, []);

  const getUploadState = useCallback(
    (file: File): UploadState | undefined => {
      const fileKey = getFileKey(file);
      return uploadStates.get(fileKey);
    },
    [uploadStates]
  );

  const isUploading = useCallback(
    (file?: File): boolean => {
      if (file) {
        const state = getUploadState(file);
        return state?.uploading || false;
      }

      // Check if any file is uploading
      return Array.from(uploadStates.values()).some((state) => state.uploading);
    },
    [uploadStates, getUploadState]
  );

  const hasErrors = useCallback((): boolean => {
    return Array.from(uploadStates.values()).some((state) => state.error);
  }, [uploadStates]);

  const getProgress = useCallback(
    (file?: File): number => {
      if (file) {
        const state = getUploadState(file);
        return state?.progress || 0;
      }

      // Get overall progress
      const states = Array.from(uploadStates.values());
      if (states.length === 0) return 0;

      const totalProgress = states.reduce((sum: any, state: any) => sum + (state.progress || 0), 0);
      return totalProgress / states.length;
    },
    [uploadStates, getUploadState]
  );

  return {
    uploadFile,
    uploadMultipleFiles,
    cancelUpload,
    retryUpload,
    clearUploadState,
    clearAllUploadStates,
    getUploadState,
    isUploading,
    hasErrors,
    getProgress,
    uploadStates: Array.from(uploadStates.entries()).map(([key, state]) => ({
      key,
      ...state,
    })),
  };
}

// Hook for drag and drop file upload
export function useDragAndDropUpload(
  onFilesSelected: (files: File[]) => void,
  options: {
    acceptedTypes?: string[];
    maxFiles?: number;
    maxFileSize?: number;
  } = {}
) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => prev + 1);
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter((prev) => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsDragOver(false);
      }
      return newCounter;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsDragOver(false);
      setDragCounter(0);

      const files = Array.from(e.dataTransfer.files);

      // Filter files by type if specified
      let filteredFiles = files;
      if (options.acceptedTypes) {
        filteredFiles = files.filter((file: any) => options.acceptedTypes!.includes(file.type));
      }

      // Limit number of files if specified
      if (options.maxFiles) {
        filteredFiles = filteredFiles.slice(0, options.maxFiles);
      }

      // Filter by file size if specified
      if (options.maxFileSize) {
        filteredFiles = filteredFiles.filter((file: any) => file.size <= options.maxFileSize!);
      }

      if (filteredFiles.length > 0) {
        onFilesSelected(filteredFiles);
      }
    },
    [onFilesSelected, options]
  );

  const getRootProps = useCallback(
    () => ({
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    }),
    [handleDragEnter, handleDragLeave, handleDragOver, handleDrop]
  );

  return {
    isDragOver,
    getRootProps,
  };
}
