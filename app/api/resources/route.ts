import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { CATEGORIES } from "@/lib/resources";

const allSubcategories = Object.values(CATEGORIES).flatMap((c) =>
  Object.keys(c.subcategories)
);

const resourceSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().or(z.literal("")),
  url: z.string().url().optional().or(z.literal("")),
  category: z.enum(["education", "opportunities"]),
  subcategory: z.string().refine((s) => allSubcategories.includes(s)),
  isPublished: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = resourceSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const d = parsed.data;
  const resource = await prisma.resource.create({
    data: {
      title: d.title,
      description: d.description || null,
      url: d.url || null,
      category: d.category,
      subcategory: d.subcategory,
      isPublished: d.isPublished,
    },
  });

  return NextResponse.json({ ok: true, id: resource.id });
}
