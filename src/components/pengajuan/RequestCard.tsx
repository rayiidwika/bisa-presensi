"use client";

import { useRouter } from "next/navigation";
import { Calendar } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDate, leaveTypeLabel } from "@/lib/utils";
import type { LeaveRequest } from "@/types";

interface RequestCardProps {
  request: LeaveRequest;
}

const TYPE_COLORS: Record<string, string> = {
  cuti: "bg-blue-100 text-blue-700",
  izin: "bg-amber-100 text-amber-700",
  sakit: "bg-red-100 text-red-700",
  dinas: "bg-violet-100 text-violet-700",
};

export default function RequestCard({ request }: RequestCardProps) {
  const router = useRouter();
  const typeColor = TYPE_COLORS[request.type] ?? "bg-slate-100 text-slate-700";

  return (
    <div
      onClick={() => router.push(`/pengajuan/${request.id}`)}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 cursor-pointer hover:shadow-md hover:border-blue-100 transition-all duration-200 active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Type badge */}
          <div
            className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold ${typeColor}`}
          >
            {leaveTypeLabel(request.type)[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${typeColor}`}
              >
                {leaveTypeLabel(request.type)}
              </span>
            </div>
            <p className="text-sm font-semibold text-slate-800 mt-1 truncate">
              {request.keperluan}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Calendar size={11} className="text-slate-400 shrink-0" />
              <span className="text-[11px] text-slate-500">
                {formatDate(request.startDate)}
                {request.startDate !== request.endDate &&
                  ` – ${formatDate(request.endDate)}`}
              </span>
              <span className="text-[11px] text-slate-400 ml-1">
                · {request.totalDays} hari
              </span>
            </div>
            {request.reason && (
              <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic">
                &ldquo;{request.reason}&rdquo;
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={request.status} size="sm" />
      </div>
    </div>
  );
}
