"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, FileText, Clock } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isPengajuan = pathname.startsWith("/pengajuan");
  const isLembur = pathname.startsWith("/lembur");
  const isHome = pathname === "/" || (pathname.startsWith("/absensi") && !pathname.startsWith("/absensi/check-in"));
  const isCheckIn = pathname.startsWith("/absensi/check-in");

  if (isCheckIn) return null;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md md:max-w-2xl lg:max-w-3xl xl:max-w-4xl z-50 select-none transition-all duration-300">
      <div className="bg-white/95 backdrop-blur-xl border-t border-slate-200/80 shadow-[0_-4px_25px_rgba(0,0,0,0.06)] px-4 pb-safe">
        <div className="flex items-center justify-between h-16 relative">
          {/* ══════════════ TAB 1: PENGAJUAN (KIRI) ══════════════ */}
          <button
            onClick={() => router.push("/pengajuan")}
            className="flex-1 py-1 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 group cursor-pointer outline-none focus:outline-none"
          >
            <div className="flex flex-col items-center justify-center gap-1">
              <FileText
                size={20}
                className={`transition-all duration-200 ${
                  isPengajuan
                    ? "text-[#156bb8] stroke-[2.5]"
                    : "text-slate-400 group-hover:text-slate-600 stroke-[1.8]"
                }`}
              />
              <span
                className={`text-[11.5px] italic tracking-wide transition-colors leading-none ${
                  isPengajuan
                    ? "font-bold text-[#156bb8]"
                    : "font-semibold text-slate-500 group-hover:text-slate-700"
                }`}
              >
                Pengajuan
              </span>
            </div>

            {/* Indikator Fokus Dot / Bar */}
            <div className="h-1 flex items-center justify-center mt-1">
              {isPengajuan ? (
                <span className="w-4 h-1 rounded-full bg-[#156bb8] shadow-xs animate-pulse" />
              ) : (
                <span className="w-1 h-1 rounded-full bg-transparent" />
              )}
            </div>
          </button>

          {/* ══════════════ TAB 2: HOME / ABSENSI (TENGAH) ══════════════ */}
          <div className="relative -mt-6 px-3 flex flex-col items-center justify-center">
            <button
              onClick={() => router.push("/")}
              aria-label="Home Absensi"
              className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 active:scale-95 cursor-pointer outline-none focus:outline-none ${
                isHome
                  ? "bg-[#156bb8] text-white ring-4 ring-[#cfe4f7] shadow-[#156bb8]/40 scale-105"
                  : "bg-slate-100 text-slate-400 ring-4 ring-white border border-slate-200/80 hover:bg-slate-200/80 hover:text-slate-600"
              }`}
            >
              <Home
                size={24}
                className={isHome ? "fill-white text-white drop-shadow-xs" : "text-slate-400"}
              />
            </button>

            {/* Indikator Fokus Dot / Bar untuk Home */}
            <div className="h-1 flex items-center justify-center mt-1">
              {isHome ? (
                <span className="w-4 h-1 rounded-full bg-[#156bb8] shadow-xs animate-pulse" />
              ) : (
                <span className="w-1 h-1 rounded-full bg-transparent" />
              )}
            </div>
          </div>

          {/* ══════════════ TAB 3: LEMBUR (KANAN) ══════════════ */}
          <button
            onClick={() => router.push("/lembur")}
            className="flex-1 py-1 flex flex-col items-center justify-center transition-all duration-200 active:scale-95 group cursor-pointer outline-none focus:outline-none"
          >
            <div className="flex flex-col items-center justify-center gap-1">
              <Clock
                size={20}
                className={`transition-all duration-200 ${
                  isLembur
                    ? "text-[#156bb8] stroke-[2.5]"
                    : "text-slate-400 group-hover:text-slate-600 stroke-[1.8]"
                }`}
              />
              <span
                className={`text-[11.5px] italic tracking-wide transition-colors leading-none ${
                  isLembur
                    ? "font-bold text-[#156bb8]"
                    : "font-semibold text-slate-500 group-hover:text-slate-700"
                }`}
              >
                Lembur
              </span>
            </div>

            {/* Indikator Fokus Dot / Bar */}
            <div className="h-1 flex items-center justify-center mt-1">
              {isLembur ? (
                <span className="w-4 h-1 rounded-full bg-[#156bb8] shadow-xs animate-pulse" />
              ) : (
                <span className="w-1 h-1 rounded-full bg-transparent" />
              )}
            </div>
          </button>
        </div>
      </div>
    </nav>
  );
}

