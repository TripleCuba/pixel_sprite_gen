import type { Metadata } from "next";
import { Pixelify_Sans, Press_Start_2P } from "next/font/google";
import "./globals.css";

const pixelifySans = Pixelify_Sans({
  subsets: ["latin"],
  variable: "--font-pixel-ui",
});

const pressStart2P = Press_Start_2P({
  subsets: ["latin"],
  variable: "--font-pixel-display",
  weight: "400",
});

export const metadata: Metadata = {
  title: "SpriteForge — Pixel Sprite Generator",
  description: "Forge pixel-perfect, game-ready sprite assets from your ideas.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${pixelifySans.variable} ${pressStart2P.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
