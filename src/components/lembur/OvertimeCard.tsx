"use client";

import { useRouter } from "next/navigation";
import { Calendar, Clock, Monitor, Laptop } from "lucide-react";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatDate } from "@/lib/utils";
import type { OvertimeRequest } from "@/types";

interface OvertimeCardProps {
  request: OvertimeRequest;
}

export default function OvertimeCard({ request }: OvertimeCardProps) {
  const router = useRouter();

  return (
    <div
      onClick={() => router.push(`/lembur/${request.id}`)}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 cursor-pointer hover:shadow-md hover:border-blue-100 transition-all duration-200 active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Icon */}
          <div className="shrink-0 w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
            {request.workMode === "WFO" ? (
              <Monitor size={18} className="text-indigo-600" />
            ) : (
              <Laptop size={18} className="text-indigo-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                {request.workMode}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-1">
              <Calendar size={11} className="text-slate-400 shrink-0" />
              <span className="text-sm font-semibold text-slate-800">
                {formatDate(request.date)}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <Clock size={11} className="text-slate-400 shrink-0" />
              <span className="text-xs text-slate-500">
                {request.startTime} – {request.endTime}
              </span>
              <span className="text-xs text-slate-400 ml-1">
                · {request.totalHours} jam
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic">
              &ldquo;{request.description}&rdquo;
            </p>
          </div>
        </div>
        <StatusBadge status={request.status} size="sm" />
      </div>
    </div>
  );
}
