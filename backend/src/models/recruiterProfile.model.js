import mongoose from "mongoose";

const recruiterProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },
    companyName: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: [150, "Company name cannot exceed 150 characters"],
    },
    companyWebsite: {
      type: String,
      trim: true,
      maxlength: [500, "Company website URL cannot exceed 500 characters"],
      default: "",
    },
    companyLogoUrl: {
      type: String,
      trim: true,
      maxlength: [1000, "Company logo URL cannot exceed 1000 characters"],
      default: "",
    },
    industry: {
      type: String,
      trim: true,
      maxlength: [100, "Industry cannot exceed 100 characters"],
      default: "",
    },
    companySize: {
      type: String,
      trim: true,
      maxlength: [50, "Company size cannot exceed 50 characters"],
      default: "",
    },
    about: {
      type: String,
      trim: true,
      maxlength: [3000, "About section cannot exceed 3000 characters"],
      default: "",
    },
    location: {
      type: String,
      trim: true,
      maxlength: [150, "Location cannot exceed 150 characters"],
      default: "",
    },
    designation: {
      type: String,
      trim: true,
      maxlength: [100, "Designation cannot exceed 100 characters"],
      default: "",
    },
  },
  { timestamps: true }
);

export const RecruiterProfile = mongoose.model("RecruiterProfile", recruiterProfileSchema);
