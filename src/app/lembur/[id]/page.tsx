"use client";
import { useState } from "react";
import { useParams, notFound } from "next/navigation";
import { CheckCircle, XCircle, Clock, FileText } from "lucide-react";
import { mockOvertimeRequests, currentEmployee } from "@/lib/mockData";
import { formatDate, formatDateTime, statusLabel } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import type { ApprovalStep } from "@/types";

// ── Timeline Icon ─────────────────────────────────────────
function TlIcon({ status }: { status: ApprovalStep["status"] }) {
  const base = "w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2";
  if (status === "approved")
    return <div className={`${base} bg-green-50 border-green-400`}><CheckCircle size={14} className="text-green-500" /></div>;
  if (status === "rejected" || status === "cancelled")
    return <div className={`${base} bg-slate-100 border-slate-300`}><XCircle size={14} className="text-slate-400" /></div>;
  return <div className={`${base} bg-slate-50 border-slate-200`}><Clock size={14} className="text-slate-400" /></div>;
}

export default function LemburDetailPage() {
  const { id } = useParams<{ id: string }>();
  const req = mockOvertimeRequests.find((r) => r.id === id);
  const [tab, setTab] = useState<"detail" | "status">("detail");
  if (!req) notFound();

  return (
    <div className="min-h-screen bg-[#ddeef8]">
      {/* Blue header with employee */}
      <div className="bg-gradient-to-b from-[#3b9edd] to-[#1a6fb5] relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
        <div className="relative px-4 pt-5 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => history.back()} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <svg width="15" height="15" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <p className="text-white text-sm opacity-80">Detail Request</p>
          </div>
          {/* Employee */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-[#b8d9f0] border-2 border-white overflow-hidden">
                <svg viewBox="0 0 80 100" fill="none" className="w-full h-full">
                  <ellipse cx="40" cy="35" rx="22" ry="24" fill="#1a6fb5" opacity="0.7"/>
                  <ellipse cx="40" cy="95" rx="38" ry="30" fill="#1a6fb5" opacity="0.6"/>
                </svg>
              </div>
              <div>
                <p className="text-white font-bold text-base">{currentEmployee.name}</p>
                <p className="text-blue-100 text-xs">{currentEmployee.division} – {currentEmployee.position}</p>
              </div>
            </div>
            <StatusBadge status={req.status} />
          </div>
        </div>
        <div className="h-5 bg-[#ddeef8] rounded-t-3xl" />
      </div>

      <div className="px-4 -mt-1 pb-6 space-y-3 animate-fade-in">
        {/* Tab switcher */}
        <div className="bg-white rounded-2xl border border-[#c8e0f0] shadow-sm p-1.5 flex gap-1">
          {[
            { id: "detail" as const, label: "Detail Request" },
            { id: "status" as const, label: "Status Request" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                tab === t.id
                  ? "bg-[#1a7dc4] text-white shadow-sm"
                  : "text-slate-500 hover:text-[#1a7dc4]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Detail Tab ──────────────────────────────── */}
        {tab === "detail" && (
          <div className="space-y-3 animate-fade-in">
            <div className="bg-white rounded-2xl border border-[#c8e0f0] shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-50">
                {[
                  { label: "Tanggal :", value: formatDate(req.date) },
                  { label: "Shift :", value: req.workMode },
                  { label: "Durasi :", value: `${req.totalHours} Jam` },
                  { label: "Keterangan :", value: req.description },
                ].map((item, i) => (
                  <div key={i} className="px-4 py-3">
                    <span className="text-[11px] text-slate-400 font-medium">{item.label}</span>
                    <p className="text-sm font-semibold text-[#1a3c5e] mt-0.5">{item.value}</p>
                  </div>
                ))}

                {/* Lampiran */}
                <div className="px-4 py-3">
                  <p className="text-[11px] text-slate-400 mb-2">Lampiran :</p>
                  {req.attachment ? (
                    <div className="border border-[#c8dcea] rounded-xl p-3 flex items-center gap-2">
                      <FileText size={18} className="text-[#3b9edd]" />
                      <p className="text-sm text-[#1a3c5e] font-medium">{req.attachment}</p>
                    </div>
                  ) : (
                    <div className="border border-[#c8dcea] rounded-xl p-4 flex items-center justify-center">
                      <div className="flex flex-col items-center text-slate-300">
                        <FileText size={28} className="mb-1" />
                        <p className="text-[10px]">Tidak ada lampiran</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Status Tab ──────────────────────────────── */}
        {tab === "status" && (
          <div className="space-y-3 animate-fade-in">
            <div className="bg-white rounded-2xl border border-[#c8e0f0] shadow-sm p-4">
              <p className="text-xs font-bold text-[#1a3c5e] mb-4">Alur Persetujuan</p>
              <div className="space-y-0">
                {req.approvalTimeline.map((step, i) => {
                  const isLast = i === req.approvalTimeline.length - 1;
                  return (
                    <div key={step.id} className="flex gap-3">
                      {/* Left: icon + line */}
                      <div className="flex flex-col items-center">
                        <TlIcon status={step.status} />
                        {!isLast && (
                          <div className="w-0.5 flex-1 my-1 bg-slate-100 min-h-[20px]" />
                        )}
                      </div>
                      {/* Right: content */}
                      <div className={`flex-1 pb-4 ${isLast ? "pb-0" : ""}`}>
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-[#1a3c5e]">{step.approverName}</p>
                            <p className="text-[10px] text-slate-400">{step.role}</p>
                          </div>
                          <StatusBadge status={step.status} size="sm" />
                        </div>
                        {step.note && (
                          <div className="mt-1.5 bg-slate-50 rounded-lg px-3 py-1.5 border border-slate-100">
                            <p className="text-xs text-slate-500 italic">"{step.note}"</p>
                          </div>
                        )}
                        {step.timestamp && (
                          <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(step.timestamp)}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status summary */}
            <div className={`rounded-2xl border p-4 ${
              req.status === "approved" ? "bg-green-50 border-green-200" :
              req.status === "rejected" ? "bg-red-50 border-red-200" :
              "bg-slate-50 border-slate-200"
            }`}>
              <p className="text-xs font-bold text-[#1a3c5e] mb-1.5">Status Akhir</p>
              <div className="flex items-center gap-2">
                <StatusBadge status={req.status} />
                <p className="text-xs text-slate-500">
                  {req.status === "approved" && "Pengajuan disetujui."}
                  {req.status === "rejected" && "Pengajuan ditolak."}
                  {req.status === "pending" && "Menunggu persetujuan."}
                  {req.status === "processing" && "Sedang diproses."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
