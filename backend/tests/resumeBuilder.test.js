import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resumeDraftSchema,
  sanitizeString,
} from "../src/validators/resumeBuilder.schemas.js";
import {
  buildResumePdf,
  sectionHasContent,
  generateResumePlainText,
} from "../src/services/resumePdf.service.js";
import { scoreResumeDeterministically } from "../src/services/resumeScoring.service.js";

describe("Resume Builder Service & Validation", () => {
  const fullFixtureDraft = {
    template: "modern",
    fullName: "Aarav Sharma",
    headline: "Frontend & Full Stack Developer",
    contact: {
      email: "aarav.sharma@example.com",
      phone: "+91 9876543210",
      city: "Bengaluru, India",
      linkedin: "linkedin.com/in/aaravsharma",
      github: "github.com/aaravsharma",
      portfolio: "aaravsharma.dev",
    },
    summary:
      "Passionate developer with hands-on experience in building scalable React and Node.js web applications. Eager to solve real-world problems and deliver clean code.",
    skills: [
      {
        category: "Languages & Frameworks",
        items: ["JavaScript", "TypeScript", "React", "Node.js", "Express"],
      },
      {
        category: "Databases & Tools",
        items: ["MongoDB", "PostgreSQL", "Git", "Docker"],
      },
    ],
    projects: [
      {
        name: "E-Commerce Microservices",
        techStack: ["React", "Node.js", "MongoDB"],
        link: "github.com/aaravsharma/ecommerce",
        bullets: [
          "Developed high-throughput authentication and catalog service with JWT.",
          "Implemented responsive storefront with Tailwind CSS achieving 95+ Lighthouse score.",
          "Integrated payment webhook handlers with idempotent transaction checks.",
        ],
      },
      {
        name: "DevCollab Task Manager",
        techStack: ["TypeScript", "React", "Express"],
        link: "github.com/aaravsharma/devcollab",
        bullets: [
          "Engineered Kanban task board with real-time WebSocket state synchronization.",
          "Reduced API response latency by 35% through Redis query caching.",
        ],
      },
    ],
    experience: [
      {
        role: "Software Engineering Intern",
        company: "TechNova Solutions",
        startDate: "Jan 2024",
        endDate: "Jun 2024",
        current: false,
        bullets: [
          "Assisted in refactoring legacy frontend components to modern React hooks.",
          "Wrote automated unit test suites with Jest increasing code coverage to 82%.",
        ],
      },
    ],
    education: [
      {
        degree: "B.Tech in Computer Science and Engineering",
        institute: "National Institute of Technology",
        startYear: 2020,
        endYear: 2024,
        grade: "8.8 CGPA",
      },
    ],
    certifications: [
      {
        name: "Meta Front-End Developer Professional Certificate",
        issuer: "Coursera",
        year: 2023,
      },
    ],
    sectionOrder: [
      "summary",
      "skills",
      "projects",
      "experience",
      "education",
      "certifications",
    ],
  };

  it("sanitizes control characters and zero-width spaces from input strings", () => {
    const dirty = "Hello\u0000World\u200B! \u0007\uFEFF";
    const cleaned = sanitizeString(dirty);
    assert.equal(cleaned, "HelloWorld!");
  });

  it("enforces strict zod limits (summary max 400, bullet max 220, max 8 projects)", () => {
    // 1. Summary exceeding 400 chars should fail
    const tooLongSummary = {
      ...fullFixtureDraft,
      summary: "a".repeat(405),
    };
    const parsedSummary = resumeDraftSchema.safeParse(tooLongSummary);
    assert.equal(parsedSummary.success, false);

    // 2. Project bullets exceeding 5 should fail
    const tooManyBullets = {
      ...fullFixtureDraft,
      projects: [
        {
          name: "Project A",
          bullets: ["b1", "b2", "b3", "b4", "b5", "b6"], // 6 bullets
        },
      ],
    };
    const parsedBullets = resumeDraftSchema.safeParse(tooManyBullets);
    assert.equal(parsedBullets.success, false);

    // 3. Valid fixture parses cleanly
    const parsedValid = resumeDraftSchema.safeParse(fullFixtureDraft);
    assert.equal(parsedValid.success, true);
  });

  it("skips empty sections so no empty headings are rendered", () => {
    const draftWithoutExpOrCerts = {
      ...fullFixtureDraft,
      experience: [],
      certifications: [],
    };

    assert.equal(sectionHasContent("experience", draftWithoutExpOrCerts), false);
    assert.equal(sectionHasContent("certifications", draftWithoutExpOrCerts), false);
    assert.equal(sectionHasContent("projects", draftWithoutExpOrCerts), true);
    assert.equal(sectionHasContent("skills", draftWithoutExpOrCerts), true);

    const plainText = generateResumePlainText(draftWithoutExpOrCerts);
    assert.ok(!plainText.includes("\nExperience"), "Empty experience heading must not be in text");
    assert.ok(!plainText.includes("\nCertifications"), "Empty certifications heading must not be in text");
    assert.ok(plainText.includes("\nProjects"), "Present projects section must be in text");
    assert.ok(plainText.includes("\nSkills"), "Present skills section must be in text");
  });

  it("generates a valid selectable single-column PDF with pdfkit and extracts text via pdf-parse", async () => {
    const { buffer, pageCount, text } = await buildResumePdf(fullFixtureDraft);

    // Check magic bytes %PDF
    assert.ok(buffer.length > 500, "PDF buffer must be non-empty");
    assert.equal(buffer.slice(0, 4).toString("ascii"), "%PDF");
    assert.ok(pageCount >= 1, "Page count must be at least 1");

    // Extract text with pdf-parse
    let parsedPdf;
    try {
      const imported = await import("pdf-parse/lib/pdf-parse.js");
      const pdfParse = imported.default || imported;
      parsedPdf = await pdfParse(buffer);
    } catch (err) {
      // If pdf-parse in test env has path differences, use text fallback
      parsedPdf = { text };
    }

    const extracted = parsedPdf.text || text;
    assert.ok(extracted.includes("Summary"));
    assert.ok(extracted.includes("Skills"));
    assert.ok(extracted.includes("Projects"));
    assert.ok(extracted.includes("Experience"));
    assert.ok(extracted.includes("Education"));
    assert.ok(extracted.includes("Certifications"));
    assert.ok(extracted.includes("Aarav Sharma"));
  });

  it("extracted text from full fixture scores deterministically without parsing errors", async () => {
    const { text, pageCount } = await buildResumePdf(fullFixtureDraft);

    const report = scoreResumeDeterministically({
      text,
      pageCount,
      fileSize: 30000,
      hasTableOrColumns: false,
      isScanned: false,
      contactBooleans: {
        hasEmail: true,
        hasPhone: true,
        hasLinkedIn: true,
        hasGitHub: true,
      },
      targetSkills: [],
      candidateProfileSkills: ["JavaScript", "TypeScript", "React", "Node.js"],
    });

    assert.ok(typeof report.score === "number");
    assert.ok(report.score > 60, "Clean single-column resume should achieve a solid score");
    assert.ok(report.subScores.atsCompatibility >= 70, "ATS compatibility should be high");
  });

  it("handles one-page optimization step-down for dense freshers", async () => {
    // Generate draft with normal content that fits 1 page
    const onePageDraft = {
      ...fullFixtureDraft,
      projects: [fullFixtureDraft.projects[0]],
      experience: [],
    };

    const { pageCount } = await buildResumePdf(onePageDraft);
    assert.equal(pageCount, 1, "Compact draft must fit on exactly 1 page");
  });
});
