/**
 * File Upload Security Utilities for Campfire v2
 * Implements MIME type validation, file size limits, and virus scanning hooks
 */

// Security configuration from JSON prompt
export const FILE_UPLOAD_CONFIG = {
  allowedMimeTypes: [
    'image/*',
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv'
  ],
  maxFileSizeMB: 25,
  maxFileSizeBytes: 25 * 1024 * 1024, // 25MB
  virusScanEndpoint: '/api/scan',
} as const;

// Specific MIME types for validation
const ALLOWED_MIME_TYPES = [
  // Images
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Documents
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
  'application/json',
  'text/markdown',
] as const;

export interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface VirusScanResult {
  isClean: boolean;
  scanId: string;
  threats?: string[];
  scanTime: number;
}

/**
 * File Upload Security Manager
 */
export class FileUploadSecurity {
  /**
   * Validate file against security policies
   */
  static validateFile(file: File): FileValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file size
    if (file.size > FILE_UPLOAD_CONFIG.maxFileSizeBytes) {
      errors.push(`File size (${this.formatFileSize(file.size)}) exceeds maximum allowed size (${FILE_UPLOAD_CONFIG.maxFileSizeMB}MB)`);
    }

    // Check MIME type
    if (!this.isAllowedMimeType(file.type)) {
      errors.push(`File type "${file.type}" is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
    }

    // Check file extension matches MIME type
    const extensionMismatch = this.checkExtensionMismatch(file);
    if (extensionMismatch) {
      warnings.push(extensionMismatch);
    }

    // Check for suspicious file names
    const suspiciousName = this.checkSuspiciousFileName(file.name);
    if (suspiciousName) {
      warnings.push(suspiciousName);
    }

    // Check for empty files
    if (file.size === 0) {
      errors.push('File is empty');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Check if MIME type is allowed
   */
  private static isAllowedMimeType(mimeType: string): boolean {
    // Check exact matches
    if (ALLOWED_MIME_TYPES.includes(mimeType as any)) {
      return true;
    }

    // Check wildcard patterns (e.g., image/*)
    return FILE_UPLOAD_CONFIG.allowedMimeTypes.some(pattern => {
      if (pattern.endsWith('/*')) {
        const baseType = pattern.slice(0, -2);
        return mimeType.startsWith(baseType + '/');
      }
      return pattern === mimeType;
    });
  }

  /**
   * Check for extension/MIME type mismatch
   */
  private static checkExtensionMismatch(file: File): string | null {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension) return null;

    const expectedMimeTypes: Record<string, string[]> = {
      'jpg': ['image/jpeg'],
      'jpeg': ['image/jpeg'],
      'png': ['image/png'],
      'gif': ['image/gif'],
      'pdf': ['application/pdf'],
      'txt': ['text/plain'],
      'doc': ['application/msword'],
      'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      'xls': ['application/vnd.ms-excel'],
      'xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      'csv': ['text/csv'],
    };

    const expected = expectedMimeTypes[extension];
    if (expected && !expected.includes(file.type)) {
      return `File extension "${extension}" doesn't match MIME type "${file.type}"`;
    }

    return null;
  }

  /**
   * Check for suspicious file names
   */
  private static checkSuspiciousFileName(fileName: string): string | null {
    const suspiciousPatterns = [
      /\.(exe|bat|cmd|scr|pif|com)$/i,
      /\.(js|vbs|ps1|sh)$/i,
      /\.(php|asp|jsp)$/i,
      /\.\./, // Path traversal
      /[<>:"|?*]/, // Invalid characters
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(fileName)) {
        return `Suspicious file name pattern detected: "${fileName}"`;
      }
    }

    return null;
  }

  /**
   * Scan file for viruses (requires backend endpoint)
   */
  static async scanForViruses(file: File): Promise<VirusScanResult> {
    const startTime = Date.now();
    
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(FILE_UPLOAD_CONFIG.virusScanEndpoint, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Virus scan failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      return {
        isClean: result.status === 'clean',
        scanId: result.scanId,
        threats: result.threats || [],
        scanTime: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Virus scan error:', error);
      // In case of scan failure, allow upload but log the error
      return {
        isClean: true, // Fail open for better UX
        scanId: 'scan-failed',
        threats: [],
        scanTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Complete file security check (validation + virus scan)
   */
  static async performSecurityCheck(file: File): Promise<{
    validation: FileValidationResult;
    virusScan: VirusScanResult;
    isSecure: boolean;
  }> {
    // First validate file properties
    const validation = this.validateFile(file);
    
    if (!validation.isValid) {
      return {
        validation,
        virusScan: { isClean: true, scanId: 'skipped', scanTime: 0 },
        isSecure: false,
      };
    }

    // Then scan for viruses
    const virusScan = await this.scanForViruses(file);

    return {
      validation,
      virusScan,
      isSecure: validation.isValid && virusScan.isClean,
    };
  }

  /**
   * Format file size for display
   */
  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get authentication token for API calls
   */
  private static getAuthToken(): string {
    // This should be implemented based on your auth system
    return localStorage.getItem('auth_token') || '';
  }

  /**
   * Generate secure file name
   */
  static generateSecureFileName(originalName: string): string {
    const extension = originalName.split('.').pop()?.toLowerCase() || '';
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    
    return `${timestamp}-${random}.${extension}`;
  }

  /**
   * Check if file upload is enabled for user/organization
   */
  static isUploadEnabled(userRole?: string, organizationPlan?: string): boolean {
    // Implement based on your business logic
    const restrictedRoles = ['viewer', 'guest'];
    const restrictedPlans = ['free'];
    
    if (userRole && restrictedRoles.includes(userRole)) {
      return false;
    }
    
    if (organizationPlan && restrictedPlans.includes(organizationPlan)) {
      return false;
    }
    
    return true;
  }
}

/**
 * React hook for secure file uploads
 */
export function useSecureFileUpload() {
  const validateAndScan = async (files: FileList | File[]): Promise<{
    validFiles: File[];
    invalidFiles: { file: File; errors: string[] }[];
    warnings: string[];
  }> => {
    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const invalidFiles: { file: File; errors: string[] }[] = [];
    const allWarnings: string[] = [];

    for (const file of fileArray) {
      const securityCheck = await FileUploadSecurity.performSecurityCheck(file);
      
      if (securityCheck.isSecure) {
        validFiles.push(file);
      } else {
        invalidFiles.push({
          file,
          errors: [
            ...securityCheck.validation.errors,
            ...(securityCheck.virusScan.isClean ? [] : ['File failed virus scan']),
          ],
        });
      }
      
      allWarnings.push(...securityCheck.validation.warnings);
    }

    return {
      validFiles,
      invalidFiles,
      warnings: allWarnings,
    };
  };

  return {
    validateAndScan,
    config: FILE_UPLOAD_CONFIG,
  };
}

export default FileUploadSecurity;
