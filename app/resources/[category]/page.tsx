import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, getCategoryLabel, getSubcategoryLabel } from "@/lib/resources";
import { Card } from "@/components/ui";

export default async function CategoryPage({
  params,
}: PageProps<"/resources/[category]">) {
  const { category } = await params;
  if (!CATEGORIES[category as keyof typeof CATEGORIES]) notFound();

  const resources = await prisma.resource
    .findMany({
      where: { category, isPublished: true },
      orderBy: { createdAt: "desc" },
    })
    .catch(() => []);

  const cat = CATEGORIES[category as keyof typeof CATEGORIES];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Link href="/resources" className="text-sm text-brand hover:underline">
        ← Resources
      </Link>
      <h1 className="mt-4 text-3xl font-extrabold">{cat.label}</h1>

      <div className="mt-10 space-y-10">
        {Object.entries(cat.subcategories).map(([subKey, subLabel]) => {
          const items = resources.filter((r) => r.subcategory === subKey);
          return (
            <section key={subKey}>
              <Link
                href={`/resources/${category}/${subKey}`}
                className="inline-flex items-center gap-2 text-xl font-bold mb-4 hover:text-brand"
              >
                <span className="h-1 w-5 rounded-full bg-accent" />
                {subLabel}
              </Link>
              {items.length === 0 ? (
                <p className="text-sm text-muted">Nothing here yet — check back soon.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {items.map((r) => (
                    <Card key={r.id} className="p-4">
                      <a
                        href={r.url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:text-brand"
                      >
                        {r.title}
                      </a>
                      {r.description && (
                        <p className="text-sm text-muted mt-1">{r.description}</p>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
