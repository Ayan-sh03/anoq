import type { Metadata } from "next";
import { DM_Sans, Gloock } from "next/font/google";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import "../tokens.css";
import "./stationery.css";

const body = DM_Sans({ subsets: ["latin"], variable: "--font-dm", display: "swap" });
const display = Gloock({ subsets: ["latin"], weight: "400", variable: "--font-gloock", display: "swap" });

export const metadata: Metadata = {
  title: "Anoq | Anonymous feedback forms",
  description: "Create a feedback form, share a link, and give people room to speak freely.",
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable}`}>
      <body>{children}<Toaster /></body>
    </html>
  );
}
