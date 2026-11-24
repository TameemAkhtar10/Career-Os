import test from "node:test";
import assert from "node:assert/strict";
import { renderEmail, escapeHtml, htmlToPlainText } from "../src/services/emailLayout.js";

test("escapeHtml sanitizes untrusted input", () => {
  const unsafe = '<script>alert("xss")</script>&"\'';
  const safe = escapeHtml(unsafe);
  assert.equal(safe.includes("<script>"), false);
  assert.equal(safe.includes("&lt;script&gt;"), true);
  assert.equal(safe.includes("&amp;"), true);
  assert.equal(safe.includes("&quot;"), true);
  assert.equal(safe.includes("&#39;"), true);
});

test("renderEmail generates valid table-based email HTML and plain text", () => {
  const result = renderEmail({
    preheader: "Preview of this email in inbox",
    title: "Welcome to Career OS",
    bodyHtml: "<p>Your journey starts here.</p>",
    cta: {
      label: "Get Started",
      url: "https://careeros.in/candidate/dashboard",
    },
    footerNote: "Questions? Reply to this email.",
    unsubscribeUrl: "https://careeros.in/unsubscribe?token=abc",
    extraLinks: [{ label: "Help Center", url: "https://careeros.in/faq" }],
  });

  assert.ok(result.html, "HTML must be present");
  assert.ok(result.text, "Text must be present");

  // Check preheader
  assert.ok(result.html.includes("Preview of this email in inbox"));

  // Check branding colors
  assert.ok(result.html.includes("#F8E7C9"), "Champagne page background must be present");
  assert.ok(result.html.includes("#064E3B"), "Emerald primary color must be present");
  assert.ok(result.html.includes("#FFF8EC"), "Cream card background must be present");
  assert.ok(result.html.includes("#C8963E"), "Gold accent must be present");

  // Check 600px width constraint
  assert.ok(result.html.includes('max-width: 600px') || result.html.includes('width="600"'));

  // Check CTA button & bulletproof table-cell
  assert.ok(result.html.includes("Get Started"));
  assert.ok(result.html.includes("https://careeros.in/candidate/dashboard"));

  // Check plain-text fallback link rendered under the button
  assert.ok(result.html.includes("If the button above does not work, copy and paste this link:"));

  // Check plain text multipart output
  assert.ok(result.text.includes("Welcome to Career OS"));
  assert.ok(result.text.includes("https://careeros.in/candidate/dashboard"));
  assert.ok(result.text.includes("Unsubscribe"));

  // Verify no forbidden ATS occurrences in rendered output
  assert.equal(/ATS/i.test(result.html), false, "Rendered email must not mention ATS");
  assert.equal(/ATS/i.test(result.text), false, "Plain text email must not mention ATS");
});

test("renderEmail falls back safely if FRONTEND_URL is missing or empty", () => {
  const originalEnv = process.env.FRONTEND_URL;
  try {
    delete process.env.FRONTEND_URL;
    const result = renderEmail({
      title: "Fallback Logo Test",
      bodyHtml: "<p>Testing fallback wordmark</p>",
    });

    assert.ok(result.html.includes("Career OS"), "Wordmark text should be present");
    assert.equal(result.html.includes("<img"), false, "No broken img tag if no FRONTEND_URL");
  } finally {
    if (originalEnv) process.env.FRONTEND_URL = originalEnv;
  }
});
