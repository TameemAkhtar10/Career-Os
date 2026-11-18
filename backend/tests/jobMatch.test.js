import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeJobMatch,
  MATCH_WEIGHTS,
  canonicalizeSkillList,
} from "../src/utils/jobMatch.js";

describe("Job Match Scoring & Skill Gap Engine", () => {
  it("verifies match weights sum exactly to 100", () => {
    const totalWeight =
      MATCH_WEIGHTS.skillsOverlap +
      MATCH_WEIGHTS.resumeEvidence +
      MATCH_WEIGHTS.experienceFit;
    assert.equal(totalWeight, 100, "Weights must sum to exactly 100%");
  });

  it("handles normalized skill aliases seamlessly (React.js = react js = reactjs)", () => {
    // Target requires React.js and Node.js
    const jobSkills = ["React.js", "Node.js"];

    // Candidate lists alias variations: "react js", "nodejs"
    const result = computeJobMatch({
      candidateSkills: ["react js", "nodejs"],
      resumeSkills: ["reactjs"],
      jobSkills,
      job: { isFresherFriendly: true },
    });

    assert.equal(result.missingSkills.length, 0);
    assert.deepEqual(result.matchedSkills.sort(), ["Node.js", "React.js"]);
    assert.ok(result.matchScore > 80);
    assert.equal(result.breakdown.skills, MATCH_WEIGHTS.skillsOverlap); // 100% overlap
  });

  it("derives skills from job description using taxonomy when job has no explicit skills", () => {
    const jobDescription = `
      We are looking for an engineer proficient in Python and MongoDB to build scalable microservices.
      Familiarity with Docker and Git is a plus.
    `;

    const result = computeJobMatch({
      candidateSkills: ["python", "docker"],
      resumeSkills: ["python"],
      jobSkills: [],
      jobDescription,
      job: { isFresherFriendly: true },
    });

    assert.ok(result.matchedSkills.length > 0);
    assert.ok(result.matchedSkills.includes("Python"));
    assert.ok(result.matchedSkills.includes("Docker"));
    assert.ok(result.missingSkills.includes("MongoDB"));
    assert.notEqual(result.matchScore, null);
  });

  it("returns matchScore: null when neither job skills nor description contain recognizable skills", () => {
    const result = computeJobMatch({
      candidateSkills: ["React.js", "TypeScript"],
      resumeSkills: ["React.js"],
      jobSkills: [],
      jobDescription: "General helper needed for miscellaneous administrative filing duties.",
      job: { isFresherFriendly: true },
    });

    assert.equal(result.matchScore, null);
    assert.deepEqual(result.matchedSkills, []);
    assert.deepEqual(result.missingSkills, []);
  });

  it("handles candidate with no skills listed (returns 0 overlap score and all skills as missing)", () => {
    const jobSkills = ["Java", "Spring Boot", "SQL"];

    const result = computeJobMatch({
      candidateSkills: [],
      resumeSkills: [],
      jobSkills,
      job: { isFresherFriendly: false, experience: { minYears: 2 } },
      candidateExperienceYears: 0,
    });

    assert.equal(result.matchedSkills.length, 0);
    assert.equal(result.missingSkills.length, 3);
    assert.equal(result.breakdown.skills, 0);
    assert.equal(result.breakdown.resumeEvidence, 0);
    assert.ok(result.matchScore <= 10);
  });

  it("is strictly deterministic across repeated invocations with identical parameters", () => {
    const params = {
      candidateSkills: ["TypeScript", "Next.js", "Tailwind CSS", "PostgreSQL"],
      resumeSkills: ["TypeScript", "Next.js"],
      jobSkills: ["TypeScript", "React.js", "AWS"],
      jobDescription: "Full stack web developer role",
      candidateExperienceYears: 1.5,
      job: { isFresherFriendly: true, experience: { minYears: 0 } },
    };

    const run1 = computeJobMatch(params);
    const run2 = computeJobMatch(params);

    assert.deepEqual(run1, run2);
    assert.equal(run1.matchScore, run2.matchScore);
    assert.deepEqual(run1.matchedSkills, run2.matchedSkills);
    assert.deepEqual(run1.missingSkills, run2.missingSkills);
    assert.deepEqual(run1.breakdown, run2.breakdown);
  });

  it("credits resume evidence when matched skills appear in resume keywords", () => {
    const jobSkills = ["TypeScript", "PostgreSQL"];

    // Candidate A has both skills in profile, but 0 in resume
    const candidateA = computeJobMatch({
      candidateSkills: ["TypeScript", "PostgreSQL"],
      resumeSkills: [],
      jobSkills,
      job: { isFresherFriendly: true },
    });

    // Candidate B has both in profile AND both verified in resume
    const candidateB = computeJobMatch({
      candidateSkills: ["TypeScript", "PostgreSQL"],
      resumeSkills: ["TypeScript", "PostgreSQL"],
      jobSkills,
      job: { isFresherFriendly: true },
    });

    assert.equal(candidateA.breakdown.skills, candidateB.breakdown.skills);
    assert.equal(candidateA.breakdown.resumeEvidence, 0);
    assert.equal(candidateB.breakdown.resumeEvidence, MATCH_WEIGHTS.resumeEvidence);
    assert.ok(candidateB.matchScore > candidateA.matchScore);
  });
});
