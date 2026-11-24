import mongoose from "mongoose";

const interviewPrepDailyCountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    dateKey: {
      type: String, // YYYY-MM-DD in Asia/Kolkata
      required: true,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

interviewPrepDailyCountSchema.index({ user: 1, dateKey: 1 }, { unique: true });

export const InterviewPrepDailyCount =
  mongoose.models.InterviewPrepDailyCount ||
  mongoose.model("InterviewPrepDailyCount", interviewPrepDailyCountSchema);

export default InterviewPrepDailyCount;
