import type React from "react";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Press_Start_2P } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const pixelFont = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-pixel",
  preload: true,
});

export const metadata: Metadata = {
  title: "Wanderify - Travel to Earn",
  description: "Discover a New World. Connect Your Compass.",
  generator: "Next.js",
  applicationName: "Wanderify",
  keywords: ["travel", "blockchain", "web3", "travel-to-earn", "GPS", "adventure"],
  authors: [{ name: "Wanderify Team" }],
  creator: "Wanderify",
  publisher: "Wanderify",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title: "Wanderify - Travel to Earn",
    description: "Discover a New World. Connect Your Compass.",
    siteName: "Wanderify",
  },
  twitter: {
    card: "summary_large_image",
    title: "Wanderify - Travel to Earn",
    description: "Discover a New World. Connect Your Compass.",
    creator: "@wanderify",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`font-sans ${GeistSans.variable} ${GeistMono.variable} ${pixelFont.variable} antialiased`}
        suppressHydrationWarning
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
