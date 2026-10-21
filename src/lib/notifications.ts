// ── Notification Module for Bisa Presensi ─────────────────────────────

export type NotificationType =
  | "pengajuan_submitted"
  | "pengajuan_approved"
  | "pengajuan_rejected"
  | "lembur_submitted"
  | "lembur_approved"
  | "lembur_rejected"
  | "lembur_instruction" // Instruksi lembur langsung dari Atasan / HR
  | "system_info";

export type NotificationStatus = "pending" | "approved" | "rejected" | "instruction" | "info";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  createdAt: string; // ISO string
  isRead: boolean;
  statusBadge: NotificationStatus;
  meta?: {
    requestType?: "cuti" | "izin" | "sakit" | "lembur" | "dinas" | string;
    category?: string;
    approverName?: string;
    rejectedReason?: string;
    // Khusus Instruksi Lembur dari Atasan / HR:
    instructionFrom?: string; // Nama Atasan / HR
    instructionRole?: string; // Jabatan pemberi tugas
    instructionDate?: string; // Tanggal lembur
    instructionHours?: string; // Jam lembur misal "17:30 - 21:00 WIB"
    instructionDuration?: string; // "3.5 Jam"
    instructionTask?: string; // Keterangan tugas lembur
    instructionStatus?: "pending_acceptance" | "accepted" | "declined";
    declineReason?: string; // Alasan jika karyawan tidak setuju lembur
    targetUrl?: string;
  };
}

const STORAGE_KEY = "bisa_notifications";

export const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  // ── 1. Instruksi Lembur (Belum di-ACC / Pending Acceptance) ──
  {
    id: "notif-inst-01",
    type: "lembur_instruction",
    title: "🚨 Instruksi Lembur: Maintenance Database",
    message: "Bpk. Rahmat Hidayat (Head of IT) menugaskan Anda untuk lembur maintenance database & deployment update v2.4.",
    timestamp: "Baru saja",
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    isRead: false,
    statusBadge: "instruction",
    meta: {
      requestType: "lembur",
      category: "Instruksi Lembur",
      instructionFrom: "Bpk. Rahmat Hidayat",
      instructionRole: "Head of IT & Infrastructure",
      instructionDate: "Sabtu, 04 Oktober 2026",
      instructionHours: "18:00 - 21:00 WIB",
      instructionDuration: "3 Jam",
      instructionTask: "Maintenance darurat server database, sinkronisasi presensi cabang, dan monitoring deployment update.",
      instructionStatus: "pending_acceptance",
      targetUrl: "/lembur",
    },
  },

  // ── 2. Mengajukan (Pengajuan Lembur Mandiri Menunggu Persetujuan) ──
  {
    id: "notif-sub-01",
    type: "lembur_submitted",
    title: "⏳ Pengajuan Lembur Menunggu Persetujuan",
    message: "Pengajuan lembur Anda untuk tanggal 26 Sep 2026 (18:00 - 21:00 • 3 Jam) sedang dalam proses verifikasi dan persetujuan atasan.",
    timestamp: "10 menit yang lalu",
    createdAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    isRead: false,
    statusBadge: "pending",
    meta: {
      requestType: "lembur",
      category: "Pengajuan Lembur",
      targetUrl: "/lembur",
    },
  },
];

const DATA_VERSION = "bisa_notif_v10";

/** Reset seluruh notifikasi & instruksi ke data dummy awal */
export function resetNotificationsToDefault(): AppNotification[] {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
      localStorage.setItem("bisa_notif_version", DATA_VERSION);
      localStorage.removeItem("bisa_lembur_completed");
      localStorage.removeItem("bisa_lembur_checkin_time");
      localStorage.removeItem("bisa_lembur_checkout_time");
      localStorage.removeItem("bisa_lembur_active_id");
      window.dispatchEvent(new Event("bisa_notification_change"));
      window.dispatchEvent(new Event("bisa_lembur_change"));
    } catch (err) {
      console.error(err);
    }
  }
  return DEFAULT_NOTIFICATIONS;
}

/** Ambil seluruh daftar notifikasi dari localStorage */
export function getNotifications(): AppNotification[] {
  if (typeof window === "undefined") return DEFAULT_NOTIFICATIONS;
  try {
    const version = localStorage.getItem("bisa_notif_version");
    if (version !== DATA_VERSION) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
      localStorage.setItem("bisa_notif_version", DATA_VERSION);
      return DEFAULT_NOTIFICATIONS;
    }

    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
      return DEFAULT_NOTIFICATIONS;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NOTIFICATIONS));
    return DEFAULT_NOTIFICATIONS;
  } catch (err) {
    console.error("Error reading notifications:", err);
    return DEFAULT_NOTIFICATIONS;
  }
}

