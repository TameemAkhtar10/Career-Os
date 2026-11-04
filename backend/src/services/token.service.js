import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

// ── Cookie names ──────────────────────────────────────────────────────────────
export const ACCESS_COOKIE = "accessToken";
export const REFRESH_COOKIE = "refreshToken";

// ── Shared cookie base options ────────────────────────────────────────────────
const baseCookieOpts = {
  httpOnly: true,
  sameSite: "strict",
  secure: env.NODE_ENV === "production",
  path: "/",
};

// ── TTL helpers (parse "15m", "7d" → ms) ─────────────────────────────────────
const toMs = (str) => {
  const unit = str.slice(-1);
  const val = parseInt(str, 10);
  if (unit === "m") return val * 60 * 1000;
  if (unit === "h") return val * 60 * 60 * 1000;
  if (unit === "d") return val * 24 * 60 * 60 * 1000;
  return val * 1000; // fallback: treat as seconds
};

// ── Token generation ──────────────────────────────────────────────────────────

export const generateAccessToken = (userId, role) =>
  jwt.sign({ sub: String(userId), role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
  });

export const generateRefreshToken = (userId) =>
  jwt.sign({ sub: String(userId) }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  });

/** Short-lived token for email verification / password-reset flows (10 min) */
export const generateEmailToken = (payload) =>
  jwt.sign(payload, env.JWT_EMAIL_SECRET, { expiresIn: "10m" });

// ── Token verification ────────────────────────────────────────────────────────

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET);

export const verifyRefreshToken = (token) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET);

export const verifyEmailToken = (token) =>
  jwt.verify(token, env.JWT_EMAIL_SECRET);

// ── Cookie setters / clearers ─────────────────────────────────────────────────

/** Set both access and refresh tokens as httpOnly cookies */
export const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie(ACCESS_COOKIE, accessToken, {
    ...baseCookieOpts,
    maxAge: toMs(env.JWT_ACCESS_EXPIRES_IN),
  });
  res.cookie(REFRESH_COOKIE, refreshToken, {
    ...baseCookieOpts,
    maxAge: toMs(env.JWT_REFRESH_EXPIRES_IN),
  });
};

/** Clear both auth cookies */
export const clearAuthCookies = (res) => {
  res.clearCookie(ACCESS_COOKIE, baseCookieOpts);
  res.clearCookie(REFRESH_COOKIE, baseCookieOpts);
};

// Keep backward-compat aliases used nowhere now, but harmless
export const COOKIE_NAME = REFRESH_COOKIE;
