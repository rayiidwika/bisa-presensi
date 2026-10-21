"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Clock,
  CheckCircle2,
  ChevronRight,
  LogIn,
  LogOut,
  Sparkles,
  RotateCcw,
  MapPin,
  Navigation,
  ShieldCheck,
  Maximize2,
  Building2,
  Coffee,
  FileText,
  User,
  ChevronLeft,
} from "lucide-react";
import MonthYearPicker from "@/components/ui/MonthYearPicker";
import { mockOvertimeRequests, mockOvertimeSummary } from "@/lib/mockData";
import { formatDate } from "@/lib/utils";
import Pagination from "@/components/ui/Pagination";
import {
  getNotifications,
  acceptLemburInstruction,
  declineLemburInstruction,
  resetNotificationsToDefault,
  addNotification,
  AppNotification,
} from "@/lib/notifications";
import { toast } from "sonner";

const TASIK_LAT = -7.3274;
const TASIK_LNG = 108.2207;

const ITEMS = 5;

export interface UnifiedOvertimeItem {
  id: string;
  sourceType: "request" | "instruction";
  date: string;
  formattedDate: string;
  workMode: "WFO" | "WFH";
  title: string;
  timeInfo: string;
  totalHours: number | string;
  status: "approved" | "rejected" | "pending";
  statusLabel: string;
  fromWho?: string;
  role?: string;
  declineReason?: string;
  checkInTime?: string;
  checkOutTime?: string;
  checkInPhoto?: string;
  checkOutPhoto?: string;
  checkInLocation?: string;
  checkOutLocation?: string;
  checkInCoords?: { lat: number; lng: number };
  checkOutCoords?: { lat: number; lng: number };
  checkInNotes?: string;
  checkOutNotes?: string;
  notes?: string;
  isCompleted?: boolean;
  approvalTimeline?: {
    id: string;
    role: string;
    approverName: string;
    status: string;
    note?: string;
    timestamp?: string;
  }[];
}

