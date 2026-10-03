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
  // ── 1. Pending Instructions (Siap Dikonfirmasi oleh Karyawan) ──
  {
    id: "notif-inst-01",
    type: "lembur_instruction",
    title: "🚨 Instruksi Lembur: Maintenance Database & Deployment v2.4",
    message: "Bpk. Rahmat Hidayat (Head of IT) menugaskan Anda untuk lembur maintenance database & deployment update v2.4.",
    timestamp: "Baru saja",
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    isRead: false,
    statusBadge: "instruction",
    meta: {
      requestType: "lembur",
      category: "Perintah Lembur Atasan",
      instructionFrom: "Bpk. Rahmat Hidayat",
      instructionRole: "Head of IT & Infrastructure",
      instructionDate: "Sabtu, 04 Oktober 2026",
      instructionHours: "17:30 - 21:00 WIB",
      instructionDuration: "3.5 Jam",
      instructionTask: "Maintenance darurat server database, sinkronisasi presensi cabang, dan monitoring deployment presensi update v2.4.",
      instructionStatus: "pending_acceptance",
      targetUrl: "/lembur",
    },
  },
  {
    id: "notif-inst-02",
    type: "lembur_instruction",
    title: "🚨 Instruksi Lembur: Patching Security Kernel & Load Balancer",
    message: "Bpk. Hendra Gunawan (Lead DevOps) menginstruksikan lembur patching security kernel server cloud & routing balancer.",
    timestamp: "15 menit yang lalu",
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    isRead: false,
    statusBadge: "instruction",
    meta: {
      requestType: "lembur",
      category: "Perintah Lembur DevOps",
      instructionFrom: "Bpk. Hendra Gunawan",
      instructionRole: "Lead DevOps Engineer",
      instructionDate: "Sabtu, 04 Oktober 2026",
      instructionHours: "21:00 - 23:30 WIB",
      instructionDuration: "2.5 Jam",
      instructionTask: "Patching security kernel server cloud & konfigurasi load balancer gateway cabang.",
      instructionStatus: "pending_acceptance",
      targetUrl: "/lembur",
    },
  },
  {
    id: "notif-inst-03",
    type: "lembur_instruction",
    title: "🚨 Instruksi Lembur: Finalisasi Migrasi Data & Audit QA",
    message: "Ibu Dian Pratiwi (QA Lead) menginstruksikan lembur audit validasi integrasi pembayaran dan migrasi data.",
    timestamp: "1 jam yang lalu",
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    isRead: false,
    statusBadge: "instruction",
    meta: {
      requestType: "lembur",
      category: "Perintah Lembur QA",
      instructionFrom: "Ibu Dian Pratiwi",
      instructionRole: "Quality Assurance Lead",
      instructionDate: "Minggu, 05 Oktober 2026",
      instructionHours: "13:00 - 16:30 WIB",
      instructionDuration: "3.5 Jam",
      instructionTask: "Audit menyeluruh endpoint payment gateway dan migrasi rekap data presensi karyawan cabang.",
      instructionStatus: "pending_acceptance",
      targetUrl: "/lembur",
    },
  },

  // ── 2. Responded Instructions (Disetujui & Masuk Riwayat) ──
  {
    id: "notif-inst-04",
    type: "lembur_instruction",
    title: "🚨 Instruksi Lembur: Backup Migrasi Cloud",
    message: "Ibu Siti Rahayu (HR & Ops Lead) menginstruksikan lembur rekapitulasi data & pendampingan tim teknis.",
    timestamp: "Kemarin, 18:00",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    statusBadge: "instruction",
    meta: {
      requestType: "lembur",
      category: "Perintah Lembur HR",
      instructionFrom: "Ibu Siti Rahayu",
      instructionRole: "HR & Operations Lead",
      instructionDate: "Jumat, 03 Oktober 2026",
      instructionHours: "18:00 - 20:30 WIB",
      instructionDuration: "2.5 Jam",
      instructionTask: "Verifikasi berkas laporan lembur bulanan dan pendampingan migrasi database ke private cloud.",
      instructionStatus: "accepted",
      targetUrl: "/lembur",
    },
  },
  {
    id: "notif-inst-05",
    type: "lembur_instruction",
    title: "🚨 Instruksi Lembur: Regression Testing Mobile v2.5",
    message: "Ibu Dian Pratiwi (QA Lead) menginstruksikan lembur validasi rilis mobile update v2.5.",
    timestamp: "3 hari yang lalu",
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    statusBadge: "instruction",
    meta: {
      requestType: "lembur",
      category: "Perintah Lembur QA",
      instructionFrom: "Ibu Dian Pratiwi",
      instructionRole: "Quality Assurance Lead",
      instructionDate: "Rabu, 01 Oktober 2026",
      instructionHours: "17:00 - 20:00 WIB",
      instructionDuration: "3 Jam",
      instructionTask: "Regression testing & validasi payment gateway sebelum release versi mobile v2.5.",
      instructionStatus: "accepted",
      targetUrl: "/lembur",
    },
  },
  {
    id: "notif-inst-06",
    type: "lembur_instruction",
    title: "🚨 Instruksi Lembur: Monitoring Server Deployment Cabang",
    message: "Bpk. Rahmat Hidayat (Head of IT) menugaskan lembur monitoring live deployment server cabang.",
    timestamp: "4 hari yang lalu",
    createdAt: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    statusBadge: "instruction",
    meta: {
      requestType: "lembur",
      category: "Perintah Lembur IT",
      instructionFrom: "Bpk. Rahmat Hidayat",
      instructionRole: "Head of IT & Infrastructure",
      instructionDate: "Selasa, 30 September 2026",
      instructionHours: "19:00 - 22:00 WIB",
      instructionDuration: "3 Jam",
      instructionTask: "Monitoring sinkronisasi data presensi biometrik pada server cabang baru.",
      instructionStatus: "accepted",
      targetUrl: "/lembur",
    },
  },

  // ── 3. Declined Instructions (Ditolak beserta Alasan) ──
  {
    id: "notif-inst-07",
    type: "lembur_instruction",
    title: "🚨 Instruksi Lembur: Penanganan Server Cabang",
    message: "Bpk. Budi Santoso (Supervisor) menugaskan lembur troubleshooting jaringan server cabang Surabaya.",
    timestamp: "2 hari yang lalu",
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    statusBadge: "instruction",
    meta: {
      requestType: "lembur",
      category: "Perintah Lembur Atasan",
      instructionFrom: "Bpk. Budi Santoso",
      instructionRole: "Technical Supervisor",
      instructionDate: "Kamis, 02 Oktober 2026",
      instructionHours: "19:00 - 22:00 WIB",
      instructionDuration: "3 Jam",
      instructionTask: "Remote troubleshooting switch router dan konektivitas VPN antar cabang.",
      instructionStatus: "declined",
      declineReason: "Kondisi kesehatan kurang fit dan sedang istirahat pemulihan pasca dinas luar kota.",
      targetUrl: "/lembur",
    },
  },
  {
    id: "notif-inst-08",
    type: "lembur_instruction",
    title: "🚨 Instruksi Lembur: Rekapitulasi Berkas Fisik HR & Payroll",
    message: "Ibu Siti Rahayu (HR Manager) menugaskan lembur audit dokumen fisik berkas karyawan.",
    timestamp: "5 hari yang lalu",
    createdAt: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    statusBadge: "instruction",
    meta: {
      requestType: "lembur",
      category: "Perintah Lembur HR",
      instructionFrom: "Ibu Siti Rahayu",
      instructionRole: "HR Manager",
      instructionDate: "Senin, 29 September 2026",
      instructionHours: "18:00 - 20:00 WIB",
      instructionDuration: "2 Jam",
      instructionTask: "Audit dan verifikasi manual berkas fisik payroll serta tanda tangan kontrak.",
      instructionStatus: "declined",
      declineReason: "Ada keperluan keluarga mendesak yang telah dijadwalkan sebelumnya dan tidak bisa digeser.",
      targetUrl: "/lembur",
    },
  },

  // ── 4. Pengajuan Cuti, Izin, Sakit & Lembur Mandiri ──
  {
    id: "notif-apr-01",
    type: "pengajuan_approved",
    title: "✅ Pengajuan Cuti Disetujui",
    message: "Pengajuan Cuti Tahunan Anda (28 - 29 Sep 2026 • 2 Hari) telah disetujui oleh HRD.",
    timestamp: "5 hari yang lalu",
    createdAt: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    statusBadge: "approved",
    meta: {
      requestType: "cuti",
      category: "Cuti Tahunan",
      approverName: "Siti Rahayu (HR Manager)",
      targetUrl: "/pengajuan",
    },
  },
  {
    id: "notif-apr-02",
    type: "lembur_approved",
    title: "✅ Pengajuan Lembur Disetujui",
    message: "Pengajuan lembur mandiri Anda untuk 26 Sep 2026 (17:00 - 20:00 • 3 Jam) telah disetujui oleh Team Lead & HR.",
    timestamp: "6 hari yang lalu",
    createdAt: new Date(Date.now() - 144 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    statusBadge: "approved",
    meta: {
      requestType: "lembur",
      category: "Lembur Proyek",
      approverName: "Budi Santoso & Siti Rahayu",
      targetUrl: "/lembur",
    },
  },
  {
    id: "notif-rej-01",
    type: "pengajuan_rejected",
    title: "❌ Pengajuan Izin Ditolak",
    message: "Pengajuan Izin Keperluan Keluarga Anda pada 25 Sep 2026 ditolak oleh atasan.",
    timestamp: "7 hari yang lalu",
    createdAt: new Date(Date.now() - 168 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    statusBadge: "rejected",
    meta: {
      requestType: "izin",
      category: "Izin Keperluan Keluarga",
      approverName: "Budi Santoso (Team Lead)",
      rejectedReason: "Kuota izin berbayar bulan ini sudah habis. Silakan ajukan menggunakan kompensasi lembur atau cuti tahunan.",
      targetUrl: "/pengajuan",
    },
  },
  {
    id: "notif-rej-02",
    type: "lembur_rejected",
    title: "❌ Pengajuan Lembur Ditolak",
    message: "Pengajuan lembur Anda untuk 25 Sep 2026 (WFH • 3 Jam) tidak disetujui.",
    timestamp: "7 hari yang lalu",
    createdAt: new Date(Date.now() - 172 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    statusBadge: "rejected",
    meta: {
      requestType: "lembur",
      category: "Lembur WFH",
      approverName: "Budi Santoso (Team Lead)",
      rejectedReason: "Pekerjaan laporan akhir bulan disarankan diselesaikan pada jam kerja normal kantor.",
      targetUrl: "/lembur",
    },
  },
  {
    id: "notif-sub-01",
    type: "pengajuan_submitted",
    title: "⏳ Pengajuan Sakit Sedang Diproses",
    message: "Pengajuan Sakit Anda (20 - 21 Sep 2026 • Surat Dokter Terlampir) dalam antrean verifikasi HRD.",
    timestamp: "8 hari yang lalu",
    createdAt: new Date(Date.now() - 192 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    statusBadge: "pending",
    meta: {
      requestType: "sakit",
      category: "Cuti Sakit",
      targetUrl: "/pengajuan",
    },
  },
  {
    id: "notif-sub-02",
    type: "pengajuan_submitted",
    title: "⏳ Pengajuan Lembur Menunggu Verifikasi",
    message: "Pengajuan Lembur Anda (24 Sep 2026 • Integrasi API Payment) sedang dalam antrean review Team Lead.",
    timestamp: "9 hari yang lalu",
    createdAt: new Date(Date.now() - 216 * 60 * 60 * 1000).toISOString(),
    isRead: true,
    statusBadge: "pending",
    meta: {
      requestType: "lembur",
      category: "Lembur Integrasi API",
      targetUrl: "/lembur",
    },
  },
];

const DATA_VERSION = "bisa_notif_v8";

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
  let notifs = getNotifications();

  let activeFilter: "all" | "unread" | "instruction" | "pengajuan" | "lembur" = "all";

  const renderNotifItem = (item: AppNotification) => {
    const isInstruction = item.type === "lembur_instruction";
    const isApproved = item.statusBadge === "approved";
    const isRejected = item.statusBadge === "rejected";
    const unreadDot = !item.isRead
      ? `<span class="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-0.5"></span>`
      : "";

    if (isInstruction) {
      const isAccepted = item.meta?.instructionStatus === "accepted";
      const isDeclined = item.meta?.instructionStatus === "declined";

      return `
        <div class="notif-card p-3 rounded-2xl ${
          !item.isRead
            ? "bg-amber-50/90 border-amber-300 shadow-2xs"
            : isDeclined
            ? "bg-rose-50/50 border-rose-200"
            : "bg-amber-50/50 border-amber-200/70"
        } border text-left mb-2.5 transition-all cursor-pointer hover:border-amber-400" data-id="${item.id}">
          <div class="flex items-center justify-between gap-1 mb-1">
            <span class="inline-flex items-center gap-1 text-[10px] font-bold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-md">
              🚨 Perintah Lembur Atasan
            </span>
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] text-slate-400 font-medium">${item.timestamp}</span>
              ${unreadDot}
            </div>
          </div>
          <h5 class="text-xs font-bold text-slate-800 leading-snug">${item.title.replace(/^[^\w\s]+/, "").trim()}</h5>
          <p class="text-[11.5px] text-slate-600 mt-0.5 leading-relaxed">${item.message}</p>
          
          <div class="mt-2 p-2 rounded-xl bg-white/90 border border-amber-200/60 text-[11px] space-y-1">
            <div class="flex justify-between items-center text-slate-600">
              <span class="font-semibold text-slate-800">Dari: ${item.meta?.instructionFrom || "Atasan"}</span>
              <span class="font-bold text-amber-800">${item.meta?.instructionHours || ""}</span>
            </div>
            <p class="text-slate-600 leading-snug"><span class="font-medium text-slate-500">Tugas:</span> ${item.meta?.instructionTask || ""}</p>
          </div>

          ${
            isAccepted
              ? `<div class="mt-2.5 flex items-center justify-between">
                  <span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-1 rounded-lg border border-emerald-200">
                    ✓ Siap Lembur (Disetujui)
                  </span>
                  <span class="text-[10px] font-semibold text-emerald-600">Terkonfirmasi</span>
                </div>`
              : isDeclined
              ? `<div class="mt-2.5 p-2 rounded-xl bg-rose-50 border border-rose-200/80 text-[11px] text-rose-800">
                  <div class="flex items-center justify-between mb-1">
                    <span class="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md">
                      ✕ Lembur Ditolak
                    </span>
                    <span class="text-[10px] font-medium text-rose-500">Telah Dibatalkan</span>
                  </div>
                  <p class="text-rose-700 leading-snug"><span class="font-semibold text-rose-900">Alasan:</span> ${item.meta?.declineReason || "Ada kendala yang tidak dapat ditinggalkan"}</p>
                </div>`
              : `<div class="mt-2.5 flex items-center gap-2">
                  <button class="btn-accept-lembur flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] py-1.5 px-3 rounded-xl cursor-pointer transition-all active:scale-95 shadow-xs flex items-center justify-center gap-1" data-id="${item.id}">
                    ✓ Setuju (Siap Lembur)
                  </button>
                  <button class="btn-decline-lembur flex-1 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-800 border border-rose-200 font-bold text-[11px] py-1.5 px-3 rounded-xl cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1" data-id="${item.id}">
                    ✕ Tidak Setuju
                  </button>
                </div>`
          }
        </div>
      `;
    }

    if (isApproved) {
      return `
        <div class="notif-card p-3 rounded-2xl ${
          !item.isRead
            ? "bg-emerald-50/80 border-emerald-200 shadow-2xs"
            : "bg-emerald-50/50 border-emerald-100"
        } border text-left mb-2 transition-all cursor-pointer hover:border-emerald-300" data-id="${item.id}">
          <div class="flex items-center justify-between gap-1 mb-1">
            <span class="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
              ✓ Disetujui
            </span>
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] text-slate-400 font-medium">${item.timestamp}</span>
              ${unreadDot}
            </div>
          </div>
          <h5 class="text-xs font-bold text-slate-800 leading-snug">${item.title.replace(/^[^\w\s]+/, "").trim()}</h5>
          <p class="text-[11.5px] text-slate-600 mt-0.5 leading-relaxed">${item.message}</p>
          ${
            item.meta?.approverName
              ? `<p class="text-[10.5px] text-emerald-700 mt-1.5 font-medium">✓ Disetujui oleh: ${item.meta.approverName}</p>`
              : ""
          }
        </div>
      `;
    }

    if (isRejected) {
      return `
        <div class="notif-card p-3 rounded-2xl ${
          !item.isRead
            ? "bg-rose-50/80 border-rose-200 shadow-2xs"
            : "bg-rose-50/50 border-rose-100"
        } border text-left mb-2 transition-all cursor-pointer hover:border-rose-300" data-id="${item.id}">
          <div class="flex items-center justify-between gap-1 mb-1">
            <span class="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md">
              ✕ Ditolak
            </span>
            <div class="flex items-center gap-1.5">
              <span class="text-[10px] text-slate-400 font-medium">${item.timestamp}</span>
              ${unreadDot}
            </div>
          </div>
          <h5 class="text-xs font-bold text-slate-800 leading-snug">${item.title.replace(/^[^\w\s]+/, "").trim()}</h5>
          <p class="text-[11.5px] text-slate-600 mt-0.5 leading-relaxed">${item.message}</p>
          ${
            item.meta?.rejectedReason
              ? `<div class="mt-1.5 p-2 rounded-xl bg-white/90 border border-rose-200/60 text-[11px] text-rose-800 leading-snug">
                  <span class="font-semibold text-rose-900">Alasan:</span> ${item.meta.rejectedReason}
                 </div>`
              : ""
          }
        </div>
      `;
    }

    // Pending / submitted
    return `
      <div class="notif-card p-3 rounded-2xl ${
        !item.isRead
          ? "bg-slate-100/90 border-slate-200 shadow-2xs"
          : "bg-slate-50 border-slate-100"
      } border text-left mb-2 transition-all cursor-pointer hover:border-slate-300" data-id="${item.id}">
        <div class="flex items-center justify-between gap-1 mb-1">
          <span class="inline-flex items-center gap-1 text-[10px] font-bold text-sky-800 bg-sky-100 px-2 py-0.5 rounded-md">
            ⏳ Menunggu
          </span>
          <div class="flex items-center gap-1.5">
            <span class="text-[10px] text-slate-400 font-medium">${item.timestamp}</span>
            ${unreadDot}
          </div>
        </div>
        <h5 class="text-xs font-bold text-slate-800 leading-snug">${item.title.replace(/^[^\w\s]+/, "").trim()}</h5>
        <p class="text-[11.5px] text-slate-600 mt-0.5 leading-relaxed">${item.message}</p>
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
                if (item.type === "lembur_instruction" && item.meta?.instructionStatus === "accepted") {
                  Swal.close();
                  window.location.href = "/lembur";
                  return;
                }
                if (item.type === "lembur_approved") {
                  Swal.close();
                  window.location.href = "/lembur";
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

