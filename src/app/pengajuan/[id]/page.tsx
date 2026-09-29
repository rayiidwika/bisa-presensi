"use client";
import { useParams, notFound, useRouter } from "next/navigation";
import { mockLeaveRequests, currentEmployee } from "@/lib/mockData";
import { formatDate, leaveTypeLabel } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import { Calendar, Clock, FileText } from "lucide-react";

export default function PengajuanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const req = mockLeaveRequests.find((r) => r.id === id);
  if (!req) notFound();

  return (
    <div className="min-h-screen bg-[#ddeef8]">
      {/* Blue header with employee */}
      <div className="bg-gradient-to-b from-[#3b9edd] to-[#1a6fb5] relative overflow-hidden">
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
        <div className="relative px-4 pt-5 pb-6">
          <div className="flex items-center gap-3 mb-3">
            <button onClick={() => history.back()} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <svg width="15" height="15" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <p className="text-white text-sm opacity-80">Detail Pengajuan</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#b8d9f0] border-2 border-white overflow-hidden">
              <svg viewBox="0 0 80 100" fill="none" className="w-full h-full">
                <ellipse cx="40" cy="35" rx="22" ry="24" fill="#1a6fb5" opacity="0.7"/>
                <ellipse cx="40" cy="95" rx="38" ry="30" fill="#1a6fb5" opacity="0.6"/>
              </svg>
            </div>
            <div>
              <p className="text-white font-bold">{currentEmployee.name}</p>
              <p className="text-blue-100 text-xs">{currentEmployee.division}</p>
            </div>
            <div className="ml-auto">
              <StatusBadge status={req.status} />
            </div>
          </div>
        </div>
        <div className="h-5 bg-[#ddeef8] rounded-t-3xl" />
      </div>

      <div className="px-4 -mt-1 pb-6 space-y-3 animate-fade-in">
        {/* Main data */}
        <div className="bg-white rounded-2xl border border-[#c8e0f0] shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-50">
            <p className="text-xs font-bold text-[#1a3c5e]">Informasi Pengajuan</p>
          </div>
          <div className="divide-y divide-slate-50">
            {[
              { icon: <FileText size={14}/>, label: "Tipe", value: leaveTypeLabel(req.type) },
              { icon: <FileText size={14}/>, label: "Keperluan", value: req.keperluan },
              { icon: <Calendar size={14}/>, label: "Tanggal Mulai", value: formatDate(req.startDate) },
              { icon: <Calendar size={14}/>, label: "Tanggal Selesai", value: formatDate(req.endDate) },
              { icon: <Clock size={14}/>, label: "Durasi", value: `${req.totalDays} hari` },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <span className="text-[#3b9edd] shrink-0">{item.icon}</span>
                <p className="text-[11px] text-slate-400 w-24 shrink-0">{item.label}</p>
                <p className="text-xs font-semibold text-[#1a3c5e]">{item.value}</p>
              </div>
            ))}
            <div className="px-4 py-3">
              <p className="text-[11px] text-slate-400 mb-1">Alasan</p>
              <p className="text-sm text-[#1a3c5e]">{req.reason}</p>
            </div>
          </div>
        </div>

        {/* Approval / rejection */}
        {(req.approvedBy || req.rejectedReason) && (
          <div className={`rounded-2xl border p-4 ${req.status === "approved" ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
            <p className="text-xs font-bold text-[#1a3c5e] mb-1">{req.status === "approved" ? "✅ Disetujui oleh" : "❌ Alasan Penolakan"}</p>
            <p className="text-sm font-semibold text-[#1a3c5e]">{req.status === "approved" ? req.approvedBy : req.rejectedReason}</p>
          </div>
        )}
      </div>
    </div>
  );
}
