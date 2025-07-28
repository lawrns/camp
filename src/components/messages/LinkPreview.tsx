"use client";

import React, { useEffect, useState } from "react";
import { OptimizedMotion, OptimizedAnimatePresence } from "@/lib/animations/OptimizedMotion";
import { ExternalLink, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LinkMetadata {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
  siteName?: string;
}

interface LinkPreviewProps {
  url: string;
  className?: string;
  onError?: (error: Error) => void;
}

export function LinkPreview({ url, className, onError }: LinkPreviewProps) {
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetadata = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check cache first
        const cacheKey = `link_preview_${url}`;
        const cached = sessionStorage.getItem(cacheKey);

        if (cached) {
          const cachedData = JSON.parse(cached);
          // Check if cache is still valid (24 hours)
          if (Date.now() - cachedData.timestamp < 24 * 60 * 60 * 1000) {
            setMetadata(cachedData.data);
            setLoading(false);
            return;
          }
        }

        // Fetch metadata from API
        const response = await fetch("/api/link-preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch link preview");
        }

        const data = await response.json();

        // Cache the result
        sessionStorage.setItem(
          cacheKey,
          JSON.stringify({
            data,
            timestamp: Date.now(),
          })
        );

        setMetadata(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load preview";
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      fetchMetadata();
    }
  }, [url, onError]);

  // Extract domain from URL for fallback display
  const getDomain = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace("www.", "");
    } catch {
      return url;
    }
  };

  if (loading) {
    return (
      <OptimizedMotion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "flex items-center gap-3 rounded-ds-lg border border-[var(--fl-color-border)] bg-[var(--fl-color-background-subtle)] spacing-3",
          className
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        <span className="text-sm text-[var(--fl-color-text-muted)]">Loading preview...</span>
      </OptimizedMotion.div>
    );
  }

  if (error || !metadata) {
    return (
      <OptimizedMotion.a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "flex items-center gap-2 rounded-ds-lg border border-[var(--fl-color-border)] bg-white spacing-3 transition-colors hover:bg-[var(--fl-color-background-subtle)]",
          className
        )}
      >
        <ExternalLink className="h-4 w-4 text-gray-400" />
        <span className="text-sm text-blue-600 underline">{getDomain(url)}</span>
      </OptimizedMotion.a>
    );
  }

  return (
    <OptimizedAnimatePresence>
      <OptimizedMotion.a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn(
          "block overflow-hidden rounded-ds-lg border border-[var(--fl-color-border)] bg-white transition-all hover:shadow-md",
          className
        )}
      >
        <div className="flex">
          {/* Image */}
          {metadata.image && (
            <div className="bg-background relative h-24 w-24 flex-shrink-0 overflow-hidden">
              <img
                src={metadata.image}
                alt={metadata.title || "Preview"}
                className="h-full w-full object-cover"
                onError={(e) => {
                  // Hide image on error
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            </div>
          )}

          {/* Content */}
          <div className="flex flex-1 flex-col justify-between spacing-3">
            <div>
              {/* Title */}
              {metadata.title && (
                <h3 className="line-clamp-1 text-sm font-semibold text-gray-900">{metadata.title}</h3>
              )}

              {/* Description */}
              {metadata.description && (
                <p className="text-foreground mt-1 line-clamp-2 text-tiny">{metadata.description}</p>
              )}
            </div>

            {/* Footer */}
            <div className="mt-2 flex items-center gap-ds-2">
              {metadata.favicon && (
                <img
                  src={metadata.favicon}
                  alt=""
                  className="h-4 w-4"
                  onError={(e) => {
                    // Hide favicon on error
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              )}
              <span className="text-tiny text-[var(--fl-color-text-muted)]">{metadata.siteName || getDomain(url)}</span>
            </div>
          </div>
        </div>
      </OptimizedMotion.a>
    </OptimizedAnimatePresence>
  );
}
