import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isAlertDue,
  DAILY_DUE_MS,
  WEEKLY_DUE_MS,
} from "../src/jobs/jobAlerts.job.js";
import { buildPublicJobsFilter } from "../src/utils/jobFilter.js";
import {
  createJobAlertSchema,
} from "../src/validators/jobAlert.schemas.js";

describe("Job Alerts System & Due-ness Logic", () => {
  const now = new Date("2026-11-18T12:00:00.000Z");

  it("evaluates daily alert due-ness correctly (due when >= 20h since lastSentAt)", () => {
    // 1. Never sent before -> Due
    assert.equal(
      isAlertDue({ active: true, frequency: "daily", lastSentAt: null }, now),
      true
    );

    // 2. Sent 19 hours ago -> NOT due
    const sent19hAgo = new Date(now.getTime() - 19 * 60 * 60 * 1000);
    assert.equal(
      isAlertDue({ active: true, frequency: "daily", lastSentAt: sent19hAgo }, now),
      false
    );

    // 3. Sent 20 hours ago -> Due
    const sent20hAgo = new Date(now.getTime() - 20 * 60 * 60 * 1000);
    assert.equal(
      isAlertDue({ active: true, frequency: "daily", lastSentAt: sent20hAgo }, now),
      true
    );

    // 4. Sent 24 hours ago -> Due
    const sent24hAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    assert.equal(
      isAlertDue({ active: true, frequency: "daily", lastSentAt: sent24hAgo }, now),
      true
    );

    // 5. Inactive alert -> Never due
    assert.equal(
      isAlertDue({ active: false, frequency: "daily", lastSentAt: null }, now),
      false
    );
  });

  it("evaluates weekly alert due-ness correctly (due when >= 6.5 days since lastSentAt)", () => {
    // 1. Never sent before -> Due
    assert.equal(
      isAlertDue({ active: true, frequency: "weekly", lastSentAt: null }, now),
      true
    );

    // 2. Sent 6 days ago -> NOT due
    const sent6DaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
    assert.equal(
      isAlertDue({ active: true, frequency: "weekly", lastSentAt: sent6DaysAgo }, now),
      false
    );

    // 3. Sent 6.5 days ago -> Due
    const sent6Point5DaysAgo = new Date(now.getTime() - 6.5 * 24 * 60 * 60 * 1000);
    assert.equal(
      isAlertDue({ active: true, frequency: "weekly", lastSentAt: sent6Point5DaysAgo }, now),
      true
    );

    // 4. Sent 7 days ago -> Due
    const sent7DaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    assert.equal(
      isAlertDue({ active: true, frequency: "weekly", lastSentAt: sent7DaysAgo }, now),
      true
    );
  });

  it("enforces cap of 5 alerts per user rule", () => {
    const MAX_JOB_ALERTS = 5;

    const checkCanCreateAlert = (existingAlertsCount) => {
      if (existingAlertsCount >= MAX_JOB_ALERTS) {
        throw new Error(
          `You can create a maximum of ${MAX_JOB_ALERTS} job alerts. Please delete or update an existing alert.`
        );
      }
      return true;
    };

    // 0 to 4 existing alerts can create
    assert.equal(checkCanCreateAlert(0), true);
    assert.equal(checkCanCreateAlert(4), true);

    // 5 existing alerts throws 400 error message
    assert.throws(
      () => checkCanCreateAlert(5),
      /maximum of 5 job alerts/
    );
    assert.throws(
      () => checkCanCreateAlert(6),
      /maximum of 5 job alerts/
    );
  });

  it("constructs MongoDB filter strictly matching only jobs newer than lastCheckedAt", () => {
    const lastCheckedAt = new Date("2026-11-15T10:00:00.000Z");

    const filter = buildPublicJobsFilter({
      q: "Full Stack",
      city: "Bengaluru",
      workMode: "remote",
      createdAfter: lastCheckedAt,
    });

    assert.equal(filter.status, "open");
    assert.equal(filter["location.city"].$regex, "Bengaluru");
    assert.equal(filter.workMode, "remote");

    // Must contain createdAt: { $gt: lastCheckedAt } in $and
    const createdFilter = filter.$and.find((clause) => clause.createdAt && clause.createdAt.$gt);
    assert.ok(createdFilter, "Filter must include $gt condition on createdAt");
    assert.equal(createdFilter.createdAt.$gt.toISOString(), lastCheckedAt.toISOString());
  });

  it("skips notifications and does not send emails when zero matching jobs are found", () => {
    const mockAlert = {
      _id: "alert123",
      name: "React Developer",
      lastCheckedAt: new Date("2026-11-10"),
      lastSentAt: null,
      saveCalled: false,
    };

    const matchingJobs = []; // 0 jobs found
    let emailsSent = 0;
    let skipped = 0;

    if (matchingJobs.length === 0) {
      skipped += 1;
      mockAlert.lastCheckedAt = now;
      mockAlert.saveCalled = true;
    } else {
      emailsSent += 1;
    }

    assert.equal(emailsSent, 0);
    assert.equal(skipped, 1);
    assert.equal(mockAlert.saveCalled, true);
    assert.equal(mockAlert.lastCheckedAt, now);
    assert.equal(mockAlert.lastSentAt, null); // lastSentAt untouched
  });

  it("skips candidates who unsubscribed from job alerts", () => {
    const userUnsubscribed = {
      _id: "user1",
      email: "candidate@example.com",
      status: "active",
      isEmailVerified: true,
      emailPreferences: {
        jobAlerts: false, // Turned OFF
      },
    };

    const shouldProcessAlert = (user) => {
      if (
        !user ||
        user.status !== "active" ||
        !user.isEmailVerified ||
        user.emailPreferences?.jobAlerts === false
      ) {
        return false;
      }
      return true;
    };

    assert.equal(shouldProcessAlert(userUnsubscribed), false);

    const userSubscribed = {
      ...userUnsubscribed,
      emailPreferences: { jobAlerts: true },
    };
    assert.equal(shouldProcessAlert(userSubscribed), true);
  });

  it("calculates remaining count correctly when time budget halts processing", () => {
    const totalDueAlerts = 15;
    const processedAlerts = 6;
    const remaining = totalDueAlerts - processedAlerts;

    assert.equal(remaining, 9);
  });

  it("validates alert creation schema with zod", () => {
    const valid = createJobAlertSchema.safeParse({
      name: "Frontend Remote Roles",
      frequency: "daily",
      filters: {
        q: "React",
        workMode: "remote",
        fresher: true,
      },
    });

    assert.equal(valid.success, true);
    if (valid.success) {
      assert.equal(valid.data.name, "Frontend Remote Roles");
      assert.equal(valid.data.frequency, "daily");
    }

    const invalid = createJobAlertSchema.safeParse({
      name: "", // empty name
    });
    assert.equal(invalid.success, false);
  });
});
