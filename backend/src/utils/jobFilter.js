/**
 * Escapes regex special characters in a user-provided string.
 */
export const escapeRegex = (str = "") => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Builds the MongoDB filter object for querying public, open, non-expired jobs.
 * Reused by both GET /api/jobs and the Job Alerts cron job.
 * 
 * @param {Object} options
 * @param {string} [options.q] - Keyword query
 * @param {string} [options.city] - Location / city name
 * @param {string} [options.location] - Alias for city
 * @param {string} [options.workMode] - 'onsite' | 'remote' | 'hybrid'
 * @param {string} [options.jobType] - 'full_time' | 'internship' | 'part_time' | 'contract'
 * @param {string|string[]} [options.skills] - Comma-separated string or array of skills
 * @param {boolean|string} [options.fresher] - Fresher friendly flag
 * @param {number|string} [options.minSalary] - Minimum annual salary
 * @param {Date} [options.createdAfter] - Optional filter for jobs created after a specific timestamp
 * @returns {Object} MongoDB query filter
 */
export const buildPublicJobsFilter = ({
  q,
  city,
  location,
  workMode,
  jobType,
  skills,
  fresher,
  minSalary,
  createdAfter,
} = {}) => {
  const now = new Date();

  const filter = {
    status: "open",
    $and: [
      {
        $or: [
          { applicationDeadline: null },
          { applicationDeadline: { $gte: now } },
        ],
      },
    ],
  };

  // If filtering for jobs posted after a certain date (used in alerts cron)
  if (createdAfter) {
    const afterDate = createdAfter instanceof Date ? createdAfter : new Date(createdAfter);
    if (!isNaN(afterDate.getTime())) {
      filter.$and.push({ createdAt: { $gt: afterDate } });
    }
  }

  // Keyword / search term across title, companyName, skills, description
  if (q && typeof q === "string" && q.trim().length > 0) {
    const safeQ = escapeRegex(q.trim());
    filter.$and.push({
      $or: [
        { title: { $regex: safeQ, $options: "i" } },
        { companyName: { $regex: safeQ, $options: "i" } },
        { skills: { $in: [new RegExp(safeQ, "i")] } },
        { description: { $regex: safeQ, $options: "i" } },
      ],
    });
  }

  // Location / city
  const loc = city || location;
  if (loc && typeof loc === "string" && loc.trim().length > 0) {
    filter["location.city"] = { $regex: escapeRegex(loc.trim()), $options: "i" };
  }

  // Work mode
  if (workMode && ["onsite", "remote", "hybrid"].includes(workMode)) {
    filter.workMode = workMode;
  }

  // Job type
  if (jobType && ["full_time", "internship", "part_time", "contract"].includes(jobType)) {
    filter.jobType = jobType;
  }

  // Skills
  let skillList = [];
  if (Array.isArray(skills)) {
    skillList = skills.map((s) => String(s).trim()).filter(Boolean);
  } else if (typeof skills === "string" && skills.trim().length > 0) {
    skillList = skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (skillList.length > 0) {
    filter.skills = {
      $in: skillList.map((s) => new RegExp(`^${escapeRegex(s)}$`, "i")),
    };
  }

  // Fresher friendly
  if (fresher === true || fresher === "true") {
    filter.isFresherFriendly = true;
  }

  // Min salary filter: salary.max >= minSalary (or salary.min >= minSalary)
  if (minSalary != null) {
    const salaryVal = Number(minSalary);
    if (!isNaN(salaryVal) && salaryVal > 0) {
      filter.$and.push({
        $or: [
          { "salary.max": { $gte: salaryVal } },
          {
            $and: [
              { "salary.max": null },
              { "salary.min": { $gte: salaryVal } },
            ],
          },
        ],
      });
    }
  }

  return filter;
};
