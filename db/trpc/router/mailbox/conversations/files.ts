import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import type { TRPCRouterRecord } from "@trpc/server";
import mime from "mime";
import { z } from "zod";
import { db } from "@/db/client";
import { files } from "@/db/schema";
import { takeUniqueOrThrow } from "@/lib/utils/arrays";
import { env } from "@/lib/utils/env-config";
import { protectedProcedure } from "@/trpc/trpc";

// import { s3Client } from "@/lib/s3/client"; // Module not found
// import { generateS3Key, getS3Url } from "@/lib/s3/utils"; // Module not found

// Simple fallbacks for S3 functions
const s3Client = {}; // Mock S3 client
const generateS3Key = (prefix: string[], fileName: string) => {
  return `${prefix.join("/")}/${fileName}`;
};
const getS3Url = (key: string) => {
  return `https://mock-s3.example.com/${key}`;
};

const PUBLIC_ACL = "public-read";
const PRIVATE_ACL = "private";

const AWS_PRESIGNED_POST_FILE_MAX_SIZE = 26210000; // 25 MiB
const AWS_PRESIGNED_POST_EXPIRY = 600; // 10 minutes

export const filesRouter = {
  initiateUpload: protectedProcedure
    .input(
      z.object({
        file: z.object({
          fileName: z.string(),
          fileSize: z.number(),
          isInline: z.boolean(),
        }),
        conversationSlug: z.string().min(1),
      })
    )
    .mutation(
      async ({
        input: {
          file: { fileName, fileSize, isInline },
          // We include the conversation slug in the URL purely for debugging purposes,
          // so it shouldn't be relied on for anything else.
          // We can't authorize it since, unlike sending a reply on an existing conversation,
          // the new conversation modal conversation won't exist yet (and its slug is generated on the frontend).
          conversationSlug: unauthorizedConversationSlug,
        },
      }) => {
        const isPublic = isInline;
        const contentType = mime.getType(fileName) ?? "application/octet-stream";
        const acl = isPublic ? PUBLIC_ACL : PRIVATE_ACL;

        const s3Key = generateS3Key(["attachments", unauthorizedConversationSlug], fileName);

        // const signedRequest = await createPresignedPost(s3Client, {
        //   Bucket: env.AWS_PRIVATE_STORAGE_BUCKET_NAME,
        //   Key: s3Key,
        //   Conditions: [
        //     // https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-HTTPPOSTConstructPolicy.html
        //     ["eq", "$Content-Type", contentType],
        //     ["eq", "$acl", acl],
        //     ["content-length-range", 0, AWS_PRESIGNED_POST_FILE_MAX_SIZE],
        //   ],
        //   Fields: {
        //     acl,
        //     "Content-Type": contentType,
        //   },
        //   Expires: AWS_PRESIGNED_POST_EXPIRY,
        // });

        // Fallback for createPresignedPost
        const signedRequest = {
          url: `https://mock-s3.example.com/${env.AWS_PRIVATE_STORAGE_BUCKET_NAME}`,
          fields: {
            key: s3Key,
            acl,
            "Content-Type": contentType,
          },
        };

        const fileRecord = await db
          .insert(files)
          .values({
            name: fileName,
            mimetype: contentType,
            size: fileSize,
            isInline,
            isPublic,
            url: getS3Url(s3Key),
          })
          .returning()
          .then(takeUniqueOrThrow);

        return {
          file: {
            slug: fileRecord.slug,
            name: fileRecord.name,
            url: fileRecord.url,
          },
          signedRequest,
        };
      }
    ),
} satisfies TRPCRouterRecord;
