import React, { useRef, useState } from "react";
import { isFeatureEnabled } from "@/lib/features";
import { Button } from "./Button";
import { FileUpload } from "@/components/files/FileUpload";
import { ImagePreview } from "@/components/phoenix-ui/ImagePreview";
import { Input } from "./Input";

interface MessageComposerProps {
  onSend: (message: string, attachment?: File) => void;
  onTyping?: () => void;
  disabled?: boolean;
}

export function MessageComposer({ onSend, onTyping, disabled = false }: MessageComposerProps) {
  const [message, setMessage] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleSend = () => {
    if ((message.trim() || attachment) && !disabled) {
      onSend(message.trim(), attachment || undefined);
      setMessage("");
      setAttachment(null);
      setPreview(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (onTyping) {
      onTyping();
    }
  };

  const handleFileUpload = (file: File) => {
    setAttachment(file);

    // Create preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && isFeatureEnabled("file-uploads")) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={dropRef}
      className={`phoenix-message-composer ${isDragging ? "phoenix-dragging" : ""}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {preview && attachment && (
        <ImagePreview
          src={preview}
          fileName={attachment.name}
          onRemove={() => {
            setAttachment(null);
            setPreview(null);
          }}
        />
      )}
      <div className="phoenix-composer-input-row">
        <Input
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
        />
        {isFeatureEnabled("file-uploads") && <FileUpload onUpload={handleFileUpload} disabled={disabled} />}
        <Button onClick={handleSend} disabled={(!message.trim() && !attachment) || disabled}>
          Send
        </Button>
      </div>
    </div>
  );
}
