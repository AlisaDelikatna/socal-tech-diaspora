import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
  title: "Kolo Founders Circle — Ukrainian founders in Southern California",
  description:
    "Where Ukrainian founders, builders, and newcomers in Southern California stand in circle, grow together, and build something greater than any one of them.",
  openGraph: {
    title: "Kolo Founders Circle",
    description:
      "Ukrainian founders, builders, and newcomers in Southern California — standing in circle, growing together.",
    siteName: "Kolo Founders Circle",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kolo Founders Circle",
    description:
      "Ukrainian founders, builders, and newcomers in Southern California — standing in circle, growing together.",
  },
  // Favicon is provided by app/icon.svg (Next.js file convention).
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
