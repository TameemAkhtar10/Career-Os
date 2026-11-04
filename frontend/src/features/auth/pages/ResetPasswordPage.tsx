"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, ResetPasswordFormData } from "../schemas";
import { authApi } from "../services/auth.api";
import { ApiClientError } from "../../../config/api";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { OtpInput } from "../../../components/ui/OtpInput";
import { Card } from "../../../components/ui/Card";
import { ROUTES } from "../../../constants/routes";
import { Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const ResetPasswordPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") || "";

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: emailParam,
      otp: "",
      newPassword: "",
    },
  });

  const otpValue = watch("otp") || "";

  const onSubmit = async (data: ResetPasswordFormData) => {
    setApiError(null);
    try {
      const res = await authApi.resetPassword(data);
      toast.success(res.message || "Password reset successfully. Please log in.");
      router.push(ROUTES.LOGIN);
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        setApiError(err.message);
      } else {
        setApiError("Password reset failed. Please check the OTP.");
      }
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-[480px] bg-cream border border-border shadow-emerald-lg p-7 sm:p-9 relative">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald via-gold to-emerald rounded-t-card" />

        <div className="text-center pt-2 pb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-ui bg-gold-light border border-border mb-3 text-emerald shadow-emerald-sm">
            <Lock className="w-6 h-6 text-gold" />
          </div>
          <h1 className="font-fraunces text-3xl font-bold text-emerald-dark">
            Enter New Password
          </h1>
          <p className="text-xs text-muted mt-1.5 leading-relaxed">
            Enter the 6-digit code sent to your email and your new password
          </p>
        </div>

        {apiError && (
          <div className="mb-4 p-3 rounded-ui bg-error-bg border border-error-border text-error text-xs font-medium">
            {apiError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold uppercase tracking-wider text-body/80 select-none">
              6-Digit Reset Code
            </label>
            <OtpInput
              value={otpValue}
              onChange={(val) => setValue("otp", val, { shouldValidate: true })}
              error={errors.otp?.message}
            />
          </div>

          <Input
            label="New Password"
            type={showPassword ? "text" : "password"}
            placeholder="At least 8 characters"
            error={errors.newPassword?.message}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted hover:text-body focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            {...register("newPassword")}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full mt-2 gap-2"
          >
            <span>Update Password</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-muted">
          Remember your credentials?{" "}
          <Link href={ROUTES.LOGIN} className="font-semibold text-gold hover:text-emerald-dark underline">
            Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
};

