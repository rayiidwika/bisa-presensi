"use client";

import React, { useState, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  Clock,
  Calendar,
  Check,
  RotateCcw,
} from "lucide-react";

interface IzinScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
  }) => void;
  initialStartDate?: string;
  initialEndDate?: string;
  initialStartTime?: string;
  initialEndTime?: string;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

const parseTimeString = (tStr?: string) => {
  if (!tStr || tStr === "--:--") return null;
  const match = tStr.match(/(\d{1,2})[:.](\d{2})/);
  if (!match) return null;
  let h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h > 23) h = 23;
  if (h < 0) h = 0;
  return { hour: h, minute: m };
};

const to24HourStr = (hour: number, minute: number) => {
  return `${pad2(hour)}:${pad2(minute)}`;
};

export default function IzinScheduleModal({
  isOpen,
  onClose,
  onSave,
  initialStartDate,
  initialEndDate,
  initialStartTime,
  initialEndTime,
}: IzinScheduleModalProps) {
  const today = new Date();
  const todayIso = today.toISOString().split("T")[0];

  const [viewYear, setViewYear] = useState(() => {
    if (initialStartDate) return new Date(initialStartDate).getFullYear();
    return today.getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    if (initialStartDate) return new Date(initialStartDate).getMonth();
    return today.getMonth();
  });

  const [startDate, setStartDate] = useState<string>(initialStartDate || todayIso);
  const [endDate, setEndDate] = useState<string>(initialEndDate || initialStartDate || todayIso);

  const isSingleDay = startDate === endDate;

  // Jam tersimpan (string "HH:MM" atau "" jika tidak diset / seharian)
  const [startTime, setStartTime] = useState<string>(() => {
    return initialStartTime && initialStartTime !== "--:--" ? initialStartTime : "";
  });
  const [endTime, setEndTime] = useState<string>(() => {
    return initialEndTime && initialEndTime !== "--:--" ? initialEndTime : "";
  });

  // State pop-up pemilihan jam scroll ("start" | "end" | null)
  const [pickerModal, setPickerModal] = useState<"start" | "end" | null>(null);
  const [tempHour, setTempHour] = useState<number>(8);
  const [tempMinute, setTempMinute] = useState<number>(0);

  // Touch gesture state untuk HP / Mobile Touchscreen
  const hourTouchStartY = useRef<number | null>(null);
  const minTouchStartY = useRef<number | null>(null);

  // Sync state when modal opens
  const [prevOpen, setPrevOpen] = useState(false);
  if (isOpen && !prevOpen) {
    setPrevOpen(true);
    if (initialStartDate) {
      setStartDate(initialStartDate);
      setEndDate(initialEndDate || initialStartDate);
      const d = new Date(initialStartDate);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());

      const isInitSingle = (initialEndDate || initialStartDate) === initialStartDate;
      if (isInitSingle && initialStartTime && initialStartTime !== "--:--") {
        setStartTime(initialStartTime);
        setEndTime(initialEndTime && initialEndTime !== "--:--" ? initialEndTime : "");
      } else {
        setStartTime("");
        setEndTime("");
      }
    }
  } else if (!isOpen && prevOpen) {
    setPrevOpen(false);
  }

  if (!isOpen) return null;

  // Nama Bulan dalam Bahasa Indonesia
  const monthNames = [
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

  // Label hari dalam Bahasa Indonesia (Minggu - Sabtu)
  const dayLabels = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleDateClick = (iso: string) => {
    if (!startDate || (startDate && endDate && startDate !== endDate)) {
      setStartDate(iso);
      setEndDate(iso);
    } else if (startDate && startDate === endDate) {
      if (iso < startDate) {
        setStartDate(iso);
        setEndDate(startDate);
        setStartTime("");
        setEndTime("");
      } else {
        setEndDate(iso);
        if (iso !== startDate) {
          // Multi-day otomatis kosongkan jam
          setStartTime("");
          setEndTime("");
        }
      }
    }
  };

  // Buka Pop-up Scroll Picker untuk Jam Mulai atau Jam Selesai
  const openTimePicker = (type: "start" | "end") => {
    if (!isSingleDay) return;
    setPickerModal(type);
    if (type === "start") {
      const parsed = parseTimeString(startTime);
      setTempHour(parsed ? parsed.hour : 8);
      setTempMinute(parsed ? parsed.minute : 0);
    } else {
      const parsed = parseTimeString(endTime);
      if (parsed) {
        setTempHour(parsed.hour);
        setTempMinute(parsed.minute);
      } else if (startTime) {
        const startParsed = parseTimeString(startTime);
        setTempHour(startParsed ? Math.min(23, startParsed.hour + 4) : 12);
        setTempMinute(startParsed ? startParsed.minute : 0);
      } else {
        setTempHour(12);
        setTempMinute(0);
      }
    }
  };

  // Simpan hasil scroll picker
  const saveTimePicker = () => {
    const formatted = to24HourStr(tempHour, tempMinute);
    if (pickerModal === "start") {
      setStartTime(formatted);
      if (!endTime) {
        setEndTime(to24HourStr(Math.min(23, tempHour + 4), tempMinute));
      }
    } else if (pickerModal === "end") {
      setEndTime(formatted);
      if (!startTime) {
        setStartTime(to24HourStr(Math.max(0, tempHour - 4), tempMinute));
      }
    }
    setPickerModal(null);
  };

  // Wheel / Step Adjusters dalam Pop-up Scroll Picker
  const changeTempHour = (delta: number) => {
    setTempHour((prev) => (prev + delta + 24) % 24);
  };

  const changeTempMinute = (delta: number) => {
    setTempMinute((prev) => (prev + delta + 60) % 60);
  };

  // Touch Drag Listeners untuk HP / Mobile
  const handleHourTouchStart = (e: React.TouchEvent) => {
    hourTouchStartY.current = e.touches[0].clientY;
  };

  const handleHourTouchMove = (e: React.TouchEvent) => {
    if (hourTouchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const delta = hourTouchStartY.current - currentY;
    const STEP = 18; // 18px per step
    if (Math.abs(delta) >= STEP) {
      const steps = Math.trunc(delta / STEP);
      changeTempHour(steps);
      hourTouchStartY.current = currentY;
    }
  };

  const handleHourTouchEnd = () => {
    hourTouchStartY.current = null;
  };

  const handleMinTouchStart = (e: React.TouchEvent) => {
    minTouchStartY.current = e.touches[0].clientY;
  };

  const handleMinTouchMove = (e: React.TouchEvent) => {
    if (minTouchStartY.current === null) return;
    const currentY = e.touches[0].clientY;
    const delta = minTouchStartY.current - currentY;
    const STEP = 16; // 16px per step
    if (Math.abs(delta) >= STEP) {
      const steps = Math.trunc(delta / STEP);
      changeTempMinute(steps);
      minTouchStartY.current = currentY;
    }
  };

  const handleMinTouchEnd = () => {
    minTouchStartY.current = null;
  };

  // Helper tampilan wheel picker
  const prevH = (tempHour - 1 + 24) % 24;
  const prevH2 = (tempHour - 2 + 24) % 24;
  const nextH = (tempHour + 1) % 24;
  const nextH2 = (tempHour + 2) % 24;

  const prevM = (tempMinute - 1 + 60) % 60;
  const prevM2 = (tempMinute - 2 + 60) % 60;
  const nextM = (tempMinute + 1) % 60;
  const nextM2 = (tempMinute + 2) % 60;

  const handleSaveMain = () => {
    let s24 = "";
    let e24 = "";
    if (isSingleDay && startTime && endTime) {
      s24 = startTime;
      e24 = endTime;
    }
    onSave({
      startDate: startDate || todayIso,
      endDate: endDate || startDate || todayIso,
      startTime: s24,
      endTime: e24,
    });
    onClose();
  };

  const formatDateReadable = (isoStr: string) => {
    if (!isoStr) return "";
    const [y, m, d] = isoStr.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <>
      {/* ══════════════ MODAL UTAMA JADWAL IZIN ══════════════ */}
      <div
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto"
      >
        <div className="bg-white w-full max-w-[360px] sm:max-w-[380px] rounded-[24px] sm:rounded-[28px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[86dvh] sm:max-h-[88dvh] my-auto animate-scale-up">
          {/* Modal Header (Fixed at top) */}
          <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100 shrink-0 bg-white">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1a7dc4] flex items-center justify-center">
                <Calendar size={17} strokeWidth={2.3} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 leading-tight">
                  Pilih Jadwal Izin
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Pilih tanggal dan jam izin
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              aria-label="Tutup"
            >
              <X size={15} />
            </button>
          </div>

          {/* Modal Scrollable Content (Fluid & Smooth on Mobile) */}
          <div
            className="px-4 py-3 sm:py-3.5 overflow-y-auto space-y-3.5 flex-1 overscroll-contain touch-pan-y"
            style={{ WebkitOverflowScrolling: "touch" }}
          >
            {/* ══════════════ 1. PILIH TANGGAL ══════════════ */}
            <div>
              <h4 className="text-[13px] font-bold text-slate-800 mb-2 px-0.5">
                Pilih Tanggal
              </h4>

              {/* Calendar Card */}
              <div className="bg-white rounded-2xl border border-slate-200/90 p-3 shadow-xs">
                {/* Month Navigator */}
                <div className="flex items-center justify-between px-1 mb-3">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-700 bg-slate-50 hover:bg-slate-100 active:scale-90 transition-all cursor-pointer"
                    aria-label="Bulan Sebelumnya"
                  >
                    <ChevronLeft size={16} strokeWidth={2.5} />
                  </button>
                  <span className="text-xs font-bold text-slate-800 min-w-[120px] text-center">
                    {monthNames[viewMonth]} {viewYear}
                  </span>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-700 bg-slate-50 hover:bg-slate-100 active:scale-90 transition-all cursor-pointer"
                    aria-label="Bulan Berikutnya"
                  >
                    <ChevronRight size={16} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Day Labels */}
                <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 mb-1.5 select-none">
                  {dayLabels.map((d, i) => (
                    <div key={i} className="py-0.5">
                      {d}
                    </div>
                  ))}
                </div>

                {/* Day Grid */}
                <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
                  {Array.from({ length: firstDayOfMonth }).map((_, i) => {
                    const dayNum = daysInPrevMonth - firstDayOfMonth + i + 1;
                    return (
                      <div
                        key={`prev-${i}`}
                        className="h-8 flex items-center justify-center text-slate-300 font-normal pointer-events-none select-none text-[11px]"
                      >
                        {dayNum}
                      </div>
                    );
                  })}

                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const iso = `${viewYear}-${pad2(viewMonth + 1)}-${pad2(dayNum)}`;
                    const isStart = iso === startDate;
                    const isEnd = iso === endDate;
                    const inRange = startDate && endDate && iso >= startDate && iso <= endDate;
                    const isToday = iso === todayIso;

                    let circleCls =
                      "w-8 h-8 mx-auto rounded-full flex items-center justify-center font-medium transition-all text-xs ";

                    if (isStart || isEnd) {
                      circleCls += "bg-[#1a7dc4] text-white font-bold shadow-xs scale-105";
                    } else if (inRange) {
                      circleCls += "bg-[#dbeafe] text-[#1e40af] font-semibold";
                    } else {
                      circleCls += "text-slate-600 hover:bg-slate-100 active:scale-95";
                    }

                    return (
                      <div
                        key={dayNum}
                        onClick={() => handleDateClick(iso)}
                        className="relative py-0.5 cursor-pointer select-none"
                      >
                        <div className={circleCls}>{dayNum}</div>
                        {isToday && !isStart && !isEnd && (
                          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#1a7dc4]" />
                        )}
                      </div>
                    );
                  })}

                  {Array.from({
                    length: (7 - ((firstDayOfMonth + daysInMonth) % 7)) % 7,
                  }).map((_, i) => (
                    <div
                      key={`next-${i}`}
                      className="h-8 flex items-center justify-center text-slate-300 font-normal pointer-events-none select-none text-[11px]"
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
              </div>

              {/* Date selection pill */}
              <div className="mt-2 flex items-center justify-between bg-blue-50/60 border border-blue-200/70 rounded-xl px-3 py-1.5 text-[11px]">
                <span className="text-slate-500 font-medium">Rentang Tanggal:</span>
                <span className="font-bold text-[#156bb8]">
                  {startDate === endDate
                    ? `${formatDateReadable(startDate)} (1 Hari)`
                    : `${formatDateReadable(startDate)} s.d ${formatDateReadable(endDate)}`}
                </span>
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            {/* ══════════════ 2. PILIH JAM (HANYA 2 TOMBOL SESUAI GAMBAR 2) ══════════════ */}
            <div>
              <div className="flex items-center justify-between mb-2 px-0.5">
                <h4 className="text-[13px] font-bold text-slate-800">
                  Waktu Izin
                </h4>
                {/* Reset button jika ada jam terpasang */}
                {isSingleDay && (startTime || endTime) && (
                  <button
                    type="button"
                    onClick={() => {
                      setStartTime("");
                      setEndTime("");
                    }}
                    className="flex items-center gap-1 text-[10px] font-bold text-[#1a7dc4] hover:text-red-500 active:scale-95 transition-all cursor-pointer"
                  >
                    <RotateCcw size={11} />
                    <span>Seharian (--:--)</span>
                  </button>
                )}
              </div>

              {isSingleDay ? (
                /* Tampilan 2 Tombol Jam Mulai & Jam Selesai */
                <div>
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Tombol 1: Jam Mulai */}
                    <div
                      onClick={() => openTimePicker("start")}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer active:scale-[0.98] ${
                        startTime
                          ? "bg-blue-50/90 border-[#1a7dc4] shadow-xs ring-2 ring-[#1a7dc4]/20"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Jam Mulai
                        </span>
                        {startTime && (
                          <span className="w-2 h-2 rounded-full bg-[#1a7dc4]" />
                        )}
                      </div>
                      <div className="text-sm font-extrabold text-[#1a3c5e] flex items-baseline gap-1">
                        {startTime ? (
                          <>
                            <span>{startTime}</span>
                            <span className="text-[11px] font-semibold text-slate-400">WIB</span>
                          </>
                        ) : (
                          <span className="text-slate-300 font-mono text-sm">-- : --</span>
                        )}
                      </div>
                    </div>

                    {/* Tombol 2: Jam Selesai */}
                    <div
                      onClick={() => openTimePicker("end")}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer active:scale-[0.98] ${
                        endTime
                          ? "bg-blue-50/90 border-[#1a7dc4] shadow-xs ring-2 ring-[#1a7dc4]/20"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Jam Selesai
                        </span>
                        {endTime && (
                          <span className="w-2 h-2 rounded-full bg-[#1a7dc4]" />
                        )}
                      </div>
                      <div className="text-sm font-extrabold text-[#1a3c5e] flex items-baseline gap-1">
                        {endTime ? (
                          <>
                            <span>{endTime}</span>
                            <span className="text-[11px] font-semibold text-slate-400">WIB</span>
                          </>
                        ) : (
                          <span className="text-slate-300 font-mono text-sm">-- : --</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 text-center mt-1.5">
                    {!startTime && !endTime
                      ? "Setingan awal --:-- (seharian). Klik jam untuk atur waktu izin."
                      : "Klik jam di atas untuk mengubah waktu izin."}
                  </p>
                </div>
              ) : (
                /* Multi-Day: Tanpa jam */
                <div className="bg-[#f0f7fd] border border-[#c8e2f4] rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-[#1a7dc4]" />
                    <div>
                      <span className="font-bold text-slate-800">Izin Lebih dari 1 Hari</span>
                      <p className="text-[11px] text-slate-500">Otomatis seharian penuh (tanpa jam)</p>
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-400 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    -- : --
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer Actions (Fixed at bottom) */}
          <div className="px-4 py-3 bg-slate-50/95 border-t border-slate-100 flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold text-xs py-2.5 rounded-xl hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveMain}
              className="flex-2 bg-gradient-to-r from-[#1a7dc4] to-[#156bb8] text-white font-bold text-xs py-2.5 rounded-xl shadow-md shadow-[#156bb8]/25 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check size={14} strokeWidth={2.5} />
              <span>Terapkan Jadwal</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══════════════ POP-UP PEMILIHAN JAM SCROLL & TOUCH ══════════════ */}
      {pickerModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setPickerModal(null);
          }}
          className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto"
        >
          <div className="bg-white w-full max-w-[320px] rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col my-auto animate-scale-up">
            {/* Header Pop-up Scroll */}
            <div className="px-4 pt-3.5 pb-2.5 flex items-center justify-between border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1a7dc4] flex items-center justify-center">
                  <Clock size={16} strokeWidth={2.3} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">
                    {pickerModal === "start" ? "Atur Jam Mulai" : "Atur Jam Selesai"}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-medium">
                    Geser jari, scroll, atau tekan panah
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPickerModal(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                aria-label="Tutup"
              >
                <X size={14} />
              </button>
            </div>

            {/* Body: Scroll & Touch Wheel Picker */}
            <div className="py-3 px-4 bg-slate-50/50 flex-1 overflow-y-auto">
              <div className="bg-white rounded-2xl border border-slate-200/90 py-3 px-3 shadow-xs relative">
                {/* Header Kolom */}
                <div className="flex items-center justify-around text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 select-none">
                  <span className="w-16 text-center">Jam</span>
                  <span className="w-4 text-center text-transparent">:</span>
                  <span className="w-16 text-center">Menit</span>
                </div>

                <div className="flex items-center justify-center gap-3 relative select-none">
                  {/* Garis Horizontal Pembatas Aktif */}
                  <div className="absolute top-[48%] -translate-y-4 left-3 right-3 h-[38px] bg-blue-50/70 border-y border-blue-200/60 rounded-lg pointer-events-none -z-0" />

                  {/* 1. Hour Column (00 - 23) */}
                  <div className="flex flex-col items-center w-16 relative z-10">
                    <button
                      type="button"
                      onClick={() => changeTempHour(-1)}
                      className="p-1 text-slate-400 hover:text-[#1a7dc4] active:scale-90 transition-transform cursor-pointer"
                      aria-label="Kurang 1 Jam"
                    >
                      <ChevronUp size={16} strokeWidth={2.5} />
                    </button>

                    <div
                      className="flex flex-col items-center w-full py-1 touch-none cursor-grab active:cursor-grabbing select-none"
                      onWheel={(e) => {
                        e.preventDefault();
                        changeTempHour(e.deltaY > 0 ? 1 : -1);
                      }}
                      onTouchStart={handleHourTouchStart}
                      onTouchMove={handleHourTouchMove}
                      onTouchEnd={handleHourTouchEnd}
                    >
                      <span
                        onClick={() => changeTempHour(-2)}
                        className="text-[11px] text-slate-300 font-semibold cursor-pointer py-0.5 hover:text-slate-400 active:scale-95 transition-all"
                      >
                        {pad2(prevH2)}
                      </span>
                      <span
                        onClick={() => changeTempHour(-1)}
                        className="text-xs text-slate-400 font-semibold cursor-pointer py-0.5 hover:text-slate-500 active:scale-95 transition-all"
                      >
                        {pad2(prevH)}
                      </span>
                      <span className="text-2xl font-black text-slate-900 my-0.5 py-0.5 scale-105">
                        {pad2(tempHour)}
                      </span>
                      <span
                        onClick={() => changeTempHour(1)}
                        className="text-xs text-slate-400 font-semibold cursor-pointer py-0.5 hover:text-slate-500 active:scale-95 transition-all"
                      >
                        {pad2(nextH)}
                      </span>
                      <span
                        onClick={() => changeTempHour(2)}
                        className="text-[11px] text-slate-300 font-semibold cursor-pointer py-0.5 hover:text-slate-400 active:scale-95 transition-all"
                      >
                        {pad2(nextH2)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => changeTempHour(1)}
                      className="p-1 text-slate-400 hover:text-[#1a7dc4] active:scale-90 transition-transform cursor-pointer"
                      aria-label="Tambah 1 Jam"
                    >
                      <ChevronDown size={16} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* Separator Titik Dua */}
                  <div className="text-2xl font-black text-slate-400 pb-0.5 relative z-10">:</div>

                  {/* 2. Minute Column (00 - 59) */}
                  <div className="flex flex-col items-center w-16 relative z-10">
                    <button
                      type="button"
                      onClick={() => changeTempMinute(-1)}
                      className="p-1 text-slate-400 hover:text-[#1a7dc4] active:scale-90 transition-transform cursor-pointer"
                      aria-label="Kurang 1 Menit"
                    >
                      <ChevronUp size={16} strokeWidth={2.5} />
                    </button>

                    <div
                      className="flex flex-col items-center w-full py-1 touch-none cursor-grab active:cursor-grabbing select-none"
                      onWheel={(e) => {
                        e.preventDefault();
                        changeTempMinute(e.deltaY > 0 ? 1 : -1);
                      }}
                      onTouchStart={handleMinTouchStart}
                      onTouchMove={handleMinTouchMove}
                      onTouchEnd={handleMinTouchEnd}
                    >
                      <span
                        onClick={() => changeTempMinute(-2)}
                        className="text-[11px] text-slate-300 font-semibold cursor-pointer py-0.5 hover:text-slate-400 active:scale-95 transition-all"
                      >
                        {pad2(prevM2)}
                      </span>
                      <span
                        onClick={() => changeTempMinute(-1)}
                        className="text-xs text-slate-400 font-semibold cursor-pointer py-0.5 hover:text-slate-500 active:scale-95 transition-all"
                      >
                        {pad2(prevM)}
                      </span>
                      <span className="text-2xl font-black text-slate-900 my-0.5 py-0.5 scale-105">
                        {pad2(tempMinute)}
                      </span>
                      <span
                        onClick={() => changeTempMinute(1)}
                        className="text-xs text-slate-400 font-semibold cursor-pointer py-0.5 hover:text-slate-500 active:scale-95 transition-all"
                      >
                        {pad2(nextM)}
                      </span>
                      <span
                        onClick={() => changeTempMinute(2)}
                        className="text-[11px] text-slate-300 font-semibold cursor-pointer py-0.5 hover:text-slate-400 active:scale-95 transition-all"
                      >
                        {pad2(nextM2)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => changeTempMinute(1)}
                      className="p-1 text-slate-400 hover:text-[#1a7dc4] active:scale-90 transition-transform cursor-pointer"
                      aria-label="Tambah 1 Menit"
                    >
                      <ChevronDown size={16} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>

                {/* Shortcut Presets untuk Mobile Touchscreen */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 select-none">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-slate-400">Pilihan Jam Cepat:</span>
                  </div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    {[8, 9, 12, 13, 17].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setTempHour(h)}
                        className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          tempHour === h
                            ? "bg-[#1a7dc4] text-white shadow-xs scale-105"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95"
                        }`}
                      >
                        {pad2(h)}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-slate-400">Pilihan Menit Cepat:</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[0, 15, 30, 45].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setTempMinute(m)}
                        className={`py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          tempMinute === m
                            ? "bg-[#1a7dc4] text-white shadow-xs scale-105"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200 active:scale-95"
                        }`}
                      >
                        :{pad2(m)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Pop-up Scroll */}
            <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setPickerModal(null)}
                className="flex-1 bg-white border border-slate-200 text-slate-600 font-bold text-xs py-2 rounded-xl hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={saveTimePicker}
                className="flex-1 bg-gradient-to-r from-[#1a7dc4] to-[#156bb8] hover:brightness-105 active:scale-95 text-white font-bold text-xs py-2 rounded-xl shadow-xs cursor-pointer flex items-center justify-center gap-1 transition-all"
              >
                <Check size={13} strokeWidth={2.5} />
                <span>Simpan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


