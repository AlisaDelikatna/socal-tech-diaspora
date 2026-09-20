import { ImageResponse } from "next/og";

// Social share card for Kolo Founders Circle.
// Next.js serves this at /opengraph-image and wires up the og:image +
// twitter:image tags automatically.

export const alt = "Kolo Founders Circle — Ukrainian founders in Southern California";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Palette mirrors app/globals.css (concrete hex — CSS vars don't apply here).
const BRAND = "#223A5E";
const CREAM = "#F0ECE3";
const GOLD = "#C69A3E";

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
          background: BRAND,
          padding: "80px",
        }}
      >
        {/* Stitch-in-circle mark, drawn with divs */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 150,
            height: 150,
            borderRadius: 150,
            border: `9px solid ${CREAM}`,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              width: 96,
              height: 13,
              borderRadius: 8,
              background: GOLD,
              transform: "rotate(45deg)",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: 96,
              height: 13,
              borderRadius: 8,
              background: GOLD,
              transform: "rotate(-45deg)",
            }}
          />
        </div>

        <div
          style={{
            marginTop: 48,
            fontSize: 76,
            fontWeight: 800,
            color: CREAM,
            letterSpacing: -1,
          }}
        >
          Kolo Founders Circle
        </div>

        <div
          style={{
            marginTop: 20,
            fontSize: 30,
            color: GOLD,
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
