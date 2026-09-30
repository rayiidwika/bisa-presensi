"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import { mockAttendanceRecords, currentEmployee } from "@/lib/mockData";
import { attStatusColors, attStatusLabel } from "@/lib/utils";
import {
  MapPin,
  Clock,
  Calendar,
  LogIn,
  LogOut,
  CheckCircle2,
  Maximize2,
  X,
  Navigation,
  ShieldCheck,
  MessageSquare,
  ChevronLeft,
  Coffee,
} from "lucide-react";

const TASIK_LAT = -7.3274;
const TASIK_LNG = 108.2207;

export default function AbsensiDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const rec = mockAttendanceRecords.find((r) => r.id === id) || (id === "today" ? mockAttendanceRecords[0] : null);
  if (!rec) notFound();

  // Mode tab: "in" (Clock In) atau "out" (Clock Out)
  const [activeTab, setActiveTab] = useState<"in" | "out">("in");

  // Local storage attendance today data
  const [savedData, setSavedData] = useState<{
    checkIn?: string;
    checkOut?: string;
    breakStart?: string;
    breakEnd?: string;
    break?: string;
    photo?: string;
    checkInPhoto?: string;
    checkOutPhoto?: string;
    locationAddress?: string;
    checkInLocation?: string;
    checkOutLocation?: string;
    coords?: { lat: number; lng: number };
    checkInCoords?: { lat: number; lng: number };
    checkOutCoords?: { lat: number; lng: number };
    checkInNotes?: string;
    checkOutNotes?: string;
    notes?: string;
    dateStr?: string;
  } | null>(null);

  const [previewPhotoModal, setPreviewPhotoModal] = useState<string | null>(null);
  const [todayDateDetail, setTodayDateDetail] = useState<string>("Rab, 30 September 2026");

  useEffect(() => {
    const now = new Date();
    const daysShort = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
    const monthsFull = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    setTodayDateDetail(
      `${daysShort[now.getDay()]}, ${now.getDate()} ${monthsFull[now.getMonth()]} ${now.getFullYear()}`
    );

    try {
      const stored = localStorage.getItem("bisa_attendance_today");
      if (stored) {
        setSavedData(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const isTodayRecord = id === "today" || id === "ATT-001" || rec.id === "today" || rec.id === "ATT-001";

  // Sinkronisasi data dari record (atau localStorage jika id === "today")
  const checkInTime = isTodayRecord
    ? ((typeof window !== "undefined" && localStorage.getItem("bisa_attendance_checkin_time")) ||
       savedData?.checkIn ||
       rec.checkIn ||
       "07:59")
    : (rec.checkIn || "07:59");

  const checkOutTime = isTodayRecord
    ? ((typeof window !== "undefined" && localStorage.getItem("bisa_attendance_checkout_time")) ||
       savedData?.checkOut ||
       rec.checkOut ||
       "17:02")
    : (rec.checkOut || "17:02");

  // Data Jam Istirahat (Mulai s.d Selesai)
  const breakStart = isTodayRecord
    ? (savedData?.breakStart ||
       savedData?.break ||
       (typeof window !== "undefined" && localStorage.getItem("bisa_attendance_break_start")) ||
       "12:00")
    : ((rec as any).breakStart || "12:00");

  const breakEnd = isTodayRecord
    ? (savedData?.breakEnd ||
       (typeof window !== "undefined" && localStorage.getItem("bisa_attendance_break_end")) ||
       "13:00")
    : ((rec as any).breakEnd || "13:00");

  const breakTimeDisplay = `${breakStart} - ${breakEnd}`;

  const checkInLocation = isTodayRecord
    ? ((typeof window !== "undefined" && localStorage.getItem("bisa_attendance_checkin_location")) ||
       savedData?.checkInLocation ||
       savedData?.locationAddress ||
       rec.locationAddress ||
       "Jl. HZ. Mustofa No. 45, Kota Tasikmalaya")
    : (rec.locationAddress || "Jl. HZ. Mustofa No. 45, Kota Tasikmalaya");

  const checkOutLocation = isTodayRecord
    ? ((typeof window !== "undefined" && localStorage.getItem("bisa_attendance_checkout_location")) ||
       savedData?.checkOutLocation ||
       savedData?.locationAddress ||
       rec.locationAddress ||
       "Jl. HZ. Mustofa No. 45, Kota Tasikmalaya")
    : (rec.locationAddress || "Jl. HZ. Mustofa No. 45, Kota Tasikmalaya");

  // Koordinat lokasi
  const inCoords = isTodayRecord
    ? (savedData?.checkInCoords || savedData?.coords || {
        lat: rec.latitude || TASIK_LAT,
        lng: rec.longitude || TASIK_LNG,
      })
    : {
        lat: rec.latitude || TASIK_LAT,
        lng: rec.longitude || TASIK_LNG,
      };

  const outCoords = isTodayRecord
    ? (savedData?.checkOutCoords || savedData?.coords || {
        lat: rec.latitude || TASIK_LAT,
        lng: rec.longitude || TASIK_LNG,
      })
    : {
        lat: rec.latitude || TASIK_LAT,
        lng: rec.longitude || TASIK_LNG,
      };

  const activeCoords = activeTab === "in" ? inCoords : outCoords;
  const activeLocation = activeTab === "in" ? checkInLocation : checkOutLocation;
  const activeTime = activeTab === "in" ? checkInTime : checkOutTime;

  // Foto Dokumentasi: diambil dari jepretan kamera saat Clock In vs Clock Out
  const inPhoto = isTodayRecord
    ? ((typeof window !== "undefined" && localStorage.getItem("bisa_attendance_checkin_photo")) ||
       savedData?.checkInPhoto ||
       savedData?.photo ||
       "/default-face-scan.jpg")
    : (rec.selfieUrl || "/default-face-scan.jpg");

  const outPhoto = isTodayRecord
    ? ((typeof window !== "undefined" && localStorage.getItem("bisa_attendance_checkout_photo")) ||
       savedData?.checkOutPhoto ||
       "/default-checkout-scan.jpg")
    : "/default-checkout-scan.jpg";

  const activePhoto = activeTab === "in" ? inPhoto : outPhoto;

  // Catatan kehadiran: Clock In & Clock Out murni masing-masing
  const checkInNotes = isTodayRecord
    ? ((typeof window !== "undefined" && localStorage.getItem("bisa_attendance_checkin_notes")) ||
       savedData?.checkInNotes ||
       rec.checkInNotes ||
       "")
    : (rec.checkInNotes || "");

  const checkOutNotes = isTodayRecord
    ? ((typeof window !== "undefined" && localStorage.getItem("bisa_attendance_checkout_notes")) ||
       savedData?.checkOutNotes ||
       rec.checkOutNotes ||
       "")
    : (rec.checkOutNotes || "");

  const sc = attStatusColors(rec.status);

  // Perhitungan Total Jam Kerja:
  // - Jam masuk kantor: 08:00 (jika absen lebih awal, mulai dihitung 08:00; jika terlambat misal 08:01, dihitung 08:01)
  // - Istirahat: 12:00 - 13:00 (1 jam tidak dihitung kerja)
  // - Jam pulang kantor standar: 17:00 (jika clock out lebih dari jam 17:00, tetap dihitung maksimal sampai jam 17:00)
  // - Contoh: Absen masuk 08:01, pulang 17:00 -> Total jam kerja 07.59
  const calculateTotalWorkHours = (inStr?: string, outStr?: string): string => {
    if (!inStr || !outStr) return "08.00";

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
    const outMin = parseToMinutes(outStr);

    if (inMin === null || outMin === null) return "08.00";

    // Maksimal clock out dihitung sampai jam 17:00 (1020 menit)
    const cappedOut = Math.min(outMin, 1020);

    // 1. Sesi Pagi (08:00 = 480 s.d 12:00 = 720)
    // Jika masuk lebih awal dari 08:00 (misal 07:59), mulai dihitung dari 08:00
    // Jika masuk terlambat (misal 08:01), mulai dihitung dari jam masuknya
    const morningStart = Math.max(480, inMin);
    const morningEnd = Math.min(720, cappedOut);
    const morningMinutes = Math.max(0, morningEnd - morningStart);

    // 2. Sesi Siang (13:00 = 780 s.d 17:00 = 1020)
    // Jika karyawan sudah masuk sejak pagi/sebelum siang, siang dimulai jam 13:00 (780)
    const afternoonStart = inMin <= 780 ? 780 : Math.max(780, inMin);
    const afternoonEnd = Math.min(1020, cappedOut);
    const afternoonMinutes = Math.max(0, afternoonEnd - afternoonStart);

    const totalMinutes = morningMinutes + afternoonMinutes;
    if (totalMinutes <= 0) return "00.00";

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;

    const formattedHours = String(hours).padStart(2, "0");
    const formattedMins = String(mins).padStart(2, "0");

    return `${formattedHours}.${formattedMins}`;
  };

  const totalWorkHours = calculateTotalWorkHours(checkInTime, checkOutTime);

  return (
    <div className="min-h-screen bg-[#ddeef8] pb-10">
      {/* ══════════════ BLUE GRADIENT HEADER WITH WATERMARK ══════════════ */}
      <div className="bg-gradient-to-b from-[#2a8ee4] via-[#1f7cd0] to-[#156bb8] relative overflow-hidden">
        {/* Watermark Logo Bisa Media Putih Blur di ujung kanan */}
        <div className="absolute -right-6 -top-4 w-60 h-60 pointer-events-none opacity-25 filter blur-[0.8px] rotate-[-6deg] select-none">
          <img
            src="/bisa-media-white.png"
            alt="Watermark BISA MEDIA"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="relative px-4 pt-5 pb-6">
          {/* Top bar (Tombol Kembali & Detail Check In & Out) */}
          <div className="relative z-10 mb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                aria-label="Kembali"
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 flex items-center justify-center text-white transition-all backdrop-blur-xs cursor-pointer shrink-0"
              >
                <ChevronLeft size={22} />
              </button>
              <h1 className="text-white font-extrabold text-[17.5px] sm:text-[18.5px] tracking-wide leading-tight truncate">
                Detail Check In & Out
              </h1>
            </div>
          </div>

          {/* Employee Info Card Header */}
          <div className="flex items-center gap-3.5 mt-3 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-[#d8e5ee] border-2 border-white overflow-hidden shadow-sm shrink-0 flex items-center justify-center">
              <svg viewBox="0 0 64 64" fill="none" className="w-full h-full">
                <circle cx="32" cy="24" r="11" fill="#475569" />
                <path
                  d="M14 56C14 45 22 41 32 41C42 41 50 45 50 56"
                  fill="#475569"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-black text-[18px] leading-tight truncate tracking-tight">
                {currentEmployee.name}
              </p>
              <p className="text-blue-100 text-[12.5px] font-medium mt-0.5 truncate">
                Divisi : {currentEmployee.division}
              </p>
              {/* Total Jam Kerja & Istirahat */}
              <div className="mt-1.5 flex flex-col items-start gap-1">
                <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/25 shadow-2xs">
                  <Clock size={12} className="text-emerald-300" strokeWidth={2.5} />
                  <span className="text-[11px] text-white/95 font-medium whitespace-nowrap">
                    Total Jam Kerja: <strong className="font-bold text-white">{totalWorkHours}</strong>
                  </span>
                </div>

                <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/25 shadow-2xs">
                  <Coffee size={12} className="text-amber-300" strokeWidth={2.5} />
                  <span className="text-[11px] text-white/95 font-medium whitespace-nowrap">
                    Istirahat: <strong className="font-bold text-white">{breakTimeDisplay}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Curved bottom edge (Ditimpa dengan yang putih/terang seperti sebelumnya) */}
        <div className="h-5 bg-[#ddeef8] rounded-t-3xl" />
      </div>

      <div className="px-4 -mt-1 space-y-3 animate-fade-in">
        {/* ══════════════ TAB SWITCHER (Clock In vs Clock Out) ══════════════ */}
        <div className="bg-white/80 backdrop-blur-md p-1 rounded-2xl flex items-center gap-1 border border-white/60 shadow-xs">
          <button
            onClick={() => setActiveTab("in")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "in"
                ? "bg-[#156bb8] text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <LogIn
              size={15}
              strokeWidth={2.5}
              className={activeTab === "in" ? "text-emerald-300" : "text-emerald-600"}
            />
            <div className="text-left">
              <p className="leading-tight">Clock In</p>
              <p className={`text-[10px] ${activeTab === "in" ? "text-blue-100" : "text-slate-400"} font-normal`}>
                {checkInTime} WIB
              </p>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("out")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "out"
                ? "bg-[#156bb8] text-white shadow-md shadow-blue-500/20"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <LogOut
              size={15}
              strokeWidth={2.5}
              className={activeTab === "out" ? "text-rose-300" : "text-rose-600"}
            />
            <div className="text-left">
              <p className="leading-tight">Clock Out</p>
              <p className={`text-[10px] ${activeTab === "out" ? "text-blue-100" : "text-slate-400"} font-normal`}>
                {checkOutTime} WIB
              </p>
            </div>
          </button>
        </div>

        {/* Label Dokumentasi */}
        <div className="flex items-center justify-between px-1">
          <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#156bb8]" />
            Dokumentasi {activeTab === "in" ? "Clock In (Masuk)" : "Clock Out (Pulang)"}
          </p>
          <span className="text-[10px] font-semibold text-[#156bb8] bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
            {activeTab === "in" ? "Diambil saat Clock In" : "Diambil saat Clock Out"}
          </span>
        </div>

        {/* ══════════════ 2 KOLOM SEJAJAR: MAPS & FOTO SCAN MUKA ══════════════ */}
        <div className="grid grid-cols-2 gap-3 items-stretch">
          {/* 1. KOTAK KIRI: REALTIME MAPS SESUAI CLOCK IN / OUT */}
          <div className="relative h-40 rounded-2xl bg-white overflow-hidden border border-[#c8d8e8] shadow-sm flex flex-col justify-between p-2 group">
            {/* Live OpenStreetMap iframe */}
            <div className="absolute inset-0 bg-[#e8f0f7] overflow-hidden">
              <iframe
                title={`Peta Lokasi ${activeTab === "in" ? "Clock In" : "Clock Out"}`}
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${activeCoords.lng - 0.0025}%2C${activeCoords.lat - 0.0018}%2C${activeCoords.lng + 0.0025}%2C${activeCoords.lat + 0.0018}&layer=mapnik`}
                className="w-full h-full border-0 pointer-events-none filter saturate-125"
                loading="lazy"
              />

              {/* Geofence 100m Aura Circle */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-24 h-24 rounded-full border-2 border-dashed border-blue-500/80 bg-blue-500/10 flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border border-blue-400/40 bg-blue-400/15" />
                </div>
              </div>

              {/* Pin Marker Merah */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full flex flex-col items-center pointer-events-none z-10">
                <div className="w-6 h-6 rounded-full bg-red-600 border-2 border-white shadow-md flex items-center justify-center text-white">
                  <MapPin size={13} strokeWidth={2.5} className="fill-white" />
                </div>
                <div className="w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-transparent border-t-red-600 -mt-0.5" />
              </div>
            </div>

            {/* Header pill badge di dalam map */}
            <div className="relative z-10 flex items-center justify-between">
              <span className="bg-black/70 backdrop-blur-xs text-white text-[8px] font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                <Navigation size={9} className={activeTab === "in" ? "text-emerald-400" : "text-rose-400"} />
                <span>
                  {activeTab === "in" ? "Lokasi In" : "Lokasi Out"}
                </span>
              </span>
              <span className="bg-white/95 text-[#156bb8] text-[8px] font-bold px-1.5 py-0.5 rounded shadow-2xs">
                GPS 15m
              </span>
            </div>

            {/* Bottom address label */}
            <div className="relative z-10 mt-auto bg-white/95 backdrop-blur-xs px-2 py-1 rounded-lg border border-slate-200 shadow-xs">
              <p className="text-[7.5px] text-slate-500 leading-tight">
                Titik {activeTab === "in" ? "Clock In" : "Clock Out"}:
              </p>
              <p className="text-[9px] font-bold text-slate-800 truncate leading-tight mt-0.5">
                {activeLocation.split(",")[0] || "Jl. HZ. Mustofa"}
              </p>
            </div>
          </div>

          {/* 2. KOTAK KANAN: FOTO HASIL SCAN MUKA REALTIME DARI CLOCK IN / OUT */}
          <div
            onClick={() => setPreviewPhotoModal(activePhoto)}
            className="relative h-40 rounded-2xl bg-slate-900 overflow-hidden border border-[#c8d8e8] shadow-sm cursor-pointer group"
          >
            {/* Foto Hasil Scan */}
            <img
              src={activePhoto}
              alt={`Dokumentasi ${activeTab === "in" ? "Clock In" : "Clock Out"}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />

            {/* Top Badge: Status Scan Biometrik */}
            <div className="absolute top-2 left-2 z-10">
              <span
                className={`text-[8.5px] font-bold px-2 py-0.5 rounded-md shadow-sm backdrop-blur-xs flex items-center gap-1 text-white ${
                  activeTab === "in"
                    ? "bg-emerald-600/95"
                    : "bg-rose-600/95"
                }`}
              >
                <ShieldCheck size={10} className="text-white" />
                <span>
                  {activeTab === "in" ? "Dokumentasi In ✓" : "Dokumentasi Out ✓"}
                </span>
              </span>
            </div>

            {/* Top Right Zoom Icon */}
            <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-md bg-black/50 text-white flex items-center justify-center opacity-85 group-hover:opacity-100 transition-opacity">
              <Maximize2 size={11} />
            </div>

            {/* Bottom Info: Waktu Jepret Foto Dokumentasi */}
            <div className="absolute bottom-2 left-2 right-2 z-10 text-white">
              <p className="text-[7.5px] text-white/80 leading-tight">
                Waktu Jepret {activeTab === "in" ? "Clock In" : "Clock Out"}
              </p>
              <p className="text-[9.5px] font-bold text-white truncate leading-tight mt-0.5">
                Pukul {activeTime} WIB
              </p>
            </div>
          </div>
        </div>

        {/* ══════════════ INFORMASI KEHADIRAN CARD ══════════════ */}
        <div className="bg-white rounded-2xl border border-[#c8e0f0] shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-xs font-bold text-[#1a3c5e]">
              Informasi Kehadiran ({activeTab === "in" ? "Clock In" : "Clock Out"})
            </p>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}
            >
              {attStatusLabel(rec.status)}
            </span>
          </div>

          <div className="divide-y divide-slate-50">
            {(activeTab === "in"
              ? [
                  {
                    icon: <Clock size={14} />,
                    label: "Shift",
                    value: `${rec.shift} (${currentEmployee.shift.startTime} – ${currentEmployee.shift.endTime})`,
                    color: "text-[#3b9edd]",
                  },
                  {
                    icon: <Calendar size={14} />,
                    label: "Tanggal",
                    value: isTodayRecord ? (savedData?.dateStr || todayDateDetail) : rec.dayLabel,
                    color: "text-[#3b9edd]",
                  },
                  {
                    icon: <LogIn size={14} />,
                    label: "Jam Masuk",
                    value: `${checkInTime} WIB`,
                    color: "text-emerald-500",
                  },
                  {
                    icon: <Coffee size={14} />,
                    label: "Jam Istirahat",
                    value: `${breakTimeDisplay} WIB`,
                    color: "text-amber-500",
                  },
                  {
                    icon: <MapPin size={14} />,
                    label: "Lokasi Clock In",
                    value: checkInLocation,
                    color: "text-emerald-500",
                  },
                  {
                    icon: <MessageSquare size={14} />,
                    label: "Catatan Clock In",
                    value: checkInNotes ? `"${checkInNotes}"` : "-",
                    color: "text-emerald-500",
                  },
                  {
                    icon: <ShieldCheck size={14} />,
                    label: "Status Dokumentasi",
                    value: "Foto Wajah & Lokasi GPS Terverifikasi ✓",
                    color: "text-[#156bb8]",
                  },
                ]
              : [
                  {
                    icon: <Clock size={14} />,
                    label: "Shift",
                    value: `${rec.shift} (${currentEmployee.shift.startTime} – ${currentEmployee.shift.endTime})`,
                    color: "text-[#3b9edd]",
                  },
                  {
                    icon: <Calendar size={14} />,
                    label: "Tanggal",
                    value: isTodayRecord ? (savedData?.dateStr || todayDateDetail) : rec.dayLabel,
                    color: "text-[#3b9edd]",
                  },
                  {
                    icon: <LogOut size={14} />,
                    label: "Jam Keluar",
                    value: `${checkOutTime} WIB`,
                    color: "text-rose-500",
                  },
                  {
                    icon: <Coffee size={14} />,
                    label: "Jam Istirahat",
                    value: `${breakTimeDisplay} WIB`,
                    color: "text-amber-500",
                  },
                  {
                    icon: <MapPin size={14} />,
                    label: "Lokasi Clock Out",
                    value: checkOutLocation,
                    color: "text-rose-500",
                  },
                  {
                    icon: <MessageSquare size={14} />,
                    label: "Catatan Clock Out",
                    value: checkOutNotes ? `"${checkOutNotes}"` : "-",
                    color: "text-rose-500",
                  },
                  {
                    icon: <ShieldCheck size={14} />,
                    label: "Status Dokumentasi",
                    value: "Foto Wajah & Lokasi GPS Terverifikasi ✓",
                    color: "text-[#156bb8]",
                  },
                ]
            ).map((item, i) => (
              <div key={i} className="flex items-start gap-3 px-4 py-3">
                <span className={`${item.color} mt-0.5 shrink-0`}>
                  {item.icon}
                </span>
                <p className="text-[11px] text-slate-400 w-28 shrink-0">
                  {item.label}
                </p>
                <p className="text-xs font-semibold text-[#1a3c5e] flex-1">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal Preview Foto Scan Muka */}
      {previewPhotoModal && (
        <div
          onClick={() => setPreviewPhotoModal(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl overflow-hidden max-w-sm w-full shadow-2xl relative"
          >
            <div className="relative aspect-[3/4] bg-slate-900">
              <img
                src={previewPhotoModal}
                alt="Scan Wajah Penuh"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setPreviewPhotoModal(null)}
                aria-label="Tutup"
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 text-center">
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
                <CheckCircle2 size={14} />
                <span>Verifikasi Wajah Biometrik Sukses</span>
              </div>
              <p className="text-xs font-semibold text-slate-800 mt-2">
                {currentEmployee.name} • {currentEmployee.nip}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {activeTab === "in" ? "Clock In" : "Clock Out"} - {activeLocation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

