/**
 * Image Optimization Utilities
 * 
 * Provides utilities for:
 * - Responsive image sizing
 * - Format detection and optimization
 * - Lazy loading configuration
 * - Performance monitoring
 * - CDN integration
 */

// ============================================================================
// TYPES
// ============================================================================

interface ImageOptimizationConfig {
  quality: number;
  format: 'auto' | 'webp' | 'avif' | 'jpeg' | 'png';
  sizes: string;
  priority: boolean;
  placeholder: 'blur' | 'empty';
  loading: 'lazy' | 'eager';
}

interface ResponsiveImageSizes {
  mobile: number;
  tablet: number;
  desktop: number;
  xl: number;
}

interface ImageMetrics {
  loadTime: number;
  fileSize: number;
  format: string;
  dimensions: { width: number; height: number };
  cacheHit: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const IMAGE_BREAKPOINTS = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  xl: 1280,
} as const;

export const WIDGET_IMAGE_SIZES: ResponsiveImageSizes = {
  mobile: 280, // Widget width on mobile
  tablet: 320, // Widget width on tablet
  desktop: 380, // Widget width on desktop
  xl: 400, // Max widget width
};

export const AVATAR_SIZES = {
  sm: 32,
  md: 40,
  lg: 48,
  xl: 64,
} as const;

export const ATTACHMENT_THUMBNAIL_SIZE = 48;

export const DEFAULT_QUALITY = 85;
export const HIGH_QUALITY = 95;
export const LOW_QUALITY = 60;

// ============================================================================
// IMAGE OPTIMIZATION FUNCTIONS
// ============================================================================

/**
 * Generate responsive sizes string for Next.js Image component
 */
export function generateResponsiveSizes(
  sizes: Partial<ResponsiveImageSizes> = {},
  customBreakpoints?: Partial<typeof IMAGE_BREAKPOINTS>
): string {
  const breakpoints = { ...IMAGE_BREAKPOINTS, ...customBreakpoints };
  const imageSizes = { ...WIDGET_IMAGE_SIZES, ...sizes };

  return [
    `(max-width: ${breakpoints.mobile}px) ${imageSizes.mobile}px`,
    `(max-width: ${breakpoints.tablet}px) ${imageSizes.tablet}px`,
    `(max-width: ${breakpoints.desktop}px) ${imageSizes.desktop}px`,
    `${imageSizes.xl}px`,
  ].join(', ');
}

/**
 * Get optimal image configuration based on use case
 */
export function getImageConfig(
  useCase: 'avatar' | 'attachment' | 'message' | 'gallery' | 'hero',
  options: Partial<ImageOptimizationConfig> = {}
): ImageOptimizationConfig {
  const baseConfigs = {
    avatar: {
      quality: DEFAULT_QUALITY,
      format: 'auto' as const,
      sizes: generateResponsiveSizes({ mobile: 32, tablet: 40, desktop: 48, xl: 64 }),
      priority: false,
      placeholder: 'blur' as const,
      loading: 'lazy' as const,
    },
    attachment: {
      quality: DEFAULT_QUALITY,
      format: 'auto' as const,
      sizes: `${ATTACHMENT_THUMBNAIL_SIZE}px`,
      priority: false,
      placeholder: 'blur' as const,
      loading: 'lazy' as const,
    },
    message: {
      quality: DEFAULT_QUALITY,
      format: 'auto' as const,
      sizes: generateResponsiveSizes(),
      priority: false,
      placeholder: 'blur' as const,
      loading: 'lazy' as const,
    },
    gallery: {
      quality: HIGH_QUALITY,
      format: 'auto' as const,
      sizes: generateResponsiveSizes(),
      priority: false,
      placeholder: 'blur' as const,
      loading: 'lazy' as const,
    },
    hero: {
      quality: HIGH_QUALITY,
      format: 'auto' as const,
      sizes: generateResponsiveSizes(),
      priority: true,
      placeholder: 'blur' as const,
      loading: 'eager' as const,
    },
  };

  return { ...baseConfigs[useCase], ...options };
}

/**
 * Detect optimal image format based on browser support
 */
export function detectOptimalFormat(): 'avif' | 'webp' | 'jpeg' {
  if (typeof window === 'undefined') return 'jpeg';

  // Check AVIF support
  const avifSupport = new Promise<boolean>((resolve) => {
    const avif = new Image();
    avif.onload = () => resolve(true);
    avif.onerror = () => resolve(false);
    avif.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgABogQEAwgMg8f8D///8WfhwB8+ErK42A=';
  });

  // Check WebP support
  const webpSupport = new Promise<boolean>((resolve) => {
    const webp = new Image();
    webp.onload = () => resolve(true);
    webp.onerror = () => resolve(false);
    webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });

  return Promise.all([avifSupport, webpSupport]).then(([avif, webp]) => {
    if (avif) return 'avif';
    if (webp) return 'webp';
    return 'jpeg';
  }).catch(() => 'jpeg') as any;
}

