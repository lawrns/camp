/**
 * WIDGET FILE UPLOAD COMPONENT
 * 
 * Pixel-perfect file upload component for UltimateWidget
 * Supports drag & drop, multiple files, and progress tracking
 */

import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SPACING, COLORS, RADIUS, SHADOWS, ANIMATIONS } from './tokens';

// ============================================================================
// TYPES
// ============================================================================
export interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  onFileUpload?: (file: File) => Promise<string>; // Returns file URL
  maxSize?: number; // in MB
  maxFiles?: number;
  acceptedTypes?: string[];
  className?: string;
  disabled?: boolean;
}

export interface FileUploadProgress {
  fileId: string;
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

// ============================================================================
// WIDGET FILE UPLOAD COMPONENT
// ============================================================================
export function WidgetFileUpload({
  onFileSelect,
  onFileUpload,
  maxSize = 10, // 10MB default
  maxFiles = 5,
  acceptedTypes = ["image/*", "application/pdf", ".doc", ".docx", ".txt", "video/*", "audio/*"],
  className,
  disabled = false,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);

  // Handle file validation
  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size must be less than ${maxSize}MB`;
    }

    // Check file type
    const isValidType = acceptedTypes.some(type => {
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType);
      }
      return file.type === type || file.name.toLowerCase().endsWith(type.replace('.', ''));
    });

    if (!isValidType) {
      return `File type not supported. Allowed: ${acceptedTypes.join(', ')}`;
    }

    return null;
  };

  // Handle file selection
  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate each file
    fileArray.forEach((file, index) => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });

    // Show errors if any
    if (errors.length > 0) {
      alert(errors.join('\n'));
    }

    // Process valid files
    if (validFiles.length > 0) {
      if (onFileUpload) {
        // Upload files with progress tracking
        for (const file of validFiles) {
          const fileId = `${file.name}-${Date.now()}`;
          
          setUploadProgress(prev => [...prev, {
            fileId,
            fileName: file.name,
            progress: 0,
            status: 'uploading'
          }]);

          try {
            const url = await onFileUpload(file);
            
            setUploadProgress(prev => prev.map(p => 
              p.fileId === fileId 
                ? { ...p, progress: 100, status: 'completed' as const }
                : p
            ));

            // Call onFileSelect with the uploaded file info
            onFileSelect([file]);
          } catch (error) {
            setUploadProgress(prev => prev.map(p => 
              p.fileId === fileId 
                ? { ...p, progress: 0, status: 'error' as const, error: error as string }
                : p
            ));
          }
        }
      } else {
        // Just pass files to parent
        onFileSelect(validFiles);
      }
    }
  }, [maxSize, acceptedTypes, onFileSelect, onFileUpload]);

  // Handle drag and drop
  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    handleFileSelect(event.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('w-full', className)}>
      {/* File Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer',
          isDragOver
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        style={{
          borderRadius: RADIUS.lg,
          boxShadow: isDragOver ? SHADOWS.focus : 'none',
        }}
      >
        <div className="space-y-3">
          {/* Upload Icon */}
          <div className="mx-auto w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>

          {/* Upload Text */}
          <div>
            <p className="text-sm font-medium text-gray-900">
              {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Max {maxFiles} files, {maxSize}MB each
            </p>
          </div>

          {/* Supported Types */}
          <div className="text-xs text-gray-400">
            <p>Supported: Images, PDF, Documents, Videos, Audio</p>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => handleFileSelect(e.target.files)}
        accept={acceptedTypes.join(',')}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload Progress */}
      <AnimatePresence>
        {uploadProgress.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 space-y-2"
          >
            {uploadProgress.map((progress) => (
              <motion.div
                key={progress.fileId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
              >
                {/* File Icon */}
                <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {progress.fileName}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(progress.fileSize || 0)}
                  </p>
                </div>

                {/* Progress/Status */}
                <div className="flex items-center space-x-2">
                  {progress.status === 'uploading' && (
                    <div className="w-4 h-4 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                  )}
                  {progress.status === 'completed' && (
                    <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                  {progress.status === 'error' && (
                    <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 