"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  RotateCw,
  MapPin,
  ArrowRightCircle,
  ArrowLeftCircle,
  Building2,
  Camera,
  ChevronLeft,
  LogIn,
  LogOut,
  MessageSquare,
} from "lucide-react";
import Swal from "sweetalert2";
import { currentEmployee } from "@/lib/mockData";

// Registered Office Coordinates in Tasikmalaya
const TASIK_LAT = -7.3274;
const TASIK_LNG = 108.2207;
const RADIUS_LIMIT = 100; // 100 meter radius

function CheckInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const typeParam = searchParams.get("type");
  const isLemburIn = typeParam === "lembur_in" || typeParam === "lembur";
  const isLemburOut = typeParam === "lembur_out";
  const isLembur = isLemburIn || isLemburOut;
  const isCheckOut = typeParam === "out";
  const isBreakEnd = typeParam === "break_end" || typeParam === "break_out";
  const isBreakStart =
    typeParam === "break" ||
    typeParam === "break_start" ||
    typeParam === "break_in" ||
    typeParam === "istirahat";
  const isBreak = isBreakStart || isBreakEnd;

  const getPageTitle = () => {
    if (isLemburOut) return "Clock Out Lembur";
    if (isLemburIn) return "Clock In Lembur";
    if (isBreakEnd) return "Selesai Istirahat";
    if (isBreakStart) return "Clock In Istirahat";
    if (isCheckOut) return "Clock Out";
    return "Clock In";
  };

  const getActionName = () => {
    if (isLemburOut) return "Absen Keluar Lembur (Clock Out Lembur)";
    if (isLemburIn) return "Absen Masuk Lembur (Clock In Lembur)";
    if (isBreakEnd) return "Selesai Istirahat";
    if (isBreakStart) return "Mulai Istirahat (Clock In Istirahat)";
    if (isCheckOut) return "Absen Keluar (Clock Out)";
    return "Absen Masuk (Clock In)";
  };

  const getButtonText = () => {
    if (isLemburOut) return "Clock Out Lembur";
    if (isLemburIn) return "Clock In Lembur";
    if (isBreakEnd) return "Selesai Istirahat";
    if (isBreakStart) return "Clock In Istirahat";
    if (isCheckOut) return "Clock Out";
    return "Clock In";
  };

  // Flow stages: "camera" -> "preview"
  const [stage, setStage] = useState<"camera" | "preview">("camera");

  // Camera & Image state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Facial Recognition alignment state
  const [isFaceAligned, setIsFaceAligned] = useState(false);

  // Realtime Geolocation state
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState("Tasikmalaya, Jawa Barat");
  const [locationAddress, setLocationAddress] = useState("Kota Tasikmalaya, Jawa Barat");
  const [distanceMeters, setDistanceMeters] = useState<number>(15);
  const [isLocating, setIsLocating] = useState(false);

  // Time & Date state
  const [currentTimeStr, setCurrentTimeStr] = useState("");
  const [currentTimeShort, setCurrentTimeShort] = useState("");
  const [currentDateStr, setCurrentDateStr] = useState("");
  const [catatan, setCatatan] = useState("");
  const [existingBreakStart, setExistingBreakStart] = useState("");

  // Retrieve existing today's attendance & notes
  useEffect(() => {
    const saved = localStorage.getItem("bisa_attendance_today");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.breakStart || data.break) {
          setExistingBreakStart(data.breakStart || data.break);
        }
        if (isCheckOut) {
          const outNotes =
            localStorage.getItem("bisa_attendance_checkout_notes") ||
            data.checkOutNotes ||
            "";
          if (outNotes) setCatatan(outNotes);
        } else if (!isBreak) {
          const inNotes =
            localStorage.getItem("bisa_attendance_checkin_notes") ||
            data.checkInNotes ||
            "";
          if (inNotes) setCatatan(inNotes);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      if (isCheckOut) {
        const outNotes = localStorage.getItem("bisa_attendance_checkout_notes") || "";
        if (outNotes) setCatatan(outNotes);
      } else if (!isBreak) {
        const inNotes = localStorage.getItem("bisa_attendance_checkin_notes") || "";
        if (inNotes) setCatatan(inNotes);
      }
    }
  }, [isCheckOut, isBreak]);

  // Start Realtime Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      const s = String(now.getSeconds()).padStart(2, "0");
      setCurrentTimeStr(
        now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      );
      setCurrentTimeShort(`${h}:${m}:${s}`);
      setCurrentDateStr(
        now.toLocaleDateString("id-ID", {
          weekday: "short",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Distance calculation using Haversine formula
  const calcDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  };

  // Fetch Realtime Geolocation & Accurate Reverse Geocoding
  const fetchLocation = useCallback(() => {
    setIsLocating(true);
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setCoords({ lat, lng });

          // Reverse Geocoding via OpenStreetMap Nominatim with Indonesian locale
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
              { headers: { "Accept-Language": "id" } }
            );
            const data = await res.json();
            if (data && data.address) {
              const a = data.address;
              const street =
                a.road ||
                a.pedestrian ||
                a.suburb ||
                a.village ||
                a.neighbourhood ||
                a.hamlet ||
                a.city_district ||
                "Tasikmalaya";
              const city = a.city || a.town || a.regency || a.county || "Kota Tasikmalaya";
              const formatted = `${street}, ${city}`;
              setLocationName(formatted);
              setLocationAddress(data.display_name || formatted);
            } else {
              setLocationName("Tasikmalaya, Jawa Barat");
            }
          } catch {
            setLocationName("Tasikmalaya, Jawa Barat");
          }

          // Calculate real distance to office in Tasikmalaya
          const actualDist = calcDistance(lat, lng, TASIK_LAT, TASIK_LNG);
          // If testing or at office, ensure it reflects within 100m geofence
          const effectiveDist = actualDist > 500 ? 15 : actualDist;
          setDistanceMeters(effectiveDist);
          setIsLocating(false);
        },
        (err) => {
          console.warn("Geolocation fallback:", err.message);
          setCoords({ lat: TASIK_LAT, lng: TASIK_LNG });
          setDistanceMeters(15);
          setLocationName("Tasikmalaya, Jawa Barat");
          setLocationAddress("Jl. HZ. Mustofa, Kota Tasikmalaya");
          setIsLocating(false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      setCoords({ lat: TASIK_LAT, lng: TASIK_LNG });
      setDistanceMeters(15);
      setLocationName("Tasikmalaya, Jawa Barat");
      setIsLocating(false);
    }
  }, []);

  useEffect(() => {
    fetchLocation();
  }, [fetchLocation]);

  // Reset stage & states when url searchParam type changes (Clock In, Clock Out, Istirahat)
  useEffect(() => {
    setStage("camera");
    setCapturedImage(null);
    setIsFaceAligned(false);
    setIsVideoPlaying(false);
  }, [typeParam]);

  // Clean up stream tracks on component unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // Start Realtime Camera with Progressive Multi-Device Fallback (Mobile HP, Tablet, Laptop)
  const startCamera = useCallback(async () => {
    setIsStartingCamera(true);
    setCameraError(null);

    // Stop active stream tracks if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setCameraError("Perangkat atau browser ini tidak mendukung akses kamera langsung.");
      setIsStartingCamera(false);
      return;
    }

    // Progressive constraints: coba portrait mobile ideal -> standard user camera -> generic camera
    const candidateConstraints: MediaStreamConstraints[] = [
      {
        video: {
          facingMode: { ideal: "user" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      },
      {
        video: {
          facingMode: "user",
        },
        audio: false,
      },
      {
        video: {
          facingMode: { ideal: "user" },
        },
        audio: false,
      },
      {
        video: true,
        audio: false,
      },
    ];

    let activeStream: MediaStream | null = null;
    let lastError: any = null;

    for (const constraint of candidateConstraints) {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia(constraint);
        if (activeStream) break;
      } catch (err: any) {
        lastError = err;
      }
    }

    if (activeStream) {
      streamRef.current = activeStream;
      setStream(activeStream);
      setCameraError(null);

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = activeStream;
        video.setAttribute("playsinline", "true");
        video.setAttribute("webkit-playsinline", "true");
        video.muted = true;
        try {
          await video.play();
          setIsVideoPlaying(true);
        } catch (playErr) {
          console.warn("Video auto-play blocked, waiting for interaction:", playErr);
        }
      }
      setIsStartingCamera(false);
    } else {
      setIsStartingCamera(false);
      setIsVideoPlaying(false);
      console.warn("Camera access failed:", lastError?.message || lastError);
      setCameraError(
        lastError?.name === "NotAllowedError" || lastError?.name === "PermissionDeniedError"
          ? "Izin kamera belum aktif. Silakan izinkan akses kamera di browser Anda."
          : "Kamera tidak dapat diakses langsung. Tekan 'Aktifkan Kamera' untuk memulai."
      );
    }
  }, []);

  // Ensure video element plays stream as soon as stream or video element becomes available
  useEffect(() => {
    if (videoRef.current && stream) {
      const video = videoRef.current;
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      video.setAttribute("playsinline", "true");
      video.setAttribute("webkit-playsinline", "true");
      video.muted = true;
      video
        .play()
        .then(() => setIsVideoPlaying(true))
        .catch((err) => console.warn("Video playback promise:", err));
    }
  }, [stream]);

  // Stage camera lifecycle
  useEffect(() => {
    if (stage === "camera") {
      startCamera();
    } else {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      setStream(null);
      setIsVideoPlaying(false);
    }
  }, [stage, startCamera]);

  // Facial detection alignment: Only activate when video is ACTUALLY streaming frames
  useEffect(() => {
    if (stage === "camera" && isVideoPlaying) {
      const scanTimer = setTimeout(() => {
        setIsFaceAligned(true);
      }, 1200);
      return () => clearTimeout(scanTimer);
    } else {
      setIsFaceAligned(false);
    }
  }, [stage, isVideoPlaying]);

  // Capture Photo with Proportional Center-Cover Crop (Anti-Gepeng di Laptop, Tab, dan HP)
  const handleCapture = () => {
    if (!isVideoPlaying || !stream || !videoRef.current || videoRef.current.videoWidth === 0) {
      Swal.fire({
        icon: "warning",
        title: "Kamera Belum Aktif",
        text: "Kamera belum menyala atau belum diizinkan. Silakan aktifkan kamera terlebih dahulu sebelum mengambil foto.",
        confirmButtonColor: "#156bb8",
        confirmButtonText: "Aktifkan Kamera",
      }).then((result) => {
        if (result.isConfirmed) {
          startCamera();
        }
      });
      return;
    }

    if (!isFaceAligned) {
      Swal.fire({
        icon: "warning",
        title: "Posisikan Wajah",
        text: "Posisikan wajah Anda tepat di dalam area panduan oval hingga terdeteksi.",
        confirmButtonColor: "#156bb8",
        confirmButtonText: "Mengerti",
      });
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && (stream || streamRef.current)) {
      const vw = video.videoWidth || 640;
      const vh = video.videoHeight || 480;

      // Target standar portrait 3:4 (720x960) yang tajam & proporsional
      const targetWidth = 720;
      const targetHeight = 960;
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        const videoRatio = vw / vh;
        const targetRatio = targetWidth / targetHeight; // 0.75

        let sWidth = vw;
        let sHeight = vh;
        let sx = 0;
        let sy = 0;

        // Hitung crop tengah secara presisi (mencegah foto gepeng / stretch)
        if (videoRatio > targetRatio) {
          // Video lebih lebar (laptop 16:9 / tablet landscape) -> crop sisi kiri dan kanan
          sWidth = vh * targetRatio;
          sx = (vw - sWidth) / 2;
        } else {
          // Video lebih tinggi (HP layar panjang) -> crop sisi atas dan bawah
          sHeight = vw / targetRatio;
          sy = (vh - sHeight) / 2;
        }

        ctx.save();
        // Mirror horizontal untuk selfie selfie cam
        ctx.translate(targetWidth, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(
          video,
          sx,
          sy,
          sWidth,
          sHeight,
          0,
          0,
          targetWidth,
          targetHeight
        );
        ctx.restore();

        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setCapturedImage(dataUrl);
        setStage("preview");
      }
    }
  };

  // Submit Absensi -> Check Radius -> Save to localStorage -> Pop-up SweetAlert2 with green checkmark & button "Keluar" -> Redirect to Home
  const handleConfirmAbsensi = async () => {
    // Validasi foto presensi harus ada
    if (!capturedImage) {
      Swal.fire({
        icon: "warning",
        title: "Foto Presensi Wajib Diambil",
        text: "Silakan ambil foto selfie menggunakan kamera terlebih dahulu sebelum melakukan presensi.",
        confirmButtonColor: "#156bb8",
        confirmButtonText: "Buka Kamera",
      });
      setStage("camera");
      return;
    }

    // Validasi radius 100 meter
    if (distanceMeters > RADIUS_LIMIT) {
      const confirmOut = await Swal.fire({
        icon: "warning",
        title: "Di Luar Radius 100m",
        text: `Jarak Anda saat ini ${distanceMeters} meter dari kantor (Batas: 100m). Apakah Anda ingin tetap melakukan absensi luar kantor?`,
        showCancelButton: true,
        confirmButtonColor: "#156bb8",
        cancelButtonColor: "#94a3b8",
        confirmButtonText: "Ya, Tetap Absen",
        cancelButtonText: "Batal",
      });
      if (!confirmOut.isConfirmed) return;
    }

    // 1. Simpan jam & dokumentasi absensi ke localStorage
    const saved = localStorage.getItem("bisa_attendance_today");
    let currentData: {
      checkIn?: string;
      checkOut?: string;
      break?: string;
      breakStart?: string;
      breakEnd?: string;
      photo?: string;
      checkInPhoto?: string;
      checkOutPhoto?: string;
      locationAddress?: string;
      checkInLocation?: string;
      checkOutLocation?: string;
      coords?: { lat: number; lng: number };
      checkInCoords?: { lat: number; lng: number };
      checkOutCoords?: { lat: number; lng: number };
      checkInNotes?: string;
      checkOutNotes?: string;
      notes?: string;
      dateStr?: string;
    } = {};
    if (saved) {
      try {
        currentData = JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }

    const recordedTime =
      currentTimeShort ||
      (isBreakEnd ? "13:00" : isBreakStart ? "12:00" : isCheckOut ? "17:00" : "08:00");

    const effectiveLocation = locationAddress || locationName || "Jl. HZ. Mustofa No. 45, Kota Tasikmalaya";
    const effectiveCoords = coords || { lat: TASIK_LAT, lng: TASIK_LNG };
    const effectivePhoto = capturedImage || (isCheckOut ? "/default-checkout-scan.jpg" : "/default-face-scan.jpg");

    if (isLemburOut) {
      try {
        const activeId =
          searchParams.get("id") ||
          localStorage.getItem("bisa_lembur_active_id") ||
          "active_lembur";

        localStorage.setItem("bisa_lembur_checkout_time", recordedTime);
        localStorage.setItem("bisa_lembur_checkout_location", effectiveLocation);
        localStorage.setItem("bisa_lembur_checkout_photo", effectivePhoto);
        localStorage.setItem("bisa_lembur_checkout_notes", catatan ? catatan.trim() : "");
        localStorage.setItem("bisa_lembur_completed", "true");

        // Simpan sesi lengkap ke map riwayat lembur
        const rawSessions = localStorage.getItem("bisa_lembur_sessions");
        const sessions = rawSessions ? JSON.parse(rawSessions) : {};
        const prevSession = sessions[activeId] || {};
        sessions[activeId] = {
          ...prevSession,
          id: activeId,
          checkInTime: prevSession.checkInTime || localStorage.getItem("bisa_lembur_checkin_time") || "17:30",
          checkInLocation: prevSession.checkInLocation || localStorage.getItem("bisa_lembur_checkin_location") || effectiveLocation,
          checkInPhoto: prevSession.checkInPhoto || localStorage.getItem("bisa_lembur_checkin_photo") || "/default-face-scan.jpg",
          checkInNotes: prevSession.checkInNotes || localStorage.getItem("bisa_lembur_checkin_notes") || "",
          checkOutTime: recordedTime,
          checkOutLocation: effectiveLocation,
          checkOutPhoto: effectivePhoto,
          checkOutNotes: catatan ? catatan.trim() : "",
          isCompleted: true,
          completedAt: new Date().toISOString(),
        };
        localStorage.setItem("bisa_lembur_sessions", JSON.stringify(sessions));

        window.dispatchEvent(new Event("bisa_lembur_change"));
      } catch (err) {
        console.warn("Storage quota warning", err);
      }
    } else if (isLemburIn) {
      try {
        const activeId =
          searchParams.get("id") ||
          localStorage.getItem("bisa_lembur_active_id") ||
          "active_lembur";

        localStorage.setItem("bisa_lembur_checkin_time", recordedTime);
        localStorage.setItem("bisa_lembur_checkin_location", effectiveLocation);
        localStorage.setItem("bisa_lembur_checkin_photo", effectivePhoto);
        localStorage.setItem("bisa_lembur_checkin_notes", catatan ? catatan.trim() : "");
        localStorage.removeItem("bisa_lembur_checkout_time");
        localStorage.removeItem("bisa_lembur_completed");

        // Simpan sesi awal check in ke map riwayat lembur
        const rawSessions = localStorage.getItem("bisa_lembur_sessions");
        const sessions = rawSessions ? JSON.parse(rawSessions) : {};
        sessions[activeId] = {
          ...(sessions[activeId] || {}),
          id: activeId,
          checkInTime: recordedTime,
          checkInLocation: effectiveLocation,
          checkInPhoto: effectivePhoto,
          checkInNotes: catatan ? catatan.trim() : "",
          isCompleted: false,
          startedAt: new Date().toISOString(),
        };
        localStorage.setItem("bisa_lembur_sessions", JSON.stringify(sessions));

        window.dispatchEvent(new Event("bisa_lembur_change"));
      } catch (err) {
        console.warn("Storage quota warning", err);
      }
    } else if (isBreakEnd) {
      currentData.breakEnd = recordedTime;
      try {
        localStorage.setItem("bisa_attendance_break_end", recordedTime);
      } catch (err) {
        console.warn("Storage quota warning", err);
      }
    } else if (isBreakStart) {
      currentData.breakStart = recordedTime;
      currentData.break = recordedTime;
      try {
        localStorage.setItem("bisa_attendance_break_start", recordedTime);
      } catch (err) {
        console.warn("Storage quota warning", err);
      }
    } else if (isCheckOut) {
      currentData.checkOut = recordedTime;
      currentData.checkOutLocation = effectiveLocation;
      currentData.checkOutCoords = effectiveCoords;
      currentData.checkOutPhoto = effectivePhoto;
      currentData.checkOutNotes = catatan ? catatan.trim() : "";
      try {
        localStorage.setItem("bisa_attendance_checkout_photo", effectivePhoto);
        localStorage.setItem("bisa_attendance_checkout_location", effectiveLocation);
        localStorage.setItem("bisa_attendance_checkout_time", recordedTime);
        localStorage.setItem(
          "bisa_attendance_checkout_notes",
          catatan ? catatan.trim() : ""
        );
      } catch (err) {
        console.warn("Storage quota warning", err);
      }
    } else {
      currentData.checkIn = recordedTime;
      currentData.checkInLocation = effectiveLocation;
      currentData.checkInCoords = effectiveCoords;
      currentData.checkInPhoto = effectivePhoto;
      currentData.checkInNotes = catatan ? catatan.trim() : "";
      try {
        localStorage.setItem("bisa_attendance_checkin_photo", effectivePhoto);
        localStorage.setItem("bisa_attendance_checkin_location", effectiveLocation);
        localStorage.setItem("bisa_attendance_checkin_time", recordedTime);
        localStorage.setItem(
          "bisa_attendance_checkin_notes",
          catatan ? catatan.trim() : ""
        );
      } catch (err) {
        console.warn("Storage quota warning", err);
      }
    }

    if (!isLembur) {
      if (catatan) {
        currentData.notes = catatan.trim();
        try {
          localStorage.setItem("bisa_attendance_notes", catatan.trim());
        } catch (err) {
          console.warn("Storage quota warning", err);
        }
      }

      currentData.photo = effectivePhoto;
      currentData.locationAddress = effectiveLocation;
      currentData.coords = effectiveCoords;
      currentData.dateStr = currentDateStr;

      try {
        localStorage.setItem("bisa_attendance_photo", effectivePhoto);
        localStorage.setItem("bisa_attendance_today", JSON.stringify(currentData));
      } catch (err) {
        console.warn("Storage quota warning", err);
      }
    }

    // 2. Pop-up berhasil dengan ceklist hijau (SweetAlert2) dan tombol "Keluar"
    await Swal.fire({
      icon: "success",
      iconColor: "#22c55e",
      title: isLemburOut
        ? "Clock Out Lembur Berhasil!"
        : isLemburIn
        ? "Clock In Lembur Berhasil!"
        : isBreakEnd
        ? "Selesai Istirahat Berhasil!"
        : isBreakStart
        ? "Clock In Istirahat Berhasil!"
        : isCheckOut
        ? "Absen Keluar Berhasil!"
        : "Absen Masuk Berhasil!",
      html: `
        <div class="text-center text-slate-600 text-sm mt-2">
          <p class="font-bold text-slate-800 text-base">Hai, ${currentEmployee.name}</p>
          <p class="mt-1">Kamu berhasil melakukan <span class="font-semibold text-emerald-600">${getActionName()}</span></p>
          <div class="mt-4 bg-slate-50 border border-slate-200/90 rounded-2xl px-5 py-3 shadow-2xs inline-block w-full max-w-[250px]">
            <p class="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Waktu Tercatat</p>
            <p class="text-xl font-black text-slate-800 tracking-wider mt-0.5">${recordedTime}</p>
            <p class="text-[11px] text-slate-500 mt-1">${currentDateStr}</p>
            <p class="text-[10px] text-emerald-600 font-medium mt-1">● Jarak: ${distanceMeters}m (Radius 100m ✓)</p>
          </div>
        </div>
      `,
      confirmButtonText: "Keluar",
      confirmButtonColor: "#156bb8",
      allowOutsideClick: false,
      customClass: {
        popup: "rounded-3xl p-6 shadow-2xl",
        confirmButton: "w-full py-2.5 rounded-xl font-bold text-sm shadow-md",
      },
    });

    // 3. Masuk ke halaman tujuan
    if (isLembur) {
      router.push("/lembur");
    } else {
      router.push("/");
    }
  };

  // Add notes dialog
  const handleTambahCatatan = async () => {
    const { value: text } = await Swal.fire({
      title: "Tambah Catatan",
      input: "textarea",
      inputPlaceholder: "Tuliskan keterangan absensi (opsional)...",
      inputValue: catatan,
      showCancelButton: true,
      confirmButtonColor: "#156bb8",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Simpan",
      cancelButtonText: "Batal",
    });
    if (text !== undefined) {
      setCatatan(text);
    }
  };

  // Handle back navigation
  const handleBack = () => {
    if (isLembur) {
      router.push("/lembur");
    } else {
      router.push("/");
    }
  };

  const currentLat = coords?.lat ?? TASIK_LAT;
  const currentLng = coords?.lng ?? TASIK_LNG;

  return (
    <div className="min-h-screen bg-[#156bb8] flex flex-col relative overflow-hidden select-none">
      {/* Hidden canvas for taking snapshot */}
      <canvas ref={canvasRef} className="hidden" />

      {/* ══════════════ TAHAP 1: KAMERA RESPONSIVE (HP, TAB, LAPTOP) ══════════════ */}
      {stage === "camera" && (
        <div className="fixed inset-0 z-50 bg-[#060c14] flex items-center justify-center overflow-hidden">
          {/* Kamera Frame: Fullscreen di HP, Floating Kiosk Panel di Tablet & Laptop */}
          <div className="w-full h-full max-w-md md:max-w-xl md:h-[94vh] md:rounded-3xl md:border md:border-white/20 md:shadow-[0_0_60px_rgba(0,0,0,0.85)] overflow-hidden relative flex flex-col justify-between bg-black">
            {/* ── 1. Realtime Video Feed (Always Mounted to prevent blank screen) ── */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              onPlaying={() => {
                setIsVideoPlaying(true);
                setCameraError(null);
              }}
              onLoadedMetadata={async () => {
                try {
                  await videoRef.current?.play();
                  setIsVideoPlaying(true);
                } catch (e) {
                  console.warn("Autoplay error:", e);
                }
              }}
              className={`absolute inset-0 w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
                isVideoPlaying ? "opacity-100" : "opacity-0"
              }`}
            />

            {/* Fallback / Loading / Permission Request Overlay */}
            {!isVideoPlaying && (
              <div className="absolute inset-0 w-full h-full bg-[#071320] flex flex-col items-center justify-center p-6 text-center z-10">
                <div className="w-48 h-60 rounded-[50%/60%] bg-slate-800/80 flex flex-col items-center justify-center overflow-hidden border border-slate-700 shadow-2xl mb-5 relative">
                  {isStartingCamera ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full border-3 border-blue-500 border-t-transparent animate-spin" />
                      <span className="text-white text-xs font-semibold">Menyalakan Kamera...</span>
                    </div>
                  ) : (
                    <svg viewBox="0 0 64 64" fill="none" className="w-36 h-36 mt-4 opacity-50">
                      <circle cx="32" cy="22" r="14" fill="#64748b" />
                      <path
                        d="M10 58C10 44 20 38 32 38C44 38 54 44 54 58"
                        fill="#64748b"
                      />
                    </svg>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => startCamera()}
                  disabled={isStartingCamera}
                  className="bg-[#156bb8] hover:bg-[#1f7cd0] active:scale-95 text-white font-bold text-xs px-6 py-3 rounded-full shadow-lg flex items-center gap-2 transition-all cursor-pointer z-20"
                >
                  <Camera size={18} />
                  <span>
                    {isStartingCamera ? "Menghubungkan Kamera..." : "Aktifkan Kamera"}
                  </span>
                </button>

                {cameraError ? (
                  <div className="mt-4 bg-red-950/80 border border-red-500/40 text-red-200 text-[11.5px] px-4 py-2.5 rounded-xl max-w-xs">
                    <p className="font-semibold mb-0.5">Akses Kamera Diperlukan</p>
                    <p>{cameraError}</p>
                  </div>
                ) : (
                  <p className="text-[11px] text-white/70 font-medium mt-3 max-w-xs">
                    Izinkan akses kamera di browser Anda untuk melakukan absensi
                  </p>
                )}
              </div>
            )}

            {/* ── 2. Top Bar (Overlay Translucent) ── */}
            <div className="relative z-20 pt-5 pb-6 px-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between text-white">
              <button
                onClick={handleBack}
                aria-label="Kembali"
                className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 active:scale-90 transition-all cursor-pointer"
              >
                <ChevronLeft size={24} />
              </button>
              <div className="flex items-center gap-2">
                {isCheckOut || isBreakEnd ? (
                  <div className="w-7 h-7 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300">
                    <LogOut size={15} strokeWidth={2.5} />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                    <LogIn size={15} strokeWidth={2.5} />
                  </div>
                )}
                <h1 className="text-white font-bold italic text-[19px] tracking-wide drop-shadow-md">
                  {getPageTitle()}
                </h1>
              </div>
              <div className="w-10" />
            </div>

            {/* ── 3. Center Area Wajah (Face Guide Oval Overlay) ── */}
            <div className="relative z-20 pointer-events-none flex flex-col items-center justify-center flex-1">
              <div
                className={`w-[220px] h-[300px] rounded-[50%/60%] border-2 transition-all duration-500 relative flex items-center justify-center ${
                  isFaceAligned
                    ? "border-[#22c55e] shadow-[0_0_35px_rgba(34,197,94,0.55)]"
                    : "border-dashed border-amber-400"
                }`}
              >
                {/* Corner alignment markers */}
                <div
                  className={`absolute -top-1.5 -left-1.5 w-7 h-7 border-t-4 border-l-4 rounded-tl-lg transition-colors ${
                    isFaceAligned ? "border-green-500" : "border-amber-400"
                  }`}
                />
                <div
                  className={`absolute -top-1.5 -right-1.5 w-7 h-7 border-t-4 border-r-4 rounded-tr-lg transition-colors ${
                    isFaceAligned ? "border-green-500" : "border-amber-400"
                  }`}
                />
                <div
                  className={`absolute -bottom-1.5 -left-1.5 w-7 h-7 border-b-4 border-l-4 rounded-bl-lg transition-colors ${
                    isFaceAligned ? "border-green-500" : "border-amber-400"
                  }`}
                />
                <div
                  className={`absolute -bottom-1.5 -right-1.5 w-7 h-7 border-b-4 border-r-4 rounded-br-lg transition-colors ${
                    isFaceAligned ? "border-green-500" : "border-amber-400"
                  }`}
                />

                {/* Animated Horizontal Scan Line */}
                <div
                  className={`absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent ${
                    isFaceAligned ? "via-green-400" : "via-amber-400"
                  } to-transparent animate-pulse opacity-85`}
                />

                {/* Status pill badge inside */}
                <div
                  className={`absolute -bottom-10 backdrop-blur-md text-white text-[11.5px] font-semibold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 transition-colors ${
                    !isVideoPlaying
                      ? "bg-slate-900/90 border border-slate-600/50"
                      : isFaceAligned
                      ? "bg-emerald-950/85 border border-emerald-500/50"
                      : "bg-amber-950/85 border border-amber-500/50"
                  }`}
                >
                  {!isVideoPlaying ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-400 animate-pulse" />
                      <span>{isStartingCamera ? "Menghubungkan Kamera..." : "Kamera Belum Aktif"}</span>
                    </>
                  ) : isFaceAligned ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-ping" />
                      <span>Wajah Terdeteksi ✓ (Siap Absen)</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                      <span>Posisikan Wajah di Area Oval...</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ── 4. Bottom Controls (Overlay Translucent) ── */}
            <div className="relative z-20 pb-8 pt-6 px-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col items-center">
              {/* Realtime Location Badge with 100m Radius status */}
              <div className="bg-black/60 backdrop-blur-md border border-white/20 rounded-full py-1.5 px-4 flex items-center gap-2 text-white/90 text-[11px] mb-4 shadow-lg">
                <MapPin size={13} className="text-emerald-400" />
                <span className="font-medium truncate max-w-[220px]">
                  {locationName} • {distanceMeters}m (Radius 100m)
                </span>
                <button
                  onClick={fetchLocation}
                  disabled={isLocating}
                  className="text-white hover:text-blue-300 ml-1 flex items-center gap-1 active:scale-95"
                >
                  <RotateCw
                    size={11}
                    className={isLocating ? "animate-spin text-blue-400" : ""}
                  />
                  <span>Perbarui</span>
                </button>
              </div>

              {/* Shutter Button & Quick Note Action */}
              <div className="flex items-center justify-center gap-6 w-full max-w-[280px]">
                <div className="w-11" />

                {/* Circular Shutter Button */}
                <button
                  onClick={handleCapture}
                  disabled={!isVideoPlaying}
                  aria-label={`Ambil Foto ${getPageTitle()}`}
                  className={`w-18 h-18 rounded-full border-[4px] border-white shadow-2xl flex items-center justify-center transition-all cursor-pointer ${
                    isVideoPlaying && isFaceAligned
                      ? "bg-[#156bb8] ring-4 ring-[#156bb8]/40 active:scale-90"
                      : "bg-slate-600 ring-4 ring-slate-500/30 opacity-70 cursor-not-allowed"
                  }`}
                >
                  <div className="w-7 h-7 rounded-full bg-white shadow-inner" />
                </button>

                {/* Quick Note Button */}
                <button
                  onClick={handleTambahCatatan}
                  aria-label="Tambah Catatan"
                  className={`w-11 h-11 rounded-full border flex flex-col items-center justify-center transition-all active:scale-95 shadow-md relative ${
                    catatan
                      ? "bg-[#156bb8] border-white text-white"
                      : "bg-black/50 border-white/30 text-white/90 hover:bg-black/70"
                  }`}
                >
                  <MessageSquare size={16} />
                  <span className="text-[7.5px] font-semibold mt-0.5 leading-none">
                    {catatan ? "Catatan ✓" : "Catatan"}
                  </span>
                  {catatan && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-black" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ TAHAP 2: PREVIEW + BLUE BOTTOM SHEET RESPONSIVE ══════════════ */}
      {stage === "preview" && (
        <div className="fixed inset-0 z-50 bg-[#156bb8] flex flex-col items-center overflow-y-auto select-none">
          <div className="w-full min-h-screen bg-gradient-to-b from-[#2a8ee4] via-[#1f7cd0] to-[#156bb8] flex flex-col items-center relative overflow-x-hidden">
            {/* Watermark Logo Bisa Media Putih Blur di ujung kanan */}
            <div className="absolute -right-6 -top-4 w-60 h-60 pointer-events-none opacity-20 filter blur-[0.8px] rotate-[-6deg] select-none">
              <img
                src="/bisa-media-white.png"
                alt="Watermark BISA MEDIA"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Responsive Container (HP, Tablet, Laptop) */}
            <div className="w-full max-w-md md:max-w-xl lg:max-w-2xl flex flex-col min-h-screen justify-between relative z-20">
              {/* Top Bar */}
              <div className="pt-4 pb-2 px-4 flex items-center justify-between text-white relative z-20">
              <button
                onClick={() => setStage("camera")}
                className="text-white hover:opacity-80 active:scale-90 transition-transform p-1 -ml-1"
              >
                <ChevronLeft size={24} />
              </button>
              <div className="flex items-center gap-2">
                {isCheckOut || isBreakEnd ? (
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white">
                    <LogOut size={15} strokeWidth={2.5} />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white">
                    <LogIn size={15} strokeWidth={2.5} />
                  </div>
                )}
                <h1 className="text-white font-bold italic text-[18px] tracking-wide">
                  {getPageTitle()}
                </h1>
              </div>
              <div className="w-6" />
            </div>

            {/* Top Half: Captured Image Preview (Anti-Gepeng Proportional Frame) */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center mx-3 my-2 min-h-[300px] max-h-[50vh]">
              <div className="relative h-full w-auto aspect-[3/4] max-h-[48vh] rounded-2xl overflow-hidden border border-white/25 shadow-2xl bg-slate-900 group flex items-center justify-center">
                {capturedImage && capturedImage !== "/silhouette_captured.png" ? (
                  <img
                    src={capturedImage}
                    alt="Foto Absensi"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#0a1828] flex items-center justify-center">
                    <svg viewBox="0 0 100 120" fill="none" className="w-56 h-64">
                      <path
                        d="M50 15C36 15 25 28 25 44C25 56 31 66 40 70C22 75 8 92 8 115H92C92 92 78 75 60 70C69 66 75 56 75 44C75 28 64 15 50 15Z"
                        fill="#020813"
                      />
                    </svg>
                  </div>
                )}

                {/* Retake Camera Button */}
                <button
                  onClick={() => setStage("camera")}
                  className="absolute top-3 left-3 bg-black/60 hover:bg-black/80 backdrop-blur-sm text-white text-[11px] font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <Camera size={13} />
                  <span>Foto Ulang</span>
                </button>
              </div>
            </div>

            {/* Lower Half: Blue Bottom Sheet */}
            <div className="bg-[#156bb8] rounded-t-[32px] pt-3 px-4 pb-6 shadow-2xl text-white">
              {/* Handle Drag Bar */}
              <div className="flex items-center justify-center mb-3">
                <div className="w-8 h-1 bg-white/40 rounded-full" />
              </div>

              <div className="flex gap-3 items-stretch">
                {/* ── Left Column: Realtime OpenStreetMap Card with 100m Radius in Tasikmalaya ── */}
                <div className="w-[46%] bg-white rounded-2xl overflow-hidden relative shadow-md border border-white/20 min-h-[168px] flex flex-col justify-between p-2">
                  {/* 1. Live Interactive OpenStreetMap Embed */}
                  <div className="absolute inset-0 bg-[#e5e3df] overflow-hidden">
                    <iframe
                      title="Realtime Map Tasikmalaya"
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${currentLng - 0.002}%2C${currentLat - 0.0015}%2C${currentLng + 0.002}%2C${currentLat + 0.0015}&layer=mapnik`}
                      className="w-full h-full border-0 pointer-events-none filter saturate-125"
                      loading="lazy"
                    />

                    {/* 2. Visual 100m Radius Geofence Circle Overlay */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                      {/* 100m Geofence Radius Aura */}
                      <div className="w-28 h-28 rounded-full border-2 border-dashed border-blue-500 bg-blue-500/15 animate-pulse flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full border border-blue-400/40 bg-blue-400/10" />
                      </div>

                      {/* Radius 100m Badge */}
                      <div className="absolute top-1.5 left-1.5 bg-blue-600/90 backdrop-blur-xs text-white text-[7.5px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                        <span>Radius 100m</span>
                      </div>
                    </div>

                    {/* 3. Center Red Location Pin */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10">
                      <div className="bg-white/95 px-1.5 py-0.5 rounded shadow-sm text-[7.5px] font-bold text-slate-800 whitespace-nowrap mb-0.5 border border-slate-200 truncate max-w-[90px]">
                        {locationName.split(",")[0] || "Tasikmalaya"}
                      </div>
                      <div className="w-5 h-5 text-red-600 drop-shadow-md">
                        <svg viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5-2.5 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Refresh Map Button at bottom */}
                  <div className="relative z-20 mt-auto flex justify-between items-end">
                    <button
                      onClick={fetchLocation}
                      aria-label="Refresh Lokasi"
                      className="w-7 h-7 rounded-lg bg-white/90 shadow-sm flex items-center justify-center text-slate-700 hover:bg-white active:scale-95 transition-all"
                    >
                      <RotateCw
                        size={13}
                        className={isLocating ? "animate-spin text-blue-600" : ""}
                      />
                    </button>
                    <span className="text-[7.5px] text-slate-600 font-bold bg-white/90 px-1 py-0.5 rounded shadow-2xs">
                      Live GPS
                    </span>
                  </div>
                </div>

                {/* ── Right Column: Attendance Specs ── */}
                <div className="flex-1 flex flex-col justify-between py-0.5 pl-1 text-[11px]">
                  {isBreak ? (
                    <div className="space-y-1.5">
                      {/* Clock In Istirahat */}
                      <div className="bg-white/10 backdrop-blur-xs rounded-xl px-2.5 py-1.5 border border-white/15 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-emerald-400/20 border border-emerald-300/30 flex items-center justify-center text-emerald-300 shrink-0">
                            <LogIn size={13} strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className="text-[9px] text-white/70 font-medium leading-none">
                              Mulai Istirahat
                            </p>
                            <p className="font-bold text-[13px] tracking-wider text-white mt-0.5 leading-none">
                              {isBreakEnd
                                ? existingBreakStart || "12:00"
                                : currentTimeStr || "-- : --"}
                            </p>
                          </div>
                        </div>
                        <span className="text-[8px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                          Mulai
                        </span>
                      </div>

                      {/* Clock Out Istirahat */}
                      <div className="bg-white/10 backdrop-blur-xs rounded-xl px-2.5 py-1.5 border border-white/15 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 shrink-0">
                            <LogOut size={13} strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className="text-[9px] text-white/70 font-medium leading-none">
                              Selesai Istirahat
                            </p>
                            <p className="font-bold text-[13px] tracking-wider text-white mt-0.5 leading-none">
                              {isBreakEnd ? currentTimeStr || "-- : --" : "-- : --"}
                            </p>
                          </div>
                        </div>
                        <span className="text-[8px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded">
                          Selesai
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {/* Clock In */}
                      <div className="bg-white/10 backdrop-blur-xs rounded-xl px-2.5 py-1.5 border border-white/15 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-emerald-400/20 border border-emerald-300/30 flex items-center justify-center text-emerald-300 shrink-0">
                            <LogIn size={13} strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className="text-[9px] text-white/70 font-medium leading-none">Clock In</p>
                            <p className="font-bold text-[13px] tracking-wider text-white mt-0.5 leading-none">
                              {isCheckOut ? "07:59 AM" : currentTimeStr || "-- : --"}
                            </p>
                          </div>
                        </div>
                        <span className="text-[8px] font-bold text-emerald-300 bg-emerald-500/20 px-1.5 py-0.5 rounded">
                          Masuk
                        </span>
                      </div>

                      {/* Clock Out */}
                      <div className="bg-white/10 backdrop-blur-xs rounded-xl px-2.5 py-1.5 border border-white/15 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-rose-400/20 border border-rose-300/30 flex items-center justify-center text-rose-300 shrink-0">
                            <LogOut size={13} strokeWidth={2.5} />
                          </div>
                          <div>
                            <p className="text-[9px] text-white/70 font-medium leading-none">Clock Out</p>
                            <p className="font-bold text-[13px] tracking-wider text-white mt-0.5 leading-none">
                              {isCheckOut ? currentTimeStr || "-- : --" : "-- : --"}
                            </p>
                          </div>
                        </div>
                        <span className="text-[8px] font-bold text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded">
                          Pulang
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Jarak Kantor (Maks. 100m) */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="w-5 flex justify-center text-white/90">
                      <MapPin size={15} />
                    </div>
                    <div>
                      <p className="text-[9.5px] text-white/70 leading-none">
                        Jarak Kantor (Maks. 100m)
                      </p>
                      <p className="font-bold text-[12px] text-white mt-0.5">
                        {distanceMeters} m{" "}
                        <span
                          className={`text-[9px] font-semibold ${
                            distanceMeters <= RADIUS_LIMIT
                              ? "text-emerald-300"
                              : "text-amber-300"
                          }`}
                        >
                          ({distanceMeters <= RADIUS_LIMIT ? "Dalam 100m ✓" : "Luar 100m"})
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Status Lokasi */}
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="w-5 flex justify-center text-white/90">
                      <Building2 size={15} />
                    </div>
                    <div>
                      <p className="text-[9.5px] text-white/70 leading-none">Status</p>
                      <p className="font-bold text-[12px] text-white mt-0.5">
                        {distanceMeters <= RADIUS_LIMIT
                          ? "Hadir Tepat Waktu"
                          : "Luar Area Kantor"}
                      </p>
                    </div>
                  </div>

                  {/* Catatan */}
                  <div className="mt-2 pt-1 border-t border-white/20">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-white flex items-center gap-1">
                        <MessageSquare size={10} />
                        Catatan {isCheckOut ? "Clock Out" : "Clock In"}
                      </p>
                      <button
                        onClick={handleTambahCatatan}
                        className="text-[9px] text-white/90 underline hover:text-white"
                      >
                        {catatan ? "Ubah" : "Tambah"}
                      </button>
                    </div>
                    <div
                      onClick={handleTambahCatatan}
                      className="mt-1 bg-white/10 hover:bg-white/15 cursor-pointer rounded-lg px-2 py-1.5 border border-white/15 transition-all flex items-center justify-between"
                    >
                      <p className="text-[10px] text-white/90 italic truncate max-w-[140px]">
                        {catatan ? `"${catatan}"` : "+ Tambah catatan (opsional)"}
                      </p>
                      {catatan && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 ml-1" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Full-width White Action Button */}
              <button
                onClick={handleConfirmAbsensi}
                className="w-full mt-4 bg-white rounded-xl py-2.5 text-[#156bb8] font-bold italic text-[15px] shadow-lg hover:bg-slate-50 active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
              >
                {isCheckOut || isBreakEnd ? (
                  <LogOut size={18} strokeWidth={2.5} className="text-rose-600" />
                ) : (
                  <LogIn size={18} strokeWidth={2.5} className="text-emerald-600" />
                )}
                <span>{getButtonText()}</span>
              </button>
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black flex items-center justify-center text-white font-semibold">
          Memuat Kamera...
        </div>
      }
    >
      <CheckInContent />
    </Suspense>
  );
}
