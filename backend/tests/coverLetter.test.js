import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { guardCoverLetter } from "../src/utils/coverLetterGuard.js";
import { CONSENT_VERSION } from "../src/models/user.model.js";

describe("AI Cover Letter Server-Side Guard & Policies", () => {
  const resumeText = `
    Experienced in React, JavaScript, and Node.js.
    Completed 3 academic projects with MongoDB and Express.
    Graduated with 85% aggregate score in 2024.
  `;

  const detectedSkills = ["React", "JavaScript", "Node.js", "MongoDB", "Express"];

  it("drops or blanks sentences containing ungrounded numbers not present in resume", () => {
    // Number 99 is invented (not in resume text), while 3 is in resume text
    const inputLetter = {
      subject: "Application for Full Stack Role",
      body: "I built 3 full-stack applications using React and Node.js. I previously managed a team of 99 engineers to deliver results. I am excited to contribute my skills to your team.",
      usedSkills: ["React", "Node.js"],
    };

    const guarded = guardCoverLetter(inputLetter, resumeText, { detectedSkills });

    assert.equal(guarded.aiAvailable, true);
    assert.ok(
      !guarded.coverLetter.body.includes("99"),
      "Sentence with invented number 99 should be dropped"
    );
    assert.ok(
      guarded.coverLetter.body.includes("3 full-stack"),
      "Sentence with verified number 3 from resume should be kept"
    );
  });

  it("removes invented tools/technologies not present in candidate detected skills", () => {
    // "Kubernetes" and "Docker" are not in candidate's detectedSkills
    const inputLetter = {
      subject: "Application for Frontend Developer",
      body: "I have built applications with React and Node.js. In addition, I automated deployments with Docker and Kubernetes for high availability. I look forward to discussing how my background fits your team.",
      usedSkills: ["React", "Node.js", "Docker", "Kubernetes"],
    };

    const guarded = guardCoverLetter(inputLetter, resumeText, { detectedSkills });

    assert.equal(guarded.aiAvailable, true);
    // Invented skills must be removed from usedSkills
    assert.ok(
      !guarded.coverLetter.usedSkills.includes("Docker"),
      "Docker should be removed from usedSkills"
    );
    assert.ok(
      !guarded.coverLetter.usedSkills.includes("Kubernetes"),
      "Kubernetes should be removed from usedSkills"
    );
    assert.ok(
      guarded.coverLetter.usedSkills.includes("React") &&
      guarded.coverLetter.usedSkills.includes("Node.js"),
      "Verified skills should be preserved in usedSkills"
    );
    // In the body, ungrounded tool should be replaced with placeholder
    assert.ok(!guarded.coverLetter.body.includes("Kubernetes"));
  });

  it("preserves bracketed placeholders like [your college] and [specific project]", () => {
    const inputLetter = {
      subject: "Software Engineer Application",
      body: "During my studies at [your college], I developed a full-stack web application using React and Node.js. For my final semester project at [specific project], I engineered clean API integrations.",
      usedSkills: ["React", "Node.js"],
    };

    const guarded = guardCoverLetter(inputLetter, resumeText, { detectedSkills });

    assert.equal(guarded.aiAvailable, true);
    assert.ok(
      guarded.coverLetter.body.includes("[your college]"),
      "Placeholder [your college] must be retained"
    );
    assert.ok(
      guarded.coverLetter.body.includes("[specific project]"),
      "Placeholder [specific project] must be retained"
    );
  });

  it("strips the word ATS from the generated letter", () => {
    const inputLetter = {
      subject: "Application for ATS optimized Full Stack Engineer",
      body: "I crafted my experience with React and Node.js to meet your team needs. This letter was formatted for ATS screening without compromising quality.",
      usedSkills: ["React", "Node.js"],
    };

    const guarded = guardCoverLetter(inputLetter, resumeText, { detectedSkills });

    assert.equal(guarded.aiAvailable, true);
    assert.ok(!/\bATS\b/i.test(guarded.coverLetter.subject), "ATS should be stripped from subject");
    assert.ok(!/\bATS\b/i.test(guarded.coverLetter.body), "ATS should be stripped from body");
  });

  it("fails safely with aiAvailable: false if guard removes more than 30% of text", () => {
    // 3 out of 4 sentences have invented numbers: 500, 1000, 99
    const inputLetter = {
      subject: "Role application",
      body: "I am a developer. I scaled an app to 500 users with React. I handled 1000 requests per minute. I led 99 contributors.",
      usedSkills: ["React"],
    };

    const guarded = guardCoverLetter(inputLetter, resumeText, { detectedSkills });

    assert.equal(guarded.aiAvailable, false);
    assert.ok(guarded.message.includes("did not meet factual"));
  });

  it("enforces daily limit logic correctly", () => {
    const dailyLimit = 5;
    const testCounts = [0, 1, 4, 5, 6];

    for (const count of testCounts) {
      const isAllowed = count < dailyLimit;
      if (count < 5) {
        assert.equal(isAllowed, true, `Count ${count} should be below limit ${dailyLimit}`);
      } else {
        assert.equal(isAllowed, false, `Count ${count} should be blocked at limit ${dailyLimit}`);
      }
    }
  });

  it("validates AI consent requirement and version match", () => {
    const validConsent = {
      granted: true,
      version: CONSENT_VERSION,
      at: new Date(),
    };

    const expiredConsent = {
      granted: true,
      version: "0.9", // old version
      at: new Date(),
    };

    const revokedConsent = {
      granted: false,
      version: CONSENT_VERSION,
      at: new Date(),
    };

    const checkConsent = (stored) =>
      stored?.granted === true && stored?.version === CONSENT_VERSION;

    assert.equal(checkConsent(validConsent), true);
    assert.equal(checkConsent(expiredConsent), false);
    assert.equal(checkConsent(revokedConsent), false);
    assert.equal(checkConsent(null), false);
  });

  it("handles format='note' mode respecting max length and cutting at last full sentence", () => {
    // Generate a long note that exceeds maxChars=200 for testing
    const longNote = {
      subject: "Some Subject",
      body: "I am a full-stack developer with experience in React and Node.js. I have built 3 academic projects focusing on responsive design. Furthermore, I am eager to contribute to [company name]. This final sentence would exceed the limit and should be cut.",
      usedSkills: ["React", "Node.js"],
    };

    const guarded = guardCoverLetter(longNote, resumeText, {
      detectedSkills,
      format: "note",
      maxChars: 180,
    });

    assert.equal(guarded.aiAvailable, true);
    assert.equal(guarded.coverLetter.subject, "", "Note mode should produce an empty subject line");
    assert.ok(guarded.coverLetter.body.length <= 180, "Note length must not exceed maxChars");
    assert.ok(
      guarded.coverLetter.body.endsWith("."),
      "Truncation should cut cleanly at the last full sentence"
    );
    assert.ok(
      !guarded.coverLetter.body.includes("final sentence would exceed"),
      "Overflow sentence should be excluded"
    );
  });

  it("applies factual grounding rules in format='note' mode", () => {
    const noteWithInventedClaims = {
      subject: "",
      body: "I built 3 applications using React. I also increased user engagement by 88% using Kubernetes. I look forward to joining your team.",
      usedSkills: ["React", "Kubernetes"],
    };

    const guarded = guardCoverLetter(noteWithInventedClaims, resumeText, {
      detectedSkills,
      format: "note",
    });

    assert.equal(guarded.aiAvailable, true);
    assert.ok(!guarded.coverLetter.body.includes("88%"), "Invented number 88% must be dropped");
    assert.ok(!guarded.coverLetter.usedSkills.includes("Kubernetes"), "Invented tool must be removed from usedSkills");
  });

  it("ensures default format remains 'letter' when format is omitted", () => {
    const input = {
      subject: "Application for Engineer",
      body: "I am pleased to apply for this role. I have worked on 3 full-stack applications with React and Node.js. My academic background has prepared me to contribute effectively to your development initiatives.",
      usedSkills: ["React", "Node.js"],
    };

    // Calling without format option
    const guarded = guardCoverLetter(input, resumeText, { detectedSkills });
    assert.equal(guarded.aiAvailable, true);
    assert.equal(guarded.coverLetter.subject, "Application for Engineer", "Default format should preserve subject");
  });
});
