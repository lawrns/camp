/**
 * Optimized Asset Loader for Widget
 * 
 * Features:
 * - Next.js Image optimization with AVIF/WebP
 * - Lazy loading with intersection observer
 * - Blur placeholders for smooth loading
 * - Responsive sizes for different viewports
 * - Progressive enhancement
 * - Error handling and fallbacks
 * - Performance monitoring
 */

"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { User, FileText, Download, Eye, AlertCircle } from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  quality?: number;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fallbackIcon?: React.ComponentType<{ className?: string }>;
}

interface AttachmentPreviewProps {
  file: {
    name: string;
    type: string;
    size: number;
    url?: string;
    thumbnail?: string;
  };
  className?: string;
  onPreview?: () => void;
  onDownload?: () => void;
}

// ============================================================================
// BLUR PLACEHOLDER GENERATOR
// ============================================================================

function generateBlurDataURL(width: number = 8, height: number = 8): string {
  // Generate a simple gradient blur placeholder
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(1, '#e5e7eb');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL();
}

// ============================================================================
// OPTIMIZED IMAGE COMPONENT
// ============================================================================

export const OptimizedImage = React.memo<OptimizedImageProps>(({
  src,
  alt,
  width = 400,
  height = 300,
  className = '',
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 85,
  onLoad,
  onError,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [actualBlurDataURL, setActualBlurDataURL] = useState(blurDataURL);

  // Generate blur placeholder if not provided
  useEffect(() => {
    if (placeholder === 'blur' && !blurDataURL) {
      setActualBlurDataURL(generateBlurDataURL());
    }
  }, [placeholder, blurDataURL]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onError?.(new Error(`Failed to load image: ${src}`));
  }, [src, onError]);

  if (hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}
        style={{ width, height }}
      >
        <AlertCircle className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={actualBlurDataURL}
        sizes={sizes}
        quality={quality}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          objectFit: 'cover',
          width: '100%',
          height: '100%',
        }}
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 animate-pulse">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
});

OptimizedImage.displayName = 'OptimizedImage';

// ============================================================================
// AVATAR COMPONENT
// ============================================================================

