import test from "node:test";
import assert from "node:assert/strict";

test("app.js and all registered route modules import without error", async () => {
  // Safe import check of app.js.
  // app.js registers all middleware and routes but does NOT call connectDB() or app.listen().
  const module = await import("../src/app.js");
  const app = module.default;

  assert.ok(app, "Express app instance must be exported");
  assert.equal(typeof app.use, "function", "App must be an Express application");
  assert.equal(typeof app.listen, "function", "App must be an Express application");
});
