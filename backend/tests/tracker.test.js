import test from "node:test";
import assert from "node:assert/strict";
import { mapApplicationStatusToStage } from "../src/controllers/tracker.controller.js";
import { createTrackerEntrySchema, updateTrackerEntrySchema } from "../src/validators/tracker.schemas.js";

test("mapApplicationStatusToStage maps recruiter statuses correctly", () => {
  assert.equal(mapApplicationStatusToStage("applied"), "applied");
  assert.equal(mapApplicationStatusToStage("shortlisted"), "screening");
  assert.equal(mapApplicationStatusToStage("interview"), "interview");
  assert.equal(mapApplicationStatusToStage("hired"), "offer");
  assert.equal(mapApplicationStatusToStage("rejected"), "rejected");
  assert.equal(mapApplicationStatusToStage("withdrawn"), "withdrawn");
  assert.equal(mapApplicationStatusToStage("unknown"), "applied");
});

test("createTrackerEntrySchema validates input and strips control chars", () => {
  const valid = createTrackerEntrySchema.safeParse({
    jobTitle: "Software Engineer\u0000",
    company: "Google India\u0007",
    location: "Bengaluru",
    link: "https://careers.google.com/jobs/123",
    stage: "interview",
    notes: "Round 1 DSA scheduled",
  });

  assert.equal(valid.success, true);
  assert.equal(valid.data.jobTitle, "Software Engineer");
  assert.equal(valid.data.company, "Google India");
  assert.equal(valid.data.stage, "interview");

  const invalidUrl = createTrackerEntrySchema.safeParse({
    jobTitle: "Software Engineer",
    company: "Google India",
    link: "javascript:alert(1)",
  });
  assert.equal(invalidUrl.success, false);
});

test("updateTrackerEntrySchema validates stage changes and optional fields", () => {
  const validUpdate = updateTrackerEntrySchema.safeParse({
    stage: "offer",
    salaryNote: "₹8,00,000 CTC",
    remindersEnabled: false,
  });

  assert.equal(validUpdate.success, true);
  assert.equal(validUpdate.data.stage, "offer");
  assert.equal(validUpdate.data.salaryNote, "₹8,00,000 CTC");
  assert.equal(validUpdate.data.remindersEnabled, false);
});

test("tracker stage mapping covers every application status value without gaps", () => {
  const allStatuses = ["applied", "shortlisted", "interview", "hired", "rejected", "withdrawn"];
  for (const status of allStatuses) {
    const stage = mapApplicationStatusToStage(status);
    assert.ok(
      ["applied", "screening", "interview", "offer", "rejected", "withdrawn"].includes(stage),
      `Status ${status} mapped to invalid stage ${stage}`
    );
  }
});
