import React from "react";

interface ScoreRingProps {
  score: number;
  grade: string;
  size?: number;
  strokeWidth?: number;
}

export const ScoreRing: React.FC<ScoreRingProps> = ({
  score,
  grade,
  size = 160,
  strokeWidth = 12,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  let strokeColor = "#10B981"; // success emerald
  let gradeBg = "bg-emerald/10 text-emerald-dark border-emerald/20";
  let descriptor = "Strong Profile";

  if (clampedScore >= 85) {
    strokeColor = "#064E3B";
    gradeBg = "bg-emerald text-white border-emerald";
    descriptor = "Job Ready";
  } else if (clampedScore >= 75) {
    strokeColor = "#10B981";
    gradeBg = "bg-emerald/15 text-emerald-dark border-emerald/30";
    descriptor = "Competitive";
  } else if (clampedScore >= 60) {
    strokeColor = "#C8963E";
    gradeBg = "bg-gold/20 text-gold-dark border-gold/40";
    descriptor = "Good Foundation";
  } else {
    strokeColor = "#B4443C";
    gradeBg = "bg-error-bg text-error border-error-border";
    descriptor = "Needs Attention";
  }

  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="rotate-[-90deg]">
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E8D3AA"
            strokeWidth={strokeWidth}
            fill="transparent"
            opacity={0.4}
          />
          {/* Animated Value Stroke */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="flex items-baseline">
            <span className="font-display text-4xl sm:text-5xl font-bold text-emerald-dark tabular-nums">
              {clampedScore}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-muted ml-0.5">/100</span>
          </div>
          <span
            className={`mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${gradeBg} uppercase tracking-wider`}
          >
            Grade {grade}
          </span>
        </div>
      </div>

      <p className="mt-3 text-xs sm:text-sm font-semibold text-emerald-dark">
        {descriptor}
      </p>
    </div>
  );
};

