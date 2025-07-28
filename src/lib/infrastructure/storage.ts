/**
 * Storage Infrastructure
 * Handles file storage operations using Supabase Storage
 */

import { supabase } from "@/lib/supabase";

export interface StorageFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  url?: string;
}

export class StorageService {
  private supabase = supabase.browser();
  private bucket = "campfire-uploads";

  async uploadFile(
    file: File,
    path: string,
    options?: { upsert?: boolean; contentType?: string }
  ): Promise<{ url: string; path: string } | null> {
    const { data, error } = await this.supabase.storage.from(this.bucket).upload(path, file, {
      upsert: options?.upsert ?? false,
      contentType: options?.contentType ?? file.type,
    });

    if (error) {
      return null;
    }

    const {
      data: { publicUrl },
    } = this.supabase.storage.from(this.bucket).getPublicUrl(data.path);

    return {
      url: publicUrl,
      path: data.path,
    };
  }

  async deleteFile(path: string): Promise<boolean> {
    const { error } = await this.supabase.storage.from(this.bucket).remove([path]);

    if (error) {
      return false;
    }

    return true;
  }

  async listFiles(prefix: string): Promise<StorageFile[]> {
    const { data, error } = await this.supabase.storage.from(this.bucket).list(prefix);

    if (error || !data) {
      return [];
    }

    return data.map((file: any) => ({
      name: file.name,
      size: file.metadata?.size || 0,
      type: file.metadata?.mimetype || "unknown",
      lastModified: new Date(file.updated_at || file.created_at).getTime(),
    }));
  }

  getPublicUrl(path: string): string {
    const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(path);

    return data.publicUrl;
  }
}

export const storageService = new StorageService();
