import React from "react";
import { QuickInsight, Stats, SubScoreReasons, SubScores } from "../types";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { Card } from "../../../components/ui/Card";

interface QuickInsightsProps {
  insights: QuickInsight[];
  subScores?: SubScores;
  subScoreReasons?: Partial<SubScoreReasons>;
  stats?: Stats;
}

function getTierTone(score: number): "good" | "warn" | "bad" {
  if (score >= 80) return "good";
  if (score >= 50) return "warn";
  return "bad";
}

function sanitizeLegacyText(text: string): string {
  return text.replace(/\bats\b/gi, "automated screening");
}

function extractProficiencyGaps(profReasons: string[]): string[] {
  const joined = profReasons.join(" | ");
  const gaps: string[] = [];

  if (/email\s+no\b/i.test(joined)) gaps.push("missing email");
  if (/phone\s+no\b/i.test(joined)) gaps.push("missing phone");
  if (/LinkedIn\/GitHub\s+no\b/i.test(joined)) gaps.push("missing LinkedIn/GitHub link");
  else if (/label only/i.test(joined)) gaps.push("label-only profile link without visible URL");

  if (/Future dates:\s*[1-9]\d*\s+found/i.test(joined)) gaps.push("future dates detected");
  if (/Dates:\s*mixed/i.test(joined)) gaps.push("inconsistent dates");
  if (/bullets:\s*mixed/i.test(joined)) gaps.push("mixed bullet styles");
  if (/emojis:\s*yes/i.test(joined)) gaps.push("decorative emoji icons");

  const pageMatch = joined.match(/(\d+)\s+page\(s\)/i);
  if (pageMatch && parseInt(pageMatch[1], 10) > 1) {
    gaps.push(`${pageMatch[1]}-page length`);
  }

  return gaps;
}

