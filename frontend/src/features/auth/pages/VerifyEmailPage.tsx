"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch } from "react-redux";
import { setAuthUser } from "../state/authSlice";
import { authApi } from "../services/auth.api";
import { ApiClientError } from "../../../config/api";
import { OtpInput } from "../../../components/ui/OtpInput";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Logo } from "../../../components/layout/Logo";
import { ROUTES } from "../../../constants/routes";
import { MailCheck, RotateCcw, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const VerifyEmailPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();

  const emailParam = searchParams.get("email") || "";
  const [email] = useState(emailParam);
  const [otp, setOtp] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(60);

  // Countdown timer for resend
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldownSeconds]);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!email) {
      setErrorMsg("Email address is missing. Please register again.");
      return;
    }
    if (otp.length !== 6) {
      setErrorMsg("Please enter all 6 digits of the OTP.");
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await authApi.verifyEmail({ email, otp });
      if (res.data?.user) {
        dispatch(setAuthUser(res.data.user));
        toast.success(res.message || "Email verified! You are now logged in.");
        if (res.data.user.role === "recruiter") {
          router.push(ROUTES.RECRUITER.DASHBOARD);
        } else {
          router.push(ROUTES.JOBS);
        }
      }
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Failed to verify OTP. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldownSeconds > 0 || !email) return;

    setErrorMsg(null);
    setIsResending(true);

    try {
      const res = await authApi.resendOtp(email);
      toast.success(res.message || "OTP resent. Check your inbox.");
      setCooldownSeconds(60);
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        // Parse 429 response e.g. "Please wait 42s before requesting a new OTP"
        const match = err.message.match(/wait\s+(\d+)s/i);
        if (match && match[1]) {
          const parsedSec = parseInt(match[1], 10);
          setCooldownSeconds(parsedSec);
        }
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Failed to resend OTP.");
      }
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-[480px] bg-cream border border-border shadow-emerald-lg p-7 sm:p-9 relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald via-gold to-emerald rounded-t-card" />

        <div className="text-center pt-2 pb-6">
          <div className="flex justify-center mb-4">
            <Logo size="md" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-[-0.01em] text-emerald-dark">
            Verify Your Email
          </h1>
          <p className="text-xs text-muted mt-1.5 leading-relaxed">
            We sent a 6-digit verification code to <br />
            <strong className="text-body font-semibold">{email || "your email address"}</strong>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <OtpInput
            value={otp}
            onChange={(val) => {
              setOtp(val);
              setErrorMsg(null);
            }}
            disabled={isSubmitting}
            error={errorMsg || undefined}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={otp.length !== 6}
            className="w-full gap-2"
          >
            <span>Verify &amp; Continue</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        {/* Resend section */}
        <div className="mt-6 pt-4 border-t border-border/60 text-center text-xs">
          {cooldownSeconds > 0 ? (
            <p className="text-muted">
              Resend available in <strong className="text-emerald font-semibold">{cooldownSeconds}s</strong>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending}
              className="inline-flex items-center gap-1.5 text-gold hover:text-emerald-dark font-semibold transition-colors focus:outline-none"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Resend Verification Code</span>
            </button>
          )}
        </div>
      </Card>
    </div>
  );
};

