import sharp from "sharp";
import { inngest } from "@/inngest/client";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const handleFileUpload = inngest.createFunction(
  { id: "handle-file-upload", name: "Handle File Upload" },
  { event: "storage/file.upload.v1" },
  async ({ event, step }) => {
    const { bucket, filename, fileBuffer, contentType } = event.data;

    // Check if bucket exists, create if missing
    await step.run("ensure-bucket-exists", async () => {
      const { data: buckets, error: listError } =
        await supabaseAdmin.storage.listBuckets();
      if (listError)
        throw new Error(`Failed to list buckets: ${listError.message}`);

      const bucketExists = buckets.some((b) => b.name === bucket);
      if (!bucketExists) {
        const { error: createError } = await supabaseAdmin.storage.createBucket(
          bucket,
          {
            public: true,
          },
        );
        if (createError)
          throw new Error(
            `Failed to create bucket ${bucket}: ${createError.message}`,
          );
      }
    });

    const buffer = Buffer.from(fileBuffer, "base64");

    // Only process with sharp if it's an image
    const isImage = contentType?.startsWith("image/");

    // Process main image
    const mainBuffer = await step.run("process-main-image", async () => {
      if (!isImage) return buffer;

      return sharp(buffer)
        .resize(1920, 1920, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    });

    const finalContentType = isImage ? "image/webp" : contentType;

    const mainUploadOptions = {
      contentType: finalContentType,
      upsert: true,
      cacheControl: "31536000",
    };

    // upload main image
    await step.run("upload-main-to-supabase", async () => {
      const { error } = await supabaseAdmin.storage
        .from(bucket)
        // @ts-expect-error - Supabase JS types expect File/Blob but Buffer works in Node
        .upload(filename, mainBuffer, mainUploadOptions);

      if (error) {
        throw new Error(`Failed to upload ${filename}: ${error.message}`);
      }
      return { bucket, filename, uploaded: true };
    });

    // Generate and upload blur placeholder if it's an image
    if (isImage) {
      const blurBuffer = await step.run("process-blur-image", async () => {
        return sharp(buffer)
          .resize(10, 10, { fit: "inside" })
          .blur(10)
          .webp({ quality: 20 })
          .toBuffer();
      });

      await step.run("upload-blur-to-supabase", async () => {
        const { error } = await supabaseAdmin.storage
          .from(bucket)
          // @ts-expect-error - Supabase JS types expect File/Blob but Buffer works in Node
          .upload(`${filename}-blurpic`, blurBuffer, mainUploadOptions);

        if (error) {
          // Non-fatal, just log it. The main image is uploaded successfully.
          console.error(
            `Failed to upload blur for ${filename}: ${error.message}`,
          );
        }
        return { bucket, filename: `${filename}-blurpic`, uploaded: true };
      });
    }

    return { bucket, filename, processed: true };
  },
);

export const handleFileDelete = inngest.createFunction(
  { id: "handle-file-delete", name: "Handle File Delete" },
  { event: "storage/file.delete.v1" },
  async ({ event, step }) => {
    const { bucket, urls } = event.data;

    if (!urls || urls.length === 0) return { skipped: true };

    await step.run("delete-from-supabase", async () => {
      // Extract paths from the full public URLs
      const paths = urls.flatMap((url: string) => {
        // Assume format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
        const urlObj = new URL(url);
        const pathSegments = urlObj.pathname.split(`/public/${bucket}/`);
        if (pathSegments.length > 1) {
          const path = pathSegments[1];
          // Delete both the image and its potential blur counterpart
          return [path, `${path}-blurpic`];
        }
        return [url]; // Fallback
      });

      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .remove(paths);

      if (error) {
        throw new Error(`Failed to delete files: ${error.message}`);
      }

      return { bucket, deletedPaths: paths, data };
    });
  },
);

export const uploadFunctions = [handleFileUpload, handleFileDelete];
