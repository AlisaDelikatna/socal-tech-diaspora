import { NextRequest, NextResponse } from "next/server";
import { clearPendingOAuthProfile } from "@/lib/oauth";

// GET — forget the connected LinkedIn/Google profile and show a blank join form.
export async function GET(req: NextRequest) {
  await clearPendingOAuthProfile();
  // On Netlify, req.nextUrl.origin is the internal deploy host, not our domain.
  return NextResponse.redirect(new URL("/join", process.env.NEXTAUTH_URL ?? req.nextUrl.origin));
}
