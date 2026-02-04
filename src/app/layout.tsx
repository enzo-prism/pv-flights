import type { Metadata } from "next";
import localFont from "next/font/local";
import { Plane } from "lucide-react";
import "./globals.css";
import TopNav from "@/app/components/TopNav";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const siteUrl = "https://pv-flights.vercel.app";
const siteTitle = "Pole Vault Flights";
const siteDescription =
  "Search pole-approved flights and airlines for pole vault gear.";

const sfProText = localFont({
  variable: "--font-sf-pro",
  display: "swap",
  src: [
    { path: "../../font/SF-Pro-Text-Thin.otf", weight: "100", style: "normal" },
    {
      path: "../../font/SF-Pro-Text-ThinItalic.otf",
      weight: "100",
      style: "italic",
    },
    {
      path: "../../font/SF-Pro-Text-Ultralight.otf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../font/SF-Pro-Text-UltralightItalic.otf",
      weight: "200",
      style: "italic",
    },
    {
      path: "../../font/SF-Pro-Text-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../font/SF-Pro-Text-LightItalic.otf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../../font/SF-Pro-Text-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../font/SF-Pro-Text-RegularItalic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../font/SF-Pro-Text-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../font/SF-Pro-Text-MediumItalic.otf",
      weight: "500",
      style: "italic",
    },
    {
      path: "../../font/SF-Pro-Text-Semibold.otf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../font/SF-Pro-Text-SemiboldItalic.otf",
      weight: "600",
      style: "italic",
    },
    {
      path: "../../font/SF-Pro-Text-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../font/SF-Pro-Text-BoldItalic.otf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../../font/SF-Pro-Text-Heavy.otf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../font/SF-Pro-Text-HeavyItalic.otf",
      weight: "800",
      style: "italic",
    },
    {
      path: "../../font/SF-Pro-Text-Black.otf",
      weight: "900",
      style: "normal",
    },
    {
      path: "../../font/SF-Pro-Text-BlackItalic.otf",
      weight: "900",
      style: "italic",
    },
  ],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: siteTitle,
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: siteUrl,
    siteName: siteTitle,
    type: "website",
  },
  twitter: {
    card: "summary",
    title: siteTitle,
    description: siteDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${sfProText.variable} font-sans`}>
        <div className="min-h-screen bg-background text-foreground">
          <header className="border-b bg-background">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border bg-muted">
                  <Plane className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-semibold tracking-tight">
                      Pole Vault Flights
                    </p>
                    <Badge variant="outline" className="text-muted-foreground">
                      MVP
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Curated flight search for pole vault travel needs.
                  </p>
                </div>
              </div>
              <TopNav />
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl px-6 py-10">
            {children}
          </main>
          <Separator />
          <footer className="mx-auto w-full max-w-6xl px-6 py-6 text-xs text-muted-foreground">
            Final acceptance of sports equipment can vary by route and aircraft.
            Always confirm directly with the airline.
          </footer>
        </div>
      </body>
    </html>
  );
}
