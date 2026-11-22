import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getIstParts,
  matchCronField,
  matchCron,
  computeNextRun,
  getPeriodKey,
  checkDueWithinLast6Hours,
  withTimeout,
  formatIstDateTime,
} from "../src/jobs/cronUtils.js";
import { REGISTERED_JOBS, activeRuns } from "../src/jobs/scheduler.js";

describe("Internal Production Cron Scheduler", () => {
  describe("1. Job Registration & Schedules", () => {
    it("registers all 5 required jobs with Asia/Kolkata timezone", () => {
      const names = REGISTERED_JOBS.map((j) => j.name);
      assert.deepEqual(names.sort(), [
        "job-alerts",
        "job-auto-close",
        "job-digest",
        "profile-nudge",
        "recruiter-digest",
      ].sort());

      for (const job of REGISTERED_JOBS) {
        assert.equal(job.timezone, "Asia/Kolkata", `${job.name} should use Asia/Kolkata`);
        assert.ok(typeof job.runner === "function", `${job.name} must have a runner function`);
      }
    });

    it("verifies exact cron expressions match requirement specifications", () => {
      const scheduleMap = Object.fromEntries(REGISTERED_JOBS.map((j) => [j.name, j.schedule]));

      assert.equal(scheduleMap["job-auto-close"], "30 0 * * *", "Job Auto Close at 00:30 daily");
      assert.equal(scheduleMap["job-digest"], "0 9 * * *", "Job Digest at 09:00 daily");
      assert.equal(scheduleMap["profile-nudge"], "0 11 * * 1", "Profile Nudge at Monday 11:00");
      assert.equal(scheduleMap["recruiter-digest"], "0 18 * * *", "Recruiter Digest at 18:00 daily");
      assert.equal(scheduleMap["job-alerts"], "0 * * * *", "Job Alerts at minute 0 of every hour");
    });
  });

  describe("2. Timezone & Cron Matching (Asia/Kolkata = UTC+05:30)", () => {
    it("correctly extracts IST parts from a UTC Date", () => {
      // 2026-11-20T03:30:00.000Z in UTC is 2026-11-20 09:00:00 in IST (+5:30)
      const testDate = new Date("2026-11-20T03:30:00.000Z");
      const parts = getIstParts(testDate, "Asia/Kolkata");

      assert.equal(parts.year, 2026);
      assert.equal(parts.month, 11);
      assert.equal(parts.day, 20);
      assert.equal(parts.hour, 9);
      assert.equal(parts.minute, 0);
      assert.equal(parts.dateStr, "2026-11-20");
      assert.equal(parts.dow, 5); // Friday
    });

    it("matches cron field expressions properly", () => {
      // Wildcard
      assert.equal(matchCronField(15, "*"), true);
      // Exact number
      assert.equal(matchCronField(9, "9"), true);
      assert.equal(matchCronField(10, "9"), false);
      // List
      assert.equal(matchCronField(30, "0,15,30,45"), true);
      assert.equal(matchCronField(20, "0,15,30,45"), false);
      // Range
      assert.equal(matchCronField(3, "1-5"), true);
      assert.equal(matchCronField(6, "1-5"), false);
      // Step
      assert.equal(matchCronField(20, "*/10"), true);
      assert.equal(matchCronField(25, "*/10"), false);
      // DOW Sunday: 7 or 0
      assert.equal(matchCronField(0, "7", true), true);
    });

    it("validates full 5-part cron expressions in IST", () => {
      // Friday 09:00 IST
      const fri9am = new Date("2026-11-20T03:30:00.000Z");
      const partsFri9am = getIstParts(fri9am, "Asia/Kolkata");

      assert.equal(matchCron(partsFri9am, "0 9 * * *"), true);
      assert.equal(matchCron(partsFri9am, "30 0 * * *"), false);
      assert.equal(matchCron(partsFri9am, "0 * * * *"), true);
      assert.equal(matchCron(partsFri9am, "0 11 * * 1"), false); // not Monday
    });
  });

  describe("3. Next Run Computation", () => {
    it("computes next run time for daily jobs", () => {
      // Current: 2026-11-20 08:00:00 IST (02:30:00 UTC)
      const current = new Date("2026-11-20T02:30:00.000Z");
      const nextRun = computeNextRun("0 9 * * *", "Asia/Kolkata", current);

      assert.ok(nextRun instanceof Date);
      const nextParts = getIstParts(nextRun, "Asia/Kolkata");
      assert.equal(nextParts.day, 20);
      assert.equal(nextParts.hour, 9);
      assert.equal(nextParts.minute, 0);
    });

    it("computes next run time for hourly jobs", () => {
      // Current: 2026-11-20 11:15:00 IST
      const current = new Date("2026-11-20T05:45:00.000Z");
      const nextRun = computeNextRun("0 * * * *", "Asia/Kolkata", current);

      assert.ok(nextRun instanceof Date);
      const nextParts = getIstParts(nextRun, "Asia/Kolkata");
      assert.equal(nextParts.hour, 12);
      assert.equal(nextParts.minute, 0);
    });

    it("computes next run time for weekly jobs (Monday 11:00)", () => {
      // Current: Friday 2026-11-20 12:00:00 IST
      const current = new Date("2026-11-20T06:30:00.000Z");
      const nextRun = computeNextRun("0 11 * * 1", "Asia/Kolkata", current);

      assert.ok(nextRun instanceof Date);
      const nextParts = getIstParts(nextRun, "Asia/Kolkata");
      assert.equal(nextParts.dow, 1, "Must be Monday");
      assert.equal(nextParts.day, 23, "Next Monday is 23rd Nov");
      assert.equal(nextParts.hour, 11);
      assert.equal(nextParts.minute, 0);
    });
  });

  describe("4. Period Key & Double-Run Prevention", () => {
    it("generates deterministic period keys for hourly, daily, and weekly jobs", () => {
      // Friday 2026-11-20 14:25:00 IST
      const date = new Date("2026-11-20T08:55:00.000Z");

      const hourlyKey = getPeriodKey("job-alerts", "hourly", date, "Asia/Kolkata");
      assert.equal(hourlyKey, "job-alerts:2026-11-20-14");

      const dailyKey = getPeriodKey("job-digest", "daily", date, "Asia/Kolkata");
      assert.equal(dailyKey, "job-digest:2026-11-20");

      const weeklyKey = getPeriodKey("profile-nudge", "weekly", date, "Asia/Kolkata");
      // Monday of this week was 2026-11-16
      assert.equal(weeklyKey, "profile-nudge:2026-11-16");
    });
  });

  describe("5. Catch-Up Logic on Startup", () => {
    it("detects when a daily job was due within the last 6 hours", () => {
      // Suppose server starts at 02:00 IST (today 00:30 was 1.5h ago <= 6h)
      // 02:00 IST on 2026-11-20 is 2026-11-19T20:30:00.000Z UTC
      const now = new Date("2026-11-19T20:30:00.000Z");
      const dueCheck = checkDueWithinLast6Hours("job-auto-close", "daily", "30 0 * * *", "Asia/Kolkata", now);

      assert.equal(dueCheck.isDue, true);
      assert.equal(dueCheck.periodKey, "job-auto-close:2026-11-20");
    });

    it("does NOT trigger catch-up if scheduled time was > 6 hours ago", () => {
      // Suppose server starts at 08:00 IST (today 00:30 was 7.5h ago > 6h)
      // 08:00 IST on 2026-11-20 is 2026-11-20T02:30:00.000Z UTC
      const now = new Date("2026-11-20T02:30:00.000Z");
      const dueCheck = checkDueWithinLast6Hours("job-auto-close", "daily", "30 0 * * *", "Asia/Kolkata", now);

      assert.equal(dueCheck.isDue, false);
    });

    it("evaluates weekly job catch-up accurately on Monday", () => {
      // Monday 2026-11-23 13:00 IST (11:00 was 2 hours ago <= 6h)
      // 13:00 IST is 07:30 UTC
      const monday1300 = new Date("2026-11-23T07:30:00.000Z");
      const dueCheck = checkDueWithinLast6Hours("profile-nudge", "weekly", "0 11 * * 1", "Asia/Kolkata", monday1300);

      assert.equal(dueCheck.isDue, true);
      assert.equal(dueCheck.periodKey, "profile-nudge:2026-11-23");

      // On Tuesday 13:00 IST (26 hours ago > 6h) -> NOT due
      const tuesday1300 = new Date("2026-11-24T07:30:00.000Z");
      const dueCheckTue = checkDueWithinLast6Hours("profile-nudge", "weekly", "0 11 * * 1", "Asia/Kolkata", tuesday1300);
      assert.equal(dueCheckTue.isDue, false);
    });
  });

  describe("6. Overlap Guard & Timeout Safety", () => {
    it("in-memory overlap guard tracks active runs", () => {
      const jobName = "job-digest";
      assert.equal(activeRuns.has(jobName), false);

      activeRuns.add(jobName);
      assert.equal(activeRuns.has(jobName), true);

      // Clean up
      activeRuns.delete(jobName);
      assert.equal(activeRuns.has(jobName), false);
    });

    it("withTimeout resolves fast promise successfully", async () => {
      const fastPromise = Promise.resolve({ ok: true });
      const result = await withTimeout(fastPromise, 1000, "fast-job");
      assert.deepEqual(result, { ok: true });
    });

    it("withTimeout rejects when promise exceeds timeout limit", async () => {
      const slowPromise = new Promise((resolve) => setTimeout(resolve, 200));

      await assert.rejects(
        () => withTimeout(slowPromise, 50, "slow-job"),
        /timed out/
      );
    });
  });

  describe("7. Safe Formatting & Self-Test", () => {
    it("regression: cronUtils module loads cleanly without premature comment closures", () => {
      assert.ok(typeof matchCronField === "function");
      assert.ok(matchCronField(10, "*/5"), "Wildcard step like */5 must match correctly");
    });

    it("formats IST datetime string cleanly for self-test without secrets", () => {
      const testDate = new Date("2026-11-20T03:30:00.000Z");
      const formatted = formatIstDateTime(testDate);

      assert.ok(typeof formatted === "string");
      assert.ok(formatted.includes("2026") || formatted.includes("20"));
    });
  });
});
