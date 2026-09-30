"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { OvertimeFormData, WorkMode } from "@/types";
import { calcHours } from "@/lib/utils";

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

const inputCls = "w-full bg-white border border-[#c8dcea] text-[#1a3c5e] text-sm rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-[#3b9edd] transition-all placeholder:text-slate-300 shadow-sm";
const selectCls = "w-full appearance-none bg-white border border-[#c8dcea] text-[#1a3c5e] text-sm rounded-xl px-3.5 py-3 pr-9 focus:outline-none focus:ring-2 focus:ring-[#3b9edd] transition-all shadow-sm";

function Field({ label, children, error }: { label: string; children: React.ReactNode; error?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-500">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

export default function TambahLemburPage() {
  const router = useRouter();
  const [form, setForm] = useState<OvertimeFormData>({ date: "", workMode: "", startTime: "", endTime: "", description: "" });
  const [errors, setErrors] = useState<Partial<Record<keyof OvertimeFormData, string>>>({});
  const [loading, setLoading] = useState(false);

  const hours = form.startTime && form.endTime ? calcHours(form.startTime, form.endTime) : 0;

  const validate = () => {
    const e: typeof errors = {};
    if (!form.date) e.date = "Pilih tanggal";
    if (!form.workMode) e.workMode = "Pilih mode kerja";
    if (!form.startTime) e.startTime = "Isi jam mulai";
    if (!form.endTime) e.endTime = "Isi jam selesai";
    if (form.startTime && form.endTime && form.endTime <= form.startTime) e.endTime = "Jam tidak valid";
    if (!form.description.trim()) e.description = "Keterangan wajib diisi";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const result = await showConfirm("Konfirmasi Lembur", `<div class="text-left"><p><b>Mode:</b> ${form.workMode}</p><p><b>Durasi:</b> ${hours.toFixed(1)} jam</p></div>`);
    if (!result.isConfirmed) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1400));
    toast.success("Lembur berhasil diajukan!", { description: "Menunggu persetujuan atasan." });
    router.push("/lembur");
  };

  return (
    <div className="min-h-screen bg-[#ddeef8]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-full bg-[#e8f4fd] flex items-center justify-center active:scale-90 transition-transform">
            <svg width="15" height="15" fill="none" stroke="#1a7dc4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <h1 className="text-[#1a3c5e] font-bold text-base">Lembur</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-4 pb-24 space-y-4 animate-fade-in">
        <div className="bg-white rounded-2xl border border-[#c8e0f0] shadow-sm p-4 space-y-4">
          {/* Tanggal */}
          <Field label="Tanggal" error={errors.date}>
            <div className="relative">
              <input type="date" className={inputCls} value={form.date} onChange={(e) => { setForm({ ...form, date: e.target.value }); setErrors({ ...errors, date: undefined }); }} placeholder="dd/mm/yyy" />
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3b9edd] pointer-events-none" />
            </div>
          </Field>

          {/* Mode Kerja */}
          <Field label="Mode Kerja" error={errors.workMode}>
            <div className="relative">
              <select className={selectCls} value={form.workMode} onChange={(e) => { setForm({ ...form, workMode: e.target.value as WorkMode }); setErrors({ ...errors, workMode: undefined }); }}>
                <option value="">Pilih Mode Kerja</option>
                <option value="WFO">WFO – Work From Office</option>
                <option value="WFH">WFH – Work From Home</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3b9edd] pointer-events-none" />
            </div>
          </Field>

          {/* Jam */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Jam Mulai" error={errors.startTime}>
              <input type="time" className={inputCls} value={form.startTime} onChange={(e) => { setForm({ ...form, startTime: e.target.value }); setErrors({ ...errors, startTime: undefined }); }} />
            </Field>
            <Field label="Jam Selesai" error={errors.endTime}>
              <input type="time" className={inputCls} value={form.endTime} onChange={(e) => { setForm({ ...form, endTime: e.target.value }); setErrors({ ...errors, endTime: undefined }); }} />
            </Field>
          </div>

          {hours > 0 && (
            <div className="bg-[#e8f4fd] rounded-xl px-3 py-2 text-[#1a7dc4] text-xs font-semibold">
              ⏱️ Durasi lembur: {hours.toFixed(1)} jam
            </div>
          )}

          {/* Keterangan */}
          <Field label="Keterangan" error={errors.description}>
            <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Tambah Keterangan" value={form.description} onChange={(e) => { setForm({ ...form, description: e.target.value }); setErrors({ ...errors, description: undefined }); }} />
          </Field>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#3b9edd] to-[#1a6fb5] text-white font-bold text-sm rounded-2xl py-4 flex items-center justify-center gap-2 shadow-md shadow-blue-200 disabled:opacity-70 transition-all active:scale-[0.98]">
          {loading ? <><Loader2 size={17} className="animate-spin" />Mengajukan...</> : "Ajukan Lembur"}
        </button>
      </form>
    </div>
  );
}
