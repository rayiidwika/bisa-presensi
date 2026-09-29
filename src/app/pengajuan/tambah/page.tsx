"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { LeaveFormData, LeaveType, Keperluan } from "@/types";
import { calcDays } from "@/lib/utils";

async function showConfirm(title: string, html: string) {
  const Swal = (await import("sweetalert2")).default;
  return Swal.fire({
    title, html, icon: "question",
    showCancelButton: true,
    confirmButtonText: "Ya, Ajukan",
    cancelButtonText: "Batal",
    confirmButtonColor: "#1a7dc4",
    cancelButtonColor: "#94a3b8",
    reverseButtons: true,
  });
}

const LEAVE_TYPES: { value: LeaveType; label: string }[] = [
  { value: "cuti", label: "Cuti" },
  { value: "izin", label: "Izin" },
  { value: "sakit", label: "Sakit" },
  { value: "dinas", label: "Dinas Luar" },
];
const KEPERLUAN_MAP: Record<LeaveType, { value: Keperluan; label: string }[]> = {
  cuti:  [{ value: "Cuti Tahunan", label: "Cuti Tahunan" }, { value: "Cuti Sakit", label: "Cuti Sakit" }],
  izin:  [{ value: "Izin Keperluan Keluarga", label: "Izin Keperluan Keluarga" }, { value: "Izin Pribadi", label: "Izin Pribadi" }],
  sakit: [{ value: "Sakit", label: "Sakit" }],
  dinas: [{ value: "Dinas Luar", label: "Dinas Luar" }],
};

const inputCls = "w-full bg-white border border-[#c8dcea] text-[#1a3c5e] text-sm rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-[#3b9edd] transition-all placeholder:text-slate-300 shadow-sm";
const selectCls = "w-full appearance-none bg-white border border-[#c8dcea] text-[#1a3c5e] text-sm rounded-xl px-3.5 py-3 pr-9 focus:outline-none focus:ring-2 focus:ring-[#3b9edd] transition-all shadow-sm";

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function TambahPengajuanPage() {
  const router = useRouter();
  const [form, setForm] = useState<LeaveFormData>({ type: "", keperluan: "", startDate: "", endDate: "", reason: "", attachment: null });
  const [errors, setErrors] = useState<Partial<Record<keyof LeaveFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  const keperluanOptions = form.type ? KEPERLUAN_MAP[form.type] : [];
  const days = form.startDate && form.endDate ? calcDays(form.startDate, form.endDate) : 0;

  const validate = () => {
    const e: typeof errors = {};
    if (!form.type) e.type = "Pilih tipe";
    if (!form.keperluan) e.keperluan = "Pilih keperluan";
    if (!form.startDate) e.startDate = "Pilih tanggal";
    if (!form.endDate) e.endDate = "Pilih tanggal";
    if (form.startDate && form.endDate && form.endDate < form.startDate) e.endDate = "Tanggal tidak valid";
    if (!form.reason.trim()) e.reason = "Alasan wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await showConfirm(
      "Konfirmasi Pengajuan",
      `<div class="text-left"><p><b>Tipe:</b> ${form.type}</p><p><b>Durasi:</b> ${days} hari</p><p class="text-gray-400 text-xs mt-1">Pastikan data sudah benar.</p></div>`
    );
    if (!result.isConfirmed) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    toast.success("Pengajuan berhasil diajukan!", { description: "Tim HR akan segera memproses." });
    router.push("/pengajuan");
  };

  return (
    <div className="min-h-screen bg-[#ddeef8]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-[#e8f4fd] flex items-center justify-center active:scale-90 transition-transform">
            <svg width="15" height="15" fill="none" stroke="#1a7dc4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <h1 className="text-[#1a3c5e] font-bold text-base">Pengajuan</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-4 pb-8 space-y-4 animate-fade-in">
        <div className="bg-white rounded-2xl border border-[#c8e0f0] shadow-sm p-4 space-y-4">
          {/* Type */}
          <Field label="Type" error={errors.type}>
            <div className="relative">
              <select className={selectCls} value={form.type} onChange={(e) => { setForm({ ...form, type: e.target.value as LeaveType, keperluan: "" }); setErrors({ ...errors, type: undefined }); }}>
                <option value="">Pilih Type</option>
                {LEAVE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3b9edd] pointer-events-none" />
            </div>
          </Field>

          {/* Keperluan */}
          <Field label="Keperluan" error={errors.keperluan}>
            <input
              type="text"
              className={inputCls}
              placeholder="Masukkan keperluan pengajuan Anda..."
              value={form.keperluan}
              onChange={(e) => {
                setForm({ ...form, keperluan: e.target.value });
                setErrors({ ...errors, keperluan: undefined });
              }}
            />
          </Field>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tanggal Mulai" error={errors.startDate}>
              <input type="date" className={inputCls} value={form.startDate} onChange={(e) => { setForm({ ...form, startDate: e.target.value }); setErrors({ ...errors, startDate: undefined }); }} />
            </Field>
            <Field label="Tanggal Selesai" error={errors.endDate}>
              <input type="date" className={inputCls} value={form.endDate} min={form.startDate} onChange={(e) => { setForm({ ...form, endDate: e.target.value }); setErrors({ ...errors, endDate: undefined }); }} />
            </Field>
          </div>

          {days > 0 && (
            <div className="bg-[#e8f4fd] rounded-xl px-3 py-2 text-[#1a7dc4] text-xs font-semibold">
              📅 Durasi: {days} hari
            </div>
          )}

          {/* Alasan */}
          <Field label="Alasan" error={errors.reason}>
            <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Masukkan Alasan Anda" value={form.reason} onChange={(e) => { setForm({ ...form, reason: e.target.value }); setErrors({ ...errors, reason: undefined }); }} />
          </Field>

          {/* Lampiran */}
          <Field label="Lampiran (Opsional)">
            <label className="block cursor-pointer">
              <div className="border-2 border-dashed border-[#c8dcea] rounded-2xl p-6 flex flex-col items-center gap-2 bg-[#f0f8ff] hover:bg-[#e8f4fd] transition-colors">
                <svg width="48" height="48" viewBox="0 0 80 80" fill="none">
                  <circle cx="40" cy="40" r="40" fill="#ddeef8"/>
                  <path d="M28 50c0-4 2-7 6-9l6-3 6 3c4 2 6 5 6 9" stroke="#3b9edd" strokeWidth="2.5" strokeLinecap="round"/>
                  <circle cx="40" cy="32" r="7" stroke="#3b9edd" strokeWidth="2.5"/>
                </svg>
                <p className="text-xs text-slate-500 font-medium">{fileName || "Unggah Berkas / Lampiran"}</p>
              </div>
              <input type="file" className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setForm({ ...form, attachment: f }); setFileName(f.name); } }} />
            </label>
          </Field>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#1a7dc4] to-[#156bb8] text-white font-bold text-sm rounded-2xl py-3.5 flex items-center justify-center gap-2 shadow-md shadow-[#156bb8]/30 disabled:opacity-70 transition-all active:scale-[0.98] cursor-pointer"
        >
          {loading ? (
            <>
              <Loader2 size={17} className="animate-spin" /> Mengajukan...
            </>
          ) : (
            "Ajukan"
          )}
        </button>
      </form>
    </div>
  );
}
