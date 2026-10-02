import "./globals.css";
import type { Metadata, Viewport } from "next";
import { EVENT_NAME, EVENT_SUBTITLE } from "@/lib/event";

export const metadata: Metadata = {
  title: `${EVENT_NAME} · ${EVENT_SUBTITLE}`,
  description: "Internal pass distribution and sales tool",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#241A5E" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Mukta:wght@400;600;700;800&family=Yatra+One&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
