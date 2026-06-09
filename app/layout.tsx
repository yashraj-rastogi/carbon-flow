import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Carbon-Flow: Autonomous Decarbonization Platform",
  description: "A zero-friction, AI-driven sustainability assistant. Track utility bills and voice logs, calculate hyper-localized eGRID carbon offsets, and build habits using a mathematically optimized MDP gamification model.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
