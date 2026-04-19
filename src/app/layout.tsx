import type { Metadata } from "next";
import { DM_Sans, Outfit } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { OfflineSyncProvider } from "@/contexts/OfflineSyncContext";
import { OfflineBanner } from "@/components/OfflineBanner";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pepperr — Restaurant POS",
  description: "Point of sale, customers, and sales for Pepperr",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSans.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body className="font-sans min-h-screen antialiased">
        <ThemeProvider>
          <OfflineSyncProvider>
            <OfflineBanner />
            {children}
          </OfflineSyncProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
