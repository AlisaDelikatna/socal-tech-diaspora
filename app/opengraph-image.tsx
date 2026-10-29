import { ImageResponse } from "next/og";
import { join } from "node:path";
import { readFile } from "node:fs/promises";

// Social share card for Kolo Founders Circle.
// Next.js serves this at /opengraph-image and wires up the og:image +
// twitter:image tags automatically.

export const alt = "Kolo Founders Circle — Ukrainian founders in Southern California";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Palette mirrors app/globals.css (concrete hex — CSS vars don't apply here).
const BRAND = "#223A5E";
const CREAM = "#F0ECE3";
const MUTED = "#5B6B82";

// Official emblem, pre-rendered from public/kolo-logo.svg (the image renderer
// doesn't support the SVG's clip paths).
const emblem = `data:image/png;base64,${await readFile(
  join(process.cwd(), "public/kolo-emblem.png"),
  "base64"
)}`;

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: CREAM,
          padding: "80px",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={emblem} width={205} height={210} alt="" />

        <div
          style={{
            marginTop: 40,
            fontSize: 76,
            fontWeight: 800,
            color: BRAND,
            letterSpacing: -1,
          }}
        >
          Kolo Founders Circle
        </div>

        <div
          style={{
            marginTop: 20,
            fontSize: 30,
            color: MUTED,
            textAlign: "center",
            maxWidth: 820,
            lineHeight: 1.4,
          }}
        >
          Ukrainian founders, builders, and newcomers in Southern California —
          standing in circle.
        </div>
      </div>
    ),
    { ...size }
  );
}
