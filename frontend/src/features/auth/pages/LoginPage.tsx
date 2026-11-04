"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, LoginFormData } from "../schemas";
import { authApi } from "../services/auth.api";
import { useDispatch } from "react-redux";
import { setAuthUser } from "../state/authSlice";
import { ApiClientError } from "../../../config/api";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { Logo } from "../../../components/layout/Logo";
import { ROUTES } from "../../../constants/routes";
import { LogIn, Eye, EyeOff, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const LoginPage: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dispatch = useDispatch();
  const nextUrl = searchParams.get("next");

  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setApiError(null);
    try {
      const res = await authApi.login(data);
      if (res.data?.user) {
        dispatch(setAuthUser(res.data.user));
        toast.success(res.message || "Logged in successfully.");

        if (nextUrl && nextUrl.startsWith("/")) {
          router.push(nextUrl);
        } else if (res.data.user.role === "recruiter") {
          router.push(ROUTES.RECRUITER.DASHBOARD);
        } else {
          router.push(ROUTES.JOBS);
        }
      }
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        // Backend returns 403 if email is not verified
        if (err.statusCode === 403) {
          toast.info("Please verify your email address. Resending code...");
          try {
            await authApi.resendOtp(data.email);
          } catch {
            // ignore resend error if cooldown
          }
          router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
          return;
        }
        setApiError(err.message);
      } else {
        setApiError("Login failed. Please check your credentials.");
      }
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
          <h1 className="font-fraunces text-3xl font-bold text-emerald-dark">
            Welcome Back
          </h1>
          <p className="text-xs text-muted mt-1.5">
            Sign in to access your Career OS dashboard
          </p>
        </div>

        {apiError && (
          <div className="mb-4 p-3 rounded-ui bg-error-bg border border-error-border text-error text-xs font-medium">
            {apiError}
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

          <div>
            <div className="flex items-center justify-between mb-1">
              <span />
              <Link
                href={ROUTES.FORGOT_PASSWORD}
                className="text-[11px] font-semibold text-gold hover:text-emerald-dark transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              error={errors.password?.message}
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
              {...register("password")}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full mt-2 gap-2"
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </form>

        <div className="mt-6 text-center text-xs text-muted">
          Don&apos;t have an account?{" "}
          <Link href={ROUTES.REGISTER} className="font-semibold text-gold hover:text-emerald-dark underline">
            Create an account
          </Link>
        </div>
      </Card>
    </div>
  );
};

