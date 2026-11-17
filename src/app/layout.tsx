import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { AudioBridge } from "@/components/game/AudioBridge";
import { RouteFade } from "@/components/game/RouteFade";
import { ToastProvider } from "@/components/ui";
import "./globals.css";

const headingFont = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const bodyFont = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const monoFont = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LightPath — The Lighthouse Rescue",
  description: "A 2D optical puzzle game about mirrors, light and a lighthouse that needs rescuing.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${headingFont.variable} ${bodyFont.variable} ${monoFont.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-abyss text-soft-white font-sans">
        <AudioBridge />
        <ToastProvider>
          <Suspense fallback={<div className="min-h-screen bg-abyss">{children}</div>}>
            <RouteFade>{children}</RouteFade>
          </Suspense>
        </ToastProvider>
      </body>
    </html>
  );
}
