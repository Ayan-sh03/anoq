import DotPattern from "@/components/DotPattern";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";
import { Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-outfit",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Anoq | Anonymous Feedback Platform",
  description: "Collect honest, anonymous feedback to understand your users truly. AI-powered insights, real-time analytics, and complete privacy.",
  keywords: ["anonymous feedback", "user feedback", "product feedback", "surveys", "AI insights"],
  authors: [{ name: "Anoq" }],
  openGraph: {
    title: "Anoq | Anonymous Feedback Platform",
    description: "Collect honest, anonymous feedback to understand your users truly.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anoq | Anonymous Feedback Platform",
    description: "Collect honest, anonymous feedback to understand your users truly.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${outfit.variable} ${spaceGrotesk.variable} font-sans antialiased`}>
        <div className="fixed inset-0 -z-10">
          <DotPattern className="absolute inset-0 opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-br from-background via-slate-900/50 to-background" />
        </div>
        <main className="relative z-10 min-h-screen">{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
