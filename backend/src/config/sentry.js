import * as Sentry from "@sentry/node";
import { env } from "./env.js";

let isSentryInitialized = false;

export const initSentry = (app) => {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === "production" ? 0.2 : 1.0,
    beforeSend(event, hint) {
      // Filter out non-5xx operational client errors
      const error = hint?.originalException;
      if (error && typeof error === "object" && "statusCode" in error) {
        if (error.statusCode < 500) {
          return null;
        }
      }

      // Redact sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.cookie;
        delete event.request.headers.authorization;
      }

      // Redact sensitive body fields
      if (event.request?.data && typeof event.request.data === "object") {
        delete event.request.data.password;
        delete event.request.data.newPassword;
        delete event.request.data.otp;
      }

      return event;
    },
  });

  isSentryInitialized = true;
};

export const captureException = (err) => {
  if (isSentryInitialized) {
    Sentry.captureException(err);
  }
};
