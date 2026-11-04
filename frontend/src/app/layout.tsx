import type { Metadata } from "next";
import { Fraunces, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "../providers/StoreProvider";
import { QueryProvider } from "../providers/QueryProvider";
import { AuthProvider } from "../providers/AuthProvider";
import { ToastProvider } from "../providers/ToastProvider";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { OfflineBanner } from "../components/feedback/OfflineBanner";
import React, { Suspense } from "react";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta-sans",
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
    <html lang="en" className={`${fraunces.variable} ${plusJakartaSans.variable}`}>
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

