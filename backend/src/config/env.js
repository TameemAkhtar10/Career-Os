import dotenv from "dotenv";
dotenv.config();

const _required = (key) => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env variable: ${key}`);
  return val;
};

const _optional = (key, fallback = "") => process.env[key] || fallback;

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",

  MONGO_URI: _required("MONGO_URI"),
  CLIENT_URL: _required("CLIENT_URL"),
  FRONTEND_URL: _optional("FRONTEND_URL", process.env.CLIENT_URL || "http://localhost:3001"),

  // JWT
  JWT_ACCESS_SECRET: _required("JWT_ACCESS_SECRET"),
  JWT_REFRESH_SECRET: _required("JWT_REFRESH_SECRET"),
  JWT_EMAIL_SECRET: _required("JWT_EMAIL_SECRET"),
  JWT_ACCESS_EXPIRES_IN: _optional("JWT_ACCESS_EXPIRES_IN", "15m"),
  JWT_REFRESH_EXPIRES_IN: _optional("JWT_REFRESH_EXPIRES_IN", "7d"),

  // Brevo Transactional Email (REST API — no SMTP)
  BREVO_API_KEY: _optional("BREVO_API_KEY"),  // validated lazily on first send
  EMAIL_FROM: _optional("EMAIL_FROM"),         // must be a verified sender in Brevo

  // Redis — optional. App works without it (caching disabled, in-memory rate limiting).
  REDIS_URL: _optional("REDIS_URL"),

  // ImageKit file storage (validated lazily when uploading)
  IMAGEKIT_PUBLIC_KEY: _optional("IMAGEKIT_PUBLIC_KEY"),
  IMAGEKIT_PRIVATE_KEY: _optional("IMAGEKIT_PRIVATE_KEY"),
  IMAGEKIT_URL_ENDPOINT: _optional("IMAGEKIT_URL_ENDPOINT"),

  // Sentry error monitoring (optional)
  SENTRY_DSN: _optional("SENTRY_DSN"),
};
