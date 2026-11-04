"use client";

import React, { useState, useEffect } from "react";
import { useProfileMe, useUpdateCandidateProfile } from "../hooks/useProfile";
import { CandidateProfile, EducationItem, ExperienceItem, ProjectItem } from "../../../types/profile";
import { candidateProfileSchema } from "../schemas";
import { Card } from "../../../components/ui/Card";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { TagInput } from "../../../components/ui/TagInput";
import { BrandLoader } from "../../../components/feedback/BrandLoader";
import { toast } from "sonner";
import {
  User,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Globe,
  FileText,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle,
  Save,
} from "lucide-react";

export const CandidateProfilePage: React.FC = () => {
  const { data: profileMe, isLoading } = useProfileMe();
  const updateMutation = useUpdateCandidateProfile();

  const profile = (profileMe as CandidateProfile) || null;

  // Form state
  const [headline, setHeadline] = useState("");
  const [about, setAbout] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [expectedRole, setExpectedRole] = useState("");
  const [openToWork, setOpenToWork] = useState(true);
  const [resumeUrl, setResumeUrl] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [portfolio, setPortfolio] = useState("");

  const [education, setEducation] = useState<EducationItem[]>([]);
  const [experience, setExperience] = useState<ExperienceItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);

  const [isDirty, setIsDirty] = useState(false);

  // Sync profile data once loaded
  useEffect(() => {
    if (profile) {
      setHeadline(profile.headline || "");
      setAbout(profile.about || "");
      setPhone(profile.phone || "");
      setCity(profile.location?.city || "");
      setState(profile.location?.state || "");
      setExpectedRole(profile.expectedRole || "");
      setOpenToWork(profile.openToWork ?? true);
      setResumeUrl(profile.resumeUrl || "");
      setSkills(profile.skills || []);
      setGithub(profile.links?.github || "");
      setLinkedin(profile.links?.linkedin || "");
      setPortfolio(profile.links?.portfolio || "");
      setEducation(profile.education || []);
      setExperience(profile.experience || []);
      setProjects(profile.projects || []);
      setIsDirty(false);
    }
  }, [profile]);

  const completeness = profile?.profileCompleteness ?? 0;

  // Completeness ring calculation (radius 40, circumference ~251)
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (completeness / 100) * circumference;

  // Education handlers
  const addEducation = () => {
    setEducation((prev) => [
      ...prev,
      { degree: "", institute: "", year: new Date().getFullYear(), grade: "" },
    ]);
    setIsDirty(true);
  };

  const removeEducation = (index: number) => {
    setEducation((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const updateEducation = (index: number, field: keyof EducationItem, val: any) => {
    setEducation((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
    setIsDirty(true);
  };

  // Experience handlers
  const addExperience = () => {
    setExperience((prev) => [
      ...prev,
      { title: "", company: "", from: null, to: null, description: "" },
    ]);
    setIsDirty(true);
  };

  const removeExperience = (index: number) => {
    setExperience((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const updateExperience = (index: number, field: keyof ExperienceItem, val: any) => {
    setExperience((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
    setIsDirty(true);
  };

  // Projects handlers
  const addProject = () => {
    setProjects((prev) => [
      ...prev,
      { title: "", description: "", link: "", techStack: [] },
    ]);
    setIsDirty(true);
  };

  const removeProject = (index: number) => {
    setProjects((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const updateProject = (index: number, field: keyof ProjectItem, val: any) => {
    setProjects((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: val } : item))
    );
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      headline: headline.trim(),
      about: about.trim(),
      phone: phone.trim(),
      location: {
        city: city.trim(),
        state: state.trim(),
      },
      education: education.filter((e) => e.degree.trim() && e.institute.trim()),
      skills,
      experience: experience.filter((e) => e.title.trim() && e.company.trim()),
      projects: projects.filter((p) => p.title.trim()),
      links: {
        github: github.trim(),
        linkedin: linkedin.trim(),
        portfolio: portfolio.trim(),
      },
      resumeUrl: resumeUrl.trim(),
      openToWork,
      expectedRole: expectedRole.trim(),
    };

    // Zod validation check
    const validation = candidateProfileSchema.safeParse(payload);
    if (!validation.success) {
      const firstError = validation.error.errors[0]?.message || "Please fix validation errors.";
      toast.error(firstError);
      return;
    }

    try {
      await updateMutation.mutateAsync(payload);
      setIsDirty(false);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Failed to update profile.";
      toast.error(msg);
    }
  };

  if (isLoading) {
    return <BrandLoader message="Loading your profile..." />;
  }

  return (
    <div className="min-h-screen bg-champagne/40 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header + Completeness Ring */}
        <Card className="p-6 sm:p-8 bg-cream border-champagne-border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <h1 className="font-heading text-2xl sm:text-3xl font-bold text-emerald-ink">
                Candidate Profile
              </h1>
              <p className="text-xs sm:text-sm text-body-text/70 max-w-lg">
                Keep your profile detailed and up to date. Freshers are highlighted based on skills, education, and portfolio projects.
              </p>
            </div>

            {/* SVG Completeness Ring */}
            <div className="flex items-center gap-4 bg-champagne/30 p-3 rounded-2xl border border-champagne-border/80">
              <div className="relative w-24 h-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
                  <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    className="text-champagne-border"
                    strokeWidth="8"
                    stroke="currentColor"
                    fill="transparent"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r={radius}
                    className="text-emerald transition-all duration-700 ease-out"
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-heading text-lg font-bold text-emerald-ink">
                    {completeness}%
                  </span>
                </div>
              </div>
              <div className="text-left text-xs">
                <span className="font-semibold text-emerald-ink block">Profile Completeness</span>
                <span className="text-body-text/60">
                  {completeness >= 80
                    ? "Great profile strength!"
                    : "Add more sections to reach 100%"}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Profile Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Basic Information */}
          <Card className="p-6 bg-cream border-champagne-border space-y-4">
            <div className="flex items-center gap-2 border-b border-champagne-border/60 pb-3">
              <User className="w-5 h-5 text-gold-accent" />
              <h2 className="font-heading text-lg font-bold text-emerald-ink">
                Basic Information
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input
                  label="Headline"
                  placeholder="e.g. Aspiring Full Stack Developer | React, Node.js, Python"
                  maxLength={150}
                  value={headline}
                  onChange={(e) => {
                    setHeadline(e.target.value);
                    setIsDirty(true);
                  }}
                  helperText={`${headline.length} / 150 characters`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-emerald-ink mb-1">
                  About You
                </label>
                <textarea
                  rows={4}
                  maxLength={3000}
                  value={about}
                  onChange={(e) => {
                    setAbout(e.target.value);
                    setIsDirty(true);
                  }}
                  placeholder="Tell recruiters about your background, career interests, and passion for technology..."
                  className="w-full px-3 py-2 text-sm rounded-xl bg-champagne/20 border border-champagne-border text-body-text placeholder:text-body-text/40 focus:outline-none focus:ring-2 focus:ring-gold-accent transition-all resize-none"
                />
                <span className="text-[11px] text-body-text/60 block mt-1">
                  {about.length} / 3000 characters
                </span>
              </div>

              <Input
                label="Phone Number"
                placeholder="+91 98765 43210"
                maxLength={25}
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setIsDirty(true);
                }}
              />

              <Input
                label="Expected Role"
                placeholder="e.g. Junior Frontend Engineer"
                maxLength={100}
                value={expectedRole}
                onChange={(e) => {
                  setExpectedRole(e.target.value);
                  setIsDirty(true);
                }}
              />

              <Input
                label="City"
                placeholder="e.g. Bengaluru"
                maxLength={100}
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setIsDirty(true);
                }}
              />

              <Input
                label="State"
                placeholder="e.g. Karnataka"
                maxLength={100}
                value={state}
                onChange={(e) => {
                  setState(e.target.value);
                  setIsDirty(true);
                }}
              />

              <div className="sm:col-span-2 flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="openToWork"
                  checked={openToWork}
                  onChange={(e) => {
                    setOpenToWork(e.target.checked);
                    setIsDirty(true);
                  }}
                  className="w-4 h-4 rounded text-emerald-ink focus:ring-gold-accent border-champagne-border"
                />
                <label htmlFor="openToWork" className="text-xs font-medium text-emerald-ink cursor-pointer">
                  Open to Work (Show recruiters you are actively seeking job opportunities)
                </label>
              </div>
            </div>
          </Card>

          {/* Section 2: Skills */}
          <Card className="p-6 bg-cream border-champagne-border space-y-4">
            <div className="flex items-center gap-2 border-b border-champagne-border/60 pb-3">
              <Sparkles className="w-5 h-5 text-gold-accent" />
              <h2 className="font-heading text-lg font-bold text-emerald-ink">
                Skills & Technologies
              </h2>
            </div>
            <p className="text-xs text-body-text/70">
              Add your technical skills, programming languages, and frameworks. This directly powers the job match score!
            </p>
            <TagInput
              tags={skills}
              onChange={(newSkills) => {
                setSkills(newSkills);
                setIsDirty(true);
              }}
              maxTags={30}
              placeholder="e.g. JavaScript, React, Tailwind, Git (Press Enter)"
            />
          </Card>

          {/* Section 3: Education */}
          <Card className="p-6 bg-cream border-champagne-border space-y-4">
            <div className="flex items-center justify-between border-b border-champagne-border/60 pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-gold-accent" />
                <h2 className="font-heading text-lg font-bold text-emerald-ink">
                  Education
                </h2>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addEducation} className="gap-1 text-xs">
                <Plus className="w-3.5 h-3.5" />
                Add Education
              </Button>
            </div>

            {education.length === 0 ? (
              <p className="text-xs text-body-text/60 italic py-2">
                No education details added yet. Click &quot;Add Education&quot; to add your degree.
              </p>
            ) : (
              <div className="space-y-4">
                {education.map((edu, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-champagne/20 border border-champagne-border space-y-3 relative"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-emerald-ink">
                        Entry #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeEducation(idx)}
                        className="text-error-red hover:text-error-red/80 p-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Degree / Major"
                        placeholder="e.g. B.Tech in Computer Science"
                        value={edu.degree}
                        onChange={(e) => updateEducation(idx, "degree", e.target.value)}
                        required
                      />
                      <Input
                        label="Institute / University"
                        placeholder="e.g. National Institute of Technology"
                        value={edu.institute}
                        onChange={(e) => updateEducation(idx, "institute", e.target.value)}
                        required
                      />
                      <Input
                        label="Graduation Year"
                        type="number"
                        placeholder="e.g. 2026"
                        value={edu.year ? String(edu.year) : ""}
                        onChange={(e) =>
                          updateEducation(idx, "year", e.target.value ? Number(e.target.value) : null)
                        }
                      />
                      <Input
                        label="Grade / CGPA (Optional)"
                        placeholder="e.g. 8.5 CGPA or 85%"
                        value={edu.grade || ""}
                        onChange={(e) => updateEducation(idx, "grade", e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Section 4: Projects */}
          <Card className="p-6 bg-cream border-champagne-border space-y-4">
            <div className="flex items-center justify-between border-b border-champagne-border/60 pb-3">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-5 h-5 text-gold-accent" />
                <h2 className="font-heading text-lg font-bold text-emerald-ink">
                  Projects
                </h2>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addProject} className="gap-1 text-xs">
                <Plus className="w-3.5 h-3.5" />
                Add Project
              </Button>
            </div>

            {projects.length === 0 ? (
              <p className="text-xs text-body-text/60 italic py-2">
                No projects added yet. Adding your portfolio projects significantly boosts fresher profiles.
              </p>
            ) : (
              <div className="space-y-4">
                {projects.map((proj, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-champagne/20 border border-champagne-border space-y-3 relative"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-emerald-ink">
                        Project #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeProject(idx)}
                        className="text-error-red hover:text-error-red/80 p-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Project Title"
                        placeholder="e.g. E-Commerce Web App"
                        value={proj.title}
                        onChange={(e) => updateProject(idx, "title", e.target.value)}
                        required
                      />
                      <Input
                        label="Project URL / GitHub"
                        placeholder="https://github.com/user/project"
                        value={proj.link || ""}
                        onChange={(e) => updateProject(idx, "link", e.target.value)}
                      />
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-emerald-ink mb-1">
                          Description
                        </label>
                        <textarea
                          rows={2}
                          maxLength={2000}
                          value={proj.description || ""}
                          onChange={(e) => updateProject(idx, "description", e.target.value)}
                          placeholder="Briefly describe what you built, key features, and your impact..."
                          className="w-full px-3 py-2 text-sm rounded-xl bg-champagne/20 border border-champagne-border text-body-text placeholder:text-body-text/40 focus:outline-none focus:ring-2 focus:ring-gold-accent transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Section 5: Experience (Optional for Freshers) */}
          <Card className="p-6 bg-cream border-champagne-border space-y-4">
            <div className="flex items-center justify-between border-b border-champagne-border/60 pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-gold-accent" />
                <h2 className="font-heading text-lg font-bold text-emerald-ink">
                  Work Experience
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-champagne text-body-text/70">
                  Optional
                </span>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addExperience} className="gap-1 text-xs">
                <Plus className="w-3.5 h-3.5" />
                Add Experience
              </Button>
            </div>

            {experience.length === 0 ? (
              <p className="text-xs text-body-text/60 italic py-2">
                No experience added. Freshers do not require prior experience, but internships can be added here.
              </p>
            ) : (
              <div className="space-y-4">
                {experience.map((exp, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-champagne/20 border border-champagne-border space-y-3 relative"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-emerald-ink">
                        Role #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeExperience(idx)}
                        className="text-error-red hover:text-error-red/80 p-1 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Job Title"
                        placeholder="e.g. Frontend Intern"
                        value={exp.title}
                        onChange={(e) => updateExperience(idx, "title", e.target.value)}
                        required
                      />
                      <Input
                        label="Company"
                        placeholder="e.g. Acme Tech"
                        value={exp.company}
                        onChange={(e) => updateExperience(idx, "company", e.target.value)}
                        required
                      />
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-semibold text-emerald-ink mb-1">
                          Role Description
                        </label>
                        <textarea
                          rows={2}
                          maxLength={2500}
                          value={exp.description || ""}
                          onChange={(e) => updateExperience(idx, "description", e.target.value)}
                          placeholder="What were your core contributions and achievements..."
                          className="w-full px-3 py-2 text-sm rounded-xl bg-champagne/20 border border-champagne-border text-body-text placeholder:text-body-text/40 focus:outline-none focus:ring-2 focus:ring-gold-accent transition-all resize-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Section 6: Links & Resume */}
          <Card className="p-6 bg-cream border-champagne-border space-y-4">
            <div className="flex items-center gap-2 border-b border-champagne-border/60 pb-3">
              <Globe className="w-5 h-5 text-gold-accent" />
              <h2 className="font-heading text-lg font-bold text-emerald-ink">
                Links & Resume
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="GitHub URL"
                placeholder="https://github.com/yourusername"
                value={github}
                onChange={(e) => {
                  setGithub(e.target.value);
                  setIsDirty(true);
                }}
              />
              <Input
                label="LinkedIn URL"
                placeholder="https://linkedin.com/in/yourusername"
                value={linkedin}
                onChange={(e) => {
                  setLinkedin(e.target.value);
                  setIsDirty(true);
                }}
              />
              <Input
                label="Portfolio URL"
                placeholder="https://yourportfolio.dev"
                value={portfolio}
                onChange={(e) => {
                  setPortfolio(e.target.value);
                  setIsDirty(true);
                }}
              />

              <div className="sm:col-span-3">
                <Input
                  label="Resume Document URL"
                  placeholder="https://drive.google.com/file/d/... (Public or Viewable Link)"
                  value={resumeUrl}
                  onChange={(e) => {
                    setResumeUrl(e.target.value);
                    setIsDirty(true);
                  }}
                  helperText="Provide a direct link to your hosted resume PDF on Google Drive, Dropbox, or OneDrive."
                />
              </div>
            </div>
          </Card>

          {/* Floating/Fixed Save Bar */}
          <div className="flex items-center justify-between p-4 bg-cream rounded-2xl border border-champagne-border shadow-soft-emerald">
            <span className="text-xs text-body-text/70">
              {isDirty ? (
                <span className="text-gold-accent font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gold-accent animate-pulse" />
                  You have unsaved changes
                </span>
              ) : (
                <span className="text-emerald-ink flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald" />
                  All changes saved
                </span>
              )}
            </span>

            <Button
              type="submit"
              variant="primary"
              className="gap-2"
              isLoading={updateMutation.isPending}
            >
              <Save className="w-4 h-4" />
              Save Profile
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
