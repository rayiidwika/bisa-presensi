"use client";
import { useRouter } from "next/navigation";
import { Bell, ChevronDown } from "lucide-react";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showBell?: boolean;
  showLogo?: boolean;
  children?: React.ReactNode;
}

/** Blue gradient page header matching reference design */
export default function Header({
  title,
  showBack = false,
  showBell = false,
  showLogo = false,
  children,
}: HeaderProps) {
  const router = useRouter();
  return (
    <div className="bg-gradient-to-b from-[#3b9edd] to-[#1a6fb5] relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
      <div className="absolute top-4 right-10 w-14 h-14 rounded-full bg-white/8 pointer-events-none" />

      <div className="relative px-4 pt-4 pb-0">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {showBack && (
              <button
                onClick={() => router.back()}
                className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center active:scale-90 transition-transform"
              >
                <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            )}
            {showLogo && (
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm">
                  <span className="text-[#1a7dc4] font-black text-[10px] leading-tight text-center">BISA<br/>MEDIA</span>
                </div>
              </div>
            )}
            {title && (
              <h1 className="text-white font-bold text-lg leading-tight">{title}</h1>
            )}
          </div>
          {showBell && (
            <button className="relative w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Bell size={17} className="text-white" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-400 border-2 border-[#1a7dc4]" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Sub-page flat header (white bg) ────────────────────────
interface FlatHeaderProps {
  title: string;
  showBack?: boolean;
  right?: React.ReactNode;
}
export function FlatHeader({ title, showBack = true, right }: FlatHeaderProps) {
  const router = useRouter();
  return (
    <div className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          {showBack && (
            <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-[#e8f4fd] flex items-center justify-center active:scale-90 transition-transform">
              <svg width="15" height="15" fill="none" stroke="#1a7dc4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}
          <h1 className="text-[#1a3c5e] font-bold text-base">{title}</h1>
        </div>
        {right && <div>{right}</div>}
      </div>
    </div>
  );
}

// ── Month filter ───────────────────────────────────────────
interface MonthFilterProps { value: string; onChange: (v: string) => void; }
const MONTHS = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
export function MonthFilter({ value, onChange }: MonthFilterProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-white border border-[#c8e0f0] text-[#1a3c5e] text-sm font-semibold pl-3 pr-8 py-2.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3b9edd] shadow-sm cursor-pointer"
      >
        {MONTHS.map((m,i) => (
          <option key={m} value={String(i+1).padStart(2,"0")}>{m}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#3b9edd] pointer-events-none" />
    </div>
  );
}
