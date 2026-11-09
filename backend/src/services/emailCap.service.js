import { env } from "../config/env.js";
import { DailyEmailCount } from "../models/dailyEmailCount.model.js";

/**
 * Returns today's date formatted as YYYY-MM-DD in the configured timezone.
 */
export const getTodayDateString = (timezone = env.CRON_TIMEZONE) => {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
};

/**
 * Increments today's sent email count in DailyEmailCount collection.
 * Non-blocking, fails safe with error logging so transactional emails never break.
 */
export const incrementDailyEmailCount = async (amount = 1) => {
  if (amount <= 0) return;
  try {
    const today = getTodayDateString();
    await DailyEmailCount.findOneAndUpdate(
      { date: today },
      { $inc: { count: amount } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  } catch (err) {
    console.error("[emailCap] Failed to increment daily email count:", err.message);
  }
};

/**
 * Gets the total count of emails sent so far today in the configured timezone.
 */
export const getTodayEmailCount = async () => {
  try {
    const today = getTodayDateString();
    const record = await DailyEmailCount.findOne({ date: today }).lean();
    return record?.count || 0;
  } catch (err) {
    console.error("[emailCap] Failed to read daily email count:", err.message);
    return 0;
  }
};

/**
 * Checks if adding `upcomingCount` emails would exceed the configured EMAIL_DAILY_CAP.
 */
export const hasReachedDailyCap = async (upcomingCount = 1) => {
  const currentCount = await getTodayEmailCount();
  return currentCount + upcomingCount > env.EMAIL_DAILY_CAP;
};

/**
 * Returns how many emails can still be sent today before hitting the cap.
 */
export const getRemainingDailyBudget = async () => {
  const currentCount = await getTodayEmailCount();
  return Math.max(0, env.EMAIL_DAILY_CAP - currentCount);
};

