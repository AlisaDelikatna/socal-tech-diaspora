import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, getCategoryLabel, getSubcategoryLabel } from "@/lib/resources";
import { Card } from "@/components/ui";

export default async function SubcategoryPage({
  params,
}: PageProps<"/resources/[category]/[subcategory]">) {
  const { category, subcategory } = await params;

  const cat = CATEGORIES[category as keyof typeof CATEGORIES];
  if (!cat || !(cat.subcategories as Record<string, string>)[subcategory]) notFound();

  const resources = await prisma.resource
    .findMany({
      where: { category, subcategory, isPublished: true },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);

  const subLabel = (cat.subcategories as Record<string, string>)[subcategory];

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <div className="flex items-center gap-2 text-sm text-muted">
        <Link href="/resources" className="hover:text-brand">Resources</Link>
        <span>/</span>
        <Link href={`/resources/${category}`} className="hover:text-brand">{cat.label}</Link>
        <span>/</span>
        <span className="text-foreground">{subLabel}</span>
      </div>

      <h1 className="mt-4 text-3xl font-extrabold">{subLabel}</h1>

      <div className="mt-8">
        {resources.length === 0 ? (
          <div className="rounded-xl border border-border bg-surface p-10 text-center text-muted">
            Nothing here yet — check back soon.
          </div>
        ) : (
          <div className="space-y-3">
            {resources.map((r) => (
              <Card key={r.id} className="p-5">
                <a
                  href={r.url ?? "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold hover:text-brand"
                >
                  {r.title} ↗
                </a>
                {r.description && (
                  <p className="text-sm text-muted mt-2">{r.description}</p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
