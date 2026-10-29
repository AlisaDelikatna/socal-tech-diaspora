import { createClient } from "@supabase/supabase-js";

// Server-only client for storage writes. The service role key bypasses
// row-level security, so only use it after our own auth checks.
// Created on demand so a missing env var can't break the build.
export function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
