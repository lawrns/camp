import { supabase } from "./phoenix-auth";

export const storage = {
  uploadFile: async (file: File, conversationId: string, onProgress?: (progress: number) => void) => {
    // Simulate progress for now (no real progress API in Supabase)
    onProgress?.(10);

    const fileName = `${conversationId}/${Date.now()}-${file.name}`;
    const bucketName = "message-attachments";

    onProgress?.(50);

    const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

    onProgress?.(90);

    if (error) {
      return { error };
    }

    // Get public URL
    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);

    onProgress?.(100);

    return {
      data: {
        url: urlData.publicUrl,
        name: file.name,
        type: file.type,
        size: file.size,
      },
    };
  },

  createBucketIfNotExists: async () => {
    const { data: buckets } = await supabase.storage.listBuckets();

    if (!buckets?.find((b: any) => b.name === "message-attachments")) {
      await supabase.storage.createBucket("message-attachments", {
        public: true,
        fileSizeLimit: 5242880, // 5MB
      });
    }
  },
};
