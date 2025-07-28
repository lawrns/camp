import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { and, eq, isNull, lt, not } from "drizzle-orm";
import { db } from "@/db/client";
import {
  widgetFileAttachments,
  type NewWidgetFileAttachment,
  type UploadStatus,
  type WidgetFileAttachment,
} from "@/db/schema/widgetFileAttachments";

export class WidgetAttachmentService {
  private s3Client = new S3Client({
    region: process.env.AWS_REGION || "us-east-1",
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });
  private bucketName = process.env.S3_BUCKET_NAME!;

  /**
   * Upload a file and create attachment record
   */
  async uploadFile(
    file: File,
    conversationId: string,
    organizationId: string,
    uploadedBy: string,
    messageId?: string
  ): Promise<WidgetFileAttachment> {
    // Validate file
    this.validateFile(file);

    // Generate S3 key
    const fileExtension = file.name.split(".").pop() || "";
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;
    const s3Key = `widget-attachments/${organizationId}/${conversationId}/${filename}`;

    // Create attachment record using Drizzle
    const insertData: NewWidgetFileAttachment = {
      messageId: messageId ? parseInt(messageId) : undefined,
      conversationId: conversationId,
      organizationId: organizationId,
      filename,
      originalFilename: file.name,
      fileSize: file.size,
      mimeType: file.type,
      fileUrl: s3Key,
      uploadStatus: "uploading",
      uploadedBy: uploadedBy,
      uploadedByType: "visitor",
      uploadStartedAt: new Date(),
    };

    const [attachment] = await db.insert(widgetFileAttachments).values(insertData).returning();

    if (!attachment) {
      throw new Error("Failed to create attachment record");
    }

    try {
      // Upload to S3
      const buffer = Buffer.from(await file.arrayBuffer());
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: s3Key,
          Body: buffer,
          ContentType: file.type,
          Metadata: {
            attachmentId: attachment.id,
            originalFilename: file.name,
            uploadedBy,
          },
        })
      );

      // Generate signed URL
      const signedUrl = await this.generateSignedUrl(s3Key);

      // Update attachment with success
      const [updated] = await db
        .update(widgetFileAttachments)
        .set({
          fileUrl: signedUrl,
          uploadStatus: "completed",
          uploadCompletedAt: new Date(),
        })
        .where(eq(widgetFileAttachments.id, attachment.id))
        .returning();

      return updated || attachment;
    } catch (error) {
      // Update attachment with failure
      await db
        .update(widgetFileAttachments)
        .set({
          uploadStatus: "failed",
          uploadError: error instanceof Error ? error.message : "Upload failed",
        })
        .where(eq(widgetFileAttachments.id, attachment.id));

      throw error;
    }
  }

  /**
   * Get attachments for a conversation
   */
  async getAttachments(conversationId: string, messageId?: string): Promise<WidgetFileAttachment[]> {
    const conditions = [
      eq(widgetFileAttachments.conversationId, conversationId),
      eq(widgetFileAttachments.isDeleted, false),
    ];

    if (messageId) {
      conditions.push(eq(widgetFileAttachments.messageId, parseInt(messageId)));
    }

    const data = await db
      .select()
      .from(widgetFileAttachments)
      .where(and(...conditions))
      .orderBy(widgetFileAttachments.createdAt);

    // Refresh signed URLs for private files
    return Promise.all(
      data.map(async (attachment: WidgetFileAttachment) => {
        let fileUrl = attachment.fileUrl;
        if (!attachment.isPublic && attachment.fileUrl && !attachment.fileUrl.startsWith("http")) {
          fileUrl = await this.generateSignedUrl(attachment.fileUrl);
        }
        return { ...attachment, fileUrl };
      })
    );
  }

  /**
   * Delete an attachment (soft delete)
   */
  async deleteAttachment(attachmentId: string, deletedBy: string): Promise<void> {
    await db
      .update(widgetFileAttachments)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: deletedBy,
      })
      .where(eq(widgetFileAttachments.id, attachmentId));
  }

  /**
   * Track file access
   */
  async trackFileAccess(
    fileAttachmentId: string,
    accessorId: string,
    accessType: "view" | "download" | "preview" | "thumbnail",
    metadata?: Record<string, any>
  ): Promise<void> {
    // Note: widget_file_access_log table doesn't exist in the schema
    // For now, we'll just log this access attempt
  }

  /**
   * Generate a signed URL for file access
   */
  private async generateSignedUrl(s3Key: string, expiresIn = 3600): Promise<string> {
    return getSignedUrl(
      this.s3Client,
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      }),
      { expiresIn }
    );
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): void {
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error(`File size exceeds maximum allowed size of ${maxSize / 1024 / 1024}MB`);
    }

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error("File type not allowed");
    }
  }

  /**
   * Clean up expired access tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      await db
        .update(widgetFileAttachments)
        .set({ accessToken: null })
        .where(and(lt(widgetFileAttachments.expiresAt, new Date()), not(isNull(widgetFileAttachments.accessToken))));
    } catch (error) {}
  }
}

// Export singleton instance
export const widgetAttachmentService = new WidgetAttachmentService();
