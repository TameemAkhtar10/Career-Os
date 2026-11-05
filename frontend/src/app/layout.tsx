import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "../providers/StoreProvider";
import { QueryProvider } from "../providers/QueryProvider";
import { AuthProvider } from "../providers/AuthProvider";
import { ToastProvider } from "../providers/ToastProvider";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { OfflineBanner } from "../components/feedback/OfflineBanner";
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

export const metadata: Metadata = {
  title: {
    template: "%s | Career OS",
    default: "Career OS | Fresher & Recruiter Hiring Platform",
  },
  description:
    "Discover verified fresher roles, apply with confidence, and manage recruitment lifecycles seamlessly.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="bg-champagne text-body flex flex-col min-h-screen">
        <StoreProvider>
          <QueryProvider>
            <Suspense fallback={null}>
              <AuthProvider>
                <OfflineBanner />
                <Navbar />
                <main className="flex-1 flex flex-col">{children}</main>
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

