"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import Logo from "@/components/Logo";
import MemberAvatar from "@/components/MemberAvatar";

export type Presenter = {
  name: string;
  title: string;
  photoUrl: string | null;
  // Talk topic, for speakers accepted through a speaker slot.
  topic: string | null;
  // QR code (SVG markup) linking to their LinkedIn.
  qr: string | null;
};

type Props = {
  title: string;
  summary: string;
  agenda: { time: string; label: string }[];
  dateLabel: string;
  timeLabel: string;
  startsAt: string;
  wifiName: string | null;
  wifiPassword: string | null;
  mission: string;
  presenters: Presenter[];
  questions: string[];
  openSlots: number;
  nextEvent: { title: string; dateLabel: string } | null;
  // QR codes as SVG markup, generated on the server.
  qr: { checkIn: string; members: string; speaking: string; join: string };
};

// Sizes are in cqw (percent of the slide's width), so slides look the same
// on a laptop, a projector, or a TV.
function Qr({ svg, label, className = "w-[16cqw]" }: { svg: string; label?: string; className?: string }) {
  return (
    <div className="flex flex-col items-center gap-[0.8cqw]">
      <div
        className={`${className} aspect-square rounded-[1cqw] bg-white p-[0.8cqw] [&>svg]:h-full [&>svg]:w-full`}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {label && <span className="text-[1.4cqw] font-semibold">{label}</span>}
    </div>
  );
}

function Frame({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <div
      className={`flex h-full w-full flex-col px-[6cqw] py-[4.5cqw] ${
        dark ? "bg-brand text-white" : "bg-white text-foreground"
      }`}
    >
      <div className="mb-[2.5cqw] flex items-center justify-between">
        <span className={dark ? "rounded-[0.8cqw] bg-white px-[1cqw] py-[0.5cqw]" : ""}>
          <Logo className="h-[3.6cqw]" />
        </span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-center">{children}</div>
    </div>
  );
}