/** Simpan array notifikasi ke localStorage dan broadcast event perubahan */
function saveNotifications(notifications: AppNotification[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    window.dispatchEvent(new Event("bisa_notification_change"));
  } catch (err) {
    console.error("Error saving notifications:", err);
  }
}

/** Tambah notifikasi baru ke paling atas */
export function addNotification(
  notif: Omit<AppNotification, "id" | "createdAt" | "isRead" | "timestamp"> & {
    timestamp?: string;
  }
): AppNotification {
  const current = getNotifications();
  const newNotif: AppNotification = {
    ...notif,
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    timestamp: notif.timestamp || "Baru saja",
    isRead: false,
  };

  const updated = [newNotif, ...current];
  saveNotifications(updated);
  return newNotif;
}

/** Tandai satu notifikasi sebagai telah dibaca */
export function markAsRead(id: string) {
  const current = getNotifications();
  const updated = current.map((n) => (n.id === id ? { ...n, isRead: true } : n));
  saveNotifications(updated);
}

/** Tandai semua notifikasi telah dibaca */
export function markAllAsRead() {
  const current = getNotifications();
  const updated = current.map((n) => ({ ...n, isRead: true }));
  saveNotifications(updated);
}

/** Konfirmasi penerimaan instruksi lembur dari atasan */
export function acceptLemburInstruction(id: string) {
  const current = getNotifications();
  const updated = current.map((n) => {
    if (n.id === id && n.meta) {
      return {
        ...n,
        isRead: true,
        meta: {
          ...n.meta,
          instructionStatus: "accepted" as const,
        },
      };
    }
    return n;
  });
  saveNotifications(updated);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("bisa_lembur_active_id", id);
      localStorage.removeItem("bisa_lembur_completed");
      localStorage.removeItem("bisa_lembur_checkin_time");
      localStorage.removeItem("bisa_lembur_checkout_time");
      localStorage.removeItem("bisa_lembur_checkin_photo");
      localStorage.removeItem("bisa_lembur_checkout_photo");
      localStorage.removeItem("bisa_lembur_checkin_location");
      localStorage.removeItem("bisa_lembur_checkout_location");
      localStorage.removeItem("bisa_lembur_checkin_notes");
      localStorage.removeItem("bisa_lembur_checkout_notes");
      window.dispatchEvent(new Event("bisa_lembur_change"));
    } catch (err) {
      console.error(err);
    }
  }
}

/** Konfirmasi penolakan instruksi lembur dari atasan beserta alasannya */
export function declineLemburInstruction(id: string, reason: string) {
  const current = getNotifications();
  const updated = current.map((n) => {
    if (n.id === id && n.meta) {
      return {
        ...n,
        isRead: true,
        meta: {
          ...n.meta,
          instructionStatus: "declined" as const,
          declineReason: reason,
        },
      };
    }
    return n;
  });
  saveNotifications(updated);
}

/** Hitung jumlah notifikasi yang belum dibaca */
export function getUnreadCount(): number {
  const list = getNotifications();
  return list.filter((n) => !n.isRead).length;
}


