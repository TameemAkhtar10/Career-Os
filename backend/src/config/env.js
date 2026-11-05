import dotenv from "dotenv";
dotenv.config();

const requiredKeys = [
  "MONGO_URI",
  "CLIENT_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "JWT_EMAIL_SECRET",
];

const missingKeys = requiredKeys.filter((key) => !process.env[key]);
if (missingKeys.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingKeys.join(", ")}`
  );
}

const _optional = (key, fallback = "") => process.env[key] || fallback;

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || "development",

  MONGO_URI: process.env.MONGO_URI,
  CLIENT_URL: process.env.CLIENT_URL,
  FRONTEND_URL: _optional("FRONTEND_URL", process.env.CLIENT_URL || "http://localhost:3001"),

  // JWT
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_EMAIL_SECRET: process.env.JWT_EMAIL_SECRET,
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
};
