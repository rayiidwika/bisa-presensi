"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  Clock,
  LogIn,
  LogOut,
  Coffee,
  UserCheck,
  FileSignature,
  Stethoscope,
  History,
  UserX,
  AlarmClock,
  MessageSquare,
} from "lucide-react";
import Swal from "sweetalert2";

export default function HomePage() {
  const router = useRouter();
  const shift = "Reguler";
  const [checkInTime, setCheckInTime] = useState<string>("-- : --");
  const [checkOutTime, setCheckOutTime] = useState<string>("-- : --");
  const [breakStartTime, setBreakStartTime] = useState<string | null>(null);
  const [breakEndTime, setBreakEndTime] = useState<string | null>(null);
  const [checkInNotes, setCheckInNotes] = useState<string>("");
  const [checkOutNotes, setCheckOutNotes] = useState<string>("");

  useEffect(() => {
    const syncAttendance = () => {
      let inN =
        (typeof window !== "undefined" &&
          localStorage.getItem("bisa_attendance_checkin_notes")) ||
        "";
      let outN =
        (typeof window !== "undefined" &&
          localStorage.getItem("bisa_attendance_checkout_notes")) ||
        "";

      const saved = localStorage.getItem("bisa_attendance_today");
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data.checkIn) setCheckInTime(data.checkIn);
          if (data.checkOut) setCheckOutTime(data.checkOut);
          if (data.breakStart || data.break)
            setBreakStartTime(data.breakStart || data.break);
          if (data.breakEnd) setBreakEndTime(data.breakEnd);
          if (!inN && data.checkInNotes) inN = data.checkInNotes;
          if (!outN && data.checkOutNotes) outN = data.checkOutNotes;
        } catch (e) {
          console.error(e);
        }
      }
      setCheckInNotes(inN);
      setCheckOutNotes(outN);
    };
    syncAttendance();
    window.addEventListener("focus", syncAttendance);
    return () => window.removeEventListener("focus", syncAttendance);
  }, []);

  const handleIstirahatClick = () => {
    if (!breakStartTime) {
      // Belum mulai istirahat -> Langsung ke scan Clock In Istirahat
      router.push("/absensi/check-in?type=break_start");
    } else if (breakStartTime && !breakEndTime) {
      // Sedang istirahat -> Langsung ke scan Clock Out Istirahat
      router.push("/absensi/check-in?type=break_end");
    } else {
      // Sudah selesai istirahat -> Tampilkan riwayat dengan opsi jika ingin scan ulang
      Swal.fire({
        title: "Istirahat Hari Ini",
        html: `
          <div class="text-sm text-slate-600 mt-2">
            <div class="bg-blue-50 border border-blue-200/80 rounded-2xl p-4 my-3 text-left">
              <div class="flex justify-between items-center py-1 border-b border-blue-100">
                <span class="text-slate-500 font-medium">Clock In Istirahat:</span>
                <span class="font-bold text-blue-700">${breakStartTime}</span>
              </div>
              <div class="flex justify-between items-center py-1 pt-2">
                <span class="text-slate-500 font-medium">Clock Out Istirahat:</span>
                <span class="font-bold text-blue-700">${breakEndTime}</span>
              </div>
            </div>
            <p class="text-xs text-slate-500">Anda sudah menyelesaikan istirahat hari ini. Ingin memperbarui absensi istirahat?</p>
          </div>
        `,
        icon: "info",
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonColor: "#156bb8",
        denyButtonColor: "#0284c7",
        cancelButtonColor: "#94a3b8",
        confirmButtonText: "Clock Out Ulang",
        denyButtonText: "Clock In Ulang",
        cancelButtonText: "Tutup",
      }).then((res) => {
        if (res.isConfirmed) {
          router.push("/absensi/check-in?type=break_end");
        } else if (res.isDenied) {
          router.push("/absensi/check-in?type=break_start");
        }
      });
    }
  };

  const rekapItems = [
    {
      day: "Sel, 29 September",
      shift: "Reguler",
      time: `${checkInTime.replace(/\s+/g, "")}   ${checkOutTime.replace(/\s+/g, "")}`,
      notesIn: checkInNotes,
      notesOut: checkOutNotes,
    },
    {
      day: "Sab, 26 September",
      shift: "Reguler",
      time: "07:59   17:02",
    },
    {
      day: "Jum, 25 September",
      shift: "Reguler",
      time: "08:05   17:00",
    },
    { day: "Kam, 24 September", shift: "Reguler", time: "--:--   --:--" },
    { day: "Rab, 23 September", shift: "Reguler", time: "--:--   --:--" },
    { day: "Sen, 21 September", shift: "Reguler", time: "--:--   --:--" },
  ];

  return (
    <div className="min-h-screen bg-[#edf6fc] pb-10">
      {/* ══════════════ BLUE GRADIENT HEADER WITH WATERMARK ══════════════ */}
      <div className="bg-gradient-to-b from-[#2a8ee4] via-[#1f7cd0] to-[#156bb8] pt-4 pb-6 px-4 relative overflow-hidden rounded-b-[32px] shadow-sm">
        {/* Watermark Logo Bisa Media Putih Blur di ujung kanan */}
        <div className="absolute -right-6 -top-4 w-60 h-60 pointer-events-none opacity-25 filter blur-[0.8px] rotate-[-6deg] select-none">
          <img
            src="/bisa-media-white.png"
            alt="Watermark BISA MEDIA"
            className="w-full h-full object-contain"
          />
        </div>

        {/* Top bar (Logo & Bell) */}
        <div className="flex items-center justify-between relative z-10">
          {/* Logo BISA MEDIA (Tanpa background putih) */}
          <div className="flex items-center gap-2 select-none">
            <img
              src="/bisa-media-white.png"
              alt="Logo BISA MEDIA"
              className="w-9 h-9 object-contain drop-shadow-md"
            />
            <div className="flex flex-col leading-none font-black text-white text-[10px] tracking-wider drop-shadow-sm">
              <span>BISA</span>
              <span>MEDIA</span>
            </div>
          </div>

          {/* White Notification Bell */}
          <button
            onClick={() =>
              Swal.fire({
                title: "Notifikasi",
                text: "Tidak ada notifikasi baru saat ini.",
                icon: "info",
                confirmButtonColor: "#156bb8",
              })
            }
            aria-label="Notifikasi"
            className="text-white hover:opacity-90 active:scale-95 transition-all p-1.5"
          >
            <Bell size={24} className="fill-white text-white drop-shadow-sm" />
          </button>
        </div>

        {/* Greeting Text */}
        <div className="mt-5 mb-4 relative z-10">
          <h1 className="text-white text-[24px] font-bold italic tracking-wide leading-tight">
            Hallo Setiawan
          </h1>
          <p className="text-white/90 text-[11px] font-medium tracking-normal mt-1">
            Jangan lupa ngabsen // Semangat bekerjanya yaa
          </p>
        </div>

        {/* ══════════════ EMPLOYEE CARD ══════════════ */}
        <div className="bg-white rounded-3xl p-4 shadow-xl border border-white/60 relative z-10">
          {/* NIP Badge */}
          <div className="inline-block bg-[#156bb8] text-white text-[10px] font-bold px-3 py-1 rounded-md shadow-xs">
            TAP - PT BISA MEDIA GRUP
          </div>

          {/* Employee Name + Position + Avatar */}
          <div className="flex justify-between items-start mt-2">
            <div>
              <h2 className="text-[17px] font-bold text-slate-800 leading-tight">
                Setiawan
              </h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Divisi : Information Technology
              </p>
              <p className="text-[11px] text-slate-500 font-medium">
                Staff Information Technology
              </p>
            </div>

            {/* Avatar Profile (Circle with Slate Silhouette) */}
            <div className="w-16 h-16 rounded-full bg-[#d8e5ee] border-2 border-white shadow-sm flex items-center justify-center overflow-hidden shrink-0">
              <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
                <circle cx="32" cy="24" r="11" fill="#475569" />
                <path
                  d="M14 56C14 45 22 41 32 41C42 41 50 45 50 56"
                  fill="#475569"
                />
              </svg>
            </div>
          </div>

          {/* Date, Shift & Hours */}
          <div className="flex items-center justify-between mt-3 text-[11px]">
            <div>
              <p className="text-slate-400 font-medium text-[10.5px]">
                Jum&apos;at , 11 Sep 2026
              </p>
              <p className="font-semibold text-slate-700 text-[11px] mt-0.5">
                Reguler
              </p>
            </div>

            <div className="text-right">
              <p className="font-semibold text-slate-600 text-[11px]">
                08.00 - 17.00
              </p>
              <div className="flex items-center justify-end gap-1 text-slate-400 text-[10.5px] mt-0.5">
                <Clock size={11} className="text-slate-400" />
                <span>0 Jam 0 Menit</span>
              </div>
            </div>
          </div>

          {/* Thin Divider Line */}
          <div className="w-full h-px bg-slate-200/80 my-3" />

          {/* Two Boxes: Clock In & Clock Out */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Clock In Box */}
            <button
              onClick={() => router.push("/absensi/check-in")}
              className="bg-white border border-slate-200/90 hover:border-emerald-400/80 hover:shadow-xs rounded-2xl py-3 px-3.5 text-center shadow-2xs active:scale-[0.98] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-center gap-1.5 text-slate-400 group-hover:text-emerald-600 transition-colors">
                <LogIn size={15} className="text-emerald-500" strokeWidth={2.3} />
                <span className="text-[12px] font-semibold text-slate-500 group-hover:text-emerald-700 transition-colors">
                  Clock In
                </span>
              </div>
              <p className="text-[20px] font-bold text-slate-800 tracking-wider mt-1 group-hover:text-emerald-700 transition-colors">
                {checkInTime}
              </p>
            </button>

            {/* Clock Out Box */}
            <button
              onClick={() => router.push("/absensi/check-in?type=out")}
              className="bg-white border border-slate-200/90 hover:border-rose-400/80 hover:shadow-xs rounded-2xl py-3 px-3.5 text-center shadow-2xs active:scale-[0.98] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-center gap-1.5 text-slate-400 group-hover:text-rose-600 transition-colors">
                <LogOut size={15} className="text-rose-500" strokeWidth={2.3} />
                <span className="text-[12px] font-semibold text-slate-500 group-hover:text-rose-700 transition-colors">
                  Clock Out
                </span>
              </div>
              <p className="text-[20px] font-bold text-slate-800 tracking-wider mt-1 group-hover:text-rose-700 transition-colors">
                {checkOutTime}
              </p>
            </button>
          </div>

          {/* Full-width Istirahat Button */}
          <button
            onClick={handleIstirahatClick}
            className={`w-full mt-2.5 rounded-xl py-2.5 px-3 text-center border transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${
              breakStartTime && !breakEndTime
                ? "bg-amber-50/80 border-amber-300 hover:bg-amber-100/70 text-amber-800"
                : breakStartTime && breakEndTime
                ? "bg-emerald-50/80 border-emerald-300 hover:bg-emerald-100/70 text-emerald-800"
                : "bg-white border-slate-200/90 hover:bg-slate-50 text-slate-700"
            }`}
          >
            <Coffee
              size={15}
              strokeWidth={2.2}
              className={
                breakStartTime && !breakEndTime
                  ? "text-amber-600"
                  : breakStartTime && breakEndTime
                  ? "text-emerald-600"
                  : "text-slate-400"
              }
            />
            <span className="text-[13px] font-semibold tracking-wide">
              {!breakStartTime
                ? "Istirahat"
                : !breakEndTime
                ? `Clock Out Istirahat (${breakStartTime})`
                : `Istirahat (${breakStartTime} - ${breakEndTime})`}
            </span>
            {breakStartTime && !breakEndTime && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* ══════════════ ABSENSI BULAN SELECTOR ══════════════ */}
      <div className="flex items-center gap-1.5 px-4 mt-3 mb-2.5">
        <span className="text-[13px] font-bold text-slate-800">
          Absensi Bulan
        </span>
        <button
          onClick={() =>
            Swal.fire({
              title: "Pilih Bulan Absensi",
              input: "select",
              inputOptions: {
                "09-2026": "September 2026",
                "08-2026": "Agustus 2026",
                "07-2026": "Juli 2026",
              },
              inputPlaceholder: "Pilih bulan",
              showCancelButton: true,
              confirmButtonColor: "#156bb8",
              confirmButtonText: "Terapkan",
              cancelButtonText: "Batal",
            })
          }
          className="flex items-center gap-1 text-[#156bb8] text-[13px] font-bold hover:underline"
        >
          <span>September 2026</span>
          <ChevronDown size={13} className="text-[#156bb8]" />
        </button>
      </div>

      {/* ══════════════ 6 STATS CARDS (3x2) ══════════════ */}
      <div className="px-4 mb-3">
        <div className="grid grid-cols-2 gap-2.5">
          {/* 1. Hadir */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 flex items-center gap-3 hover:border-blue-300 hover:shadow-xs transition-all group">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs text-[#156bb8] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <UserCheck size={20} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h4 className="text-[13px] font-bold italic text-black leading-tight">
                Hadir
              </h4>
              <p className="text-[10px] text-slate-500 font-medium italic mt-0.5 whitespace-nowrap">
                4 Hari / 26 Hari
              </p>
            </div>
          </div>

          {/* 2. Ijin */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 flex items-center gap-3 hover:border-blue-300 hover:shadow-xs transition-all group">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs text-[#156bb8] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileSignature size={20} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h4 className="text-[13px] font-bold italic text-black leading-tight">
                Ijin
              </h4>
              <p className="text-[10px] text-slate-500 font-medium italic mt-0.5">
                0 Hari
              </p>
            </div>
          </div>

          {/* 3. Sakit */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 flex items-center gap-3 hover:border-blue-300 hover:shadow-xs transition-all group">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs text-[#156bb8] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Stethoscope size={20} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h4 className="text-[13px] font-bold italic text-black leading-tight">
                Sakit
              </h4>
              <p className="text-[10px] text-slate-500 font-medium italic mt-0.5">
                0 Hari
              </p>
            </div>
          </div>

          {/* 4. Terlambat */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 flex items-center gap-3 hover:border-blue-300 hover:shadow-xs transition-all group">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs text-[#156bb8] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <History size={20} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h4 className="text-[13px] font-bold italic text-black leading-tight">
                Terlambat
              </h4>
              <p className="text-[10px] text-slate-500 font-medium italic mt-0.5 whitespace-nowrap">
                - 15 Menit / 0 Hari
              </p>
            </div>
          </div>

          {/* 5. Tidak Lengkap */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 flex items-center gap-3 hover:border-blue-300 hover:shadow-xs transition-all group">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs text-[#156bb8] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <UserX size={20} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h4 className="text-[13px] font-bold italic text-black leading-tight">
                Tidak Lengkap
              </h4>
              <p className="text-[10px] text-slate-500 font-medium italic mt-0.5">
                0 Hari
              </p>
            </div>
          </div>

          {/* 6. Tepat Waktu */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 flex items-center gap-3 hover:border-blue-300 hover:shadow-xs transition-all group">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-2xs text-[#156bb8] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <AlarmClock size={20} strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h4 className="text-[13px] font-bold italic text-black leading-tight">
                Tepat Waktu
              </h4>
              <p className="text-[10px] text-slate-500 font-medium italic mt-0.5">
                4 Hari
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════ REKAP ABSENSI ══════════════ */}
      <div className="px-4">
        <h3 className="text-[13px] font-bold text-slate-800 mb-2 px-1">
          Rekap Absensi
        </h3>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {rekapItems.map((item, index) => (
              <button
                key={index}
                onClick={() => router.push(`/absensi/ATT-00${(index % 3) + 1}`)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-slate-50/80 active:bg-blue-50/40 transition-colors group"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <p className="text-[12px] font-bold text-[#156bb8] italic group-hover:text-blue-700 transition-colors">
                    {item.day}
                  </p>
                  <p className="text-[10px] text-slate-400 italic">
                    {item.shift}
                  </p>
                  {(item.notesIn || item.notesOut) && (
                    <div className="flex items-center gap-1.5 mt-1 text-[9.5px] text-slate-600 bg-blue-50/80 border border-blue-200/60 rounded-md px-2 py-0.5 max-w-fit">
                      <MessageSquare size={10} className="text-[#156bb8] shrink-0" />
                      <span className="truncate max-w-[210px] italic">
                        {item.notesIn && item.notesOut
                          ? `In: "${item.notesIn}" • Out: "${item.notesOut}"`
                          : item.notesIn
                          ? `In: "${item.notesIn}"`
                          : `Out: "${item.notesOut}"`}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[12px] font-medium text-[#4ea0d8] tracking-widest">
                    {item.time}
                  </span>
                  <ChevronRight size={14} className="text-slate-300 shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