function deriveDynamicInsights(
  insights: QuickInsight[],
  subScores?: SubScores,
  subScoreReasons?: Partial<SubScoreReasons>,
  stats?: Stats
): QuickInsight[] {
  if (!subScores) {
    return insights.map((item) => {
      const displayTitle =
        item.title === "ATS Compatibility"
          ? "Parsing & Layout"
          : item.title === "ATS Parse Failure"
          ? "Text Extraction Failure"
          : item.title;
      return {
        ...item,
        title: displayTitle,
        detail: item.detail ? sanitizeLegacyText(item.detail) : "",
      };
    });
  }

  const atsScore = subScores.atsCompatibility ?? 0;
  const impactScore = subScores.impactAchievements ?? 0;
  const skillsScore = subScores.skillsValidation ?? 0;
  const profScore = subScores.professionalism ?? 0;

  const atsReasons = subScoreReasons?.atsCompatibility || [];
  const impactReasons = subScoreReasons?.impactAchievements || [];
  const skillsReasons = subScoreReasons?.skillsValidation || [];
  const profReasons = subScoreReasons?.professionalism || [];

  const wordCount = stats?.wordCount ?? null;
  const sectionsSummary = atsReasons[0] || "";
  const metricsSummary = impactReasons[0] || "";

  let detectedSkillsCount = 0;
  let backedSkillsCount = 0;
  const skillsMatch = (skillsReasons[0] || "").match(/^(\d+)\s+of\s+(\d+)\s+skills\s+backed/i);
  if (skillsMatch) {
    backedSkillsCount = parseInt(skillsMatch[1], 10);
    detectedSkillsCount = parseInt(skillsMatch[2], 10);
  }

  const profGaps = extractProficiencyGaps(profReasons);
  const allProfChecksKnownAndPassing = profReasons.length > 0 && profGaps.length === 0;

  return [
    {
      tone: getTierTone(atsScore),
      title: wordCount === 0 ? "Text Extraction Failure" : "Parsing & Layout",
      detail:
        wordCount === 0
          ? "Automated screening cannot extract text from image-only PDFs."
          : atsScore >= 80
          ? `Clean layout and standard headings ready for automated screening${
              sectionsSummary ? ` (${sectionsSummary})` : ""
            }.`
          : atsScore >= 50
          ? `Basic layout is readable, though section structure or spacing needs attention${
              sectionsSummary ? ` (${sectionsSummary})` : ""
            }.`
          : `Parsing risks detected${
              sectionsSummary ? ` (${sectionsSummary})` : ""
            }; switch to a clean single-column layout with standard headings.`,
    },
    {
      tone: getTierTone(impactScore),
      title: "Action & Impact",
      detail:
        impactScore >= 80
          ? `Strong action verbs and quantified outcomes across your bullets${
              metricsSummary ? ` (${metricsSummary})` : ""
            }.`
          : impactScore >= 50
          ? `Moderate impact${
              metricsSummary ? ` (${metricsSummary})` : ""
            }; add more measurable numbers and decisive opening verbs.`
          : `Add measurable numbers and strong action verbs to Project and Experience bullets${
              metricsSummary ? ` (${metricsSummary})` : ""
            }.`,
    },
    {
      tone: getTierTone(skillsScore),
      title: "Skills Coverage",
      detail:
        skillsScore >= 80
          ? `Strong technical skill coverage backed across projects and experience${
              skillsReasons[0] ? ` (${skillsReasons[0]})` : ""
            }.`
          : skillsScore >= 50
          ? detectedSkillsCount > 0 && backedSkillsCount < detectedSkillsCount
            ? `Skills are listed (${backedSkillsCount} of ${detectedSkillsCount} backed); link more of them in your projects.`
            : "Core skills identified; deepen target alignment across project descriptions."
          : detectedSkillsCount > 0
          ? "Skills are listed; link them to your projects."
          : "Few recognized technical skills detected; add relevant languages, frameworks, and tools in a Skills section.",
    },
    {
      tone: getTierTone(profScore),
      title: "Professional Standards",
      detail:
        profScore >= 80 && allProfChecksKnownAndPassing
          ? "Complete contact links, consistent dates and bullets, and concise formatting."
          : profScore >= 80
          ? profGaps.length > 0
            ? `Strong presentation overall; refine ${profGaps.join(", ")}.`
            : "Strong formatting and presentation across key sections."
          : profScore >= 50
          ? `Fair presentation, with gaps in ${
              profGaps.length > 0 ? profGaps.join(", ") : "contact links or formatting consistency"
            }.`
          : `Professional basics need attention: ${
              profGaps.length > 0 ? profGaps.join(", ") : "missing contacts, future dates, or styling issues"
            }.`,
    },
  ];
}

export const QuickInsights: React.FC<QuickInsightsProps> = ({
  insights,
  subScores,
  subScoreReasons,
  stats,
}) => {
  const displayInsights = deriveDynamicInsights(
    insights || [],
    subScores,
    subScoreReasons,
    stats
  );
  if (displayInsights.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {displayInsights.map((item, idx) => {
        let borderClass = "border-success-border bg-success-bg/40";
        let icon = <CheckCircle2 className="w-4 h-4 text-success shrink-0" />;
        let titleColor = "text-emerald-dark";

        if (item.tone === "warn") {
          borderClass = "border-gold/50 bg-champagne/40";
          icon = <AlertTriangle className="w-4 h-4 text-gold shrink-0" />;
          titleColor = "text-gold-hover";
        } else if (item.tone === "bad") {
          borderClass = "border-error-border bg-error-bg/50";
          icon = <XCircle className="w-4 h-4 text-error shrink-0" />;
          titleColor = "text-error";
        }

        return (
          <Card
            key={idx}
            className={`p-4 border ${borderClass} shadow-emerald-sm flex flex-col justify-between space-y-2`}
          >
            <div className="flex items-center gap-2">
              {icon}
              <h4 className={`text-xs font-bold ${titleColor} truncate`}>
                {item.title}
              </h4>
            </div>
            <p className="text-xs text-body/80 leading-relaxed">
              {item.detail}
            </p>
          </Card>
        );
      })}
    </div>
  );
};
