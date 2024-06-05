import DotPattern from "@/components/DotPattern";
import { Toaster } from "@/components/ui/toaster";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Anoq",
  description: "Anonymous feedback made easy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <DotPattern className=" absolute inset-0 -z-10"/>

          <main className="z-10">{children}</main>

        <Toaster />
      </body>
    </html>
  );
}
