import { NextRequest, NextResponse } from "next/server";
import { clearPendingOAuthProfile } from "@/lib/oauth";

// GET — forget the connected LinkedIn/Google profile and show a blank join form.
export async function GET(req: NextRequest) {
  await clearPendingOAuthProfile();
  return NextResponse.redirect(new URL("/join", req.nextUrl.origin));
}
