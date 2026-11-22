"use client";

import React, { useMemo } from "react";
import { ResumeDraftData } from "../types/resumeBuilder.types";
import { CheckCircle2, AlertTriangle, ExternalLink } from "lucide-react";

interface ResumePreviewProps {
  draft: ResumeDraftData;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ draft }) => {
  const isClassic = draft.template === "classic";

  // Estimate page fit based on content density
  const { estimatedPages, isOnePageFit } = useMemo(() => {
    let lineEstimate = 4; // header info
    if (draft.summary) lineEstimate += Math.ceil(draft.summary.length / 85) + 2;
    if (draft.skills?.length) lineEstimate += draft.skills.length + 2;
    if (draft.experience?.length) {
      draft.experience.forEach((e) => {
        lineEstimate += 2 + (e.bullets?.length || 0) * 1.5;
      });
      lineEstimate += 2;
    }
    if (draft.projects?.length) {
      draft.projects.forEach((p) => {
        lineEstimate += 2 + (p.bullets?.length || 0) * 1.5;
      });
      lineEstimate += 2;
    }
    if (draft.education?.length) {
      lineEstimate += draft.education.length * 2 + 2;
    }
    if (draft.certifications?.length) {
      lineEstimate += draft.certifications.length * 1.5 + 2;
    }

    const pages = lineEstimate <= 48 ? 1 : Math.ceil(lineEstimate / 46);
    return { estimatedPages: pages, isOnePageFit: pages === 1 };
  }, [draft]);

  const contactItems = [
    draft.contact?.email,
    draft.contact?.phone,
    draft.contact?.city,
    draft.contact?.linkedin,
    draft.contact?.github,
    draft.contact?.portfolio,
  ].filter(Boolean);

  const sectionOrder = draft.sectionOrder?.length
    ? draft.sectionOrder
    : ["summary", "skills", "projects", "experience", "education", "certifications"];

  const fontClass = isClassic
    ? "font-serif text-[#111827]"
    : "font-sans text-[#0f172a]";

  return (
    <div className="flex flex-col h-full">
      {/* Page fit bar */}
      <div className="mb-3 flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-champagne/40 border border-champagne-border">
        <div className="flex items-center gap-1.5 font-medium">
          {isOnePageFit ? (
            <span className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Fits on 1 page
            </span>
          ) : (
            <span className="text-amber-700 dark:text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> ~{estimatedPages} pages (Fresher tip: trim bullets to fit 1 page)
            </span>
          )}
        </div>
        <span className="text-body-text/60 text-[11px]">
          Template: <strong className="capitalize">{draft.template}</strong>
        </span>
      </div>

      {/* A4 Sheet Container */}
      <div className="flex-1 overflow-auto bg-champagne/20 rounded-xl p-2 sm:p-4 border border-champagne-border/80 shadow-inner">
        <div
          className={`mx-auto bg-white text-black shadow-md rounded-sm min-h-[842px] max-w-[595px] p-8 sm:p-10 ${fontClass} transition-all`}
          style={{
            lineHeight: isClassic ? "1.4" : "1.45",
          }}
        >
          {/* Header */}
          <div className={`mb-5 ${isClassic ? "text-center pb-4 border-b border-gray-300" : "text-left pb-4 border-b-2 border-emerald-800/40"}`}>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              {draft.fullName || "Your Full Name"}
            </h1>
            {draft.headline && (
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-600 mt-1">
                {draft.headline}
              </p>
            )}
            {contactItems.length > 0 && (
              <p className="text-[10px] text-gray-600 mt-2 flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
                {contactItems.map((c, i) => (
                  <span key={i} className="inline-flex items-center">
                    {c}
                    {i < contactItems.length - 1 && <span className="ml-2 text-gray-400">|</span>}
                  </span>
                ))}
              </p>
            )}
          </div>

          {/* Sections in order */}
          <div className="space-y-4 text-xs">
            {sectionOrder.map((sectionKey) => {
              if (sectionKey === "summary" && draft.summary?.trim()) {
                return (
                  <div key="summary" className="space-y-1">
                    <h2
                      className={`text-[11px] font-bold uppercase tracking-wider pb-0.5 ${
                        isClassic
                          ? "border-b border-gray-300 text-gray-800"
                          : "border-b border-emerald-800 text-emerald-900"
                      }`}
                    >
                      Summary
                    </h2>
                    <p className="text-[11px] text-gray-700 leading-relaxed text-justify">
                      {draft.summary}
                    </p>
                  </div>
                );
              }

              if (sectionKey === "skills" && draft.skills?.length > 0) {
                const validSkills = draft.skills.filter(
                  (s) => s.category?.trim() && s.items?.length > 0
                );
                if (!validSkills.length) return null;
                return (
                  <div key="skills" className="space-y-1">
                    <h2
                      className={`text-[11px] font-bold uppercase tracking-wider pb-0.5 ${
                        isClassic
                          ? "border-b border-gray-300 text-gray-800"
                          : "border-b border-emerald-800 text-emerald-900"
                      }`}
                    >
                      Skills
                    </h2>
                    <div className="space-y-0.5 text-[11px]">
                      {validSkills.map((sk, idx) => (
                        <p key={idx} className="text-gray-700">
                          <strong className="text-gray-900 font-semibold">{sk.category}: </strong>
                          {sk.items.join(", ")}
                        </p>
                      ))}
                    </div>
                  </div>
                );
              }

              if (sectionKey === "projects" && draft.projects?.length > 0) {
                const validProjects = draft.projects.filter((p) => p.name?.trim());
                if (!validProjects.length) return null;
                return (
                  <div key="projects" className="space-y-2">
                    <h2
                      className={`text-[11px] font-bold uppercase tracking-wider pb-0.5 ${
                        isClassic
                          ? "border-b border-gray-300 text-gray-800"
                          : "border-b border-emerald-800 text-emerald-900"
                      }`}
                    >
                      Projects
                    </h2>
                    <div className="space-y-2">
                      {validProjects.map((p, idx) => (
                        <div key={idx} className="text-[11px]">
                          <div className="flex justify-between items-baseline">
                            <span className="font-bold text-gray-900">
                              {p.name}
                              {p.link && (
                                <a
                                  href={p.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="ml-1 text-gray-500 hover:text-emerald-800 inline-flex items-center"
                                >
                                  <ExternalLink className="w-2.5 h-2.5 inline" />
                                </a>
                              )}
                            </span>
                            {p.techStack?.length > 0 && (
                              <span className="text-[10px] text-gray-500 italic">
                                {p.techStack.join(", ")}
                              </span>
                            )}
                          </div>
                          {p.bullets?.filter(Boolean).length > 0 && (
                            <ul className="list-disc list-outside pl-4 space-y-0.5 text-gray-700 mt-0.5">
                              {p.bullets.filter(Boolean).map((b, bIdx) => (
                                <li key={bIdx} className="leading-snug">
                                  {b}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              if (sectionKey === "experience" && draft.experience?.length > 0) {
                const validExp = draft.experience.filter((e) => e.role?.trim() && e.company?.trim());
                if (!validExp.length) return null;
                return (
                  <div key="experience" className="space-y-2">
                    <h2
                      className={`text-[11px] font-bold uppercase tracking-wider pb-0.5 ${
                        isClassic
                          ? "border-b border-gray-300 text-gray-800"
                          : "border-b border-emerald-800 text-emerald-900"
                      }`}
                    >
                      Experience
                    </h2>
                    <div className="space-y-2">
                      {validExp.map((exp, idx) => (
                        <div key={idx} className="text-[11px]">
                          <div className="flex justify-between items-baseline font-semibold text-gray-900">
                            <span>
                              {exp.role} <span className="font-normal text-gray-600">at {exp.company}</span>
                            </span>
                            <span className="text-[10px] text-gray-500">
                              {exp.startDate || ""} {exp.startDate ? "–" : ""}{" "}
                              {exp.current ? "Present" : exp.endDate || ""}
                            </span>
                          </div>
                          {exp.bullets?.filter(Boolean).length > 0 && (
                            <ul className="list-disc list-outside pl-4 space-y-0.5 text-gray-700 mt-0.5">
                              {exp.bullets.filter(Boolean).map((b, bIdx) => (
                                <li key={bIdx} className="leading-snug">
                                  {b}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              if (sectionKey === "education" && draft.education?.length > 0) {
                const validEdu = draft.education.filter((e) => e.degree?.trim() && e.institute?.trim());
                if (!validEdu.length) return null;
                return (
                  <div key="education" className="space-y-1.5">
                    <h2
                      className={`text-[11px] font-bold uppercase tracking-wider pb-0.5 ${
                        isClassic
                          ? "border-b border-gray-300 text-gray-800"
                          : "border-b border-emerald-800 text-emerald-900"
                      }`}
                    >
                      Education
                    </h2>
                    <div className="space-y-1 text-[11px]">
                      {validEdu.map((edu, idx) => (
                        <div key={idx} className="flex justify-between items-baseline">
                          <div>
                            <span className="font-bold text-gray-900">{edu.degree}</span>
                            <span className="text-gray-600">, {edu.institute}</span>
                            {edu.grade && <span className="text-gray-500 text-[10px]"> ({edu.grade})</span>}
                          </div>
                          {(edu.startYear || edu.endYear) && (
                            <span className="text-[10px] text-gray-500">
                              {edu.startYear ? `${edu.startYear} – ` : ""}
                              {edu.endYear || ""}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              if (sectionKey === "certifications" && draft.certifications?.length > 0) {
                const validCerts = draft.certifications.filter((c) => c.name?.trim());
                if (!validCerts.length) return null;
                return (
                  <div key="certifications" className="space-y-1">
                    <h2
                      className={`text-[11px] font-bold uppercase tracking-wider pb-0.5 ${
                        isClassic
                          ? "border-b border-gray-300 text-gray-800"
                          : "border-b border-emerald-800 text-emerald-900"
                      }`}
                    >
                      Certifications
                    </h2>
                    <div className="space-y-0.5 text-[11px]">
                      {validCerts.map((c, idx) => (
                        <div key={idx} className="flex justify-between items-baseline">
                          <span className="text-gray-800">
                            <strong className="font-semibold text-gray-900">{c.name}</strong>
                            {c.issuer ? ` – ${c.issuer}` : ""}
                          </span>
                          {c.year && <span className="text-[10px] text-gray-500">{c.year}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
