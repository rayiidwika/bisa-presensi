"use client";
import { useParams, notFound } from "next/navigation";
import { mockLeaveRequests, currentEmployee } from "@/lib/mockData";
import { formatDate, leaveTypeLabel } from "@/lib/utils";
import StatusBadge from "@/components/ui/StatusBadge";
import { Calendar, Clock, FileText, Image as ImageIcon, Video, Link2, ExternalLink } from "lucide-react";

export default function PengajuanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const req = mockLeaveRequests.find((r) => r.id === id);
  if (!req) notFound();

  const isIzin = req.type === "izin";
  const isSakit = req.type === "sakit";

  return (
    <div className="min-h-screen bg-[#ddeef8]">
      {/* Blue header with employee */}
      <div className="bg-gradient-to-b from-[#2a8ee4] via-[#1f7cd0] to-[#156bb8] relative overflow-hidden">
        {/* Watermark Logo Bisa Media Putih Blur di ujung kanan */}
        <div className="absolute -right-6 -top-4 w-48 h-48 pointer-events-none opacity-20 filter blur-[0.8px] rotate-[-6deg] select-none">
          <img
            src="/bisa-media-white.png"
            alt="Watermark BISA MEDIA"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="relative px-4 pt-5 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => history.back()}
              aria-label="Kembali"
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 flex items-center justify-center text-white transition-all backdrop-blur-xs cursor-pointer shrink-0"
            >
              <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <h1 className="text-white font-extrabold text-[17.5px] sm:text-[18.5px] tracking-wide leading-tight truncate">
              Detail Pengajuan
            </h1>
          </div>
          <div className="flex items-center gap-3.5 mt-3 relative z-10">
            <div className="w-13 h-13 rounded-2xl bg-[#d8e5ee] border-2 border-white overflow-hidden shadow-sm shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
                <circle cx="32" cy="24" r="11" fill="#475569" />
                <path
                  d="M14 56C14 45 22 41 32 41C42 41 50 45 50 56"
                  fill="#475569"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-[17px] leading-tight truncate tracking-tight">{currentEmployee.name}</p>
              <p className="text-blue-100 text-[12.5px] font-medium mt-0.5 truncate">Divisi : {currentEmployee.division}</p>
            </div>
            <div className="ml-auto shrink-0">
              <StatusBadge status={req.status} />
            </div>
          </div>
        </div>
        <div className="h-5 bg-[#ddeef8] rounded-t-3xl" />
      </div>

      <div className="px-4 -mt-1 pb-24 space-y-3 animate-fade-in">
        {/* Main data */}
        <div className="bg-white rounded-2xl border border-[#c8e0f0] shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-50">
            <p className="text-xs font-bold text-[#1a3c5e]">Informasi Pengajuan</p>
          </div>
          <div className="divide-y divide-slate-50">
            {[
              { icon: <FileText size={14}/>, label: "Tipe", value: leaveTypeLabel(req.type) },
              ...(req.cutiCategory
                ? [{ icon: <FileText size={14}/>, label: "Kategori Cuti", value: req.cutiCategory }]
                : isSakit
                ? []
                : [{ icon: <FileText size={14}/>, label: isIzin ? "Keperluan Izin" : "Keperluan", value: req.keperluan }]),
              { icon: <Calendar size={14}/>, label: "Tanggal Mulai", value: formatDate(req.startDate) },
              { icon: <Calendar size={14}/>, label: "Tanggal Selesai", value: formatDate(req.endDate) },
              ...(req.startTime && req.endTime && req.startTime !== "--:--"
                ? [{ icon: <Clock size={14}/>, label: "Waktu Izin", value: `${req.startTime} - ${req.endTime} WIB` }]
                : []),
              { icon: <Clock size={14}/>, label: "Durasi", value: `${req.totalDays} hari` },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <span className="text-[#3b9edd] shrink-0">{item.icon}</span>
                <p className="text-[11px] text-slate-400 w-24 shrink-0">{item.label}</p>
                <p className="text-xs font-semibold text-[#1a3c5e]">{item.value}</p>
              </div>
            ))}

            <div className="px-4 py-3">
              <p className="text-[11px] text-slate-400 mb-1">{isIzin || isSakit ? "Deskripsi" : "Alasan"}</p>
              <p className="text-sm text-[#1a3c5e]">{req.reason}</p>
            </div>

            {/* Lampiran (Foto / Video / Link) */}
            {(req.attachment || req.attachmentLink) && (
              <div className="px-4 py-3">
                <p className="text-[11px] text-slate-400 mb-1.5">Lampiran</p>
                {req.attachmentType === "link" || req.attachmentLink ? (
                  <a
                    href={req.attachmentLink || req.attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1a7dc4] bg-[#e8f4fd] hover:bg-[#d8ecfa] px-3 py-2 rounded-xl border border-[#c8e2f4] transition-colors"
                  >
                    <Link2 size={13} />
                    <span className="truncate max-w-[200px]">{req.attachmentLink || req.attachment}</span>
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#1a3c5e] bg-[#f0f8ff] border border-[#c8dcea] px-3 py-2 rounded-xl">
                    {req.attachmentType === "video" ? (
                      <Video size={14} className="text-[#1a7dc4]" />
                    ) : req.attachment?.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv)$/i) ? (
                      <FileText size={14} className="text-[#1a7dc4]" />
                    ) : (
                      <ImageIcon size={14} className="text-[#1a7dc4]" />
                    )}
                    <span>{req.attachment}</span>
                  </div>
                )}
              </div>
            )}
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
