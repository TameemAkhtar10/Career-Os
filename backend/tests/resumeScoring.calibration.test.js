import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  SCORING_RUBRIC,
  calculateGrade,
  scoreResumeDeterministically,
  computeResumeCacheKey,
} from "../src/services/resumeScoring.service.js";
import { sanitizeAiFeedback } from "../src/utils/aiFeedbackGuard.js";
import { aiFeedbackSchema } from "../src/validators/resume.schemas.js";
import { extractSkillsFromText } from "../src/utils/skillTaxonomy.js";

/**
 * Synthetic resume test fixtures (created strictly for deterministic calibration testing).
 */

const STRONG_FRESHER_RESUME = `Aarav Sharma
aarav.sharma@example.com | +91 98765 43210 | linkedin.com/in/aaravsharma | github.com/aaravsharma | Bengaluru, India

SUMMARY
Computer Science undergraduate focused on full-stack web engineering, API optimization, and automated testing.

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, Java, C++, SQL
Frontend: React.js, HTML, CSS, Tailwind CSS, Vite
Backend & Databases: Node.js, Express.js, MongoDB, PostgreSQL, Redis, REST APIs
Tools & Cloud: Docker, Git, Jest, Postman, Linux

EXPERIENCE
Software Engineering Intern | FinPulse Labs | May 2025 - Jul 2025
• Engineered 6 Node.js REST APIs using Express.js and Redis caching, cutting p95 latency by 38%.
• Automated MongoDB query indexing pipelines, reducing database read execution time from 240 ms to 65 ms.
• Built 14 integration tests in Jest across payment endpoints, raising suite code coverage to 92%.
• Designed responsive React.js and TypeScript analytics dashboards supporting 1500+ monthly active users.

PROJECTS
Campus Placement Portal | Live Demo: https://campus-portal.vercel.app | GitHub: github.com/aaravsharma/campus-portal
Tech Stack: React.js, Node.js, Express.js, MongoDB, Tailwind CSS, Docker
• Architected role-based applicant portals using React.js and Express.js serving 1200+ registered college students daily.
• Optimized MongoDB aggregation pipelines rendering candidate shortlists within 120 ms across 45 hiring drives.
• Containerized backend microservices using Docker, cutting local onboarding setup time across engineering machines by 60%.

Real-Time Code Review Assistant | GitHub: github.com/aaravsharma/code-reviewer
Tech Stack: TypeScript, Python, PostgreSQL, Vite, Jest
• Developed asynchronous webhook queues in TypeScript inspecting 350+ pull requests weekly with minimal latency.
• Implemented PostgreSQL diff caching lowering repeated static analysis storage reads by 45% across repositories.
• Configured automated Vite bundle verification scripts catching broken syntax imports prior to staging deployments.

EDUCATION
B.Tech in Computer Science and Engineering | BMS Institute of Technology | 2021 - 2025
CGPA: 8.9/10`;

const AVERAGE_RESUME = `Rohan Verma
rohan.verma@example.com | +91 91234 56789 | github.com/rohanverma

OBJECTIVE
Final year engineering student looking for software development roles to apply programming knowledge and learn backend engineering.

SKILLS
JavaScript, React.js, Node.js, Express.js, MongoDB, MySQL, HTML, CSS, Python, Docker, Git

PROJECTS
Task Manager Web Application | Tech Stack: React.js, Node.js, MongoDB
- Responsible for building login screens and dashboard components using React.js and Node.js.
- Worked on database queries in MongoDB for saving user tasks across 25% faster requests.

Personal Portfolio Website | Live Demo: https://rohan-portfolio.netlify.app
• Created responsive layout templates and deployed the frontend build to production hosting.
• Built modular contact form fields and helped with organizing reusable page templates cleanly.

EDUCATION
B.E. in Information Technology | Pune Institute of Computer Technology | 2021 - 2025
CGPA: 7.8/10`;

const WEAK_RESUME = `Karan Mehta
karan.mehta@example.com

OBJECTIVE
Computer graduate seeking an entry level job in web development and support.

SKILLS
Java, Python, HTML, CSS

EXPERIENCE
Web Trainee | Local Studio | 05/2024 - Aug 2024
- Responsible for frontend updates.
• Worked on basic database forms.
* Helped with server bug checks.
* I assisted with my daily status reports and documented team notes for internal client review meetings.

EDUCATION
B.Sc. Computer Science | State University | 2021 - 2024`;

const FUTURE_DATE_RESUME = STRONG_FRESHER_RESUME.replace(
  "May 2025 - Jul 2025",
  "May 2099 - Jul 2099"
);

