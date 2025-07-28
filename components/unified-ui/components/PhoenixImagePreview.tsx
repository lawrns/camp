import React from "react";

interface ImagePreviewProps {
  src: string;
  alt?: string;
  fileName?: string;
  onRemove?: () => void;
}

export function ImagePreview({ src, alt, fileName, onRemove }: ImagePreviewProps) {
  return (
    <div className="phoenix-image-preview">
      <img src={src} alt={alt || fileName || "Preview"} className="phoenix-image-preview-img" />
      {fileName && <div className="phoenix-image-preview-name">{fileName}</div>}
      {onRemove && (
        <button onClick={onRemove} className="phoenix-image-preview-remove" aria-label="Remove image">
          ✕
        </button>
      )}
    </div>
  );
}
