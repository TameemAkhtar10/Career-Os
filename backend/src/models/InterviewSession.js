import mongoose from "mongoose";

const interviewItemSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["technical", "behavioral", "situational", "hr"],
      default: "technical",
    },
    question: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    whyAsked: {
      type: String,
      maxlength: 1000,
    },
    answer: {
      type: String,
      maxlength: 5000,
      default: "",
    },
    score: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    strengths: {
      type: [String],
      default: () => [],
    },
    improvements: {
      type: [String],
      default: () => [],
    },
    betterStructure: {
      type: String,
      maxlength: 3000,
      default: "",
    },
    followUpQuestion: {
      type: String,
      maxlength: 1000,
      default: "",
    },
  },
  { _id: false }
);

const interviewSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      default: null,
    },
    role: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    level: {
      type: String,
      enum: ["fresher", "junior", "mid"],
      default: "fresher",
    },
    focus: {
      type: String,
      enum: ["technical", "hr", "mixed"],
      default: "mixed",
    },
    items: {
      type: [interviewItemSchema],
      default: () => [],
    },
  },
  {
    timestamps: true,
  }
);

interviewSessionSchema.index({ user: 1, createdAt: -1 });

export const InterviewSession =
  mongoose.models.InterviewSession ||
  mongoose.model("InterviewSession", interviewSessionSchema);

export default InterviewSession;