function Heading({ kicker, children }: { kicker?: string; children: React.ReactNode }) {
  return (
    <>
      {kicker && (
        <div className="mb-[1cqw] text-[1.5cqw] font-semibold uppercase tracking-[0.2em] text-accent">
          {kicker}
        </div>
      )}
      <h2 className="text-[4.4cqw] font-extrabold leading-[1.1]">{children}</h2>
    </>
  );
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

// Counts down to the start; null before mount so server and client agree.
function Countdown({ startsAt }: { startsAt: string }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);
  if (now == null) return null;
  const left = Math.max(0, Math.floor((new Date(startsAt).getTime() - now) / 1000));
  if (left === 0) return null;
  const days = Math.floor(left / 86400);
  const parts = [
    ...(days > 0 ? [[days, "days"] as const] : []),
    [Math.floor((left % 86400) / 3600), "hours"] as const,
    [Math.floor((left % 3600) / 60), "min"] as const,
    [left % 60, "sec"] as const,
  ];
  return (
    <div className="rounded-[1.2cqw] bg-white/10 p-[1.5cqw]">
      <div className="mb-[0.8cqw] text-[1.3cqw] font-semibold uppercase tracking-[0.2em] text-white/70">
        Starting in
      </div>
      <div className="flex gap-[1cqw]">
        {parts.map(([value, unit]) => (
          <div key={unit} className="w-[6.5cqw] rounded-[0.8cqw] bg-white py-[0.8cqw] text-center text-brand">
            <div className="text-[3.4cqw] font-extrabold leading-none tabular-nums">{pad(value)}</div>
            <div className="mt-[0.4cqw] text-[1cqw] uppercase tracking-wide">{unit}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Slideshow(props: Props) {
  const { presenters, qr } = props;

  const slides: { key: string; render: () => React.ReactNode }[] = [
    {
      key: "welcome",
      render: () => (
        <Frame dark>
          <div className="flex items-center justify-between gap-[4cqw]">
            <div className="min-w-0 flex-1">
              <div className="text-[1.6cqw] font-semibold uppercase tracking-[0.2em] text-white/70">
                {props.dateLabel} · {props.timeLabel}
              </div>
              <h1 className="mt-[1.2cqw] text-[5.2cqw] font-extrabold leading-[1.05]">{props.title}</h1>
              {(props.wifiName || props.wifiPassword) && (
                <div className="mt-[3cqw] space-y-[0.4cqw] text-[1.8cqw]">
                  {props.wifiName && (
                    <div>
                      <span className="text-white/60">Wi-Fi </span>
                      <span className="font-semibold">{props.wifiName}</span>
                    </div>
                  )}
                  {props.wifiPassword && (
                    <div>
                      <span className="text-white/60">Password </span>
                      <span className="font-semibold">{props.wifiPassword}</span>
                    </div>
                  )}
                </div>
              )}
              <div className="mt-[3cqw]">
                <Countdown startsAt={props.startsAt} />
              </div>
            </div>
            <Qr svg={qr.checkIn} label="Scan to check in" className="w-[22cqw]" />
          </div>
        </Frame>
      ),
    },
    {
      key: "about",
      render: () => (
        <Frame>
          <Heading kicker="Welcome to Kolo">Find your circle.</Heading>
          <p className="mt-[2.5cqw] max-w-[75cqw] text-[2.3cqw] leading-[1.45] text-foreground/80">
            {props.mission}
          </p>
          <p className="mt-[2.5cqw] text-[1.8cqw] font-semibold text-brand">
            Resources · Speaking slots · Introductions · Events
          </p>
        </Frame>
      ),
    },
    {
      key: "agenda",
      render: () => (
        <Frame>
          <Heading kicker="Tonight">Agenda</Heading>
          <ul className="mt-[3cqw] space-y-[1.6cqw]">
            {(props.agenda.length > 0
              ? props.agenda
              : [{ time: props.timeLabel, label: props.title }]
            ).map((item) => (
              <li key={item.time + item.label} className="flex gap-[3cqw] text-[2.6cqw]">
                <span className="w-[24cqw] shrink-0 font-semibold text-brand">{item.time}</span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </Frame>
      ),
    },
    {
      key: "topic",
      render: () => (
        <Frame>
          <Heading kicker="Tonight's topic">{props.title}</Heading>
          <p className="mt-[2.5cqw] max-w-[80cqw] text-[2.2cqw] leading-[1.5] text-foreground/80">
            {props.summary}
          </p>
        </Frame>
      ),
    },
    ...presenters.map((p, i) => ({
      key: `presenter-${i}`,
      render: () => (
        <Frame>
          <div className="flex items-center gap-[5cqw]">
            <MemberAvatar
              name={p.name}
              photoUrl={p.photoUrl}
              size={240}
              className="!h-[22cqw] !w-[22cqw] shrink-0 !text-[6cqw]"
            />
            <div className="min-w-0 flex-1">
              <div className="mb-[1cqw] text-[1.5cqw] font-semibold uppercase tracking-[0.2em] text-accent">
                {presenters.length > 1 ? `Presenter ${i + 1} of ${presenters.length}` : "Presenter"}
              </div>
              <h2 className="text-[4.6cqw] font-extrabold leading-[1.1]">{p.name}</h2>
              {p.title && <p className="mt-[1cqw] text-[2.3cqw] text-foreground/75">{p.title}</p>}
              {p.topic && <p className="mt-[2cqw] text-[2.2cqw] font-semibold text-brand">{p.topic}</p>}
            </div>
            {p.qr && <Qr svg={p.qr} label="Connect on LinkedIn" className="w-[14cqw]" />}
          </div>
        </Frame>
      ),
    })),
    {
      key: "discussion",
      render: () => (
        <Frame>
          <Heading kicker="Open discussion">Bring your questions.</Heading>
          <ul className="mt-[3cqw] space-y-[1.6cqw]">
            {props.questions.map((q) => (
              <li key={q} className="flex gap-[1.6cqw] text-[2.4cqw] leading-[1.35]">
                <span className="text-accent">—</span>
                <span>{q}</span>
              </li>
            ))}
          </ul>
        </Frame>
      ),
    },
    {
      key: "networking",
      render: () => (
        <Frame>
          <div className="flex items-center justify-between gap-[4cqw]">
            <div className="min-w-0 flex-1">
              <Heading kicker="Networking">Find each other later.</Heading>
              <p className="mt-[2.5cqw] max-w-[50cqw] text-[2.2cqw] leading-[1.5] text-foreground/80">
                Everyone here is in the member directory. Fill in &ldquo;What I need&rdquo; and
                &ldquo;How I can help&rdquo; on your profile so the right people find you.
              </p>
            </div>
            <Qr svg={qr.members} label="Member directory" />
          </div>
        </Frame>
      ),
    },
    ...(props.openSlots > 0
      ? [
          {
            key: "speak",
            render: () => (
              <Frame>
                <div className="flex items-center justify-between gap-[4cqw]">
                  <div className="min-w-0 flex-1">
                    <Heading kicker="Pitch a talk">Want to speak at the next one?</Heading>
                    <p className="mt-[2.5cqw] max-w-[50cqw] text-[2.2cqw] leading-[1.5] text-foreground/80">
                      {props.openSlots === 1
                        ? "There's 1 open speaker slot."
                        : `There are ${props.openSlots} open speaker slots.`}{" "}
                      Apply for one, recommend someone, or pitch your own talk.
                    </p>
                  </div>
                  <Qr svg={qr.speaking} label="Speaker opportunities" />
                </div>
              </Frame>
            ),
          },
        ]
      : []),
    {
      key: "thanks",
      render: () => (
        <Frame dark>
          <div className="flex items-center justify-between gap-[4cqw]">
            <div className="min-w-0 flex-1">
              <h2 className="text-[5cqw] font-extrabold leading-[1.1]">Thank you for coming.</h2>
              <p className="mt-[2cqw] text-[2.3cqw] text-white/85">
                Bring a founder friend next time: they can apply to join Kolo.
              </p>
              {props.nextEvent && (
                <p className="mt-[3cqw] text-[2cqw]">
                  <span className="text-white/60">Next: </span>
                  <span className="font-semibold">
                    {props.nextEvent.title}, {props.nextEvent.dateLabel}
                  </span>
                </p>
              )}
              <p className="mt-[1.2cqw] text-[1.8cqw] text-white/70">hello@kolofounders.com</p>
            </div>
            {/* Check-in again at the end, for anyone who arrived late. */}
            <div className="flex gap-[2.5cqw]">
              <Qr svg={qr.checkIn} label="Check in" className="w-[15cqw]" />
              <Qr svg={qr.join} label="Apply to join" className="w-[15cqw]" />
            </div>
          </div>
        </Frame>
      ),
    },
  ];

  const count = slides.length;
  const [index, setIndex] = useState(0);
  const go = useCallback(
    (i: number) => {
      const next = Math.min(Math.max(i, 0), count - 1);
      setIndex(next);
      history.replaceState(null, "", `#slide-${next + 1}`);
    },
    [count]
  );

  // Open on the slide named in the URL (#slide-3), e.g. after a reload.
  useEffect(() => {
    const m = /^#slide-(\d+)$/.exec(window.location.hash);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (m) setIndex(Math.min(Math.max(Number(m[1]) - 1, 0), count - 1));
  }, [count]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(e.key)) {
        e.preventDefault();
        go(index + 1);
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(e.key)) {
        e.preventDefault();
        go(index - 1);
      } else if (e.key === "Home") {
        go(0);
      } else if (e.key === "End") {
        go(count - 1);
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, count, go]);

  function toggleFullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen().catch(() => {});
  }

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-neutral-950">
      <div className="flex min-h-0 flex-1 items-center justify-center p-2">
        <div
          className="relative aspect-video w-full max-w-[calc((100vh-4rem)*16/9)] overflow-hidden rounded-md [container-type:inline-size]"
          onClick={() => go(index + 1)}
        >
          {slides[index].render()}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-white/70">
        <Link href="/admin" className="hover:text-white">
          ← Back to admin
        </Link>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => go(index - 1)} disabled={index === 0} className="rounded px-2 py-1 hover:text-white disabled:opacity-30">
            ← Prev
          </button>
          <span className="tabular-nums">
            {index + 1} / {count}
          </span>
          <button type="button" onClick={() => go(index + 1)} disabled={index === count - 1} className="rounded px-2 py-1 hover:text-white disabled:opacity-30">
            Next →
          </button>
        </div>
        <button type="button" onClick={toggleFullscreen} className="hover:text-white">
          Full screen (F)
        </button>
      </div>
    </div>
  );
}
