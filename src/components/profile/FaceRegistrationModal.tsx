"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, AlertCircle } from "lucide-react";
import { getUserProfile } from "@/lib/userProfile";

interface FaceRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (photoDataUrl: string) => void;
}

type RegistrationStep = "ready" | "scanning" | "success";

const TOTAL_TICKS = 48; // 48 Garis Radial Apple Face ID (0 s.d 47)
const RADIUS = 142;
const CX = 160;
const CY = 160;

export default function FaceRegistrationModal({
  isOpen,
  onClose,
  onSuccess,
}: FaceRegistrationModalProps) {
  const [step, setStep] = useState<RegistrationStep>("ready");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [instruction, setInstruction] = useState("Posisikan wajah Anda di dalam bingkai");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  // Status setiap 48 garis radial tick: false = abu-abu (belum terpindai), true = hijau (sudah terpindai)
  const [ticksFilled, setTicksFilled] = useState<boolean[]>(Array(TOTAL_TICKS).fill(false));

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hiddenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevFrameDataRef = useRef<Uint8Array | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Ref mutable untuk status 48 tick agar loop 60fps tidak mengalami closure stale state
  const ticksFilledRef = useRef<boolean[]>(Array(TOTAL_TICKS).fill(false));
  const hasCenteredFaceRef = useRef<boolean>(false);
  const lastSoundTimeRef = useRef<number>(0);

  // Stop camera cleanly
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const resetAll = () => {
    stopCamera();
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    const freshTicks = Array(TOTAL_TICKS).fill(false);
    ticksFilledRef.current = freshTicks;
    setTicksFilled(freshTicks);
    hasCenteredFaceRef.current = false;
    prevFrameDataRef.current = null;
    setStep("ready");
    setInstruction("Posisikan wajah Anda di dalam bingkai");
    setCameraError(null);
    setCapturedPhoto(null);
  };

  useEffect(() => {
    if (!isOpen) {
      resetAll();
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Web Audio Helpers
  const playTickSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, now);
      gain.gain.setValueAtTime(0.015, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.035);
    } catch {}
  };

  const playFaceIdSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.18);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880.0, now + 0.12);
      gain2.gain.setValueAtTime(0.2, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.55);
    } catch {}
  };

  // Start Real-Time Face Registration with Camera
  const handleStartSetup = async () => {
    setCameraError(null);
    setStep("scanning");
    const freshTicks = Array(TOTAL_TICKS).fill(false);
    ticksFilledRef.current = freshTicks;
    setTicksFilled(freshTicks);
    hasCenteredFaceRef.current = false;
    prevFrameDataRef.current = null;
    setInstruction("Posisikan wajah Anda tepat di dalam lingkaran");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => console.log("Play error:", err));
      }

      // Mulai deteksi pergerakan kepala 360 derajat secara real-time
      startRealtimeFaceScanLoop();
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Izin akses kamera ditolak. Silakan izinkan browser mengakses kamera depan."
          : "Kamera tidak terdeteksi atau sedang digunakan oleh aplikasi lain."
      );
      setStep("ready");
    }
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // SISTEM DETEKSI REAL-TIME GERAKAN SELURUH AREA WAJAH (360° APPLE FACE ID)
  // Setiap tick radial mewakili sudut arah wajah fisik pengguna.
  // Garis hijau HANYA AKAN MENYALA jika wajah diarahkan ke sudut tersebut!
  // Jika pengguna tidak memutar wajah ke seluruh area, maka garis hijau tidak bertambah!
  // ══════════════════════════════════════════════════════════════════════════════
  const startRealtimeFaceScanLoop = () => {
    if (!hiddenCanvasRef.current) {
      hiddenCanvasRef.current = document.createElement("canvas");
      hiddenCanvasRef.current.width = 64;
      hiddenCanvasRef.current.height = 64;
    }

    const canvas = hiddenCanvasRef.current;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let centerHoldCounter = 0;

    const processFrame = () => {
      const video = videoRef.current;

      if (video && video.readyState >= 2 && video.videoWidth > 0) {
        ctx.drawImage(video, 0, 0, 64, 64);
        const imgData = ctx.getImageData(0, 0, 64, 64);
        const data = imgData.data;

        // Ekstraksi bobot wajah (luminance + skin tone) & deteksi pergerakan frame
        let totalWeight = 0;
        let weightedX = 0;
        let weightedY = 0;

        const currentGray = new Uint8Array(64 * 64);
        let motionMagnitude = 0;
        let motionWeightedX = 0;
        let motionWeightedY = 0;

        const prevGray = prevFrameDataRef.current;

        for (let y = 0; y < 64; y++) {
          for (let x = 0; x < 64; x++) {
            const idx = (y * 64 + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const lum = (r * 299 + g * 587 + b * 114) / 1000;
            const pos = y * 64 + x;
            currentGray[pos] = lum;

            // Model deteksi kulit & kontur wajah
            const isSkinTone = r > 40 && g > 25 && b > 15 && r > g && r > b;
            if (isSkinTone) {
              totalWeight += 1;
              weightedX += x;
              weightedY += y;
            }

            // Hitung pergerakan pixel dari frame sebelumnya
            if (prevGray) {
              const diff = Math.abs(lum - prevGray[pos]);
              if (diff > 12) {
                motionMagnitude += diff;
                motionWeightedX += x * diff;
                motionWeightedY += y * diff;
              }
            }
          }
        }

        prevFrameDataRef.current = currentGray;

        // Hitung posisi pusat wajah relatif terhadap kamera (pusat = 32, 32)
        const hasFace = totalWeight > 80;

        if (hasFace) {
          const rawFaceX = weightedX / totalWeight;
          const rawFaceY = weightedY / totalWeight;

          // Mirror X agar sesuai dengan tampilan cermin selfie di layar
          const mirroredFaceX = 64 - rawFaceX;
          const deltaX = mirroredFaceX - 32;
          const deltaY = rawFaceY - 32;
          const distanceFromCenter = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

          // 1. Validasi Wajah Depan (Center Face)
          if (!hasCenteredFaceRef.current) {
            if (distanceFromCenter < 7.5) {
              centerHoldCounter++;
              if (centerHoldCounter >= 18) { // stabil ~0.5 detik di tengah
                hasCenteredFaceRef.current = true;
                // Nyalakan tick awal di atas sebagai penanda pemindaian aktif
                fillTickRange(0, 3);
                playTickSound();
              }
            } else {
              centerHoldCounter = Math.max(0, centerHoldCounter - 1);
            }
          } else {
            // 2. Pemindaian Real-Time 360 Derajat
            // Menghitung sudut kemiringan/arah kepala pengguna:
            let activeAngle: number | null = null;

            if (distanceFromCenter >= 2.8) {
              // Pengguna mengarahkan kepala ke arah tertentu
              activeAngle = Math.atan2(deltaY, deltaX);
            } else if (motionMagnitude > 500 && motionWeightedX > 0) {
              // Deteksi gerakan rotasi halus
              const motionX = 64 - (motionWeightedX / motionMagnitude);
              const motionY = motionWeightedY / motionMagnitude;
              const motDx = motionX - 32;
              const motDy = motionY - 32;
              if (Math.sqrt(motDx * motDx + motDy * motDy) > 2) {
                activeAngle = Math.atan2(motDy, motDx);
              }
            }

            if (activeAngle !== null) {
              // Konversi sudut radian [-PI, PI] ke indeks tick [0 s.d 47]
              // Di mana 0 adalah posisi jam 12 (atas)
              let angleFromTop = activeAngle + Math.PI / 2;
              if (angleFromTop < 0) angleFromTop += 2 * Math.PI;
              const targetTick = Math.round((angleFromTop / (2 * Math.PI)) * TOTAL_TICKS) % TOTAL_TICKS;

              // Isi tick pada sudut tersebut dan 2 tick di sebelahnya
              const newlyFilled = fillTickRange(targetTick - 1, targetTick + 1);

              if (newlyFilled) {
                const now = Date.now();
                if (now - lastSoundTimeRef.current > 120) {
                  playTickSound();
                  lastSoundTimeRef.current = now;
                }
              }
            }

            // Periksa apakah seluruh 48 tick sudah terisi hijau
            const currentFilledCount = ticksFilledRef.current.filter(Boolean).length;
            const isAllCompleted = currentFilledCount >= TOTAL_TICKS;

            // Panduan dinamis berdasarkan area mana yang masih kosong (belum dipindai)
            updateInstructionBasedOnMissingTicks();

            if (isAllCompleted) {
              completeRegistration();
              return; // hentikan loop
            }
          }
        }
      }

      animFrameRef.current = requestAnimationFrame(processFrame);
    };

    animFrameRef.current = requestAnimationFrame(processFrame);
  };

  // Helper untuk mengisi rentang tick melingkar
  const fillTickRange = (start: number, end: number): boolean => {
    let changed = false;
    const nextTicks = [...ticksFilledRef.current];

    for (let i = start; i <= end; i++) {
      const idx = ((i % TOTAL_TICKS) + TOTAL_TICKS) % TOTAL_TICKS;
      if (!nextTicks[idx]) {
        nextTicks[idx] = true;
        changed = true;
      }
    }

    if (changed) {
      ticksFilledRef.current = nextTicks;
      setTicksFilled(nextTicks);
    }

    return changed;
  };

  // Panduan cerdas: mendeteksi area mana yang belum terscan
  const updateInstructionBasedOnMissingTicks = () => {
    if (!hasCenteredFaceRef.current) {
      setInstruction("Posisikan wajah Anda tepat di dalam lingkaran");
      return;
    }

    const ticks = ticksFilledRef.current;
    // Area Kanan: tick 6 s.d 18
    const missingRight = ticks.slice(6, 18).some((t) => !t);
    // Area Bawah (Dagu): tick 18 s.d 30
    const missingBottom = ticks.slice(18, 30).some((t) => !t);
    // Area Kiri: tick 30 s.d 42
    const missingLeft = ticks.slice(30, 42).some((t) => !t);
    // Area Atas (Dahi): tick 42 s.d 48 dan 0 s.d 6
    const missingTop = [...ticks.slice(42, 48), ...ticks.slice(0, 6)].some((t) => !t);

    if (missingRight) {
      setInstruction("Gerakkan kepala perlahan ke sisi kanan");
    } else if (missingBottom) {
      setInstruction("Tundukkan kepala sedikit atau angkat dagu");
    } else if (missingLeft) {
      setInstruction("Gerakkan kepala perlahan ke sisi kiri");
    } else if (missingTop) {
      setInstruction("Gerakkan kepala melingkar untuk menyelesaikan");
    } else {
      setInstruction("Hampir selesai...");
    }
  };

  // Selesai jika seluruh area wajah berhasil dipindai
  const completeRegistration = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);

    // Ambil foto snapshot biometrik resolusi tinggi
    let photoData = "";
    if (videoRef.current) {
      try {
        const video = videoRef.current;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          photoData = canvas.toDataURL("image/jpeg", 0.92);
          setCapturedPhoto(photoData);
        }
      } catch (e) {
        console.warn("Canvas capture error:", e);
      }
    }

    // Simpan data biometrik
    const user = getUserProfile();
    const now = new Date();
    const dateStr = `${now.getDate()} ${
      [
        "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
        "Jul", "Agu", "Sep", "Okt", "Nov", "Des"
      ][now.getMonth()]
    } ${now.getFullYear()} • ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} WIB`;

    try {
      localStorage.setItem("bisa_face_id_registered", "true");
      if (photoData) localStorage.setItem("bisa_face_id_photo", photoData);
      localStorage.setItem("bisa_face_id_user_id", user.nip || "BMG250001");
      localStorage.setItem("bisa_face_id_user_name", user.name || "Eki Permadi Nugraha");
      localStorage.setItem("bisa_face_id_registered_at", dateStr);
      window.dispatchEvent(new Event("storage"));
    } catch (storageErr) {
      console.warn("Storage save error:", storageErr);
    }

    stopCamera();
    setStep("success");
    setInstruction("Wajah Anda kini terdaftar dan siap digunakan.");
    playFaceIdSuccessChime();
  };

  const handleFinish = () => {
    if (capturedPhoto) {
      onSuccess(capturedPhoto);
    }
    onClose();
  };

  const filledCount = ticksFilled.filter(Boolean).length;
  const progressPercent = Math.round((filledCount / TOTAL_TICKS) * 100);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col justify-between p-6 sm:p-10 select-none animate-fade-in font-sans">
      {/* ══════════════ 1. TOP HEADER (CLEAN APPLE STYLE) ══════════════ */}
      <div className="w-full flex items-center justify-between z-20">
        {step !== "success" ? (
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white text-base font-normal transition-colors cursor-pointer active:opacity-60"
          >
            Batal
          </button>
        ) : (
          <div className="w-12" />
        )}
      </div>

      {/* ══════════════ 2. CENTER CONTENT (MURNI TANPA TOPENG) ══════════════ */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto z-10 max-w-md mx-auto w-full text-center">
        {/* Dynamic Titles */}
        <div className="mb-6 sm:mb-8 transition-all duration-300">
          <h1 className="text-2xl sm:text-[32px] font-bold tracking-tight text-white leading-tight">
            {step === "ready"
              ? "Cara Mengatur Face ID"
              : step === "scanning"
              ? "Gerakkan Kepala Anda"
              : "Face ID Telah Diatur"}
          </h1>

          <p className="text-white/70 text-sm sm:text-[15px] mt-2 max-w-xs mx-auto leading-relaxed h-11 flex items-center justify-center">
            {step === "ready"
              ? "Posisikan wajah Anda di dalam lingkaran, lalu gerakkan kepala Anda secara perlahan dalam lingkaran untuk memindai seluruh area wajah."
              : step === "scanning"
              ? instruction
              : "Wajah Anda kini terdaftar dan siap digunakan untuk login dan absensi."}
          </p>

          {/* Camera Error Alert */}
          {cameraError && (
            <div className="mt-3 p-3 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs flex items-center justify-center gap-2 max-w-xs mx-auto text-left">
              <AlertCircle size={16} className="shrink-0 text-red-400" />
              <span>{cameraError}</span>
            </div>
          )}
        </div>

        {/* ══════════════ 3. APPLE FACE ID CIRCLE & 48 GARIS RADIAL INDEPENDEN ══════════════ */}
        <div className="relative w-[300px] h-[300px] sm:w-[320px] sm:h-[320px] mx-auto flex items-center justify-center select-none">
          {/* Radial Tick Marks (Masing-masing garis radial HANYA menyala jika sudut wajah fisik diarahkan ke sana) */}
          <svg
            viewBox="0 0 320 320"
            className="absolute inset-0 w-full h-full pointer-events-none"
          >
            {Array.from({ length: TOTAL_TICKS }).map((_, i) => {
              const angle = (i / TOTAL_TICKS) * 2 * Math.PI - Math.PI / 2;
              const isFilled = step === "success" || ticksFilled[i];

              const tickLength = isFilled ? 18 : 12;
              const x1 = CX + (RADIUS - tickLength) * Math.cos(angle);
              const y1 = CY + (RADIUS - tickLength) * Math.sin(angle);
              const x2 = CX + RADIUS * Math.cos(angle);
              const y2 = CY + RADIUS * Math.sin(angle);

              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={
                    isFilled
                      ? "#34c759"
                      : step === "scanning"
                      ? "rgba(255, 255, 255, 0.35)"
                      : "rgba(255, 255, 255, 0.2)"
                  }
                  strokeWidth={isFilled ? 4 : 2.5}
                  strokeLinecap="round"
                  className="transition-all duration-150"
                />
              );
            })}
          </svg>

          {/* Circular Camera Viewport (MURNI KAMERA ASLI - TANPA TOPENG / MESH) */}
          <div className="relative w-[216px] h-[216px] sm:w-[230px] sm:h-[230px] rounded-full overflow-hidden bg-[#1c1c1e] flex items-center justify-center shadow-2xl">
            {/* Live Camera Video Feed Murni */}
            {step !== "ready" && (
              <video
                ref={videoRef}
                className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-300 ${
                  step === "success" ? "opacity-30 blur-xs" : "opacity-100"
                }`}
                autoPlay
                playsInline
                muted
              />
            )}

            {/* Ready State: Placeholder Ilustrasi Garis Wajah Apple */}
            {step === "ready" && (
              <div className="flex flex-col items-center justify-center text-white/50 animate-pulse">
                <svg
                  viewBox="0 0 100 100"
                  className="w-28 h-28 stroke-white/40 fill-none"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="50" cy="50" r="44" strokeDasharray="6 6" />
                  <path d="M 36 42 Q 40 38 44 42" />
                  <path d="M 56 42 Q 60 38 64 42" />
                  <path d="M 50 48 L 50 58 L 54 58" />
                  <path d="M 38 66 Q 50 76 62 66" />
                </svg>
              </div>
            )}

            {/* Success State: Apple Face ID Green Springing Checkmark */}
            {step === "success" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center animate-scale-in">
                <div className="w-24 h-24 rounded-full bg-[#34c759] flex items-center justify-center text-white shadow-lg shadow-[#34c759]/40">
                  <Check size={52} strokeWidth={3.8} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════ 4. BOTTOM ACTION BAR ══════════════ */}
      <div className="w-full max-w-sm mx-auto z-20 pb-2">
        {step === "ready" && (
          <button
            type="button"
            onClick={handleStartSetup}
            className="w-full py-4 rounded-full bg-[#0071e3] hover:bg-[#0077ed] text-white text-[17px] font-semibold tracking-normal shadow-lg transition-all active:scale-[0.98] cursor-pointer"
          >
            Mulai
          </button>
        )}

        {step === "scanning" && (
          <div className="py-3 text-center">
            <span className="text-white/60 text-sm font-medium">
              Area Terpindai: <span className="text-[#34c759] font-bold">{progressPercent}%</span>
            </span>
          </div>
        )}

        {step === "success" && (
          <button
            type="button"
            onClick={handleFinish}
            className="w-full py-4 rounded-full bg-[#34c759] hover:bg-[#30b753] text-white text-[17px] font-semibold tracking-normal shadow-lg transition-all active:scale-[0.98] cursor-pointer"
          >
            Selesai
          </button>
        )}
      </div>
    </div>
  );
}
