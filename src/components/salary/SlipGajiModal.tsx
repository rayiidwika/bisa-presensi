"use client";

import React, { useRef, useState, forwardRef } from "react";
import {
  X,
  Download,
  CheckCircle2,
  Wallet,
  Database,
  Banknote,
  FileText,
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
// 1. DOKUMEN SLIP GAJI PAPER (KANVAS 1254 x 1254 — PERSIS GAMBAR 1:1)
// ══════════════════════════════════════════════════════════════════════════
export interface SlipGajiPaperProps {
  data?: SlipGajiData;
  periode?: string;
}

/** Ukuran kanvas asli slip gaji (sama persis dengan desain di folder New). */
export const SLIP_CANVAS_SIZE = 1254;

const CONTENT_LEFT = 57;
const CONTENT_WIDTH = 1140;

const useIsoLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

// ── Tabel item (Penerimaan / Pengurangan) ─────────────────────────────────
interface SlipTableProps {
  top: number;
  height: number;
  title: string;
  icon: React.ReactNode;
  items: { no: number; nama: string; jumlah: number }[];
  totalLabel: string;
  total: number;
}

function SlipTable({ top, height, title, icon, items, totalLabel, total }: SlipTableProps) {
  return (
    <div
      className="absolute"
      style={{ left: CONTENT_LEFT, top, width: CONTENT_WIDTH, height }}
    >
      <div className="flex h-full flex-col overflow-hidden rounded-[10px] border border-[#cfe3f5] bg-white shadow-[0_2px_6px_rgba(23,86,150,0.06)]">
        {/* Header */}
        <div
          className="relative flex h-[43px] shrink-0 items-center text-white"
          style={{
            paddingLeft: 25,
            paddingRight: 17,
            background:
              "linear-gradient(96deg,#1b62ad 0%,#2a86dd 58%,#1368bb 100%)",
          }}
        >
          <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-white text-[#1e6fb8] shadow-[0_1px_3px_rgba(0,0,0,0.18)]">
            {icon}
          </div>
          <span className="ml-[37px] text-[22px] font-extrabold uppercase leading-none tracking-[0.04em]">
            {title}
          </span>
          <span className="absolute right-[76px] top-1/2 -translate-y-1/2 text-[17px] font-extrabold uppercase leading-none tracking-[0.03em]">
            JUMLAH
          </span>
        </div>

        {/* Rows */}
        <div className="flex flex-1 flex-col">
          {items.map((item, idx) => (
            <div
              key={item.no}
              className={`flex flex-1 items-center ${
                idx % 2 === 1 ? "bg-[#f4f9fd]" : "bg-white"
              }`}
            >
              <div className="ml-[1px] flex h-[27px] w-[38px] shrink-0 items-center justify-center rounded-[6px] bg-[#e8f2fc] text-[16px] font-semibold text-[#5c7a99]">
                {item.no}
              </div>
              <div className="min-w-0 flex-1 truncate pl-[61px] text-[18px] text-[#33475b]">
                {item.nama}
              </div>
              <div className="w-[251px] shrink-0 border-l border-[#e2eef8] pr-[26px] text-right text-[18px] font-semibold text-[#1f2d3d]">
                {formatRupiah(item.jumlah)}
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="flex h-[40px] shrink-0 items-center bg-[#d9ebfa] font-bold text-[#1b4f80]">
            <div className="flex-1 pl-[100px] text-[21px]">{totalLabel}</div>
            <div className="w-[251px] shrink-0 border-l border-[#c7dff4] pr-[26px] text-right text-[21px]">
              {formatRupiah(total)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
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

    // ── Auto-scale: kanvas 1254px diskalakan agar pas dengan lebar container ──
    const wrapRef = useRef<HTMLDivElement | null>(null);
    const [scale, setScale] = useState<number>(0);

    useIsoLayoutEffect(() => {
      const el = wrapRef.current;
      if (!el) return;
      const measure = () => {
        const w = el.clientWidth;
        setScale(w > 0 ? w / SLIP_CANVAS_SIZE : 1);
      };
      measure();
      if (typeof ResizeObserver === "undefined") return;
      const ro = new ResizeObserver(measure);
      ro.observe(el);
      return () => ro.disconnect();
    }, []);

    const activeScale = scale > 0 ? scale : 1;

    return (
      <div
        ref={wrapRef}
        className="w-full"
        style={{ height: SLIP_CANVAS_SIZE * activeScale }}
      >
        <div
          ref={ref}
          className="relative overflow-hidden bg-[#fbfdff] font-sans text-slate-800 select-none"
          style={{
            width: SLIP_CANVAS_SIZE,
            height: SLIP_CANVAS_SIZE,
            transform: `scale(${activeScale})`,
            transformOrigin: "top left",
          }}
        >
          {/* ── Ornamen gelombang biru (pojok kanan atas & kiri bawah) ── */}
          <svg
            viewBox="0 0 1254 1254"
            className="pointer-events-none absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="slipWaveTop1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#7dd3fc" />
                <stop offset="100%" stopColor="#0ea5e9" />
              </linearGradient>
              <linearGradient id="slipWaveTop2" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#075985" />
              </linearGradient>
              <linearGradient id="slipWaveBot1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#bae6fd" />
                <stop offset="100%" stopColor="#38bdf8" />
              </linearGradient>
              <linearGradient id="slipWaveBot2" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#0284c7" />
                <stop offset="100%" stopColor="#075985" />
              </linearGradient>
            </defs>
            <path
              d="M1000 0 C1090 90 1170 130 1254 235 L1254 0 Z"
              fill="url(#slipWaveTop1)"
              opacity="0.55"
            />
            <path
              d="M1118 0 C1175 70 1215 115 1254 178 L1254 0 Z"
              fill="url(#slipWaveTop2)"
            />
            <path
              d="M0 1254 C55 1180 130 1120 260 1078 L0 1078 Z"
              fill="url(#slipWaveBot1)"
              opacity="0.55"
            />
            <path
              d="M0 1254 C35 1200 90 1160 175 1140 L0 1140 Z"
              fill="url(#slipWaveBot2)"
            />
          </svg>

          {/* ── Judul ── */}
          <div className="absolute left-0 right-0 top-[21px] text-center">
            <h1 className="text-[58px] font-black uppercase leading-none tracking-normal text-[#123c69]">
              SLIP GAJI
            </h1>
          </div>
          <div className="absolute left-1/2 top-[87px] h-[6px] w-[123px] -translate-x-1/2 rounded-full bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#38bdf8]" />

          {/* ── Kartu utama slip ── */}
          <div className="absolute left-[48px] top-[97px] h-[1134px] w-[1158px] rounded-[14px] border border-[#e8f2fb] bg-white shadow-[0_10px_30px_rgba(21,90,160,0.08)]" />

          {/* ── Logo & alamat perusahaan ── */}
          <div className="absolute" style={{ left: 79, top: 121, width: 120 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/app-logo.png"
              alt="Logo Bisa Media"
              style={{ width: 88, height: 88, objectFit: "contain", marginLeft: 16 }}
            />
            <div className="mt-[6px] whitespace-nowrap text-center text-[15px] font-extrabold uppercase leading-none tracking-[0.06em] text-[#123c69]">
              BISA MEDIA
            </div>
          </div>

          <div className="absolute" style={{ left: 226, top: 132, width: 470 }}>
            <h2 className="text-[21px] font-extrabold uppercase leading-none tracking-[0.01em] text-[#1b3f6d]">
              PT BISA MEDIA GRUP
            </h2>
            <p className="mt-[14px] text-[18px] leading-[25px] text-[#33475b]">
              Jl. Cisalak No.47B, Sukamanah, Kec. Cipedes,
              <br />
              Kab. Tasikmalaya, Jawa Barat 46133
            </p>
          </div>

          {/* Garis pemisah perusahaan & identitas */}
          <div
            className="absolute w-px bg-[#dbe7f3]"
            style={{ left: 712, top: 126, height: 118 }}
          />

          {/* ── Kotak identitas karyawan ── */}
          <div
            className="absolute rounded-[10px] bg-[#eaf4fd] px-[22px] pb-[11px] pt-[15px]"
            style={{ left: 740, top: 105, width: 457, height: 152 }}
          >
            <div className="flex h-full flex-col justify-between text-[18px] leading-none">
              <div className="flex items-center">
                <span className="w-[116px] shrink-0 font-bold text-[#1b4f80]">Periode</span>
                <span className="w-[34px] shrink-0 text-[#8aa0b5]">:</span>
                <span className="flex-1 text-[#33475b]">{periodeBulan}</span>
                <span className="pr-[38px] text-[#33475b]">{periodeTahun}</span>
              </div>
              <div className="flex items-center">
                <span className="w-[116px] shrink-0 font-bold text-[#1b4f80]">ID</span>
                <span className="w-[34px] shrink-0 text-[#8aa0b5]">:</span>
                <span className="text-[#33475b]">{activeData.idKaryawan}</span>
              </div>
              <div className="flex items-center">
                <span className="w-[116px] shrink-0 font-bold text-[#1b4f80]">Karyawan</span>
                <span className="w-[34px] shrink-0 text-[#8aa0b5]">:</span>
                <span className="text-[#33475b]">{activeData.namaKaryawan}</span>
              </div>
              <div className="flex items-center">
                <span className="w-[116px] shrink-0 font-bold text-[#1b4f80]">Jabatan</span>
                <span className="w-[34px] shrink-0 text-[#8aa0b5]">:</span>
                <span className="text-[#33475b]">{activeData.jabatan}</span>
              </div>
              <div className="flex items-center">
                <span className="w-[116px] shrink-0 font-bold text-[#1b4f80]">Status</span>
                <span className="w-[34px] shrink-0 text-[#8aa0b5]">:</span>
                <span className="text-[#33475b]">{activeData.status}</span>
              </div>
            </div>
          </div>

          {/* ── Tabel Penerimaan ── */}
          <SlipTable
            top={273}
            height={361}
            title="PENERIMAAN"
            icon={<Wallet size={20} strokeWidth={2.2} />}
            items={activeData.penerimaan}
            totalLabel="Total Penghasilan Bruto"
            total={totalBruto}
          />

          {/* ── Tabel Pengurangan ── */}
          <SlipTable
            top={649}
            height={281}
            title="PENGURANGAN"
            icon={<Database size={19} strokeWidth={2.2} />}
            items={activeData.pengurangan}
            totalLabel="Total Pengurangan"
            total={totalPengurangan}
          />

          {/* ── Take Home Pay ── */}
          <div
            className="absolute flex items-center rounded-[10px] px-[25px] text-white shadow-[0_3px_10px_rgba(15,88,160,0.18)]"
            style={{
              left: CONTENT_LEFT,
              top: 943,
              width: CONTENT_WIDTH,
              height: 57,
              background:
                "linear-gradient(96deg,#1465b2 0%,#2a86dd 58%,#1266b8 100%)",
            }}
          >
            <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-white/25">
              <Banknote size={20} strokeWidth={2.1} />
            </div>
            <span className="ml-[45px] text-[26px] font-black uppercase leading-none tracking-normal">
              TAKE HOME PAY
            </span>
            <div
              className="absolute top-1/2 h-[34px] w-[2px] -translate-y-1/2 bg-white/50"
              style={{ left: 890 }}
            />
            <span className="ml-auto text-[38px] font-black leading-none tracking-[0.01em]">
              {formatRupiah(takeHomePay)}
            </span>
          </div>

          {/* ── Terbilang ── */}
          <div
            className="absolute flex items-center overflow-hidden rounded-[8px] border border-[#dbe9f7] bg-[#eef6fd]"
            style={{ left: CONTENT_LEFT, top: 1015, width: CONTENT_WIDTH, height: 42 }}
          >
            <div className="flex h-full w-[133px] shrink-0 items-center gap-[10px] bg-[#cfe4f7] px-[16px] text-[#16456f]">
              <span className="text-[20px] font-black leading-none">#</span>
              <span className="text-[18px] font-bold leading-none">Terbilang</span>
            </div>
            <span className="ml-[56px] text-[17px] italic leading-none text-[#33475b]">
              {activeData.terbilang}
            </span>
          </div>

          {/* ── Tanda tangan / pengesahan ── */}
          <div
            className="absolute rounded-[10px] border border-[#e3eef8] bg-white"
            style={{ left: CONTENT_LEFT, top: 1070, width: CONTENT_WIDTH, height: 152 }}
          >
            {/* Kota & tanggal (kanan atas) */}
            <div className="absolute right-[129px] top-[10px] flex items-center gap-[38px] text-[17px] leading-none text-[#33475b]">
              <span>{activeData.kotaTtd || "Tasikmalaya"}</span>
              <span>{periodeBulan}</span>
              <span>{periodeTahun}</span>
            </div>

            {/* Garis pembatas vertikal tengah */}
            <div className="absolute bottom-[12px] left-1/2 top-[12px] w-px -translate-x-1/2 bg-[#e6eef7]" />

            {/* Kolom kiri: Penerima */}
            <div className="absolute bottom-[3px] left-0 right-1/2 top-[40px] flex flex-col items-center pr-[34px]">
              <span className="text-[18px] leading-none text-[#33475b]">Penerima</span>
              <div className="mt-auto w-[268px] border-t border-[#33475b] pt-[6px] text-center text-[19px] font-semibold leading-none text-[#23303d]">
                {activeData.namaPenerima}
              </div>
            </div>

            {/* Kolom kanan: Perusahaan + tanda tangan */}
            <div className="absolute bottom-[3px] left-1/2 right-0 top-[40px] flex flex-col items-center pl-[54px]">
              <span className="translate-x-[24px] text-[18px] leading-none text-[#33475b]">
                PT BISA MEDIA GRUP
              </span>

              <div className="mt-[6px] h-[62px] w-[110px]">
                <svg
                  viewBox="14 4 86 78"
                  preserveAspectRatio="none"
                  className="h-full w-full fill-none stroke-current text-[#112338]"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path
                    d="M 38 48 C 22 42, 18 26, 36 24 C 54 22, 68 32, 62 48 C 58 57, 46 54, 38 48 Z"
                    strokeWidth="2.4"
                  />
                  <path d="M 52 18 L 52 70" strokeWidth="2.8" />
                  <path d="M 62 12 L 62 74" strokeWidth="2.8" />
                  <path
                    d="M 65 42 Q 68 36 70 42 Q 73 36 75 41 Q 78 37 80 40"
                    strokeWidth="2.0"
                  />
                  <path d="M 67 47 L 78 47" strokeWidth="2.1" />
                  <path
                    d="M 80 44 C 79 24, 82 8, 86 7 C 88.5 6, 88 18, 87 32 L 87 74"
                    strokeWidth="2.7"
                  />
                  <circle cx="94" cy="51" r="1.6" className="fill-current stroke-none" />
                </svg>
              </div>

              <div className="mt-auto w-[240px] border-t border-[#33475b] pt-[6px] text-center text-[19px] font-semibold leading-none text-[#23303d]">
                {activeData.namaAtasan}
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
    width: SLIP_CANVAS_SIZE,
    height: SLIP_CANVAS_SIZE,
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    cacheBust: true,
    style: {
      transform: "none",
      transformOrigin: "top left",
    },
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
      <div className="relative w-full max-w-lg sm:max-w-2xl bg-white rounded-[24px] sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-scale-up flex flex-col max-h-[90vh] sm:max-h-[92vh]">
        
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
