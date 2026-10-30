import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { CATEGORIES, getCategoryLabel, getSubcategoryLabel } from "@/lib/resources";
import { formatEventDate } from "@/lib/time";
import { auth } from "@/auth";
import { Card } from "@/components/ui";
import SpeakerInquiryForm from "./SpeakerInquiryForm";
import SpeakerApply from "./SpeakerApply";

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

  // Speaker slots at upcoming events: members apply or recommend someone
  // here, and can pitch a talk of their own below.
  const isSpeaking = subcategory === "speaking";
  const session = isSpeaking ? await auth() : null;
  const userId = session?.user?.id;
  const speakerSlots = isSpeaking
    ? await prisma.speakerOpportunity
        .findMany({
          where: { status: "open", event: { dateTime: { gte: new Date() } } },
          orderBy: { event: { dateTime: "asc" } },
          include: {
            event: { select: { id: true, title: true, dateTime: true } },
            applications: {
              where: { submittedByUserId: userId ?? "" },
              select: { candidateName: true, isSelf: true },
            },
          },
        })
        .catch(() => [])
    : [];

  const myInquiries = userId
    ? await prisma.speakerInquiry
        .findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: { id: true, topic: true, createdAt: true },
        })
        .catch(() => [])
    : [];

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

      {speakerSlots.length > 0 && (
        <div className="mt-8 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Speak at a Kolo event
          </h2>
          {speakerSlots.map((s) => (
            <Card
              key={s.id}
              id={`speak-${s.id}`}
              className="p-5 border-brand/30 bg-brand/5 scroll-mt-24"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-accent">
                {formatEventDate(s.event.dateTime, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}{" "}
                ·{" "}
                <Link href={`/events/${s.event.id}`} className="hover:underline">
                  {s.event.title}
                </Link>
              </div>
              <h3 className="mt-1 font-semibold text-lg">{s.topic}</h3>
              <p className="text-sm text-muted mt-2 whitespace-pre-line">{s.description}</p>
              <div className="mt-4">
                {userId ? (
                  <>
                    {s.applications.length > 0 && (
                      <p className="mb-3 text-sm text-muted">
                        You submitted:{" "}
                        {s.applications
                          .map((a) => (a.isSelf ? "yourself" : a.candidateName))
                          .join(", ")}
                        . You can recommend someone else too.
                      </p>
                    )}
                    <SpeakerApply opportunityId={s.id} />
                  </>
                ) : (
                  <Link
                    href={`/login?callbackUrl=/resources/${category}/${subcategory}%23speak-${s.id}`}
                    className="text-sm font-medium text-brand hover:underline"
                  >
                    Members: log in to apply or recommend a speaker
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {isSpeaking && (
        <Card className="mt-8 p-5">
          <h2 className="font-semibold text-lg">Have a talk to share?</h2>
          <p className="text-sm text-muted mt-1 mb-4">
            Pitch a topic for an upcoming Kolo event, even if there&apos;s no open
            slot for it yet. Add a link to a video or demo if you have one.
          </p>
          {userId ? (
            <>
              {myInquiries.length > 0 && (
                <p className="mb-3 text-sm text-muted">
                  You&apos;ve pitched:{" "}
                  {myInquiries
                    .map(
                      (i) =>
                        `"${i.topic}" (${formatEventDate(i.createdAt, { month: "short", day: "numeric" })})`
                    )
                    .join(", ")}
                  .
                </p>
              )}
              <SpeakerInquiryForm />
            </>
          ) : (
            <Link
              href={`/login?callbackUrl=/resources/${category}/${subcategory}`}
              className="text-sm font-medium text-brand hover:underline"
            >
              Members: log in to pitch a talk
            </Link>
          )}
        </Card>
      )}

      <div className="mt-8">
        {resources.length === 0 && (speakerSlots.length > 0 || isSpeaking) ? null : resources.length === 0 ? (
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
