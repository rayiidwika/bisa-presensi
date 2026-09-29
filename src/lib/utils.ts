import type { RequestStatus, AttendanceStatus } from "@/types";

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
export function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "long", year: "numeric" });
}
export function formatTime(time: string) { return time; }
export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
export function calcHours(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return Math.max(0, (eh * 60 + em - (sh * 60 + sm)) / 60);
}
export function calcDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end   = new Date(endDate);
  return Math.max(1, Math.floor((end.getTime() - start.getTime()) / 86400000) + 1);
}
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}
export function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

/** Status pill colors (leave / overtime) */
export function statusColorMap(status: RequestStatus | "waiting" | "cancelled"): {
  bg: string; text: string; border: string; dot: string;
} {
  switch (status) {
    case "approved":   return { bg:"bg-green-50",  text:"text-green-700",  border:"border-green-200",  dot:"bg-green-500" };
    case "rejected":   return { bg:"bg-red-50",    text:"text-red-700",    border:"border-red-200",    dot:"bg-red-500" };
    case "processing": return { bg:"bg-blue-50",   text:"text-blue-700",   border:"border-blue-200",   dot:"bg-blue-500" };
    case "cancelled":  return { bg:"bg-slate-50",  text:"text-slate-500",  border:"border-slate-200",  dot:"bg-slate-400" };
    case "waiting":    return { bg:"bg-slate-50",  text:"text-slate-500",  border:"border-slate-200",  dot:"bg-slate-300" };
    default:           return { bg:"bg-amber-50",  text:"text-amber-700",  border:"border-amber-200",  dot:"bg-amber-500" };
  }
}
export function statusLabel(status: RequestStatus | "waiting" | "cancelled"): string {
  switch (status) {
    case "approved":   return "Disetujui";
    case "rejected":   return "Ditolak";
    case "processing": return "Diproses";
    case "cancelled":  return "Cancelled";
    case "waiting":    return "Menunggu";
    default:           return "Pending";
  }
}

/** Attendance status helpers */
export function attStatusLabel(s: AttendanceStatus): string {
  switch (s) {
    case "hadir":         return "Hadir";
    case "terlambat":     return "Terlambat";
    case "tidak_lengkap": return "Tidak Lengkap";
    case "tidak_hadir":   return "Tidak Hadir";
    case "izin":          return "Izin";
    case "sakit":         return "Sakit";
    default:              return s;
  }
}
export function attStatusColors(s: AttendanceStatus): { bg: string; text: string } {
  switch (s) {
    case "hadir":         return { bg:"bg-green-100",  text:"text-green-700" };
    case "terlambat":     return { bg:"bg-amber-100",  text:"text-amber-700" };
    case "tidak_lengkap": return { bg:"bg-orange-100", text:"text-orange-700" };
    case "tidak_hadir":   return { bg:"bg-red-100",    text:"text-red-700" };
    case "izin":          return { bg:"bg-blue-100",   text:"text-blue-700" };
    case "sakit":         return { bg:"bg-purple-100", text:"text-purple-700" };
    default:              return { bg:"bg-slate-100",  text:"text-slate-700" };
  }
}
export function leaveTypeLabel(type: string): string {
  return { cuti:"Cuti", izin:"Izin", sakit:"Sakit", dinas:"Dinas" }[type] ?? type;
}
