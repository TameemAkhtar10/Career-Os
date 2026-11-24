import TrackerEntry from "../models/TrackerEntry.js";
import { Application } from "../models/application.model.js";
import { Job } from "../models/job.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {
  createTrackerEntrySchema,
  updateTrackerEntrySchema,
} from "../validators/tracker.schemas.js";

const MAX_EXTERNAL_ENTRIES = 300;

export const mapApplicationStatusToStage = (status) => {
  switch (status) {
    case "applied":
      return "applied";
    case "shortlisted":
      return "screening";
    case "interview":
      return "interview";
    case "hired":
      return "offer";
    case "rejected":
      return "rejected";
    case "withdrawn":
      return "withdrawn";
    default:
      return "applied";
  }
};

/**
 * Lazily mirrors platform Application records into TrackerEntry.
 * Guarantees candidate has an up-to-date tracker representation of native applications.
 */
export const syncPlatformApplicationsForUser = async (userId) => {
  const applications = await Application.find({ candidate: userId })
    .populate("job", "title company location workplaceType")
    .lean();

  if (!applications || applications.length === 0) return;

  for (const app of applications) {
    if (!app.job) continue;
    const stage = mapApplicationStatusToStage(app.status);

    const existing = await TrackerEntry.findOne({
      user: userId,
      application: app._id,
    });

    if (!existing) {
      await TrackerEntry.create({
        user: userId,
        source: "platform",
        application: app._id,
        job: app.job._id,
        jobTitle: app.job.title,
        company: app.job.company,
        location: app.job.location || "",
        link: `/jobs/${app.job._id}`,
        stage,
        appliedOn: app.createdAt || new Date(),
        stageHistory: [
          {
            stage,
            at: app.createdAt || new Date(),
          },
        ],
        remindersEnabled: true,
      });
    } else if (existing.stage !== stage) {
      // Stage was updated by recruiter
      existing.stage = stage;
      existing.stageHistory.push({
        stage,
        at: new Date(),
      });
      await existing.save();
    }
  }
};

/**
 * GET /api/tracker
 * Returns paginated entries and counts per stage
 */
export const getTrackerEntries = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Sync latest platform applications
  await syncPlatformApplicationsForUser(userId);

  const { stage, search, upcoming, page = 1, limit = 50 } = req.query;

  const query = {
    user: userId,
    hidden: { $ne: true },
  };

  if (stage && stage !== "all") {
    query.stage = stage;
  }

  if (search && search.trim()) {
    const searchRegex = new RegExp(search.trim(), "i");
    query.$or = [{ jobTitle: searchRegex }, { company: searchRegex }, { notes: searchRegex }];
  }

  if (upcoming === "true") {
    const now = new Date();
    query.$or = [
      { followUpAt: { $gte: now } },
      { interviewAt: { $gte: now } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));
  const skip = (pageNum - 1) * limitNum;

  const [entries, total] = await Promise.all([
    TrackerEntry.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    TrackerEntry.countDocuments(query),
  ]);

  // Aggregate counts by stage
  const countsAggregate = await TrackerEntry.aggregate([
    { $match: { user: userId, hidden: { $ne: true } } },
    { $group: { _id: "$stage", count: { $sum: 1 } } },
  ]);

  const counts = {
    all: 0,
    saved: 0,
    applied: 0,
    screening: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    withdrawn: 0,
  };

  for (const item of countsAggregate) {
    if (counts[item._id] !== undefined) {
      counts[item._id] = item.count;
    }
    counts.all += item.count;
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        entries,
        counts,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1,
        },
      },
      "Application tracker entries fetched successfully"
    )
  );
});

/**
 * GET /api/tracker/summary
 * Returns top metrics, immediate upcoming items, and idle alerts
 */
export const getTrackerSummary = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  await syncPlatformApplicationsForUser(userId);

  const now = new Date();
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  const [countsAggregate, upcomingFollowUps, upcomingInterviews, idleApplications] = await Promise.all([
    TrackerEntry.aggregate([
      { $match: { user: userId, hidden: { $ne: true } } },
      { $group: { _id: "$stage", count: { $sum: 1 } } },
    ]),
    TrackerEntry.find({
      user: userId,
      hidden: { $ne: true },
      followUpAt: { $gte: now },
    })
      .sort({ followUpAt: 1 })
      .limit(5)
      .lean(),
    TrackerEntry.find({
      user: userId,
      hidden: { $ne: true },
      interviewAt: { $gte: now },
    })
      .sort({ interviewAt: 1 })
      .limit(5)
      .lean(),
    TrackerEntry.find({
      user: userId,
      hidden: { $ne: true },
      stage: { $in: ["applied", "screening"] },
      updatedAt: { $lte: fourteenDaysAgo },
    })
      .sort({ updatedAt: 1 })
      .limit(5)
      .lean(),
  ]);

  const counts = {
    all: 0,
    saved: 0,
    applied: 0,
    screening: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    withdrawn: 0,
  };

  for (const item of countsAggregate) {
    if (counts[item._id] !== undefined) {
      counts[item._id] = item.count;
    }
    counts.all += item.count;
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        counts,
        upcomingFollowUps,
        upcomingInterviews,
        idleApplications,
      },
      "Tracker summary fetched successfully"
    )
  );
});

