"use client";

import React, { useState } from "react";
import {
  ResumeDraftData,
  ResumeEducation,
  ResumeProject,
  ResumeExperience,
  ResumeCertification,
  SkillCategory,
} from "../types/resumeBuilder.types";
import { Button } from "../../../components/ui/Button";
import {
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Plus,
  Trash2,
  Sparkles,
  User,
  FileText,
  Wrench,
  GraduationCap,
  FolderGit2,
  Briefcase,
  Award,
} from "lucide-react";
import { CandidateProfile } from "../../../types/profile";
import { toast } from "sonner";

interface ResumeFormProps {
  draft: ResumeDraftData;
  onChange: (updated: ResumeDraftData) => void;
  candidateProfile?: CandidateProfile | null;
}

const SECTION_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType }
> = {
  summary: { label: "Professional Summary", icon: FileText },
  skills: { label: "Technical Skills", icon: Wrench },
  projects: { label: "Projects", icon: FolderGit2 },
  experience: { label: "Experience", icon: Briefcase },
  education: { label: "Education", icon: GraduationCap },
  certifications: { label: "Certifications", icon: Award },
};

export const ResumeForm: React.FC<ResumeFormProps> = ({
  draft,
  onChange,
  candidateProfile,
}) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggleCollapse = (key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFieldChange = <K extends keyof ResumeDraftData>(
    field: K,
    value: ResumeDraftData[K]
  ) => {
    onChange({ ...draft, [field]: value });
  };

  const handleContactChange = (field: keyof ResumeDraftData["contact"], val: string) => {
    onChange({
      ...draft,
      contact: {
        ...draft.contact,
        [field]: val,
      },
    });
  };

  // Prefill only empty fields from candidate profile
  const handlePrefillFromProfile = () => {
    if (!candidateProfile) {
      toast.info("No candidate profile found to prefill.");
      return;
    }

    let filledCount = 0;
    const next: ResumeDraftData = { ...draft };

    if (!next.fullName?.trim() && candidateProfile.user?.name) {
      next.fullName = candidateProfile.user.name;
      filledCount++;
    }
    if (!next.headline?.trim() && candidateProfile.headline) {
      next.headline = candidateProfile.headline;
      filledCount++;
    }
    if (!next.contact?.email?.trim() && candidateProfile.user?.email) {
      next.contact = { ...(next.contact || {}), email: candidateProfile.user.email };
      filledCount++;
    }
    if (!next.contact?.phone?.trim() && candidateProfile.phone) {
      next.contact = { ...(next.contact || {}), phone: candidateProfile.phone };
      filledCount++;
    }
    if (!next.contact?.city?.trim() && candidateProfile.location?.city) {
      next.contact = { ...(next.contact || {}), city: candidateProfile.location.city };
      filledCount++;
    }
    if (!next.contact?.linkedin?.trim() && candidateProfile.links?.linkedin) {
      next.contact = { ...(next.contact || {}), linkedin: candidateProfile.links.linkedin };
      filledCount++;
    }
    if (!next.contact?.github?.trim() && candidateProfile.links?.github) {
      next.contact = { ...(next.contact || {}), github: candidateProfile.links.github };
      filledCount++;
    }
    if (!next.contact?.portfolio?.trim() && candidateProfile.links?.portfolio) {
      next.contact = { ...(next.contact || {}), portfolio: candidateProfile.links.portfolio };
      filledCount++;
    }
    if (!next.summary?.trim() && candidateProfile.about) {
      next.summary = candidateProfile.about.slice(0, 400);
      filledCount++;
    }
    if ((!next.skills || next.skills.length === 0) && candidateProfile.skills?.length) {
      next.skills = [
        {
          category: "Key Skills",
          items: candidateProfile.skills.slice(0, 15),
        },
      ];
      filledCount++;
    }

    if (filledCount > 0) {
      onChange(next);
      toast.success(`Prefilled ${filledCount} field${filledCount > 1 ? "s" : ""} from your profile.`);
    } else {
      toast.info("Your resume already has info in all matching profile fields.");
    }
  };

  // Section reordering
  const moveSection = (idx: number, direction: "up" | "down") => {
    const order = [...(draft.sectionOrder || ["summary", "skills", "projects", "experience", "education", "certifications"])];
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= order.length) return;
    const temp = order[idx];
    order[idx] = order[targetIdx];
    order[targetIdx] = temp;
    onChange({ ...draft, sectionOrder: order });
  };

  const sectionOrder = draft.sectionOrder?.length
    ? draft.sectionOrder
    : ["summary", "skills", "projects", "experience", "education", "certifications"];

  return (
    <div className="space-y-4">
      {/* Prefill Toolbar */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-champagne/30 border border-champagne-border">
        <div className="text-xs">
          <p className="font-semibold text-emerald-ink">Have a completed profile?</p>
          <p className="text-body-text/70 text-[11px]">
            Prefill empty fields with contact details, skills, and summary.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handlePrefillFromProfile}
          className="text-xs gap-1.5 border-emerald/30 hover:border-emerald text-emerald-ink"
        >
          <Sparkles className="w-3.5 h-3.5 text-gold-accent" />
          Prefill from profile
        </Button>
      </div>

      {/* 1. Basics & Contact (Always at top) */}
      <div className="border border-champagne-border rounded-xl bg-cream/70 p-4 shadow-sm">
        <div
          className="flex items-center justify-between cursor-pointer select-none"
          onClick={() => toggleCollapse("basics")}
        >
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-ink" />
            <h2 className="text-sm font-bold text-emerald-ink">Personal Details & Contact</h2>
          </div>
          <button type="button" className="text-body-text/60 hover:text-emerald-ink">
            {collapsed["basics"] ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>

        {!collapsed["basics"] && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-emerald-ink mb-1">Full Name *</label>
              <input
                type="text"
                value={draft.fullName || ""}
                onChange={(e) => handleFieldChange("fullName", e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-3 py-2 rounded-lg bg-white border border-champagne-border focus:ring-2 focus:ring-gold-accent outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-emerald-ink mb-1">Headline / Target Role</label>
              <input
                type="text"
                value={draft.headline || ""}
                onChange={(e) => handleFieldChange("headline", e.target.value)}
                placeholder="e.g. Full Stack Developer | React & Node.js"
                className="w-full px-3 py-2 rounded-lg bg-white border border-champagne-border focus:ring-2 focus:ring-gold-accent outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-emerald-ink mb-1">Email</label>
              <input
                type="email"
                value={draft.contact?.email || ""}
                onChange={(e) => handleContactChange("email", e.target.value)}
                placeholder="rahul@example.com"
                className="w-full px-3 py-2 rounded-lg bg-white border border-champagne-border focus:ring-2 focus:ring-gold-accent outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-emerald-ink mb-1">Phone</label>
              <input
                type="tel"
                value={draft.contact?.phone || ""}
                onChange={(e) => handleContactChange("phone", e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full px-3 py-2 rounded-lg bg-white border border-champagne-border focus:ring-2 focus:ring-gold-accent outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-emerald-ink mb-1">City / Location</label>
              <input
                type="text"
                value={draft.contact?.city || ""}
                onChange={(e) => handleContactChange("city", e.target.value)}
                placeholder="Bengaluru, Karnataka"
                className="w-full px-3 py-2 rounded-lg bg-white border border-champagne-border focus:ring-2 focus:ring-gold-accent outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-emerald-ink mb-1">LinkedIn URL</label>
              <input
                type="url"
                value={draft.contact?.linkedin || ""}
                onChange={(e) => handleContactChange("linkedin", e.target.value)}
                placeholder="https://linkedin.com/in/rahul"
                className="w-full px-3 py-2 rounded-lg bg-white border border-champagne-border focus:ring-2 focus:ring-gold-accent outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-emerald-ink mb-1">GitHub URL</label>
              <input
                type="url"
                value={draft.contact?.github || ""}
                onChange={(e) => handleContactChange("github", e.target.value)}
                placeholder="https://github.com/rahul"
                className="w-full px-3 py-2 rounded-lg bg-white border border-champagne-border focus:ring-2 focus:ring-gold-accent outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-emerald-ink mb-1">Portfolio / Website</label>
              <input
                type="url"
                value={draft.contact?.portfolio || ""}
                onChange={(e) => handleContactChange("portfolio", e.target.value)}
                placeholder="https://rahul.dev"
                className="w-full px-3 py-2 rounded-lg bg-white border border-champagne-border focus:ring-2 focus:ring-gold-accent outline-none"
              />
            </div>
          </div>
        )}
      </div>

      {/* Dynamic Reorderable Sections */}
      {sectionOrder.map((sectionKey, sIdx) => {
        const config = SECTION_CONFIG[sectionKey] || { label: sectionKey, icon: FileText };
        const Icon = config.icon;
        const isFirst = sIdx === 0;
        const isLast = sIdx === sectionOrder.length - 1;

        return (
          <div
            key={sectionKey}
            className="border border-champagne-border rounded-xl bg-cream/70 p-4 shadow-sm"
          >
            {/* Section Header with Reorder Arrows */}
            <div className="flex items-center justify-between select-none">
              <div
                className="flex items-center gap-2 cursor-pointer flex-1"
                onClick={() => toggleCollapse(sectionKey)}
              >
                <Icon className="w-4 h-4 text-emerald-ink" />
                <h2 className="text-sm font-bold text-emerald-ink">{config.label}</h2>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  title="Move section up"
                  disabled={isFirst}
                  onClick={() => moveSection(sIdx, "up")}
                  className="p-1 rounded text-body-text/60 hover:text-emerald-ink disabled:opacity-20 hover:bg-champagne/40"
                  aria-label={`Move ${config.label} up`}
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Move section down"
                  disabled={isLast}
                  onClick={() => moveSection(sIdx, "down")}
                  className="p-1 rounded text-body-text/60 hover:text-emerald-ink disabled:opacity-20 hover:bg-champagne/40"
                  aria-label={`Move ${config.label} down`}
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleCollapse(sectionKey)}
                  className="p-1 rounded text-body-text/60 hover:text-emerald-ink hover:bg-champagne/40 ml-1"
                >
                  {collapsed[sectionKey] ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Section Body */}
            {!collapsed[sectionKey] && (
              <div className="mt-4 text-xs">
                {/* SUMMARY */}
                {sectionKey === "summary" && (
                  <div>
                    <label className="block font-semibold text-emerald-ink mb-1">
                      Summary (max 400 characters)
                    </label>
                    <textarea
                      rows={3}
                      maxLength={400}
                      value={draft.summary || ""}
                      onChange={(e) => handleFieldChange("summary", e.target.value)}
                      placeholder="Brief overview of your background, technical interests, and aspirations..."
                      className="w-full px-3 py-2 rounded-lg bg-white border border-champagne-border focus:ring-2 focus:ring-gold-accent outline-none resize-none"
                    />
                    <div className="flex justify-end text-[11px] text-body-text/60 mt-1">
                      <span>{(draft.summary || "").length} / 400</span>
                    </div>
                  </div>
                )}

                {/* SKILLS */}
                {sectionKey === "skills" && (
                  <div className="space-y-3">
                    {draft.skills?.map((sk, catIdx) => (
                      <div
                        key={catIdx}
                        className="p-3 rounded-lg bg-white border border-champagne-border space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={sk.category}
                            onChange={(e) => {
                              const updated = [...draft.skills];
                              updated[catIdx].category = e.target.value;
                              handleFieldChange("skills", updated);
                            }}
                            placeholder="Category (e.g. Languages, Frameworks, Databases)"
                            className="font-semibold text-emerald-ink bg-transparent border-b border-champagne-border focus:border-gold-accent outline-none text-xs flex-1 pb-0.5"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = draft.skills.filter((_, i) => i !== catIdx);
                              handleFieldChange("skills", updated);
                            }}
                            className="text-body-text/50 hover:text-error-red p-1"
                            title="Remove Category"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div>
                          <input
                            type="text"
                            value={sk.items.join(", ")}
                            onChange={(e) => {
                              const updated = [...draft.skills];
                              updated[catIdx].items = e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean);
                              handleFieldChange("skills", updated);
                            }}
                            placeholder="Comma-separated items (e.g. TypeScript, React, Next.js)"
                            className="w-full px-2.5 py-1.5 rounded bg-cream/40 border border-champagne-border text-xs focus:ring-1 focus:ring-gold-accent outline-none"
                          />
                        </div>
                      </div>
                    ))}
                    {draft.skills?.length < 10 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleFieldChange("skills", [
                            ...draft.skills,
                            { category: "", items: [] },
                          ]);
                        }}
                        className="w-full text-xs gap-1.5 border-dashed"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Skill Category
                      </Button>
                    )}
                  </div>
                )}

                {/* PROJECTS */}
                {sectionKey === "projects" && (
                  <div className="space-y-4">
                    {draft.projects?.map((proj, pIdx) => (
                      <div
                        key={pIdx}
                        className="p-3 rounded-lg bg-white border border-champagne-border space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={proj.name}
                            onChange={(e) => {
                              const updated = [...draft.projects];
                              updated[pIdx].name = e.target.value;
                              handleFieldChange("projects", updated);
                            }}
                            placeholder="Project Name *"
                            className="font-semibold text-emerald-ink bg-transparent border-b border-champagne-border focus:border-gold-accent outline-none text-xs flex-1 pb-0.5"
                          />
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={pIdx === 0}
                              onClick={() => {
                                const updated = [...draft.projects];
                                const temp = updated[pIdx];
                                updated[pIdx] = updated[pIdx - 1];
                                updated[pIdx - 1] = temp;
                                handleFieldChange("projects", updated);
                              }}
                              className="p-1 text-body-text/50 hover:text-emerald-ink disabled:opacity-20"
                              title="Move project up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={pIdx === draft.projects.length - 1}
                              onClick={() => {
                                const updated = [...draft.projects];
                                const temp = updated[pIdx];
                                updated[pIdx] = updated[pIdx + 1];
                                updated[pIdx + 1] = temp;
                                handleFieldChange("projects", updated);
                              }}
                              className="p-1 text-body-text/50 hover:text-emerald-ink disabled:opacity-20"
                              title="Move project down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = draft.projects.filter((_, i) => i !== pIdx);
                                handleFieldChange("projects", updated);
                              }}
                              className="text-body-text/50 hover:text-error-red p-1 ml-1"
                              title="Delete project"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <input
                              type="text"
                              value={proj.techStack?.join(", ") || ""}
                              onChange={(e) => {
                                const updated = [...draft.projects];
                                updated[pIdx].techStack = e.target.value
                                  .split(",")
                                  .map((s) => s.trim())
                                  .filter(Boolean);
                                handleFieldChange("projects", updated);
                              }}
                              placeholder="Technologies (e.g. Next.js, Node.js, PostgreSQL)"
                              className="w-full px-2.5 py-1.5 rounded bg-cream/30 border border-champagne-border text-xs outline-none"
                            />
                          </div>
                          <div>
                            <input
                              type="url"
                              value={proj.link || ""}
                              onChange={(e) => {
                                const updated = [...draft.projects];
                                updated[pIdx].link = e.target.value;
                                handleFieldChange("projects", updated);
                              }}
                              placeholder="Live Link / GitHub Repo (optional)"
                              className="w-full px-2.5 py-1.5 rounded bg-cream/30 border border-champagne-border text-xs outline-none"
                            />
                          </div>
                        </div>

                        {/* Bullets */}
                        <div className="space-y-1.5 pt-1">
                          <label className="block text-[11px] font-semibold text-emerald-ink">
                            Bullet Points (Action verbs, metrics, max 220 chars each)
                          </label>
                          {proj.bullets?.map((b, bIdx) => (
                            <div key={bIdx} className="flex items-center gap-2">
                              <input
                                type="text"
                                maxLength={220}
                                value={b}
                                onChange={(e) => {
                                  const updated = [...draft.projects];
                                  updated[pIdx].bullets[bIdx] = e.target.value;
                                  handleFieldChange("projects", updated);
                                }}
                                placeholder="e.g. Built automated REST APIs decreasing latency by 25%..."
                                className="w-full px-2.5 py-1.5 rounded bg-cream/30 border border-champagne-border text-xs outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...draft.projects];
                                  updated[pIdx].bullets = updated[pIdx].bullets.filter(
                                    (_, i) => i !== bIdx
                                  );
                                  handleFieldChange("projects", updated);
                                }}
                                className="text-body-text/50 hover:text-error-red p-1 shrink-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {proj.bullets?.length < 5 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...draft.projects];
                                updated[pIdx].bullets = [...(updated[pIdx].bullets || []), ""];
                                handleFieldChange("projects", updated);
                              }}
                              className="text-[11px] text-emerald-ink font-semibold hover:underline flex items-center gap-1 mt-1"
                            >
                              <Plus className="w-3 h-3" /> Add Bullet Point
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {draft.projects?.length < 8 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleFieldChange("projects", [
                            ...draft.projects,
                            { name: "", techStack: [], link: "", bullets: [""] },
                          ]);
                        }}
                        className="w-full text-xs gap-1.5 border-dashed"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Project
                      </Button>
                    )}
                  </div>
                )}

                {/* EXPERIENCE */}
                {sectionKey === "experience" && (
                  <div className="space-y-4">
                    {draft.experience?.map((exp, eIdx) => (
                      <div
                        key={eIdx}
                        className="p-3 rounded-lg bg-white border border-champagne-border space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={exp.role}
                            onChange={(e) => {
                              const updated = [...draft.experience];
                              updated[eIdx].role = e.target.value;
                              handleFieldChange("experience", updated);
                            }}
                            placeholder="Role / Title (e.g. Software Engineer Intern) *"
                            className="font-semibold text-emerald-ink bg-transparent border-b border-champagne-border focus:border-gold-accent outline-none text-xs flex-1 pb-0.5"
                          />
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={eIdx === 0}
                              onClick={() => {
                                const updated = [...draft.experience];
                                const temp = updated[eIdx];
                                updated[eIdx] = updated[eIdx - 1];
                                updated[eIdx - 1] = temp;
                                handleFieldChange("experience", updated);
                              }}
                              className="p-1 text-body-text/50 hover:text-emerald-ink disabled:opacity-20"
                              title="Move experience up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={eIdx === draft.experience.length - 1}
                              onClick={() => {
                                const updated = [...draft.experience];
                                const temp = updated[eIdx];
                                updated[eIdx] = updated[eIdx + 1];
                                updated[eIdx + 1] = temp;
                                handleFieldChange("experience", updated);
                              }}
                              className="p-1 text-body-text/50 hover:text-emerald-ink disabled:opacity-20"
                              title="Move experience down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = draft.experience.filter((_, i) => i !== eIdx);
                                handleFieldChange("experience", updated);
                              }}
                              className="text-body-text/50 hover:text-error-red p-1 ml-1"
                              title="Delete experience"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-1">
                            <input
                              type="text"
                              value={exp.company}
                              onChange={(e) => {
                                const updated = [...draft.experience];
                                updated[eIdx].company = e.target.value;
                                handleFieldChange("experience", updated);
                              }}
                              placeholder="Company Name *"
                              className="w-full px-2.5 py-1.5 rounded bg-cream/30 border border-champagne-border text-xs outline-none"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={exp.startDate || ""}
                              onChange={(e) => {
                                const updated = [...draft.experience];
                                updated[eIdx].startDate = e.target.value;
                                handleFieldChange("experience", updated);
                              }}
                              placeholder="Start (e.g. Jun 2024)"
                              className="w-full px-2.5 py-1.5 rounded bg-cream/30 border border-champagne-border text-xs outline-none"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              disabled={exp.current}
                              value={exp.current ? "Present" : exp.endDate || ""}
                              onChange={(e) => {
                                const updated = [...draft.experience];
                                updated[eIdx].endDate = e.target.value;
                                handleFieldChange("experience", updated);
                              }}
                              placeholder="End (e.g. Present)"
                              className="w-full px-2.5 py-1.5 rounded bg-cream/30 border border-champagne-border text-xs outline-none disabled:bg-champagne/20"
                            />
                            <label className="flex items-center gap-1 text-[11px] text-body-text/80 cursor-pointer shrink-0">
                              <input
                                type="checkbox"
                                checked={!!exp.current}
                                onChange={(e) => {
                                  const updated = [...draft.experience];
                                  updated[eIdx].current = e.target.checked;
                                  if (e.target.checked) updated[eIdx].endDate = "Present";
                                  handleFieldChange("experience", updated);
                                }}
                                className="rounded text-emerald"
                              />
                              Current
                            </label>
                          </div>
                        </div>

                        {/* Bullets */}
                        <div className="space-y-1.5 pt-1">
                          <label className="block text-[11px] font-semibold text-emerald-ink">
                            Bullet Points (max 220 chars each)
                          </label>
                          {exp.bullets?.map((b, bIdx) => (
                            <div key={bIdx} className="flex items-center gap-2">
                              <input
                                type="text"
                                maxLength={220}
                                value={b}
                                onChange={(e) => {
                                  const updated = [...draft.experience];
                                  updated[eIdx].bullets[bIdx] = e.target.value;
                                  handleFieldChange("experience", updated);
                                }}
                                placeholder="e.g. Contributed to core user dashboard improving UX..."
                                className="w-full px-2.5 py-1.5 rounded bg-cream/30 border border-champagne-border text-xs outline-none"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...draft.experience];
                                  updated[eIdx].bullets = updated[eIdx].bullets.filter(
                                    (_, i) => i !== bIdx
                                  );
                                  handleFieldChange("experience", updated);
                                }}
                                className="text-body-text/50 hover:text-error-red p-1 shrink-0"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {exp.bullets?.length < 5 && (
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...draft.experience];
                                updated[eIdx].bullets = [...(updated[eIdx].bullets || []), ""];
                                handleFieldChange("experience", updated);
                              }}
                              className="text-[11px] text-emerald-ink font-semibold hover:underline flex items-center gap-1 mt-1"
                            >
                              <Plus className="w-3 h-3" /> Add Bullet Point
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {draft.experience?.length < 6 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          handleFieldChange("experience", [
                            ...draft.experience,
                            {
                              role: "",
                              company: "",
                              startDate: "",
                              endDate: "",
                              current: false,
                              bullets: [""],
                            },
                          ]);
                        }}
                        className="w-full text-xs gap-1.5 border-dashed"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Experience
                      </Button>
                    )}
                  </div>
                )}

                {/* EDUCATION */}
                {sectionKey === "education" && (
                  <div className="space-y-3">
                    {draft.education?.map((edu, eduIdx) => (
                      <div
                        key={eduIdx}
                        className="p-3 rounded-lg bg-white border border-champagne-border space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={edu.degree}
                            onChange={(e) => {
                              const updated = [...draft.education];
                              updated[eduIdx].degree = e.target.value;
                              handleFieldChange("education", updated);
                            }}
                            placeholder="Degree / Program (e.g. B.Tech Computer Science) *"
                            className="font-semibold text-emerald-ink bg-transparent border-b border-champagne-border focus:border-gold-accent outline-none text-xs flex-1 pb-0.5"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = draft.education.filter((_, i) => i !== eduIdx);
                              handleFieldChange("education", updated);
                            }}
                            className="text-body-text/50 hover:text-error-red p-1"
                            title="Remove Education"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div className="sm:col-span-1">
                            <input
                              type="text"
                              value={edu.institute}
                              onChange={(e) => {
                                const updated = [...draft.education];
                                updated[eduIdx].institute = e.target.value;
                                handleFieldChange("education", updated);
                              }}
                              placeholder="Institute / College *"
                              className="w-full px-2.5 py-1.5 rounded bg-cream/30 border border-champagne-border text-xs outline-none"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={edu.endYear || ""}
                              onChange={(e) => {
                                const updated = [...draft.education];
                                updated[eduIdx].endYear = e.target.value;
                                handleFieldChange("education", updated);
                              }}
                              placeholder="Graduation Year (e.g. 2025)"
                              className="w-full px-2.5 py-1.5 rounded bg-cream/30 border border-champagne-border text-xs outline-none"
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              value={edu.grade || ""}
                              onChange={(e) => {
                                const updated = [...draft.education];
                                updated[eduIdx].grade = e.target.value;
                                handleFieldChange("education", updated);
                              }}
                              placeholder="CGPA / Grade (e.g. 8.5 CGPA)"
                              className="w-full px-2.5 py-1.5 rounded bg-cream/30 border border-champagne-border text-xs outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleFieldChange("education", [
                          ...draft.education,
                          { degree: "", institute: "", startYear: "", endYear: "", grade: "" },
                        ]);
                      }}
                      className="w-full text-xs gap-1.5 border-dashed"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Education
                    </Button>
                  </div>
                )}

                {/* CERTIFICATIONS */}
                {sectionKey === "certifications" && (
                  <div className="space-y-3">
                    {draft.certifications?.map((c, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-3 rounded-lg bg-white border border-champagne-border space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={c.name}
                            onChange={(e) => {
                              const updated = [...draft.certifications];
                              updated[cIdx].name = e.target.value;
                              handleFieldChange("certifications", updated);
                            }}
                            placeholder="Certification Name *"
                            className="font-semibold text-emerald-ink bg-transparent border-b border-champagne-border focus:border-gold-accent outline-none text-xs flex-1 pb-0.5"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = draft.certifications.filter((_, i) => i !== cIdx);
                              handleFieldChange("certifications", updated);
                            }}
                            className="text-body-text/50 hover:text-error-red p-1"
                            title="Remove Certification"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={c.issuer || ""}
                            onChange={(e) => {
                              const updated = [...draft.certifications];
                              updated[cIdx].issuer = e.target.value;
                              handleFieldChange("certifications", updated);
                            }}
                            placeholder="Issuing Organization (e.g. AWS, Meta)"
                            className="w-full px-2.5 py-1.5 rounded bg-cream/30 border border-champagne-border text-xs outline-none"
                          />
                          <input
                            type="text"
                            value={c.year || ""}
                            onChange={(e) => {
                              const updated = [...draft.certifications];
                              updated[cIdx].year = e.target.value;
                              handleFieldChange("certifications", updated);
                            }}
                            placeholder="Year (e.g. 2024)"
                            className="w-full px-2.5 py-1.5 rounded bg-cream/30 border border-champagne-border text-xs outline-none"
                          />
                        </div>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleFieldChange("certifications", [
                          ...draft.certifications,
                          { name: "", issuer: "", year: "" },
                        ]);
                      }}
                      className="w-full text-xs gap-1.5 border-dashed"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Certification
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
