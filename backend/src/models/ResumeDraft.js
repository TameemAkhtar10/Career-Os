import mongoose from "mongoose";

const skillCategorySchema = new mongoose.Schema(
  {
    category: { type: String, default: "", trim: true },
    items: [{ type: String, trim: true }],
  },
  { _id: false }
);

const educationSchema = new mongoose.Schema(
  {
    degree: { type: String, default: "", trim: true },
    institute: { type: String, default: "", trim: true },
    startYear: { type: Number, default: null },
    endYear: { type: Number, default: null },
    grade: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, default: "", trim: true },
    techStack: [{ type: String, trim: true }],
    link: { type: String, default: "", trim: true },
    bullets: [{ type: String, trim: true }],
  },
  { _id: false }
);

const experienceSchema = new mongoose.Schema(
  {
    role: { type: String, default: "", trim: true },
    company: { type: String, default: "", trim: true },
    startDate: { type: String, default: "", trim: true }, // e.g. "Jun 2023"
    endDate: { type: String, default: "", trim: true },   // e.g. "Dec 2023" or ""
    current: { type: Boolean, default: false },
    bullets: [{ type: String, trim: true }],
  },
  { _id: false }
);

const certificationSchema = new mongoose.Schema(
  {
    name: { type: String, default: "", trim: true },
    issuer: { type: String, default: "", trim: true },
    year: { type: Number, default: null },
  },
  { _id: false }
);

const resumeDraftSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    template: {
      type: String,
      enum: ["classic", "modern"],
      default: "classic",
    },
    fullName: { type: String, default: "", trim: true, maxlength: 100 },
    headline: { type: String, default: "", trim: true, maxlength: 150 },
    contact: {
      email: { type: String, default: "", trim: true, maxlength: 120 },
      phone: { type: String, default: "", trim: true, maxlength: 30 },
      city: { type: String, default: "", trim: true, maxlength: 100 },
      linkedin: { type: String, default: "", trim: true, maxlength: 300 },
      github: { type: String, default: "", trim: true, maxlength: 300 },
      portfolio: { type: String, default: "", trim: true, maxlength: 300 },
    },
    summary: { type: String, default: "", trim: true, maxlength: 400 },
    skills: {
      type: [skillCategorySchema],
      default: [],
    },
    education: {
      type: [educationSchema],
      default: [],
    },
    projects: {
      type: [projectSchema],
      default: [],
    },
    experience: {
      type: [experienceSchema],
      default: [],
    },
    certifications: {
      type: [certificationSchema],
      default: [],
    },
    sectionOrder: {
      type: [String],
      default: [
        "summary",
        "skills",
        "projects",
        "experience",
        "education",
        "certifications",
      ],
    },
  },
  { timestamps: true }
);

export const ResumeDraft = mongoose.model("ResumeDraft", resumeDraftSchema);
