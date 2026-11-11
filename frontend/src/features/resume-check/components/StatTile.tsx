import React from "react";
import { Card } from "../../../components/ui/Card";

interface StatTileProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
}

export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  subtitle,
  icon,
}) => {
  return (
    <Card className="p-4 bg-cream border-border/80 flex items-start gap-3 shadow-emerald-sm">
      {icon && (
        <div className="p-2 rounded-ui bg-champagne/60 text-emerald shrink-0 mt-0.5">
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-muted uppercase tracking-wider truncate">
          {label}
        </p>
        <p className="font-display text-xl sm:text-2xl font-bold text-emerald-dark mt-0.5 tabular-nums truncate">
          {value}
        </p>
        {subtitle && (
          <p className="text-[11px] text-body/70 mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
    </Card>
  );
};

