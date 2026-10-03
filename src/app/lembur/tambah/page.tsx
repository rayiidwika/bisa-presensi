"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { OvertimeFormData, WorkMode } from "@/types";
import { calcHours } from "@/lib/utils";
import { addNotification } from "@/lib/notifications";

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
    customClass: {
      popup: "!w-[92vw] sm:!w-[420px] !max-w-[420px] rounded-3xl p-6 shadow-2xl",
      confirmButton: "rounded-xl font-bold py-2.5 px-5 text-sm shadow-sm",
      cancelButton: "rounded-xl font-medium py-2.5 px-4 text-sm",
    },
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

  const [autoApprove, setAutoApprove] = useState(true);

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
    const result = await showConfirm(
      "Konfirmasi Lembur",
      `<div class="text-left space-y-1 text-xs text-slate-700">
        <p><b>Tanggal:</b> ${form.date}</p>
        <p><b>Mode Kerja:</b> ${form.workMode}</p>
        <p><b>Jam Lembur:</b> ${form.startTime} - ${form.endTime} (${hours.toFixed(1)} Jam)</p>
        <p><b>Status:</b> ${autoApprove ? "<span class='text-emerald-600 font-bold'>Langsung Disetujui (Clock In Aktif)</span>" : "<span class='text-amber-600 font-bold'>Menunggu Persetujuan Atasan</span>"}</p>
      </div>`
    );
    if (!result.isConfirmed) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    const newId = `OT-USR-${Date.now().toString().slice(-4)}`;
    const newRequest = {
      id: newId,
      date: form.date,
      workMode: form.workMode,
      startTime: form.startTime,
      endTime: form.endTime,
      description: form.description.trim(),
      status: autoApprove ? "approved" : "pending",
      totalHours: Number(hours.toFixed(1)),
      createdAt: new Date().toISOString(),
      approvalTimeline: autoApprove
        ? [
            { id: `AT-${newId}-1`, role: "Team Lead", approverName: "Budi Santoso", status: "approved", note: "Disetujui untuk lembur", timestamp: new Date().toISOString() },
            { id: `AT-${newId}-2`, role: "HR Manager", approverName: "Siti Rahayu", status: "approved", note: "Terverifikasi sistem", timestamp: new Date().toISOString() },
          ]
        : [
            { id: `AT-${newId}-1`, role: "Team Lead", approverName: "Budi Santoso", status: "waiting" },
            { id: `AT-${newId}-2`, role: "HR Manager", approverName: "Siti Rahayu", status: "waiting" },
          ],
    };

    if (typeof window !== "undefined") {
      try {
        const existing = JSON.parse(localStorage.getItem("bisa_custom_overtime_requests") || "[]");
        localStorage.setItem("bisa_custom_overtime_requests", JSON.stringify([newRequest, ...existing]));

        if (autoApprove) {
          localStorage.setItem("bisa_lembur_active_id", newId);
          localStorage.removeItem("bisa_lembur_completed");
          localStorage.removeItem("bisa_lembur_checkin_time");
          localStorage.removeItem("bisa_lembur_checkout_time");

          addNotification({
            type: "lembur_approved",
            title: "✅ Pengajuan Lembur Disetujui",
            message: `Pengajuan lembur Anda untuk tanggal ${form.date} (${form.startTime} - ${form.endTime} WIB) telah disetujui. Kartu presensi Clock In & Out kini aktif.`,
            statusBadge: "approved",
            meta: {
              requestType: "lembur",
              category: `Lembur ${form.workMode}`,
              approverName: "Budi Santoso & Siti Rahayu",
              targetUrl: "/lembur",
            },
          });
        } else {
          addNotification({
            type: "lembur_submitted",
            title: "⏳ Pengajuan Lembur Terkirim",
            message: `Pengajuan lembur Anda untuk tanggal ${form.date} (${form.startTime} - ${form.endTime} • ${hours.toFixed(1)} jam) telah terkirim dan menunggu persetujuan atasan.`,
            statusBadge: "pending",
            meta: {
              requestType: "lembur",
              category: `Lembur ${form.workMode}`,
              targetUrl: "/lembur",
            },
          });
        }

        window.dispatchEvent(new Event("bisa_lembur_change"));
        window.dispatchEvent(new Event("bisa_notification_change"));
      } catch (err) {
        console.error(err);
      }
    }

    if (autoApprove) {
      toast.success("Pengajuan lembur disetujui!", {
        description: "Presensi lembur (Clock In & Clock Out) telah aktif di halaman Lembur.",
      });
    } else {
      toast.success("Lembur berhasil diajukan!", {
        description: "Status pending di Riwayat Lembur. Anda dapat menyimulasikan persetujuan di detail lembur.",
      });
    }

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
          <h1 className="text-[#1a3c5e] font-bold text-base">Ajukan Lembur Mandiri</h1>
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
          <Field label="Keterangan Pekerjaan Lembur" error={errors.description}>
            <textarea className={`${inputCls} resize-none`} rows={3} placeholder="Contoh: Penyelesaian deployment fitur modul analitik..." value={form.description} onChange={(e) => { setForm({ ...form, description: e.target.value }); setErrors({ ...errors, description: undefined }); }} />
          </Field>

          {/* Toggle Opsi Simulasi Persetujuan Langsung */}
          <div className="pt-2 border-t border-slate-100">
            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="w-4 h-4 rounded text-[#156bb8] mt-0.5 cursor-pointer accent-[#156bb8]"
              />
              <div className="text-xs">
                <span className="font-bold text-emerald-800 block">
                  Simulasikan Langsung Disetujui Atasan
                </span>
                <span className="text-emerald-600 text-[11px] leading-tight block mt-0.5">
                  Jika dicentang, kartu presensi <b>Clock In & Clock Out</b> langsung aktif di halaman Lembur setelah diajukan.
                </span>
              </div>
            </label>
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-[#3b9edd] to-[#1a6fb5] text-white font-bold text-sm rounded-2xl py-4 flex items-center justify-center gap-2 shadow-md shadow-blue-200 disabled:opacity-70 transition-all active:scale-[0.98] cursor-pointer">
          {loading ? <><Loader2 size={17} className="animate-spin" />Memproses...</> : "Ajukan Lembur"}
        </button>
      </form>
    </div>
  );
}
