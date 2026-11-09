"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { notificationApi } from "../services/notification.api";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { ROUTES } from "../../../constants/routes";
import { CheckCircle2, XCircle, Loader2, MailCheck, ArrowRight, Home } from "lucide-react";

export const UnsubscribePage: React.FC = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const typeParam = searchParams.get("type");

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [unsubscribedType, setUnsubscribedType] = useState<string | null>(typeParam);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No unsubscribe token was provided in the link.");
      return;
    }

    let isMounted = true;

    const performUnsubscribe = async () => {
      try {
        const res = await notificationApi.unsubscribe(token);
        if (isMounted) {
          setStatus("success");
          if (res.data?.type) {
            setUnsubscribedType(res.data.type);
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          setStatus("error");
          const msg =
            err instanceof Error ? err.message : "Invalid or expired unsubscribe link.";
          setErrorMessage(msg);
        }
      }
    };

    performUnsubscribe();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const getFriendlyTypeLabel = (type: string | null) => {
    switch (type) {
      case "jobAlerts":
        return "Daily Job Alerts";
      case "applicantDigest":
        return "Daily Applicant Digest";
      case "profileNudges":
        return "Weekly Profile Tips & Nudges";
      default:
        return "this email notification";
    }
  };

  return (
    <div className="min-h-screen bg-champagne/40 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <Link href={ROUTES.HOME} className="inline-block">
            <span className="font-display font-bold text-2xl text-emerald tracking-tight">
              Career OS
            </span>
          </Link>
        </div>

        <Card className="p-8 bg-cream border-border shadow-emerald-md text-center space-y-6">
          {/* Loading State */}
          {status === "loading" && (
            <div className="py-8 space-y-4">
              <Loader2 className="w-10 h-10 text-gold animate-spin mx-auto" />
              <h2 className="font-heading text-xl font-bold text-emerald">
                Processing your request...
              </h2>
              <p className="text-sm text-body/70">
                Updating your notification preferences. Please wait a moment.
              </p>
            </div>
          )}

          {/* Success State */}
          {status === "success" && (
            <div className="py-2 space-y-4">
              <div className="w-14 h-14 rounded-full bg-success-bg border border-success-border flex items-center justify-center mx-auto text-success">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="font-heading text-2xl font-bold text-emerald">
                  Unsubscribed Successfully
                </h2>
                <p className="text-sm text-body/80 leading-relaxed">
                  You have been unsubscribed from{" "}
                  <strong>{getFriendlyTypeLabel(unsubscribedType)}</strong>.
                </p>
                <p className="text-xs text-muted">
                  You won&apos;t receive these scheduled emails anymore. You can change your mind and
                  reactivate them anytime in your account settings.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <Link href={ROUTES.ACCOUNT} className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    <MailCheck className="w-4 h-4" />
                    Manage Preferences
                  </Button>
                </Link>
                <Link href={ROUTES.HOME} className="w-full sm:w-auto">
                  <Button variant="primary" size="sm" className="w-full gap-2">
                    <Home className="w-4 h-4" />
                    Career OS Home
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Error State */}
          {status === "error" && (
            <div className="py-2 space-y-4">
              <div className="w-14 h-14 rounded-full bg-error-bg border border-error-border flex items-center justify-center mx-auto text-error">
                <XCircle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h2 className="font-heading text-xl font-bold text-emerald">
                  Invalid or Expired Link
                </h2>
                <p className="text-sm text-body/80 leading-relaxed">
                  {errorMessage || "This unsubscribe link is invalid or has expired."}
                </p>
                <p className="text-xs text-muted">
                  You can update and review your email preferences directly by signing in to your
                  Career OS account.
                </p>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <Link href={ROUTES.ACCOUNT} className="w-full sm:w-auto">
                  <Button variant="primary" size="sm" className="w-full gap-2">
                    Go to Account Settings
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
                <Link href={ROUTES.HOME} className="w-full sm:w-auto">
                  <Button variant="outline" size="sm" className="w-full gap-2">
                    Return to Home
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

