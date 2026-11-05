import React from "react";
import Link from "next/link";

export interface LogoProps {
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
  variant?: "light" | "dark";
  className?: string;
  href?: string | null;
}

export const LogoMark: React.FC<{
  size?: "sm" | "md" | "lg";
  variant?: "light" | "dark";
  className?: string;
  isLoader?: boolean;
}> = ({ size = "md", variant = "light", className = "", isLoader = false }) => {
  const isSmall = size === "sm";

  const markDimensions = {
    sm: "w-5 h-5", // 20px (under 24px)
    md: "w-8 h-8", // 32px
    lg: "w-12 h-12", // 48px
  };

  const ringColor = variant === "dark" ? "#F8E7C9" : "#064E3B";
  const arrowColor = "#C8963E";

  const ringStroke = isSmall ? 6 : 5;
  const arrowStroke = isSmall ? 5 : 4;

  const animationClass = isLoader
    ? "motion-safe:animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"
    : "";

  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${markDimensions[size]} ${animationClass} ${className} shrink-0`}
      aria-hidden="true"
    >
      {/* Open ring stroke with gap on the right */}
      <path
        d="M 35.5 14.4 A 15 15 0 1 0 35.5 33.6"
        fill="none"
        stroke={ringColor}
        strokeWidth={ringStroke}
        strokeLinecap="round"
      />
      {/* Gold arrow in the gap pointing up-right */}
      <line
        x1="27"
        y1="30"
        x2="37"
        y2="20"
        stroke={arrowColor}
        strokeWidth={arrowStroke}
        strokeLinecap="round"
      />
      <polyline
        points="31,19.5 37,19.5 37,25.5"
        fill="none"
        stroke={arrowColor}
        strokeWidth={arrowStroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};

export const Logo: React.FC<LogoProps> = ({
  size = "md",
  showWordmark = true,
  variant = "light",
  className = "",
  href = "/",
}) => {
  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  };

  const textColor = variant === "dark" ? "text-[#F8E7C9]" : "text-[#064E3B]";

  const content = (
    <span className={`inline-flex items-center gap-3 select-none ${className}`}>
      <LogoMark size={size} variant={variant} />
      {showWordmark && (
        <span
          className={`font-display font-bold tracking-[-0.01em] leading-none ${textColor} ${textSizes[size]}`}
        >
          Career OS
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8963E] focus-visible:ring-offset-2 rounded-lg transition-transform active:scale-[0.99]"
        aria-label="Career OS Home"
      >
        {content}
      </Link>
    );
  }

  return content;
};
