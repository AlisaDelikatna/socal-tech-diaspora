/**
 * Kolo Founders Circle — logo system.
 *
 * Three swappable directions are implemented so the community can review and
 * pick one before we standardize. Change the default `variant` below (or pass
 * a `variant` prop per-usage) to switch marks everywhere.
 *
 *   A — "stitch"  : a single vyshyvanka cross-stitch (X) inside a circle (kolo).
 *   B — "pattern" : a ring built from many small stitches — one founder, one
 *                   stitch; the room is the pattern they make together.
 *   C — "wordmark": typography-first "KOLO", the O's drawn as rings, a tiny
 *                   stitch inside the first O.
 *
 * Colors are driven by the CSS custom properties `--brand` and `--accent`
 * (see app/globals.css) so the palette can be retuned without touching this
 * file.
 */

export type LogoVariant = "a" | "b" | "c" | "stitch" | "pattern" | "wordmark";

/** Pick which direction is "live" across the app until one is chosen. */
export const DEFAULT_LOGO_VARIANT: LogoVariant = "b";

type LogoProps = {
  /** Which of the three directions to render. Defaults to DEFAULT_LOGO_VARIANT. */
  variant?: LogoVariant;
  /** Show the "Kolo Founders Circle" wordmark beside the mark (marks A & B). */
  showWordmark?: boolean;
  /** Wrapper classes — control height here, e.g. "h-10". */
  className?: string;
  /** Accessible label. */
  title?: string;
};

const norm = (v: LogoVariant) =>
  v === "a" || v === "stitch"
    ? "stitch"
    : v === "c" || v === "wordmark"
    ? "wordmark"
    : "pattern";

export default function Logo({
  variant = DEFAULT_LOGO_VARIANT,
  showWordmark = true,
  className = "h-10",
  title = "Kolo Founders Circle",
}: LogoProps) {
  const kind = norm(variant);

  // Direction C is a wordmark on its own — no separate icon + text lockup.
  if (kind === "wordmark") {
    return (
      <span className={`inline-flex items-center ${className}`}>
        <WordmarkMark title={title} className="h-full w-auto" />
      </span>
    );
  }

  const Mark = kind === "stitch" ? StitchMark : PatternMark;

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <Mark title={title} className="h-full w-auto" aria-hidden={showWordmark} />
      {showWordmark && (
        <span className="flex flex-col justify-center leading-none">
          <span className="text-[1.05rem] font-extrabold tracking-tight text-brand">
            Kolo
          </span>
          <span className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted">
            Founders Circle
          </span>
        </span>
      )}
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Direction A — literal cross-stitch inside a circle.
   Minimal, two-color, legible at favicon size.
   ───────────────────────────────────────────────────────────────────────── */
export function StitchMark({
  className,
  title,
  ...rest
}: React.SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label={title}
      className={className}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <circle
        cx="24"
        cy="24"
        r="20"
        fill="none"
        stroke="var(--brand)"
        strokeWidth="3"
      />
      {/* two crossing stitches — a single vyshyvanka cross */}
      <g
        stroke="var(--accent)"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      >
        <path d="M16 16 L32 32" />
        <path d="M32 16 L16 32" />
      </g>
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Direction B — a ring made of many small stitches.
   "One founder is one stitch; the pattern is what many make together."
   ───────────────────────────────────────────────────────────────────────── */
export function PatternMark({
  className,
  title,
  ...rest
}: React.SVGProps<SVGSVGElement> & { title?: string }) {
  const cx = 24;
  const cy = 24;
  const r = 17;
  const count = 12;
  // Highlight a few stitches in gold to suggest individuals within the whole.
  const accentEvery = new Set([0, 4, 8]);

  const stitches = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    const deg = (angle * 180) / Math.PI + 90; // face the diamond toward center
    const color = accentEvery.has(i) ? "var(--accent)" : "var(--brand)";
    return (
      <rect
        key={i}
        x={x - 3.1}
        y={y - 3.1}
        width="6.2"
        height="6.2"
        rx="1.2"
        fill={color}
        transform={`rotate(${deg + 45} ${x} ${y})`}
      />
    );
  });

  return (
    <svg
      viewBox="0 0 48 48"
      role="img"
      aria-label={title}
      className={className}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {stitches}
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Direction C — clean wordmark. "KOLO" in a geometric weight, the O's are
   rings ("kolo" = circle) and the first O holds a tiny stitch.
   ───────────────────────────────────────────────────────────────────────── */
export function WordmarkMark({
  className,
  title,
  ...rest
}: React.SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg
      viewBox="0 0 200 56"
      role="img"
      aria-label={title ?? "KOLO"}
      className={className}
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      <g
        fill="var(--brand)"
        fontFamily="var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
        fontWeight={800}
        fontSize="52"
        letterSpacing="1"
      >
        {/* K and L as type; the O's are drawn as rings for control/alignment */}
        <text x="0" y="44">
          K
        </text>
        <text x="96" y="44">
          L
        </text>
      </g>

      {/* First O — ring with a tiny cross-stitch inside */}
      <g>
        <circle
          cx="58"
          cy="28"
          r="17"
          fill="none"
          stroke="var(--brand)"
          strokeWidth="9"
        />
        <g
          stroke="var(--accent)"
          strokeWidth="4"
          strokeLinecap="round"
        >
          <path d="M53 23 L63 33" />
          <path d="M63 23 L53 33" />
        </g>
      </g>

      {/* Second O — plain ring, accent to echo the flag-nod gold */}
      <circle
        cx="176"
        cy="28"
        r="17"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="9"
      />
    </svg>
  );
}
