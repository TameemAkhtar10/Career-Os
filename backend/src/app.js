import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import { env } from "./config/env.js";
import { ApiError } from "./utils/ApiError.js";
import { getRedis } from "./config/redis.js"; // eager init — logs once on startup
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import jobRoutes from "./routes/job.routes.js";
import applicationRoutes from "./routes/application.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const app = express();

// Trigger Redis lazy init at startup so the first request doesn't pay the cost
getRedis();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet());

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: env.CLIENT_URL,
    credentials: true, // allow cookies to be sent cross-origin
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// ── Cookie parser ─────────────────────────────────────────────────────────────
app.use(cookieParser());

// ── HTTP request logger (skip in test) ───────────────────────────────────────
if (env.NODE_ENV !== "test") {
  app.use(morgan(env.NODE_ENV === "development" ? "dev" : "combined"));
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok", env: env.NODE_ENV });
});

// ── API routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/admin", adminRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, _res, next) => {
  next(new ApiError(404, "Route not found"));
});

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  const statusCode = err.isOperational ? err.statusCode : 500;
  const message = err.isOperational ? err.message : "Internal Server Error";

  if (env.NODE_ENV === "development") {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.errors?.length && { errors: err.errors }),
    ...(env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

export default app;
