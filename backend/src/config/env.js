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

  // Scheduled Emails & Cron (all optional, CRON_SECRET validated on cron endpoints)
  CRON_SECRET: _optional("CRON_SECRET"),
  ENABLE_INTERNAL_CRON: process.env.ENABLE_INTERNAL_CRON === "true",
  CRON_TIMEZONE: _optional("CRON_TIMEZONE", "Asia/Kolkata"),
  JOB_DIGEST_CRON: _optional("JOB_DIGEST_CRON", "0 9 * * *"),
  RECRUITER_DIGEST_CRON: _optional("RECRUITER_DIGEST_CRON", "0 18 * * *"),
  JOB_CLOSE_CRON: _optional("JOB_CLOSE_CRON", "30 0 * * *"),
  PROFILE_NUDGE_CRON: _optional("PROFILE_NUDGE_CRON", "0 11 * * 1"),
  EMAIL_DAILY_CAP: parseInt(_optional("EMAIL_DAILY_CAP", "250"), 10) || 250,

  // AI Resume Checker (optional at startup, validated lazily on first call)
  AI_PROVIDER: _optional("AI_PROVIDER", "mistral"),
  MISTRAL_API_KEY: _optional("MISTRAL_API_KEY"),
  MISTRAL_MODEL: _optional("MISTRAL_MODEL", "mistral-small-latest"),
  GEMINI_API_KEY: _optional("GEMINI_API_KEY"),
  GEMINI_MODEL: _optional("GEMINI_MODEL", "gemini-1.5-flash"),
  GROQ_API_KEY: _optional("GROQ_API_KEY"),
  GROQ_MODEL: _optional("GROQ_MODEL"),
  RESUME_ANALYSIS_DAILY_LIMIT: parseInt(_optional("RESUME_ANALYSIS_DAILY_LIMIT", "5"), 10) || 5,
};
