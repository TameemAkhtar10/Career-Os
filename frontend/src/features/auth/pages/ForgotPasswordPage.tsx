"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, ForgotPasswordFormData } from "../schemas";
import { authApi } from "../services/auth.api";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Logo } from "../../../components/layout/Logo";
import { ROUTES } from "../../../constants/routes";
import { KeyRound, ArrowRight, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

export const ForgotPasswordPage: React.FC = () => {
  const router = useRouter();
  const [apiMessage, setApiMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      const res = await authApi.forgotPassword(data);
      const msg =
        res.message ||
        "If an account exists, a password reset OTP has been sent.";
      toast.success(msg);
      setApiMessage(msg);
      router.push(`/reset-password?email=${encodeURIComponent(data.email)}`);
    } catch {
      // Always show generic message to avoid user enumeration
      const msg = "If an account exists, a password reset OTP has been sent.";
      toast.info(msg);
      router.push(`/reset-password?email=${encodeURIComponent(data.email)}`);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-[460px] bg-cream border border-border shadow-emerald-lg p-7 sm:p-9 relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald via-gold to-emerald rounded-t-card" />

        <div className="text-center pt-2 pb-6">
          <div className="flex justify-center mb-4">
            <Logo size="md" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-[-0.01em] text-emerald-dark">
            Reset Password
          </h1>
          <p className="text-xs text-muted mt-1.5 leading-relaxed">
            Enter your email to receive a 6-digit password reset OTP
          </p>
        </div>

        {apiMessage && (
          <div className="mb-4 p-3 rounded-ui bg-champagne border border-border text-body text-xs">
            {apiMessage}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full mt-2 gap-2"
          >
            <span>Send Reset Code</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href={ROUTES.LOGIN}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted hover:text-emerald-dark transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </Link>
        </div>
      </Card>
    </div>
  );
};

