import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format seconds into MM:SS display string */
export function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Format a score as a percentage string */
export function formatPercent(score: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((score / total) * 100)}%`;
}

/** Truncate a string to a max length with ellipsis */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

/** Generate a color class based on percentage (for score display) */
export function scoreColor(percent: number): string {
  if (percent >= 80) return "text-green-600";
  if (percent >= 60) return "text-yellow-600";
  return "text-red-600";
}

/** Generate a bg color class based on percentage */
export function scoreBgColor(percent: number): string {
  if (percent >= 80) return "bg-green-100 text-green-800";
  if (percent >= 60) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

/** Format a date as a readable string */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Count words in a string */
export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