/** Tampilkan Pop-up Notifikasi menggunakan SweetAlert2 dengan filter lengkap */
export async function showNotificationPopup() {
  const Swal = (await import("sweetalert2")).default;
  const notifs = getNotifications();

  let activeFilter: "all" | "unread" | "instruction" | "pengajuan" | "lembur" = "all";

  const renderNotifItem = (item: AppNotification) => {
    const isInstruction = item.type === "lembur_instruction";
    const isApproved = item.statusBadge === "approved";
    const isRejected = item.statusBadge === "rejected";

    if (isInstruction) {
      return `
        <div class="notif-card p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 text-left mb-2.5 transition-all cursor-pointer group" data-id="${item.id}">
          <div class="flex items-center justify-between mb-1.5">
            <span class="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[#b91c1c] bg-[#fee2e2] border border-[#fca5a5] px-2.5 py-0.5 rounded-full">
              <span class="w-1.5 h-1.5 rounded-full bg-[#b91c1c]"></span>
              <span>Instruksi Lembur</span>
            </span>
          </div>

          <h5 class="text-[14px] font-bold italic text-slate-800 leading-tight">${item.meta?.instructionTask || item.title.replace(/^🚨\s*/, "")}</h5>
          <p class="text-xs text-slate-500 italic mt-0.5 leading-tight">${item.meta?.instructionHours || "Jam Mulai dan Selesai"}</p>
          
          <div class="flex items-center justify-between pt-1.5 text-xs">
            <span class="text-slate-400 font-medium text-[11px]">${item.timestamp || "Kemarin"}</span>
            <button type="button" class="btn-lihat-selengkapnya text-[#156bb8] font-bold text-xs hover:underline flex items-center cursor-pointer border-0 bg-transparent p-0" data-id="${item.id}">Lihat Selengkapnya &gt;&gt;</button>
          </div>
        </div>
      `;
    }

    if (isApproved && item.type.includes("lembur")) {
      return `
        <div class="notif-card p-3.5 rounded-2xl bg-[#ebf4fc] border border-[#cbe2f7] shadow-2xs text-left mb-2.5 transition-all cursor-pointer" data-id="${item.id}">
          <div class="flex items-center justify-between mb-1.5">
            <span class="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full shadow-2xs">
              <span class="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
              <span>Lembur</span>
            </span>
            <span class="inline-flex items-center gap-1 text-xs font-bold text-[#156bb8]">
              <span class="w-1.5 h-1.5 rounded-full bg-[#156bb8]"></span>
              <span>Disetujui</span>
            </span>
          </div>

          <h5 class="text-[14px] font-bold italic text-slate-800 leading-tight">${item.title.replace(/^[^\w\s]+/, "").trim()}</h5>
          <p class="text-xs text-slate-500 italic mt-0.5 leading-tight">${item.meta?.instructionHours || item.message.split("•")[0] || "Jam Mulai dan Selesai"}</p>
          <p class="text-[#156bb8] text-xs font-semibold pt-1">${item.timestamp || "1 Menit yang lalu"}</p>
        </div>
      `;
    }

    return `
      <div class="notif-card p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs text-left mb-2.5 transition-all cursor-pointer" data-id="${item.id}">
        <div class="flex items-center justify-between mb-1.5">
          <span class="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full shadow-2xs">
            <span class="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
            <span>${item.type.includes("lembur") ? "Lembur" : "Pengajuan"}</span>
          </span>
          <span class="inline-flex items-center gap-1 text-xs font-bold ${
            isApproved ? "text-[#156bb8]" : isRejected ? "text-[#156bb8]" : "text-orange-500"
          }">
            <span class="w-1.5 h-1.5 rounded-full ${
              isApproved ? "bg-[#156bb8]" : isRejected ? "bg-[#156bb8]" : "bg-orange-500"
            }"></span>
            <span>${isApproved ? "Disetujui" : isRejected ? "Ditolak" : "Pending"}</span>
          </span>
        </div>

        <h5 class="text-[14px] font-bold italic text-slate-800 leading-tight">${item.meta?.category || item.title.replace(/^[^\w\s]+/, "").trim()}</h5>
        <p class="text-xs text-slate-500 italic mt-0.5 leading-tight">${item.message}</p>
        <p class="text-[#156bb8] text-xs font-semibold pt-1">${item.timestamp || "10 Menit yang lalu"}</p>
      </div>
    `;
  };

  const getFilteredItems = (filter: typeof activeFilter) => {
    return notifs.filter((item) => {
      if (filter === "unread") return !item.isRead;
      if (filter === "instruction") return item.type === "lembur_instruction";
      if (filter === "pengajuan") {
        return (
          item.type === "pengajuan_approved" ||
          item.type === "pengajuan_rejected" ||
          item.type === "pengajuan_submitted"
        );
      }
      if (filter === "lembur") {
        return (
          item.type === "lembur_approved" ||
          item.type === "lembur_rejected" ||
          item.type === "lembur_submitted" ||
          item.type === "lembur_instruction"
        );
      }
      return true;
    });
  };

  const renderContent = () => {
    const unreadCount = notifs.filter((n) => !n.isRead).length;
    const items = getFilteredItems(activeFilter);
    const itemsHtml =
      items.length === 0
        ? `<div class="my-auto py-12 text-center text-slate-400 text-xs font-semibold">Tidak ada notifikasi pada filter ini</div>`
        : items.map(renderNotifItem).join("");

    return `
      <div class="text-left mt-1 flex flex-col">
        <!-- Filter Tabs & Mark All Read -->
        <div class="flex items-center justify-between gap-1 mb-2 px-0.5">
          <span class="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Kategori</span>
          ${
            unreadCount > 0
              ? `<button id="btn-mark-all-read" class="text-[11px] font-bold text-[#156bb8] hover:underline cursor-pointer">Tandai Semua Dibaca</button>`
              : ""
          }
        </div>

        <div class="flex flex-wrap items-center gap-1.5 pb-2.5 mb-2.5 border-b border-slate-100 text-xs shrink-0">
          <button class="notif-tab font-semibold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
            activeFilter === "all"
              ? "bg-[#156bb8] text-white shadow-2xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }" data-filter="all">Semua (${notifs.length})</button>

          <button class="notif-tab font-semibold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
            activeFilter === "unread"
              ? "bg-[#156bb8] text-white shadow-2xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }" data-filter="unread">Belum Dibaca (${unreadCount})</button>

          <button class="notif-tab font-semibold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
            activeFilter === "instruction"
              ? "bg-amber-600 text-white shadow-2xs"
              : "bg-amber-50 text-amber-800 hover:bg-amber-100"
          }" data-filter="instruction">Instruksi Lembur</button>

          <button class="notif-tab font-semibold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
            activeFilter === "pengajuan"
              ? "bg-[#156bb8] text-white shadow-2xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }" data-filter="pengajuan">Pengajuan</button>

          <button class="notif-tab font-semibold px-2.5 py-1 rounded-xl transition-all cursor-pointer ${
            activeFilter === "lembur"
              ? "bg-[#156bb8] text-white shadow-2xs"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }" data-filter="lembur">Lembur</button>
        </div>

        <!-- Notification Card List with Fixed Height -->
        <div id="notif-list-container" class="h-[340px] min-h-[340px] max-h-[340px] overflow-y-auto pr-1 no-scrollbar space-y-1 flex flex-col">
          ${itemsHtml}
        </div>
      </div>
    `;
  };

  await Swal.fire({
    title: "Notifikasi",
    html: renderContent(),
    confirmButtonText: "Tutup",
    confirmButtonColor: "#156bb8",
    showCancelButton: false,
    customClass: {
      popup: "!w-[92vw] sm:!w-[450px] !max-w-[450px] !h-[580px] !max-h-[92vh] rounded-3xl p-5 shadow-2xl flex flex-col justify-between overflow-hidden",
      title: "text-lg font-bold text-slate-800 pb-2 border-b border-slate-100 shrink-0 !m-0",
      htmlContainer: "!m-0 !mt-2 !p-0 !overflow-hidden flex-1 flex flex-col w-full min-h-0 text-left",
      actions: "!mt-3 !mb-0 shrink-0",
      confirmButton: "rounded-xl font-bold py-2.5 px-6 text-sm shadow-sm shrink-0",
    },
    didOpen: () => {
      const attachListeners = () => {
        // Tab buttons
        const tabs = document.querySelectorAll(".notif-tab");
        tabs.forEach((tab) => {
          tab.addEventListener("click", (e) => {
            const target = e.currentTarget as HTMLElement;
            const filter = target.getAttribute("data-filter") as typeof activeFilter;
            if (filter) {
              activeFilter = filter;
              const contentEl = Swal.getHtmlContainer();
              if (contentEl) {
                contentEl.innerHTML = renderContent();
                attachListeners();
              }
            }
          });
        });

        // Accept Overtime Buttons
        const acceptBtns = document.querySelectorAll(".btn-accept-lembur");
        acceptBtns.forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            const target = e.currentTarget as HTMLElement;
            const id = target.getAttribute("data-id");
            if (id) {
              acceptLemburInstruction(id);
              Swal.close();

              await Swal.fire({
                title: "Instruksi Lembur Disetujui!",
                html: `
                  <div class="text-center text-slate-600 text-xs mt-1.5 space-y-1.5">
                    <p class="font-bold text-slate-800 text-sm">Siap Melaksanakan Lembur</p>
                    <p>Kesiapan lembur Anda telah terkonfirmasi. Anda akan langsung dialihkan ke halaman Lembur untuk melakukan <b>Clock In Presensi</b>.</p>
                  </div>
                `,
                icon: "success",
                iconColor: "#22c55e",
                confirmButtonColor: "#156bb8",
                confirmButtonText: "Buka Presensi Lembur",
                timer: 1600,
                timerProgressBar: true,
                showConfirmButton: false,
                customClass: {
                  popup: "!w-[92vw] sm:!w-[400px] !max-w-[400px] rounded-3xl p-5 shadow-2xl",
                },
              });

              window.location.href = "/lembur";
            }
          });
        });

        // Decline Overtime Buttons (Pop-up Alasan Penolakan)
        const declineBtns = document.querySelectorAll(".btn-decline-lembur");
        declineBtns.forEach((btn) => {
          btn.addEventListener("click", async (e) => {
            e.stopPropagation();
            const target = e.currentTarget as HTMLElement;
            const id = target.getAttribute("data-id");
            if (!id) return;

            Swal.close();

            const { value: reasonText } = await Swal.fire({
              title: "Alasan Menolak Lembur",
              html: `
                <div class="text-left mt-2 space-y-2.5">
                  <p class="text-xs text-slate-600 leading-relaxed">
                    Mohon berikan alasan mengapa Anda tidak dapat menjalankan instruksi lembur ini:
                  </p>
                  
                  <div>
                    <label class="text-[11px] font-bold text-slate-700 mb-1.5 block">Alasan: <span class="text-rose-500">*</span></label>
                    <textarea id="decline-reason-input" rows="4" class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#156bb8] placeholder:text-slate-400" placeholder="Tuliskan alasan penolakan di sini..."></textarea>
                  </div>
                </div>
              `,
              showCancelButton: true,
              confirmButtonText: "Kirim Penolakan",
              cancelButtonText: "Batal",
              confirmButtonColor: "#ef4444",
              cancelButtonColor: "#94a3b8",
              reverseButtons: true,
              customClass: {
                popup: "!w-[92vw] sm:!w-[420px] !max-w-[420px] rounded-3xl p-5 shadow-2xl",
                title: "text-base font-bold text-slate-800 pb-1 border-b border-slate-100",
                confirmButton: "rounded-xl font-bold py-2.5 px-4 text-xs shadow-sm",
                cancelButton: "rounded-xl font-medium py-2.5 px-4 text-xs",
              },
              didOpen: () => {
                const textInput = document.getElementById("decline-reason-input") as HTMLTextAreaElement | null;
                if (textInput) {
                  textInput.focus();
                }
              },
              preConfirm: () => {
                const textInput = document.getElementById("decline-reason-input") as HTMLTextAreaElement | null;
                const val = textInput?.value.trim() || "";
                if (!val) {
                  Swal.showValidationMessage("Harap isi alasan penolakan lembur!");
                  return false;
                }
                return val;
              },
            });

            if (reasonText) {
              declineLemburInstruction(id, reasonText);
              await Swal.fire({
                title: "Penolakan Telah Dikirim",
                text: "Status lembur telah dibatalkan dan alasan Anda telah dilaporkan kepada Atasan & HR.",
                icon: "info",
                confirmButtonColor: "#156bb8",
                confirmButtonText: "Kembali ke Notifikasi",
                customClass: {
                  popup: "!w-[92vw] sm:!w-[400px] !max-w-[400px] rounded-3xl p-5 shadow-2xl",
                  confirmButton: "rounded-xl font-bold py-2 px-5 text-xs shadow-sm",
                },
              });
            }

            // Kembali buka pop-up notifikasi utama
            showNotificationPopup();
          });
        });

        // Mark single card as read on click and navigate if applicable
        const cards = document.querySelectorAll(".notif-card");
        cards.forEach((card) => {
          card.addEventListener("click", (e) => {
            const target = e.currentTarget as HTMLElement;
            const id = target.getAttribute("data-id");
            if (id) {
              const item = notifs.find((n) => n.id === id);
              if (item) {
                if (!item.isRead) {
                  markAsRead(id);
                  item.isRead = true;
                }
                if (item.type === "lembur_instruction" || item.type.includes("lembur")) {
                  Swal.close();
                  window.location.href = item.meta?.targetUrl || "/lembur";
                  return;
                }
                if (item.type.includes("pengajuan")) {
                  Swal.close();
                  window.location.href = item.meta?.targetUrl || "/pengajuan";
                  return;
                }
                if (item.meta?.targetUrl) {
                  Swal.close();
                  window.location.href = item.meta.targetUrl;
                  return;
                }
              }
              const contentEl = Swal.getHtmlContainer();
              if (contentEl) {
                contentEl.innerHTML = renderContent();
                attachListeners();
              }
            }
          });
        });

        // Dedicated click handler for Lihat Selengkapnya button
        const lihatBtns = document.querySelectorAll(".btn-lihat-selengkapnya");
        lihatBtns.forEach((btn) => {
          btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const target = e.currentTarget as HTMLElement;
            const id = target.getAttribute("data-id");
            if (id) {
              markAsRead(id);
            }
            Swal.close();
            window.location.href = "/lembur";
          });
        });

        // Mark all as read button
        const btnMarkAll = document.getElementById("btn-mark-all-read");
        if (btnMarkAll) {
          btnMarkAll.addEventListener("click", () => {
            markAllAsRead();
            notifs.forEach((n) => (n.isRead = true));
            const contentEl = Swal.getHtmlContainer();
            if (contentEl) {
              contentEl.innerHTML = renderContent();
              attachListeners();
            }
          });
        }
      };

      attachListeners();
    },
  });
}

