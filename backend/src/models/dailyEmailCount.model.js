import mongoose from "mongoose";

const dailyEmailCountSchema = new mongoose.Schema(
  {
    date: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    count: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

export const DailyEmailCount = mongoose.model("DailyEmailCount", dailyEmailCountSchema);

