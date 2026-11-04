import mongoose from "mongoose";

const educationSchema = new mongoose.Schema(
  {
    degree: {
      type: String,
      required: [true, "Degree is required"],
      trim: true,
      maxlength: [150, "Degree cannot exceed 150 characters"],
    },
    institute: {
      type: String,
      required: [true, "Institute is required"],
      trim: true,
      maxlength: [200, "Institute cannot exceed 200 characters"],
    },
    year: {
      type: Number,
      min: [1950, "Year must be 1950 or later"],
      max: [2100, "Year cannot exceed 2100"],
      default: null,
    },
    grade: {
      type: String,
      trim: true,
      maxlength: [50, "Grade cannot exceed 50 characters"],
      default: "",
    },
  },
  { _id: true }
);

const experienceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
      maxlength: [150, "Job title cannot exceed 150 characters"],
    },
    company: {
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      maxlength: [150, "Company name cannot exceed 150 characters"],
    },
    from: {
      type: Date,
      default: null,
    },
    to: {
      type: Date,
      default: null, // null denotes currently working
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2500, "Experience description cannot exceed 2500 characters"],
      default: "",
    },
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Project title is required"],
      trim: true,
      maxlength: [150, "Project title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Project description cannot exceed 2000 characters"],
      default: "",
    },
    link: {
      type: String,
      trim: true,
      maxlength: [500, "Link cannot exceed 500 characters"],
      default: "",
    },
    techStack: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Tech stack tag cannot exceed 50 characters"],
      },
    ],
  },
  { _id: true }
);

const candidateProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      unique: true,
    },
    headline: {
      type: String,
      trim: true,
      maxlength: [150, "Headline cannot exceed 150 characters"],
      default: "",
    },
    about: {
      type: String,
      trim: true,
      maxlength: [3000, "About cannot exceed 3000 characters"],
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      maxlength: [25, "Phone cannot exceed 25 characters"],
      default: "",
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
    education: {
      type: [educationSchema],
      default: [],
    },
    skills: [
      {
        type: String,
        trim: true,
        maxlength: [50, "Skill cannot exceed 50 characters"],
      },
    ],
    experience: {
      type: [experienceSchema],
      default: [],
    },
    projects: {
      type: [projectSchema],
      default: [],
    },
    links: {
      github: {
        type: String,
        trim: true,
        maxlength: [500, "GitHub link cannot exceed 500 characters"],
        default: "",
      },
      linkedin: {
        type: String,
        trim: true,
        maxlength: [500, "LinkedIn link cannot exceed 500 characters"],
        default: "",
      },
      portfolio: {
        type: String,
        trim: true,
        maxlength: [500, "Portfolio link cannot exceed 500 characters"],
        default: "",
      },
    },
    resumeUrl: {
      type: String,
      trim: true,
      maxlength: [1000, "Resume URL cannot exceed 1000 characters"],
      default: "",
    },
    openToWork: {
      type: Boolean,
      default: true,
    },
    expectedRole: {
      type: String,
      trim: true,
      maxlength: [100, "Expected role cannot exceed 100 characters"],
      default: "",
    },
  },
  { timestamps: true }
);

export const CandidateProfile = mongoose.model("CandidateProfile", candidateProfileSchema);
