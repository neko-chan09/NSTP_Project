// src/components/common/GradeBadge.tsx
import React from "react";

interface GradeBadgeProps {
  percentage: number | null;
  showLabel?: boolean;
  showPercentage?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const GradeBadge: React.FC<GradeBadgeProps> = ({
  percentage,
  showLabel = true,
  showPercentage = false,
  size = "md",
  className = "",
}) => {
  const getGradeInfo = (pct: number | null) => {
    if (pct === null || pct === undefined) {
      return {
        label: "N/A",
        color: "text-slate-400",
        bg: "bg-slate-100",
        border: "border-slate-200",
      };
    }

    if (pct >= 96)
      return {
        label: "A+",
        color: "text-emerald-700",
        bg: "bg-emerald-100",
        border: "border-emerald-300",
      };
    if (pct >= 91)
      return {
        label: "A",
        color: "text-emerald-700",
        bg: "bg-emerald-100",
        border: "border-emerald-300",
      };
    if (pct >= 88)
      return {
        label: "A-",
        color: "text-emerald-600",
        bg: "bg-emerald-100",
        border: "border-emerald-300",
      };
    if (pct >= 84)
      return {
        label: "B+",
        color: "text-blue-700",
        bg: "bg-blue-100",
        border: "border-blue-300",
      };
    if (pct >= 80)
      return {
        label: "B",
        color: "text-blue-700",
        bg: "bg-blue-100",
        border: "border-blue-300",
      };
    if (pct >= 76)
      return {
        label: "B-",
        color: "text-blue-600",
        bg: "bg-blue-100",
        border: "border-blue-300",
      };
    if (pct >= 72)
      return {
        label: "C+",
        color: "text-amber-700",
        bg: "bg-amber-100",
        border: "border-amber-300",
      };
    if (pct >= 68)
      return {
        label: "C",
        color: "text-amber-700",
        bg: "bg-amber-100",
        border: "border-amber-300",
      };
    if (pct >= 64)
      return {
        label: "C-",
        color: "text-amber-600",
        bg: "bg-amber-100",
        border: "border-amber-300",
      };
    if (pct >= 60)
      return {
        label: "D+",
        color: "text-yellow-700",
        bg: "bg-yellow-100",
        border: "border-yellow-300",
      };
    if (pct >= 55)
      return {
        label: "D",
        color: "text-red-700",
        bg: "bg-red-100",
        border: "border-red-300",
      };
    return {
      label: "F",
      color: "text-red-700",
      bg: "bg-red-100",
      border: "border-red-300",
    };
  };

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const gradeInfo = getGradeInfo(percentage);

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${gradeInfo.bg} ${gradeInfo.border} border ${sizeClasses[size]} ${gradeInfo.color} ${className}`}
    >
      {showLabel && gradeInfo.label}
      {showLabel && showPercentage && percentage !== null && (
        <span className="ml-1 text-xs opacity-75">
          ({Math.round(percentage)}%)
        </span>
      )}
      {!showLabel && percentage !== null && (
        <span>{Math.round(percentage)}%</span>
      )}
      {percentage === null && showLabel && "Not Graded"}
    </span>
  );
};

export default GradeBadge;
