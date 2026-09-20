import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, getSubcategoryLabel } from "@/lib/resources";
import { Card } from "@/components/ui";

export const metadata = {
  title: "Resources — Kolo Founders Circle",
};

export default async function ResourcesPage() {
  const resources = await prisma.resource
    .findMany({ where: { isPublished: true }, orderBy: { createdAt: "desc" } })
    .catch(() => []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-extrabold">Resources</h1>
      <p className="text-muted mt-1">
        Curated tools, programs, and opportunities for Kolo — Ukrainian founders and builders in Southern California.
      </p>

      <div className="mt-10 space-y-14">
        {Object.entries(CATEGORIES).map(([catKey, cat]) => {
          const catResources = resources.filter((r) => r.category === catKey);
          return (
            <section key={catKey}>
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-2xl font-bold">{cat.label}</h2>
                <Link
                  href={`/resources/${catKey}`}
                  className="text-sm text-brand hover:underline"
                >
                  See all →
                </Link>
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                {Object.entries(cat.subcategories).map(([subKey, subLabel]) => {
                  const items = catResources.filter((r) => r.subcategory === subKey);
                  return (
                    <div key={subKey}>
                      <Link
                        href={`/resources/${catKey}/${subKey}`}
                        className="inline-flex items-center gap-2 font-semibold mb-3 hover:text-brand"
                      >
                        <span className="h-1 w-4 rounded-full bg-accent" />
                        {subLabel}
                      </Link>
                      {items.length === 0 ? (
                        <p className="text-sm text-muted">Coming soon.</p>
                      ) : (
                        <div className="space-y-2">
                          {items.slice(0, 3).map((r) => (
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
                                <p className="text-sm text-muted mt-1 line-clamp-2">
                                  {r.description}
                                </p>
                              )}
                            </Card>
                          ))}
                          {items.length > 3 && (
                            <Link
                              href={`/resources/${catKey}/${subKey}`}
                              className="text-sm text-brand hover:underline"
                            >
                              +{items.length - 3} more →
                            </Link>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