describe("Resume Scoring Calibration (Deterministic Rubric)", () => {
  it("scores STRONG fresher resume within 85-95 band", () => {
    const report = scoreResumeDeterministically({
      text: STRONG_FRESHER_RESUME,
      pageCount: 1,
      fileSize: 320 * 1024,
    });

    assert.ok(
      report.score >= 85 && report.score <= 95,
      `Expected STRONG overall score in 85-95, got ${report.score}`
    );
    assert.ok(report.subScores.projectQuality >= 85);
    assert.ok(report.subScores.impactAchievements >= 85);
    assert.ok(report.subScores.professionalism >= 85);
    assert.ok(report.subScores.atsCompatibility >= 85);
  });

  it("scores AVERAGE resume within 60-78 band", () => {
    const report = scoreResumeDeterministically({
      text: AVERAGE_RESUME,
      pageCount: 1,
      fileSize: 280 * 1024,
    });

    assert.ok(
      report.score >= 60 && report.score <= 78,
      `Expected AVERAGE overall score in 60-78, got ${report.score}`
    );
  });

  it("scores WEAK resume within 20-50 band and flags missing phone and projects", () => {
    const report = scoreResumeDeterministically({
      text: WEAK_RESUME,
      pageCount: 1,
      fileSize: 180 * 1024,
    });

    assert.ok(
      report.score >= 20 && report.score <= 50,
      `Expected WEAK overall score in 20-50, got ${report.score}`
    );
    assert.ok(
      report.issues.some((i) => /no phone/i.test(i.title)),
      "Expected missing phone issue on WEAK fixture"
    );
    assert.ok(
      report.issues.some((i) => /no projects/i.test(i.title)),
      "Expected missing projects issue on WEAK fixture"
    );
  });

  it("detects Future dates issue, caps overall at 75, and reduces Professionalism when future internship date is present", () => {
    const clean = scoreResumeDeterministically({
      text: STRONG_FRESHER_RESUME,
      pageCount: 1,
    });
    const future = scoreResumeDeterministically({
      text: FUTURE_DATE_RESUME,
      pageCount: 1,
    });

    const futureIssue = future.issues.find((i) => i.title.includes("Future dates"));
    assert.ok(futureIssue, "Expected 'Future dates' issue to be reported");
    assert.equal(futureIssue.severity, "high");
    assert.ok(
      future.score <= 75,
      `Expected future-date overall score <= 75, got ${future.score}`
    );
    assert.ok(
      future.subScores.professionalism < clean.subScores.professionalism,
      `Expected professionalism (${future.subScores.professionalism}) < baseline (${clean.subScores.professionalism})`
    );
  });

  it("scores empty or scanned text at 0 with No readable text detected issue", () => {
    const emptyReport = scoreResumeDeterministically({ text: "" });
    const scannedReport = scoreResumeDeterministically({
      text: STRONG_FRESHER_RESUME,
      isScanned: true,
    });

    for (const report of [emptyReport, scannedReport]) {
      assert.equal(report.score, 0);
      assert.equal(report.grade, "F");
      for (const value of Object.values(report.subScores)) {
        assert.equal(value, 0);
      }
      assert.ok(
        report.issues.some((i) => /no readable text/i.test(i.title)),
        "Expected no-readable-text issue"
      );
    }
  });

  it("is strictly deterministic across repeated invocations", () => {
    const first = scoreResumeDeterministically({
      text: STRONG_FRESHER_RESUME,
      pageCount: 1,
      fileSize: 320 * 1024,
    });
    const second = scoreResumeDeterministically({
      text: STRONG_FRESHER_RESUME,
      pageCount: 1,
      fileSize: 320 * 1024,
    });

    assert.deepStrictEqual(first, second);
  });

  it("orders STRONG > AVERAGE > WEAK on overall score and every sub-score", () => {
    const strong = scoreResumeDeterministically({ text: STRONG_FRESHER_RESUME, pageCount: 1 });
    const average = scoreResumeDeterministically({ text: AVERAGE_RESUME, pageCount: 1 });
    const weak = scoreResumeDeterministically({ text: WEAK_RESUME, pageCount: 1 });

    assert.ok(
      strong.score > average.score && average.score > weak.score,
      `Expected overall ${strong.score} > ${average.score} > ${weak.score}`
    );

    for (const key of Object.keys(SCORING_RUBRIC.weights)) {
      assert.ok(
        strong.subScores[key] > average.subScores[key],
        `Expected ${key}: strong (${strong.subScores[key]}) > average (${average.subScores[key]})`
      );
      assert.ok(
        average.subScores[key] > weak.subScores[key],
        `Expected ${key}: average (${average.subScores[key]}) > weak (${weak.subScores[key]})`
      );
    }
  });

  it("never counts bullets in Skills or Education towards Impact or Writing bullet counts", () => {
    const resumeWithNonWorkBullets = `${WEAK_RESUME}
• Built 100% scalable microservices serving 5000+ users in college coursework.
• Engineered 50% faster lab assignments with React.js and Docker.`;

    const baselineWeak = scoreResumeDeterministically({ text: WEAK_RESUME, pageCount: 1 });
    const withEduBullets = scoreResumeDeterministically({
      text: resumeWithNonWorkBullets,
      pageCount: 1,
    });

    assert.equal(
      withEduBullets.subScores.impactAchievements,
      baselineWeak.subScores.impactAchievements
    );
    assert.equal(
      withEduBullets.subScores.writingQuality,
      baselineWeak.subScores.writingQuality
    );
  });

  it("enforces caps, grade bands, count-only reasons, and target-skill replacement", () => {
    assert.equal(calculateGrade(90), "A+");
    assert.equal(calculateGrade(85), "A");
    assert.equal(calculateGrade(80), "A-");
    assert.equal(calculateGrade(75), "B+");
    assert.equal(calculateGrade(70), "B");
    assert.equal(calculateGrade(65), "B-");
    assert.equal(calculateGrade(60), "C+");
    assert.equal(calculateGrade(50), "C");
    assert.equal(calculateGrade(40), "D");
    assert.equal(calculateGrade(39), "F");

    const strong = scoreResumeDeterministically({ text: STRONG_FRESHER_RESUME, pageCount: 1 });
    for (const [key, reasons] of Object.entries(strong.subScoreReasons)) {
      assert.ok(Array.isArray(reasons) && reasons.length > 0, `Missing reasons for ${key}`);
      for (const reason of reasons) {
        assert.ok(!reason.includes("Aarav"), `Reason should never contain resume text: ${reason}`);
        assert.ok(!reason.includes("FinPulse"), `Reason should never contain resume text: ${reason}`);
      }
    }

    const lowTargetOverlap = scoreResumeDeterministically({
      text: STRONG_FRESHER_RESUME,
      pageCount: 1,
      targetSkills: ["Kubernetes", "GraphQL", "Go", "Rust", "AWS"],
    });
    assert.ok(
      lowTargetOverlap.subScores.skillsValidation < strong.subScores.skillsValidation,
      "Expected 0% target overlap to lower skillsValidation vs no-target baseline"
    );
  });

  it("sanitizes AI bulletRewrites, enforces rewording-only guard, and removes ATS/camelCase leaks", () => {
    const validAndMixedFeedback = {
      summary:
        "Strong layout for ATS screening (atsCompatibility: 90), but strengthen impactAchievements (writingQuality 70).",
      strengths: ["Passes ATS checks cleanly."],
      improvements: ["Raise professionalism (professionalism: 65) and projectQuality."],
      suggestions: [
        {
          priority: "high",
          title: "Improve ATS readability",
          description: "Add concrete numbers in bullet points.",
          example: "Reduced latency by [X%] across [N] endpoints serving 1200+ users.",
        },
        {
          priority: "medium",
          title: "Invented latency example",
          description: "Avoid unverified metrics.",
          example: "Cut response time by 47% for 9000 customers.",
        },
      ],
      missingKeywords: ["TypeScript"],
      bulletRewrites: [
        {
          original: "Worked on building REST APIs with Express.js and MongoDB for student users.",
          improved:
            "Built REST APIs using Express.js and MongoDB for student users. Built REST APIs using Express.js and MongoDB for student users.",
          reason: "Replaces passive opening with an active verb.",
          metricHint: "Quantify endpoint count or p95 response latency if measured.",
        },
        {
          original: "Helped develop React.js dashboard modules.",
          improved: "Developed React.js dashboard modules.",
          reason: "Direct active phrasing.",
        },
        {
          original: "Built Node.js APIs with Express.js.",
          improved: "Built Node.js APIs with Express.js, streamlining requests.",
          reason: "Disallowed impact verb 'streamlining' should be dropped.",
          metricHint: "Add latency or throughput numbers.",
        },
      ],
    };

    const parsed = aiFeedbackSchema.parse(validAndMixedFeedback);
    const cleaned = sanitizeAiFeedback(parsed, "Built 6 Node.js APIs serving 1200+ users.");

    assert.equal(cleaned.bulletRewrites.length, 2);
    assert.equal(
      cleaned.bulletRewrites[0].improved,
      "Built REST APIs using Express.js and MongoDB for student users."
    );
    assert.equal(
      cleaned.bulletRewrites[0].metricHint,
      "Quantify endpoint count or p95 response latency if measured."
    );
    assert.equal(cleaned.bulletRewrites[1].metricHint, "");

    assert.ok(!/\bats\b/i.test(cleaned.summary));
    assert.ok(cleaned.summary.includes("automated screening"));
    assert.ok(!cleaned.summary.includes("atsCompatibility"));
    assert.ok(!cleaned.summary.includes("writingQuality"));
    assert.ok(!cleaned.summary.includes("impactAchievements"));
    assert.ok(cleaned.summary.includes("Impact & Achievements"));

    assert.equal(cleaned.strengths[0], "Passes automated screening checks cleanly.");
    assert.ok(!cleaned.improvements[0].includes("professionalism:"));
    assert.ok(cleaned.improvements[0].includes("Professionalism"));
    assert.ok(cleaned.improvements[0].includes("Project Quality"));

    assert.ok(!/\bats\b/i.test(cleaned.suggestions[0].title));
    assert.ok(cleaned.suggestions[0].title.includes("automated screening"));
    assert.ok(cleaned.suggestions[0].example.includes("1200+"));
    assert.equal(cleaned.suggestions[1].example, "");

    const disallowedRewrites = aiFeedbackSchema.parse({
      ...validAndMixedFeedback,
      bulletRewrites: [
        {
          original: "Built Node.js APIs with Express.js.",
          improved: "Engineered [N] Node.js APIs using Express.js.",
          reason: "Placeholder inside improved must be dropped.",
        },
        {
          original: "Built Node.js APIs with Express.js.",
          improved: "Engineered 6 Node.js APIs with Express.js.",
          reason: "Unbracketed invented number must be dropped.",
        },
        {
          original: "Built Node.js APIs with Express.js.",
          improved: "Engineered faster Node.js APIs with Express.js.",
          reason: "Unverified impact word 'faster' must be dropped.",
        },
      ],
    });
    const cleanedDisallowed = sanitizeAiFeedback(disallowedRewrites, "");
    assert.equal(cleanedDisallowed.bulletRewrites.length, 0);

    const zeroRewrites = aiFeedbackSchema.parse({ ...validAndMixedFeedback, bulletRewrites: [] });
    assert.equal(zeroRewrites.bulletRewrites.length, 0);
    assert.throws(
      () =>
        aiFeedbackSchema.parse({
          ...validAndMixedFeedback,
          bulletRewrites: [
            validAndMixedFeedback.bulletRewrites[0],
            validAndMixedFeedback.bulletRewrites[0],
            validAndMixedFeedback.bulletRewrites[0],
            validAndMixedFeedback.bulletRewrites[0],
          ],
        }),
      (err) => err?.name === "ZodError",
      "Expected schema to enforce max 3 bulletRewrites"
    );
  });

  it("detects project links from labels, expands stack aliases, and handles unbacked skills copy", () => {
    const expanded = extractSkillsFromText("Built with MERN, MEAN, PERN, Tailwind, REST");
    for (const expectedSkill of [
      "MongoDB",
      "Express.js",
      "React.js",
      "Node.js",
      "Angular",
      "PostgreSQL",
      "Tailwind CSS",
      "REST APIs",
    ]) {
      assert.ok(expanded.includes(expectedSkill), `Expected alias expansion to include ${expectedSkill}`);
    }

    const linkAndStackResume = `Rohan Verma
rohan.verma@example.com | +91 98111 22334 | github.com/rohanv | linkedin.com/in/rohanv

SUMMARY
Full-stack developer experienced in building responsive web platforms and APIs for campus organizations.

TECHNICAL SKILLS
Frontend: React.js, Angular, Tailwind CSS
Backend: Node.js, Express.js, MongoDB, PostgreSQL, REST APIs

PROJECTS
CampusHub | Live | GitHub
Tech Stack: MERN, Tailwind CSS
• Built an event portal for college clubs with role-based permissions and calendar sync.
• Engineered real-time announcements serving 450+ students across 12 department chapters.
• Optimized database queries reducing API payload wait time by 35% during registration.

Analytics Board | Source | Demo
Built with REST, React.js, Node.js
• Created analytics dashboards tracking 1200+ weekly active sessions across academic cohorts.
• Automated scheduled report exports for faculty coordinators with email digest delivery.
• Deployed containerized workers for background jobs serving 30+ student organizations.

EXPERIENCE
Web Developer Intern | CloudNest Labs | Jun 2025 - Aug 2025
• Built internal dashboards with PERN and MEAN services handling 300+ daily staff workflows.
• Refactored billing webhooks and unit test suites across payment reconciliation steps.

EDUCATION
B.Tech in Computer Science | NIT Jaipur | 2022 - 2026`;

    const scored = scoreResumeDeterministically({
      text: linkAndStackResume,
      pageCount: 1,
      fileSize: 210 * 1024,
    });

    assert.equal(scored.subScoreReasons.projectQuality[0], "2 project(s), avg 3 bullets");
    assert.equal(scored.subScoreReasons.projectQuality[1], "2 of 2 name tech stack, 2 with links");
    assert.ok(
      !scored.issues.some((issue) => /project link|lack code or demo/i.test(issue.title)),
      "Visible link labels (Live | GitHub, Source | Demo) should satisfy project link checks"
    );
    assert.ok(scored.subScores.skillsValidation >= 90);
    for (const expectedPresent of [
      "React.js",
      "Angular",
      "Tailwind CSS",
      "Node.js",
      "Express.js",
      "MongoDB",
      "PostgreSQL",
      "REST APIs",
    ]) {
      assert.ok(scored.keywords.present.includes(expectedPresent));
    }

    const unbackedSkillsResume = `Neha Kapoor
neha.kapoor@example.com | +91 98444 55667 | github.com/nehak

SUMMARY
Computer Science student exploring modern software development workflows and cloud tooling.

SKILLS
JavaScript, React.js, Node.js, MongoDB, Docker, Kubernetes, TypeScript, Redis

PROJECTS
Department Notice Board
• Created a static notice page with clean typography and campus announcement categories.
• Organized yearly academic holiday notices and contact tables for college departments.
• Updated visual spacing across printable notice sheets for faculty administrative staff.

EDUCATION
B.Tech in Computer Science | Pune University | 2022 - 2026`;

    const unbackedResult = scoreResumeDeterministically({
      text: unbackedSkillsResume,
      pageCount: 1,
      fileSize: 180 * 1024,
    });
    assert.ok(unbackedResult.subScores.skillsValidation < 50);
    const skillsCard = unbackedResult.quickInsights.find((item) => item.title === "Skills Coverage");
    assert.ok(skillsCard);
    assert.equal(skillsCard.detail, "Skills are listed; link them to your projects.");
  });

  it("joins only lowercase continuations, caps project count at 8, and separates icons from U+FFFD", () => {
    const bulletJoinResume = `Karan Malhotra
karan.m@example.com | +91 98200 44556 | github.com/karanm

SKILLS
Frontend: React.js, TypeScript, CSS
Backend: Node.js, PostgreSQL, Git

PROJECTS
Order Tracking Portal
• Designed automated invoice workflows for small merchants
across multiple tax brackets for audit readiness
Optimized PostgreSQL indexing pipelines cutting query response latency by 40% across endpoints.

EXPERIENCE
Software Intern | LedgerFlow | May 2025 - Jul 2025
• Built automated reconciliation scripts for Node.js billing APIs and React.js views.

EDUCATION
B.Tech in Computer Science | Delhi University | 2022 - 2026`;

    const joinedResult = scoreResumeDeterministically({
      text: bulletJoinResume,
      pageCount: 1,
      fileSize: 150 * 1024,
    });
    assert.equal(joinedResult.subScoreReasons.projectQuality[0], "1 project(s), avg 2 bullets");
    assert.equal(joinedResult.subScoreReasons.impactAchievements[0], "1 of 3 bullets have metrics");
    assert.equal(
      joinedResult.subScoreReasons.impactAchievements[1],
      "3 of 3 bullets start with action verbs"
    );

    const tenProjectsText = `${bulletJoinResume.split("EXPERIENCE")[0]}
Project Alpha | GitHub
• Built module alpha using React.js and PostgreSQL for 200+ users.

Project Beta | GitHub
• Built module beta using React.js and PostgreSQL for 200+ users.

Project Gamma | GitHub
• Built module gamma using React.js and PostgreSQL for 200+ users.

Project Delta | GitHub
• Built module delta using React.js and PostgreSQL for 200+ users.

Project Epsilon | GitHub
• Built module epsilon using React.js and PostgreSQL for 200+ users.

Project Zeta | GitHub
• Built module zeta using React.js and PostgreSQL for 200+ users.

Project Eta | GitHub
• Built module eta using React.js and PostgreSQL for 200+ users.

Project Theta | GitHub
• Built module theta using React.js and PostgreSQL for 200+ users.

Project Iota | GitHub
• Built module iota using React.js and PostgreSQL for 200+ users.

EDUCATION
B.Tech in Computer Science | Delhi University | 2022 - 2026`;

    const cappedResult = scoreResumeDeterministically({
      text: tenProjectsText,
      pageCount: 1,
      fileSize: 180 * 1024,
    });
    assert.ok(cappedResult.subScoreReasons.projectQuality[0].startsWith("8 project(s)"));

    const corruptedResult = scoreResumeDeterministically({
      text: `${bulletJoinResume}\n\uFFFD`,
      pageCount: 1,
      fileSize: 150 * 1024,
    });
    assert.ok(
      corruptedResult.issues.some((issue) => /corrupted characters/i.test(issue.title))
    );
  });

  it("scores a short freelance web-developer resume realistically and checks sparse multi-page PDFs", () => {
    const freelanceResume = `Vikram Joshi
vikram.joshi@example.com | +91 98220 11223 | LinkedIn | GitHub

\u2605 Summary
Freelance web developer building responsive business websites and online storefronts using WordPress, WooCommerce, and Shopify themes for retail stores in Mumbai.

\uE901 Skills
HTML, CSS, JavaScript, PHP, MySQL, Bootstrap, Redux, Git

\uF0B1 Experience
Freelance Web Developer - Self-Employed | Jan 2024 - Present
\uF0B7 Customized WordPress and Shopify storefronts for local retail clients using custom PHP theme templates.
\uF0B7 Responsible for responsive landing page updates and plugin configuration across staging and production hosting servers.
\uF0B7 Worked on mobile checkout layout updates, navigation menus, and regular theme maintenance across client websites.

\uF19D Academics
B.Sc. in Information Technology | Mumbai University | 2020 - 2023`;

    const singlePageResult = scoreResumeDeterministically({
      text: freelanceResume,
      pageCount: 1,
      fileSize: 180 * 1024,
    });

    assert.ok(
      singlePageResult.score >= 35 && singlePageResult.score <= 60,
      `Expected freelance score in 35-60, got ${singlePageResult.score}`
    );
    assert.ok(singlePageResult.subScoreReasons.projectQuality[0].startsWith("0 project(s)"));
    assert.ok(
      !singlePageResult.issues.some((issue) => /Missing 'Education'/i.test(issue.title)),
      "Icon-prefixed Academics heading should satisfy Education section check"
    );
    assert.ok(
      !singlePageResult.issues.some((issue) => /corrupted characters/i.test(issue.title)),
      "Private-use/icon glyphs should not be flagged as corrupted characters"
    );
    assert.ok(
      !singlePageResult.issues.some((issue) => /exceeds recommended length/i.test(issue.title)),
      "Short 1-page freelance resume should not trigger over-length warning"
    );
    assert.ok(
      singlePageResult.issues.some(
        (issue) =>
          issue.severity === "low" &&
          issue.detail.includes("Make sure the link is also written as visible text.")
      ),
      "Label-only LinkedIn/GitHub should produce low-severity visible URL note"
    );

    const profCard = singlePageResult.quickInsights.find(
      (item) => item.title === "Professional Standards"
    );
    assert.ok(profCard);
    assert.ok(!profCard.detail.includes("Complete contact links"));
    assert.ok(profCard.detail.includes("label-only profile link without visible URL"));

    const sparseMultiPage = scoreResumeDeterministically({
      text: freelanceResume,
      pageCount: 2,
      fileSize: 180 * 1024,
    });
    assert.ok(
      sparseMultiPage.issues.some(
        (issue) =>
          issue.severity === "low" &&
          issue.title ===
            "Your PDF has 2 pages but very little text; check for blank pages or large spacing."
      )
    );
    assert.ok(
      !sparseMultiPage.issues.some((issue) => /exceeds recommended length/i.test(issue.title))
    );
  });

  it("parses 2 project headings with 4 bullets each and 1 internship with 5 bullets into projectsDetected=2, projectBullets=8, totalBullets=13", () => {
    const twoProjectsResume = `Ananya Sharma
ananya.sharma@example.com | +91 98765 43210 | github.com/ananyasharma | linkedin.com/in/ananyasharma

TECHNICAL SKILLS
Languages: Python, JavaScript, TypeScript, SQL
Frontend: React.js, Tailwind CSS, HTML, CSS
Backend: Node.js, Express.js, PostgreSQL, Docker, Git

PROJECTS
EventHub Portal | Tech: React.js, Node.js | Live | GitHub
• Built role-based student event registration platform serving 800+ active campus members.
• Optimized PostgreSQL query performance reducing latency from 220 ms to 45 ms across endpoints.
• Developed automated email ticket delivery webhooks handling 350+ registration requests per hour.
• Designed responsive admin dashboards with React.js and Tailwind CSS for university society leads.

CodeReview Bot | Tech: Python, Docker | Live | GitHub
• Architected asynchronous pull request review bot analyzing 400+ git repository commits weekly.
• Automated static syntax issue checks catching broken configuration entries prior to staging.
• Configured Redis queue workers processing webhook payloads across 20+ engineering repositories.
• Engineered test coverage reporting pipelines displaying per-commit diff analysis in real time.

EXPERIENCE
Full Stack Intern | Apex Systems | Jan 2025 - Jun 2025
• Built 8 internal REST API services using Express.js and PostgreSQL for client analytics.
• Automated weekly data migration scripts verifying records across billing database replicas.
• Engineered real-time notification components in React.js for operational staff dashboards.
• Refactored legacy monolithic helper utilities into modular microservice packages.
• Authored comprehensive Jest integration test suites boosting overall repo coverage by 25%.

EDUCATION
B.Tech in Computer Science | Delhi Technological University | 2021 - 2025`;

    const result = scoreResumeDeterministically({
      text: twoProjectsResume,
      pageCount: 1,
      fileSize: 200 * 1024,
    });

    assert.equal(result.projectHeadingsDetected, 2, "Expected exactly 2 detected project headings");
    assert.equal(result.projectBulletsDetected, 8, "Expected exactly 8 project bullets (4 per project)");
    assert.equal(result.experienceBulletsDetected, 5, "Expected exactly 5 experience bullets");
    assert.equal(
      result.projectBulletsDetected + result.experienceBulletsDetected,
      13,
      "Expected totalBullets = 13"
    );
    assert.ok(result.subScoreReasons.projectQuality[0].startsWith("2 project(s), avg 4 bullets"));
  });

  it("detects Education across variants (spaced, inline colon, leading icon, and degree evidence without heading) with zero Missing Education heading issues", () => {
    const baseHeader = `Pooja Patel\npooja@example.com | +91 98111 22334 | github.com/pooja\n\nSKILLS\nReact.js, Node.js, Python, SQL\n\nPROJECTS\nApp Alpha | GitHub\n• Built app alpha using React.js and SQL for 100+ users.\n• Automated database routines.\n\n`;

    // 1. Spaced: E D U C A T I O N
    const spacedResume = `${baseHeader}E D U C A T I O N\nB.Tech in Information Technology | GTU | 2020 - 2024`;
    const resSpaced = scoreResumeDeterministically({ text: spacedResume, pageCount: 1 });
    assert.ok(
      !resSpaced.issues.some((i) => i.title === "Missing 'Education' section heading"),
      "Spaced E D U C A T I O N should satisfy Education heading"
    );

    // 2. Inline colon: Education: B.Tech ...
    const inlineColonResume = `${baseHeader}Education: B.Tech in Computer Science | Mumbai University | 2020 - 2024`;
    const resInline = scoreResumeDeterministically({ text: inlineColonResume, pageCount: 1 });
    assert.ok(
      !resInline.issues.some((i) => i.title === "Missing 'Education' section heading"),
      "Inline 'Education: ...' should satisfy Education heading"
    );

    // 3. Leading icon: 🎓 Education
    const iconResume = `${baseHeader}\uD83C\uDF93 Education\nB.Tech in Computer Engineering | Pune University | 2020 - 2024`;
    const resIcon = scoreResumeDeterministically({ text: iconResume, pageCount: 1 });
    assert.ok(
      !resIcon.issues.some((i) => i.title === "Missing 'Education' section heading"),
      "Icon before Education should satisfy Education heading"
    );

    // 4. Degree text without any heading (B.Tech evidence)
    const degreeWithoutHeadingResume = `${baseHeader}B.Tech in Computer Science and Engineering | Anna University | 2020 - 2024\nCGPA: 8.5/10`;
    const resDegreeOnly = scoreResumeDeterministically({
      text: degreeWithoutHeadingResume,
      pageCount: 1,
    });
    assert.ok(
      !resDegreeOnly.issues.some((i) => i.title === "Missing 'Education' section heading"),
      "Degree text without heading should NOT raise high Missing 'Education' section heading"
    );
    assert.ok(
      resDegreeOnly.issues.some(
        (i) => i.severity === "low" && i.title === "Education found but without a clear heading"
      ),
      "Degree text without heading should raise low 'Education found but without a clear heading'"
    );
  });

  it("counts only U+FFFD and control characters as corrupted, ignoring icon glyphs and raising issue only at 10+", () => {
    const resumeWithIcons = `Sneha Rao
sneha@example.com | +91 98222 33445 | github.com/sneha

\uE000\uE001\uE002\uF8FE\uF8FF \u2022\u25A0\u25CF\u2713 \u200B\uFEFF
SKILLS
HTML, CSS, JavaScript, React.js, Node.js, Git

PROJECTS
Task Manager | GitHub
• Built task manager using React.js and Node.js for 150+ users.
• Designed clean single-page dashboard interfaces.

EDUCATION
B.Tech in Computer Science | Bangalore University | 2020 - 2024`;

    const resIcons = scoreResumeDeterministically({ text: resumeWithIcons, pageCount: 1 });
    assert.ok(
      !resIcons.issues.some((i) => i.title.includes("characters in your PDF could not be read")),
      "Private-use and icon-font glyphs must never be treated as corrupted characters"
    );
    assert.ok(resIcons.subScoreReasons.atsCompatibility[2].includes("0 odd char(s)"));

    const resumeWith15ReplacementChars = `${resumeWithIcons}\n${"\uFFFD".repeat(15)}`;
    const res15 = scoreResumeDeterministically({
      text: resumeWith15ReplacementChars,
      pageCount: 1,
    });
    assert.ok(
      res15.issues.some(
        (i) =>
          i.severity === "medium" &&
          i.title ===
            "Some characters in your PDF could not be read, usually from an icon font or special font. Re-export the PDF with standard fonts."
      ),
      "Expected corrupted character issue to be raised at 15 U+FFFD characters"
    );
    assert.ok(res15.subScoreReasons.atsCompatibility[2].includes("15 odd char(s)"));
  });

  it("deduplicates near-duplicate sentences inside one bullet and raises Possible duplicate content", () => {
    const duplicateSentenceResume = `Amit Roy
amit.roy@example.com | +91 98333 44556 | github.com/amitroy

SKILLS
React.js, Node.js, Express.js, Brevo, Git

PROJECTS
Notification Dispatcher | Live | GitHub
• Developed X using Brevo. Developed X through Brevo
• Built webhook listener processing incoming payload alerts for 120+ users.

EDUCATION
B.Tech in Computer Science | Mumbai University | 2021 - 2025`;

    const result = scoreResumeDeterministically({
      text: duplicateSentenceResume,
      pageCount: 1,
    });

    assert.ok(result.duplicateBulletCount >= 1, "Expected duplicateBulletCount >= 1");
    assert.ok(
      result.issues.some(
        (i) => i.severity === "medium" && i.title === "Possible duplicate content"
      ),
      "Expected 'Possible duplicate content' medium issue to be raised"
    );

    const firstProjectBullet = result.deduplicatedBullets[0];
    assert.equal(
      firstProjectBullet,
      "Developed X using Brevo.",
      "Expected sentence repeated twice with near-duplicate wording to merge into one"
    );
  });

  it("blanks ungrounded examples, keeps valid fill-in template, drops rewrites adding peer/faster, and preserves pure tense change", () => {
    const resumeText = "Engineered 4 Node.js APIs using Express.js serving 1200+ users.";
    const feedback = {
      summary: "Good progress on core backend APIs.",
      strengths: ["Clean API architecture."],
      improvements: ["Add quantitative benchmarks."],
      suggestions: [
        {
          priority: "high",
          title: "Add Python scripts",
          description: "Incorporate data preprocessing.",
          example: "Python – used for data preprocessing scripts in AI chatbot project",
        },
        {
          priority: "high",
          title: "Optimize PostgreSQL queries",
          description: "Document order handling scale.",
          example:
            "Used PostgreSQL to design the order database... handling [N] transactions per day",
        },
        {
          priority: "medium",
          title: "Target skill Python",
          description: "Highlight Python workflows where relevant.",
          example: "Python - used for [what you built or automated] in [project name]",
        },
      ],
      missingKeywords: ["Python"],
      bulletRewrites: [
        {
          original: "Building React.js dashboard components for student users.",
          improved: "Built React.js dashboard components for student users.",
          reason: "Pure tense change with active verb.",
        },
        {
          original: "Building React.js dashboard components for student users.",
          improved: "Built React.js dashboard components for peer student users.",
          reason: "Added noun/adjective 'peer' not present in original.",
        },
        {
          original: "Building React.js dashboard components for student users.",
          improved: "Built faster React.js dashboard components for student users.",
          reason: "Added impact adjective 'faster' not present in original.",
        },
      ],
    };

    const sanitized = sanitizeAiFeedback(feedback, resumeText, {
      detectedSkills: ["Node.js", "Express.js", "React.js"],
      targetSkills: ["Python"],
      candidateProfileSkills: [],
    });

    // 1. Unverified examples without templates must be blanked
    assert.equal(
      sanitized.suggestions[0].example,
      "",
      "Expected invented Python example to be blanked"
    );
    assert.equal(
      sanitized.suggestions[1].example,
      "",
      "Expected invented PostgreSQL order database example to be blanked"
    );

    // 2. Valid template example survives
    assert.equal(
      sanitized.suggestions[2].example,
      "Python - used for [what you built or automated] in [project name]",
      "Expected valid template example to survive"
    );

    // 3. Rewrites adding 'peer' or 'faster' are dropped; pure tense change survives
    assert.equal(sanitized.bulletRewrites.length, 1);
    assert.equal(
      sanitized.bulletRewrites[0].improved,
      "Built React.js dashboard components for student users."
    );
  });

  it("changes cacheKey whenever SCORING_VERSION or AI_PROMPT_VERSION changes", () => {
    const basePayload = {
      contentHash: "4f53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945",
      targetType: "description",
      targetIdentifier: "7a8b9c0d1e2f",
      scoringVersion: "2.2.0",
      aiPromptVersion: "2.2.0",
    };

    const baseKey = computeResumeCacheKey(basePayload);
    const bumpedScoringKey = computeResumeCacheKey({
      ...basePayload,
      scoringVersion: "2.3.0",
    });
    const bumpedPromptKey = computeResumeCacheKey({
      ...basePayload,
      aiPromptVersion: "2.3.0",
    });

    assert.notEqual(
      baseKey,
      bumpedScoringKey,
      "cacheKey must change when SCORING_VERSION is bumped"
    );
    assert.notEqual(
      baseKey,
      bumpedPromptKey,
      "cacheKey must change when AI_PROMPT_VERSION is bumped"
    );
    assert.equal(baseKey.length, 64, "Expected sha256 hex string");
  });

  it("raises Skills not backed by project details when fewer than 70% of skills are backed (6 of 14 backed)", () => {
    const resumeWith6Of14SkillsBacked = `Deepak Verma
deepak.verma@example.com | +91 98222 55667 | github.com/deepakv | linkedin.com/in/deepakv

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, Java, C++, Go, Rust
Frameworks & Tools: React.js, Node.js, Express.js, MongoDB, PostgreSQL, Docker, Redis

PROJECTS
Portfolio Manager | Live | GitHub
• Built personal portfolio and blog with React.js, Node.js, and Express.js for 120+ monthly readers.
• Configured MongoDB database indexing and automated Docker image build pipelines.
• Integrated PostgreSQL query logging for API telemetry.

EDUCATION
B.Tech in Computer Science | Delhi University | 2021 - 2025`;

    const result = scoreResumeDeterministically({
      text: resumeWith6Of14SkillsBacked,
      pageCount: 1,
      fileSize: 190 * 1024,
    });

    const unbackedIssue = result.issues.find(
      (i) => i.title === "Skills not backed by project details"
    );
    assert.ok(
      unbackedIssue,
      "Expected medium issue 'Skills not backed by project details' when backed share < 70%"
    );
    assert.equal(unbackedIssue.severity, "medium");
  });
});
