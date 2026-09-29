"use client";

import { useState } from "react";
import { ChevronDown, Calendar, Check, X } from "lucide-react";

interface MonthYearPickerProps {
  month: string; // "01" - "12"
  year: number; // e.g. 2026
  onChange: (month: string, year: number) => void;
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

const YEARS = [2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030];

export default function MonthYearPicker({
  month,
  year,
  onChange,
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

  const handleApply = () => {
    onChange(tempMonth, tempYear);
    setIsOpen(false);
  };

  return (
    <>
      {/* ── Trigger Button ── */}
      <button
        type="button"
        onClick={handleOpen}
        className="w-full bg-white border border-[#c8e0f0] text-[#1a3c5e] text-sm font-semibold px-4 py-3 rounded-2xl shadow-xs flex items-center justify-between hover:bg-slate-50/80 active:scale-[0.99] transition-all cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <Calendar size={16} className="text-[#156bb8]" />
          <span className="font-bold text-[14px]">
            {currentMonthName} {year}
          </span>
        </div>
        <ChevronDown size={17} className="text-[#156bb8]" />
      </button>

      {/* ── Scrollable Modal Picker ── */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-100 flex flex-col"
          >
            {/* Modal Header */}
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-[#156bb8]" />
                <h3 className="font-bold text-slate-800 text-[14px]">
                  Pilih Bulan & Tahun
                </h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-200/70 hover:bg-slate-300/80 text-slate-600 flex items-center justify-center"
              >
                <X size={15} />
              </button>
            </div>

            {/* Scrollable Columns (Month & Year) */}
            <div className="p-4 grid grid-cols-2 gap-3">
              {/* Kolom Bulan */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                  Bulan
                </p>
                <div className="h-56 overflow-y-auto pr-1 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
                  {MONTH_NAMES.map((m, i) => {
                    const mVal = String(i + 1).padStart(2, "0");
                    const isSelected = tempMonth === mVal;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setTempMonth(mVal)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-[#156bb8] text-white shadow-sm font-bold"
                            : "text-slate-700 hover:bg-slate-100/80"
                        }`}
                      >
                        <span>{m}</span>
                        {isSelected && <Check size={13} className="text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Kolom Tahun */}
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">
                  Tahun
                </p>
                <div className="h-56 overflow-y-auto pr-1 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
                  {YEARS.map((y) => {
                    const isSelected = tempYear === y;
                    return (
                      <button
                        key={y}
                        type="button"
                        onClick={() => setTempYear(y)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? "bg-[#156bb8] text-white shadow-sm font-bold"
                            : "text-slate-700 hover:bg-slate-100/80"
                        }`}
                      >
                        <span>{y}</span>
                        {isSelected && <Check size={13} className="text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <span className="text-[11.5px] font-semibold text-slate-500">
                Terpilih:{" "}
                <strong className="text-[#156bb8]">
                  {MONTH_NAMES[parseInt(tempMonth, 10) - 1]} {tempYear}
                </strong>
              </span>
              <button
                type="button"
                onClick={handleApply}
                className="px-5 py-2 rounded-xl bg-[#156bb8] text-white text-xs font-bold shadow-md hover:bg-[#125899] active:scale-95 transition-all cursor-pointer"
              >
                Terapkan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
