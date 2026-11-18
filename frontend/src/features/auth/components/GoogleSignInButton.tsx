"use client";

import React, { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { authApi } from "../services/auth.api";
import { ApiClientError } from "../../../config/api";
import { User as UserType } from "../../../types/user";
import { Button } from "../../../components/ui/Button";
import { useGoogleScriptReady, googleScriptStore } from "../services/googleScriptStore";
import { Briefcase, User as UserIcon, X, Loader2 } from "lucide-react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: "standard" | "icon";
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              text?: "signin_with" | "signup_with" | "continue_with" | "signin";
              shape?: "rectangular" | "pill" | "circle" | "square";
              logo_alignment?: "left" | "center";
              width?: number | string;
            }
          ) => void;
        };
      };
    };
  }
}

// Module-level guard: initialize GIS only once per page
let isGisInitialized = false;
// Active callback dispatcher pointing to the currently mounted button
let activeCredentialHandler: ((credential: string) => void) | null = null;

export interface GoogleSignInButtonProps {
  role?: "candidate" | "recruiter";
  onSuccess: (user: UserType, isNewUser?: boolean) => void;
  onError?: (message: string) => void;
  showDivider?: boolean;
  className?: string;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  role,
  onSuccess,
  onError,
  showDivider = true,
  className = "",
}) => {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const { isReady: scriptReady, isFailed: scriptFailed } = useGoogleScriptReady();

  const [isRendered, setIsRendered] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [isRenderFailed, setIsRenderFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // In-memory credential stored ONLY while role selection dialog is open
  const [pendingCredential, setPendingCredential] = useState<string | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);

  const handleGoogleResponse = async (
    credential: string,
    explicitRole?: "candidate" | "recruiter"
  ) => {
    setIsSubmitting(true);
    const targetRole = explicitRole || role;

    try {
      const res = await authApi.googleSignIn({
        credential,
        role: targetRole,
      });

      if (res.data?.needsRole) {
        // Prompt role selection dialog for new users
        setPendingCredential(credential);
        setShowRoleDialog(true);
        setIsSubmitting(false);
        return;
      }

      if (res.data?.user) {
        // Clear credential immediately
        setPendingCredential(null);
        setShowRoleDialog(false);
        onSuccess(res.data.user, res.data.isNewUser);
      }
    } catch (err: any) {
      setPendingCredential(null);
      setShowRoleDialog(false);

      let errorMessage = "Google sign-in failed. Please try again.";

      if (err instanceof ApiClientError) {
        if (err.statusCode === 403) {
          if (err.message?.toLowerCase().includes("admin")) {
            errorMessage = "Admin accounts must use email and password.";
          } else {
            errorMessage = err.message || "Your account has been suspended. Please contact support.";
          }
        } else if (err.statusCode === 429) {
          errorMessage = "Too many requests. Please try again later.";
        } else if (err.statusCode === 503) {
          errorMessage = "Google sign-in is not configured.";
        } else if (err.statusCode === 401) {
          errorMessage = err.message || "Google sign-in failed.";
        } else {
          errorMessage = err.message || errorMessage;
        }
      }

      toast.error(errorMessage);
      if (onError) onError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keep a stable ref to handleGoogleResponse so activeCredentialHandler always runs latest
  const handleResponseRef = useRef(handleGoogleResponse);
  handleResponseRef.current = handleGoogleResponse;

  const handleRoleSelection = async (selectedRole: "candidate" | "recruiter") => {
    if (!pendingCredential) return;
    const cred = pendingCredential;
    setPendingCredential(null);
    setShowRoleDialog(false);
    await handleGoogleResponse(cred, selectedRole);
  };

  const renderOfficialButton = () => {
    if (!buttonContainerRef.current || !window.google?.accounts?.id || !clientId) {
      return false;
    }

    // Clear container to prevent duplicate buttons in React StrictMode
    buttonContainerRef.current.innerHTML = "";

    // Initialize once per page
    if (!isGisInitialized) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response?.credential && activeCredentialHandler) {
              activeCredentialHandler(response.credential);
            }
          },
          cancel_on_tap_outside: true,
        });
        isGisInitialized = true;
      } catch (err: any) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[GoogleSignIn] initialize threw error:", err?.message || "Unknown error");
        }
        setIsRenderFailed(true);
        return false;
      }
    }

    try {
      const containerWidth = buttonContainerRef.current.offsetWidth || 380;
      const buttonWidth = Math.min(400, Math.max(200, containerWidth));

      window.google.accounts.id.renderButton(buttonContainerRef.current, {
        theme: "outline",
        size: "large",
        text: "continue_with",
        shape: "rectangular",
        width: buttonWidth,
        logo_alignment: "left",
      });
      setIsRendered(true);
      return true;
    } catch (err: any) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[GoogleSignIn] renderButton threw error:", err?.message || "Unknown error");
      }
      setIsRenderFailed(true);
      return false;
    }
  };

  // Effect to render button when GIS is ready or poll every 200ms up to 10s
  useEffect(() => {
    if (!clientId || isTimedOut || isRenderFailed || scriptFailed) {
      return;
    }

    activeCredentialHandler = (cred: string) => {
      handleResponseRef.current(cred);
    };

    // If script is already ready on mount (or client-side navigation)
    if (window.google?.accounts?.id) {
      renderOfficialButton();
      return () => {
        activeCredentialHandler = null;
      };
    }

    // Otherwise poll every 200ms for up to 10 seconds
    const startTime = Date.now();
    const pollInterval = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(pollInterval);
        googleScriptStore.setStatus("ready");
        renderOfficialButton();
        return;
      }

      if (Date.now() - startTime >= 10000) {
        clearInterval(pollInterval);
        setIsTimedOut(true);
        if (process.env.NODE_ENV !== "production") {
          console.warn("[GoogleSignIn] GIS script polling timed out after 10s. Hiding Google button.");
        }
      }
    }, 200);

    return () => {
      clearInterval(pollInterval);
      activeCredentialHandler = null;
    };
  }, [scriptReady, clientId, isTimedOut, isRenderFailed, scriptFailed]);

  // If client ID missing, script failed, or timed out: hide the whole block silently
  if (!clientId || scriptFailed || isTimedOut || isRenderFailed) {
    return null;
  }

  return (
    <>
      {showDivider && (
        <div className="relative my-5 w-full">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-cream px-2 text-muted font-medium">or</span>
          </div>
        </div>
      )}

      <div className={`w-full flex flex-col items-center relative ${className}`}>
        {isSubmitting && (
          <div className="absolute inset-0 bg-cream/70 backdrop-blur-xs flex items-center justify-center rounded-ui z-20">
            <Loader2 className="w-5 h-5 text-emerald animate-spin" />
          </div>
        )}

        <div className="relative w-full min-h-[44px] flex items-center justify-center">
          {/* Skeleton placeholder while GIS script loads or button renders */}
          {!isRendered && (
            <div
              className="w-full h-[44px] rounded-ui bg-champagne/60 border border-border/60 animate-pulse flex items-center justify-center gap-3 px-4 shadow-emerald-sm pointer-events-none select-none"
              aria-hidden="true"
            >
              <div className="w-4 h-4 rounded-full bg-champagne-border/80 shrink-0" />
              <div className="w-36 h-3.5 rounded bg-champagne-border/80" />
            </div>
          )}

          {/* Official Google button rendered into this ref */}
          <div
            ref={buttonContainerRef}
            className={`w-full flex justify-center [&>div]:!w-full [&_iframe]:!w-full min-h-[44px] ${
              !isRendered ? "absolute opacity-0 pointer-events-none" : "opacity-100"
            }`}
          />
        </div>
      </div>

      {/* Role Selection Dialog for new users signing in via Google without a preset role */}
      {showRoleDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="role-dialog-title"
        >
          <div className="bg-cream border border-border rounded-card p-6 sm:p-7 max-w-md w-full shadow-emerald-lg relative space-y-4">
            <button
              onClick={() => {
                setShowRoleDialog(false);
                setPendingCredential(null);
              }}
              className="absolute top-4 right-4 text-muted hover:text-body transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1.5 pt-1">
              <h3
                id="role-dialog-title"
                className="font-display text-2xl font-bold text-emerald-dark"
              >
                Welcome to Career OS
              </h3>
              <p className="text-xs text-muted">
                Are you looking for a job or hiring talent?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => handleRoleSelection("candidate")}
                className="p-4 rounded-ui border-2 border-border hover:border-emerald bg-white hover:bg-champagne/30 transition-all text-left flex flex-col items-start gap-2 group"
              >
                <div className="p-2 rounded-ui bg-champagne text-emerald group-hover:bg-emerald group-hover:text-white transition-colors">
                  <UserIcon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-dark">Candidate</div>
                  <div className="text-[11px] text-muted">I am looking for early-career roles</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSelection("recruiter")}
                className="p-4 rounded-ui border-2 border-border hover:border-emerald bg-white hover:bg-champagne/30 transition-all text-left flex flex-col items-start gap-2 group"
              >
                <div className="p-2 rounded-ui bg-champagne text-emerald group-hover:bg-emerald group-hover:text-white transition-colors">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-dark">Recruiter</div>
                  <div className="text-[11px] text-muted">I am hiring candidates for my company</div>
                </div>
              </button>
            </div>

            <div className="pt-2 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowRoleDialog(false);
                  setPendingCredential(null);
                }}
                className="text-xs text-muted"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