export const Avatar = React.memo<AvatarProps>(({
  src,
  name,
  size = 'md',
  className = '',
  fallbackIcon: FallbackIcon = User,
}) => {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  };

  const iconSizes = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8',
  };

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getBackgroundColor = (name: string): string => {
    const colors = [
      'bg-red-500',
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
    ];
    
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (src && !hasError) {
    return (
      <div className={`relative rounded-full overflow-hidden ${sizeClasses[size]} ${className}`}>
        <OptimizedImage
          src={src}
          alt={`${name} avatar`}
          width={size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : 64}
          height={size === 'sm' ? 32 : size === 'md' ? 40 : size === 'lg' ? 48 : 64}
          className="rounded-full"
          priority={size === 'lg' || size === 'xl'}
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  // Fallback to initials or icon
  return (
    <div 
      className={`
        flex items-center justify-center rounded-full text-white font-medium
        ${sizeClasses[size]} ${getBackgroundColor(name)} ${className}
      `}
    >
      {name ? (
        <span>{getInitials(name)}</span>
      ) : (
        <FallbackIcon className={iconSizes[size]} />
      )}
    </div>
  );
});

Avatar.displayName = 'Avatar';

// ============================================================================
// ATTACHMENT PREVIEW COMPONENT
// ============================================================================

export const AttachmentPreview = React.memo<AttachmentPreviewProps>(({
  file,
  className = '',
  onPreview,
  onDownload,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) {
      return '🖼️';
    } else if (type.startsWith('video/')) {
      return '🎥';
    } else if (type.startsWith('audio/')) {
      return '🎵';
    } else if (type.includes('pdf')) {
      return '📄';
    } else if (type.includes('document') || type.includes('word')) {
      return '📝';
    } else if (type.includes('spreadsheet') || type.includes('excel')) {
      return '📊';
    } else if (type.includes('presentation') || type.includes('powerpoint')) {
      return '📈';
    } else {
      return '📎';
    }
  };

  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');

  return (
    <div className={`border rounded-lg p-3 bg-white shadow-sm ${className}`}>
      <div className="flex items-start space-x-3">
        {/* Thumbnail or icon */}
        <div className="flex-shrink-0">
          {isImage && file.thumbnail ? (
            <OptimizedImage
              src={file.thumbnail}
              alt={file.name}
              width={48}
              height={48}
              className="rounded border"
              sizes="48px"
            />
          ) : isVideo && file.thumbnail ? (
            <div className="relative">
              <OptimizedImage
                src={file.thumbnail}
                alt={file.name}
                width={48}
                height={48}
                className="rounded border"
                sizes="48px"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-black bg-opacity-50 rounded-full p-1">
                  <div className="w-0 h-0 border-l-4 border-l-white border-y-2 border-y-transparent ml-1"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center text-2xl">
              {getFileIcon(file.type)}
            </div>
          )}
        </div>

        {/* File info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {file.name}
          </p>
          <p className="text-xs text-gray-500">
            {formatFileSize(file.size)}
          </p>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex space-x-1">
          {onPreview && (isImage || isVideo) && (
            <button
              onClick={() => {
                setIsLoading(true);
                onPreview();
                setTimeout(() => setIsLoading(false), 1000);
              }}
              disabled={isLoading}
              className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none disabled:opacity-50"
              title="Preview"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          
          {onDownload && file.url && (
            <button
              onClick={() => {
                setIsLoading(true);
                onDownload();
                setTimeout(() => setIsLoading(false), 1000);
              }}
              disabled={isLoading}
              className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none disabled:opacity-50"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="mt-2 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
    </div>
  );
});

AttachmentPreview.displayName = 'AttachmentPreview';

// ============================================================================
// LAZY IMAGE GALLERY
// ============================================================================

interface LazyImageGalleryProps {
  images: Array<{
    src: string;
    alt: string;
    thumbnail?: string;
  }>;
  className?: string;
  onImageClick?: (index: number) => void;
}

export const LazyImageGallery = React.memo<LazyImageGalleryProps>(({
  images,
  className = '',
  onImageClick,
}) => {
  const [visibleImages, setVisibleImages] = useState<Set<number>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setVisibleImages(prev => new Set([...prev, index]));
          }
        });
      },
      { threshold: 0.1 }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    imageRefs.current.forEach((ref, index) => {
      if (ref && observerRef.current) {
        observerRef.current.observe(ref);
      }
    });
  }, [images]);

  return (
    <div className={`grid grid-cols-2 gap-2 ${className}`}>
      {images.map((image, index) => (
        <div
          key={index}
          ref={el => imageRefs.current[index] = el}
          data-index={index}
          className="aspect-square cursor-pointer"
          onClick={() => onImageClick?.(index)}
        >
          {visibleImages.has(index) ? (
            <OptimizedImage
              src={image.thumbnail || image.src}
              alt={image.alt}
              width={200}
              height={200}
              className="rounded-lg hover:opacity-90 transition-opacity"
              sizes="(max-width: 768px) 50vw, 200px"
            />
          ) : (
            <div className="w-full h-full bg-gray-200 rounded-lg animate-pulse"></div>
          )}
        </div>
      ))}
    </div>
  );
});

LazyImageGallery.displayName = 'LazyImageGallery';

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

export function useImagePerformance() {
  const [metrics, setMetrics] = useState({
    totalImages: 0,
    loadedImages: 0,
    failedImages: 0,
    averageLoadTime: 0,
  });

  const trackImageLoad = useCallback((loadTime: number) => {
    setMetrics(prev => ({
      ...prev,
      loadedImages: prev.loadedImages + 1,
      averageLoadTime: (prev.averageLoadTime * (prev.loadedImages - 1) + loadTime) / prev.loadedImages,
    }));
  }, []);

  const trackImageError = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      failedImages: prev.failedImages + 1,
    }));
  }, []);

  const incrementTotalImages = useCallback(() => {
    setMetrics(prev => ({
      ...prev,
      totalImages: prev.totalImages + 1,
    }));
  }, []);

  return {
    metrics,
    trackImageLoad,
    trackImageError,
    incrementTotalImages,
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  OptimizedImage,
  Avatar,
  AttachmentPreview,
  LazyImageGallery,
  useImagePerformance,
  generateBlurDataURL,
};
