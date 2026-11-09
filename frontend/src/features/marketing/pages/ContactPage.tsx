"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { ROUTES } from "../../../constants/routes";
import { Mail, Copy, Check, HelpCircle, User, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const ContactPage: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim();

  const handleCopyEmail = () => {
    if (!supportEmail) return;
    navigator.clipboard.writeText(supportEmail);
    setCopied(true);
    toast.success("Support email copied to clipboard.");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-champagne/40 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-10">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-badge bg-champagne border border-border text-emerald text-xs font-semibold">
            <Mail className="w-3.5 h-3.5 text-gold" />
            <span>Get In Touch</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-emerald-dark tracking-tight">
            Contact Support
          </h1>
          <p className="text-sm sm:text-base text-body/80 max-w-xl mx-auto leading-relaxed">
            Have an inquiry regarding your account, recruiter verification, or candidate profile?
            We are here to assist you.
          </p>
        </div>

        {/* Contact Method Card */}
        {supportEmail ? (
          <Card className="p-8 sm:p-10 bg-cream border-border shadow-emerald-sm text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-champagne border border-border flex items-center justify-center text-emerald mx-auto">
              <Mail className="w-7 h-7 text-gold" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-bold text-emerald-dark">
                Direct Email Support
              </h2>
              <p className="text-sm text-muted max-w-md mx-auto leading-relaxed">
                Click below to send an email directly to our support desk, or copy the address to your clipboard.
              </p>
            </div>

            <div className="inline-flex flex-col sm:flex-row items-center justify-center gap-3 p-3 bg-champagne/40 border border-border rounded-xl">
              <a
                href={`mailto:${supportEmail}`}
                className="font-mono text-sm sm:text-base text-emerald font-semibold hover:text-gold transition-colors break-all"
              >
                {supportEmail}
              </a>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyEmail}
                className="gap-1.5 text-xs h-8"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <a href={`mailto:${supportEmail}`}>
                <Button variant="primary" size="md" className="gap-2">
                  <Mail className="w-4 h-4" />
                  Compose Email
                </Button>
              </a>
              <Link href={ROUTES.FAQ}>
                <Button variant="outline" size="md" className="gap-2">
                  <HelpCircle className="w-4 h-4" />
                  Read the FAQ
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <Card className="p-8 bg-cream border-border shadow-emerald-sm text-center space-y-6">
            <div className="w-14 h-14 rounded-full bg-champagne border border-border flex items-center justify-center text-emerald mx-auto">
              <HelpCircle className="w-7 h-7 text-gold" />
            </div>

            <div className="space-y-2">
              <h2 className="font-display text-2xl font-bold text-emerald-dark">
                Support &amp; Assistance
              </h2>
              <p className="text-sm text-body/80 max-w-md mx-auto leading-relaxed">
                For answers to common questions about candidate profiles, resume access, or recruiter
                tools, please consult our comprehensive FAQ or manage your preferences directly from your
                account.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link href={ROUTES.FAQ}>
                <Button variant="primary" size="md" className="gap-2">
                  <HelpCircle className="w-4 h-4" />
                  View FAQ
                </Button>
              </Link>
              <Link href={ROUTES.ACCOUNT}>
                <Button variant="outline" size="md" className="gap-2">
                  <User className="w-4 h-4" />
                  Account Settings
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Self-Service Fast Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="p-5 bg-cream border-border space-y-2">
            <div className="flex items-center gap-2 text-emerald-dark font-semibold text-sm">
              <HelpCircle className="w-4 h-4 text-gold" />
              Common Questions
            </div>
            <p className="text-xs text-body/70 leading-relaxed">
              Find instant answers regarding OTP logins, skill matching formulas, and resume visibility.
            </p>
            <div className="pt-2">
              <Link
                href={ROUTES.FAQ}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald hover:text-gold transition-colors"
              >
                Browse FAQ &rarr;
              </Link>
            </div>
          </Card>

          <Card className="p-5 bg-cream border-border space-y-2">
            <div className="flex items-center gap-2 text-emerald-dark font-semibold text-sm">
              <ShieldCheck className="w-4 h-4 text-gold" />
              Manage Privacy &amp; Data
            </div>
            <p className="text-xs text-body/70 leading-relaxed">
              Download your complete data archive, update email preferences, or permanently delete your account.
            </p>
            <div className="pt-2">
              <Link
                href={ROUTES.ACCOUNT}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald hover:text-gold transition-colors"
              >
                Account Settings &rarr;
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

