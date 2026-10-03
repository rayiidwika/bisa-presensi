"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Clock, CheckCircle2, AlertCircle, Check, X } from "lucide-react";
import MonthYearPicker from "@/components/ui/MonthYearPicker";
import { mockOvertimeRequests, mockOvertimeSummary } from "@/lib/mockData";
import { formatDate } from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  getNotifications,
  acceptLemburInstruction,
  declineLemburInstruction,
  AppNotification,
} from "@/lib/notifications";
import { toast } from "sonner";

const ITEMS = 5;

export default function LemburPage() {
  const router = useRouter();
  const [month, setMonth] = useState("09");
  const [year, setYear] = useState(2026);
  const [page, setPage] = useState(1);
  const [instructions, setInstructions] = useState<AppNotification[]>([]);

  const loadInstructions = () => {
    const allNotifs = getNotifications();
    setInstructions(allNotifs.filter((n) => n.type === "lembur_instruction"));
  };

  useEffect(() => {
    loadInstructions();
    window.addEventListener("bisa_notification_change", loadInstructions);
    window.addEventListener("storage", loadInstructions);
    return () => {
      window.removeEventListener("bisa_notification_change", loadInstructions);
      window.removeEventListener("storage", loadInstructions);
    };
  }, []);

  const handleAccept = (id: string) => {
    acceptLemburInstruction(id);
    loadInstructions();
    toast.success("Instruksi lembur disetujui!", {
      description: "Kesiapan lembur Anda telah tercatat dan dilaporkan ke Atasan & HR.",
    });
  };

  const handleDecline = async (id: string) => {
    const Swal = (await import("sweetalert2")).default;
    const { value: reasonText } = await Swal.fire({
      title: "Alasan Menolak Lembur",
      html: `
        <div class="text-left mt-2 space-y-2.5">
          <p class="text-xs text-slate-600 leading-relaxed">
            Mohon berikan alasan mengapa Anda tidak dapat menjalankan instruksi lembur ini:
          </p>
          <div>
            <label class="text-[11px] font-bold text-slate-700 mb-1.5 block">Alasan: <span class="text-rose-500">*</span></label>
            <textarea id="decline-reason-input-page" rows="4" class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#156bb8] placeholder:text-slate-400" placeholder="Tuliskan alasan penolakan di sini..."></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Kirim Penolakan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
      reverseButtons: true,
      customClass: {
        popup: "!w-[92vw] sm:!w-[420px] !max-w-[420px] rounded-3xl p-5 shadow-2xl",
        title: "text-base font-bold text-slate-800 pb-1 border-b border-slate-100",
        confirmButton: "rounded-xl font-bold py-2.5 px-4 text-xs shadow-sm",
        cancelButton: "rounded-xl font-medium py-2.5 px-4 text-xs",
      },
      didOpen: () => {
        const textInput = document.getElementById("decline-reason-input-page") as HTMLTextAreaElement | null;
        if (textInput) {
          textInput.focus();
        }
      },
      preConfirm: () => {
        const textInput = document.getElementById("decline-reason-input-page") as HTMLTextAreaElement | null;
        const val = textInput?.value.trim() || "";
        if (!val) {
          Swal.showValidationMessage("Harap isi alasan penolakan lembur!");
          return false;
        }
        return val;
      },
    });

    if (reasonText) {
      declineLemburInstruction(id, reasonText);
      loadInstructions();
      toast.info("Penolakan lembur telah dikirim ke Atasan & HR.");
    }
  };

  const filtered = useMemo(() => mockOvertimeRequests, [month, year]);
  const totalPages = Math.ceil(filtered.length / ITEMS);
  const paginated = filtered.slice((page - 1) * ITEMS, page * ITEMS);

  return (
    <div className="min-h-screen bg-[#ddeef8] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#2a8ee4] via-[#1f7cd0] to-[#156bb8] relative overflow-hidden">
        {/* Watermark Logo Bisa Media Putih Blur di ujung kanan */}
        <div className="absolute -right-6 -top-4 w-44 h-44 pointer-events-none opacity-20 filter blur-[0.8px] rotate-[-6deg] select-none">
          <img
            src="/bisa-media-white.png"
            alt="Watermark BISA MEDIA"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="relative px-4 pt-5 pb-4">
          <h1 className="text-white font-bold text-xl">Lembur</h1>
        </div>
        <div className="h-4 bg-[#ddeef8] rounded-t-3xl" />
      </div>

      <div className="px-4 -mt-1 pb-6 space-y-3 animate-fade-in">
        {/* ── Pemilihan Bulan & Tahun (Scrollable) ── */}
        <MonthYearPicker
          month={month}
          year={year}
          onChange={(newMonth, newYear) => {
            setMonth(newMonth);
            setYear(newYear);
            setPage(1);
          }}
        />

        {/* ── Summary Cards (Simpel, Estetik & Konsisten) ── */}
        <div className="grid grid-cols-2 gap-3">
          {/* Card 1: Jam Diajukan */}
          <div className="bg-white rounded-2xl border border-[#c8e0f0] shadow-xs px-3.5 py-3.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                JAM DIAJUKAN
              </span>
              <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#156bb8] flex items-center justify-center">
                <Clock size={13} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline">
              <span className="text-[22px] font-black text-[#156bb8] tracking-tight">
                {mockOvertimeSummary.totalHoursRequested}
              </span>
              <span className="text-[12px] font-bold text-slate-500 ml-1.5">
                Jam
              </span>
            </div>
          </div>

          {/* Card 2: Jam Disetujui */}
          <div className="bg-white rounded-2xl border border-[#c8e0f0] shadow-xs px-3.5 py-3.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                JAM DISETUJUI
              </span>
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={13} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline">
              <span className="text-[22px] font-black text-emerald-600 tracking-tight">
                {mockOvertimeSummary.totalHoursApproved}
              </span>
              <span className="text-[12px] font-bold text-slate-500 ml-1.5">
                Jam
              </span>
            </div>
          </div>
        </div>

        {/* ── Instruksi Lembur dari Atasan / HR (Jika Ada) ── */}
        {instructions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <AlertCircle size={14} className="text-amber-600" />
                Instruksi Lembur Atasan
              </span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                {instructions.length} Tugas
              </span>
            </div>

            {instructions.map((inst) => {
              const isAccepted = inst.meta?.instructionStatus === "accepted";
              const isDeclined = inst.meta?.instructionStatus === "declined";

              return (
                <div
                  key={inst.id}
                  className={`bg-white rounded-2xl border ${
                    isDeclined
                      ? "border-rose-200/80 bg-rose-50/20"
                      : isAccepted
                      ? "border-emerald-200/80 bg-emerald-50/20"
                      : "border-amber-300 shadow-xs"
                  } p-3.5 transition-all`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                        🚨 Perintah Lembur
                      </span>
                      <h4 className="text-xs font-bold text-slate-800 mt-1.5">
                        {inst.meta?.instructionTask || inst.title}
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                      {inst.timestamp}
                    </span>
                  </div>

                  <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-[11px] space-y-1">
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="font-semibold text-slate-800">
                        Dari: {inst.meta?.instructionFrom || "Atasan"}
                      </span>
                      <span className="font-bold text-[#156bb8]">
                        {inst.meta?.instructionHours || ""}
                      </span>
                    </div>
                    {inst.meta?.instructionDate && (
                      <p className="text-slate-500 font-medium">
                        Tanggal: {inst.meta.instructionDate}
                      </p>
                    )}
                  </div>

                  {/* Actions / Status */}
                  <div className="mt-3">
                    {isAccepted ? (
                      <div className="flex items-center justify-between text-xs">
                        <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-200">
                          <Check size={12} strokeWidth={2.5} /> Siap Lembur (Disetujui)
                        </span>
                        <span className="text-[10.5px] text-emerald-600 font-medium">Terkonfirmasi</span>
                      </div>
                    ) : isDeclined ? (
                      <div className="p-2 rounded-xl bg-rose-50 border border-rose-200/80 text-[11px] text-rose-800">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="inline-flex items-center gap-1 font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md text-[10px]">
                            <X size={11} strokeWidth={2.5} /> Lembur Ditolak
                          </span>
                          <span className="text-[10px] text-rose-500 font-medium">Telah Dibatalkan</span>
                        </div>
                        <p className="text-rose-700 mt-1 leading-snug">
                          <span className="font-semibold text-rose-900">Alasan:</span> {inst.meta?.declineReason || "Ada halangan yang tidak bisa ditinggalkan"}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAccept(inst.id)}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 px-3 rounded-xl transition-all cursor-pointer active:scale-95 shadow-xs flex items-center justify-center gap-1"
                        >
                          <Check size={13} strokeWidth={2.5} />
                          <span>Setuju (Siap Lembur)</span>
                        </button>
                        <button
                          onClick={() => handleDecline(inst.id)}
                          className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 font-bold text-xs py-2 px-3 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1"
                        >
                          <X size={13} strokeWidth={2.5} />
                          <span>Tidak Setuju</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* List Riwayat Lembur */}
        <div className="bg-white rounded-2xl border border-[#c8e0f0] shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700">Riwayat Pengajuan Lembur</span>
          </div>
          {paginated.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-10">Belum ada lembur</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {paginated.map((req) => (
                <div
                  key={req.id}
                  onClick={() => router.push(`/lembur/${req.id}`)}
                  className="px-4 py-3.5 cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium">{formatDate(req.date)}</p>
                      <p className="text-sm font-semibold text-[#1a3c5e] mt-0.5">{req.workMode}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{req.description}</p>
                    </div>
                    <StatusBadge status={req.status} size="sm" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* ── Extended Floating Action Button (+ Ajukan) ── */}
      <button
        onClick={() => router.push("/lembur/tambah")}
        className="fixed bottom-[84px] z-40 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#1a7dc4] to-[#156bb8] text-white shadow-lg shadow-[#156bb8]/35 flex items-center gap-1.5 hover:brightness-105 active:scale-95 transition-all cursor-pointer font-bold italic text-[13.5px] tracking-wide right-5 md:right-[calc(50%-21rem+1.25rem)] lg:right-[calc(50%-24rem+1.25rem)] xl:right-[calc(50%-28rem+1.25rem)]"
        aria-label="Ajukan Lembur"
      >
        <Plus size={18} strokeWidth={2.5} />
        <span>Ajukan</span>
      </button>
    </div>
  );
}

