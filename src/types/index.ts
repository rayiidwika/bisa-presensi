// ── Extended Types for Absensi Module ─────────────────────
export type RequestStatus = "pending" | "approved" | "rejected" | "processing";
export type LeaveType = "cuti" | "izin" | "sakit" | "dinas";
export type Keperluan =
  | "Cuti Tahunan"
  | "Cuti Sakit"
  | "Izin Keperluan Keluarga"
  | "Izin Pribadi"
  | "Sakit"
  | "Dinas Luar"
  | (string & {});
export type WorkMode = "WFO" | "WFH";
export type AttendanceStatus = "hadir" | "terlambat" | "tidak_lengkap" | "tidak_hadir" | "izin" | "sakit";
export type CheckType = "check_in" | "check_out";

// ── Employee ───────────────────────────────────────────────
export interface Employee {
  id: string;
  name: string;
  division: string;
  position: string;
  avatarUrl?: string;
  nip: string;
  shift: ShiftInfo;
}

export interface ShiftInfo {
  name: string; // "Regular"
  startTime: string; // "08:00"
  endTime: string;   // "17:00"
}

// ── Attendance / Absensi ───────────────────────────────────
export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // ISO date "YYYY-MM-DD"
  dayLabel: string; // "Sab, 26 September 2026"
  shift: string;
  checkIn?: string;  // "HH:mm"
  checkOut?: string;
  status: AttendanceStatus;
  latitude?: number;
  longitude?: number;
  locationAddress?: string;
  selfieUrl?: string;
  notes?: string;
  checkInNotes?: string;
  checkOutNotes?: string;
}

export interface AttendanceSummary {
  month: string;
  year: number;
  hadir: number;
  izin: number;
  sakit: number;
  terlambat: number;
  tidakLengkap: number;
  tanpaMasuk: number;
}

// ── Check In/Out Payload ───────────────────────────────────
export interface CheckPayload {
  type: CheckType;
  latitude: number;
  longitude: number;
  selfieBase64?: string;
  timestamp: string;
}

// ── Leave / Pengajuan ──────────────────────────────────────
export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: LeaveType;
  keperluan: Keperluan;
  startDate: string;
  endDate: string;
  reason: string;
  attachment?: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  totalDays: number;
  totalHours: number;
  approvedBy?: string;
  rejectedReason?: string;
}

// ── Overtime / Lembur ──────────────────────────────────────
export interface OvertimeRequest {
  id: string;
  employeeId: string;
  date: string;
  workMode: WorkMode;
  startTime: string;
  endTime: string;
  description: string;
  attachment?: string;
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  totalHours: number;
  approvalTimeline: ApprovalStep[];
}

export interface ApprovalStep {
  id: string;
  role: string;
  approverName: string;
  status: RequestStatus | "waiting" | "cancelled";
  note?: string;
  timestamp?: string;
}

// ── Summaries ──────────────────────────────────────────────
export interface LeaveSummary {
  totalRequested: number;
  totalApproved: number;
  totalHoursRequested: number;
  totalHoursApproved: number;
}

export interface OvertimeSummary {
  totalHoursRequested: number;
  totalHoursApproved: number;
  totalRequests: number;
  approvedRequests: number;
}

// ── Forms ──────────────────────────────────────────────────
export interface LeaveFormData {
  type: LeaveType | "";
  keperluan: Keperluan | "";
  startDate: string;
  endDate: string;
  reason: string;
  attachment: File | null;
}

export interface OvertimeFormData {
  date: string;
  workMode: WorkMode | "";
  startTime: string;
  endTime: string;
  description: string;
}
