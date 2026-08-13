import { NextRequest, NextResponse } from "next/server";
import { decode } from "next-auth/jwt";

export async function GET(req: NextRequest) {
  const allCookies = req.cookies.getAll();
  const cookieNames = allCookies.map((c) => c.name);

  const secureName = "__Secure-authjs.session-token";
  const plainName = "authjs.session-token";

  const secureVal = req.cookies.get(secureName)?.value;
  const plainVal = req.cookies.get(plainName)?.value;

  let secureDecoded: unknown = null;
  let plainDecoded: unknown = null;
  let secureError: string | null = null;
  let plainError: string | null = null;

  if (secureVal) {
    try {
      secureDecoded = await decode({
        token: secureVal,
        secret: process.env.AUTH_SECRET!,
        salt: secureName,
      });
    } catch (e) {
      secureError = String(e);
    }
  }

  if (plainVal) {
    try {
      plainDecoded = await decode({
        token: plainVal,
        secret: process.env.AUTH_SECRET!,
        salt: plainName,
      });
    } catch (e) {
      plainError = String(e);
    }
  }

  return NextResponse.json({
    protocol: req.nextUrl.protocol,
    host: req.headers.get("host"),
    forwardedProto: req.headers.get("x-forwarded-proto"),
    cookieNames,
    hasSecureCookie: !!secureVal,
    hasPlainCookie: !!plainVal,
    secureDecoded,
    secureError,
    plainDecoded,
    plainError,
    authSecretSet: !!process.env.AUTH_SECRET,
    authSecretLength: process.env.AUTH_SECRET?.length ?? 0,
  });
}
