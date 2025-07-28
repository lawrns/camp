import React, { useRef, useState } from "react";
import { Button } from "./Button";

interface FileUploadProps {
  onUpload: (file: File) => void;
  disabled?: boolean;
  maxSizeMB?: number;
}

export function FileUpload({ onUpload, disabled = false, maxSizeMB = 5 }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`File too large. Max ${maxSizeMB}MB allowed.`);
      return;
    }

    setError(null);
    onUpload(file);

    // Reset input
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="phoenix-file-upload">
      <input
        ref={inputRef}
        type="file"
        onChange={handleFileSelect}
        accept="image/*,.pdf,.doc,.docx,.txt"
        disabled={disabled}
        className="phoenix-file-input"
      />
      <Button onClick={() => inputRef.current?.click()} disabled={disabled} variant="secondary">
        📎 Attach
      </Button>
      {error && <div className="phoenix-file-error">{error}</div>}
    </div>
  );
}