export default function LemburPage() {
  const router = useRouter();
  const [month, setMonth] = useState("09");
  const [year, setYear] = useState(2026);
  const [page, setPage] = useState(1);
  const [instructions, setInstructions] = useState<AppNotification[]>([]);

  // Realtime Clock State
  const [realtimeClock, setRealtimeClock] = useState<string>("");
  const [todayDateFormatted, setTodayDateFormatted] = useState<string>("");

  // Overtime Attendance State (Clock In & Out)
  const [lemburCheckInTime, setLemburCheckInTime] = useState<string>("");
  const [lemburCheckOutTime, setLemburCheckOutTime] = useState<string>("");
  const [activeApprovedId, setActiveApprovedId] = useState<string | null>(null);
  const [isLemburCompleted, setIsLemburCompleted] = useState<boolean>(false);
  const [lemburSessions, setLemburSessions] = useState<Record<string, any>>({});

  const [customRequests, setCustomRequests] = useState<any[]>([]);

  const loadAttendanceState = () => {
    if (typeof window !== "undefined") {
      const savedIn = localStorage.getItem("bisa_lembur_checkin_time") || "";
      const savedOut = localStorage.getItem("bisa_lembur_checkout_time") || "";
      const savedActiveId = localStorage.getItem("bisa_lembur_active_id") || null;
      const completed = localStorage.getItem("bisa_lembur_completed") === "true";

      const rawSessions = localStorage.getItem("bisa_lembur_sessions");
      const parsedSessions = rawSessions ? JSON.parse(rawSessions) : {};

      let effectiveIn = savedIn;
      let effectiveOut = savedOut;
      if (savedActiveId) {
        const session = parsedSessions[savedActiveId] || parsedSessions[savedActiveId.toLowerCase()];
        if (session) {
          if (!effectiveIn && session.checkInTime) effectiveIn = session.checkInTime;
          if (!effectiveOut && session.checkOutTime) effectiveOut = session.checkOutTime;
        }
      }

      setLemburCheckInTime(effectiveIn);
      setLemburCheckOutTime(effectiveOut);
      setActiveApprovedId(savedActiveId);
      setIsLemburCompleted(completed);
      setLemburSessions(parsedSessions);
    }
  };

  const loadCustomRequests = () => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("bisa_custom_overtime_requests");
        if (raw) {
          setCustomRequests(JSON.parse(raw));
          return;
        }
      } catch (err) {
        console.error(err);
      }
      setCustomRequests([]);
    }
  };

  const loadInstructions = () => {
    const allNotifs = getNotifications();
    setInstructions(allNotifs.filter((n) => n.type === "lembur_instruction"));
  };

  useEffect(() => {
    loadInstructions();
    loadCustomRequests();
    loadAttendanceState();

    // Realtime clock (hanya jam dan menit)
    const updateClock = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      setRealtimeClock(`${h}:${m}`);

      const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const months = [
        "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
        "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
      ];
      setTodayDateFormatted(
        `${days[now.getDay()]} , ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);

    const handleLemburUpdate = () => {
      loadInstructions();
      loadCustomRequests();
      loadAttendanceState();
    };

    window.addEventListener("bisa_notification_change", loadInstructions);
    window.addEventListener("bisa_lembur_change", handleLemburUpdate);
    window.addEventListener("storage", handleLemburUpdate);
    return () => {
      clearInterval(timer);
      window.removeEventListener("bisa_notification_change", loadInstructions);
      window.removeEventListener("bisa_lembur_change", handleLemburUpdate);
      window.removeEventListener("storage", handleLemburUpdate);
    };
  }, []);

  // Filter ONLY pending instructions waiting for user acceptance/decline
  const pendingInstructions = useMemo(() => {
    return instructions.filter(
      (n) => n.meta?.instructionStatus === "pending_acceptance" || !n.meta?.instructionStatus
    );
  }, [instructions]);

  // Responded instructions (accepted / declined)
  const respondedInstructions = useMemo(() => {
    return instructions.filter(
      (n) => n.meta?.instructionStatus === "accepted" || n.meta?.instructionStatus === "declined"
    );
  }, [instructions]);

  // Combined History Items (Both Responded Instructions & Self-submitted Requests)
  const allHistoryItems = useMemo<UnifiedOvertimeItem[]>(() => {
    const getSessionData = (id: string, isApproved: boolean) => {
      const nid = id.toLowerCase();
      const currentActive = (activeApprovedId || "").toLowerCase();

      // 1. If this is the active overtime session in progress (even before check in)
      if (currentActive === nid) {
        let parsedInCoords = { lat: TASIK_LAT, lng: TASIK_LNG };
        let parsedOutCoords = { lat: TASIK_LAT, lng: TASIK_LNG };
        try {
          const rawInC = typeof window !== "undefined" ? localStorage.getItem("bisa_lembur_checkin_coords") : null;
          if (rawInC) parsedInCoords = JSON.parse(rawInC);
          const rawOutC = typeof window !== "undefined" ? localStorage.getItem("bisa_lembur_checkout_coords") : null;
          if (rawOutC) parsedOutCoords = JSON.parse(rawOutC);
        } catch (e) {}

        const inNotes = typeof window !== "undefined" ? localStorage.getItem("bisa_lembur_checkin_notes") || "" : "";
        const outNotes = typeof window !== "undefined" ? localStorage.getItem("bisa_lembur_checkout_notes") || "" : "";

        return {
          checkInTime: lemburCheckInTime || "",
          checkOutTime: lemburCheckOutTime || "",
          checkInPhoto: typeof window !== "undefined" ? localStorage.getItem("bisa_lembur_checkin_photo") || "/default-face-scan.jpg" : "/default-face-scan.jpg",
          checkOutPhoto: typeof window !== "undefined" ? localStorage.getItem("bisa_lembur_checkout_photo") || "/default-checkout-scan.jpg" : "/default-checkout-scan.jpg",
          checkInLocation: typeof window !== "undefined" ? localStorage.getItem("bisa_lembur_checkin_location") || "Kantor BISA MEDIA, Tasikmalaya" : "Kantor BISA MEDIA, Tasikmalaya",
          checkOutLocation: typeof window !== "undefined" ? localStorage.getItem("bisa_lembur_checkout_location") || "Kantor BISA MEDIA, Tasikmalaya" : "Kantor BISA MEDIA, Tasikmalaya",
          checkInCoords: parsedInCoords,
          checkOutCoords: parsedOutCoords,
          checkInNotes: inNotes,
          checkOutNotes: outNotes,
          notes: outNotes || inNotes || "",
          isCompleted: isLemburCompleted,
        };
      }

      // 2. Saved completed/previous sessions in lemburSessions
      const session = lemburSessions[id] || lemburSessions[nid];
      if (session) {
        return {
          checkInTime: session.checkInTime || "",
          checkOutTime: session.checkOutTime || "",
          checkInPhoto: session.checkInPhoto || "/default-face-scan.jpg",
          checkOutPhoto: session.checkOutPhoto || "/default-checkout-scan.jpg",
          checkInLocation: session.checkInLocation || "Kantor BISA MEDIA, Tasikmalaya",
          checkOutLocation: session.checkOutLocation || "Kantor BISA MEDIA, Tasikmalaya",
          checkInCoords: session.checkInCoords || { lat: TASIK_LAT, lng: TASIK_LNG },
          checkOutCoords: session.checkOutCoords || { lat: TASIK_LAT, lng: TASIK_LNG },
          checkInNotes: session.checkInNotes || "",
          checkOutNotes: session.checkOutNotes || "",
          notes: session.checkOutNotes || session.checkInNotes || "",
          isCompleted: session.isCompleted ?? Boolean(session.checkInTime && session.checkOutTime),
        };
      }

      // 3. Fallback for un-clocked items (pending or newly approved)
      return {
        checkInTime: "",
        checkOutTime: "",
        checkInPhoto: "/default-face-scan.jpg",
        checkOutPhoto: "/default-checkout-scan.jpg",
        checkInLocation: "Kantor BISA MEDIA, Kota Tasikmalaya",
        checkOutLocation: "Kantor BISA MEDIA, Kota Tasikmalaya",
        checkInCoords: { lat: TASIK_LAT, lng: TASIK_LNG },
        checkOutCoords: { lat: TASIK_LAT, lng: TASIK_LNG },
        checkInNotes: "",
        checkOutNotes: "",
        notes: "",
        isCompleted: false,
      };
    };

    // 1. Custom user requests submitted via form or approved in simulation
    const customItems: UnifiedOvertimeItem[] = customRequests.map((req) => {
      const isApproved = req.status === "approved";
      const sData = getSessionData(req.id, isApproved);
      let timeDisplay = `${req.startTime} - ${req.endTime}`;
      if (sData.checkInTime && sData.checkOutTime) {
        timeDisplay = `${sData.checkInTime} - ${sData.checkOutTime}`;
      } else if (sData.checkInTime) {
        timeDisplay = `${sData.checkInTime} - --:--`;
      }

      return {
        id: req.id,
        sourceType: "request",
        date: req.date,
        formattedDate: formatDate(req.date),
        workMode: req.workMode,
        title: req.description,
        timeInfo: timeDisplay,
        totalHours: `${req.totalHours} Jam`,
        status: req.status === "approved" ? "approved" : req.status === "rejected" ? "rejected" : "pending",
        statusLabel: req.status === "approved" ? "Disetujui" : req.status === "rejected" ? "Ditolak" : "Pending",
        approvalTimeline: req.approvalTimeline,
        ...sData,
      };
    });

    // 2. Responded instructions
    const instructionItems: UnifiedOvertimeItem[] = respondedInstructions.map((inst) => {
      const isAccepted = inst.meta?.instructionStatus === "accepted";
      const status: "approved" | "rejected" = isAccepted ? "approved" : "rejected";
      const statusLabel = isAccepted ? "Disetujui" : "Ditolak";
      const sData = getSessionData(inst.id, isAccepted);

      let timeDisplay = inst.meta?.instructionHours || "--:-- - --:--";
      if (sData.checkInTime && sData.checkOutTime) {
        timeDisplay = `${sData.checkInTime} - ${sData.checkOutTime}`;
      } else if (sData.checkInTime) {
        timeDisplay = `${sData.checkInTime} - --:--`;
      }

      return {
        id: inst.id,
        sourceType: "instruction",
        date: inst.createdAt,
        formattedDate: inst.meta?.instructionDate || formatDate(inst.createdAt),
        workMode: "WFO",
        title: inst.meta?.instructionTask || inst.title.replace(/^🚨\s*/, ""),
        timeInfo: timeDisplay,
        totalHours: inst.meta?.instructionDuration || "3 Jam",
        status,
        statusLabel,
        fromWho: inst.meta?.instructionFrom,
        role: inst.meta?.instructionRole,
        declineReason: inst.meta?.declineReason,
        ...sData,
      };
    });

    // 3. Self-requested overtime from mock data (filtered if overridden in customRequests)
    const requestItems: UnifiedOvertimeItem[] = mockOvertimeRequests
      .filter((req) => !customRequests.some((c) => c.id.toLowerCase() === req.id.toLowerCase()))
      .map((req) => {
      const isApproved = req.status === "approved";
      const sData = getSessionData(req.id, isApproved);
      let timeDisplay = `${req.startTime} - ${req.endTime}`;
      if (sData.checkInTime && sData.checkOutTime) {
        timeDisplay = `${sData.checkInTime} - ${sData.checkOutTime}`;
      }

      return {
        id: req.id,
        sourceType: "request",
        date: req.date,
        formattedDate: formatDate(req.date),
        workMode: req.workMode,
        title: req.description,
        timeInfo: timeDisplay,
        totalHours: `${req.totalHours} Jam`,
        status: req.status === "approved" ? "approved" : req.status === "rejected" ? "rejected" : "pending",
        statusLabel: req.status === "approved" ? "Disetujui" : req.status === "rejected" ? "Ditolak" : "Pending",
        approvalTimeline: req.approvalTimeline,
        ...sData,
      };
    });

    return [...customItems, ...instructionItems, ...requestItems];
  }, [customRequests, respondedInstructions, lemburSessions, lemburCheckInTime, lemburCheckOutTime, activeApprovedId, isLemburCompleted]);

  // ── 4. Overtime Session yang Sedang Aktif (Approved) ──────
  // TAMPIL DI ATAS JIKA SUDAH DISETUJUI, DAN HILANG OTOMATIS SETELAH BERES CLOCK OUT
  const activeApprovedOvertime = useMemo(() => {
    const isSessionDone = (itemId: string, checkOut?: string) => {
      const sid = itemId.toLowerCase();
      const sess = lemburSessions[sid] || lemburSessions[itemId];
      if (sess?.isCompleted || (sess?.checkOutTime && sess.checkOutTime !== "-- : --")) {
        return true;
      }
      if (checkOut && checkOut !== "-- : --" && checkOut !== "--:--" && checkOut !== "-") {
        return true;
      }
      if (activeApprovedId && activeApprovedId.toLowerCase() === sid) {
        if (isLemburCompleted) return true;
        if (lemburCheckOutTime && lemburCheckOutTime !== "-- : --" && lemburCheckOutTime !== "--:--" && lemburCheckOutTime !== "-") {
          return true;
        }
      }
      return false;
    };

    // 1. Cek jika sesi aktif yang dipilih belum selesai clock out
    if (activeApprovedId) {
      const found = allHistoryItems.find(
        (item) => item.id.toLowerCase() === activeApprovedId.toLowerCase() && item.status === "approved"
      );
      if (found && !isSessionDone(found.id, found.checkOutTime)) {
        return found;
      }
    }

    // 2. Cari lembur approved lain (baik instruksi maupun pengajuan) yang BELUM selesai clock out
    const uncompletedApproved = allHistoryItems.find((item) => {
      if (item.status !== "approved") return false;
      return !isSessionDone(item.id, item.checkOutTime);
    });

    if (uncompletedApproved) return uncompletedApproved;

    return null;
  }, [activeApprovedId, allHistoryItems, isLemburCompleted, lemburCheckOutTime, lemburSessions]);

  // Auto-sync activeApprovedId if activeApprovedOvertime exists
  useEffect(() => {
    if (activeApprovedOvertime && activeApprovedId?.toLowerCase() !== activeApprovedOvertime.id.toLowerCase()) {
      setActiveApprovedId(activeApprovedOvertime.id);
      if (typeof window !== "undefined") {
        localStorage.setItem("bisa_lembur_active_id", activeApprovedOvertime.id);
      }
    }
  }, [activeApprovedOvertime, activeApprovedId]);

  // Dynamic summary stats (Yang diajukan & Yang disetujui)
  const summaryStats = useMemo(() => {
    let requested = 0;
    let approved = 0;
    allHistoryItems.forEach((item) => {
      const match = String(item.totalHours || "").match(/(\d+(?:\.\d+)?)/);
      const hours = match ? parseFloat(match[1]) : 3;
      requested += hours;
      if (item.status === "approved") {
        approved += hours;
      }
    });
    return {
      requested: requested || 3,
      approved,
    };
  }, [allHistoryItems]);

  const totalPages = Math.max(1, Math.ceil(allHistoryItems.length / ITEMS));
  const paginated = allHistoryItems.slice((page - 1) * ITEMS, page * ITEMS);

  // Handle Accept Instruction (Klik "Ya") -> Munculkan Clock In & Out (Image 2)
  const handleAccept = (id: string) => {
    const targetInst = instructions.find((n) => n.id === id);
    acceptLemburInstruction(id);
    loadInstructions();
    setActiveApprovedId(id);
    setIsLemburCompleted(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("bisa_lembur_active_id", id);
      localStorage.removeItem("bisa_lembur_completed");
      localStorage.removeItem("bisa_lembur_checkin_time");
      localStorage.removeItem("bisa_lembur_checkout_time");
      setLemburCheckInTime("");
      setLemburCheckOutTime("");
    }

    // Tambahkan notifikasi ke sistem
    addNotification({
      type: "lembur_approved",
      title: "Pekerjaan Lembur Disetujui",
      message: `Instruksi lembur "${targetInst?.meta?.instructionTask || targetInst?.title || "Pekerjaan Lembur"}" telah disetujui. Kartu presensi Clock In & Out kini aktif.`,
      statusBadge: "approved",
      meta: {
        requestType: "lembur",
        category: "Instruksi Lembur",
        approverName: targetInst?.meta?.instructionFrom || "Atasan",
        targetUrl: "/lembur",
      },
    });

    toast.success("Instruksi lembur disetujui!", {
      description: "Presensi lembur (Clock In / Clock Out) kini telah aktif.",
    });
  };

  // Handle Decline Instruction (Klik "Tidak")
  const handleDecline = async (id: string) => {
    const targetInst = instructions.find((n) => n.id === id);
    const Swal = (await import("sweetalert2")).default;
    const { value: reasonText } = await Swal.fire({
      title: "Alasan Menolak Lembur",
      html: `
        <div class="text-left mt-2 space-y-2.5">
          <p class="text-xs text-slate-600 leading-relaxed">
            Mohon berikan alasan mengapa Anda tidak dapat menjalankan instruksi lembur ini:
          </p>
          <div>
            <label class="text-[11px] font-bold text-slate-700 mb-1.5 block">Alasan: <span class="text-rose-500">*</span></label>
            <textarea id="decline-reason-input-page" rows="4" class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#156bb8] placeholder:text-slate-400" placeholder="Tuliskan alasan penolakan di sini..."></textarea>
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
        const textInput = document.getElementById("decline-reason-input-page") as HTMLTextAreaElement | null;
        if (textInput) textInput.focus();
      },
      preConfirm: () => {
        const textInput = document.getElementById("decline-reason-input-page") as HTMLTextAreaElement | null;
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
      loadInstructions();

      addNotification({
        type: "lembur_rejected",
        title: "Instruksi Lembur Ditolak",
        message: `Anda menolak instruksi lembur "${targetInst?.meta?.instructionTask || "Pekerjaan Lembur"}". Alasan: "${reasonText}".`,
        statusBadge: "rejected",
        meta: {
          requestType: "lembur",
          category: "Instruksi Lembur",
          declineReason: reasonText,
          targetUrl: "/lembur",
        },
      });

      toast.info("Penolakan lembur dicatat dan masuk ke Riwayat Lembur.");
    }
  };

  // Handle Clock In (Opens Face Scan Camera & GPS verification)
  const handleClockIn = () => {
    if (lemburCheckInTime) {
      toast.info(`Anda sudah Check-In lembur pada ${lemburCheckInTime}`);
      return;
    }
    // Redirect to camera face scan page for Clock In Lembur with active ID
    router.push(`/absensi/check-in?type=lembur_in&id=${activeApprovedId || ""}`);
  };

  // Handle Clock Out (Opens Face Scan Camera & GPS verification)
  const handleClockOut = () => {
    if (!lemburCheckInTime) {
      toast.error("Silakan lakukan Check-In lembur terlebih dahulu!");
      return;
    }
    if (lemburCheckOutTime) {
      toast.info(`Anda sudah Check-Out lembur pada ${lemburCheckOutTime}`);
      return;
    }
    // Redirect to camera face scan page for Clock Out Lembur with active ID
    router.push(`/absensi/check-in?type=lembur_out&id=${activeApprovedId || ""}`);
  };

  // Calculate Real-time Overtime Duration (Jam, Menit & Detik)
  const calculateDuration = (): string => {
    if (!lemburCheckInTime) return "0 Jam 0 Menit";
    const inParts = lemburCheckInTime.split(":").map(Number);
    const inH = inParts[0] || 0;
    const inM = inParts[1] || 0;
    const inTotalSec = inH * 3600 + inM * 60;

    let outTotalSec = inTotalSec;
    if (lemburCheckOutTime) {
      const outParts = lemburCheckOutTime.split(":").map(Number);
      const outH = outParts[0] || 0;
      const outM = outParts[1] || 0;
      outTotalSec = outH * 3600 + outM * 60;
    } else {
      const now = new Date();
      outTotalSec = now.getHours() * 3600 + now.getMinutes() * 60;
    }

    const diffSec = Math.max(0, outTotalSec - inTotalSec);
    const h = Math.floor(diffSec / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    return `${h} Jam ${m} Menit`;
  };

  // Handle Approve a Pending Overtime Request (Simulation / Atasan Menyetujui)
  const handleApprovePendingRequest = (id: string) => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("bisa_custom_overtime_requests");
        const list = raw ? JSON.parse(raw) : [];
        const index = list.findIndex((x: any) => x.id === id);

        if (index >= 0) {
          list[index].status = "approved";
          list[index].approvalTimeline = [
            { id: `AT-${id}-1`, role: "Team Lead", approverName: "Budi Santoso", status: "approved", note: "Disetujui untuk lembur", timestamp: new Date().toISOString() },
            { id: `AT-${id}-2`, role: "HR Manager", approverName: "Siti Rahayu", status: "approved", note: "Terverifikasi sistem", timestamp: new Date().toISOString() },
          ];
          localStorage.setItem("bisa_custom_overtime_requests", JSON.stringify(list));
        } else {
          // If it's from mock data (e.g. OT-003)
          const mockItem = mockOvertimeRequests.find((x) => x.id === id);
          if (mockItem) {
            const converted = {
              ...mockItem,
              status: "approved",
              approvalTimeline: [
                { id: `AT-${id}-1`, role: "Team Lead", approverName: "Budi Santoso", status: "approved", note: "Disetujui untuk lembur", timestamp: new Date().toISOString() },
                { id: `AT-${id}-2`, role: "HR Manager", approverName: "Siti Rahayu", status: "approved", note: "Terverifikasi sistem", timestamp: new Date().toISOString() },
              ],
            };
            localStorage.setItem("bisa_custom_overtime_requests", JSON.stringify([converted, ...list]));
          }
        }

        localStorage.setItem("bisa_lembur_active_id", id);
        localStorage.removeItem("bisa_lembur_completed");
        localStorage.removeItem("bisa_lembur_checkin_time");
        localStorage.removeItem("bisa_lembur_checkout_time");

        setActiveApprovedId(id);
        setIsLemburCompleted(false);
        setLemburCheckInTime("");
        setLemburCheckOutTime("");
        loadCustomRequests();

        // Tambahkan notifikasi pengajuan disetujui
        addNotification({
          type: "lembur_approved",
          title: "Pengajuan Lembur Disetujui",
          message: "Pengajuan lembur Anda telah disetujui oleh atasan. Kartu presensi Clock In & Out kini telah aktif.",
          statusBadge: "approved",
          meta: {
            requestType: "lembur",
            category: "Pengajuan Lembur",
            approverName: "Budi Santoso (Team Lead)",
            targetUrl: "/lembur",
          },
        });

        window.scrollTo({ top: 0, behavior: "smooth" });
        toast.success("Pengajuan lembur disetujui!", {
          description: "Kartu presensi Clock In & Clock Out kini telah aktif di bagian atas.",
        });
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Handle Activate an Approved Overtime Session (Start Clock In/Out)
  const handleActivateApprovedOvertime = (id: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("bisa_lembur_active_id", id);
      localStorage.removeItem("bisa_lembur_completed");
      localStorage.removeItem("bisa_lembur_checkin_time");
      localStorage.removeItem("bisa_lembur_checkout_time");
      setActiveApprovedId(id);
      setIsLemburCompleted(false);
      setLemburCheckInTime("");
      setLemburCheckOutTime("");
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.info("Presensi lembur aktif!", {
        description: "Silakan lakukan Check In lembur.",
      });
    }
  };

  // Handle Reset Simulation Data
  const handleResetSimulation = () => {
    resetNotificationsToDefault();
    if (typeof window !== "undefined") {
      localStorage.removeItem("bisa_custom_overtime_requests");
      localStorage.removeItem("bisa_lembur_sessions");
      localStorage.removeItem("bisa_lembur_checkin_time");
      localStorage.removeItem("bisa_lembur_checkout_time");
      localStorage.removeItem("bisa_lembur_checkin_photo");
      localStorage.removeItem("bisa_lembur_checkout_photo");
      localStorage.removeItem("bisa_lembur_checkin_location");
      localStorage.removeItem("bisa_lembur_checkout_location");
      localStorage.removeItem("bisa_lembur_checkin_notes");
      localStorage.removeItem("bisa_lembur_checkout_notes");
      localStorage.removeItem("bisa_lembur_completed");
      localStorage.removeItem("bisa_lembur_active_id");
    }
    setActiveApprovedId(null);
    setIsLemburCompleted(false);
    setLemburCheckInTime("");
    setLemburCheckOutTime("");
    setLemburSessions({});
    loadInstructions();
    loadCustomRequests();
    toast.success("Data simulasi lembur berhasil direset!", {
      description: "Instruksi dan pengajuan lembur baru siap untuk dikonfirmasi.",
    });
  };

  return (
    <div className="min-h-screen bg-[#ddeef8] pb-24 select-none">
      {/* ══════════════ HEADER GRADIENT ══════════════ */}
      <div className="bg-gradient-to-b from-[#2a8ee4] via-[#1f7cd0] to-[#156bb8] relative overflow-hidden">
        <div className="absolute -right-6 -top-4 w-44 h-44 pointer-events-none opacity-20 filter blur-[0.8px] rotate-[-6deg] select-none">
          <img
            src="/bisa-media-white.png"
            alt="Watermark BISA MEDIA"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="relative px-4 sm:px-6 md:px-8 pt-5 pb-5 flex items-center justify-between">
          <div className="w-8" />
          <h1 className="text-white font-black italic text-2xl tracking-wide flex-1 text-center">
            Lembur
          </h1>
          <button
            type="button"
            onClick={handleResetSimulation}
            title="Reset Data Simulasi Instruksi Lembur"
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 active:scale-95 text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-xs shadow-xs"
          >
            <RotateCcw size={15} />
          </button>
        </div>
        <div className="h-4 bg-[#ddeef8] rounded-t-3xl" />
      </div>

      <div className="px-4 sm:px-6 md:px-8 -mt-1 pb-6 space-y-3.5 animate-fade-in">
        {/* ══════════════ CARD 1: BULAN & TAHUN (MONTH PICKER) ══════════════ */}
        <MonthYearPicker
          month={month}
          year={year}
          onChange={(newMonth, newYear) => {
            setMonth(newMonth);
            setYear(newYear);
            setPage(1);
          }}
        />

        {/* ══════════════ CARD 2: SUMMARY STATS BOX ══════════════ */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs px-4 py-3.5 flex items-center justify-between">
          {/* Sisi Kiri: Yang di Ajukan */}
          <div className="flex-1 text-center pr-3 border-r border-slate-100">
            <p className="text-[11px] font-semibold text-slate-400">
              Yang di Ajukan
            </p>
            <p className="text-[23px] font-black italic text-[#156bb8] tracking-tight mt-0.5">
              {summaryStats.requested} Jam
            </p>
          </div>

          {/* Sisi Kanan: Yang di Setujui */}
          <div className="flex-1 text-center pl-3">
            <p className="text-[11px] font-semibold text-slate-400">
              Yang di Setujui
            </p>
            <p className="text-[23px] font-black italic text-[#156bb8] tracking-tight mt-0.5">
              {summaryStats.approved} Jam
            </p>
          </div>
        </div>

        {/* ══════════════ CARD 3: DYNAMIC ACTIVE OVERTIME / INSTRUCTION AREA ══════════════ */}
        
        {/* KASUS 1: CLOCK IN & OUT AREA UNTUK LEMBUR YANG DISETUJUI 2 PIHAK (TETAP TAMPIL DI PALING ATAS) */}
        {activeApprovedOvertime && (
          <div className="bg-gradient-to-b from-[#d9ebf9] via-[#edf5fc] to-white rounded-3xl border border-[#c4e0f5] shadow-md p-4 sm:p-5 space-y-3.5 transition-all animate-scale-up">
            {/* Header info status lembur aktif */}
            <div className="flex items-center justify-between pb-1 border-b border-blue-200/50 gap-2">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 px-2.5 py-0.5 rounded-full shadow-2xs shrink-0 whitespace-nowrap">
                <CheckCircle2 size={11} className="text-emerald-600" />
                <span>
                  {activeApprovedOvertime.sourceType === "instruction"
                    ? "Instruksi Lembur (Disetujui)"
                    : "Pengajuan Lembur (Disetujui)"}
                </span>
              </span>
              <span className="text-[10.5px] text-slate-500 font-semibold truncate text-right flex-1 min-w-0" title={activeApprovedOvertime.title}>
                {activeApprovedOvertime.title}
              </span>
            </div>

            {/* Baris Atas: Jam Besar Realtime & Jadwal Lembur */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-time text-[34px] font-black italic text-slate-800 tracking-tight leading-none">
                  {realtimeClock || "18.00"} <span className="text-xs font-semibold text-slate-500 font-sans">WIB</span>
                </h2>
                <p className="text-[11px] font-semibold text-slate-500 mt-1">
                  {todayDateFormatted || "Jumat , 11 Sep 2026"} • {activeApprovedOvertime.workMode || "WFO"}
                </p>
              </div>

              <div className="text-right flex flex-col items-end">
                <span className="font-time text-xs font-bold text-slate-700">
                  {activeApprovedOvertime.timeInfo.replace(" WIB", "")}
                </span>
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 mt-1">
                  <Clock size={12} className="text-blue-500" />
                  <span className="font-time">{calculateDuration()}</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-300/70" />

            {/* Baris Tengah: 2 Box Check In & Check Out (Hijau & Pink Lembut) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Check In Box */}
              <button
                type="button"
                onClick={handleClockIn}
                className="py-2.5 px-3 rounded-2xl bg-[#dcfce7] hover:bg-[#bbf7d0] border border-[#86efac] shadow-xs text-center cursor-pointer active:scale-95 transition-all flex flex-col items-center justify-center"
              >
                <span className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                  Check In
                </span>
                <span className="font-time text-[21px] font-black tracking-tight text-slate-800">
                  {lemburCheckInTime || "-- : --"}
                </span>
              </button>

              {/* Check Out Box */}
              <button
                type="button"
                onClick={handleClockOut}
                className="py-2.5 px-3 rounded-2xl bg-[#fee2e2] hover:bg-[#fecaca] border border-[#fca5a5] shadow-xs text-center cursor-pointer active:scale-95 transition-all flex flex-col items-center justify-center"
              >
                <span className="text-[10px] font-semibold text-slate-500 block mb-0.5">
                  Check Out
                </span>
                <span className="font-time text-[21px] font-black tracking-tight text-slate-800">
                  {lemburCheckOutTime || "-- : --"}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* KASUS 2: PENDING INSTRUCTIONS (PILIHAN YA / TIDAK JIKA ADA INSTRUKSI BELUM DI-ACC) */}
        {pendingInstructions.length > 0 && (
          <div className="space-y-3">
            {pendingInstructions.map((inst) => (
              <div
                key={inst.id}
                className="bg-gradient-to-b from-[#d9ebf9] via-[#edf5fc] to-white rounded-3xl border border-[#c4e0f5] shadow-md p-4 sm:p-5 space-y-3 transition-all animate-scale-up"
              >
                {/* Header Card Instruksi */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold text-slate-600 bg-white/90 border border-slate-300 px-2.5 py-0.5 rounded-full shadow-2xs">
                    <FileText size={11} className="text-[#156bb8]" />
                    <span>Instruksi</span>
                  </span>
                  <span className="text-[10.5px] text-slate-400 font-medium">
                    {inst.timestamp || "5 menit yang lalu"}
                  </span>
                </div>

                {/* Judul Tugas Instruksi */}
                <h3 className="text-base sm:text-lg font-black italic text-slate-800 leading-snug">
                  {inst.meta?.instructionTask || inst.title.replace(/^🚨\s*/, "")}
                </h3>

                {/* Inner Gray/White Detail Box */}
                <div className="p-3 rounded-2xl bg-white/70 border border-slate-200/90 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <p className="font-semibold text-slate-700 truncate">
                      Dari : {inst.meta?.instructionFrom || "Bapak Rahmat"}
                    </p>
                    <span className="font-bold text-[#156bb8]">
                      {inst.meta?.instructionHours || "12:00 - 12:00"}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-slate-500 font-medium">
                    {inst.meta?.instructionDate || "Sabtu, 04 Oktober 2026"} - {inst.meta?.category?.includes("HR") ? "WFH" : "WFO"}
                  </p>
                </div>

                <div className="h-px bg-slate-300/70" />

                {/* Tombol Aksi: Ya (Hijau Lembut) & Tidak (Merah/Pink Lembut) */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleAccept(inst.id)}
                    className="py-3 px-4 rounded-2xl bg-[#dcfce7] hover:bg-[#bbf7d0] active:scale-95 text-slate-800 font-black italic text-base border border-[#86efac] shadow-xs transition-all cursor-pointer text-center"
                  >
                    Ya
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDecline(inst.id)}
                    className="py-3 px-4 rounded-2xl bg-[#fee2e2] hover:bg-[#fecaca] active:scale-95 text-slate-800 font-black italic text-base border border-[#fca5a5] shadow-xs transition-all cursor-pointer text-center"
                  >
                    Tidak
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════ CARD 4: RIWAYAT LEMBUR ══════════════ */}
        <div className="space-y-2">
          <h3 className="text-[14px] font-bold text-slate-800 mb-2 px-1">
            Riwayat Lembur
          </h3>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
            {paginated.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">
                Belum ada riwayat lembur
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {paginated.map((item) => {
                  const barColor =
                    item.status === "approved"
                      ? "bg-emerald-500"
                      : item.status === "rejected"
                      ? "bg-rose-500"
                      : "bg-orange-500"; // PENDING BERWARNA OREN SESUAI PERMINTAAN USER

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => router.push(`/lembur/${item.id}`)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50/80 active:bg-blue-50/40 transition-colors group cursor-pointer"
                    >
                      {/* Sisi Kiri: Garis Warna Vertikal + Judul & Tanggal */}
                      <div className="flex items-start gap-3 flex-1 min-w-0 pr-3">
                        <div
                          className={`w-1.5 self-stretch min-h-[38px] rounded-full ${barColor} shrink-0 mt-0.5`}
                        />

                        <div className="flex-1 min-w-0">
                          {item.sourceType === "instruction" && (
                            <div className="mb-1">
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-slate-600 bg-white border border-slate-200/90 px-1.5 py-0.5 rounded-md leading-none shadow-2xs">
                                <FileText size={9} className="text-[#156bb8]" />
                                Instruksi
                              </span>
                            </div>
                          )}
                          <p className="text-[14.5px] font-bold text-slate-800 italic group-hover:text-[#156bb8] transition-colors leading-tight">
                            {item.title}
                          </p>
                          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                            {item.formattedDate}
                          </p>
                        </div>
                      </div>

                      {/* Sisi Kanan: Jam & Indikator Info i+ */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-time text-[13.5px] font-semibold text-slate-600 tracking-wider">
                          {item.status === "pending" || !item.checkInTime
                            ? "--:-- - --:--"
                            : item.timeInfo.replace(" WIB", "")}
                        </span>
                        <ChevronRight
                          size={16}
                          className="text-slate-400 group-hover:text-[#156bb8] transition-colors shrink-0"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* ══════════════ EXTENDED FLOATING ACTION BUTTON (+ AJUKAN) ══════════════ */}
      <button
        type="button"
        onClick={() => router.push("/lembur/tambah")}
        className="fixed bottom-[84px] z-40 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#1a7dc4] to-[#156bb8] text-white shadow-lg shadow-[#156bb8]/35 flex items-center gap-1.5 hover:brightness-105 active:scale-95 transition-all cursor-pointer font-bold italic text-[13.5px] tracking-wide right-5 md:right-[calc(50%-21rem+1.25rem)] lg:right-[calc(50%-24rem+1.25rem)] xl:right-[calc(50%-28rem+1.25rem)]"
        aria-label="Ajukan Lembur"
      >
        <Plus size={18} strokeWidth={2.5} />
        <span>Ajukan</span>
      </button>

    </div>
  );
}
