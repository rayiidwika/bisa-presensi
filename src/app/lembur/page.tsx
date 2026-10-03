"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Check,
  X,
  Calendar,
  Info,
  ChevronRight,
  LogIn,
  LogOut,
  Sparkles,
  RotateCcw,
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
  AppNotification,
} from "@/lib/notifications";
import { toast } from "sonner";

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
  const [selectedItem, setSelectedItem] = useState<UnifiedOvertimeItem | null>(null);

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
      const completed =
        localStorage.getItem("bisa_lembur_completed") === "true" ||
        (Boolean(savedIn) && Boolean(savedOut));

      const rawSessions = localStorage.getItem("bisa_lembur_sessions");
      const parsedSessions = rawSessions ? JSON.parse(rawSessions) : {};

      setLemburCheckInTime(savedIn);
      setLemburCheckOutTime(savedOut);
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

    // Realtime clock
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
      const session = lemburSessions[id];
      if (session) {
        return {
          checkInTime: session.checkInTime,
          checkOutTime: session.checkOutTime,
          checkInPhoto: session.checkInPhoto || "/default-face-scan.jpg",
          checkOutPhoto: session.checkOutPhoto || "/default-checkout-scan.jpg",
          checkInLocation: session.checkInLocation || "Kantor BISA MEDIA, Tasikmalaya",
          checkOutLocation: session.checkOutLocation || "Kantor BISA MEDIA, Tasikmalaya",
          notes: session.checkOutNotes || session.checkInNotes || "",
          isCompleted: session.isCompleted ?? Boolean(session.checkInTime && session.checkOutTime),
        };
      }
      if (activeApprovedId === id && (lemburCheckInTime || lemburCheckOutTime)) {
        return {
          checkInTime: lemburCheckInTime,
          checkOutTime: lemburCheckOutTime,
          checkInPhoto: typeof window !== "undefined" ? localStorage.getItem("bisa_lembur_checkin_photo") || "/default-face-scan.jpg" : "/default-face-scan.jpg",
          checkOutPhoto: typeof window !== "undefined" ? localStorage.getItem("bisa_lembur_checkout_photo") || "/default-checkout-scan.jpg" : "/default-checkout-scan.jpg",
          checkInLocation: typeof window !== "undefined" ? localStorage.getItem("bisa_lembur_checkin_location") || "Kota Tasikmalaya, Jawa Barat" : "Kota Tasikmalaya, Jawa Barat",
          checkOutLocation: typeof window !== "undefined" ? localStorage.getItem("bisa_lembur_checkout_location") || "Kota Tasikmalaya, Jawa Barat" : "Kota Tasikmalaya, Jawa Barat",
          notes: typeof window !== "undefined" ? localStorage.getItem("bisa_lembur_checkout_notes") || localStorage.getItem("bisa_lembur_checkin_notes") || "" : "",
          isCompleted: isLemburCompleted,
        };
      }
      if (isApproved) {
        return {
          checkInTime: "17:30",
          checkOutTime: "21:00",
          checkInPhoto: "/default-face-scan.jpg",
          checkOutPhoto: "/default-checkout-scan.jpg",
          checkInLocation: "Kantor BISA MEDIA, Kota Tasikmalaya",
          checkOutLocation: "Kantor BISA MEDIA, Kota Tasikmalaya",
          notes: "Presensi lembur tercatat dan terverifikasi biometrik",
          isCompleted: true,
        };
      }
      return {};
    };

    // 1. Custom user requests submitted via form
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

    // 3. Self-requested overtime from mock data
    const requestItems: UnifiedOvertimeItem[] = mockOvertimeRequests.map((req) => {
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

  // Check if there is an active approved overtime to show the Clock In/Out card
  // HIDE IF LEMBUR IS ALREADY COMPLETED (CHECKED OUT)
  const activeApprovedOvertime = useMemo(() => {
    if (isLemburCompleted) return null;

    // Only show Clock In/Out card if the user explicitly accepted an instruction or started an approved session
    if (activeApprovedId) {
      const found = allHistoryItems.find((item) => item.id === activeApprovedId && item.status === "approved");
      if (found) return found;
    }

    return null;
  }, [activeApprovedId, allHistoryItems, isLemburCompleted]);

  const totalPages = Math.max(1, Math.ceil(allHistoryItems.length / ITEMS));
  const paginated = allHistoryItems.slice((page - 1) * ITEMS, page * ITEMS);

  // Handle Accept Instruction
  const handleAccept = (id: string) => {
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
    toast.success("Instruksi lembur disetujui!", {
      description: "Presensi lembur (Clock In / Clock Out) kini aktif.",
    });
  };

  // Handle Decline Instruction
  const handleDecline = async (id: string) => {
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

  // Calculate Real-time Overtime Duration (Jam & Menit)
  const calculateDuration = (): string => {
    if (!lemburCheckInTime) return "0 Jam 0 Menit";
    const [inH, inM] = lemburCheckInTime.split(":").map(Number);
    const inTotal = inH * 60 + inM;

    let outTotal = inTotal;
    if (lemburCheckOutTime) {
      const [outH, outM] = lemburCheckOutTime.split(":").map(Number);
      outTotal = outH * 60 + outM;
    } else {
      const now = new Date();
      outTotal = now.getHours() * 60 + now.getMinutes();
    }

    const diff = Math.max(0, outTotal - inTotal);
    const h = Math.floor(diff / 60);
    const m = diff % 60;
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
        setSelectedItem(null);

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
      setSelectedItem(null);
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
        <div className="relative px-4 pt-5 pb-5 flex items-center justify-between">
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

      <div className="px-4 -mt-1 pb-6 space-y-3.5 animate-fade-in">
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
              {mockOvertimeSummary.totalHoursRequested} Jam
            </p>
          </div>

          {/* Sisi Kanan: Yang di Setujui */}
          <div className="flex-1 text-center pl-3">
            <p className="text-[11px] font-semibold text-slate-400">
              Yang di Setujui
            </p>
            <p className="text-[23px] font-black italic text-[#156bb8] tracking-tight mt-0.5">
              {mockOvertimeSummary.totalHoursApproved} Jam
            </p>
          </div>
        </div>

        {/* ══════════════ CARD 3: DYNAMIC ACTIVE OVERTIME AREA ══════════════ */}
        
        {/* KASUS A: ADA PERINTAH/INSTRUKSI LEMBUR MENUNGGU PERSETUJUAN */}
        {pendingInstructions.length > 0 ? (
          <div className="space-y-3">
            {pendingInstructions.map((inst) => (
              <div
                key={inst.id}
                className="bg-gradient-to-b from-blue-50/70 via-white to-white rounded-3xl border border-blue-200/90 shadow-md p-4 sm:p-5 space-y-3 transition-all animate-scale-up"
              >
                {/* Header Card Instruksi */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#156bb8] bg-blue-100/90 border border-blue-200/80 px-2.5 py-0.5 rounded-md shadow-2xs">
                    <span className="w-2 h-2 rounded-xs bg-[#156bb8]" />
                    Instruksi
                  </span>
                  <span className="text-[10.5px] text-slate-400 font-medium">
                    {inst.timestamp}
                  </span>
                </div>

                {/* Judul Tugas Instruksi */}
                <h3 className="text-sm sm:text-base font-black italic text-slate-800 leading-snug">
                  {inst.meta?.instructionTask || inst.title}
                </h3>

                {/* Inner Gray/Blue Detail Box */}
                <div className="p-3 rounded-2xl bg-slate-100/80 border border-slate-200/70 flex items-center justify-between text-[11px] text-slate-600 gap-2">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <p className="font-semibold text-slate-700 truncate">
                      Dari : {inst.meta?.instructionFrom || "Atasan"}
                    </p>
                    <p className="text-slate-500 font-medium text-[10.5px]">
                      {inst.meta?.instructionDate || "Hari ini"} - {inst.meta?.category?.includes("HR") ? "WFH" : "WFO"}
                    </p>
                  </div>
                  <span className="font-black text-[#156bb8] text-xs shrink-0 tracking-tight">
                    {inst.meta?.instructionHours || "17:30 - 21:00"}
                  </span>
                </div>

                <div className="h-px bg-slate-200/70" />

                {/* Tombol Aksi: Setuju (Hijau Lembut) & Tidak Setuju (Merah Lembut) */}
                <div className="grid grid-cols-2 gap-3 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleAccept(inst.id)}
                    className="py-2.5 px-3 rounded-2xl bg-[#dcfce7] hover:bg-[#bbf7d0] active:bg-[#86efac] text-[#15803d] font-bold text-xs border border-[#86efac] shadow-sm transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1.5"
                  >
                    <Check size={14} strokeWidth={2.5} />
                    <span>Setuju (Siap Lembur)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDecline(inst.id)}
                    className="py-2.5 px-3 rounded-2xl bg-[#fee2e2] hover:bg-[#fecaca] active:bg-[#fca5a5] text-[#b91c1c] font-bold text-xs border border-[#fca5a5] shadow-sm transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1.5"
                  >
                    <X size={14} strokeWidth={2.5} />
                    <span>Tidak Setuju</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : activeApprovedOvertime ? (
          /* KASUS B: LEMBUR DISETUJUI & AKTIF (TAMPILAN REALTIME CLOCK IN & OUT) */
          <div className="bg-gradient-to-b from-blue-100/70 via-blue-50/40 to-white rounded-3xl border border-blue-200/80 shadow-md p-4 sm:p-5 space-y-3.5 transition-all animate-scale-up">
            {/* Baris Atas: Jam Besar Realtime & Jadwal Lembur */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[34px] font-black text-slate-800 tracking-tight leading-none">
                  {realtimeClock || "12:12"}
                </h2>
                <p className="text-[11px] font-semibold text-slate-500 mt-1">
                  {todayDateFormatted || "Jumat , 11 Sep 2026"}
                </p>
              </div>

              <div className="text-right flex flex-col items-end">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-slate-700">
                    {activeApprovedOvertime.timeInfo.replace(" WIB", "")}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedItem(activeApprovedOvertime)}
                    className="w-4 h-4 rounded-full bg-blue-100 text-[#156bb8] flex items-center justify-center hover:bg-blue-200 transition-colors"
                    title="Detail Jadwal Lembur"
                  >
                    <Info size={10} strokeWidth={2.5} />
                  </button>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 mt-1">
                  <Clock size={12} className="text-blue-500" />
                  <span>{calculateDuration()}</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-slate-200/60" />

            {/* Baris Tengah: 2 Box Check In & Check Out */}
            <div className="grid grid-cols-2 gap-3">
              {/* Check In Box */}
              <button
                type="button"
                onClick={handleClockIn}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 flex flex-col items-center justify-center ${
                  lemburCheckInTime
                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-800 shadow-2xs"
                    : "bg-white hover:bg-blue-50/40 border-slate-200/90 text-slate-700 shadow-sm"
                }`}
              >
                <span className="text-[10.5px] font-bold text-slate-400 block mb-0.5">
                  Check In
                </span>
                <span className="text-[19px] font-black tracking-tight text-slate-800">
                  {lemburCheckInTime || "-- : --"}
                </span>
                {!lemburCheckInTime && (
                  <span className="text-[9.5px] font-bold text-[#156bb8] mt-0.5 block">
                    Klik untuk Check In
                  </span>
                )}
              </button>

              {/* Check Out Box */}
              <button
                type="button"
                onClick={handleClockOut}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer active:scale-95 flex flex-col items-center justify-center ${
                  lemburCheckOutTime
                    ? "bg-emerald-50/70 border-emerald-200 text-emerald-800 shadow-2xs"
                    : "bg-white hover:bg-blue-50/40 border-slate-200/90 text-slate-700 shadow-sm"
                }`}
              >
                <span className="text-[10.5px] font-bold text-slate-400 block mb-0.5">
                  Check Out
                </span>
                <span className="text-[19px] font-black tracking-tight text-slate-800">
                  {lemburCheckOutTime || "-- : --"}
                </span>
                {lemburCheckInTime && !lemburCheckOutTime && (
                  <span className="text-[9.5px] font-bold text-rose-600 mt-0.5 block">
                    Klik untuk Check Out
                  </span>
                )}
              </button>
            </div>

            {/* Baris Bawah: Status Bar / Section Bar */}
            <div className="w-full py-2 px-3 rounded-xl bg-white/90 border border-slate-200/70 text-center flex items-center justify-between text-xs font-semibold text-slate-600">
              <span className="italic text-slate-500 text-[11px] truncate">
                {activeApprovedOvertime.title}
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 text-[10.5px] shrink-0 ml-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Lembur Aktif
              </span>
            </div>
          </div>
        ) : null}

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
                      : "bg-amber-500";

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedItem(item)}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50/80 active:bg-blue-50/40 transition-colors group cursor-pointer"
                    >
                      {/* Sisi Kiri: Garis Warna Vertikal + Judul & Tanggal */}
                      <div className="flex items-start gap-3 flex-1 min-w-0 pr-3">
                        <div
                          className={`w-1.5 self-stretch min-h-[36px] rounded-full ${barColor} shrink-0 mt-0.5`}
                        />

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-[14px] font-bold text-[#156bb8] italic group-hover:text-blue-700 transition-colors leading-tight">
                              {item.formattedDate}
                            </p>
                            {item.sourceType === "instruction" && (
                              <span className="inline-flex items-center gap-1 text-[9.5px] font-bold text-[#156bb8] bg-blue-50 border border-blue-200/80 px-1.5 py-0.5 rounded-md leading-none">
                                <span className="w-1.5 h-1.5 rounded-xs bg-[#156bb8]" />
                                Instruksi
                              </span>
                            )}
                          </div>

                          <p className="text-[11.5px] text-slate-500 font-semibold italic mt-0.5 truncate">
                            {item.title}
                          </p>
                        </div>
                      </div>

                      {/* Sisi Kanan: Jam & Chevron Right */}
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="text-[14px] font-bold text-[#3589c5] tracking-wider">
                          {item.status === "pending"
                            ? "--:-- - --:--"
                            : item.timeInfo.replace(" WIB", "")}
                        </span>
                        <ChevronRight
                          size={16}
                          className="text-slate-300 group-hover:text-blue-500 transition-colors shrink-0"
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

      {/* ══════════════ POPUP MODAL DETAIL LEMBUR KETIKA DIKLIK ══════════════ */}
      {selectedItem && (
        <div
          onClick={() => setSelectedItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in select-none"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-[400px] rounded-[28px] sm:rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90dvh] animate-scale-up"
          >
            {/* Header Modal */}
            <div className="px-5 pt-4 pb-3 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center justify-center font-black text-xs px-2.5 py-0.5 rounded-lg shadow-2xs ${
                    selectedItem.workMode === "WFO"
                      ? "bg-blue-100 text-[#156bb8] border border-blue-200"
                      : "bg-purple-100 text-purple-700 border border-purple-200"
                  }`}
                >
                  {selectedItem.workMode}
                </span>
                <h3 className="text-sm font-bold text-slate-800 leading-tight">
                  Detail Riwayat Lembur
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 flex items-center justify-center transition-all cursor-pointer active:scale-95"
                aria-label="Tutup"
              >
                <X size={15} />
              </button>
            </div>

            {/* Body Modal */}
            <div className="px-5 py-4 overflow-y-auto space-y-3.5 flex-1 overscroll-contain">
              {/* Status Banner */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[10.5px] font-semibold text-slate-400 block">Kategori</span>
                  <p className="text-xs font-bold text-slate-700 mt-0.5">
                    {selectedItem.sourceType === "instruction" ? "🚨 Instruksi Lembur Atasan" : "✍️ Pengajuan Mandiri"}
                  </p>
                </div>
                {/* Status Badge with dot */}
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${
                    selectedItem.status === "approved"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : selectedItem.status === "rejected"
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedItem.status === "approved"
                        ? "bg-emerald-500"
                        : selectedItem.status === "rejected"
                        ? "bg-rose-500"
                        : "bg-amber-500"
                    }`}
                  />
                  <span>{selectedItem.statusLabel}</span>
                </span>
              </div>

              {/* Detail Info Card */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 space-y-2.5">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Pekerjaan / Judul Lembur:
                  </span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5 leading-snug">
                    {selectedItem.title}
                  </p>
                </div>

                <div className="h-px bg-slate-100" />

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10.5px] font-medium text-slate-400 block">Tanggal:</span>
                    <span className="font-bold text-slate-700">{selectedItem.formattedDate}</span>
                  </div>
                  <div>
                    <span className="text-[10.5px] font-medium text-slate-400 block">Mode Kerja:</span>
                    <span className="font-bold text-[#156bb8]">{selectedItem.workMode}</span>
                  </div>
                  <div>
                    <span className="text-[10.5px] font-medium text-slate-400 block">Waktu:</span>
                    <span className="font-bold text-slate-700">{selectedItem.timeInfo}</span>
                  </div>
                  {selectedItem.totalHours && (
                    <div>
                      <span className="text-[10.5px] font-medium text-slate-400 block">Durasi:</span>
                      <span className="font-bold text-emerald-600">{selectedItem.totalHours}</span>
                    </div>
                  )}
                </div>

                {/* Info Tambahan Instruksi Atasan */}
                {selectedItem.fromWho && (
                  <div className="pt-2 border-t border-slate-100 text-xs">
                    <span className="text-[10.5px] font-medium text-slate-400 block">Instruksi Dari:</span>
                    <p className="font-bold text-slate-800">
                      {selectedItem.fromWho} {selectedItem.role ? `(${selectedItem.role})` : ""}
                    </p>
                  </div>
                )}

                {/* Alasan Penolakan jika Ditolak */}
                {selectedItem.declineReason && (
                  <div className="pt-2 border-t border-rose-100 text-xs text-rose-800">
                    <span className="text-[10.5px] font-bold text-rose-600 block">Alasan Penolakan:</span>
                    <p className="font-medium mt-0.5 leading-snug text-rose-700 bg-rose-50 p-2 rounded-xl border border-rose-200/60">
                      {selectedItem.declineReason}
                    </p>
                  </div>
                )}
              </div>

              {/* Bukti Presensi & Realisasi Lembur (Clock In & Out) */}
              {selectedItem.status === "approved" && (
                <div className="rounded-2xl border border-emerald-200/90 bg-gradient-to-b from-emerald-50/70 to-white p-3.5 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                    <span className="text-[11.5px] font-bold text-emerald-800 flex items-center gap-1.5">
                      <Sparkles size={13} className="text-emerald-600" />
                      Bukti Presensi & Verifikasi Wajah
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded-full border border-emerald-200">
                      ● Terverifikasi GPS & Wajah
                    </span>
                  </div>

                  {/* 2 Kolom Foto & Waktu: Clock In & Clock Out */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Kolom 1: Clock In */}
                    <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#156bb8] bg-blue-50 px-1.5 py-0.5 rounded">
                          Clock In
                        </span>
                        <span className="text-[11px] font-black text-slate-800">
                          {selectedItem.checkInTime || "--:--"}
                        </span>
                      </div>

                      {/* Foto Selfie Scan Wajah Masuk */}
                      <div className="relative aspect-3/4 rounded-lg overflow-hidden bg-slate-100 border border-slate-200/80">
                        <img
                          src={selectedItem.checkInPhoto || "/default-face-scan.jpg"}
                          alt="Foto Clock In"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/60 text-[8.5px] font-semibold text-white px-1.5 py-0.5 rounded backdrop-blur-xs">
                          {selectedItem.checkInTime || "17:30"} WIB
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-500 leading-tight">
                        <span className="font-semibold text-slate-700 block truncate">📍 {selectedItem.checkInLocation || "Kantor BISA MEDIA, Tasikmalaya"}</span>
                      </div>
                    </div>

                    {/* Kolom 2: Clock Out */}
                    <div className="bg-white rounded-xl p-2.5 border border-slate-200/80 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                          Clock Out
                        </span>
                        <span className="text-[11px] font-black text-slate-800">
                          {selectedItem.checkOutTime || "--:--"}
                        </span>
                      </div>

                      {/* Foto Selfie Scan Wajah Keluar */}
                      <div className="relative aspect-3/4 rounded-lg overflow-hidden bg-slate-100 border border-slate-200/80">
                        <img
                          src={selectedItem.checkOutPhoto || "/default-checkout-scan.jpg"}
                          alt="Foto Clock Out"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 right-1 bg-black/60 text-[8.5px] font-semibold text-white px-1.5 py-0.5 rounded backdrop-blur-xs">
                          {selectedItem.checkOutTime || "21:00"} WIB
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-500 leading-tight">
                        <span className="font-semibold text-slate-700 block truncate">📍 {selectedItem.checkOutLocation || "Kantor BISA MEDIA, Tasikmalaya"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Catatan Presensi jika ada */}
                  {selectedItem.notes && (
                    <div className="bg-slate-50 rounded-xl p-2 border border-slate-200/60 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 block">Catatan Presensi:</span>
                      <p className="text-slate-700 font-medium text-[11px] mt-0.5">{selectedItem.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Alur Persetujuan (khusus pengajuan mandiri jika ada) */}
              {selectedItem.approvalTimeline && selectedItem.approvalTimeline.length > 0 && (
                <div className="rounded-2xl border border-slate-100 bg-white p-3.5 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    Alur Persetujuan:
                  </span>
                  <div className="space-y-2 mt-1">
                    {selectedItem.approvalTimeline.map((step, idx) => (
                      <div key={step.id || idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-100/80">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                            step.status === "approved"
                              ? "bg-emerald-100 text-emerald-600"
                              : step.status === "rejected" || step.status === "cancelled"
                              ? "bg-rose-100 text-rose-600"
                              : "bg-amber-100 text-amber-600"
                          }`}>
                            {step.status === "approved" ? (
                              <Check size={13} strokeWidth={2.5} />
                            ) : step.status === "rejected" || step.status === "cancelled" ? (
                              <X size={13} strokeWidth={2.5} />
                            ) : (
                              <Clock size={13} strokeWidth={2.5} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 text-[11.5px] truncate">{step.approverName}</p>
                            <p className="text-[10px] text-slate-400">{step.role}</p>
                          </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          step.status === "approved"
                            ? "text-emerald-700 bg-emerald-50"
                            : step.status === "rejected" || step.status === "cancelled"
                            ? "text-rose-700 bg-rose-50"
                            : "text-amber-700 bg-amber-50"
                        }`}>
                          {step.status === "approved" ? "Disetujui" : step.status === "rejected" || step.status === "cancelled" ? "Dibatalkan" : "Menunggu"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/80 shrink-0 flex flex-col gap-2">
              {selectedItem.status === "pending" && (
                <button
                  type="button"
                  onClick={() => handleApprovePendingRequest(selectedItem.id)}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <Sparkles size={14} />
                  <span>⚡ Setujui Pengajuan Ini (Munculkan Clock In & Out)</span>
                </button>
              )}

              {selectedItem.status === "approved" && activeApprovedId !== selectedItem.id && (
                <button
                  type="button"
                  onClick={() => handleActivateApprovedOvertime(selectedItem.id)}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#1a7dc4] to-[#156bb8] text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                >
                  <LogIn size={14} />
                  <span>🚀 Buka Presensi Lembur (Clock In & Out)</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="w-full py-2 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-all cursor-pointer active:scale-95 text-center"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
