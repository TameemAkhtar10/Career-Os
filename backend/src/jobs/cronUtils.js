/**
 * Timezone and Date helper utilities for the internal Cron Scheduler.
 * Hardened for Asia/Kolkata (IST = UTC+05:30).
 */

const DOW_MAP = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

/**
 * Extracts date parts in target timezone (default Asia/Kolkata).
 * @param {Date} [date]
 * @param {string} [timeZone]
 * @returns {{ year: number, month: number, day: number, hour: number, minute: number, second: number, dow: number, dateStr: string }}
 */
export const getIstParts = (date = new Date(), timeZone = "Asia/Kolkata") => {
  const d = date instanceof Date ? date : new Date(date);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    weekday: "short",
    hour12: false,
  });

  const parts = formatter.formatToParts(d);
  const map = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }

  let hour = parseInt(map.hour, 10);
  if (hour === 24) hour = 0; // standard 24h clamp for midnight in en-US

  const year = parseInt(map.year, 10);
  const month = parseInt(map.month, 10);
  const day = parseInt(map.day, 10);
  const minute = parseInt(map.minute, 10);
  const second = parseInt(map.second, 10);
  const dow = DOW_MAP[map.weekday] ?? 0;

  const monthPadded = String(month).padStart(2, "0");
  const dayPadded = String(day).padStart(2, "0");
  const dateStr = `${year}-${monthPadded}-${dayPadded}`;

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    dow,
    dateStr,
  };
};

/**
 * Evaluates whether a numeric value matches a single cron field pattern.
 * Supports: '*', exact integer, 'start-end', 'list,of,values', 'start/step', and wildcard step like star-slash-step.
 */
export const matchCronField = (val, pattern, isDow = false) => {
  if (pattern === "*") return true;

  // Handle commas: e.g. "1,2,5"
  if (pattern.includes(",")) {
    return pattern.split(",").some((sub) => matchCronField(val, sub.trim(), isDow));
  }

  // Handle steps: e.g. "*/5" or "10-30/5"
  if (pattern.includes("/")) {
    const [range, stepStr] = pattern.split("/");
    const step = parseInt(stepStr, 10);
    if (isNaN(step) || step <= 0) return false;

    if (range === "*") {
      return val % step === 0;
    }
    if (range.includes("-")) {
      const [start, end] = range.split("-").map((s) => parseInt(s, 10));
      return val >= start && val <= end && (val - start) % step === 0;
    }
    const start = parseInt(range, 10);
    return val >= start && (val - start) % step === 0;
  }

  // Handle ranges: e.g. "1-5"
  if (pattern.includes("-")) {
    const [start, end] = pattern.split("-").map((s) => parseInt(s, 10));
    return val >= start && val <= end;
  }

  // Exact number
  const expected = parseInt(pattern, 10);
  if (isDow && expected === 7 && val === 0) return true; // 7 is Sunday in some cron formats
  return val === expected;
};

/**
 * Checks if a given Date's timezone parts match a 5-part cron expression.
 * Format: minute hour dayOfMonth month dayOfWeek
 */
export const matchCron = (parts, schedule) => {
  if (!schedule || typeof schedule !== "string") return false;
  const fields = schedule.trim().split(/\s+/);
  if (fields.length !== 5) return false;

  const [minPat, hourPat, domPat, monPat, dowPat] = fields;

  return (
    matchCronField(parts.minute, minPat) &&
    matchCronField(parts.hour, hourPat) &&
    matchCronField(parts.day, domPat) &&
    matchCronField(parts.month, monPat) &&
    matchCronField(parts.dow, dowPat, true)
  );
};

/**
 * Computes the next scheduled execution Date for a cron expression in target timezone.
 * Scans forward minute-by-minute starting after fromDate.
 */