/**
 * POST /api/tracker
 * Creates an external tracker entry
 */
export const createTrackerEntry = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const count = await TrackerEntry.countDocuments({
    user: userId,
    source: "external",
    hidden: { $ne: true },
  });

  if (count >= MAX_EXTERNAL_ENTRIES) {
    throw new ApiError(400, `Tracker limit reached (${MAX_EXTERNAL_ENTRIES} entries maximum).`);
  }

  const parsed = createTrackerEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message || "Invalid input data");
  }

  const data = parsed.data;
  const stage = data.stage || "saved";

  const entry = await TrackerEntry.create({
    user: userId,
    source: "external",
    jobTitle: data.jobTitle,
    company: data.company,
    location: data.location || "",
    link: data.link || "",
    stage,
    appliedOn: data.appliedOn || (stage === "applied" ? new Date() : null),
    notes: data.notes || "",
    followUpAt: data.followUpAt || null,
    interviewAt: data.interviewAt || null,
    salaryNote: data.salaryNote || "",
    stageHistory: [
      {
        stage,
        at: new Date(),
      },
    ],
    remindersEnabled: data.remindersEnabled !== false,
  });

  return res.status(201).json(new ApiResponse(201, entry, "Application added to tracker"));
});

/**
 * PATCH /api/tracker/:id
 * Updates an existing tracker entry.
 * On platform entries, candidates can only update notes, followUpAt, interviewAt, remindersEnabled, hidden.
 */
export const updateTrackerEntry = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const entry = await TrackerEntry.findOne({ _id: id, user: userId });
  if (!entry) {
    throw new ApiError(404, "Tracker entry not found");
  }

  const parsed = updateTrackerEntrySchema.safeParse(req.body);
  if (!parsed.success) {
    throw new ApiError(400, parsed.error.issues[0]?.message || "Invalid input data");
  }

  const data = parsed.data;

  if (entry.source === "platform") {
    // Recruiter-controlled: candidate can only update candidate notes & personal reminders
    if (data.notes !== undefined) entry.notes = data.notes;
    if (data.followUpAt !== undefined) entry.followUpAt = data.followUpAt;
    if (data.interviewAt !== undefined) entry.interviewAt = data.interviewAt;
    if (data.salaryNote !== undefined) entry.salaryNote = data.salaryNote;
    if (data.remindersEnabled !== undefined) entry.remindersEnabled = data.remindersEnabled;
    if (data.hidden !== undefined) entry.hidden = data.hidden;
  } else {
    // External: candidate has full CRUD
    if (data.jobTitle !== undefined) entry.jobTitle = data.jobTitle;
    if (data.company !== undefined) entry.company = data.company;
    if (data.location !== undefined) entry.location = data.location;
    if (data.link !== undefined) entry.link = data.link;
    if (data.appliedOn !== undefined) entry.appliedOn = data.appliedOn;
    if (data.notes !== undefined) entry.notes = data.notes;
    if (data.followUpAt !== undefined) entry.followUpAt = data.followUpAt;
    if (data.interviewAt !== undefined) entry.interviewAt = data.interviewAt;
    if (data.salaryNote !== undefined) entry.salaryNote = data.salaryNote;
    if (data.remindersEnabled !== undefined) entry.remindersEnabled = data.remindersEnabled;
    if (data.hidden !== undefined) entry.hidden = data.hidden;

    if (data.stage && data.stage !== entry.stage) {
      entry.stage = data.stage;
      entry.stageHistory.push({
        stage: data.stage,
        at: new Date(),
      });
      if (data.stage === "applied" && !entry.appliedOn) {
        entry.appliedOn = new Date();
      }
    }
  }

  await entry.save();

  return res.status(200).json(new ApiResponse(200, entry, "Tracker entry updated"));
});

/**
 * DELETE /api/tracker/:id
 * Deletes an external tracker entry.
 * Platform entries cannot be deleted (they are mirrors of real applications), but can be hidden.
 */
export const deleteTrackerEntry = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { id } = req.params;

  const entry = await TrackerEntry.findOne({ _id: id, user: userId });
  if (!entry) {
    throw new ApiError(404, "Tracker entry not found");
  }

  if (entry.source === "platform") {
    // Soft hide rather than delete platform application records
    entry.hidden = true;
    await entry.save();
    return res.status(200).json(new ApiResponse(200, { hidden: true }, "Platform application hidden from tracker"));
  }

  await TrackerEntry.deleteOne({ _id: id });
  return res.status(200).json(new ApiResponse(200, { deleted: true }, "Tracker entry removed"));
});
