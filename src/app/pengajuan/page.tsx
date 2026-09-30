"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText, CheckCircle2 } from "lucide-react";
import MonthYearPicker from "@/components/ui/MonthYearPicker";
import { mockLeaveRequests, mockLeaveSummary } from "@/lib/mockData";
import { formatDate, leaveTypeLabel } from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";
import StatusBadge from "@/components/ui/StatusBadge";

const ITEMS = 5;

export default function PengajuanPage() {
  const router = useRouter();
  const [month, setMonth] = useState("09");
  const [year, setYear] = useState(2026);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => mockLeaveRequests, [month, year]);
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
        <div className="relative px-4 pt-5 pb-4 flex items-center justify-between">
          <h1 className="text-white font-bold text-xl">Pengajuan</h1>
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
          {/* Card 1: Total Pengajuan */}
          <div className="bg-white rounded-2xl border border-[#c8e0f0] shadow-xs px-3.5 py-3.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                TOTAL PENGAJUAN
              </span>
              <div className="w-6 h-6 rounded-lg bg-blue-50 text-[#156bb8] flex items-center justify-center">
                <FileText size={13} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline">
              <span className="text-[22px] font-black text-[#156bb8] tracking-tight">
                {mockLeaveSummary.totalHoursRequested}
              </span>
            </div>
          </div>

          {/* Card 2: Yang Disetujui */}
          <div className="bg-white rounded-2xl border border-[#c8e0f0] shadow-xs px-3.5 py-3.5 flex flex-col justify-between hover:shadow-sm transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                YANG DISETUJUI
              </span>
              <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 size={13} strokeWidth={2.5} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline">
              <span className="text-[22px] font-black text-emerald-600 tracking-tight">
                {mockLeaveSummary.totalHoursApproved}
              </span>
            </div>
          </div>
        </div>

        {/* List Riwayat Pengajuan */}
        <div className="bg-white rounded-2xl border border-[#c8e0f0] shadow-sm overflow-hidden">
          {paginated.length === 0 ? (
            <p className="text-center text-sm text-slate-400 py-10">Belum ada pengajuan</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {paginated.map((req) => (
                <div
                  key={req.id}
                  onClick={() => router.push(`/pengajuan/${req.id}`)}
                  className="px-4 py-3.5 cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-slate-400 font-medium">{formatDate(req.startDate)}</p>
                      <p className="text-sm font-semibold text-[#1a3c5e] mt-0.5">{leaveTypeLabel(req.type)}</p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{req.keperluan}</p>
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
        onClick={() => router.push("/pengajuan/tambah")}
        className="fixed bottom-[84px] z-40 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#1a7dc4] to-[#156bb8] text-white shadow-lg shadow-[#156bb8]/35 flex items-center gap-1.5 hover:brightness-105 active:scale-95 transition-all cursor-pointer font-bold italic text-[13.5px] tracking-wide right-5 md:right-[calc(50%-21rem+1.25rem)] lg:right-[calc(50%-24rem+1.25rem)] xl:right-[calc(50%-28rem+1.25rem)]"
        aria-label="Tambah Pengajuan"
      >
        <Plus size={18} strokeWidth={2.5} />
        <span>Ajukan</span>
      </button>
    </div>
  );
}

