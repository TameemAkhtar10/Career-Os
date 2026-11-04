"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useProfileMe } from "../../profile/hooks/useProfile";
import { useCreateJob, useUpdateJob, useJobDetail } from "../hooks/useJobs";
import { RecruiterProfile } from "../../../types/profile";
import { JobType, WorkMode } from "../../../constants/enums";
import { jobFormSchema } from "../schemas";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { TagInput } from "../../../components/ui/TagInput";
import { BrandLoader } from "../../../components/feedback/BrandLoader";
import { toast } from "sonner";
import {
  Briefcase,
  MapPin,
  Sparkles,
  IndianRupee,
  Calendar,
  Users,
  Building2,
  ArrowLeft,
  Save,
  CheckCircle,
} from "lucide-react";

export interface JobFormPageProps {
  jobId?: string; // If provided, edit mode
}

export const JobFormPage: React.FC<JobFormPageProps> = ({ jobId }) => {
  const router = useRouter();

  const { data: profileMe, isLoading: isProfileLoading } = useProfileMe();
  const recruiterProfile = (profileMe as RecruiterProfile) || null;

  const isEditMode = Boolean(jobId);
  const { data: existingJob, isLoading: isJobLoading } = useJobDetail(jobId || "", undefined);

  const createMutation = useCreateJob();
  const updateMutation = useUpdateJob();

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [workMode, setWorkMode] = useState<WorkMode>("onsite");
  const [jobType, setJobType] = useState<JobType>("full_time");
  const [minYears, setMinYears] = useState<number>(0);
  const [maxYears, setMaxYears] = useState<number>(2);
  const [salaryMinLpa, setSalaryMinLpa] = useState<string>("");
  const [salaryMaxLpa, setSalaryMaxLpa] = useState<string>("");
  const [salaryIsVisible, setSalaryIsVisible] = useState<boolean>(true);
  const [skills, setSkills] = useState<string[]>([]);
  const [openings, setOpenings] = useState<number>(1);
  const [applicationDeadline, setApplicationDeadline] = useState<string>("");
  const [status, setStatus] = useState<"draft" | "open" | "closed">("open");

  // Check if company profile is missing
  useEffect(() => {
    if (!isProfileLoading && recruiterProfile) {
      if (!recruiterProfile.companyName?.trim()) {
        toast.error("Please complete your company profile before posting a job.");
        router.push("/recruiter/company");
      }
    }
  }, [isProfileLoading, recruiterProfile, router]);

  // Prepopulate in edit mode
  useEffect(() => {
    if (existingJob) {
      setTitle(existingJob.title || "");
      setDescription(existingJob.description || "");
      setCity(existingJob.location?.city || "");
      setState(existingJob.location?.state || "");
      setWorkMode(existingJob.workMode || "onsite");
      setJobType(existingJob.jobType || "full_time");
      setMinYears(existingJob.experience?.minYears ?? 0);
      setMaxYears(existingJob.experience?.maxYears ?? 2);
      if (existingJob.salary?.min != null) {
        setSalaryMinLpa(String(existingJob.salary.min / 100000));
      }
      if (existingJob.salary?.max != null) {
        setSalaryMaxLpa(String(existingJob.salary.max / 100000));
      }
      setSalaryIsVisible(existingJob.salary?.isVisible ?? true);
      setSkills(existingJob.skills || []);
      setOpenings(existingJob.openings || 1);
      if (existingJob.applicationDeadline) {
        const d = new Date(existingJob.applicationDeadline);
        setApplicationDeadline(d.toISOString().slice(0, 10));
      }
      setStatus(existingJob.status || "open");
    }
  }, [existingJob]);

  const isFresherFriendly = minYears === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const minLpaNum = salaryMinLpa !== "" ? Number(salaryMinLpa) : null;
    const maxLpaNum = salaryMaxLpa !== "" ? Number(salaryMaxLpa) : null;

    const rawValues = {
      title,
      description,
      city,
      state,
      workMode,
      jobType,
      minYears: Number(minYears),
      maxYears: Number(maxYears),
      salaryMinLpa: minLpaNum,
      salaryMaxLpa: maxLpaNum,
      salaryIsVisible,
      skills,
      openings: Number(openings),
      applicationDeadline: applicationDeadline ? new Date(applicationDeadline).toISOString() : null,
      status,
    };

    const validation = jobFormSchema.safeParse(rawValues);
    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || "Please fix validation errors.";
      toast.error(firstError);
      return;
    }

    const payload: any = {
      title: title.trim(),
      description: description.trim(),
      location: {
        city: city.trim(),
        state: state.trim(),
      },
      workMode,
      jobType,
      experience: {
        minYears: Number(minYears),
        maxYears: Number(maxYears),
      },
      salary: {
        min: minLpaNum != null ? Math.round(minLpaNum * 100000) : null,
        max: maxLpaNum != null ? Math.round(maxLpaNum * 100000) : null,
        currency: "INR",
        isVisible: salaryIsVisible,
      },
      skills,
      openings: Number(openings),
      status,
    };

    if (applicationDeadline) {
      payload.applicationDeadline = new Date(applicationDeadline).toISOString();
    }

    try {
      if (isEditMode && jobId) {
        await updateMutation.mutateAsync({ id: jobId, data: payload });
        router.push("/recruiter/dashboard");
      } else {
        await createMutation.mutateAsync(payload);
        router.push("/recruiter/dashboard");
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to save job opening.";
      if (msg.includes("company profile")) {
        router.push("/recruiter/company");
      }
      toast.error(msg);
    }
  };

  if (isProfileLoading || (isEditMode && isJobLoading)) {
    return <BrandLoader message={isEditMode ? "Loading job details..." : "Preparing job editor..."} />;
  }

  return (
    <div className="min-h-screen bg-champagne/40 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back link */}
        <Link
          href="/recruiter/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-ink/80 hover:text-emerald-ink transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl font-bold text-emerald-ink">
              {isEditMode ? "Edit Job Posting" : "Post a New Job Opening"}
            </h1>
            <p className="text-sm text-body-text/70 mt-1">
              {isEditMode
                ? "Update requirements, timeline, or salary details for this position."
                : `Publish a job on Career OS hiring on behalf of ${recruiterProfile?.companyName || "your company"}.`}
            </p>
          </div>

          {/* Live Badge Preview */}
          <div className="flex items-center gap-2">
            {isFresherFriendly ? (
              <Badge variant="fresher" className="gap-1.5 px-3 py-1 text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                Fresher Friendly (0 yrs min exp)
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs">
                Experienced Role ({minYears}+ yrs)
              </Badge>
            )}
          </div>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Role Overview */}
          <Card className="p-6 bg-cream border-champagne-border space-y-4">
            <div className="flex items-center gap-2 border-b border-champagne-border/60 pb-3">
              <Briefcase className="w-5 h-5 text-gold-accent" />
              <h2 className="font-heading text-lg font-bold text-emerald-ink">
                Role Overview
              </h2>
            </div>

            <div className="space-y-4">
              <Input
                label="Job Title *"
                placeholder="e.g. Junior Frontend Developer (React / Next.js)"
                maxLength={150}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                helperText="Use a descriptive, clear title candidates search for."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-emerald-ink mb-1">
                    Work Mode *
                  </label>
                  <select
                    value={workMode}
                    onChange={(e) => setWorkMode(e.target.value as WorkMode)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-champagne/20 border border-champagne-border text-body-text focus:outline-none focus:ring-2 focus:ring-gold-accent transition-all h-10"
                  >
                    <option value="onsite">On-site</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-emerald-ink mb-1">
                    Employment Type *
                  </label>
                  <select
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value as JobType)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-champagne/20 border border-champagne-border text-body-text focus:outline-none focus:ring-2 focus:ring-gold-accent transition-all h-10"
                  >
                    <option value="full_time">Full-time</option>
                    <option value="internship">Internship</option>
                    <option value="part_time">Part-time</option>
                    <option value="contract">Contract</option>
                  </select>
                </div>

                <Input
                  label="Office City"
                  placeholder="e.g. Bengaluru"
                  maxLength={100}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />

                <Input
                  label="Office State"
                  placeholder="e.g. Karnataka"
                  maxLength={100}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-ink mb-1">
                  Job Description *
                </label>
                <textarea
                  rows={6}
                  maxLength={10000}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detail the day-to-day responsibilities, learning opportunities, tech stack, and ideal candidate profile..."
                  className="w-full px-3 py-2 text-sm rounded-xl bg-champagne/20 border border-champagne-border text-body-text placeholder:text-body-text/40 focus:outline-none focus:ring-2 focus:ring-gold-accent transition-all resize-none"
                  required
                />
                <span className="text-[11px] text-body-text/60 block mt-1">
                  {description.length} / 10,000 characters
                </span>
              </div>
            </div>
          </Card>

          {/* Section 2: Experience & Compensation */}
          <Card className="p-6 bg-cream border-champagne-border space-y-4">
            <div className="flex items-center gap-2 border-b border-champagne-border/60 pb-3">
              <IndianRupee className="w-5 h-5 text-gold-accent" />
              <h2 className="font-heading text-lg font-bold text-emerald-ink">
                Experience & Compensation
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Input
                  label="Minimum Experience (Years) *"
                  type="number"
                  min={0}
                  max={50}
                  value={String(minYears)}
                  onChange={(e) => setMinYears(Math.max(0, Number(e.target.value)))}
                  helperText="Set to 0 to mark this role as Fresher Friendly."
                  required
                />
              </div>

              <div>
                <Input
                  label="Maximum Experience (Years) *"
                  type="number"
                  min={minYears}
                  max={50}
                  value={String(maxYears)}
                  onChange={(e) => setMaxYears(Math.max(minYears, Number(e.target.value)))}
                  helperText="Must be greater than or equal to minimum experience."
                  required
                />
              </div>

              <Input
                label="Minimum Salary (LPA)"
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 5 (₹5,00,000)"
                value={salaryMinLpa}
                onChange={(e) => setSalaryMinLpa(e.target.value)}
                helperText="Enter in Lakhs Per Annum (e.g. 6.5)"
              />

              <Input
                label="Maximum Salary (LPA)"
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 8 (₹8,00,000)"
                value={salaryMaxLpa}
                onChange={(e) => setSalaryMaxLpa(e.target.value)}
                helperText="Enter in Lakhs Per Annum (e.g. 10)"
              />

              <div className="sm:col-span-2 flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="salaryIsVisible"
                  checked={salaryIsVisible}
                  onChange={(e) => setSalaryIsVisible(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-ink focus:ring-gold-accent border-champagne-border"
                />
                <label htmlFor="salaryIsVisible" className="text-xs font-medium text-emerald-ink cursor-pointer">
                  Display salary range publicly on job cards (recommended to increase applicant reach)
                </label>
              </div>
            </div>
          </Card>

          {/* Section 3: Skills & Candidate Matching */}
          <Card className="p-6 bg-cream border-champagne-border space-y-4">
            <div className="flex items-center gap-2 border-b border-champagne-border/60 pb-3">
              <Sparkles className="w-5 h-5 text-gold-accent" />
              <h2 className="font-heading text-lg font-bold text-emerald-ink">
                Required Skills
              </h2>
            </div>
            <p className="text-xs text-body-text/70">
              Add the key technical skills candidates need. Career OS automatically calculates a Match Score for every applicant based on these tags.
            </p>
            <TagInput
              tags={skills}
              onChange={setSkills}
              maxTags={20}
              placeholder="e.g. JavaScript, React, SQL, TypeScript (Press Enter)"
            />
          </Card>

          {/* Section 4: Timeline & Openings */}
          <Card className="p-6 bg-cream border-champagne-border space-y-4">
            <div className="flex items-center gap-2 border-b border-champagne-border/60 pb-3">
              <Calendar className="w-5 h-5 text-gold-accent" />
              <h2 className="font-heading text-lg font-bold text-emerald-ink">
                Timeline & Openings
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Number of Openings *"
                type="number"
                min={1}
                value={String(openings)}
                onChange={(e) => setOpenings(Math.max(1, Number(e.target.value)))}
                required
              />

              <div>
                <label className="block text-xs font-semibold text-emerald-ink mb-1">
                  Application Deadline
                </label>
                <input
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={applicationDeadline}
                  onChange={(e) => setApplicationDeadline(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-champagne/20 border border-champagne-border text-body-text focus:outline-none focus:ring-2 focus:ring-gold-accent transition-all h-10"
                />
                <span className="text-[11px] text-body-text/60 block mt-1">
                  Optional. Defaults to open indefinitely.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-emerald-ink mb-1">
                  Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm rounded-xl bg-champagne/20 border border-champagne-border text-body-text focus:outline-none focus:ring-2 focus:ring-gold-accent transition-all h-10"
                >
                  <option value="open">Open (Active & Searchable)</option>
                  <option value="draft">Draft (Saved Privately)</option>
                  <option value="closed">Closed (No Applications)</option>
                </select>
              </div>
            </div>
          </Card>

          {/* Submit Actions */}
          <div className="flex items-center justify-between p-4 bg-cream rounded-2xl border border-champagne-border shadow-soft-emerald">
            <Link href="/recruiter/dashboard">
              <Button type="button" variant="outline" size="sm">
                Cancel
              </Button>
            </Link>

            <Button
              type="submit"
              variant="primary"
              className="gap-2 shadow-md"
              isLoading={createMutation.isPending || updateMutation.isPending}
            >
              <Save className="w-4 h-4" />
              {isEditMode ? "Save Job Changes" : status === "draft" ? "Save as Draft" : "Publish Job Opening"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

