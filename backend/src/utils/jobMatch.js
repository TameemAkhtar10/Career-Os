import {
  normalizeSkill,
  extractSkillsFromText,
} from "./skillTaxonomy.js";

/**
 * Weights configuration for Job Match scoring.
 * Sum must equal 100.
 */
export const MATCH_WEIGHTS = {
  skillsOverlap: 70,
  resumeEvidence: 20,
  experienceFit: 10,
};

/**
 * Deduplicates and canonicalizes an array of skills.
 */
export const canonicalizeSkillList = (skills = []) => {
  if (!Array.isArray(skills)) return [];
  const set = new Set();
  const result = [];

  for (const s of skills) {
    const canonical = normalizeSkill(s);
    if (canonical && !set.has(canonical.toLowerCase())) {
      set.add(canonical.toLowerCase());
      result.push(canonical);
    }
  }

  return result;
};

/**
 * Computes pure, deterministic job match score and skill gap analysis.
 * 
 * @param {Object} params
 * @param {string[]} [params.candidateSkills=[]] - Skills listed in candidate profile
 * @param {string[]} [params.resumeSkills=[]] - Skills detected in candidate resume (e.g. keywords.present)
 * @param {string[]} [params.jobSkills=[]] - Skills listed in job posting
 * @param {string} [params.jobDescription=""] - Raw text of job description
 * @param {number|null} [params.candidateExperienceYears=null] - Candidate's total experience in years
 * @param {Object} [params.job=null] - Job object containing experience, isFresherFriendly, etc.
 * @returns {{
 *   matchScore: number | null,
 *   matchedSkills: string[],
 *   missingSkills: string[],
 *   extraSkills: string[],
 *   breakdown: {
 *     skills: number,
 *     resumeEvidence: number,
 *     fresherFit: number,
 *   }
 * }}
 */
export function computeJobMatch({
  candidateSkills = [],
  resumeSkills = [],
  jobSkills = [],
  jobDescription = "",
  candidateExperienceYears = null,
  job = null,
} = {}) {
  // 1. Resolve target job skills
  let targetSkills = canonicalizeSkillList(jobSkills && jobSkills.length > 0 ? jobSkills : job?.skills || []);

  // If no job skills listed, derive from description with taxonomy
  if (targetSkills.length === 0) {
    const rawDesc = jobDescription || job?.description || "";
    if (rawDesc && typeof rawDesc === "string") {
      targetSkills = canonicalizeSkillList(extractSkillsFromText(rawDesc));
    }
  }

  const normCandidate = canonicalizeSkillList(candidateSkills);
  const normResume = canonicalizeSkillList(resumeSkills);

  // If target job still has no detectable skills, return matchScore null
  if (targetSkills.length === 0) {
    return {
      matchScore: null,
      matchedSkills: [],
      missingSkills: [],
      extraSkills: normCandidate,
      breakdown: {
        skills: 0,
        resumeEvidence: 0,
        fresherFit: 0,
      },
    };
  }

  // Combined candidate skills set (profile + resume)
  const candidateLowerSet = new Set(normCandidate.map((s) => s.toLowerCase()));
  const resumeLowerSet = new Set(normResume.map((s) => s.toLowerCase()));
  const combinedSet = new Set([...candidateLowerSet, ...resumeLowerSet]);

  // 2. Compute matched and missing skills
  const matchedSkills = [];
  const missingSkills = [];

  for (const skill of targetSkills) {
    if (combinedSet.has(skill.toLowerCase())) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  }

  // Extra skills: candidate profile skills not requested in target
  const targetLowerSet = new Set(targetSkills.map((s) => s.toLowerCase()));
  const extraSkills = normCandidate.filter(
    (s) => !targetLowerSet.has(s.toLowerCase())
  );

  // 3. Skills Overlap (70%)
  const overlapRatio = targetSkills.length > 0 ? matchedSkills.length / targetSkills.length : 0;
  const skillsScore = Math.round(overlapRatio * MATCH_WEIGHTS.skillsOverlap);

  // 4. Resume Evidence (20%)
  // Evidence that matched skills also appear in resume keywords
  let evidenceScore = 0;
  if (matchedSkills.length > 0 && normResume.length > 0) {
    const evidenceMatches = matchedSkills.filter((s) =>
      resumeLowerSet.has(s.toLowerCase())
    ).length;
    const evidenceRatio = evidenceMatches / matchedSkills.length;
    evidenceScore = Math.round(evidenceRatio * MATCH_WEIGHTS.resumeEvidence);
  }

  // 5. Fresher / Experience Fit (10%)
  let fresherFitScore = 0;
  const minRequiredYears = job?.experience?.minYears != null ? job.experience.minYears : null;
  const isFresherJob = Boolean(
    job?.isFresherFriendly || minRequiredYears === 0
  );

  if (isFresherJob) {
    // Fresher friendly job fits all candidates
    fresherFitScore = MATCH_WEIGHTS.experienceFit;
  } else if (candidateExperienceYears != null && minRequiredYears != null) {
    if (candidateExperienceYears >= minRequiredYears) {
      fresherFitScore = MATCH_WEIGHTS.experienceFit;
    } else if (minRequiredYears > 0) {
      fresherFitScore = Math.round(
        (candidateExperienceYears / minRequiredYears) * MATCH_WEIGHTS.experienceFit
      );
    } else {
      fresherFitScore = MATCH_WEIGHTS.experienceFit;
    }
  } else if (minRequiredYears != null && minRequiredYears > 0) {
    // Requires experience but candidate experience not provided
    fresherFitScore = Math.round(MATCH_WEIGHTS.experienceFit / 2);
  } else {
    // Default neutral fit
    fresherFitScore = MATCH_WEIGHTS.experienceFit;
  }

  // Cap combined score 0 - 100
  const matchScore = Math.min(
    100,
    Math.max(0, skillsScore + evidenceScore + fresherFitScore)
  );

  return {
    matchScore,
    matchedSkills,
    missingSkills,
    extraSkills,
    breakdown: {
      skills: skillsScore,
      resumeEvidence: evidenceScore,
      fresherFit: fresherFitScore,
    },
  };
}
