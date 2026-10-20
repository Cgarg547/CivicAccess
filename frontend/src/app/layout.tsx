import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CivicAccess | Toronto Public Washroom Explorer",
  description:
    "Explore Toronto public washroom candidate sites, compare neighbourhood coverage, examine estimated walking-network accessibility, and evaluate hypothetical infrastructure scenarios using Toronto Open Data.",
  applicationName: "CivicAccess",
  keywords: [
    "CivicAccess",
    "Toronto Open Data",
    "public washrooms",
    "neighbourhood coverage",
    "walking accessibility",
    "civic technology",
    "urban planning",
  ],
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
