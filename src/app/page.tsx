"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  ChevronLeft,
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
  Settings,
  Calendar,
  Home,
  X,
  Eye,
  FileText,
  ExternalLink,
} from "lucide-react";
import Swal from "sweetalert2";
import { getUnreadCount, showNotificationPopup } from "@/lib/notifications";
import { getUserProfile, UserProfile } from "@/lib/userProfile";
import { mockLeaveRequests } from "@/lib/mockData";
import { LeaveRequest } from "@/types";
import { formatDate } from "@/lib/utils";

const ALL_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];
import ProfileSettingsModal from "@/components/profile/ProfileSettingsModal";

export default function HomePage() {
  const router = useRouter();
  const shift = "Reguler";
  const [checkInTime, setCheckInTime] = useState<string>("-- : --");
  const [checkOutTime, setCheckOutTime] = useState<string>("-- : --");
  const [breakStartTime, setBreakStartTime] = useState<string | null>(null);
  const [breakEndTime, setBreakEndTime] = useState<string | null>(null);
  const [checkInNotes, setCheckInNotes] = useState<string>("");
  const [checkOutNotes, setCheckOutNotes] = useState<string>("");
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [userProfile, setUserProfile] = useState<UserProfile>(getUserProfile());
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPreviewAvatarOpen, setIsPreviewAvatarOpen] = useState<boolean>(false);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // September (0-indexed)
  const [selectedYear, setSelectedYear] = useState<number>(2026);

  // Riwayat Sakit, Izin, Cuti Popup State
  const [selectedHistoryType, setSelectedHistoryType] = useState<"sakit" | "izin" | "cuti" | null>(null);
  const [previewDocModal, setPreviewDocModal] = useState<LeaveRequest | null>(null);
  const [leaveRequestsList, setLeaveRequestsList] = useState<LeaveRequest[]>([]);

  // Realtime Dates & Clock State
  const [todayCardDate, setTodayCardDate] = useState<string>("Rabu , 30 Sep 2026");
  const [todayRekapDate, setTodayRekapDate] = useState<string>("Rab, 30 September");
  const [currentMonthYear, setCurrentMonthYear] = useState<string>("September 2026");
  const [realtimeClock, setRealtimeClock] = useState<string>("");
  const [pastRekapDays, setPastRekapDays] = useState<{ day: string; shift: string; time: string }[]>([
    { day: "Sel, 29 September", shift: "Reguler", time: "07:59 - 17:02" },
    { day: "Sen, 28 September", shift: "Reguler", time: "08:05 - 17:00" },
    { day: "Sab, 26 September", shift: "Reguler", time: "--:-- - --:--" },
    { day: "Jum, 25 September", shift: "Reguler", time: "--:-- - --:--" },
    { day: "Kam, 24 September", shift: "Reguler", time: "--:-- - --:--" },
  ]);

  useEffect(() => {
    // Check if user is logged in
    const isLoggedIn =
      typeof window !== "undefined" &&
      (localStorage.getItem("bisa_logged_in") === "true" ||
        document.cookie.includes("bisa_logged_in=true"));

    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }
    setIsAuthChecking(false);

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

    // Realtime clock (hanya jam dan menit)
    const updateRealtimeClock = () => {
      const d = new Date();
      const h = String(d.getHours()).padStart(2, "0");
      const m = String(d.getMinutes()).padStart(2, "0");
      setRealtimeClock(`${h}.${m}`);
    };
    updateRealtimeClock();
    const clockTimer = setInterval(updateRealtimeClock, 1000);

    // Format helper to strip seconds if any (e.g. 08:30:15 -> 08:30)
    const formatTimeWithoutSeconds = (timeStr?: string | null) => {
      if (!timeStr || timeStr === "-- : --" || timeStr === "--:--" || timeStr === "-") return "-- : --";
      const clean = timeStr.trim().replace(/\s+/g, "");
      const parts = clean.split(":");
      if (parts.length >= 2) {
        return `${parts[0]}:${parts[1]}`;
      }
      return timeStr;
    };

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

    // Otomatis reset data absensi hari ini jika URL memiliki ?reset=attendance atau ?reset=true
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("reset") === "attendance" || urlParams.get("reset") === "true") {
        [
          "bisa_attendance_today",
          "bisa_attendance_checkin_time",
          "bisa_attendance_checkout_time",
          "bisa_attendance_checkin_notes",
          "bisa_attendance_checkout_notes",
          "bisa_attendance_checkin_photo",
          "bisa_attendance_checkout_photo",
          "bisa_attendance_checkin_location",
          "bisa_attendance_checkout_location",
          "bisa_attendance_checkin_distance",
          "bisa_attendance_checkout_distance",
          "bisa_attendance_break_start",
          "bisa_attendance_break_end",
          "bisa_attendance_notes",
          "bisa_attendance_photo",
        ].forEach((k) => localStorage.removeItem(k));
        window.history.replaceState({}, "", "/");
      }
    }

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
            setBreakStartTime(formatTimeWithoutSeconds(data.breakStart || data.break));
          if (data.breakEnd) setBreakEndTime(formatTimeWithoutSeconds(data.breakEnd));
          if (!inN && data.checkInNotes) inN = data.checkInNotes;
          if (!outN && data.checkOutNotes) outN = data.checkOutNotes;
        } catch (e) {
          console.error(e);
        }
      }

      setCheckInTime(inTime ? formatTimeWithoutSeconds(inTime) : "-- : --");
      setCheckOutTime(outTime ? formatTimeWithoutSeconds(outTime) : "-- : --");
      setCheckInNotes(inN);
      setCheckOutNotes(outN);
    };

    syncAttendance();
    const updateUnread = () => setUnreadCount(getUnreadCount());
    updateUnread();
    const syncProfile = () => setUserProfile(getUserProfile());
    syncProfile();

    const syncLeaveRequests = () => {
      let custom: LeaveRequest[] = [];
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem("bisa_custom_leave_requests");
          if (raw) custom = JSON.parse(raw);
        } catch (e) {
          console.warn(e);
        }
      }
      setLeaveRequestsList([...custom, ...mockLeaveRequests]);
    };
    syncLeaveRequests();

    window.addEventListener("focus", syncAttendance);
    window.addEventListener("storage", syncAttendance);
    window.addEventListener("bisa_notification_change", updateUnread);
    window.addEventListener("bisa_profile_change", syncProfile);
    window.addEventListener("bisa_leave_change", syncLeaveRequests);
    window.addEventListener("storage", syncLeaveRequests);
    window.addEventListener("storage", syncProfile);
    return () => {
      clearInterval(clockTimer);
      window.removeEventListener("focus", syncAttendance);
      window.removeEventListener("storage", syncAttendance);
      window.removeEventListener("bisa_notification_change", updateUnread);
      window.removeEventListener("bisa_profile_change", syncProfile);
      window.removeEventListener("bisa_leave_change", syncLeaveRequests);
      window.removeEventListener("storage", syncLeaveRequests);
      window.removeEventListener("storage", syncProfile);
    };
  }, []);

  const handleIstirahatClick = () => {
    if (!breakStartTime) {
      router.push("/absensi/check-in?type=break_start");
    } else if (breakStartTime && !breakEndTime) {
      router.push("/absensi/check-in?type=break_end");
    } else {
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

  const handleLogout = () => {
    Swal.fire({
      title: "Keluar Akun?",
      text: "Apakah Anda yakin ingin keluar dari aplikasi?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Keluar",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
      reverseButtons: true,
      customClass: {
        popup: "!w-[92vw] sm:!w-[400px] !max-w-[400px] rounded-3xl p-6 shadow-2xl",
        confirmButton: "rounded-xl font-bold py-2.5 px-5 text-sm shadow-sm",
        cancelButton: "rounded-xl font-medium py-2.5 px-4 text-sm",
      },
    }).then((res) => {
      if (res.isConfirmed) {
        try {
          localStorage.removeItem("bisa_logged_in");
          document.cookie = "bisa_logged_in=; path=/; max-age=0; SameSite=Lax";
        } catch (e) {
          console.warn(e);
        }
        router.push("/login");
      }
    });
  };

  const handleSettingsClick = () => {
    setIsSettingsOpen(true);
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

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#071322] flex flex-col items-center justify-center select-none">
        <div className="w-16 h-16 relative flex items-center justify-center animate-pulse mb-4">
          <img
            src="/app-logo.png"
            alt="Logo Bisa Presensi"
            className="w-14 h-14 object-contain drop-shadow-md"
          />
        </div>
        <div className="w-6 h-6 border-2 border-[#1a7dc4] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const formatItemDate = (item: LeaveRequest) => {
    if (!item.startDate) return "-";
    if (item.startDate === item.endDate || !item.endDate) {
      if (item.type === "izin" && item.startTime && item.endTime && item.startTime !== "--:--") {
        return `${formatDate(item.startDate)} • ${item.startTime} - ${item.endTime} WIB`;
      }
      return formatDate(item.startDate);
    }
    return `${formatDate(item.startDate)} - ${formatDate(item.endDate)}`;
  };

  const sakitItems = leaveRequestsList.filter((r) => r.type === "sakit");
  const izinItems = leaveRequestsList.filter((r) => r.type === "izin");
  const cutiItems = leaveRequestsList.filter((r) => r.type === "cuti");

  const sakitCount = sakitItems.reduce((acc, curr) => acc + (curr.totalDays || 1), 0);
  const izinCount = izinItems.reduce((acc, curr) => acc + (curr.totalDays || 1), 0);
  const cutiCount = cutiItems.reduce((acc, curr) => acc + (curr.totalDays || 1), 0);

  const currentHistoryList = selectedHistoryType
    ? leaveRequestsList.filter((r) => r.type === selectedHistoryType)
    : [];

  return (
    <div className="min-h-screen bg-[#ddeef8] pb-24">
      {/* ══════════════ BLUE GRADIENT HEADER WITH WATERMARK ══════════════ */}
      <div className="bg-gradient-to-b from-[#2a8ee4] via-[#1f7cd0] to-[#156bb8] pt-4 pb-6 px-4 sm:px-6 md:px-8 relative overflow-hidden rounded-b-[32px] sm:rounded-b-[40px] shadow-sm">
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

          {/* Actions: Notification Bell & Settings */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={async () => {
                await showNotificationPopup();
                setUnreadCount(getUnreadCount());
              }}
              aria-label="Notifikasi"
              className="relative text-white hover:opacity-90 active:scale-95 transition-all p-1.5 cursor-pointer"
            >
              <Bell size={22} className="fill-white text-white drop-shadow-sm" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-[#156bb8] animate-pulse" />
              )}
            </button>

            <button
              type="button"
              onClick={handleSettingsClick}
              title="Pengaturan"
              aria-label="Pengaturan"
              className="text-white/90 hover:text-white bg-white/15 hover:bg-white/25 p-1.5 rounded-xl active:scale-95 transition-all cursor-pointer border border-white/20 flex items-center justify-center hover:rotate-45 transition-transform duration-300"
            >
              <Settings size={18} strokeWidth={2.2} />
            </button>
          </div>
        </div>

        {/* Greeting Text Centered with Larger Font and Extra Generous Gaps */}
        <div className="mt-10 sm:mt-14 mb-12 sm:mb-16 text-center relative z-10">
          <h1 className="text-white text-[32px] sm:text-[38px] md:text-[42px] font-black italic tracking-wide leading-none drop-shadow-sm">
            Hallo {userProfile.name}
          </h1>
          <div className="text-white/95 text-[13px] sm:text-[14px] font-medium tracking-normal mt-2.5 sm:mt-3 leading-snug transition-all">
            {!hasCheckedIn ? (
              <p>Jangan lupa absen masuk // Awali harimu dengan semangat ☀️</p>
            ) : !hasCheckedOut ? (
              <p>Absen masuk tercatat // Semangat kerjanya semoga harimu senin terus 💪🔥</p>
            ) : (
              <p>Absen pulang tercatat // Selamat beristirahat 🎉</p>
            )}
          </div>
        </div>

        {/* ══════════════ EMPLOYEE CARD ══════════════ */}
        <div className="bg-[linear-gradient(180deg,#aee0fb_0%,#d8effd_25%,#f2f9fe_45%,#ffffff_65%,#ffffff_100%)] rounded-[28px] sm:rounded-[36px] p-4 sm:p-6 md:p-7 shadow-xl border border-white/80 relative z-10">
          {/* Top Row: Left Info & Right Photo */}
          <div className="flex items-start justify-between gap-2.5 sm:gap-4 md:gap-6">
            {/* Sisi Kiri: Badge, Nama, Divisi, Jabatan, Masa Kerja, Jam & Tanggal */}
            <div className="flex-1 min-w-0 pr-1">
              {/* Company Badge */}
              <div className="inline-block bg-[#235b9e] text-white text-[10.5px] sm:text-[12px] font-black italic px-3 sm:px-4 py-1 sm:py-1.5 rounded-lg sm:rounded-xl shadow-xs tracking-tight">
                {userProfile.company || "PT BISA MEDIA GRUP"}
              </div>

              {/* Nama Karyawan */}
              <h2 className="text-[22px] sm:text-[28px] md:text-[32px] font-black italic text-slate-800 tracking-tight leading-none mt-2.5 sm:mt-3.5 truncate">
                {userProfile.name}
              </h2>

              {/* Divisi */}
              <p className="text-[11.5px] sm:text-[13px] md:text-[13.5px] text-slate-500 font-bold italic mt-1.5 sm:mt-2 leading-snug truncate">
                Divisi -  {userProfile.division === "IT" ? "Information Technology" : (userProfile.division || "Information Technology")}
              </p>

              {/* Staff / Jabatan */}
              <p className="text-[11.5px] sm:text-[13px] md:text-[13.5px] text-slate-400 font-medium italic mt-0.5 leading-snug truncate">
                {userProfile.position === "IT Programmer" || !userProfile.position
                  ? "Staff Information Technology"
                  : userProfile.position.toLowerCase().startsWith("staff")
                  ? userProfile.position
                  : `Staff ${userProfile.position}`}
              </p>

              {/* Masa Kerja / Kontrak */}
              <p className="text-[11px] sm:text-[12px] md:text-[12.5px] text-[#1b76c8] font-bold italic mt-1 sm:mt-1.5">
                50 Hari  |  PKWT 1
              </p>

              {/* Jam Realtime & Hari/Shift */}
              <div className="mt-3.5 sm:mt-4">
                <div className="flex items-baseline gap-1 sm:gap-1.5">
                  <span className="font-time font-black italic text-slate-900 text-[28px] sm:text-[36px] md:text-[42px] tracking-tight leading-none drop-shadow-2xs">
                    {realtimeClock ? realtimeClock.replace(/:/g, ".") : "08.00"}
                  </span>
                  <span className="font-time text-[10.5px] sm:text-[12px] font-black italic text-slate-500 uppercase tracking-wider ml-0.5">
                    WIB
                  </span>
                </div>
                <p className="text-[11.5px] sm:text-[12.5px] text-slate-400 font-medium italic mt-1 sm:mt-1.5 truncate">
                  {todayCardDate} • {shift}
                </p>
              </div>
            </div>

            {/* Sisi Kanan: Foto Pasfoto, Slogan, Jam Kerja & Total Durasi */}
            <div className="w-[96px] sm:w-[124px] md:w-[136px] flex flex-col items-center shrink-0">
              {/* Pasfoto Profil Portrait */}
              <button
                type="button"
                onClick={() => setIsPreviewAvatarOpen(true)}
                title="Lihat Foto Profil"
                aria-label="Lihat Foto Profil"
                className="w-[94px] sm:w-[118px] md:w-[130px] h-[122px] sm:h-[150px] md:h-[165px] rounded-[18px] sm:rounded-[22px] overflow-hidden border-2 border-[#5493d4]/40 shadow-sm cursor-pointer active:scale-95 transition-transform group bg-slate-100 relative"
              >
                <img
                  src={userProfile.avatarUrl || "/pasfoto-karyawan.jpg"}
                  alt={userProfile.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </button>

              {/* Slogan */}
              <p className="text-[10px] sm:text-[11px] md:text-[12px] font-bold italic text-[#1b76c8] mt-1.5 sm:mt-2 text-center tracking-tight">
                #WorkCanBeFun.
              </p>

              {/* Jam Kerja Kantor */}
              <p className="font-time font-black italic text-slate-900 text-[13.5px] sm:text-[16px] md:text-[16.5px] text-center mt-0.5 sm:mt-1 leading-tight tracking-tight">
                08.00 - 17.00
              </p>

              {/* Durasi Kerja Hari Ini */}
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 text-slate-700 font-bold italic text-[10.5px] sm:text-[12px] mt-0.5 sm:mt-1 whitespace-nowrap">
                <Clock size={13} className="text-[#1b76c8] shrink-0" strokeWidth={2.6} />
                <span className="font-time font-extrabold">{totalWorkHoursToday}</span>
              </div>
            </div>
          </div>

          {/* Divider Line Horizontal */}
          <div className="w-full h-px bg-slate-300/80 my-3.5 sm:my-4" />

          {/* Two Boxes: Clock In & Clock Out */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4">
            {/* Clock In Button */}
            <button
              type="button"
              onClick={() => router.push("/absensi/check-in")}
              className="bg-emerald-50/70 hover:bg-emerald-100/80 border border-emerald-200/90 hover:border-emerald-300 rounded-xl sm:rounded-2xl py-2.5 sm:py-3.5 px-2.5 sm:px-3.5 text-center shadow-2xs hover:shadow-xs active:scale-[0.97] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 text-emerald-600 transition-colors">
                <LogIn size={15} className="text-emerald-600 shrink-0" strokeWidth={2.6} />
                <span className="text-[11px] sm:text-[12px] md:text-[13px] font-black text-emerald-700">
                  Clock In
                </span>
              </div>
              <p className="font-time text-[18px] sm:text-[21px] md:text-[23px] font-black text-slate-900 tracking-wider mt-0.5 sm:mt-1 group-hover:text-emerald-950 transition-colors">
                {checkInTime}
              </p>
            </button>

            {/* Clock Out Button */}
            <button
              type="button"
              onClick={() => router.push("/absensi/check-in?type=out")}
              className="bg-rose-50/70 hover:bg-rose-100/80 border border-rose-200/90 hover:border-rose-300 rounded-xl sm:rounded-2xl py-2.5 sm:py-3.5 px-2.5 sm:px-3.5 text-center shadow-2xs hover:shadow-xs active:scale-[0.97] transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-center gap-1 sm:gap-1.5 text-rose-500 transition-colors">
                <LogOut size={15} className="text-rose-500 shrink-0" strokeWidth={2.6} />
                <span className="text-[11px] sm:text-[12px] md:text-[13px] font-black text-rose-700">
                  Clock Out
                </span>
              </div>
              <p className="font-time text-[18px] sm:text-[21px] md:text-[23px] font-black text-slate-900 tracking-wider mt-0.5 sm:mt-1 group-hover:text-rose-950 transition-colors">
                {checkOutTime}
              </p>
            </button>
          </div>

          {/* Full-width Istirahat Button (Kuning/Amber) */}
          <button
            type="button"
            onClick={handleIstirahatClick}
            className={`w-full mt-2.5 sm:mt-3 rounded-xl sm:rounded-2xl py-2.5 sm:py-3 px-3 sm:px-4 text-center border transition-all active:scale-[0.99] flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer shadow-2xs ${
              breakStartTime && !breakEndTime
                ? "bg-amber-100/90 border-amber-300 hover:bg-amber-200/80 text-amber-900 shadow-xs"
                : breakStartTime && breakEndTime
                ? "bg-amber-50/70 border-amber-200/90 hover:bg-amber-100/80 text-amber-800"
                : "bg-amber-50/50 border-amber-200/80 hover:bg-amber-100/60 text-amber-800"
            }`}
          >
            <Coffee
              size={15}
              strokeWidth={2.3}
              className={
                breakStartTime && !breakEndTime
                  ? "text-amber-700 shrink-0"
                  : "text-amber-600 shrink-0"
              }
            />
            <span className="font-time text-[12px] sm:text-[13px] md:text-[14px] font-black tracking-wide">
              {!breakStartTime
                ? "Istirahat"
                : !breakEndTime
                ? `Selesai Istirahat (${breakStartTime})`
                : `Istirahat (${breakStartTime} - ${breakEndTime})`}
            </span>
            {breakStartTime && !breakEndTime && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping ml-0.5 shrink-0" />
            )}
          </button>
        </div>
      </div>

      {/* ══════════════ RINGKASAN HEADER BAR ══════════════ */}
      <div className="px-4 sm:px-6 md:px-8 mt-3 sm:mt-4 mb-2.5 sm:mb-3">
        <div className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/90 shadow-2xs px-4 py-2.5 flex items-center justify-between">
          <span className="font-bold italic text-slate-800 text-[15px] sm:text-[16px]">
            Ringkasan
          </span>
          <button
            type="button"
            onClick={() => setIsMonthPickerOpen(true)}
            className="text-[11px] sm:text-[12px] font-semibold text-[#1e6cb6] border border-[#bcdbf5] bg-white hover:bg-blue-50/60 rounded-lg px-2.5 py-1 transition-all cursor-pointer shadow-2xs flex items-center gap-1 active:scale-95"
          >
            <span>{currentMonthYear}</span>
          </button>
        </div>
      </div>

      {/* ══════════════ 9 RINGKASAN CARDS (SESUAI GAMBAR) ══════════════ */}
      <div className="px-4 sm:px-6 md:px-8 mb-3 sm:mb-4">
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {/* 1. Hadir */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 sm:p-3.5 flex items-center gap-3 sm:gap-3.5 hover:border-blue-300 hover:shadow-xs transition-all group">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <UserCheck size={23} className="text-slate-800" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h4 className="text-[15px] sm:text-[16px] font-bold italic text-[#1f6db8] leading-tight">
                Hadir
              </h4>
              <p className="text-[11px] sm:text-[11.5px] text-slate-400 font-medium italic mt-0.5 whitespace-nowrap">
                4 Hari / 26 Hari
              </p>
              <p className="text-[10px] sm:text-[10.5px] text-[#1f6db8] font-bold italic mt-0.5 whitespace-nowrap flex items-center gap-1">
                <Clock size={11} className="shrink-0 text-[#1f6db8]" strokeWidth={2.6} />
                <span className="font-time font-bold">31 Jam 59 Menit</span>
              </p>
            </div>
          </div>

          {/* 2. Lembur */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 sm:p-3.5 flex items-center gap-3 sm:gap-3.5 hover:border-blue-300 hover:shadow-xs transition-all group">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <UserCheck size={23} className="text-slate-800" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h4 className="text-[15px] sm:text-[16px] font-bold italic text-[#1f6db8] leading-tight">
                Lembur
              </h4>
              <p className="text-[11px] sm:text-[11.5px] text-slate-400 font-medium italic mt-0.5 whitespace-nowrap">
                3 Hari
              </p>
              <p className="text-[10px] sm:text-[10.5px] text-[#1f6db8] font-bold italic mt-0.5 whitespace-nowrap flex items-center gap-1">
                <Clock size={11} className="shrink-0 text-[#1f6db8]" strokeWidth={2.6} />
                <span className="font-time font-bold">8 Jam 59 Menit</span>
              </p>
            </div>
          </div>

          {/* 3. Sakit */}
          <button
            type="button"
            onClick={() => setSelectedHistoryType("sakit")}
            className="w-full text-left bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 sm:p-3.5 flex items-center gap-3 sm:gap-3.5 hover:border-blue-300 hover:shadow-xs transition-all group cursor-pointer active:scale-[0.98]"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Stethoscope size={23} className="text-slate-800" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h4 className="text-[15px] sm:text-[16px] font-bold italic text-[#1f6db8] leading-tight">
                Sakit
              </h4>
              <p className="text-[11px] sm:text-[11.5px] text-slate-400 font-medium italic mt-0.5">
                {sakitCount} Hari
              </p>
            </div>
          </button>

          {/* 4. Ijin */}
          <button
            type="button"
            onClick={() => setSelectedHistoryType("izin")}
            className="w-full text-left bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 sm:p-3.5 flex items-center gap-3 sm:gap-3.5 hover:border-blue-300 hover:shadow-xs transition-all group cursor-pointer active:scale-[0.98]"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileSignature size={23} className="text-slate-800" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h4 className="text-[15px] sm:text-[16px] font-bold italic text-[#1f6db8] leading-tight">
                Ijin
              </h4>
              <p className="text-[11px] sm:text-[11.5px] text-slate-400 font-medium italic mt-0.5">
                {izinCount} Hari
              </p>
            </div>
          </button>

          {/* 5. Cuti */}
          <button
            type="button"
            onClick={() => setSelectedHistoryType("cuti")}
            className="w-full text-left bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 sm:p-3.5 flex items-center gap-3 sm:gap-3.5 hover:border-blue-300 hover:shadow-xs transition-all group cursor-pointer active:scale-[0.98]"
          >
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <AlarmClock size={23} className="text-slate-800" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h4 className="text-[15px] sm:text-[16px] font-bold italic text-[#1f6db8] leading-tight">
                Cuti
              </h4>
              <p className="text-[11px] sm:text-[11.5px] text-slate-400 font-medium italic mt-0.5">
                {cutiCount} Hari
              </p>
            </div>
          </button>

          {/* 6. Terlambat */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 sm:p-3.5 flex items-center gap-3 sm:gap-3.5 hover:border-blue-300 hover:shadow-xs transition-all group">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <History size={23} className="text-slate-800" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h4 className="text-[15px] sm:text-[16px] font-bold italic text-[#1f6db8] leading-tight">
                Terlambat
              </h4>
              <p className="font-time text-[11px] sm:text-[11.5px] text-rose-600 font-bold italic mt-0.5 whitespace-nowrap">
                - 15 Menit
              </p>
            </div>
          </div>

          {/* 7. Tidak Lengkap */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 sm:p-3.5 flex items-center gap-3 sm:gap-3.5 hover:border-blue-300 hover:shadow-xs transition-all group">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <UserX size={23} className="text-slate-800" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h4 className="text-[15px] sm:text-[16px] font-bold italic text-[#1f6db8] leading-tight">
                Tidak Lengkap
              </h4>
              <p className="text-[11px] sm:text-[11.5px] text-slate-400 font-medium italic mt-0.5">
                0 Hari
              </p>
            </div>
          </div>

          {/* 8. Tepat Waktu */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 sm:p-3.5 flex items-center gap-3 sm:gap-3.5 hover:border-blue-300 hover:shadow-xs transition-all group">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <AlarmClock size={23} className="text-slate-800" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <h4 className="text-[15px] sm:text-[16px] font-bold italic text-[#1f6db8] leading-tight">
                Tepat Waktu
              </h4>
              <p className="text-[11px] sm:text-[11.5px] text-slate-400 font-medium italic mt-0.5">
                4 Hari
              </p>
            </div>
          </div>

          {/* 9. Take Home Pay (Full Width) */}
          <div className="col-span-2 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3 sm:p-3.5 flex items-center gap-3 sm:gap-3.5 hover:border-blue-300 hover:shadow-xs transition-all group">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <div className="relative flex items-center justify-center">
                <svg
                  viewBox="0 0 24 24"
                  width="24"
                  height="24"
                  stroke="currentColor"
                  strokeWidth="2.1"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-slate-800"
                >
                  <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 13 15 13 15 22" />
                </svg>
                <span className="absolute -bottom-1 -right-1 text-[10.5px] font-black text-slate-900 bg-white leading-none">
                  $
                </span>
              </div>
            </div>
            <div className="min-w-0">
              <h4 className="text-[15px] sm:text-[16px] font-bold italic text-[#1f6db8] leading-tight">
                Take Home Pay
              </h4>
              <p className="text-[11.5px] sm:text-[12px] text-slate-400 font-medium italic mt-0.5">
                Rp. -
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════ REKAP ABSENSI ══════════════ */}
      <div className="px-4 sm:px-6 md:px-8">
        <h3 className="text-[13.5px] sm:text-[14.5px] font-bold text-slate-800 mb-2 px-1">
          Rekap Absensi
        </h3>

        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="divide-y divide-slate-100">
            {rekapItems.map((item, index) => (
              <button
                key={index}
                onClick={() => router.push(index === 0 ? "/absensi/today" : `/absensi/ATT-00${(index % 3) + 1}`)}
                className="w-full flex items-center justify-between px-3.5 sm:px-5 py-2.5 sm:py-3.5 text-left hover:bg-slate-50/80 active:bg-blue-50/40 transition-colors group cursor-pointer"
              >
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-[13.5px] sm:text-[14.5px] font-bold text-[#156bb8] italic group-hover:text-blue-700 transition-colors leading-tight truncate">
                    {item.day}
                  </p>
                  <p className="text-[11px] sm:text-[12px] text-slate-400 italic mt-0.5 truncate">
                    {item.shift}
                  </p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="font-time text-[13.5px] sm:text-[14.5px] font-black text-[#1e6cb6] tracking-wider">
                    {item.time}
                  </span>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════ PROFILE & SETTINGS MODAL ══════════════ */}
      <ProfileSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* ══════════════ AVATAR PHOTO PREVIEW MODAL ══════════════ */}
      {isPreviewAvatarOpen && (
        <div
          onClick={() => setIsPreviewAvatarOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-fade-in select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-[340px] rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col items-center p-6 text-center animate-scale-up relative"
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setIsPreviewAvatarOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              aria-label="Tutup"
            >
              <X size={16} />
            </button>

            {/* Photo Container */}
            <div className="w-48 h-48 sm:w-52 sm:h-52 rounded-full bg-slate-100 border-4 border-[#156bb8]/20 shadow-xl overflow-hidden flex items-center justify-center mt-2 mb-4">
              {userProfile.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg viewBox="0 0 64 64" fill="none" className="w-full h-full bg-slate-200">
                  <circle cx="32" cy="24" r="11" fill="#475569" />
                  <path
                    d="M14 56C14 45 22 41 32 41C42 41 50 45 50 56"
                    fill="#475569"
                  />
                </svg>
              )}
            </div>

            {/* User Info */}
            <div className="inline-block bg-[#156bb8]/10 text-[#156bb8] text-[11px] font-bold px-3 py-0.5 rounded-full mb-2">
              {userProfile.company || "PT BISA MEDIA GRUP"}
            </div>
            <h3 className="text-lg font-black text-slate-800 leading-tight">
              {userProfile.name}
            </h3>
            <p className="text-xs text-slate-500 font-semibold mt-1">
              Divisi : {userProfile.division} • {userProfile.position || "Staff"}
            </p>

            {/* Close Button */}
            <div className="w-full mt-5">
              <button
                type="button"
                onClick={() => setIsPreviewAvatarOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer active:scale-95"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ══════════════ MONTH & YEAR PICKER POPUP (JANUARI - DESEMBER) ══════════════ */}
      {isMonthPickerOpen && (
        <div
          onClick={() => setIsMonthPickerOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-[360px] rounded-[28px] shadow-2xl border border-slate-100 p-5 animate-scale-up relative"
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#156bb8] flex items-center justify-center">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="text-[15px] font-black text-slate-800 leading-tight">
                    Pilih Bulan & Tahun
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    Periode ringkasan absensi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMonthPickerOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                aria-label="Tutup"
              >
                <X size={16} />
              </button>
            </div>

            {/* Year Selector */}
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-2 my-4">
              <button
                type="button"
                onClick={() => setSelectedYear((prev) => prev - 1)}
                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all active:scale-95 cursor-pointer"
                aria-label="Tahun Sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[16px] font-black text-slate-800 tracking-wide">
                {selectedYear}
              </span>
              <button
                type="button"
                onClick={() => setSelectedYear((prev) => prev + 1)}
                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all active:scale-95 cursor-pointer"
                aria-label="Tahun Berikutnya"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* 12 Months Grid (Januari - Desember) */}
            <div className="grid grid-cols-3 gap-2">
              {ALL_MONTHS.map((monthName, idx) => {
                const isSelected = selectedMonth === idx;
                return (
                  <button
                    key={monthName}
                    type="button"
                    onClick={() => {
                      setSelectedMonth(idx);
                      setCurrentMonthYear(`${monthName} ${selectedYear}`);
                      setIsMonthPickerOpen(false);
                    }}
                    className={`py-2.5 px-2 rounded-xl text-[12px] font-bold text-center transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? "bg-[#156bb8] text-white shadow-md shadow-blue-500/30 scale-[1.02]"
                        : "bg-slate-50 hover:bg-blue-50/70 border border-slate-200/70 text-slate-700 hover:text-[#156bb8]"
                    }`}
                  >
                    {monthName}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ RIWAYAT SAKIT, IZIN, CUTI POPUP (SESUAI MOCKUP GAMBAR USER) ══════════════ */}
      {selectedHistoryType && (
        <div
          onClick={() => setSelectedHistoryType(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-[420px] rounded-[24px] sm:rounded-[28px] shadow-2xl border border-slate-100 p-5 sm:p-6 animate-scale-up relative max-h-[85vh] flex flex-col"
          >
            {/* Header: Riwayat [Tipe] & X Button */}
            <div className="flex items-center justify-between">
              <h3 className="text-[19px] sm:text-[21px] text-slate-800 tracking-tight">
                <span className="italic font-normal">Riwayat </span>
                <span className="italic font-black text-slate-900">
                  {selectedHistoryType === "sakit"
                    ? "Sakit"
                    : selectedHistoryType === "cuti"
                    ? "Cuti"
                    : "Ijin"}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => setSelectedHistoryType(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                aria-label="Tutup"
              >
                <X size={16} strokeWidth={2.2} />
              </button>
            </div>

            {/* Dashed Separator Line (Sesuai Gambar) */}
            <div className="border-b border-dashed border-slate-300 my-4" />

            {/* Body List Cards */}
            <div className="overflow-y-auto space-y-3 pr-1 max-h-[60vh]">
              {currentHistoryList.length === 0 ? (
                <div className="py-10 text-center text-slate-400 text-sm italic">
                  Belum ada riwayat{" "}
                  {selectedHistoryType === "sakit"
                    ? "sakit"
                    : selectedHistoryType === "cuti"
                    ? "cuti"
                    : "ijin"}
                </div>
              ) : (
                currentHistoryList.map((item) => {
                  const dateStr = formatItemDate(item);
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:border-blue-200 hover:shadow-xs transition-all"
                    >
                      {/* Left: Indicator Bar + Details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-1.5 h-10 bg-[#156bb8] rounded-full shrink-0" />
                        <div className="min-w-0">
                          <h4 className="text-[14.5px] sm:text-[15.5px] font-bold italic text-slate-900 leading-snug truncate">
                            {item.reason || item.keperluan || "Deskripsi"}
                          </h4>
                          <p className="text-[11.5px] sm:text-[12.5px] font-medium text-[#156bb8] mt-0.5">
                            {dateStr}
                          </p>
                        </div>
                      </div>

                      {/* Right: Documentation Square Box with Eye Icon */}
                      <button
                        type="button"
                        onClick={() => setPreviewDocModal(item)}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 hover:border-[#156bb8] flex items-center justify-center shrink-0 relative overflow-hidden group cursor-pointer transition-all shadow-2xs"
                        title="Lihat Dokumentasi"
                      >
                        {item.attachment ? (
                          item.attachmentType === "link" ? (
                            <div className="flex flex-col items-center justify-center text-[#156bb8]">
                              <FileText size={16} strokeWidth={2.2} />
                              <Eye size={12} strokeWidth={2.5} className="mt-0.5" />
                            </div>
                          ) : (
                            <>
                              <img
                                src={item.attachment}
                                alt="Dokumentasi"
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-slate-900/25 group-hover:bg-slate-900/40 flex items-center justify-center transition-colors">
                                <div className="w-6 h-6 rounded-full bg-white/90 shadow-xs flex items-center justify-center text-[#156bb8]">
                                  <Eye size={13} strokeWidth={2.5} />
                                </div>
                              </div>
                            </>
                          )
                        ) : (
                          <div className="flex items-center justify-center text-blue-400 group-hover:text-[#156bb8] transition-colors">
                            <Eye size={20} strokeWidth={2.2} />
                          </div>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MODAL PREVIEW DETAIL DOKUMENTASI ══════════════ */}
      {previewDocModal && (
        <div
          onClick={() => setPreviewDocModal(null)}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fade-in select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-[420px] rounded-[24px] sm:rounded-[28px] shadow-2xl border border-slate-100 p-5 sm:p-6 animate-scale-up relative max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-[17px] font-bold text-slate-800 leading-tight">
                  Dokumentasi Riwayat
                </h3>
                <p className="text-[12px] text-slate-400 font-medium">
                  {previewDocModal.type === "izin"
                    ? "Ijin"
                    : previewDocModal.type === "sakit"
                    ? "Sakit"
                    : "Cuti"}{" "}
                  • {formatItemDate(previewDocModal)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDocModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                aria-label="Tutup"
              >
                <X size={16} strokeWidth={2.2} />
              </button>
            </div>

            {/* Body */}
            <div className="py-4 overflow-y-auto space-y-3.5">
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Deskripsi / Alasan
                </span>
                <p className="text-[14px] font-bold text-slate-800 leading-snug">
                  {previewDocModal.reason || previewDocModal.keperluan || "-"}
                </p>
              </div>

              {/* Attachment Display */}
              {previewDocModal.attachment ? (
                previewDocModal.attachmentType === "link" ? (
                  <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-4 text-center space-y-2">
                    <FileText size={28} className="text-[#156bb8] mx-auto" />
                    <p className="text-xs text-slate-600 font-medium">
                      Lampiran berupa tautan / link dokumen
                    </p>
                    <a
                      href={previewDocModal.attachment}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#156bb8] hover:bg-[#125391] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                    >
                      <span>Buka Tautan Dokumen</span>
                      <ExternalLink size={13} />
                    </a>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="rounded-2xl overflow-hidden border border-slate-200/90 shadow-2xs bg-slate-900/5 max-h-[320px] flex items-center justify-center">
                      <img
                        src={previewDocModal.attachment}
                        alt="Dokumentasi Lampiran"
                        className="w-full h-auto max-h-[320px] object-contain"
                      />
                    </div>
                    <div className="flex justify-end">
                      <a
                        href={previewDocModal.attachment}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-[#156bb8] hover:underline flex items-center gap-1"
                      >
                        <span>Buka Gambar Penuh</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                )
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs italic bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  Tidak ada dokumen lampiran
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewDocModal(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer active:scale-95"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
