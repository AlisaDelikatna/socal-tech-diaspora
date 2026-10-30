import { supabaseAdmin } from "@/lib/supabase";

export const PHOTO_BUCKET = "event-photos";

// Netlify functions accept request bodies up to about 6 MB.
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const IMAGE_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Checks an uploaded image; returns an error message, or null if it's fine. */
export function checkImage(file: File | null): string | null {
  if (!file) return "No file provided";
  if (!IMAGE_TYPES.includes(file.type)) return "Only JPEG, PNG, or WebP images are allowed.";
  if (file.size > MAX_IMAGE_BYTES) return "The image must be under 5 MB. Try exporting it as a JPEG.";
  return null;
}

/**
 * Uploads a file to a public bucket, creating the bucket the first time.
 * Returns the public URL, or null if the upload failed.
 */
export async function uploadPublic(bucket: string, path: string, file: File): Promise<string | null> {
  const supabase = supabaseAdmin();
  const upload = () =>
    supabase.storage.from(bucket).upload(path, file, { contentType: file.type });

  let { error } = await upload();
  if (error && /bucket not found/i.test(error.message)) {
    await supabase.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: MAX_IMAGE_BYTES,
      allowedMimeTypes: IMAGE_TYPES,
    });
    ({ error } = await upload());
  }
  if (error) {
    console.error(`[storage] upload to ${bucket} failed:`, error);
    return null;
  }
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** Deletes files from a bucket; failures are logged, not thrown. */
export async function removeFiles(bucket: string, paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  const { error } = await supabaseAdmin().storage.from(bucket).remove(paths);
  if (error) console.error(`[storage] delete from ${bucket} failed:`, error);
}
