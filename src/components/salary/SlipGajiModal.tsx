"use client";

import React, { useRef, useState, forwardRef } from "react";
import {
  X,
  Download,
  Image as ImageIcon,
  CheckCircle2,
  Wallet,
  Coins,
  Banknote,
  FileText,
  Share2,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export interface SlipGajiData {
  periode: string;
  idKaryawan: string;
  namaKaryawan: string;
  jabatan: string;
  status: string;
  kotaTtd: string;
  namaPenerima: string;
  namaAtasan: string;
  penerimaan: { no: number; nama: string; jumlah: number }[];
  pengurangan: { no: number; nama: string; jumlah: number }[];
  terbilang: string;
}

export const ALL_MONTHS_ID = [
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

export const getAutoPeriode = (customDate?: Date) => {
  const now = customDate || new Date();
  const bulan = ALL_MONTHS_ID[now.getMonth()];
  const tahun = now.getFullYear().toString();
  const tanggal = now.getDate().toString();
  return {
    bulan,
    tahun,
    tanggal,
    periode: `${bulan} ${tahun}`,
    tanggalLengkap: `${tanggal} ${bulan} ${tahun}`,
  };
};

export const getDefaultSlipData = (customDate?: Date): SlipGajiData => {
  const auto = getAutoPeriode(customDate);
  return {
    periode: auto.periode,
    idKaryawan: "BMG250001",
    namaKaryawan: "Eki Permadi Nugraha",
    jabatan: "COO Office",
    status: "Kontrak",
    kotaTtd: "Tasikmalaya",
    namaPenerima: "Eki Permadi Nugraha",
    namaAtasan: "Syahrul Muharrom",
    penerimaan: [
      { no: 1, nama: "Gaji Pokok", jumlah: 1723264 },
      { no: 2, nama: "Tunjangan Jabatan", jumlah: 500000 },
      { no: 3, nama: "Tunjangan Transportasi", jumlah: 250000 },
      { no: 4, nama: "Tunjangan Komunikasi", jumlah: 250000 },
      { no: 5, nama: "Lembur", jumlah: 381000 },
      { no: 6, nama: "WFH", jumlah: 0 },
      { no: 7, nama: "Bonus", jumlah: 0 },
      { no: 8, nama: "Perjalanan Dinas", jumlah: 400000 },
      { no: 9, nama: "Penerimaan lainnya", jumlah: 0 },
      { no: 10, nama: "Reimburse", jumlah: 0 },
    ],
    pengurangan: [
      { no: 1, nama: "Keterlambatan", jumlah: 85050 },
      { no: 2, nama: "Pinjaman", jumlah: 2629167 },
      { no: 3, nama: "Iuran BPJS Kesehatan", jumlah: 0 },
      { no: 4, nama: "Iuran BPJS Ketenagakerjaan", jumlah: 0 },
      { no: 5, nama: "Pajak", jumlah: 0 },
      { no: 6, nama: "Livet", jumlah: 0 },
      { no: 7, nama: "Pengurangan Lainnya", jumlah: 0 },
    ],
    terbilang: "Tujuh ratus sembilan puluh ribu empat puluh tujuh rupiah",
  };
};

export function angkaKeKata(n: number): string {
  const bilangan = [
    "", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "delapan", "sembilan",
    "sepuluh", "sebelas"
  ];
  if (n < 12) return bilangan[n];
  if (n < 20) return angkaKeKata(n - 10) + " belas";
  if (n < 100) return (angkaKeKata(Math.floor(n / 10)) + " puluh " + angkaKeKata(n % 10)).trim();
  if (n < 200) return ("seratus " + angkaKeKata(n - 100)).trim();
  if (n < 1000) return (angkaKeKata(Math.floor(n / 100)) + " ratus " + angkaKeKata(n % 100)).trim();
  if (n < 2000) return ("seribu " + angkaKeKata(n - 1000)).trim();
  if (n < 1000000) return (angkaKeKata(Math.floor(n / 1000)) + " ribu " + angkaKeKata(n % 1000)).trim();
  if (n < 1000000000) return (angkaKeKata(Math.floor(n / 1000000)) + " juta " + angkaKeKata(n % 1000000)).trim();
  return n.toString();
}

export function terbilangRupiah(n: number): string {
  if (n <= 0) return "Nol rupiah";
  const kata = angkaKeKata(Math.floor(n)).trim().replace(/\s+/g, " ");
  return kata.charAt(0).toUpperCase() + kata.slice(1) + " rupiah";
}

export const DEFAULT_SLIP_DATA: SlipGajiData = getDefaultSlipData();

export const formatRupiah = (val: number): string => {
  return "Rp " + val.toLocaleString("en-US");
};

// ══════════════════════════════════════════════════════════════════════════
// 1. DOKUMEN SLIP GAJI PAPER (EXACT LAYOUT DARI TEMPLATE GAMBAR)
// ══════════════════════════════════════════════════════════════════════════
export interface SlipGajiPaperProps {
  data?: SlipGajiData;
  periode?: string;
}

export const SlipGajiPaper = forwardRef<HTMLDivElement, SlipGajiPaperProps>(
  ({ data, periode: propPeriode }, ref) => {
    const auto = getAutoPeriode();
    const activeData = data || getDefaultSlipData();

    // Otomatis update bulan & tahun real-time jika tidak di-override spesifik
    const resolvedPeriode = (propPeriode || activeData.periode || auto.periode).trim();
    const periodeParts = resolvedPeriode.split(/\s+/);
    const periodeBulan = periodeParts[0] || auto.bulan;
    const periodeTahun = periodeParts[1] || auto.tahun;

    const totalBruto = activeData.penerimaan.reduce((sum, item) => sum + item.jumlah, 0);
    const totalPengurangan = activeData.pengurangan.reduce((sum, item) => sum + item.jumlah, 0);
    const takeHomePay = totalBruto - totalPengurangan;

    return (
      <div
        ref={ref}
        className="relative bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-7 text-slate-800 text-[10.5px] sm:text-[11.5px] leading-tight select-none overflow-hidden w-full max-w-xl mx-auto"
        style={{ minWidth: "320px", backgroundColor: "#ffffff" }}
      >
        {/* ── Top Right Decorative Wave ── */}
        <div className="absolute top-0 right-0 w-36 sm:w-48 h-36 sm:h-48 pointer-events-none opacity-90 overflow-hidden select-none">
          <svg viewBox="0 0 200 200" className="w-full h-full fill-none">
            <path
              d="M0 0 C70 30, 135 65, 200 160 L200 0 Z"
              fill="url(#topWave1)"
              opacity="0.8"
            />
            <path
              d="M50 0 C110 35, 155 85, 200 200 L200 0 Z"
              fill="url(#topWave2)"
            />
            <defs>
              <linearGradient id="topWave1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7dd3fc" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
              <linearGradient id="topWave2" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#0369a1" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* ── Bottom Left Decorative Wave ── */}
        <div className="absolute bottom-0 left-0 w-32 sm:w-44 h-32 sm:h-44 pointer-events-none opacity-90 overflow-hidden select-none">
          <svg viewBox="0 0 160 160" className="w-full h-full fill-none">
            <path
              d="M0 160 C30 100, 70 70, 160 30 L0 0 Z"
              fill="url(#botWave1)"
              opacity="0.35"
            />
            <path
              d="M0 160 C40 105, 80 75, 160 55 L0 160 Z"
              fill="url(#botWave2)"
              opacity="0.9"
            />
            <defs>
              <linearGradient id="botWave1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#bae6fd" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <linearGradient id="botWave2" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#075985" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* ══════════════ 1. HEADER TITLE ══════════════ */}
        <div className="text-center relative z-10 mb-4 sm:mb-5">
          <h1 className="text-2xl sm:text-[30px] font-black text-[#133d6b] tracking-wider uppercase font-sans">
            SLIP GAJI
          </h1>
          <div className="w-16 h-1.5 bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#38bdf8] rounded-full mx-auto mt-1" />
        </div>

        {/* ══════════════ 2. COMPANY & EMPLOYEE INFO ══════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 relative z-10 mb-3 sm:mb-4 items-center">
          {/* Sisi Kiri: Logo & Alamat Perusahaan */}
          <div className="sm:col-span-7 flex items-center gap-3">
            {/* Logo BISA MEDIA dari /app-logo.png */}
            <div className="flex flex-col items-center justify-center shrink-0">
              <img
                src="/app-logo.png"
                alt="Logo Bisa Media"
                className="w-13 h-13 sm:w-15 sm:h-15 object-contain drop-shadow-xs"
              />
              <span className="text-[7.5px] sm:text-[8.5px] font-black text-[#0f4477] tracking-wider uppercase mt-0.5">
                BISA MEDIA
              </span>
            </div>

            <div>
              <h2 className="text-xs sm:text-[13.5px] font-black text-[#0c3f6e] uppercase tracking-wide">
                PT BISA MEDIA GRUP
              </h2>
              <p className="text-[9.5px] sm:text-[10.5px] text-slate-500 leading-snug mt-0.5">
                Jl. Cisalak No.47B, Sukamanah, Kec. Cipedes,
                <br />
                Kab. Tasikmalaya, Jawa Barat 46133
              </p>
            </div>
          </div>

          {/* Sisi Kanan: Box Identitas Karyawan & Periode (Otomatis Update) */}
          <div className="sm:col-span-5 bg-[#edf5fc] rounded-xl p-2.5 sm:p-3 border border-[#d2e7f8] text-[9.5px] sm:text-[10.5px]">
            <table className="w-full">
              <tbody>
                <tr>
                  <td className="text-[#0f4477] font-semibold py-0.5 w-[65px] sm:w-[70px]">Periode</td>
                  <td className="text-slate-400 w-3">:</td>
                  <td className="font-medium text-slate-800">
                    <div className="flex justify-between items-center pr-2">
                      <span>{periodeBulan}</span>
                      <span>{periodeTahun}</span>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td className="text-[#0f4477] font-semibold py-0.5">ID</td>
                  <td className="text-slate-400">:</td>
                  <td className="font-medium text-slate-800">{activeData.idKaryawan}</td>
                </tr>
                <tr>
                  <td className="text-[#0f4477] font-semibold py-0.5">Karyawan</td>
                  <td className="text-slate-400">:</td>
                  <td className="font-medium text-slate-800">{activeData.namaKaryawan}</td>
                </tr>
                <tr>
                  <td className="text-[#0f4477] font-semibold py-0.5">Jabatan</td>
                  <td className="text-slate-400">:</td>
                  <td className="font-medium text-slate-800">{activeData.jabatan}</td>
                </tr>
                <tr>
                  <td className="text-[#0f4477] font-semibold py-0.5">Status</td>
                  <td className="text-slate-400">:</td>
                  <td className="font-medium text-slate-800">{activeData.status}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ══════════════ 3. TABEL PENERIMAAN ══════════════ */}
        <div className="rounded-xl overflow-hidden border border-[#bfe0f8] mb-2.5 sm:mb-3 relative z-10 shadow-xs">
          {/* Header Penerimaan */}
          <div className="bg-[#1575ca] text-white px-3 py-1.5 flex items-center justify-between font-bold text-[10.5px] sm:text-[11.5px] uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center">
                <Wallet size={12} className="text-white" />
              </div>
              <span>PENERIMAAN</span>
            </div>
            <span>JUMLAH</span>
          </div>

          {/* Rows Penerimaan */}
          <div className="divide-y divide-[#e3f0fa] text-[10px] sm:text-[11px]">
            {activeData.penerimaan.map((item, idx) => (
              <div
                key={item.no}
                className={`flex items-center justify-between py-1 pr-3 ${
                  idx % 2 === 1 ? "bg-[#f4f9fd]" : "bg-white"
                }`}
              >
                <div className="flex items-center">
                  <span className="w-8 text-center text-slate-500 font-semibold text-[9.5px] bg-[#eaf3fb] py-1 border-r border-[#d4e7f8] mr-2.5">
                    {item.no}
                  </span>
                  <span className="text-slate-700 font-medium">{item.nama}</span>
                </div>
                <span className="font-semibold text-slate-800 tracking-tight">
                  {formatRupiah(item.jumlah)}
                </span>
              </div>
            ))}

            {/* Footer Total Bruto */}
            <div className="bg-[#d5ebfa] px-3 py-1.5 flex items-center justify-between font-bold text-[10.5px] sm:text-[11.5px] text-[#0f4477]">
              <span>Total Penghasilan Bruto</span>
              <span>{formatRupiah(totalBruto)}</span>
            </div>
          </div>
        </div>

        {/* ══════════════ 4. TABEL PENGURANGAN ══════════════ */}
        <div className="rounded-xl overflow-hidden border border-[#bfe0f8] mb-2.5 sm:mb-3 relative z-10 shadow-xs">
          {/* Header Pengurangan */}
          <div className="bg-[#1575ca] text-white px-3 py-1.5 flex items-center justify-between font-bold text-[10.5px] sm:text-[11.5px] uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center">
                <Coins size={12} className="text-white" />
              </div>
              <span>PENGURANGAN</span>
            </div>
            <span>JUMLAH</span>
          </div>

          {/* Rows Pengurangan */}
          <div className="divide-y divide-[#e3f0fa] text-[10px] sm:text-[11px]">
            {activeData.pengurangan.map((item, idx) => (
              <div
                key={item.no}
                className={`flex items-center justify-between py-1 pr-3 ${
                  idx % 2 === 1 ? "bg-[#f4f9fd]" : "bg-white"
                }`}
              >
                <div className="flex items-center">
                  <span className="w-8 text-center text-slate-500 font-semibold text-[9.5px] bg-[#eaf3fb] py-1 border-r border-[#d4e7f8] mr-2.5">
                    {item.no}
                  </span>
                  <span className="text-slate-700 font-medium">{item.nama}</span>
                </div>
                <span className="font-semibold text-slate-800 tracking-tight">
                  {formatRupiah(item.jumlah)}
                </span>
              </div>
            ))}

            {/* Footer Total Pengurangan */}
            <div className="bg-[#d5ebfa] px-3 py-1.5 flex items-center justify-between font-bold text-[10.5px] sm:text-[11.5px] text-[#0f4477]">
              <span>Total Pengurangan</span>
              <span>{formatRupiah(totalPengurangan)}</span>
            </div>
          </div>
        </div>

        {/* ══════════════ 5. TAKE HOME PAY BANNER ══════════════ */}
        <div className="bg-[#1470c4] text-white rounded-xl px-3.5 py-2 sm:px-4 sm:py-2.5 flex items-center justify-between shadow-sm mb-2 relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
              <Banknote size={15} className="text-white" />
            </div>
            <span className="font-black text-xs sm:text-sm tracking-widest uppercase">
              TAKE HOME PAY
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-5 w-[1.5px] bg-white/40" />
            <span className="text-base sm:text-lg font-black tracking-tight">
              {formatRupiah(takeHomePay)}
            </span>
          </div>
        </div>

        {/* ══════════════ 6. TERBILANG ══════════════ */}
        <div className="bg-[#edf6fd] border border-[#d5e7f7] rounded-xl px-3 py-1.5 sm:py-2 flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4 relative z-10 text-[9.5px] sm:text-[10.5px]">
          <div className="bg-[#c8e2f8] text-[#0f5ca8] font-black text-[9.5px] sm:text-[10px] px-2 py-0.5 rounded-md shrink-0 flex items-center gap-1">
            <span className="font-black">#</span>
            <span>Terbilang</span>
          </div>
          <span className="italic text-slate-700 font-medium">
            {activeData.terbilang}
          </span>
        </div>

        {/* ══════════════ 7. TANDA TANGAN / PENGESAHAN ══════════════ */}
        <div className="border border-[#d2e5f5] rounded-2xl p-3 sm:p-4 bg-white/80 relative z-10 text-[9.5px] sm:text-[10.5px]">
          {/* Tanggal & Kota di pojok kanan atas - Otomatis update sesuai bulan dan tahun */}
          <div className="text-right text-slate-700 font-semibold mb-2 sm:mb-3 pr-2 sm:pr-4 flex justify-end gap-6 sm:gap-8 tracking-wide">
            <span>{activeData.kotaTtd || "Tasikmalaya"}</span>
            <span>{periodeBulan}</span>
            <span>{periodeTahun}</span>
          </div>

          <div className="grid grid-cols-2 relative text-center">
            {/* Penerima (Sisi Kiri) */}
            <div className="flex flex-col items-center justify-between pr-3 sm:pr-6">
              <p className="font-semibold text-slate-700">Penerima</p>

              {/* Spacer tinggi untuk tanda tangan manual */}
              <div className="h-14 sm:h-16" />

              <div className="w-full max-w-[140px] sm:max-w-[170px] border-b border-slate-700 pb-0.5">
                <span className="font-bold text-slate-800 text-[10px] sm:text-[11px]">
                  {activeData.namaPenerima}
                </span>
              </div>
            </div>

            {/* Garis Pembatas Vertikal di Tengah */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-[#dbe8f5] -translate-x-1/2 pointer-events-none" />

            {/* Perusahaan & TTD (Sisi Kanan) */}
            <div className="flex flex-col items-center justify-between pl-3 sm:pl-6">
              <p className="font-semibold text-slate-700">PT BISA MEDIA GRUP</p>

              {/* Tanda Tangan Syahrul Muharrom - Persis seperti di gambar */}
              <div className="w-24 sm:w-32 h-14 sm:h-16 relative flex items-center justify-center -my-1">
                <svg
                  viewBox="0 0 160 85"
                  className="w-full h-full text-[#112338] stroke-current fill-none select-none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {/* 1. Oval horizontal melingkar di sisi kiri */}
                  <path
                    d="M 38 48 C 22 42, 18 26, 36 24 C 54 22, 68 32, 62 48 C 58 57, 46 54, 38 48 Z"
                    strokeWidth="2.4"
                  />

                  {/* 2. Garis vertikal 1 (memotong bagian kiri oval) */}
                  <path d="M 52 18 L 52 70" strokeWidth="2.8" />

                  {/* 3. Garis vertikal 2 (tengah, menjulang lebih tinggi) */}
                  <path d="M 62 12 L 62 74" strokeWidth="2.8" />

                  {/* 4. Cursive scribble 'muh' di antara garis 2 dan 3 */}
                  <path
                    d="M 65 42 Q 68 36 70 42 Q 73 36 75 41 Q 78 37 80 40"
                    strokeWidth="2.0"
                  />
                  {/* Aksen garis bawah pada scribble */}
                  <path d="M 67 47 L 78 47" strokeWidth="2.1" />

                  {/* 5. Garis vertikal 3 dengan loop ascender melengkung di atas */}
                  <path
                    d="M 80 44 C 79 24, 82 8, 86 7 C 88.5 6, 88 18, 87 32 L 87 74"
                    strokeWidth="2.7"
                  />

                  {/* 6. Titik tinta di sebelah kanan */}
                  <circle cx="94" cy="51" r="1.6" className="fill-current stroke-none" />
                </svg>
              </div>

              <div className="w-full max-w-[140px] sm:max-w-[170px] border-b border-slate-700 pb-0.5">
                <span className="font-bold text-slate-800 text-[10px] sm:text-[11px]">
                  {activeData.namaAtasan}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

SlipGajiPaper.displayName = "SlipGajiPaper";

// ══════════════════════════════════════════════════════════════════════════
// 2. HELPER EXPORT GAMBAR PNG (HIGH DEFINITION RETINA)
// ══════════════════════════════════════════════════════════════════════════
export async function exportSlipElementToPNG(element: HTMLElement, filename: string) {
  const { toPng } = await import("html-to-image");
  const dataUrl = await toPng(element, {
    pixelRatio: 2.5,
    backgroundColor: "#ffffff",
    cacheBust: true,
  });

  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ══════════════════════════════════════════════════════════════════════════
// 3. FULL SLIP GAJI PREVIEW MODAL (DESAIN RESPONSIF & TIDAK TERHALANG)
// ══════════════════════════════════════════════════════════════════════════
interface SlipGajiModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: SlipGajiData;
  periode?: string;
}

export default function SlipGajiModal({
  isOpen,
  onClose,
  data,
  periode,
}: SlipGajiModalProps) {
  const slipRef = useRef<HTMLDivElement | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  const auto = getAutoPeriode();
  const effectiveData = data || getDefaultSlipData();
  const effectivePeriode = periode || effectiveData.periode || auto.periode;

  const handleDownloadPNG = async () => {
    if (!slipRef.current) return;
    setIsExporting(true);
    const toastId = toast.loading("Membuat file gambar slip gaji...");
    try {
      const filename = `Slip_Gaji_${effectiveData.namaKaryawan.replace(/\s+/g, "_")}_${effectivePeriode.replace(/\s+/g, "_")}.png`;
      await exportSlipElementToPNG(slipRef.current, filename);
      toast.success("Slip gaji berhasil diunduh sebagai gambar!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Gagal membuat gambar slip gaji.", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-5 bg-slate-900/70 backdrop-blur-sm animate-fade-in overflow-y-auto overflow-x-hidden">
      <div className="relative w-full max-w-lg bg-white rounded-[24px] sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-scale-up flex flex-col max-h-[90vh] sm:max-h-[92vh]">
        
        {/* ── TOP HEADER (BERSIH & LEGA: HANYA JUDUL & TOMBOL CLOSE BESAR) ── */}
        <div className="flex items-center justify-between px-3.5 sm:px-5 py-2.5 sm:py-3.5 bg-gradient-to-r from-[#1875c7] via-[#166db4] to-[#115794] text-white shrink-0 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <FileText size={16} className="text-sky-100" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold tracking-tight truncate">
                Slip Gaji Karyawan
              </h3>
              <p className="text-[9.5px] sm:text-[10px] text-sky-200/80 truncate">
                PT Bisa Media Grup • {effectivePeriode}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
            aria-label="Tutup Slip Gaji"
          >
            <X size={16} strokeWidth={2.4} />
          </button>
        </div>

        {/* ── MODAL SCROLLABLE PREVIEW CONTAINER ── */}
        <div className="p-2 sm:p-4 overflow-y-auto overflow-x-hidden bg-slate-100/80 flex-1">
          <SlipGajiPaper ref={slipRef} data={effectiveData} periode={effectivePeriode} />
        </div>

        {/* ── BOTTOM STICKY ACTION BAR (SANGAT JELAS & 100% BEBAS TERHALANG) ── */}
        <div className="px-3.5 pt-2.5 pb-3 sm:px-5 sm:py-3.5 bg-white border-t border-slate-200/90 shrink-0 shadow-[0_-6px_20px_rgba(0,0,0,0.06)] space-y-1.5">
          {/* Tombol Utama: Unduh Gambar Slip Gaji */}
          <button
            onClick={handleDownloadPNG}
            disabled={isExporting}
            className="w-full bg-gradient-to-r from-[#166db4] via-[#1464a5] to-[#104e84] hover:brightness-105 active:scale-[0.98] text-white font-bold text-xs sm:text-sm py-2.5 sm:py-3 px-3 sm:px-4 rounded-xl sm:rounded-2xl shadow-lg shadow-[#166db4]/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60"
          >
            {isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Menyiapkan Gambar...</span>
              </>
            ) : (
              <>
                <Download size={17} strokeWidth={2.4} />
                <span>Unduh Gambar Slip Gaji</span>
                <span className="text-[9.5px] sm:text-[10px] bg-white/20 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                  PNG
                </span>
              </>
            )}
          </button>

          {/* Info Status Kecil */}
          <div className="flex items-center justify-center gap-1.5 text-[9.5px] sm:text-[10.5px] text-slate-400 text-center">
            <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
            <span>Format gambar resolusi tinggi langsung tersimpan di galeri/file Anda</span>
          </div>
        </div>
      </div>
    </div>
  );
}
