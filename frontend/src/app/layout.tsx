import type { Metadata, Viewport } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "../providers/StoreProvider";
import { QueryProvider } from "../providers/QueryProvider";
import { AuthProvider } from "../providers/AuthProvider";
import { ToastProvider } from "../providers/ToastProvider";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { OfflineBanner } from "../components/feedback/OfflineBanner";
import { ScrollToTop } from "../components/navigation/ScrollToTop";
import { getSiteUrl } from "@/lib/siteUrl";
import React, { Suspense } from "react";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-playfair",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#064E3B",
};

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    template: "%s | Career OS",
    default: "Career OS | Fresher & Recruiter Hiring Platform",
  },
  description:
    "Discover verified fresher roles, apply with confidence, and manage recruitment lifecycles seamlessly.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: getSiteUrl(),
    siteName: "Career OS",
    title: "Career OS | Fresher & Recruiter Hiring Platform",
    description:
      "Discover verified fresher roles, apply with confidence, and manage recruitment lifecycles seamlessly.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Career OS | Fresher & Recruiter Hiring Platform",
    description:
      "Discover verified fresher roles, apply with confidence, and manage recruitment lifecycles seamlessly.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="bg-champagne text-body flex flex-col min-h-screen">
        {/* Accessible Skip-to-Content Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald focus:text-white focus:rounded-ui focus:shadow-emerald-md focus:outline-none focus:ring-2 focus:ring-gold text-xs font-semibold"
        >
          Skip to content
        </a>
        <StoreProvider>
          <QueryProvider>
            <Suspense fallback={null}>
              <AuthProvider>
                <ScrollToTop />
                <OfflineBanner />
                <Navbar />
                <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col focus:outline-none">
                  {children}
                </main>
                <Footer />
                <ToastProvider />
              </AuthProvider>
            </Suspense>
          </QueryProvider>
        </StoreProvider>
      </body>
    </html>
  );
}

