/**
 * Kolo Founders Circle — brand logo.
 *
 * Renders the official emblem (public/kolo-logo.svg): the interlocking
 * blue/gold circles with the "kolo" wordmark. Height is controlled by the
 * `className` on the wrapper (e.g. "h-9"); the emblem scales to fill it.
 *
 * `showWordmark` appends the "Founders Circle" lockup text beside the emblem.
 */

type LogoProps = {
  /** Append the "Founders Circle" wordmark beside the emblem. */
  showWordmark?: boolean;
  /** Wrapper classes — set the height here, e.g. "h-9". */
  className?: string;
  /** Accessible label / alt text. */
  title?: string;
};

export default function Logo({
  showWordmark = true,
  className = "h-10",
  title = "Kolo Founders Circle",
}: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/kolo-logo.svg" alt={title} className="h-full w-auto" />
      {showWordmark && (
        <span className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-brand leading-[1.15]">
          Founders
          <br />
          Circle
        </span>
      )}
    </span>
  );
}
