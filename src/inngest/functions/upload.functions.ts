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

    // fileBuffer is passed as base64 string
    await step.run("upload-to-supabase", async () => {
      const buffer = Buffer.from(fileBuffer, "base64");

      const { error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(filename, buffer, {
          contentType,
          upsert: true,
        });

      if (error) {
        throw new Error(`Failed to upload ${filename}: ${error.message}`);
      }

      return { bucket, filename, uploaded: true };
    });
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
      const paths = urls.map((url: string) => {
        // Assume format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
        const urlObj = new URL(url);
        const pathSegments = urlObj.pathname.split(`/public/${bucket}/`);
        if (pathSegments.length > 1) {
          return pathSegments[1];
        }
        return url; // Fallback, though likely to fail in Supabase if not a valid path
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
