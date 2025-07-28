// File handling utilities for inbox dashboard

import { supabase } from "@/lib/supabase";
import type { FileAttachment } from "../types";
import { validateFile } from "./channelUtils";

/**
 * Upload file to Supabase Storage
 * @param file - File to upload
 * @param organizationId - Organization ID for file path
 * @returns Promise<string | null> - File path or null if failed
 */
export const uploadFile = async (file: File, organizationId?: string): Promise<string | null> => {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `attachments/${organizationId}/${fileName}`;

    const client = supabase.browser();
    const { data, error } = await client.storage.from("files").upload(filePath, file);

    if (error) {

      return null;
    }

    return filePath;
  } catch (error) {

    return null;
  }
};

/**
 * Process files from file input or drag-drop
 * @param files - Array of files to process
 * @param organizationId - Organization ID
 * @param setAttachments - State setter for attachments
 * @param uploadFileFunc - Upload function (for dependency injection)
 */
export const processFiles = async (
  files: File[],
  organizationId: string | undefined,
  setAttachments: React.Dispatch<React.SetStateAction<FileAttachment[]>>,
  uploadFileFunc: (file: File) => Promise<string | null> = (file) => uploadFile(file, organizationId)
) => {
  for (const file of files) {
    // Validate file first
    const validation = validateFile(file);
    if (!validation.valid) {
      alert(`Error with file "${file.name}": ${validation.error}`);
      continue;
    }

    const attachment: FileAttachment = {
      id: Date.now().toString() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      uploadStatus: "uploading",
    };

    // Add to attachments immediately for UI feedback
    setAttachments((prev) => [...prev, attachment]);

    // Generate preview for images
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachments((prev) =>
          prev.map((att) => (att.id === attachment.id ? { ...att, preview: e.target?.result as string } : att))
        );
      };
      reader.readAsDataURL(file);
    }

    // Upload file in background
    try {
      const uploadPath = await uploadFileFunc(file);
      if (uploadPath) {
        setAttachments((prev) =>
          prev.map((att) => (att.id === attachment.id ? { ...att, url: uploadPath, uploadStatus: "success" } : att))
        );
      } else {
        setAttachments((prev) =>
          prev.map((att) => (att.id === attachment.id ? { ...att, uploadStatus: "error" } : att))
        );
      }
    } catch (error) {

      setAttachments((prev) => prev.map((att) => (att.id === attachment.id ? { ...att, uploadStatus: "error" } : att)));
    }
  }
};

/**
 * Handle file drop event
 * @param e - Drag event
 * @param organizationId - Organization ID
 * @param setAttachments - State setter for attachments
 * @param setIsDragOver - State setter for drag over state
 */
export const handleFileDrop = async (
  e: React.DragEvent,
  organizationId: string | undefined,
  setAttachments: React.Dispatch<React.SetStateAction<FileAttachment[]>>,
  setIsDragOver: (isDragOver: boolean) => void
) => {
  e.preventDefault();
  setIsDragOver(false);

  const files = Array.from(e.dataTransfer.files) as File[];
  await processFiles(files, organizationId, setAttachments);
};

/**
 * Handle file input change event
 * @param e - Input change event
 * @param organizationId - Organization ID
 * @param setAttachments - State setter for attachments
 */
export const handleFileInput = async (
  e: React.ChangeEvent<HTMLInputElement>,
  organizationId: string | undefined,
  setAttachments: React.Dispatch<React.SetStateAction<FileAttachment[]>>
) => {
  const files = Array.from(e.target.files || []) as File[];
  await processFiles(files, organizationId, setAttachments);

  // Reset input value to allow selecting the same file again
  e.target.value = "";
};

/**
 * Remove attachment from list
 * @param attachmentId - ID of attachment to remove
 * @param setAttachments - State setter for attachments
 */
export const removeAttachment = (
  attachmentId: string,
  setAttachments: React.Dispatch<React.SetStateAction<FileAttachment[]>>
) => {
  setAttachments((prev) => prev.filter((att) => att.id !== attachmentId));
};

/**
 * Retry failed upload
 * @param attachment - Attachment to retry
 * @param organizationId - Organization ID
 * @param setAttachments - State setter for attachments
 */
export const retryUpload = async (
  attachment: FileAttachment,
  organizationId: string | undefined,
  setAttachments: React.Dispatch<React.SetStateAction<FileAttachment[]>>
) => {
  // Mark as uploading
  setAttachments((prev) => prev.map((att) => (att.id === attachment.id ? { ...att, uploadStatus: "uploading" } : att)));

  // Note: This would need the original File object to retry
  // In a real implementation, you'd store the File object or implement retry differently

};
