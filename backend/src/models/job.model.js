import mongoose from "mongoose";

const jobSchema = new mongoose.Schema(
  {
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [150, "Job title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
      trim: true,
      maxlength: [10000, "Job description cannot exceed 10000 characters"],
    },
    companyName: {
      type: String,
      required: [true, "Company name snapshot is required"],
      trim: true,
      maxlength: [150, "Company name cannot exceed 150 characters"],
    },
    location: {
      city: {
        type: String,
        trim: true,
        maxlength: [100, "City cannot exceed 100 characters"],
        default: "",
      },
      state: {
        type: String,
        trim: true,
        maxlength: [100, "State cannot exceed 100 characters"],
        default: "",
      },
    },
    workMode: {
      type: String,
      enum: {
        values: ["onsite", "remote", "hybrid"],
        message: "Work mode must be onsite, remote, or hybrid",
      },
      required: [true, "Work mode is required"],
    },
    jobType: {
      type: String,
      enum: {
        values: ["full_time", "internship", "part_time", "contract"],
        message: "Job type must be full_time, internship, part_time, or contract",
      },
      required: [true, "Job type is required"],
    },
    experience: {
      minYears: {
        type: Number,
        required: [true, "Minimum experience years is required"],
        min: [0, "Minimum experience cannot be negative"],
        default: 0,
      },
      maxYears: {
        type: Number,
        required: [true, "Maximum experience years is required"],
        min: [0, "Maximum experience cannot be negative"],
        default: 0,
      },
    },
    salary: {
      min: {
        type: Number,
        min: [0, "Minimum salary cannot be negative"],
        default: null,
      },
      max: {
        type: Number,
        min: [0, "Maximum salary cannot be negative"],
        default: null,
      },
      currency: {
        type: String,
        trim: true,
        uppercase: true,
        default: "INR",
        maxlength: [10, "Currency code cannot exceed 10 characters"],
      },
      isVisible: {
        type: Boolean,
        default: true,
      },
    },
    skills: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Skill cannot exceed 50 characters"],
      },
    ],
    openings: {
      type: Number,
      default: 1,
      min: [1, "Openings must be at least 1"],
    },
    applicationDeadline: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: ["draft", "open", "closed"],
        message: "Status must be draft, open, or closed",
      },
      default: "open",
      index: true,
    },
    isFresherFriendly: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

// Compute isFresherFriendly before saving
jobSchema.pre("save", function () {
  if (this.experience && typeof this.experience.minYears === "number") {
    this.isFresherFriendly = this.experience.minYears === 0;
  }
});

// Indexes
jobSchema.index({ createdAt: -1 });
jobSchema.index({ title: "text", description: "text", skills: "text" });

export const Job = mongoose.model("Job", jobSchema);