/**
 * Generate blur placeholder data URL
 */
export function generateBlurPlaceholder(
  width: number = 8,
  height: number = 8,
  color: string = '#f3f4f6'
): string {
  if (typeof window === 'undefined') {
    // Server-side fallback
    return `data:image/svg+xml;base64,${Buffer.from(
      `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${color}"/></svg>`
    ).toString('base64')}`;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Create subtle gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, adjustBrightness(color, -10));
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL('image/png', 0.1);
}

/**
 * Adjust color brightness
 */
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

/**
 * Calculate optimal image dimensions while maintaining aspect ratio
 */
export function calculateOptimalDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;
  
  let width = originalWidth;
  let height = originalHeight;
  
  // Scale down if too wide
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }
  
  // Scale down if too tall
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }
  
  return {
    width: Math.round(width),
    height: Math.round(height),
  };
}

/**
 * Get CDN URL for image optimization
 */
export function getCDNUrl(
  src: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: string;
  } = {}
): string {
  // If it's already a data URL or external URL, return as-is
  if (src.startsWith('data:') || src.startsWith('http')) {
    return src;
  }
  
  const { width, height, quality = DEFAULT_QUALITY, format = 'auto' } = options;
  
  // For Next.js Image optimization
  const params = new URLSearchParams();
  if (width) params.set('w', width.toString());
  if (height) params.set('h', height.toString());
  if (quality !== DEFAULT_QUALITY) params.set('q', quality.toString());
  if (format !== 'auto') params.set('f', format);
  
  const queryString = params.toString();
  return `/_next/image?url=${encodeURIComponent(src)}${queryString ? `&${queryString}` : ''}`;
}

// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================

class ImagePerformanceMonitor {
  private metrics: Map<string, ImageMetrics> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.setupPerformanceObserver();
    }
  }

  private setupPerformanceObserver() {
    try {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry: any) => {
          if (entry.initiatorType === 'img' || entry.name.includes('image')) {
            this.recordMetric(entry.name, {
              loadTime: entry.duration,
              fileSize: entry.transferSize || 0,
              format: this.extractFormat(entry.name),
              dimensions: { width: 0, height: 0 }, // Would need additional tracking
              cacheHit: entry.transferSize === 0,
            });
          }
        });
      });

      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (error) {
      console.warn('Performance monitoring not available:', error);
    }
  }

  private extractFormat(url: string): string {
    const match = url.match(/\.(avif|webp|jpg|jpeg|png|gif)(\?|$)/i);
    return match ? match[1].toLowerCase() : 'unknown';
  }

  recordMetric(url: string, metrics: ImageMetrics) {
    this.metrics.set(url, metrics);
  }

  getMetrics(url?: string): ImageMetrics | Map<string, ImageMetrics> {
    if (url) {
      return this.metrics.get(url) || {
        loadTime: 0,
        fileSize: 0,
        format: 'unknown',
        dimensions: { width: 0, height: 0 },
        cacheHit: false,
      };
    }
    return this.metrics;
  }

  getAverageLoadTime(): number {
    const metrics = Array.from(this.metrics.values());
    if (metrics.length === 0) return 0;
    
    const totalTime = metrics.reduce((sum, metric) => sum + metric.loadTime, 0);
    return totalTime / metrics.length;
  }

  getCacheHitRate(): number {
    const metrics = Array.from(this.metrics.values());
    if (metrics.length === 0) return 0;
    
    const cacheHits = metrics.filter(metric => metric.cacheHit).length;
    return (cacheHits / metrics.length) * 100;
  }

  getTotalDataTransferred(): number {
    const metrics = Array.from(this.metrics.values());
    return metrics.reduce((sum, metric) => sum + metric.fileSize, 0);
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const imagePerformanceMonitor = new ImagePerformanceMonitor();

export default {
  generateResponsiveSizes,
  getImageConfig,
  detectOptimalFormat,
  generateBlurPlaceholder,
  calculateOptimalDimensions,
  getCDNUrl,
  imagePerformanceMonitor,
  IMAGE_BREAKPOINTS,
  WIDGET_IMAGE_SIZES,
  AVATAR_SIZES,
  ATTACHMENT_THUMBNAIL_SIZE,
  DEFAULT_QUALITY,
  HIGH_QUALITY,
  LOW_QUALITY,
};
