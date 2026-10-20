"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Bell } from "lucide-react";
import {
  AppNotification,
  getNotifications,
  markAsRead,
  markAllAsRead,
} from "@/lib/notifications";

type FilterTab = "all" | "unread" | "instruction" | "lembur" | "pengajuan";

export default function NotifikasiPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  const loadData = () => {
    setNotifications(getNotifications());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("bisa_notification_change", loadData);
    window.addEventListener("storage", loadData);
    return () => {
      window.removeEventListener("bisa_notification_change", loadData);
      window.removeEventListener("storage", loadData);
    };
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  const instructionCount = useMemo(() => {
    return notifications.filter((n) => n.type === "lembur_instruction").length;
  }, [notifications]);

  const lemburCount = useMemo(() => {
    return notifications.filter(
      (n) =>
        n.type === "lembur_approved" ||
        n.type === "lembur_rejected" ||
        n.type === "lembur_submitted"
    ).length;
  }, [notifications]);

  const pengajuanCount = useMemo(() => {
    return notifications.filter(
      (n) =>
        n.type === "pengajuan_approved" ||
        n.type === "pengajuan_rejected" ||
        n.type === "pengajuan_submitted"
    ).length;
  }, [notifications]);

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (activeTab === "unread") return !n.isRead;
      if (activeTab === "instruction") return n.type === "lembur_instruction";
      if (activeTab === "lembur")
        return (
          n.type === "lembur_approved" ||
          n.type === "lembur_rejected" ||
          n.type === "lembur_submitted" ||
          n.type === "lembur_instruction"
        );
      if (activeTab === "pengajuan")
        return (
          n.type === "pengajuan_approved" ||
          n.type === "pengajuan_rejected" ||
          n.type === "pengajuan_submitted"
        );
      return true;
    });
  }, [notifications, activeTab]);

  const handleCardClick = (item: AppNotification) => {
    if (!item.isRead) {
      markAsRead(item.id);
      loadData();
    }

    if (item.meta?.targetUrl) {
      router.push(item.meta.targetUrl);
    } else if (item.type === "lembur_instruction" || item.type.includes("lembur")) {
      router.push("/lembur");
    } else {
      router.push("/pengajuan");
    }
  };

  return (
    <div className="min-h-screen bg-white select-none">
      {/* ══════════════ HEADER NOTIFIKASI (IMAGE 5) ══════════════ */}
      <div className="max-w-md mx-auto px-4 pt-6 pb-3">
        <div className="flex items-center justify-between mb-4 relative">
          <button
            onClick={() => router.back()}
            aria-label="Kembali"
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all cursor-pointer active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-bold italic text-[24px] sm:text-[26px] text-slate-800 text-center flex-1 pr-8 tracking-tight">
            Notifikasi
          </h1>
        </div>

        {/* ══════════════ SEGMENTED TABS (IMAGE 5) ══════════════ */}
        <div className="bg-slate-200/70 p-1 rounded-2xl flex items-center gap-1 overflow-x-auto no-scrollbar shadow-2xs text-xs mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "all"
                ? "bg-[#156bb8] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Semua ({notifications.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("unread")}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "unread"
                ? "bg-[#156bb8] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Belum Dibaca ({unreadCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("instruction")}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "instruction"
                ? "bg-[#156bb8] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Instruksi Lembur ({instructionCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("lembur")}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "lembur"
                ? "bg-[#156bb8] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Lembur ({lemburCount})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("pengajuan")}
            className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === "pengajuan"
                ? "bg-[#156bb8] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Pengajuan
          </button>
        </div>

        {/* ══════════════ NOTIFICATION CARDS LIST (IMAGE 5) ══════════════ */}
        <div className="space-y-3 pb-24">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <Bell size={28} className="mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-500">Tidak ada notifikasi</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Pemberitahuan akan muncul di sini</p>
            </div>
          ) : (
            filtered.map((item) => {
              const isInstruction = item.type === "lembur_instruction";
              const isApproved =
                item.statusBadge === "approved" ||
                item.meta?.instructionStatus === "accepted";
              const isRejected =
                item.statusBadge === "rejected" ||
                item.meta?.instructionStatus === "declined";

              // 1. Tipe Instruksi Lembur (Image 5 - Card 3)
              if (isInstruction) {
                return (
                  <div
                    key={item.id}
                    onClick={() => handleCardClick(item)}
                    className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer group space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#b91c1c] bg-[#fee2e2] border border-[#fca5a5] px-2.5 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#b91c1c]" />
                        <span>Instruksi Lembur</span>
                      </span>
                    </div>

                    <h3 className="font-bold italic text-slate-800 text-[15px] leading-tight">
                      {item.meta?.instructionTask || item.title.replace(/^🚨\s*/, "")}
                    </h3>

                    <p className="text-slate-500 italic text-xs leading-tight">
                      {item.meta?.instructionHours || "Jam Mulai dan Selesai"}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <span className="text-slate-400 font-medium text-[11px]">
                        {item.timestamp || "Kemarin"}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCardClick(item);
                        }}
                        className="text-[#156bb8] font-bold text-xs hover:underline flex items-center cursor-pointer bg-transparent border-0 p-0"
                      >
                        Lihat Selengkapnya &gt;&gt;
                      </button>
                    </div>
                  </div>
                );
              }

              // 2. Tipe Lembur Disetujui (Image 5 - Card 1)
              if (isApproved && item.type.includes("lembur")) {
                return (
                  <div
                    key={item.id}
                    onClick={() => handleCardClick(item)}
                    className="p-4 rounded-2xl bg-[#ebf4fc] border border-[#cbe2f7] shadow-2xs hover:shadow-xs transition-all cursor-pointer space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                        <span>Lembur</span>
                      </span>

                      <span className="inline-flex items-center gap-1 text-xs font-bold text-[#156bb8]">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#156bb8]" />
                        <span>Disetujui</span>
                      </span>
                    </div>

                    <h3 className="font-bold italic text-slate-800 text-[15px] leading-tight">
                      {item.title.replace(/^[^\w\s]+/, "").trim()}
                    </h3>

                    <p className="text-slate-500 italic text-xs leading-tight">
                      {item.meta?.instructionHours || item.message.split("•")[0] || "Jam Mulai dan Selesai"}
                    </p>

                    <p className="text-[#156bb8] text-xs font-semibold pt-0.5">
                      {item.timestamp || "1 Menit yang lalu"}
                    </p>
                  </div>
                );
              }

              // 3. Tipe Pengajuan (Image 5 - Card 2)
              return (
                <div
                  key={item.id}
                  onClick={() => handleCardClick(item)}
                  className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-xs transition-all cursor-pointer space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-700" />
                      <span>{item.type.includes("lembur") ? "Lembur" : "Pengajuan"}</span>
                    </span>

                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold ${
                        isApproved
                          ? "text-[#156bb8]"
                          : isRejected
                          ? "text-[#156bb8]"
                          : "text-orange-500"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isApproved
                            ? "bg-[#156bb8]"
                            : isRejected
                            ? "bg-[#156bb8]"
                            : "bg-orange-500"
                        }`}
                      />
                      <span>
                        {isApproved ? "Disetujui" : isRejected ? "Ditolak" : "Pending"}
                      </span>
                    </span>
                  </div>

                  <h3 className="font-bold italic text-slate-800 text-[15px] leading-tight">
                    {item.meta?.category || item.title.replace(/^[^\w\s]+/, "").trim()}
                  </h3>

                  <p className="text-slate-500 italic text-xs leading-tight">
                    {item.message}
                  </p>

                  <p className="text-[#156bb8] text-xs font-semibold pt-0.5">
                    {item.timestamp || "10 Menit yang lalu"}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
