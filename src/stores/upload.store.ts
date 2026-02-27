"use client";

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { isValidFileSize, isValidFileType } from "@/lib/validations/upload";

export type UploadStatus = "pending" | "uploading" | "done" | "error";

export interface UploadEntry {
  id: string; // Used as filename
  file: File;
  previewUrl: string; // blob URL
  publicUrl: string; // The projected Supabase public URL
  status: UploadStatus;
  error?: string;
}

interface UploadStoreState {
  uploads: Map<string, UploadEntry>;

  // Actions
  stageFiles: (files: File[], bucket: string) => string[]; // returns the projected public URLs
  markUploading: (id: string) => void;
  markDone: (id: string) => void;
  markError: (id: string, error: string) => void;
  removeUpload: (id: string) => void;
  clearByUrls: (urls: string[]) => void;
}

const getSupabasePublicUrl = (bucket: string, filename: string) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  // Ensure no double slashes if NEXT_PUBLIC_SUPABASE_URL has trailing slash
  const baseUrl = supabaseUrl.endsWith("/")
    ? supabaseUrl.slice(0, -1)
    : supabaseUrl;
  return `${baseUrl}/storage/v1/object/public/${bucket}/${filename}`;
};

export const useUploadStore = create<UploadStoreState>()(
  devtools(
    (set, get) => ({
      uploads: new Map(),

      stageFiles: (files, bucket) => {
        console.log(`[UploadStore] stageFiles() initiated. Files count:`, files.length, { bucket });
        const publicUrls: string[] = [];
        const newUploads = new Map(get().uploads);
        // let hasErrors = false;

        for (const file of files) {
          if (!isValidFileType(file.type)) {
            console.error(`Invalid file type: ${file.type}`);
            // hasErrors = true;
            continue;
          }

          if (!isValidFileSize(file.size)) {
            console.error(`File too large: ${file.name}`);
            // hasErrors = true;
            continue;
          }

          // Generate file extension and unique ID
          const ext = file.name.split(".").pop() || "bin";
          const id = `${crypto.randomUUID()}.${ext}`;
          const publicUrl = getSupabasePublicUrl(bucket, id);
          const previewUrl = URL.createObjectURL(file);

          newUploads.set(id, {
            id,
            file,
            previewUrl,
            publicUrl,
            status: "pending",
          });

          publicUrls.push(publicUrl);
        }

        if (publicUrls.length > 0) {
          console.log(`[UploadStore] stageFiles() Success. Staged ${publicUrls.length} files for upload.`);
          set({ uploads: newUploads });
        }

        return publicUrls;
      },

      markUploading: (id) => {
        console.log(`[UploadStore] markUploading() invoked for ID: ${id}`);
        set((state) => {
          const newUploads = new Map(state.uploads);
          const entry = newUploads.get(id);
          if (entry) {
            newUploads.set(id, {
              ...entry,
              status: "uploading",
              error: undefined,
            });
          }
          return { uploads: newUploads };
        });
      },

      markDone: (id) => {
        console.log(`[UploadStore] markDone() invoked for ID: ${id}`);
        set((state) => {
          const newUploads = new Map(state.uploads);
          const entry = newUploads.get(id);
          if (entry) {
            newUploads.set(id, { ...entry, status: "done" });
          }
          return { uploads: newUploads };
        });
      },

      markError: (id, error) => {
        console.error(`[UploadStore] markError() FAILED for ID: ${id}. Error:`, error);
        set((state) => {
          const newUploads = new Map(state.uploads);
          const entry = newUploads.get(id);
          if (entry) {
            newUploads.set(id, { ...entry, status: "error", error });
          }
          return { uploads: newUploads };
        });
      },

      removeUpload: (id) => {
        console.log(`[UploadStore] removeUpload() invoked for ID: ${id}`);
        set((state) => {
          const newUploads = new Map(state.uploads);
          const entry = newUploads.get(id);
          if (entry?.previewUrl) {
            URL.revokeObjectURL(entry.previewUrl);
          }
          newUploads.delete(id);
          return { uploads: newUploads };
        });
      },

      clearByUrls: (urls) => {
        console.log(`[UploadStore] clearByUrls() invoked. URLs count:`, urls.length);
        set((state) => {
          const newUploads = new Map(state.uploads);
          for (const [id, entry] of Array.from(newUploads.entries())) {
            if (urls.includes(entry.publicUrl)) {
              if (entry.previewUrl) {
                URL.revokeObjectURL(entry.previewUrl);
              }
              newUploads.delete(id);
            }
          }
          return { uploads: newUploads };
        });
      },
    }),
    { name: "upload-store", enabled: process.env.NODE_ENV === "development" },
  ),
);
