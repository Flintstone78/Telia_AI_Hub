import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const teliaSans = localFont({
  src: [
    { path: "../public/fonts/TeliaSans-400.woff", weight: "400", style: "normal" },
    { path: "../public/fonts/TeliaSans-500.woff", weight: "500", style: "normal" },
    { path: "../public/fonts/TeliaSans-700.woff", weight: "700", style: "normal" },
  ],
  variable: "--font-telia",
  display: "swap",
});

const teliaSansHeading = localFont({
  src: [{ path: "../public/fonts/TeliaSansHeading-400.woff", weight: "400", style: "normal" }],
  variable: "--font-telia-heading",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NAVET — Min AI-hubb",
  description: "Personlig hubb för mina AI-verktyg: byggda, i beta och på idéstadiet.",
};

export const viewport: Viewport = {
  themeColor: "#0B0313",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" className={`${teliaSans.variable} ${teliaSansHeading.variable}`}>
      <body className="bg-glow min-h-screen">{children}</body>
    </html>
  );
}
