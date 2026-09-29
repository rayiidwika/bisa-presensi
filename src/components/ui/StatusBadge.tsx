"use client";
import { statusColorMap, statusLabel } from "@/lib/utils";
import type { RequestStatus } from "@/types";

interface StatusBadgeProps {
  status: RequestStatus | "waiting" | "cancelled";
  size?: "sm" | "md";
}
export default function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const c = statusColorMap(status);
  const label = statusLabel(status);
  const sz = size === "sm" ? "text-[10px] px-2 py-0.5 gap-1" : "text-xs px-2.5 py-1 gap-1.5";
  return (
    <span className={`inline-flex items-center rounded-full font-semibold border ${c.bg} ${c.text} ${c.border} ${sz}`}>
      <span className={`inline-block rounded-full shrink-0 ${c.dot} ${size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2"}`} />
      {label}
    </span>
  );
}
