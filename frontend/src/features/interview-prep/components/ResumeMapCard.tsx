import React, { useState } from "react";
import { ResumeMap } from "../types/interviewPrep.types";
import { ChevronDown, ChevronUp, FolderGit2, Wrench } from "lucide-react";

interface ResumeMapCardProps {
  resumeMap: ResumeMap | null;
}

export const ResumeMapCard: React.FC<ResumeMapCardProps> = ({ resumeMap }) => {
  const [expanded, setExpanded] = useState(false);

  if (!resumeMap) return null;
  const projects = resumeMap.projects || [];
  const skills = resumeMap.skills || [];

  if (projects.length === 0 && skills.length === 0) return null;

  return (
    <div className="bg-[#FFF8EC] border border-[#E8D3AA] rounded-2xl p-4 shadow-xs">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-[#064E3B] font-serif">
            Here is what we found in your resume
          </h3>
          <p className="text-[11px] text-stone-600 mt-0.5">
            {projects.length} project{projects.length === 1 ? "" : "s"} and {skills.length} skill
            {skills.length === 1 ? "" : "s"} detected from your redacted resume. Questions are grounded strictly in this.
          </p>
        </div>
        <span className="p-1.5 rounded-lg bg-white border border-[#E8D3AA] text-stone-600 shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      {expanded && (
        <div className="mt-4 pt-3 border-t border-[#E8D3AA]/70 space-y-4">
          {projects.length > 0 ? (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800 mb-2">
                <FolderGit2 className="w-3.5 h-3.5 text-[#064E3B]" />
                <span>Projects</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {projects.map((proj, idx) => (
                  <div
                    key={idx}
                    className="bg-white border border-[#E8D3AA] rounded-xl p-3 space-y-1.5"
                  >
                    <p className="text-xs font-bold text-stone-900">{proj.name}</p>
                    {proj.summary && (
                      <p className="text-[11px] text-stone-600 leading-relaxed">{proj.summary}</p>
                    )}
                    {proj.stack && proj.stack.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {proj.stack.map((tech, tIdx) => (
                          <span
                            key={tIdx}
                            className="px-2 py-0.5 rounded-full bg-[#F8E7C9]/70 text-[#064E3B] text-[10px] font-medium"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-stone-500 italic">
              No named projects were detected in your resume, so questions focus on your skills and target role.
            </p>
          )}

          {skills.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-800 mb-2">
                <Wrench className="w-3.5 h-3.5 text-[#064E3B]" />
                <span>Detected Skills</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {skills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-0.5 rounded-lg bg-white border border-[#E8D3AA] text-stone-700 text-[11px] font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
