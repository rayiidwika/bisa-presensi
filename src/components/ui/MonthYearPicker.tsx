"use client";

import { useState } from "react";
import { ChevronDown, Calendar, X, ChevronLeft, ChevronRight } from "lucide-react";

interface MonthYearPickerProps {
  month: string; // "01" - "12"
  year: number; // e.g. 2026
  onChange: (month: string, year: number) => void;
  subtitle?: string;
  className?: string;
}

const MONTH_NAMES = [
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

export default function MonthYearPicker({
  month,
  year,
  onChange,
  subtitle = "Periode ringkasan absensi",
  className = "",
}: MonthYearPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempMonth, setTempMonth] = useState(month);
  const [tempYear, setTempYear] = useState(year);

  const monthIndex = parseInt(month, 10) - 1;
  const currentMonthName = MONTH_NAMES[monthIndex] || "September";

  const handleOpen = () => {
    setTempMonth(month);
    setTempYear(year);
    setIsOpen(true);
  };

  const handlePrevYear = () => {
    const newYear = tempYear - 1;
    setTempYear(newYear);
    onChange(tempMonth, newYear);
  };

  const handleNextYear = () => {
    const newYear = tempYear + 1;
    setTempYear(newYear);
    onChange(tempMonth, newYear);
  };

  const handleSelectMonth = (monthVal: string) => {
    setTempMonth(monthVal);
    onChange(monthVal, tempYear);
    setIsOpen(false);
  };

  return (
    <>
      {/* ── Trigger Button (Pill) ── */}
      <button
        type="button"
        onClick={handleOpen}
        className={`w-full bg-white border border-[#c8e0f0] text-[#1a3c5e] text-sm font-semibold px-4 py-3 rounded-2xl shadow-xs flex items-center justify-between hover:bg-slate-50/80 active:scale-[0.99] transition-all cursor-pointer ${className}`}
      >
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-[#156bb8]" />
          <span className="font-bold text-[14px]">
            {currentMonthName} {year}
          </span>
        </div>
        <ChevronDown size={17} className="text-[#156bb8]" />
      </button>

      {/* ══════════════ MONTH & YEAR PICKER POPUP (MATCHING IMAGE 2) ══════════════ */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-[360px] rounded-[28px] shadow-2xl border border-slate-100 p-5 animate-scale-up relative"
          >
            {/* Header Modal */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#156bb8] flex items-center justify-center">
                  <Calendar size={18} />
                </div>
                <div>
                  <h3 className="text-[15px] font-black text-slate-800 leading-tight">
                    Pilih Bulan & Tahun
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium">
                    {subtitle}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
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
                onClick={handlePrevYear}
                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all active:scale-95 cursor-pointer"
                aria-label="Tahun Sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[16px] font-black text-slate-800 tracking-wide">
                {tempYear}
              </span>
              <button
                type="button"
                onClick={handleNextYear}
                className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 shadow-2xs flex items-center justify-center text-slate-600 hover:text-slate-900 transition-all active:scale-95 cursor-pointer"
                aria-label="Tahun Berikutnya"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* 12 Months Grid (Januari - Desember) */}
            <div className="grid grid-cols-3 gap-2">
              {MONTH_NAMES.map((monthName, idx) => {
                const monthVal = String(idx + 1).padStart(2, "0");
                const isSelected = tempMonth === monthVal;
                return (
                  <button
                    key={monthName}
                    type="button"
                    onClick={() => handleSelectMonth(monthVal)}
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
    </>
  );
}
