import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AppHeader } from "@/components/app-header";

const bebasNeue = localFont({
  src: "./fonts/bebas-neue-latin.woff2",
  weight: "400",
  variable: "--font-heading",
  display: "swap",
});

const jost = localFont({
  src: "./fonts/jost-latin.woff2",
  weight: "100 900",
  variable: "--font-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "./fonts/geist-mono-latin.woff2",
  weight: "100 900",
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CredX | Skills meet opportunity",
    template: "%s | CredX",
  },
  description:
    "A skill-first career matching workspace for students and recruiters.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full",
        "antialiased",
        bebasNeue.variable,
        jost.variable,
        geistMono.variable,
        "font-sans"
      )}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <AppHeader />
        <div className="flex flex-1 flex-col">{children}</div>
      </body>
    </html>
  );
}
