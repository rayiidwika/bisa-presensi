"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  MapPin,
  Clock,
  ChevronLeft,
  Navigation,
  ShieldCheck,
  User,
  Sparkles,
} from "lucide-react";
import { mockOvertimeRequests } from "@/lib/mockData";
import { formatDate } from "@/lib/utils";
import { getNotifications, addNotification } from "@/lib/notifications";
import { toast } from "sonner";

const TASIK_LAT = -7.3274;
const TASIK_LNG = 108.2207;

export default function LemburDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"in" | "out">("in");
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [previewPhotoModal, setPreviewPhotoModal] = useState<string | null>(null);

  // Overtime session attendance state
  const [sessionData, setSessionData] = useState<{
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
  }>({});

  const loadItem = () => {
    if (typeof window === "undefined") return;

    // 1. Try finding in custom overtime requests
    try {
      const customRaw = localStorage.getItem("bisa_custom_overtime_requests");
      if (customRaw) {
        const customList = JSON.parse(customRaw);
        const found = customList.find((x: any) => x.id?.toLowerCase() === id.toLowerCase());
        if (found) {
          setItem({
            ...found,
            sourceType: "request",
            formattedDate: formatDate(found.date),
            timeInfo: `${found.startTime} - ${found.endTime}`,
            totalHours: `${found.totalHours} Jam`,
          });
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Try finding in notifications (instructions)
    try {
      const notifs = getNotifications();
      const foundInst = notifs.find((n) => n.id?.toLowerCase() === id.toLowerCase());
      if (foundInst) {
        const isAccepted = foundInst.meta?.instructionStatus === "accepted";
        setItem({
          id: foundInst.id,
          sourceType: "instruction",
          title: foundInst.meta?.instructionTask || foundInst.title.replace(/^🚨\s*/, ""),
          date: foundInst.createdAt,
          formattedDate: foundInst.meta?.instructionDate || formatDate(foundInst.createdAt),
          workMode: "WFO",
          timeInfo: foundInst.meta?.instructionHours || "18:00 - 21:00",
          totalHours: foundInst.meta?.instructionDuration || "3 Jam",
          status: isAccepted ? "approved" : foundInst.meta?.instructionStatus === "declined" ? "rejected" : "pending",
          fromWho: foundInst.meta?.instructionFrom,
          declineReason: foundInst.meta?.declineReason,
        });
        return;
      }
    } catch (e) {
      console.error(e);
    }

    // 3. Try finding in mockOvertimeRequests
    const mock = mockOvertimeRequests.find((r) => r.id?.toLowerCase() === id.toLowerCase()) || mockOvertimeRequests[0];
    if (mock) {
      setItem({
        ...mock,
        sourceType: "request",
        formattedDate: formatDate(mock.date),
        timeInfo: `${mock.startTime} - ${mock.endTime}`,
        totalHours: `${mock.totalHours} Jam`,
      });
    }
  };

  const loadSession = () => {
    if (typeof window === "undefined") return;
    try {
      const activeId = localStorage.getItem("bisa_lembur_active_id");
      if (activeId && activeId.toLowerCase() === id.toLowerCase()) {
        const savedIn = localStorage.getItem("bisa_lembur_checkin_time") || "";
        const savedOut = localStorage.getItem("bisa_lembur_checkout_time") || "";
        const inPhoto = localStorage.getItem("bisa_lembur_checkin_photo") || "/default-face-scan.jpg";
        const outPhoto = localStorage.getItem("bisa_lembur_checkout_photo") || "/default-checkout-scan.jpg";
        const inLoc = localStorage.getItem("bisa_lembur_checkin_location") || "Jl. Benda Cisalak No. 27 A RT 5/13";
        const outLoc = localStorage.getItem("bisa_lembur_checkout_location") || "Jl. Benda Cisalak No. 27 A RT 5/13";
        const inNotes = localStorage.getItem("bisa_lembur_checkin_notes") || "";
        const outNotes = localStorage.getItem("bisa_lembur_checkout_notes") || "";

        setSessionData({
          checkInTime: savedIn,
          checkOutTime: savedOut,
          checkInPhoto: inPhoto,
          checkOutPhoto: outPhoto,
          checkInLocation: inLoc,
          checkOutLocation: outLoc,
          checkInNotes: inNotes,
          checkOutNotes: outNotes,
        });
        return;
      }

      // Check saved completed sessions
      const rawSessions = localStorage.getItem("bisa_lembur_sessions");
      if (rawSessions) {
        const parsed = JSON.parse(rawSessions);
        if (parsed[id] || parsed[id.toLowerCase()] || parsed[id.toUpperCase()]) {
          setSessionData(parsed[id] || parsed[id.toLowerCase()] || parsed[id.toUpperCase()]);
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadItem();
    loadSession();
    setLoading(false);
  }, [id]);

  if (loading || !item) {
    return (
      <div className="min-h-screen bg-[#ddeef8] flex items-center justify-center p-4">
        <p className="text-slate-500 font-semibold text-xs">Memuat data lembur...</p>
      </div>
    );
  }

  const hasClockedIn = Boolean(
    sessionData.checkInTime && sessionData.checkInTime !== "--:--" && item.status === "approved"
  );
  const hasClockedOut = Boolean(
    sessionData.checkOutTime && sessionData.checkOutTime !== "--:--" && item.status === "approved"
  );

  const isTabDone = activeTab === "in" ? hasClockedIn : hasClockedOut;

  const activePhoto =
    activeTab === "in"
      ? sessionData.checkInPhoto || "/default-face-scan.jpg"
      : sessionData.checkOutPhoto || "/default-checkout-scan.jpg";

  const activeTime =
    activeTab === "in"
      ? sessionData.checkInTime || "--:--"
      : sessionData.checkOutTime || "--:--";

  const activeLocation =
    activeTab === "in"
      ? sessionData.checkInLocation || "Jl. Benda Cisalak No. 27 A RT 5/13"
      : sessionData.checkOutLocation || "Jl. Benda Cisalak No. 27 A RT 5/13";

  const activeNotes =
    activeTab === "in" ? sessionData.checkInNotes : sessionData.checkOutNotes;

  // Handle Approve Simulation
  const handleApprove = () => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("bisa_custom_overtime_requests");
        const list = raw ? JSON.parse(raw) : [];
        const index = list.findIndex((x: any) => x.id?.toLowerCase() === item.id.toLowerCase());
        const updatedItem = {
          ...item,
          status: "approved",
          approvalTimeline: [
            { id: `AT-${item.id}-1`, role: "Team Lead", approverName: "Budi Santoso", status: "approved", note: "Disetujui untuk lembur", timestamp: new Date().toISOString() },
            { id: `AT-${item.id}-2`, role: "HR Manager", approverName: "Siti Rahayu", status: "approved", note: "Terverifikasi sistem", timestamp: new Date().toISOString() },
          ],
        };

        if (index >= 0) {
          list[index] = updatedItem;
        } else {
          list.unshift(updatedItem);
        }
        localStorage.setItem("bisa_custom_overtime_requests", JSON.stringify(list));

        localStorage.setItem("bisa_lembur_active_id", item.id);
        localStorage.removeItem("bisa_lembur_completed");
        localStorage.removeItem("bisa_lembur_checkin_time");
        localStorage.removeItem("bisa_lembur_checkout_time");
        localStorage.removeItem("bisa_lembur_checkin_photo");
        localStorage.removeItem("bisa_lembur_checkout_photo");
        localStorage.removeItem("bisa_lembur_checkin_notes");
        localStorage.removeItem("bisa_lembur_checkout_notes");

        window.dispatchEvent(new Event("bisa_lembur_change"));
        window.dispatchEvent(new Event("bisa_notification_change"));

        addNotification({
          type: "lembur_approved",
          title: "Pengajuan Lembur Disetujui",
          message: `Pengajuan lembur "${item.title || item.description}" telah disetujui. Kartu presensi Clock In & Out kini telah aktif.`,
          statusBadge: "approved",
          meta: {
            requestType: "lembur",
            category: "Pengajuan Lembur",
            targetUrl: "/lembur",
          },
        });

        toast.success("Pengajuan lembur disetujui!", {
          description: "Presensi lembur (Clock In & Out) kini aktif.",
        });

        loadItem();
        loadSession();

        setTimeout(() => {
          router.push("/lembur");
        }, 500);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#ddeef8] pb-32 sm:pb-36 select-none">
      {/* ══════════════ BLUE GRADIENT HEADER (IMAGE 4) ══════════════ */}
      <div className="bg-gradient-to-b from-[#2a8ee4] via-[#1f7cd0] to-[#156bb8] relative overflow-hidden">
        <div className="absolute -right-6 -top-4 w-44 h-44 pointer-events-none opacity-20 filter blur-[0.8px] rotate-[-6deg] select-none">
          <img
            src="/bisa-media-white.png"
            alt="Watermark BISA MEDIA"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="relative px-4 pt-6 pb-6 flex items-center justify-between">
          <button
            onClick={() => router.back()}
            aria-label="Kembali"
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95 z-20"
          >
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-white font-bold italic text-[20px] sm:text-[22px] tracking-wide leading-tight text-center flex-1 pr-8 drop-shadow-xs">
            Detail Check In & Out
          </h1>
        </div>
        <div className="h-4 bg-[#ddeef8] rounded-t-3xl" />
      </div>

      <div className="px-4 sm:px-6 md:px-8 -mt-2 space-y-3.5 animate-fade-in max-w-md mx-auto">
        {/* ══════ KARTU ATAS: INFORMASI LEMBUR & STATUS REQUEST TIMELINE (IMAGE 4) ══════ */}
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-4 sm:p-5 space-y-2.5">
          <h2 className="text-[17px] font-bold italic text-slate-800 leading-snug">
            {item.title || item.description || "Pekerjaan Lembur"}
          </h2>

          <div className="grid grid-cols-2 gap-y-1 gap-x-2 text-xs text-slate-600 font-medium pt-0.5">
            <div>{item.formattedDate || item.date}</div>
            <div className="text-right font-bold text-slate-700">{item.workMode || "WFO"}</div>
            <div>{item.timeInfo?.replace(" WIB", "") || `${item.startTime} - ${item.endTime}`}</div>
            <div className="text-right font-bold text-slate-700">{item.totalHours || "3 Jam"}</div>
          </div>

          {/* Status Request HANYA UNTUK PENGAJUAN (Bukan Instruksi) */}
          {item.sourceType !== "instruction" ? (
            <>
              {/* Dashed Separator Line */}
              <div className="border-b border-dashed border-slate-200 my-2 pt-1" />

              {/* Status Request Section with Vertical Stepper */}
              <div>
                <p className="text-[11.5px] font-bold text-slate-500 mb-2">
                  Status Request
                </p>

                <div className="space-y-0 text-xs">
                  {/* Step 1: User */}
                  <div className="flex items-start gap-2.5">
                    <div className="flex flex-col items-center">
                      <div className="w-3.5 h-3.5 rounded-full bg-slate-800 border-2 border-white shadow-xs shrink-0" />
                      <div className="w-0.5 h-6 bg-slate-200" />
                    </div>
                    <div className="-mt-0.5 pb-2">
                      <p className="font-bold text-slate-800 text-[11.5px] leading-tight">User</p>
                      <p className="text-[10px] text-slate-400">{item.formattedDate} • 08.00</p>
                    </div>
                  </div>

                  {/* Step 2: Atasan (Approval Process) */}
                  <div className="flex items-start gap-2.5">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs shrink-0 ${
                          item.status === "approved"
                            ? "bg-emerald-500"
                            : item.status === "rejected"
                            ? "bg-rose-500"
                            : "bg-orange-500 animate-pulse"
                        }`}
                      />
                      <div className="w-0.5 h-6 bg-slate-200" />
                    </div>
                    <div className="-mt-0.5 pb-2">
                      <p className="font-bold text-slate-800 text-[11.5px] leading-tight">
                        {item.fromWho || "Kepala Divisi"}
                      </p>
                      <p
                        className={`text-[10px] font-semibold ${
                          item.status === "approved"
                            ? "text-emerald-600"
                            : item.status === "rejected"
                            ? "text-rose-600"
                            : "text-orange-500 font-bold"
                        }`}
                      >
                        {item.status === "approved"
                          ? "Disetujui"
                          : item.status === "rejected"
                          ? `Ditolak: ${item.declineReason || "Ditolak Atasan"}`
                          : "Menunggu Approval Atasan (Pending)"}
                      </p>
                    </div>
                  </div>

                  {/* Step 3: Request Lembur */}
                  <div className="flex items-start gap-2.5">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs shrink-0 ${
                          item.status === "approved"
                            ? "bg-emerald-500"
                            : item.status === "rejected"
                            ? "bg-rose-500"
                            : "bg-slate-300"
                        }`}
                      />
                    </div>
                    <div className="-mt-0.5">
                      <p className="font-bold text-slate-800 text-[11.5px] leading-tight">
                        Request Lembur
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {item.status === "approved"
                          ? "Siap presensi lembur"
                          : item.status === "rejected"
                          ? "Pengajuan dibatalkan"
                          : "Menunggu ACC Atasan"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Instruksi Dari:</span>
              <span className="font-bold text-slate-800">{item.fromWho || "Atasan"}</span>
            </div>
          )}
        </div>

        {/* ══════ TAB SWITCHER (Check in / Check Out) ══════ */}
        <div className="bg-white/90 p-1 rounded-2xl flex items-center gap-1 border border-slate-200 shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab("in")}
            className={`flex-1 py-2.5 rounded-xl text-center text-xs font-bold transition-all cursor-pointer ${
              activeTab === "in"
                ? "bg-[#156bb8] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Check in
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("out")}
            className={`flex-1 py-2.5 rounded-xl text-center text-xs font-bold transition-all cursor-pointer ${
              activeTab === "out"
                ? "bg-[#156bb8] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            Check Out
          </button>
        </div>

        {/* Header Informasi Kehadiran */}
        <p className="text-[11.5px] font-semibold text-slate-700 px-1 pt-0.5">
          Informasi Kehadiran
        </p>

        {/* ══════ KARTU BAWAH: DOKUMENTASI PRESENSI (IMAGE 4) ══════ */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3.5">
          {/* Dua Kotak (Map & Foto) */}
          <div className="grid grid-cols-2 gap-2.5 items-stretch">
            {!isTabDone ? (
              <>
                {/* Kotak Peta Kosong Placeholder */}
                <div className="h-32 sm:h-36 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col items-center justify-center p-2 text-center">
                  <MapPin size={24} className="text-slate-300 mb-1" />
                  <span className="text-[9.5px] text-slate-400 font-medium">
                    Belum ada titik GPS
                  </span>
                </div>

                {/* Kotak Foto Siluet Avatar Kosong (Persis Gambar 4) */}
                <div className="h-32 sm:h-36 rounded-2xl bg-[#e2e8f0]/80 border border-slate-200 flex flex-col items-center justify-center overflow-hidden">
                  <div className="w-16 h-16 rounded-full bg-[#cbd5e1] flex items-center justify-center text-white/90">
                    <User size={38} className="text-slate-500 fill-slate-500" />
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Kotak Peta Berisi OpenStreetMap */}
                <div className="relative h-32 sm:h-36 rounded-2xl bg-white overflow-hidden border border-[#c8d8e8] shadow-2xs flex flex-col justify-between p-2 group">
                  <div className="absolute inset-0 bg-[#e8f0f7] overflow-hidden">
                    <iframe
                      title={`Peta Lokasi Lembur ${activeTab === "in" ? "Clock In" : "Clock Out"}`}
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${TASIK_LNG - 0.0025}%2C${TASIK_LAT - 0.0018}%2C${TASIK_LNG + 0.0025}%2C${TASIK_LAT + 0.0018}&layer=mapnik`}
                      className="w-full h-full border-0 pointer-events-none filter saturate-125"
                      loading="lazy"
                    />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full flex flex-col items-center pointer-events-none z-10">
                      <div className="w-5 h-5 rounded-full bg-red-600 border-2 border-white shadow-md flex items-center justify-center text-white">
                        <MapPin size={11} strokeWidth={2.5} className="fill-white" />
                      </div>
                    </div>
                  </div>
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="bg-black/70 text-white text-[7.5px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                      <Navigation size={8} className={activeTab === "in" ? "text-emerald-400" : "text-rose-400"} />
                      <span>{activeTab === "in" ? "Lokasi In" : "Lokasi Out"}</span>
                    </span>
                  </div>
                </div>

                {/* Kotak Foto Berisi Scan Muka Biometrik */}
                <div
                  onClick={() => setPreviewPhotoModal(activePhoto)}
                  className="relative h-32 sm:h-36 rounded-2xl bg-slate-900 overflow-hidden border border-[#c8d8e8] shadow-2xs group cursor-pointer"
                >
                  <img
                    src={activePhoto}
                    alt="Foto Dokumentasi Lembur"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-1.5 left-1.5 z-10">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1 text-white ${
                      activeTab === "in" ? "bg-emerald-600/95" : "bg-rose-600/95"
                    }`}>
                      <ShieldCheck size={9} />
                      <span>{activeTab === "in" ? "Scan In" : "Scan Out"}</span>
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Detail Text Rows (Alamat, Jam Masuk, Catatan, Jarak, Status) */}
          <div className="space-y-2.5 pt-1 text-[11.5px]">
            <div>
              <span className="text-slate-500 font-medium block">
                Alamat Lokasi :
              </span>
              <p className="font-bold text-slate-800 leading-tight mt-0.5">
                {isTabDone ? activeLocation : "-"}
              </p>
            </div>

            <div>
              <span className="text-slate-500 font-medium block">
                {activeTab === "in" ? "Jam Masuk :" : "Jam Pulang :"}
              </span>
              <p className="font-bold text-slate-800 leading-tight mt-0.5">
                {isTabDone ? activeTime : "-"}
              </p>
            </div>

            <div>
              <span className="text-slate-500 font-medium block">
                Catatan :
              </span>
              <p className="font-bold text-slate-800 leading-tight mt-0.5">
                {isTabDone ? activeNotes || "-" : "-"}
              </p>
            </div>

            <div>
              <span className="text-slate-500 font-medium block">
                Jarak :
              </span>
              <p className="font-bold text-slate-800 leading-tight mt-0.5">
                {isTabDone ? "15 meter (Radius 100m ✓)" : "-"}
              </p>
            </div>

            <div>
              <span className="text-slate-500 font-medium block">
                Status :
              </span>
              <p
                className={`font-bold leading-tight mt-0.5 ${
                  isTabDone
                    ? "text-emerald-600"
                    : item.status === "pending"
                    ? "text-orange-500"
                    : "text-slate-400"
                }`}
              >
                {isTabDone
                  ? "Foto Wajah & Lokasi GPS Terverifikasi"
                  : item.status === "pending"
                  ? "Menunggu Approval Atasan"
                  : "Belum Melakukan Clock In Lembur"}
              </p>
            </div>
          </div>
        </div>

        {/* Action Button if Pending */}
        {item.status === "pending" && item.sourceType !== "instruction" && (
          <button
            id="btn-approve-simulation"
            type="button"
            onClick={handleApprove}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <Sparkles size={14} />
            <span>⚡ Setujui Pengajuan Ini (Simulasi Atasan)</span>
          </button>
        )}
      </div>

      {/* Modal Preview Foto Scan Muka Fullscreen */}
      {previewPhotoModal && (
        <div
          onClick={() => setPreviewPhotoModal(null)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl overflow-hidden max-w-sm w-full shadow-2xl relative"
          >
            <div className="relative aspect-[3/4] bg-slate-900">
              <img
                src={previewPhotoModal}
                alt="Scan Dokumentasi Lembur"
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setPreviewPhotoModal(null)}
                aria-label="Tutup"
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 text-center">
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold border border-emerald-200">
                <ShieldCheck size={14} />
                <span>Dokumentasi Presensi Lembur Terverifikasi</span>
              </div>
              <p className="text-xs font-semibold text-slate-800 mt-2">
                {item.title || "Pekerjaan Lembur"}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {activeTab === "in" ? "Clock In" : "Clock Out"} - {activeLocation}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
