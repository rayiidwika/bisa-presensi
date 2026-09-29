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
} from "lucide-react";

const TASIK_LAT = -7.3274;
const TASIK_LNG = 108.2207;

export default function AbsensiDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const rec = mockAttendanceRecords.find((r) => r.id === id);
  if (!rec) notFound();

  // Mode tab: "in" (Clock In) atau "out" (Clock Out)
  const [activeTab, setActiveTab] = useState<"in" | "out">("in");

  // Local storage attendance today data
  const [savedData, setSavedData] = useState<{
    checkIn?: string;
    checkOut?: string;
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
  } | null>(null);

  const [previewPhotoModal, setPreviewPhotoModal] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("bisa_attendance_today");
      if (stored) {
        setSavedData(JSON.parse(stored));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Sinkronisasi data dari localStorage dan record
  const checkInTime =
    (typeof window !== "undefined" && localStorage.getItem("bisa_attendance_checkin_time")) ||
    savedData?.checkIn ||
    rec.checkIn ||
    "07:59";

  const checkOutTime =
    (typeof window !== "undefined" && localStorage.getItem("bisa_attendance_checkout_time")) ||
    savedData?.checkOut ||
    rec.checkOut ||
    "17:02";

  const checkInLocation =
    (typeof window !== "undefined" && localStorage.getItem("bisa_attendance_checkin_location")) ||
    savedData?.checkInLocation ||
    savedData?.locationAddress ||
    rec.locationAddress ||
    "Jl. HZ. Mustofa No. 45, Kota Tasikmalaya";

  const checkOutLocation =
    (typeof window !== "undefined" && localStorage.getItem("bisa_attendance_checkout_location")) ||
    savedData?.checkOutLocation ||
    savedData?.locationAddress ||
    rec.locationAddress ||
    "Jl. HZ. Mustofa No. 45, Kota Tasikmalaya";

  // Koordinat lokasi
  const inCoords = savedData?.checkInCoords || savedData?.coords || {
    lat: rec.latitude || TASIK_LAT,
    lng: rec.longitude || TASIK_LNG,
  };
  const outCoords = savedData?.checkOutCoords || savedData?.coords || {
    lat: rec.latitude || TASIK_LAT,
    lng: rec.longitude || TASIK_LNG,
  };

  const activeCoords = activeTab === "in" ? inCoords : outCoords;
  const activeLocation = activeTab === "in" ? checkInLocation : checkOutLocation;
  const activeTime = activeTab === "in" ? checkInTime : checkOutTime;

  // Foto Dokumentasi: diambil dari jepretan kamera saat Clock In vs Clock Out
  const inPhoto =
    (typeof window !== "undefined" && localStorage.getItem("bisa_attendance_checkin_photo")) ||
    savedData?.checkInPhoto ||
    savedData?.photo ||
    "/default-face-scan.jpg";

  const outPhoto =
    (typeof window !== "undefined" && localStorage.getItem("bisa_attendance_checkout_photo")) ||
    savedData?.checkOutPhoto ||
    "/default-checkout-scan.jpg";

  const activePhoto = activeTab === "in" ? inPhoto : outPhoto;

  // Catatan kehadiran: Clock In & Clock Out murni masing-masing
  const checkInNotes =
    (typeof window !== "undefined" && localStorage.getItem("bisa_attendance_checkin_notes")) ||
    savedData?.checkInNotes ||
    rec.checkInNotes ||
    "";

  const checkOutNotes =
    (typeof window !== "undefined" && localStorage.getItem("bisa_attendance_checkout_notes")) ||
    savedData?.checkOutNotes ||
    rec.checkOutNotes ||
    "";

  const sc = attStatusColors(rec.status);

  return (
    <div className="min-h-screen bg-[#ddeef8] pb-10">
      {/* ══════════════ BLUE HEADER ══════════════ */}
      <div className="bg-gradient-to-b from-[#3b9edd] to-[#1a6fb5] relative overflow-hidden">
        {/* Watermark circle */}
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />

        <div className="relative px-4 pt-5 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              aria-label="Kembali"
              className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 flex items-center justify-center transition-all"
            >
              <svg
                width="15"
                height="15"
                fill="none"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <p className="text-white text-sm opacity-90 font-medium">
              Hallo {currentEmployee.name}
            </p>
          </div>

          <h1 className="text-white font-bold text-xl mb-1">
            Detail Check In & Out
          </h1>

          {/* Employee row */}
          <div className="flex items-center gap-3 mt-3">
            <div className="w-12 h-12 rounded-xl bg-[#b8d9f0] border-2 border-white overflow-hidden shadow-sm shrink-0">
              <img
                src="/default-face-scan.jpg"
                alt={currentEmployee.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-white font-bold">{currentEmployee.name}</p>
              <p className="text-blue-100 text-xs">{currentEmployee.division}</p>
            </div>
          </div>
        </div>

        {/* Curved bottom edge */}
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
                    value: rec.dayLabel,
                    color: "text-[#3b9edd]",
                  },
                  {
                    icon: <LogIn size={14} />,
                    label: "Jam Masuk",
                    value: `${checkInTime} WIB`,
                    color: "text-emerald-500",
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
                    value: rec.dayLabel,
                    color: "text-[#3b9edd]",
                  },
                  {
                    icon: <LogOut size={14} />,
                    label: "Jam Keluar",
                    value: `${checkOutTime} WIB`,
                    color: "text-rose-500",
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

