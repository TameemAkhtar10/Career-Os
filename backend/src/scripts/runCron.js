import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import { TASK_MAP } from "../jobs/index.js";

const VALID_TASKS = Object.keys(TASK_MAP);

const printUsage = () => {
  console.log(`
Usage:
  node src/scripts/runCron.js <task> [--dry] [--force]
  npm run cron:dry -- <task>

Available Tasks:
  ${VALID_TASKS.map((t) => `• ${t}`).join("\n  ")}

Options:
  --dry    Simulate execution without sending emails or modifying live state
  --force  Bypass today's lock key to re-execute a task
`);
};

const main = async () => {
  const args = process.argv.slice(2);
  const taskArg = args.find((a) => !a.startsWith("--"));
  const isDryRun = args.includes("--dry") || process.env.npm_lifecycle_event === "cron:dry";
  const isForce = args.includes("--force");

  if (!taskArg || !VALID_TASKS.includes(taskArg)) {
    console.error(`❌ Invalid or missing task name: "${taskArg || ""}"`);
    printUsage();
    process.exit(1);
  }

  const runner = TASK_MAP[taskArg];

  console.log(`\n======================================================`);
  console.log(`🚀 Career OS Scheduled Task Runner`);
  console.log(`======================================================`);
  console.log(`Task:     ${taskArg}`);
  console.log(`Mode:     ${isDryRun ? "DRY RUN (Simulated, no emails sent)" : "LIVE SEND"}`);
  console.log(`Force:    ${isForce ? "YES (bypassing daily key lock)" : "NO"}`);
  console.log(`Time:     ${new Date().toISOString()}`);
  console.log(`------------------------------------------------------`);

  try {
    await connectDB();
    console.log("✓ Connected to MongoDB.");

    const startTime = Date.now();
    const result = await runner({ dryRun: isDryRun, force: isForce });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n------------------------------------------------------`);
    console.log(`📊 Task Execution Summary`);
    console.log(`------------------------------------------------------`);
    console.log(`Status:   ${result.status.toUpperCase()}`);
    console.log(`Duration: ${duration}s`);
    if (result.stats) {
      console.log(`Eligible: ${result.stats.eligible}`);
      console.log(`Sent:     ${result.stats.sent}`);
      console.log(`Skipped:  ${result.stats.skipped}`);
      console.log(`Failed:   ${result.stats.failed}`);
    }
    if (result.note) {
      console.log(`Note:     ${result.note}`);
    }
    if (result.reason) {
      console.log(`Reason:   ${result.reason}`);
    }
    if (result.error) {
      console.error(`Error:    ${result.error}`);
    }
    console.log(`======================================================\n`);
  } catch (err) {
    console.error(`\n❌ Failed to execute task '${taskArg}':`, err.message);
    process.exit(1);
  } finally {
    try {
      await mongoose.connection.close();
      console.log("✓ MongoDB connection closed cleanly.");
    } catch {
      // ignore
    }
    process.exit(0);
  }
};

main();

