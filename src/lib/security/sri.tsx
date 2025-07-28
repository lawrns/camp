/**
 * Subresource Integrity (SRI) Implementation
 * 
 * Enterprise security for static asset integrity verification:
 * - Generate SHA-384 hashes for all static assets
 * - Automatic SRI hash generation during build
 * - Runtime integrity verification
 * - Fallback mechanisms for hash mismatches
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import React from 'react';

// SRI hash algorithms
export type SRIAlgorithm = 'sha256' | 'sha384' | 'sha512';

// SRI hash entry
export interface SRIHash {
  algorithm: SRIAlgorithm;
  hash: string;
  integrity: string; // Full integrity attribute value
}

// Asset manifest for SRI hashes
export interface SRIManifest {
  [assetPath: string]: SRIHash;
}

// Generate SRI hash for content
export function generateSRIHash(
  content: string | Buffer,
  algorithm: SRIAlgorithm = 'sha384'
): SRIHash {
  const hash = crypto
    .createHash(algorithm)
    .update(content)
    .digest('base64');

  return {
    algorithm,
    hash,
    integrity: `${algorithm}-${hash}`,
  };
}

// Generate SRI hash for file
export function generateSRIHashForFile(
  filePath: string,
  algorithm: SRIAlgorithm = 'sha384'
): SRIHash {
  const content = fs.readFileSync(filePath);
  return generateSRIHash(content, algorithm);
}

// Generate SRI manifest for directory
export function generateSRIManifest(
  assetsDir: string,
  options: {
    extensions?: string[];
    recursive?: boolean;
    algorithm?: SRIAlgorithm;
    outputPath?: string;
  } = {}
): SRIManifest {
  const {
    extensions = ['.js', '.css', '.woff', '.woff2'],
    recursive = true,
    algorithm = 'sha384',
    outputPath,
  } = options;

  const manifest: SRIManifest = {};

  function processDirectory(dir: string, baseDir: string = dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);

      if (entry.isDirectory() && recursive) {
        processDirectory(fullPath, baseDir);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          try {
            const sriHash = generateSRIHashForFile(fullPath, algorithm);
            manifest[relativePath.replace(/\\/g, '/')] = sriHash;
          } catch (error) {

          }
        }
      }
    }
  }

  if (fs.existsSync(assetsDir)) {
    processDirectory(assetsDir);
  }

  // Save manifest to file if outputPath is provided
  if (outputPath) {
    fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2));
  }

  return manifest;
}

// Load SRI manifest
export function loadSRIManifest(manifestPath: string): SRIManifest {
  try {
    const content = fs.readFileSync(manifestPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {

    return {};
  }
}

// Verify SRI hash
export function verifySRIHash(
  content: string | Buffer,
  expectedIntegrity: string
): boolean {
  const [algorithm, expectedHash] = expectedIntegrity.split('-');

  if (!['sha256', 'sha384', 'sha512'].includes(algorithm)) {
    return false;
  }

  const actualHash = crypto
    .createHash(algorithm as SRIAlgorithm)
    .update(content)
    .digest('base64');

  return actualHash === expectedHash;
}

// React component for SRI-protected script loading
export function SRIScript({
  src,
  integrity,
  crossOrigin = 'anonymous',
  fallbackSrc,
  onError,
  ...props
}: {
  src: string;
  integrity?: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
  fallbackSrc?: string;
  onError?: (error: Event) => void;
  [key: string]: any;
}) {
  const handleError = (error: React.SyntheticEvent<HTMLScriptElement, Event>) => {

    // Try fallback if available
    if (fallbackSrc) {
      const script = error.target as HTMLScriptElement;
      script.src = fallbackSrc;
      script.removeAttribute('integrity');

    }

    onError?.(error.nativeEvent);
  };

  return (
    <script
      src={src}
      integrity={integrity}
      crossOrigin={crossOrigin}
      onError={handleError}
      {...props}
    />
  );
}

// React component for SRI-protected stylesheet loading
export function SRIStylesheet({
  href,
  integrity,
  crossOrigin = 'anonymous',
  fallbackHref,
  onError,
  ...props
}: {
  href: string;
  integrity?: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
  fallbackHref?: string;
  onError?: (error: Event) => void;
  [key: string]: any;
}) {
  const handleError = (error: React.SyntheticEvent<HTMLLinkElement, Event>) => {

    // Try fallback if available
    if (fallbackHref) {
      const link = error.target as HTMLLinkElement;
      link.href = fallbackHref;
      link.removeAttribute('integrity');

    }

    onError?.(error.nativeEvent);
  };

  return (
    <link
      rel="stylesheet"
      href={href}
      integrity={integrity}
      crossOrigin={crossOrigin}
      onError={handleError}
      {...props}
    />
  );
}

// Hook for SRI-protected resource loading
export function useSRIResource(
  url: string,
  integrity?: string,
  fallbackUrl?: string
): {
  loading: boolean;
  error: boolean;
  verified: boolean;
  load: () => Promise<void>;
} {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(false);
  const [verified, setVerified] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(false);
    setVerified(false);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const content = await response.text();

      // Verify integrity if provided
      if (integrity) {
        const isValid = verifySRIHash(content, integrity);
        if (!isValid) {
          throw new Error('SRI verification failed');
        }
        setVerified(true);
      }

      setLoading(false);
    } catch (err) {

      // Try fallback if available
      if (fallbackUrl && url !== fallbackUrl) {

        return load(); // Recursive call with fallback
      }

      setError(true);
      setLoading(false);
    }
  }, [url, integrity, fallbackUrl]);

  return { loading, error, verified, load };
}

// Build-time SRI generation for Next.js
export function createSRIWebpackPlugin(options: {
  algorithm?: SRIAlgorithm;
  manifestPath?: string;
  includeChunks?: string[];
  excludeChunks?: string[];
} = {}) {
  const {
    algorithm = 'sha384',
    manifestPath = './public/sri-manifest.json',
    includeChunks = [],
    excludeChunks = [],
  } = options;

  return {
    apply(compiler: any) {
      compiler.hooks.emit.tapAsync('SRIPlugin', (compilation: any, callback: any) => {
        const manifest: SRIManifest = {};

        // Process all assets
        Object.keys(compilation.assets).forEach(filename => {
          // Filter chunks if specified
          if (includeChunks.length > 0 && !includeChunks.some(chunk => filename.includes(chunk))) {
            return;
          }
          if (excludeChunks.some(chunk => filename.includes(chunk))) {
            return;
          }

          // Only process JS and CSS files
          if (!/\.(js|css)$/.test(filename)) {
            return;
          }

          const asset = compilation.assets[filename];
          const content = asset.source();
          const sriHash = generateSRIHash(content, algorithm);

          manifest[filename] = sriHash;
        });

        // Write manifest to assets
        const manifestContent = JSON.stringify(manifest, null, 2);
        compilation.assets['sri-manifest.json'] = {
          source: () => manifestContent,
          size: () => manifestContent.length,
        };

        callback();
      });
    },
  };
}

// Runtime SRI verification for dynamic imports
export async function loadSRIModule(
  moduleUrl: string,
  integrity?: string,
  fallbackUrl?: string
): Promise<any> {
  try {
    // Fetch and verify the module
    const response = await fetch(moduleUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const content = await response.text();

    // Verify integrity if provided
    if (integrity && !verifySRIHash(content, integrity)) {
      throw new Error('SRI verification failed');
    }

    // Create blob URL for secure module loading
    const blob = new Blob([content], { type: 'application/javascript' });
    const blobUrl = URL.createObjectURL(blob);

    try {
      const module = await import(blobUrl);
      URL.revokeObjectURL(blobUrl);
      return module;
    } catch (importError) {
      URL.revokeObjectURL(blobUrl);
      throw importError;
    }
  } catch (error) {

    // Try fallback if available
    if (fallbackUrl && moduleUrl !== fallbackUrl) {

      return loadSRIModule(fallbackUrl);
    }

    throw error;
  }
}

export default {
  generateSRIHash,
  generateSRIHashForFile,
  generateSRIManifest,
  loadSRIManifest,
  verifySRIHash,
  createSRIWebpackPlugin,
  loadSRIModule,
  SRIScript,
  SRIStylesheet,
  useSRIResource,
};
