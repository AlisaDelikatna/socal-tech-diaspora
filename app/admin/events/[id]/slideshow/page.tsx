import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkInPath } from "@/lib/checkin";
import { SPEAKING_PATH } from "@/lib/resources";
import { MISSION } from "@/lib/site";
import { formatEventDate, formatEventTimeRange } from "@/lib/time";
import Slideshow, { type Presenter } from "./Slideshow";

export const metadata = {
  title: "Slideshow — Kolo Founders Circle",
  robots: { index: false },
};

// Used when an event has no discussion questions of its own.
const DEFAULT_QUESTIONS = [
  "What's the next step you're stuck on?",
  "What do you wish you'd known before you started?",
  "Who in this room could help you this month?",
];

// "6:00 - 7:00 PM - Networking" lines in the description become the agenda.
const AGENDA_LINE =
  /^\s*(\d{1,2}(?::\d{2})?\s*(?:AM|PM)?\s*[-–]\s*\d{1,2}(?::\d{2})?\s*(?:AM|PM)?)\s*[-–:]\s*(.+)$/i;

function agendaFrom(description: string) {
  return description
    .split("\n")
    .map((line) => AGENDA_LINE.exec(line))
    .filter((m): m is RegExpExecArray => !!m)
    .map((m) => ({ time: m[1].trim(), label: m[2].trim() }));
}

async function qr(url: string): Promise<string> {
  return QRCode.toString(url, { type: "svg", margin: 1, errorCorrectionLevel: "M" });
}

const isWebLink = (u: string | null | undefined): u is string => !!u && /^https?:\/\//.test(u);

// Full-screen deck for running an event, built from the event, its
// presenters and accepted speakers, so it stays current without editing.
export default async function SlideshowPage({
  params,
}: PageProps<"/admin/events/[id]/slideshow">) {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/");

  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      presenters: {
        orderBy: { position: "asc" },
        select: {
          user: {
            select: { name: true, email: true, title: true, company: true, photoUrl: true, linkedinUrl: true },
          },
        },
      },
      speakerOpportunities: {
        select: {
          topic: true,
          applications: {
            where: { status: "accepted" },
            select: { candidateName: true, candidateEmail: true, candidateTitle: true, candidateLinkedin: true },
          },
        },
      },
    },
  });
  if (!event) notFound();

  const now = new Date();
  const [openSlots, nextEvent] = await Promise.all([
    prisma.speakerOpportunity.count({
      where: { status: "open", event: { dateTime: { gt: now } } },
    }),
    prisma.event.findFirst({
      where: { dateTime: { gt: event.dateTime }, id: { not: event.id } },
      orderBy: { dateTime: "asc" },
      select: { title: true, dateTime: true },
    }),
  ]);

  // Members chosen as presenters first, then accepted speakers who aren't
  // already among them.
  const presenterEmails = new Set(event.presenters.map((p) => p.user.email.toLowerCase()));
  const people: (Omit<Presenter, "qr"> & { link: string | null })[] = [
    ...event.presenters.map(({ user }) => ({
      name: user.name,
      title: [user.title, user.company?.trim()].filter(Boolean).join(", "),
      photoUrl: user.photoUrl,
      topic: null,
      link: isWebLink(user.linkedinUrl) ? user.linkedinUrl : null,
    })),
    ...event.speakerOpportunities.flatMap((opp) =>
      opp.applications
        .filter((a) => !presenterEmails.has(a.candidateEmail.toLowerCase()))
        .map((a) => ({
          name: a.candidateName,
          title: a.candidateTitle ?? "",
          photoUrl: null,
          topic: opp.topic,
          link: isWebLink(a.candidateLinkedin) ? a.candidateLinkedin : null,
        }))
    ),
  ];
  const presenters: Presenter[] = await Promise.all(
    people.map(async ({ link, ...p }) => ({ ...p, qr: link ? await qr(link) : null }))
  );

  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const [checkInQr, membersQr, speakingQr, joinQr] = await Promise.all([
    qr(`${base}${checkInPath(event.id)}`),
    qr(`${base}/members`),
    qr(`${base}${SPEAKING_PATH}`),
    qr(`${base}/join`),
  ]);

  const questions =
    event.discussionQuestions
      ?.split("\n")
      .map((q) => q.trim())
      .filter(Boolean) ?? [];

  const agenda = agendaFrom(event.description);
  // The topic slide shows the description's opening paragraph.
  const summary = event.description.split(/\n\s*\n/)[0].trim();

  return (
    <Slideshow
      title={event.title}
      summary={summary}
      agenda={agenda}
      dateLabel={formatEventDate(event.dateTime, { weekday: "long", month: "long", day: "numeric" })}
      timeLabel={formatEventTimeRange(event.dateTime, event.endDateTime)}
      startsAt={event.dateTime.toISOString()}
      wifiName={event.wifiName}
      wifiPassword={event.wifiPassword}
      mission={MISSION}
      presenters={presenters}
      questions={questions.length > 0 ? questions : DEFAULT_QUESTIONS}
      openSlots={openSlots}
      nextEvent={
        nextEvent
          ? {
              title: nextEvent.title,
              dateLabel: formatEventDate(nextEvent.dateTime, { weekday: "long", month: "long", day: "numeric" }),
            }
          : null
      }
      qr={{ checkIn: checkInQr, members: membersQr, speaking: speakingQr, join: joinQr }}
    />
  );
}
