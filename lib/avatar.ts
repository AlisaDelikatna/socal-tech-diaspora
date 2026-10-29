import { supabaseAdmin } from "@/lib/supabase";

const BUCKET = "avatars";
const MAX_BYTES = 5 * 1024 * 1024;

// Copy a remote profile photo (LinkedIn/Google) into our avatars bucket.
// Provider photo URLs expire, so we never store them directly.
// Returns the public URL, or null if anything goes wrong.
export async function storeAvatarFromUrl(
  userId: string,
  url: string
): Promise<string | null> {
  try {
    const res = await fetch(url);
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !type.startsWith("image/")) return null;
    const bytes = await res.arrayBuffer();
    if (bytes.byteLength > MAX_BYTES) return null;

    const supabase = supabaseAdmin();
    const ext = type.split("/")[1]?.split(";")[0] || "jpg";
    const path = `${userId}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, { upsert: true, contentType: type });
    if (error) {
      console.error("[avatar] Supabase storage error:", error);
      return null;
    }
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    // Cache-bust so a replaced photo shows up immediately.
    return `${data.publicUrl}?v=${Date.now()}`;
  } catch (err) {
    console.error("[avatar] import failed:", err);
    return null;
  }
}
