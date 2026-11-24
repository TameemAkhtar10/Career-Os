import mongoose from "mongoose";

const stageHistorySchema = new mongoose.Schema(
  {
    stage: {
      type: String,
      enum: ["saved", "applied", "screening", "interview", "offer", "rejected", "withdrawn"],
      required: true,
    },
    at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const trackerEntrySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    source: {
      type: String,
      enum: ["platform", "external"],
      required: true,
      default: "external",
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      default: null,
      index: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      default: null,
    },
    jobTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    company: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },
    link: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    stage: {
      type: String,
      enum: ["saved", "applied", "screening", "interview", "offer", "rejected", "withdrawn"],
      default: "saved",
      index: true,
    },
    appliedOn: {
      type: Date,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    followUpAt: {
      type: Date,
      default: null,
      index: true,
    },
    interviewAt: {
      type: Date,
      default: null,
      index: true,
    },
    salaryNote: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },
    stageHistory: {
      type: [stageHistorySchema],
      default: () => [],
    },
    remindersEnabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastReminderSentAt: {
      type: Date,
      default: null,
    },
    hidden: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

trackerEntrySchema.index({ user: 1, stage: 1 });
trackerEntrySchema.index({ user: 1, updatedAt: -1 });
trackerEntrySchema.index({ user: 1, application: 1 }, { unique: true, sparse: true });
trackerEntrySchema.index({ followUpAt: 1, remindersEnabled: 1 });
trackerEntrySchema.index({ interviewAt: 1, remindersEnabled: 1 });

const TrackerEntry = mongoose.models.TrackerEntry || mongoose.model("TrackerEntry", trackerEntrySchema);

export { TrackerEntry };
export default TrackerEntry;
