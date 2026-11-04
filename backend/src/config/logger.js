import pino from "pino";
import pinoHttp from "pino-http";
import crypto from "crypto";
import { env } from "./env.js";

export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : env.NODE_ENV === "production" ? "info" : "debug",
  redact: {
    paths: [
      "req.headers.cookie",
      "req.headers.authorization",
      "req.body.password",
      "req.body.newPassword",
      "req.body.otp",
      "password",
      "newPassword",
      "otp",
      "refreshTokenHash",
    ],
    remove: false,
    censor: "[REDACTED]",
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => req.headers["x-request-id"] || crypto.randomUUID(),
  customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
  customErrorMessage: (req, res, err) => `${req.method} ${req.url} ${res.statusCode} - ${err.message}`,
  autoLogging: {
    ignore: (req) => req.url === "/api/health" || req.url === "/api/ready",
  },
  customProps: (req, res) => {
    // Expose X-Request-Id header in response
    const reqId = req.id || req.headers["x-request-id"];
    if (reqId) {
      res.setHeader("X-Request-Id", reqId);
    }
    return { reqId };
  },
});
