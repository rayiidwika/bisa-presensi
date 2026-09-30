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

  // Realtime Dates State
  const [todayCardDate, setTodayCardDate] = useState<string>("Rabu , 30 Sep 2026");
  const [todayRekapDate, setTodayRekapDate] = useState<string>("Rab, 30 September");
  const [currentMonthYear, setCurrentMonthYear] = useState<string>("September 2026");
  const [pastRekapDays, setPastRekapDays] = useState<{ day: string; shift: string; time: string }[]>([
    { day: "Sel, 29 September", shift: "Reguler", time: "07:59 - 17:02" },
    { day: "Sen, 28 September", shift: "Reguler", time: "08:05 - 17:00" },
    { day: "Sab, 26 September", shift: "Reguler", time: "--:-- - --:--" },
    { day: "Jum, 25 September", shift: "Reguler", time: "--:-- - --:--" },
    { day: "Kam, 24 September", shift: "Reguler", time: "--:-- - --:--" },
  ]);

  useEffect(() => {
    // Generate Realtime Dates based on current system time
    const now = new Date();
    const daysShort = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const daysFull = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jum'at", "Sabtu"];
    const monthsFull = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const monthsShort = [
      "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
      "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
    ];

    const tRekap = `${daysShort[now.getDay()]}, ${now.getDate()} ${monthsFull[now.getMonth()]}`;
    const tCard = `${daysFull[now.getDay()]}, ${now.getDate()} ${monthsShort[now.getMonth()]} ${now.getFullYear()}`;
    const mYear = `${monthsFull[now.getMonth()]} ${now.getFullYear()}`;

    setTodayRekapDate(tRekap);
    setTodayCardDate(tCard);
    setCurrentMonthYear(mYear);

    // Generate 5 previous working days
    const past: { day: string; shift: string; time: string }[] = [];
    const defaultTimes = [
      "07:59 - 17:02",
      "08:05 - 17:00",
      "--:-- - --:--",
      "--:-- - --:--",
      "--:-- - --:--",
    ];

    let cur = new Date(now);
    let count = 0;
    while (count < 5) {
      cur.setDate(cur.getDate() - 1);
      if (cur.getDay() === 0) continue; // Skip Sunday
      past.push({
        day: `${daysShort[cur.getDay()]}, ${cur.getDate()} ${monthsFull[cur.getMonth()]}`,
        shift: "Reguler",
        time: defaultTimes[count] || "--:-- - --:--",
      });
      count++;
    }
    setPastRekapDays(past);

    const syncAttendance = () => {
      let inTime =
        typeof window !== "undefined"
          ? localStorage.getItem("bisa_attendance_checkin_time")
          : null;
      let outTime =
        typeof window !== "undefined"
          ? localStorage.getItem("bisa_attendance_checkout_time")
          : null;
      let inN =
        (typeof window !== "undefined" &&
          localStorage.getItem("bisa_attendance_checkin_notes")) ||
        "";
      let outN =
        (typeof window !== "undefined" &&
          localStorage.getItem("bisa_attendance_checkout_notes")) ||
        "";

      const saved =
        typeof window !== "undefined"
          ? localStorage.getItem("bisa_attendance_today")
          : null;
      if (saved) {
        try {
          const data = JSON.parse(saved);
          if (data.checkIn) inTime = data.checkIn;
          if (data.checkOut) outTime = data.checkOut;
          if (data.breakStart || data.break)
            setBreakStartTime(data.breakStart || data.break);
          if (data.breakEnd) setBreakEndTime(data.breakEnd);
          if (!inN && data.checkInNotes) inN = data.checkInNotes;
          if (!outN && data.checkOutNotes) outN = data.checkOutNotes;
        } catch (e) {
          console.error(e);
        }
      }

      setCheckInTime(inTime || "-- : --");
      setCheckOutTime(outTime || "-- : --");
      setCheckInNotes(inN);
      setCheckOutNotes(outN);
    };

    syncAttendance();
    window.addEventListener("focus", syncAttendance);
    window.addEventListener("storage", syncAttendance);
    return () => {
      window.removeEventListener("focus", syncAttendance);
      window.removeEventListener("storage", syncAttendance);
    };
  }, []);

  const handleIstirahatClick = () => {
    if (!breakStartTime) {
      // Belum mulai istirahat -> Langsung ke scan Clock In Istirahat
      router.push("/absensi/check-in?type=break_start");
    } else if (breakStartTime && !breakEndTime) {
      // Sedang istirahat -> Langsung ke scan Selesai Istirahat
      router.push("/absensi/check-in?type=break_end");
    } else {
      // Sudah selesai istirahat -> Tampilkan pop-up informasi jam istirahat dengan tombol Tutup saja
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
                <span class="text-slate-500 font-medium">Selesai Istirahat:</span>
                <span class="font-bold text-blue-700">${breakEndTime}</span>
              </div>
            </div>
            <p class="text-xs text-slate-500">Anda sudah menyelesaikan istirahat hari ini.</p>
          </div>
        `,
        icon: "info",
        iconColor: "#156bb8",
        confirmButtonColor: "#156bb8",
        confirmButtonText: "Tutup",
        showCancelButton: false,
        showDenyButton: false,
      });
    }
  };

  const rekapItems = [
    {
      day: todayRekapDate,
      shift: "Reguler",
      time: `${checkInTime.replace(/\s+/g, "")} - ${checkOutTime.replace(/\s+/g, "")}`,
      notesIn: checkInNotes,
      notesOut: checkOutNotes,
    },
    ...pastRekapDays,
  ];

  const hasCheckedIn = Boolean(
    checkInTime &&
    checkInTime !== "-- : --" &&
    checkInTime !== "--:--" &&
    checkInTime !== "-"
  );

  const hasCheckedOut = Boolean(
    checkOutTime &&
    checkOutTime !== "-- : --" &&
    checkOutTime !== "--:--" &&
    checkOutTime !== "-"
  );

  // Perhitungan Total Jam Kerja Hari Ini:
  // - Jam masuk kantor: 08:00 (jika absen lebih awal, mulai dihitung 08:00; jika terlambat misal 08:01, dihitung 08:01)
  // - Istirahat: 12:00 - 13:00 (1 jam tidak dihitung kerja)
  // - Jam pulang kantor standar: 17:00 (jika clock out lebih dari jam 17:00, tetap dihitung maksimal sampai jam 17:00)
  // - Format: {jam} Jam {menit} Menit (contoh: 8 Jam 0 Menit, atau 7 Jam 59 Menit jika masuk 08:01; 0 Jam 0 Menit jika belum absen)
  const calculateTotalWorkHours = (inStr?: string | null, outStr?: string | null): string => {
    if (!hasCheckedIn || !inStr || inStr === "-- : --" || inStr === "--:--") return "0 Jam 0 Menit";

    const parseToMinutes = (str: string): number | null => {
      const match = str.trim().match(/(\d{1,2})[:.](\d{2})(?:\s*([AP]M))?/i);
      if (!match) return null;
      let h = parseInt(match[1], 10);
      const m = parseInt(match[2], 10);
      const mer = match[3]?.toUpperCase();
      if (mer === "PM" && h < 12) h += 12;
      if (mer === "AM" && h === 12) h = 0;
      return h * 60 + m;
    };

    const inMin = parseToMinutes(inStr);
    if (inMin === null) return "0 Jam 0 Menit";

    const outMin = hasCheckedOut && outStr ? parseToMinutes(outStr) : 1020;
    if (outMin === null) return "8 Jam 0 Menit";

    // Maksimal clock out dihitung sampai jam 17:00 (1020 menit)
    const cappedOut = Math.min(outMin, 1020);

    // 1. Sesi Pagi (08:00 = 480 s.d 12:00 = 720)
    const morningStart = Math.max(480, inMin);
    const morningEnd = Math.min(720, cappedOut);
    const morningMinutes = Math.max(0, morningEnd - morningStart);

    // 2. Sesi Siang (13:00 = 780 s.d 17:00 = 1020)
    const afternoonStart = inMin <= 780 ? 780 : Math.max(780, inMin);
    const afternoonEnd = Math.min(1020, cappedOut);
    const afternoonMinutes = Math.max(0, afternoonEnd - afternoonStart);

    const totalMinutes = morningMinutes + afternoonMinutes;
    if (totalMinutes <= 0) return "0 Jam 0 Menit";

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    return `${hours} Jam ${mins} Menit`;
  };

  const totalWorkHoursToday = calculateTotalWorkHours(checkInTime, checkOutTime);

  return (
    <div className="min-h-screen bg-[#ddeef8] pb-24">
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
          <div className="text-white/90 text-[11.5px] font-medium tracking-normal mt-1 leading-snug transition-all">
            {!hasCheckedIn ? (
              <>
                <p>Pagi! Jangan lupa absen dulu ya,</p>
                <p>semoga harimu menyenangkan ✨</p>
              </>
            ) : !hasCheckedOut ? (
              <>
                <p>Absen masuk beres! Semangat ya,</p>
                <p>kamu pasti bisa lewatin hari ini 💪</p>
              </>
            ) : (
              <>
                <p>Absen pulang tercatat! Waktunya isi ulang energi,</p>
                <p>sampai ketemu besok! 🎉</p>
              </>
            )}
          </div>
        </div>

        {/* ══════════════ EMPLOYEE CARD ══════════════ */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-xl border border-white/60 relative z-10">
          {/* NIP Badge */}
          <div className="inline-block bg-[#156bb8] text-white text-[11.5px] font-bold px-3.5 py-1 rounded-md shadow-xs">
            TAP - PT BISA MEDIA GRUP
          </div>

          {/* Employee Card Body - Top Row: Info Karyawan & Avatar */}
          <div className="flex items-center justify-between mt-3.5">
            {/* Info Karyawan: Nama & Divisi & Staff */}
            <div className="flex-1 pr-3">
              <h2 className="text-[21px] font-black text-slate-800 leading-tight tracking-tight">
                Setiawan
              </h2>
              <p className="text-[13px] text-slate-500 font-semibold mt-1">
                Divisi : IT
              </p>
              <p className="text-[13px] text-slate-500 font-semibold mt-0.5">
                Staff : IT Programmer
              </p>
            </div>

            {/* Avatar Profile (Circle with Slate Silhouette) */}
            <div className="w-[125px] flex justify-center mr-2 sm:mr-4 shrink-0">
              <div className="w-[68px] h-[68px] rounded-full bg-[#d8e5ee] border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
                <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
                  <circle cx="32" cy="24" r="11" fill="#475569" />
                  <path
                    d="M14 56C14 45 22 41 32 41C42 41 50 45 50 56"
                    fill="#475569"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Employee Card Body - Bottom Rows: Jadwal Hari & Jam Kerja (Sejajar Sempurna Kiri-Kanan) */}
          <div className="mt-4 pt-1 space-y-1.5">
            {/* Baris 1: Tanggal (Kiri) & Jam Shift (Kanan) */}
            <div className="flex items-center justify-between">
              <p className="text-slate-400 font-semibold text-[12px] leading-tight">
                {todayCardDate}
              </p>
              <div className="w-[125px] text-center mr-2 sm:mr-4 shrink-0">
                <p className="font-extrabold text-slate-800 text-[13.5px] leading-tight tracking-wide">
                  08.00 - 17.00
                </p>
              </div>
            </div>

            {/* Baris 2: Shift Reguler (Kiri) & Total Jam Kerja (Kanan) */}
            <div className="flex items-center justify-between">
              <p className="font-extrabold text-slate-700 text-[13.5px] leading-tight">
                Reguler
              </p>
              <div className="w-[125px] flex items-center justify-center gap-1.5 text-slate-600 font-bold text-[13px] leading-tight mr-2 sm:mr-4 shrink-0">
                <Clock size={14} className="text-[#156bb8] shrink-0" strokeWidth={2.4} />
                <span className="whitespace-nowrap">{totalWorkHoursToday}</span>
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
                ? `Selesai Istirahat (${breakStartTime})`
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
        <span className="text-[14px] font-bold text-slate-800">
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
          className="flex items-center gap-1 text-[#156bb8] text-[14px] font-bold hover:underline"
        >
          <span>{currentMonthYear}</span>
          <ChevronDown size={14} className="text-[#156bb8]" />
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
                - 15 Menit
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
        <h3 className="text-[14px] font-bold text-slate-800 mb-2 px-1">
          Rekap Absensi
        </h3>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {rekapItems.map((item, index) => (
              <button
                key={index}
                onClick={() => router.push(index === 0 ? "/absensi/today" : `/absensi/ATT-00${(index % 3) + 1}`)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50/80 active:bg-blue-50/40 transition-colors group cursor-pointer"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-[14px] font-bold text-[#156bb8] italic group-hover:text-blue-700 transition-colors leading-tight">
                    {item.day}
                  </p>
                  <p className="text-[11.5px] text-slate-400 italic mt-0.5">
                    {item.shift}
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-[14px] font-bold text-[#3589c5] tracking-wider">
                    {item.time}
                  </span>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