export const computeNextRun = (
  schedule,
  timeZone = "Asia/Kolkata",
  fromDate = new Date()
) => {
  const startMs = fromDate instanceof Date ? fromDate.getTime() : new Date(fromDate).getTime();
  // Round to next whole minute (+1 minute boundary)
  let currentMs = Math.floor(startMs / 60000) * 60000 + 60000;

  // Scan up to 14 days (20,160 minutes)
  const maxScanMs = currentMs + 14 * 24 * 60 * 60 * 1000;

  while (currentMs <= maxScanMs) {
    const candidateDate = new Date(currentMs);
    const parts = getIstParts(candidateDate, timeZone);
    if (matchCron(parts, schedule)) {
      return candidateDate;
    }
    currentMs += 60000;
  }

  return null;
};

/**
 * Generates an idempotent period key for a job run so it can never run twice in the same period.
 * 
 * @param {string} jobName
 * @param {"hourly"|"daily"|"weekly"} scheduleType
 * @param {Date} [date]
 * @param {string} [timeZone]
 * @returns {string} e.g. "job-auto-close:2026-11-20" or "job-alerts:2026-11-20-11"
 */
export const getPeriodKey = (
  jobName,
  scheduleType,
  date = new Date(),
  timeZone = "Asia/Kolkata"
) => {
  const parts = getIstParts(date, timeZone);
  const hourPadded = String(parts.hour).padStart(2, "0");

  if (scheduleType === "hourly") {
    return `${jobName}:${parts.dateStr}-${hourPadded}`;
  }

  if (scheduleType === "weekly") {
    // Find the Monday date for this week in IST
    const d = new Date(date);
    // dow: 0=Sun, 1=Mon, ..., 6=Sat
    // Offset to get Monday: if Sun(0) -> -6, if Mon(1) -> 0, if Tue(2) -> -1, etc.
    const diffToMonday = parts.dow === 0 ? -6 : 1 - parts.dow;
    const mondayMs = d.getTime() + diffToMonday * 24 * 60 * 60 * 1000;
    const mondayParts = getIstParts(new Date(mondayMs), timeZone);
    return `${jobName}:${mondayParts.dateStr}`;
  }

  // Default: daily
  return `${jobName}:${parts.dateStr}`;
};

/**
 * Checks if a scheduled job was due within the last 6 hours and returns its scheduled time and periodKey.
 * Used for catch-up on server start.
 * 
 * @param {string} jobName
 * @param {"daily"|"weekly"} scheduleType
 * @param {string} schedule
 * @param {string} [timeZone]
 * @param {Date} [now]
 * @returns {{ isDue: boolean, scheduledTime?: Date, periodKey?: string }}
 */
export const checkDueWithinLast6Hours = (
  jobName,
  scheduleType,
  schedule,
  timeZone = "Asia/Kolkata",
  now = new Date()
) => {
  const nowMs = now instanceof Date ? now.getTime() : new Date(now).getTime();
  // 6 hours window
  const windowMs = 6 * 60 * 60 * 1000;
  const startWindowMs = nowMs - windowMs;

  // Step backwards from current minute down to startWindowMs (up to 360 steps)
  let currentMs = Math.floor(nowMs / 60000) * 60000;

  while (currentMs >= startWindowMs) {
    const candidateDate = new Date(currentMs);
    const parts = getIstParts(candidateDate, timeZone);

    if (matchCron(parts, schedule)) {
      const periodKey = getPeriodKey(jobName, scheduleType, candidateDate, timeZone);
      return {
        isDue: true,
        scheduledTime: candidateDate,
        periodKey,
      };
    }

    currentMs -= 60000;
  }

  return { isDue: false };
};

/**
 * Wraps a promise in a timeout guard.
 * Rejects if the promise takes longer than ms.
 * Unrefs timer to prevent holding the Node event loop open.
 */
export const withTimeout = (promise, ms, jobName = "Job") => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`[cron] ${jobName} timed out after ${ms / 1000}s`));
    }, ms);

    if (timer.unref) {
      timer.unref();
    }

    Promise.resolve(promise)
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

/**
 * Formats a Date object into a readable IST string for self-test logging.
 */
export const formatIstDateTime = (date = new Date()) => {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
};
