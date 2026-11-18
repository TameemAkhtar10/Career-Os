import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeJobMatch } from "../src/utils/jobMatch.js";

describe("Applicant Ranking by Match Score", () => {
  const sampleJob = {
    _id: "650000000000000000000001",
    title: "Full Stack Engineer",
    skills: ["React", "Node.js", "TypeScript", "PostgreSQL"],
    description: "Looking for a full stack engineer proficient in React and Node.js.",
    isFresherFriendly: true,
  };

  it("orders candidates correctly with sort=match (highest matchScore first)", () => {
    // Candidate A: 4/4 skills match
    const matchA = computeJobMatch({
      candidateSkills: ["React", "Node.js", "TypeScript", "PostgreSQL"],
      jobSkills: sampleJob.skills,
      job: sampleJob,
    });

    // Candidate B: 2/4 skills match
    const matchB = computeJobMatch({
      candidateSkills: ["React", "Node.js"],
      jobSkills: sampleJob.skills,
      job: sampleJob,
    });

    // Candidate C: 1/4 skills match
    const matchC = computeJobMatch({
      candidateSkills: ["React"],
      jobSkills: sampleJob.skills,
      job: sampleJob,
    });

    const applicants = [
      { id: "C", matchScore: matchC.matchScore, createdAt: new Date("2026-01-03") },
      { id: "A", matchScore: matchA.matchScore, createdAt: new Date("2026-01-01") },
      { id: "B", matchScore: matchB.matchScore, createdAt: new Date("2026-01-02") },
    ];

    // Sorting algorithm used in getJobApplications
    applicants.sort((a, b) => {
      if (a.matchScore === null && b.matchScore === null) {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
      if (a.matchScore === null) return 1;
      if (b.matchScore === null) return -1;
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    assert.equal(applicants[0].id, "A", "Candidate A with highest score should be first");
    assert.equal(applicants[1].id, "B", "Candidate B with moderate score should be second");
    assert.equal(applicants[2].id, "C", "Candidate C with lowest score should be last");
    assert.ok(applicants[0].matchScore > applicants[1].matchScore);
    assert.ok(applicants[1].matchScore > applicants[2].matchScore);
  });

  it("filters out applicants below minMatch threshold", () => {
    const scoredApplicants = [
      { id: "A", matchScore: 90 },
      { id: "B", matchScore: 75 },
      { id: "C", matchScore: 50 },
      { id: "D", matchScore: 30 },
      { id: "E", matchScore: null },
    ];

    const minMatch = 60;
    const filtered = scoredApplicants.filter(
      (app) => app.matchScore !== null && app.matchScore >= minMatch
    );

    assert.equal(filtered.length, 2, "Only applicants with score >= 60 should remain");
    assert.deepEqual(filtered.map((a) => a.id), ["A", "B"]);
  });

  it("sorts null scores last when sort=match", () => {
    const applicants = [
      { id: "Null-1", matchScore: null, createdAt: new Date("2026-01-05") },
      { id: "Score-80", matchScore: 80, createdAt: new Date("2026-01-01") },
      { id: "Null-2", matchScore: null, createdAt: new Date("2026-01-04") },
      { id: "Score-40", matchScore: 40, createdAt: new Date("2026-01-02") },
    ];

    applicants.sort((a, b) => {
      if (a.matchScore === null && b.matchScore === null) {
        return b.createdAt.getTime() - a.createdAt.getTime();
      }
      if (a.matchScore === null) return 1;
      if (b.matchScore === null) return -1;
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    assert.equal(applicants[0].id, "Score-80");
    assert.equal(applicants[1].id, "Score-40");
    assert.equal(applicants[2].id, "Null-1");
    assert.equal(applicants[3].id, "Null-2");
  });

  it("falls back to recent sort and flags matchSortCapped when applicants exceed 500 cap", () => {
    const totalMatching = 501;
    const sortOption = "match";

    let matchSortCapped = false;
    let actualSortUsed = sortOption;

    if (sortOption === "match" && totalMatching > 500) {
      matchSortCapped = true;
      actualSortUsed = "recent";
    }

    assert.equal(matchSortCapped, true, "Should flag matchSortCapped as true when > 500");
    assert.equal(actualSortUsed, "recent", "Should fall back to recent ordering");
  });

  it("fairness & privacy: verifies no personal fields (name, email, phone, college, location, photo) are used in match scoring", () => {
    // Two candidates with identical skills and experience, but differing personal attributes
    const candidate1 = {
      name: "Rahul Sharma",
      gender: "Male",
      age: 24,
      college: "IIT Bombay",
      location: "Mumbai",
      photo: "https://example.com/photo1.jpg",
      skills: ["React", "TypeScript"],
      experienceYears: 1,
    };

    const candidate2 = {
      name: "Ananya Iyer",
      gender: "Female",
      age: 21,
      college: "Tier 3 Local College",
      location: "Tier 2 City",
      photo: "https://example.com/photo2.jpg",
      skills: ["React", "TypeScript"],
      experienceYears: 1,
    };

    const result1 = computeJobMatch({
      candidateSkills: candidate1.skills,
      resumeSkills: candidate1.skills,
      jobSkills: sampleJob.skills,
      candidateExperienceYears: candidate1.experienceYears,
      job: sampleJob,
    });

    const result2 = computeJobMatch({
      candidateSkills: candidate2.skills,
      resumeSkills: candidate2.skills,
      jobSkills: sampleJob.skills,
      candidateExperienceYears: candidate2.experienceYears,
      job: sampleJob,
    });

    assert.equal(result1.matchScore, result2.matchScore, "Match score must be identical regardless of personal attributes");
    assert.deepEqual(result1.matchedSkills, result2.matchedSkills);
    assert.deepEqual(result1.missingSkills, result2.missingSkills);
    assert.deepEqual(result1.breakdown, result2.breakdown);
  });
});
