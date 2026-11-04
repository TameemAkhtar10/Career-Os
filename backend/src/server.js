import mongoose from "mongoose";
import { env } from "./config/env.js";
import { connectDB } from "./config/db.js";
import { Otp } from "./models/otp.model.js";
import { logger } from "./config/logger.js";
import { captureException } from "./config/sentry.js";
import app from "./app.js";

let server;

const start = async () => {
  await connectDB();
  await Otp.syncIndexes();

  server = app.listen(env.PORT, () => {
    logger.info(`🚀 Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    console.log(`🚀 Server running on port ${env.PORT} [${env.NODE_ENV}]`);
  });
};

// ── Graceful Shutdown ─────────────────────────────────────────────────────────
const gracefulShutdown = (signal) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  const forceExitTimer = setTimeout(() => {
    logger.error("Forceful shutdown after 10s timeout.");
    console.error("Forceful shutdown after 10s timeout.");
    process.exit(1);
  }, 10000);
  forceExitTimer.unref();

  if (server) {
    server.close(async () => {
      logger.info("HTTP server closed.");
      try {
        await mongoose.connection.close();
        logger.info("MongoDB connection closed.");
        console.log("Database connection closed cleanly.");
        process.exit(0);
      } catch (err) {
        logger.error({ err }, "Error closing MongoDB connection.");
        process.exit(1);
      }
    });
  } else {
    process.exit(0);
  }
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// ── Unhandled Exceptions & Rejections ─────────────────────────────────────────
process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled Promise Rejection caught");
  console.error("❌ Unhandled Promise Rejection:", reason);
  captureException(reason);
});

process.on("uncaughtException", (error) => {
  logger.fatal({ error }, "Uncaught Exception caught");
  console.error("💥 Uncaught Exception:", error);
  captureException(error);
  process.exit(1);
});

start();
