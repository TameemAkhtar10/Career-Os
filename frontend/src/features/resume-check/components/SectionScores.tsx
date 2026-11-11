import React from "react";
import { SubScores, SubScoreReasons } from "../types";
import { Card } from "../../../components/ui/Card";
import {
  Binary,
  TrendingUp,
  Code2,
  FolderGit2,
  PenTool,
  Award,
} from "lucide-react";

interface SectionScoresProps {
  subScores: SubScores;
  subScoreReasons?: Partial<SubScoreReasons>;
}

interface SectionMeta {
  key: keyof SubScores;
  name: string;
  weight: number;
  description: string;
  icon: React.ReactNode;
}

const SECTIONS: SectionMeta[] = [
  {
    key: "atsCompatibility",
    name: "Parsing & Layout",
    weight: 25,
    description: "Layout readability, standard section headers, font safety, and single-column formatting.",
    icon: <Binary className="w-4 h-4 text-emerald" />,
  },
  {
    key: "impactAchievements",
    name: "Impact & Achievements",
    weight: 20,
    description: "Share of bullets with quantifiable metrics, numbers, and decisive action verbs.",
    icon: <TrendingUp className="w-4 h-4 text-emerald" />,
  },
  {
    key: "skillsValidation",
    name: "Skills Validation",
    weight: 20,
    description: "Modern technical skills identified and corroborated through hands-on project descriptions.",
    icon: <Code2 className="w-4 h-4 text-emerald" />,
  },
  {
    key: "projectQuality",
    name: "Project Quality",
    weight: 15,
    description: "Number of projects, bullet depth, tech stack specificity, and repository links.",
    icon: <FolderGit2 className="w-4 h-4 text-emerald" />,
  },
  {
    key: "writingQuality",
    name: "Writing Quality",
    weight: 10,
    description: "Active voice, bullet conciseness (8-25 words), and absence of weak passive phrases.",
    icon: <PenTool className="w-4 h-4 text-emerald" />,
  },
  {
    key: "professionalism",
    name: "Professionalism",
    weight: 10,
    description: "Contact links (email, phone, LinkedIn), consistent dates, and appropriate 1-page length.",
    icon: <Award className="w-4 h-4 text-emerald" />,
  },
];

function getScoreRating(val: number): {
  label: string;
  toneColor: string;
  bgTone: string;
  barColor: string;
} {
  if (val >= 85) {
    return {
      label: "Excellent",
      toneColor: "text-emerald-dark font-bold",
      bgTone: "bg-emerald/10 border-emerald/20",
      barColor: "bg-emerald",
    };
  }
  if (val >= 70) {
    return {
      label: "Good",
      toneColor: "text-emerald font-semibold",
      bgTone: "bg-success-bg border-success-border",
      barColor: "bg-success",
    };
  }
  if (val >= 50) {
    return {
      label: "Average",
      toneColor: "text-gold font-semibold",
      bgTone: "bg-champagne/40 border-gold/40",
      barColor: "bg-gold",
    };
  }
  return {
    label: "Needs work",
    toneColor: "text-error font-semibold",
    bgTone: "bg-error-bg border-error-border",
    barColor: "bg-error",
  };
}

export const SectionScores: React.FC<SectionScoresProps> = ({
  subScores,
  subScoreReasons,
}) => {
  return (
    <div className="space-y-6">
      {/* 1. Quick Summary Progress Bars */}
      <Card className="p-5 sm:p-6 bg-cream border-border shadow-emerald-sm space-y-4">
        <h3 className="font-display text-base sm:text-lg font-bold text-emerald-dark">
          Category Score Breakdown
        </h3>

        <div className="space-y-3.5">
          {SECTIONS.map((sec) => {
            const score = subScores[sec.key] || 0;
            const rating = getScoreRating(score);

            return (
              <div key={sec.key} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {sec.icon}
                    <span className="font-semibold text-emerald-dark">{sec.name}</span>
                    <span className="text-[10px] text-muted font-normal">(Weight: {sec.weight}%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[11px] px-2 py-0.5 rounded-full border ${rating.bgTone} ${rating.toneColor}`}>
                      {rating.label}
                    </span>
                    <span className="font-bold text-body tabular-nums">{score}/100</span>
                  </div>
                </div>

                <div className="w-full h-2 rounded-full bg-champagne border border-border/50 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ease-out ${rating.barColor}`}
                    style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 2. Detailed Section Cards (6 cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTIONS.map((sec) => {
          const score = subScores[sec.key] || 0;
          const rating = getScoreRating(score);
          const reasons = subScoreReasons?.[sec.key] || [];

          return (
            <Card
              key={sec.key}
              className="p-5 bg-cream border-border shadow-emerald-sm flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="p-2 rounded-ui bg-champagne/60 text-emerald shrink-0">
                    {sec.icon}
                  </div>
                  <span
                    className={`text-[10px] px-2.5 py-0.5 rounded-full border uppercase tracking-wider font-bold ${rating.bgTone} ${rating.toneColor}`}
                  >
                    {rating.label}
                  </span>
                </div>

                <div>
                  <h4 className="font-display text-base font-bold text-emerald-dark">
                    {sec.name}
                  </h4>
                  <p className="text-xs text-body/75 mt-1 leading-relaxed">
                    {sec.description}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-border/60 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-muted tracking-wider">
                    Weight {sec.weight}%
                  </span>
                  <span className="font-display text-lg font-bold text-emerald-dark tabular-nums">
                    {score}
                    <span className="text-xs font-normal text-muted">/100</span>
                  </span>
                </div>

                {reasons.length > 0 && (
                  <ul className="space-y-1 text-[11px] text-body/80 leading-snug">
                    {reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald font-bold">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
