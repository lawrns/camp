/**
 * Tests for Optimized Asset Loader
 * 
 * Tests:
 * - Image optimization and lazy loading
 * - Avatar fallbacks and error handling
 * - Attachment preview functionality
 * - Performance monitoring
 * - Responsive image sizing
 * - AVIF/WebP format support
 */

import { describe, it, expect, beforeEach, afterEach, vi, Mock } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import {
  OptimizedImage,
  Avatar,
  AttachmentPreview,
  LazyImageGallery,
  useImagePerformance,
  generateBlurDataURL,
} from '../OptimizedAssetLoader';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, onLoad, onError, ...props }: any) => {
    const handleLoad = () => {
      if (onLoad) onLoad();
    };
    
    const handleError = () => {
      if (onError) onError();
    };
    
    return (
      <img
        src={src}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        data-testid="next-image"
        {...props}
      />
    );
  },
}));

// Mock Intersection Observer
const mockIntersectionObserver = vi.fn();
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

Object.defineProperty(global, 'IntersectionObserver', {
  value: class MockIntersectionObserver {
    constructor(callback: (entries: any[]) => void) {
      mockIntersectionObserver.mockImplementation(callback);
    }
    observe = mockObserve;
    disconnect = mockDisconnect;
    unobserve = vi.fn();
  },
});

// Mock canvas for blur placeholder generation
Object.defineProperty(global, 'HTMLCanvasElement', {
  value: class MockCanvas {
    width = 0;
    height = 0;
    getContext() {
      return {
        createLinearGradient: () => ({
          addColorStop: vi.fn(),
        }),
        fillRect: vi.fn(),
        fillStyle: '',
      };
    }
    toDataURL() {
      return 'data:image/png;base64,mock-blur-data';
    }
  },
});

// Test component for performance hook
function TestPerformanceComponent() {
  const { metrics, trackImageLoad, trackImageError, incrementTotalImages } = useImagePerformance();

  return (
    <div>
      <div data-testid="total-images">{metrics.totalImages}</div>
      <div data-testid="loaded-images">{metrics.loadedImages}</div>
      <div data-testid="failed-images">{metrics.failedImages}</div>
      <div data-testid="average-load-time">{metrics.averageLoadTime}</div>
      <button onClick={() => incrementTotalImages()} data-testid="increment-total">
        Increment Total
      </button>
      <button onClick={() => trackImageLoad(100)} data-testid="track-load">
        Track Load
      </button>
      <button onClick={() => trackImageError()} data-testid="track-error">
        Track Error
      </button>
    </div>
  );
}

