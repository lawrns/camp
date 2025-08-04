import { FileUploadSecurity, FILE_UPLOAD_CONFIG } from '../fileUploadSecurity';

describe('FileUploadSecurity', () => {
  describe('validateFile', () => {
    it('accepts valid PDF files', () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
      const result = FileUploadSecurity.validateFile(file);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('accepts valid image files', () => {
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      const result = FileUploadSecurity.validateFile(file);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('rejects files that are too large', () => {
      const largeContent = 'x'.repeat(26 * 1024 * 1024); // 26MB
      const file = new File([largeContent], 'large.pdf', { type: 'application/pdf' });
      const result = FileUploadSecurity.validateFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('exceeds maximum allowed size'))).toBe(true);
    });

    it('rejects disallowed file types', () => {
      const file = new File(['test content'], 'test.exe', { type: 'application/x-executable' });
      const result = FileUploadSecurity.validateFile(file);

      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('not allowed'))).toBe(true);
    });

    it('warns about extension mismatch', () => {
      const file = new File(['test content'], 'test.pdf', { type: 'image/jpeg' });
      const result = FileUploadSecurity.validateFile(file);

      expect(result.warnings.some(w => w.includes("doesn't match MIME type"))).toBe(true);
    });

    it('warns about suspicious file names', () => {
      const file = new File(['test content'], 'malicious.exe', { type: 'application/pdf' });
      const result = FileUploadSecurity.validateFile(file);

      expect(result.warnings.some(w => w.includes('Suspicious file name'))).toBe(true);
    });

    it('rejects empty files', () => {
      const file = new File([], 'empty.pdf', { type: 'application/pdf' });
      const result = FileUploadSecurity.validateFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('File is empty');
    });
  });

  describe('generateSecureFileName', () => {
    it('generates secure file names with timestamp and random string', () => {
      const originalName = 'test document.pdf';
      const secureFileName = FileUploadSecurity.generateSecureFileName(originalName);
      
      expect(secureFileName).toMatch(/^\d+-[a-z0-9]+\.pdf$/);
      expect(secureFileName).not.toContain(' ');
      expect(secureFileName).not.toContain('test');
    });

    it('preserves file extension', () => {
      const originalName = 'document.docx';
      const secureFileName = FileUploadSecurity.generateSecureFileName(originalName);

      expect(secureFileName.endsWith('.docx')).toBe(true);
    });
  });

  describe('isUploadEnabled', () => {
    it('allows uploads for normal users', () => {
      const result = FileUploadSecurity.isUploadEnabled('user', 'pro');
      expect(result).toBe(true);
    });

    it('restricts uploads for viewer role', () => {
      const result = FileUploadSecurity.isUploadEnabled('viewer', 'pro');
      expect(result).toBe(false);
    });

    it('restricts uploads for free plan', () => {
      const result = FileUploadSecurity.isUploadEnabled('user', 'free');
      expect(result).toBe(false);
    });
  });

  describe('FILE_UPLOAD_CONFIG', () => {
    it('has correct file size limit', () => {
      expect(FILE_UPLOAD_CONFIG.maxFileSizeMB).toBe(25);
      expect(FILE_UPLOAD_CONFIG.maxFileSizeBytes).toBe(25 * 1024 * 1024);
    });

    it('includes expected MIME types', () => {
      expect(FILE_UPLOAD_CONFIG.allowedMimeTypes).toContain('image/*');
      expect(FILE_UPLOAD_CONFIG.allowedMimeTypes).toContain('application/pdf');
      expect(FILE_UPLOAD_CONFIG.allowedMimeTypes).toContain('text/plain');
    });

    it('has virus scan endpoint configured', () => {
      expect(FILE_UPLOAD_CONFIG.virusScanEndpoint).toBe('/api/scan');
    });
  });

  describe('performSecurityCheck', () => {
    it('performs complete security validation', async () => {
      const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

      // Mock fetch for virus scanning
      global.fetch = jest.fn().mockRejectedValue(new Error('Scan endpoint not available'));

      const result = await FileUploadSecurity.performSecurityCheck(file);

      expect(result.validation.isValid).toBe(true);
      expect(result.virusScan.isClean).toBe(true); // Should fail open
    });

    it('fails security check for invalid files', async () => {
      const file = new File(['test content'], 'test.exe', { type: 'application/x-executable' });

      const result = await FileUploadSecurity.performSecurityCheck(file);

      expect(result.isSecure).toBe(false);
      expect(result.validation.isValid).toBe(false);
    });
  });
});
