"use client";

import { useState, useEffect, useMemo } from "react";
import {
  X,
  Bell,
  Check,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  AppNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
  acceptLemburInstruction,
  declineLemburInstruction,
  addNotification,
  resetNotificationsToDefault,
} from "@/lib/notifications";

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabFilter = "all" | "instruction" | "pengajuan" | "lembur";

export default function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeTab, setActiveTab] = useState<TabFilter>("all");
  const [selectedNotif, setSelectedNotif] = useState<AppNotification | null>(null);

  const loadData = () => {
    setNotifications(getNotifications());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleUpdate = () => loadData();
    window.addEventListener("bisa_notification_change", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("bisa_notification_change", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const instructionCount = useMemo(() => {
    return notifications.filter(
      (n) => n.type === "lembur_instruction" && n.meta?.instructionStatus !== "accepted"
    ).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeTab === "instruction") return item.type === "lembur_instruction";
      if (activeTab === "pengajuan") {
        return (
          item.type === "pengajuan_approved" ||
          item.type === "pengajuan_rejected" ||
          item.type === "pengajuan_submitted"
        );
      }
      if (activeTab === "lembur") {
        return (
          item.type === "lembur_approved" ||
          item.type === "lembur_rejected" ||
          item.type === "lembur_submitted" ||
          item.type === "lembur_instruction"
        );
      }
      return true;
    });
  }, [notifications, activeTab]);

  const handleItemClick = (notif: AppNotification) => {
    if (!notif.isRead) {
      markAsRead(notif.id);
      loadData();
    }
    setSelectedNotif(notif);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    loadData();
    toast.success("Semua notifikasi telah ditandai dibaca");
  };

  const handleAcceptInstruction = (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    acceptLemburInstruction(notifId);
    loadData();
    toast.success("Instruksi lembur diterima!", {
      description: "Konfirmasi kesiapan lembur Anda telah tercatat.",
    });
  };

  const handleDeclineInstruction = async (e: React.MouseEvent, notifId: string) => {
    e.stopPropagation();
    const Swal = (await import("sweetalert2")).default;
    const { value: reasonText } = await Swal.fire({
      title: "Alasan Menolak Lembur",
      input: "textarea",
      inputLabel: "Keterangan Alasan",
      inputPlaceholder: "Tuliskan alasan mengapa Anda tidak dapat lembur...",
      showCancelButton: true,
      confirmButtonText: "Kirim Penolakan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#94a3b8",
      inputValidator: (val) => {
        if (!val?.trim()) {
          return "Harap masukkan alasan penolakan lembur!";
        }
        return null;
      },
    });

    if (reasonText) {
      declineLemburInstruction(notifId, reasonText);
      loadData();
      toast.info("Penolakan lembur telah dikirim ke Atasan & HR.");
    }
  };

  const handleSimulateNewInstruction = () => {
    addNotification({
      type: "lembur_instruction",
      title: "Instruksi Lembur: Deployment Server",
      message: "Bpk. Rahmat Hidayat (Head of IT) memberikan instruksi lembur penanganan server mendesak.",
      statusBadge: "instruction",
      meta: {
        requestType: "lembur",
        category: "Instruksi Atasan",
        instructionFrom: "Bpk. Rahmat Hidayat",
        instructionRole: "Head of IT",
        instructionDate: "Hari Ini",
        instructionHours: "18:00 - 21:00 WIB",
        instructionDuration: "3 Jam",
        instructionTask: "Deployment hotfix sistem presensi & migrasi backup data ke server cadangan.",
        instructionStatus: "pending_acceptance",
      },
    });
    toast.info("Simulasi instruksi lembur baru telah ditambahkan");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-fade-in select-none">
      {/* Modal Container */}
      <div className="w-full max-w-md bg-white rounded-t-[28px] sm:rounded-2xl shadow-xl flex flex-col max-h-[88vh] sm:max-h-[80vh] overflow-hidden animate-slide-up border border-slate-100">
        
        {/* Clean Minimal Header */}
        <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-800 tracking-tight">Notifikasi</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-[#156bb8] text-white text-[10px] font-bold">
                {unreadCount} baru
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-[#156bb8] hover:text-blue-700 transition-colors cursor-pointer"
              >
                Tandai dibaca
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all cursor-pointer"
              aria-label="Tutup"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Clean Segmented Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 overflow-x-auto no-scrollbar text-xs">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap font-semibold cursor-pointer ${
              activeTab === "all"
                ? "bg-white text-[#156bb8] shadow-2xs border border-slate-200/80"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/70"
            }`}
          >
            Semua ({notifications.length})
          </button>

          <button
            onClick={() => setActiveTab("instruction")}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap font-semibold flex items-center gap-1.5 cursor-pointer ${
              activeTab === "instruction"
                ? "bg-amber-500 text-white shadow-2xs"
                : "text-amber-800 bg-amber-50/80 hover:bg-amber-100/70"
            }`}
          >
            <span>Instruksi Lembur</span>
            {instructionCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("pengajuan")}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap font-semibold cursor-pointer ${
              activeTab === "pengajuan"
                ? "bg-white text-[#156bb8] shadow-2xs border border-slate-200/80"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/70"
            }`}
          >
            Pengajuan
          </button>

          <button
            onClick={() => setActiveTab("lembur")}
            className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap font-semibold cursor-pointer ${
              activeTab === "lembur"
                ? "bg-white text-[#156bb8] shadow-2xs border border-slate-200/80"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/70"
            }`}
          >
            Lembur
          </button>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 bg-white">
          {filteredNotifications.length === 0 ? (
            <div className="py-14 text-center text-slate-400">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2">
                <Bell size={18} />
              </div>
              <p className="text-xs font-semibold text-slate-600">Tidak ada notifikasi</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Pemberitahuan baru akan muncul di sini</p>
            </div>
          ) : (
            filteredNotifications.map((item) => {
              const isInstruction = item.type === "lembur_instruction";
              const isApproved = item.statusBadge === "approved";
              const isRejected = item.statusBadge === "rejected";

              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-4 transition-colors cursor-pointer flex gap-3 items-start relative hover:bg-slate-50/80 ${
                    !item.isRead ? "bg-blue-50/25" : ""
                  }`}
                >
                  {/* Minimal Status Icon */}
                  <div className="shrink-0 mt-0.5">
                    {isInstruction ? (
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                        <AlertCircle size={17} />
                      </div>
                    ) : isApproved ? (
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <CheckCircle2 size={17} />
                      </div>
                    ) : isRejected ? (
                      <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                        <XCircle size={17} />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-sky-100 text-[#156bb8] flex items-center justify-center">
                        <Clock size={17} />
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 min-w-0 pr-1">
                    {/* Header Row */}
                    <div className="flex items-center justify-between gap-1.5 mb-0.5">
                      <h4 className="text-[13px] font-bold text-slate-800 leading-snug truncate">
                        {item.title.replace(/^[^\w\s]+/, "").trim()}
                      </h4>
                      <span className="text-[10.5px] text-slate-400 shrink-0">
                        {item.timestamp}
                      </span>
                    </div>

                    {/* Message */}
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    {/* 🚨 Instruksi Lembur Detail Ringkas */}
                    {isInstruction && item.meta && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-slate-700 text-[11px]">
                          <span className="font-semibold text-amber-900">
                            Dari: {item.meta.instructionFrom}
                          </span>
                          <span className="text-slate-500 font-medium">
                            {item.meta.instructionHours}
                          </span>
                        </div>

                        <p className="text-[11.5px] text-slate-600 font-medium leading-tight">
                          {item.meta.instructionTask}
                        </p>

                        <div className="pt-1">
                          {item.meta.instructionStatus === "accepted" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              <Check size={12} strokeWidth={2.5} /> Siap Lembur (Disetujui)
                            </span>
                          ) : item.meta.instructionStatus === "declined" ? (
                            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px]">
                              <div className="font-bold text-rose-900 mb-0.5">✕ Lembur Ditolak</div>
                              <p className="text-rose-700 leading-snug"><span className="font-medium text-rose-900">Alasan:</span> {item.meta.declineReason || "Dibatalkan"}</p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => handleAcceptInstruction(e, item.id)}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer shadow-2xs text-center"
                              >
                                ✓ Setuju
                              </button>
                              <button
                                onClick={(e) => handleDeclineInstruction(e, item.id)}
                                className="flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-[11px] py-1.5 px-2.5 rounded-lg transition-colors cursor-pointer text-center"
                              >
                                ✕ Tolak
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ❌ Catatan Penolakan Ringkas */}
                    {isRejected && item.meta?.rejectedReason && (
                      <div className="mt-2 p-2 rounded-lg bg-rose-50 border border-rose-100 text-[11.5px] text-rose-800">
                        <span className="font-semibold text-rose-900">Alasan: </span>
                        {item.meta.rejectedReason}
                      </div>
                    )}

                    {/* ✅ Info Persetujuan Ringkas */}
                    {isApproved && item.meta?.approverName && (
                      <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                        ✓ Disetujui oleh {item.meta.approverName}
                      </p>
                    )}
                  </div>

                  {/* Unread subtle dot */}
                  {!item.isRead && (
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-2" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Clean Minimal Footer */}
        <div className="px-5 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <button
            onClick={handleSimulateNewInstruction}
            className="hover:text-[#156bb8] transition-colors cursor-pointer"
          >
            + Simulasi Instruksi Baru
          </button>
          <button
            onClick={() => {
              resetNotificationsToDefault();
              loadData();
              toast.info("Notifikasi telah direset");
            }}
            className="hover:text-slate-600 transition-colors cursor-pointer"
          >
            Reset Contoh
          </button>
        </div>
      </div>

      {/* ══════════════ POPUP RINCIAN LENGKAP ══════════════ */}
      {selectedNotif && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl border border-slate-100 space-y-3.5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <span className="font-bold text-slate-800 text-sm">
                Detail Notifikasi
              </span>
              <button
                onClick={() => setSelectedNotif(null)}
                className="w-6 h-6 rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center cursor-pointer"
              >
                <X size={13} />
              </button>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-medium">
                {selectedNotif.timestamp}
              </span>
              <h3 className="text-sm font-bold text-slate-800 mt-0.5 leading-snug">
                {selectedNotif.title.replace(/^[^\w\s]+/, "").trim()}
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {selectedNotif.message}
              </p>
            </div>

            {/* Khusus Instruksi Lembur */}
            {selectedNotif.type === "lembur_instruction" && selectedNotif.meta && (
              <div className="bg-amber-50/60 rounded-xl p-3 border border-amber-200/60 space-y-2 text-xs">
                <div className="flex justify-between items-center py-0.5 border-b border-amber-200/40">
                  <span className="text-slate-500">Pemberi Instruksi</span>
                  <span className="font-bold text-slate-800">{selectedNotif.meta.instructionFrom}</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-amber-200/40">
                  <span className="text-slate-500">Tanggal Lembur</span>
                  <span className="font-bold text-slate-800">{selectedNotif.meta.instructionDate}</span>
                </div>
                <div className="flex justify-between items-center py-0.5 border-b border-amber-200/40">
                  <span className="text-slate-500">Jam / Durasi</span>
                  <span className="font-bold text-amber-900">{selectedNotif.meta.instructionHours} ({selectedNotif.meta.instructionDuration})</span>
                </div>
                <div className="pt-1">
                  <span className="text-slate-500 block mb-1">Rincian Tugas:</span>
                  <p className="bg-white p-2 rounded-lg border border-amber-200/60 text-slate-700 leading-relaxed font-medium">
                    {selectedNotif.meta.instructionTask}
                  </p>
                </div>
              </div>
            )}

            {/* Khusus Ditolak */}
            {selectedNotif.statusBadge === "rejected" && selectedNotif.meta?.rejectedReason && (
              <div className="bg-rose-50 rounded-xl p-3 border border-rose-100 text-xs">
                <span className="font-semibold text-rose-900 block mb-0.5">Alasan Penolakan:</span>
                <p className="text-rose-800 bg-white p-2 rounded-lg border border-rose-100">
                  {selectedNotif.meta.rejectedReason}
                </p>
              </div>
            )}

            {/* Khusus Disetujui */}
            {selectedNotif.statusBadge === "approved" && selectedNotif.meta?.approverName && (
              <div className="bg-emerald-50 rounded-xl p-2.5 border border-emerald-100 text-xs text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                <span>Disetujui resmi oleh <b>{selectedNotif.meta.approverName}</b></span>
              </div>
            )}

            <button
              onClick={() => setSelectedNotif(null)}
              className="w-full bg-[#156bb8] hover:bg-blue-700 text-white font-semibold text-xs py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
