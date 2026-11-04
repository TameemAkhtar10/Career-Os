"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../config/store";
import { setAuthUser, logoutUser } from "../features/auth/state/authSlice";
import { authApi } from "../features/auth/services/auth.api";
import { BrandLoader } from "../components/feedback/BrandLoader";
import { User } from "../types/user";
import { ROUTES } from "../constants/routes";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  logout: async () => {},
  refreshUser: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isInitialized } = useSelector((state: RootState) => state.auth);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const loadUser = async () => {
    try {
      const res = await authApi.getMe();
      if (res.success && res.data) {
        dispatch(setAuthUser(res.data));
      } else {
        dispatch(setAuthUser(null));
      }
    } catch {
      dispatch(setAuthUser(null));
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // Client-side route guard enforcement
  useEffect(() => {
    if (isInitialLoading) return;

    const isAuthRoute =
      pathname === "/login" ||
      pathname === "/register" ||
      pathname === "/verify-email" ||
      pathname === "/forgot-password" ||
      pathname === "/reset-password";

    const isCandidateRoute = pathname.startsWith("/candidate");
    const isRecruiterRoute = pathname.startsWith("/recruiter");

    if (isAuthenticated && user) {
      // If on auth routes, redirect to role home
      if (isAuthRoute) {
        const nextUrl = searchParams.get("next");
        if (nextUrl && nextUrl.startsWith("/")) {
          router.replace(nextUrl);
        } else if (user.role === "recruiter") {
          router.replace(ROUTES.RECRUITER.DASHBOARD);
        } else {
          router.replace(ROUTES.JOBS);
        }
        return;
      }

      // Check role permissions
      if (isCandidateRoute && user.role !== "candidate") {
        router.replace(ROUTES.SYSTEM.FORBIDDEN);
        return;
      }
      if (isRecruiterRoute && user.role !== "recruiter") {
        router.replace(ROUTES.SYSTEM.FORBIDDEN);
        return;
      }
    } else {
      // Unauthenticated users trying to access protected routes
      if (isCandidateRoute || isRecruiterRoute) {
        const next = encodeURIComponent(pathname);
        router.replace(`/login?next=${next}`);
      }
    }
  }, [isAuthenticated, user, pathname, isInitialLoading, searchParams, router]);

  const logout = async () => {
    try {
      await authApi.logout();
      dispatch(logoutUser());
      toast.success("Logged out successfully");
      router.push(ROUTES.LOGIN);
    } catch {
      dispatch(logoutUser());
      router.push(ROUTES.LOGIN);
    }
  };

  if (isInitialLoading) {
    return <BrandLoader message="Authenticating session..." />;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isInitialized,
        logout,
        refreshUser: loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