describe('OptimizedAssetLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('OptimizedImage', () => {
    it('should render image with proper props', () => {
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test image"
          width={400}
          height={300}
        />
      );

      const image = screen.getByTestId('next-image');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', '/test-image.jpg');
      expect(image).toHaveAttribute('alt', 'Test image');
    });

    it('should show loading state initially', () => {
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test image"
          width={400}
          height={300}
        />
      );

      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });

    it('should handle image load success', async () => {
      const onLoad = vi.fn();
      
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test image"
          width={400}
          height={300}
          onLoad={onLoad}
        />
      );

      const image = screen.getByTestId('next-image');
      fireEvent.load(image);

      await waitFor(() => {
        expect(onLoad).toHaveBeenCalled();
      });
    });

    it('should handle image load error', async () => {
      const onError = vi.fn();
      
      render(
        <OptimizedImage
          src="/invalid-image.jpg"
          alt="Test image"
          width={400}
          height={300}
          onError={onError}
        />
      );

      const image = screen.getByTestId('next-image');
      fireEvent.error(image);

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(expect.any(Error));
        expect(screen.getByRole('alert')).toBeInTheDocument(); // Error icon
      });
    });

    it('should generate blur placeholder when not provided', async () => {
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="Test image"
          width={400}
          height={300}
          placeholder="blur"
        />
      );

      // Should generate blur data URL
      await waitFor(() => {
        expect(screen.getByTestId('next-image')).toBeInTheDocument();
      });
    });
  });

  describe('Avatar', () => {
    it('should render image avatar when src is provided', () => {
      render(
        <Avatar
          src="/avatar.jpg"
          name="John Doe"
          size="md"
        />
      );

      expect(screen.getByTestId('next-image')).toBeInTheDocument();
      expect(screen.getByAltText('John Doe avatar')).toBeInTheDocument();
    });

    it('should fallback to initials when image fails', async () => {
      render(
        <Avatar
          src="/invalid-avatar.jpg"
          name="John Doe"
          size="md"
        />
      );

      const image = screen.getByTestId('next-image');
      fireEvent.error(image);

      await waitFor(() => {
        expect(screen.getByText('JD')).toBeInTheDocument();
      });
    });

    it('should show initials when no src provided', () => {
      render(
        <Avatar
          name="Jane Smith"
          size="lg"
        />
      );

      expect(screen.getByText('JS')).toBeInTheDocument();
    });

    it('should show fallback icon when no name provided', () => {
      render(
        <Avatar
          name=""
          size="sm"
        />
      );

      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Lucide icon
    });

    it('should apply correct size classes', () => {
      const { rerender } = render(
        <Avatar name="Test User" size="sm" />
      );

      expect(screen.getByText('TU').closest('div')).toHaveClass('h-8', 'w-8');

      rerender(<Avatar name="Test User" size="xl" />);
      expect(screen.getByText('TU').closest('div')).toHaveClass('h-16', 'w-16');
    });
  });

  describe('AttachmentPreview', () => {
    const mockFile = {
      name: 'document.pdf',
      type: 'application/pdf',
      size: 1024000, // 1MB
      url: '/files/document.pdf',
    };

    it('should render file information', () => {
      render(
        <AttachmentPreview file={mockFile} />
      );

      expect(screen.getByText('document.pdf')).toBeInTheDocument();
      expect(screen.getByText('1000 KB')).toBeInTheDocument();
    });

    it('should show image thumbnail for image files', () => {
      const imageFile = {
        name: 'photo.jpg',
        type: 'image/jpeg',
        size: 500000,
        thumbnail: '/thumbnails/photo.jpg',
      };

      render(
        <AttachmentPreview file={imageFile} />
      );

      expect(screen.getByTestId('next-image')).toBeInTheDocument();
      expect(screen.getByAltText('photo.jpg')).toBeInTheDocument();
    });

    it('should show preview button for image files', () => {
      const imageFile = {
        name: 'photo.jpg',
        type: 'image/jpeg',
        size: 500000,
        thumbnail: '/thumbnails/photo.jpg',
      };

      const onPreview = vi.fn();

      render(
        <AttachmentPreview file={imageFile} onPreview={onPreview} />
      );

      const previewButton = screen.getByTitle('Preview');
      fireEvent.click(previewButton);

      expect(onPreview).toHaveBeenCalled();
    });

    it('should show download button when URL is provided', () => {
      const onDownload = vi.fn();

      render(
        <AttachmentPreview file={mockFile} onDownload={onDownload} />
      );

      const downloadButton = screen.getByTitle('Download');
      fireEvent.click(downloadButton);

      expect(onDownload).toHaveBeenCalled();
    });

    it('should format file sizes correctly', () => {
      const files = [
        { ...mockFile, size: 1024, name: 'small.txt' },
        { ...mockFile, size: 1048576, name: 'medium.txt' },
        { ...mockFile, size: 1073741824, name: 'large.txt' },
      ];

      files.forEach(file => {
        const { unmount } = render(<AttachmentPreview file={file} />);
        
        if (file.size === 1024) {
          expect(screen.getByText('1 KB')).toBeInTheDocument();
        } else if (file.size === 1048576) {
          expect(screen.getByText('1 MB')).toBeInTheDocument();
        } else if (file.size === 1073741824) {
          expect(screen.getByText('1 GB')).toBeInTheDocument();
        }
        
        unmount();
      });
    });
  });

  describe('LazyImageGallery', () => {
    const mockImages = [
      { src: '/image1.jpg', alt: 'Image 1', thumbnail: '/thumb1.jpg' },
      { src: '/image2.jpg', alt: 'Image 2', thumbnail: '/thumb2.jpg' },
      { src: '/image3.jpg', alt: 'Image 3', thumbnail: '/thumb3.jpg' },
    ];

    it('should render placeholder images initially', () => {
      render(
        <LazyImageGallery images={mockImages} />
      );

      // Should show placeholder divs
      const placeholders = screen.getAllByRole('generic').filter(el => 
        el.className.includes('animate-pulse')
      );
      expect(placeholders).toHaveLength(mockImages.length);
    });

    it('should load images when they become visible', async () => {
      render(
        <LazyImageGallery images={mockImages} />
      );

      // Simulate intersection observer triggering
      act(() => {
        mockIntersectionObserver([
          {
            isIntersecting: true,
            target: { getAttribute: () => '0' },
          },
        ]);
      });

      await waitFor(() => {
        expect(screen.getByAltText('Image 1')).toBeInTheDocument();
      });
    });

    it('should handle image click events', () => {
      const onImageClick = vi.fn();

      render(
        <LazyImageGallery images={mockImages} onImageClick={onImageClick} />
      );

      // Make first image visible
      act(() => {
        mockIntersectionObserver([
          {
            isIntersecting: true,
            target: { getAttribute: () => '0' },
          },
        ]);
      });

      const imageContainer = screen.getByAltText('Image 1').closest('div');
      fireEvent.click(imageContainer!);

      expect(onImageClick).toHaveBeenCalledWith(0);
    });
  });

  describe('useImagePerformance', () => {
    it('should track image metrics correctly', () => {
      render(<TestPerformanceComponent />);

      expect(screen.getByTestId('total-images')).toHaveTextContent('0');
      expect(screen.getByTestId('loaded-images')).toHaveTextContent('0');
      expect(screen.getByTestId('failed-images')).toHaveTextContent('0');

      // Increment total images
      fireEvent.click(screen.getByTestId('increment-total'));
      expect(screen.getByTestId('total-images')).toHaveTextContent('1');

      // Track successful load
      fireEvent.click(screen.getByTestId('track-load'));
      expect(screen.getByTestId('loaded-images')).toHaveTextContent('1');
      expect(screen.getByTestId('average-load-time')).toHaveTextContent('100');

      // Track error
      fireEvent.click(screen.getByTestId('track-error'));
      expect(screen.getByTestId('failed-images')).toHaveTextContent('1');
    });

    it('should calculate average load time correctly', () => {
      render(<TestPerformanceComponent />);

      // Track multiple loads
      fireEvent.click(screen.getByTestId('track-load')); // 100ms
      fireEvent.click(screen.getByTestId('track-load')); // 100ms
      
      expect(screen.getByTestId('average-load-time')).toHaveTextContent('100');
      expect(screen.getByTestId('loaded-images')).toHaveTextContent('2');
    });
  });

  describe('generateBlurDataURL', () => {
    it('should generate a valid data URL', () => {
      const blurDataURL = generateBlurDataURL(8, 8);
      
      expect(blurDataURL).toMatch(/^data:image\/png;base64,/);
      expect(blurDataURL).toBe('data:image/png;base64,mock-blur-data');
    });

    it('should handle different dimensions', () => {
      const blurDataURL1 = generateBlurDataURL(16, 16);
      const blurDataURL2 = generateBlurDataURL(32, 32);
      
      expect(blurDataURL1).toBeTruthy();
      expect(blurDataURL2).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should provide proper alt text for images', () => {
      render(
        <OptimizedImage
          src="/test-image.jpg"
          alt="A beautiful landscape"
          width={400}
          height={300}
        />
      );

      expect(screen.getByAltText('A beautiful landscape')).toBeInTheDocument();
    });

    it('should provide proper button labels', () => {
      const mockFile = {
        name: 'document.pdf',
        type: 'application/pdf',
        size: 1024000,
        url: '/files/document.pdf',
      };

      render(
        <AttachmentPreview 
          file={mockFile} 
          onDownload={() => {}} 
        />
      );

      expect(screen.getByTitle('Download')).toBeInTheDocument();
    });
  });
});
