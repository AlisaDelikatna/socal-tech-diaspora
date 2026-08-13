import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { profileUpdateSchema } from "@/lib/validations";

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);

  // Normalize tags: accept a comma-separated string or an array.
  if (typeof json?.tags === "string") {
    json.tags = json.tags
      .split(",")
      .map((t: string) => t.trim())
      .filter(Boolean);
  }

  const parsed = profileUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const d = parsed.data;
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: d.name,
      title: d.title,
      company: d.company || null,
      pronouns: d.pronouns || null,
      bio: d.bio || null,
      linkedinUrl: d.linkedinUrl,
      whatINeed: d.whatINeed,
      howICanHelp: d.howICanHelp,
      photoUrl: d.photoUrl || null,
      tags: d.tags,
    },
  });

  return NextResponse.json({ ok: true });
}
