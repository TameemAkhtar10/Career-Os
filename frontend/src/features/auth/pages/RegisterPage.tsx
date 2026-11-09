"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, RegisterFormData } from "../schemas";
import { authApi } from "../services/auth.api";
import { ApiClientError, mapApiErrorsToForm } from "../../../config/api";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { ROUTES } from "../../../constants/routes";
import { Card } from "../../../components/ui/Card";
import { Logo } from "../../../components/layout/Logo";
import { User, Briefcase, Eye, EyeOff, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const RegisterPage: React.FC = () => {
  const router = useRouter();
  const [role, setRole] = useState<"candidate" | "recruiter">("candidate");
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "candidate",
      name: "",
      email: "",
      password: "",
    },
  });

  const passwordValue = watch("password") || "";

  // Password strength meter calculation:
  // Requires min 8 chars, at least one letter, at least one number
  const hasMinLength = passwordValue.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);
  const hasSpecial = /[^a-zA-Z0-9]/.test(passwordValue);

  let strengthScore = 0;
  if (hasMinLength) strengthScore += 1;
  if (hasLetter) strengthScore += 1;
  if (hasNumber) strengthScore += 1;
  if (hasSpecial) strengthScore += 1;

  const strengthLabels = ["Weak", "Fair", "Good", "Strong"];
  const strengthColors = [
    "bg-error",
    "bg-gold",
    "bg-emerald",
    "bg-success",
  ];

  const onSubmit = async (data: RegisterFormData) => {
    setApiError(null);
    try {
      const res = await authApi.register({ ...data, role });
      toast.success(res.message || "Account created. Check your email for OTP.");
      router.push(`/verify-email?email=${encodeURIComponent(data.email)}`);
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        if (err.statusCode === 409) {
          setError("email", {
            type: "server",
            message: "An account with this email already exists.",
          });
        } else {
          mapApiErrorsToForm(err.errors, setError);
          setApiError(err.message);
        }
      } else {
        setApiError("Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-[500px] bg-cream border border-border shadow-emerald-lg p-7 sm:p-9 relative">
        {/* Top gold bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald via-gold to-emerald rounded-t-card" />

        <div className="text-center pt-2 pb-6">
          <div className="flex justify-center mb-4">
            <Logo size="md" />
          </div>
          <h1 className="font-display text-3xl font-bold tracking-[-0.01em] text-emerald-dark">
            Create Your Account
          </h1>
          <p className="text-xs text-muted mt-1.5">
            Join the verified platform for early-career opportunities
          </p>
        </div>

        {/* Candidate / Recruiter Toggle */}
        <div className="mb-6 p-1.5 bg-champagne/60 border border-border rounded-ui flex gap-1.5">
          <button
            type="button"
            onClick={() => setRole("candidate")}
            className={`flex-1 py-2 px-3 rounded-ui text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              role === "candidate"
                ? "bg-gradient-to-r from-emerald to-emerald-dark text-white shadow-emerald-sm"
                : "text-body hover:bg-cream/60"
            }`}
          >
            <User className="w-4 h-4" />
            <span>I am a Candidate</span>
          </button>
          <button
            type="button"
            onClick={() => setRole("recruiter")}
            className={`flex-1 py-2 px-3 rounded-ui text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
              role === "recruiter"
                ? "bg-gradient-to-r from-emerald to-emerald-dark text-white shadow-emerald-sm"
                : "text-body hover:bg-cream/60"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>I am a Recruiter</span>
          </button>
        </div>

        {apiError && (
          <div className="mb-4 p-3 rounded-ui bg-error-bg border border-error-border text-error text-xs font-medium">
            {apiError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. Priyanshu Sharma"
            error={errors.name?.message}
            {...register("name")}
          />

          <Input
            label={role === "candidate" ? "Email Address" : "Company Email"}
            type="email"
            placeholder="e.g. name@example.com"
            error={errors.email?.message}
            {...register("email")}
          />

          <div>
            <Input
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="At least 8 characters"
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

            {/* Password strength meter */}
            {passwordValue.length > 0 && (
              <div className="mt-2.5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted">Password strength</span>
                  <span className="font-semibold text-emerald-dark">
                    {strengthLabels[Math.max(0, strengthScore - 1)]}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {[0, 1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        step < strengthScore
                          ? strengthColors[strengthScore - 1]
                          : "bg-border/60"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
            <p className="text-[11px] text-muted mt-1.5 leading-tight">
              Must be 8+ characters with at least one letter and one number.
            </p>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            className="w-full mt-2 gap-2"
          >
            <span>Create Account</span>
            <ArrowRight className="w-4 h-4" />
          </Button>

          <p className="text-[11px] text-center text-muted mt-3 leading-normal">
            By creating an account you agree to our{" "}
            <Link
              href={ROUTES.TERMS}
              className="text-emerald-dark font-medium underline hover:text-gold transition-colors"
            >
              Terms
            </Link>{" "}
            and{" "}
            <Link
              href={ROUTES.PRIVACY}
              className="text-emerald-dark font-medium underline hover:text-gold transition-colors"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </form>

        <div className="mt-6 text-center text-xs text-muted">
          Already have an account?{" "}
          <Link href={ROUTES.LOGIN} className="font-semibold text-gold hover:text-emerald-dark underline">
            Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
};

