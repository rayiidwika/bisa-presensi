"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2, Calendar, Clock, Edit2 } from "lucide-react";
import { toast } from "sonner";
import type { LeaveFormData, LeaveType, Keperluan } from "@/types";
import { calcDays, formatDate, formatDateLong } from "@/lib/utils";
import IzinScheduleModal from "@/components/pengajuan/IzinScheduleModal";
import AttachmentUploader from "@/components/pengajuan/AttachmentUploader";

async function showConfirm(title: string, html: string) {
  const Swal = (await import("sweetalert2")).default;
  return Swal.fire({
    title,
    html,
    icon: "question",
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
];

const KEPERLUAN_MAP: Record<LeaveType, { value: Keperluan; label: string }[]> = {
  cuti: [
    { value: "Cuti Tahunan", label: "Cuti Tahunan" },
    { value: "Cuti Sakit", label: "Cuti Sakit" },
  ],
  izin: [
    { value: "Izin Keperluan Keluarga", label: "Izin Keperluan Keluarga" },
    { value: "Izin Pribadi", label: "Izin Pribadi" },
  ],
  sakit: [{ value: "Sakit", label: "Sakit" }],
  dinas: [],
};

const inputCls =
  "w-full bg-white border border-[#c8dcea] text-[#1a3c5e] text-sm rounded-xl px-3.5 py-3 focus:outline-none focus:ring-2 focus:ring-[#3b9edd] transition-all placeholder:text-slate-300 shadow-sm";
const selectCls =
  "w-full appearance-none bg-white border border-[#c8dcea] text-[#1a3c5e] text-sm rounded-xl px-3.5 py-3 pr-9 focus:outline-none focus:ring-2 focus:ring-[#3b9edd] transition-all shadow-sm";

function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}

export default function TambahPengajuanPage() {
  const router = useRouter();
  const [form, setForm] = useState<LeaveFormData>({
    type: "",
    keperluan: "",
    startDate: "",
    endDate: "",
    startTime: "08:00",
    endTime: "12:00",
    reason: "",
    attachment: null,
    attachmentType: "photo",
    attachmentLink: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LeaveFormData, string>>>({});
  const [loading, setLoading] = useState(false);

  // Modal Pop-up State khusus tipe Izin
  const [showIzinModal, setShowIzinModal] = useState(false);

  const isIzin = form.type === "izin";
  const isSakit = form.type === "sakit";
  const days =
    form.startDate && form.endDate ? calcDays(form.startDate, form.endDate) : 0;

  const validate = () => {
    const e: typeof errors = {};
    if (!form.type) e.type = "Pilih tipe pengajuan";

    if (isIzin) {
      // Validasi khusus Izin
      if (!form.startDate) e.startDate = "Jadwal keperluan izin wajib dipilih";
      if (!form.reason.trim()) e.reason = "Deskripsi wajib diisi";
    } else {
      // Validasi Cuti, Sakit & tipe lainnya (Keperluan sudah dihapus)
      if (!form.startDate) e.startDate = "Pilih tanggal mulai";
      if (!form.endDate) e.endDate = "Pilih tanggal selesai";
      if (form.startDate && form.endDate && form.endDate < form.startDate) {
        e.endDate = "Tanggal selesai tidak valid";
      }
      if (!form.reason.trim()) e.reason = "Deskripsi wajib diisi";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    let lampiranHtml = "";
    if (form.attachmentType === "link" && form.attachmentLink?.trim()) {
      lampiranHtml = `<p><b>Lampiran:</b> Tautan (${form.attachmentLink.trim()})</p>`;
    } else if (form.attachment) {
      const typeLabel = form.attachmentType === "video" ? "Video" : "Foto / File";
      lampiranHtml = `<p><b>Lampiran:</b> ${typeLabel} (${form.attachment.name})</p>`;
    }

    let infoHtml = "";
    if (isIzin) {
      const dateDisplay =
        form.startDate === form.endDate
          ? formatDateLong(form.startDate)
          : `${formatDate(form.startDate)} s.d ${formatDate(form.endDate)}`;
      const timeDisplay =
        form.startTime && form.endTime && form.startTime !== "--:--"
          ? `${form.startTime} - ${form.endTime} WIB`
          : "Seharian Penuh";

      infoHtml = `
        <div class="text-left text-sm space-y-1.5 mt-2">
          <p><b>Tipe:</b> Izin</p>
          <p><b>Tanggal:</b> ${dateDisplay}</p>
          <p><b>Jam:</b> ${timeDisplay}</p>
          ${lampiranHtml}
          <p class="text-gray-400 text-xs mt-1 pt-1 border-t border-slate-100">Pastikan data izin Anda sudah sesuai.</p>
        </div>
      `;
    } else {
      infoHtml = `
        <div class="text-left text-sm space-y-1 mt-2">
          <p><b>Tipe:</b> ${form.type === "sakit" ? "Sakit" : "Cuti"}</p>
          <p><b>Durasi:</b> ${days} hari</p>
          ${lampiranHtml}
          <p class="text-gray-400 text-xs mt-1 pt-1 border-t border-slate-100">Pastikan data pengajuan sudah benar.</p>
        </div>
      `;
    }

    const result = await showConfirm("Konfirmasi Pengajuan", infoHtml);
    if (!result.isConfirmed) return;

    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    toast.success("Pengajuan berhasil diajukan!", {
      description: "Tim HR akan segera memproses pengajuan Anda.",
    });
    router.push("/pengajuan");
  };

  const handleTypeChange = (newType: LeaveType | "") => {
    setForm((prev) => ({
      ...prev,
      type: newType,
      keperluan: newType === "cuti" ? "Cuti" : newType === "izin" ? "Izin Pribadi" : newType === "sakit" ? "Sakit" : "",
      attachment: null,
      attachmentLink: "",
      attachmentType: "photo",
    }));
    setErrors((prev) => ({ ...prev, type: undefined, keperluan: undefined, startDate: undefined }));
  };

  // Helper tampilan hasil pemilih jadwal izin
  const formattedIzinDate =
    form.startDate && form.endDate
      ? form.startDate === form.endDate
        ? formatDateLong(form.startDate)
        : `${formatDate(form.startDate)} – ${formatDate(form.endDate)} (${calcDays(form.startDate, form.endDate)} Hari)`
      : "";

  const formattedIzinTime =
    form.startTime && form.endTime && form.startTime !== "--:--"
      ? `${form.startTime} – ${form.endTime} WIB`
      : "";

  return (
    <div className="min-h-screen bg-[#ddeef8]">
      {/* Header */}
      <div className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-full bg-[#e8f4fd] flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
            aria-label="Kembali"
          >
            <svg
              width="15"
              height="15"
              fill="none"
              stroke="#1a7dc4"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              viewBox="0 0 24 24"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="text-[#1a3c5e] font-bold text-base">Pengajuan</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-4 pb-24 space-y-4 animate-fade-in">
        <div className="bg-white rounded-2xl border border-[#c8e0f0] shadow-sm p-4 space-y-4">
          {/* 1. Field TYPE */}
          <Field label="Type" error={errors.type}>
            <div className="relative">
              <select
                className={selectCls}
                value={form.type}
                onChange={(e) => handleTypeChange(e.target.value as LeaveType)}
              >
                <option value="">Pilih Type</option>
                {LEAVE_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3b9edd] pointer-events-none"
              />
            </div>
          </Field>

          {/* ══════════════ JIKA TYPE === 'IZIN' ══════════════ */}
          {isIzin ? (
            <>
              {/* Field 2: KEPERLUAN IZIN (1 Baris dengan Icon Kalender -> Buka Pop-up) */}
              <Field label="Keperluan Izin" error={errors.startDate}>
                {!form.startDate ? (
                  /* State Belum Memilih: 1 Baris dengan Icon Kalender */
                  <div
                    onClick={() => setShowIzinModal(true)}
                    className="w-full bg-white border border-[#c8dcea] hover:border-[#3b9edd] rounded-xl px-3.5 py-3 flex items-center justify-between cursor-pointer transition-all shadow-xs group"
                  >
                    <div className="flex items-center gap-2.5 text-slate-400 group-hover:text-slate-600 transition-colors">
                      <Calendar size={18} className="text-[#3b9edd]" />
                      <span className="text-sm font-medium text-slate-400">
                        Pilih tanggal & jam izin...
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1a7dc4] bg-[#e8f4fd] px-2.5 py-1 rounded-lg">
                      <span>Pilih</span>
                    </div>
                  </div>
                ) : (
                  /* State Sudah Memilih: Hasil 1 Baris Elegan dengan Icon Kalender & Jam */
                  <div
                    onClick={() => setShowIzinModal(true)}
                    className="w-full bg-[#f4f9fd] hover:bg-[#ebf5fc] border border-[#b9d9ee] rounded-xl px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-all shadow-xs group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-white border border-[#b9d9ee] text-[#1a7dc4] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                        <Calendar size={16} strokeWidth={2.2} />
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
                        <span className="text-xs font-bold text-slate-800 truncate">
                          {formattedIzinDate}
                        </span>
                        {formattedIzinTime ? (
                          <div className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1a7dc4] bg-white border border-[#c8e2f4] px-2 py-0.5 rounded-md shadow-2xs">
                            <Clock size={11} strokeWidth={2.5} />
                            <span>{formattedIzinTime}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-2xs">
                            <span>Seharian Penuh</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-[#1a7dc4] bg-white px-2 py-1 rounded-lg border border-[#c8e2f4] shadow-2xs shrink-0 group-hover:bg-[#1a7dc4] group-hover:text-white transition-colors">
                      <Edit2 size={11} strokeWidth={2.4} />
                      <span>Ubah</span>
                    </div>
                  </div>
                )}
              </Field>

              {/* Field 3: DESKRIPSI (Pengganti Alasan Khusus Izin) */}
              <Field label="Deskripsi" error={errors.reason}>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  placeholder="Masukkan deskripsi izin Anda..."
                  value={form.reason}
                  onChange={(e) => {
                    setForm({ ...form, reason: e.target.value });
                    setErrors({ ...errors, reason: undefined });
                  }}
                />
              </Field>
            </>
          ) : (
            /* ══════════════ UNTUK SEMUA TIPE SELAIN IZIN (CUTI, SAKIT, & BELUM PILIH) ══════════════ */
            <>
              {/* Field Keperluan DIHAPUS sesuai permintaan */}

              {/* Dates: Tanggal Mulai & Selesai */}
              <div className="grid grid-cols-2 gap-3">
                <Field label="Tanggal Mulai" error={errors.startDate}>
                  <input
                    type="date"
                    className={inputCls}
                    value={form.startDate}
                    onChange={(e) => {
                      setForm({ ...form, startDate: e.target.value });
                      setErrors({ ...errors, startDate: undefined });
                    }}
                  />
                </Field>
                <Field label="Tanggal Selesai" error={errors.endDate}>
                  <input
                    type="date"
                    className={inputCls}
                    value={form.endDate}
                    min={form.startDate}
                    onChange={(e) => {
                      setForm({ ...form, endDate: e.target.value });
                      setErrors({ ...errors, endDate: undefined });
                    }}
                  />
                </Field>
              </div>

              {days > 0 && (
                <div className="bg-[#e8f4fd] rounded-xl px-3 py-2 text-[#1a7dc4] text-xs font-semibold">
                  📅 Durasi: {days} hari
                </div>
              )}

              {/* Alasan diganti teksnya menjadi Deskripsi untuk semua tipe */}
              <Field label="Deskripsi" error={errors.reason}>
                <textarea
                  className={`${inputCls} resize-none`}
                  rows={3}
                  placeholder={
                    isSakit
                      ? "Masukkan deskripsi sakit Anda..."
                      : form.type === "cuti"
                      ? "Masukkan deskripsi cuti Anda..."
                      : "Masukkan deskripsi pengajuan Anda..."
                  }
                  value={form.reason}
                  onChange={(e) => {
                    setForm({ ...form, reason: e.target.value });
                    setErrors({ ...errors, reason: undefined });
                  }}
                />
              </Field>
            </>
          )}

          {/* ══════════════ LAMPIRAN (OPSIONAL) ══════════════ */}
          <Field label="Lampiran (Opsional)">
            <AttachmentUploader
              attachmentType={form.attachmentType || "photo"}
              onTypeChange={(type) =>
                setForm((prev) => ({ ...prev, attachmentType: type }))
              }
              fileValue={form.attachment}
              onFileChange={(file) =>
                setForm((prev) => ({ ...prev, attachment: file }))
              }
              linkValue={form.attachmentLink || ""}
              onLinkChange={(link) =>
                setForm((prev) => ({ ...prev, attachmentLink: link }))
              }
            />
          </Field>
        </div>

        {/* Tombol Ajukan */}
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

      {/* Pop-up Modal Khusus Pemilihan Tanggal & Jam Izin */}
      <IzinScheduleModal
        isOpen={showIzinModal}
        onClose={() => setShowIzinModal(false)}
        initialStartDate={form.startDate}
        initialEndDate={form.endDate}
        initialStartTime={form.startTime}
        initialEndTime={form.endTime}
        onSave={(data) => {
          setForm((prev) => ({
            ...prev,
            startDate: data.startDate,
            endDate: data.endDate,
            startTime: data.startTime,
            endTime: data.endTime,
          }));
          setErrors((prev) => ({ ...prev, startDate: undefined, endDate: undefined }));
        }}
      />
    </div>
  );
}
