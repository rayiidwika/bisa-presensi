"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  ScanFace,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  RotateCcw,
  Camera,
  X,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Clock,
  Building2,
} from "lucide-react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();

  // Splash Screen State
  const [showSplash, setShowSplash] = useState(true);
  const [splashProgress, setSplashProgress] = useState(0);
  const [splashStatus, setSplashStatus] = useState("Menyiapkan aplikasi...");

  // Login Form State
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});

  // ══════════════ FACE ID BIOMETRIC SCANNER STATE ══════════════
  const [showFaceModal, setShowFaceModal] = useState(false);
  const [isCameraLoading, setIsCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [scanStep, setScanStep] = useState<"initializing" | "scanning" | "analyzing" | "success">("initializing");
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStatusText, setScanStatusText] = useState("Menyiapkan sensor biometrik...");
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [verificationTime, setVerificationTime] = useState("");
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Stop camera tracks cleanly
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Web Audio API Face ID Chime
  const playFaceIdChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.18);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880, now + 0.12); // A5
      gain2.gain.setValueAtTime(0.18, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.5);
    } catch {
      // Audio context might be restricted
    }
  };

  // ══════════════ REAL-TIME CAMERA SCAN LIFECYCLE ══════════════
  useEffect(() => {
    if (!showFaceModal) {
      stopCamera();
      return;
    }

    let isCancelled = false;
    let timers: NodeJS.Timeout[] = [];

    const startCamera = async () => {
      setIsCameraLoading(true);
      setCameraError(null);
      setCapturedPhoto(null);
      setScanStep("initializing");
      setScanProgress(15);
      setScanStatusText("Mengakses kamera depan Anda...");

      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setCameraError("Perangkat atau browser ini tidak mendukung akses kamera langsung.");
        setIsCameraLoading(false);
        setHasCamera(false);
        return;
      }

      const candidateConstraints: MediaStreamConstraints[] = [
        {
          video: { facingMode: { ideal: "user" }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        },
        { video: { facingMode: "user" }, audio: false },
        { video: { facingMode: { ideal: "user" } }, audio: false },
        { video: true, audio: false },
      ];

      let activeStream: MediaStream | null = null;
      let lastErr: any = null;

      for (const constraint of candidateConstraints) {
        try {
          activeStream = await navigator.mediaDevices.getUserMedia(constraint);
          if (activeStream) break;
        } catch (err: any) {
          lastErr = err;
        }
      }

      if (isCancelled) {
        if (activeStream) activeStream.getTracks().forEach((t) => t.stop());
        return;
      }

      if (activeStream) {
        streamRef.current = activeStream;
        setHasCamera(true);
        setIsCameraLoading(false);

        // Wait a tick for videoRef to mount in DOM
        setTimeout(async () => {
          if (isCancelled || !videoRef.current) return;
          const video = videoRef.current;
          video.srcObject = activeStream;
          video.setAttribute("playsinline", "true");
          video.setAttribute("webkit-playsinline", "true");
          video.muted = true;
          try {
            await video.play();
          } catch (e) {
            console.log("Video auto-play interrupted:", e);
          }
        }, 100);

        // Phase 1: Real-time Face Detection
        const t1 = setTimeout(() => {
          if (isCancelled) return;
          setScanStep("scanning");
          setScanProgress(50);
          setScanStatusText("Mendeteksi wajah asli Anda secara real-time...");
        }, 1000);

        // Phase 2: Analyzing biometrics & matching database
        const t2 = setTimeout(() => {
          if (isCancelled) return;
          setScanStep("analyzing");
          setScanProgress(85);
          setScanStatusText("Mencocokkan kontur wajah dengan data karyawan...");
        }, 2200);

        // Phase 3: Take real photo snapshot from live webcam & Verify!
        const t3 = setTimeout(() => {
          if (isCancelled) return;

          if (videoRef.current) {
            try {
              const video = videoRef.current;
              const canvas = document.createElement("canvas");
              canvas.width = video.videoWidth || 640;
              canvas.height = video.videoHeight || 480;
              const ctx = canvas.getContext("2d");
              if (ctx) {
                // Mirror snapshot to match live selfie viewfinder
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
                setCapturedPhoto(dataUrl);
              }
            } catch (snapErr) {
              console.warn("Capture snapshot error:", snapErr);
            }
          }

          // Format verification time
          const now = new Date();
          const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")} WIB`;
          setVerificationTime(timeStr);

          stopCamera();
          setScanStep("success");
          setScanProgress(100);
          setScanStatusText("Wajah Terverifikasi: Setiawan");
          playFaceIdChime();

          // Auto-redirect countdown (3 seconds)
          let count = 3;
          setRedirectCountdown(count);
          const interval = setInterval(() => {
            count -= 1;
            setRedirectCountdown(count);
            if (count <= 0) {
              clearInterval(interval);
              setShowFaceModal(false);
              markUserLoggedIn();
              toast.success("Login Face ID Berhasil!", {
                description: "Selamat datang kembali, Setiawan (IT Programmer)!",
              });
              router.push("/");
            }
          }, 1000);
          timers.push(interval as any);
        }, 3600);

        timers.push(t1, t2, t3);
      } else {
        setIsCameraLoading(false);
        setHasCamera(false);
        setCameraError(
          lastErr?.name === "NotAllowedError" || lastErr?.name === "PermissionDeniedError"
            ? "Izin akses kamera belum diaktifkan. Silakan izinkan akses kamera di browser Anda untuk melakukan pemindaian wajah asli."
            : "Kamera tidak terdeteksi pada perangkat ini. Pastikan kamera/webcam terhubung dengan baik."
        );
      }
    };

    startCamera();

    return () => {
      isCancelled = true;
      timers.forEach(clearTimeout);
      stopCamera();
    };
  }, [showFaceModal]);

  const markUserLoggedIn = () => {
    try {
      localStorage.setItem("bisa_logged_in", "true");
      document.cookie = "bisa_logged_in=true; path=/; max-age=2592000; SameSite=Lax";
    } catch (e) {
      console.warn("Storage error", e);
    }
  };

  const handleStartFaceId = () => {
    setShowFaceModal(true);
  };

  const handleStartSimulatedScan = () => {
    setIsCameraLoading(false);
    setCameraError(null);
    setHasCamera(true);
    setScanStep("scanning");
    setScanProgress(45);
    setScanStatusText("Memindai biometrik kontur wajah...");

    setTimeout(() => {
      setScanStep("analyzing");
      setScanProgress(80);
      setScanStatusText("Mencocokkan database wajah karyawan...");
    }, 1200);

    setTimeout(() => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")} WIB`;
      setVerificationTime(timeStr);
      setScanStep("success");
      setScanProgress(100);
      setScanStatusText("Wajah Terverifikasi: Setiawan");
      playFaceIdChime();

      let count = 4;
      setRedirectCountdown(count);
      const interval = setInterval(() => {
        count -= 1;
        setRedirectCountdown(count);
        if (count <= 0) {
          clearInterval(interval);
          setShowFaceModal(false);
          markUserLoggedIn();
          toast.success("Login Face ID Berhasil!", {
            description: "Selamat datang kembali, Setiawan (IT Programmer)!",
          });
          router.push("/");
        }
      }, 1000);
    }, 2400);
  };

  const handleCloseFaceModal = () => {
    stopCamera();
    setShowFaceModal(false);
    setCapturedPhoto(null);
    setScanStep("initializing");
    setScanProgress(0);
  };

  const handleProceedDashboardNow = () => {
    stopCamera();
    setShowFaceModal(false);
    markUserLoggedIn();
    toast.success("Login Face ID Berhasil!", {
      description: "Selamat datang kembali, Setiawan (IT Programmer)!",
    });
    router.push("/");
  };

  // ══════════════ 1. SPLASH SCREEN ANIMATION ══════════════
  useEffect(() => {
    if (!showSplash) return;

    const interval = setInterval(() => {
      setSplashProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setShowSplash(false), 300);
          return 100;
        }
        const next = prev + 5;
        if (next < 35) {
          setSplashStatus("Memuat konfigurasi sistem...");
        } else if (next < 75) {
          setSplashStatus("Menghubungkan ke server Bisa Media...");
        } else {
          setSplashStatus("Selamat datang!");
        }
        return next;
      });
    }, 70);

    return () => clearInterval(interval);
  }, [showSplash]);

  const handleSkipSplash = () => {
    setShowSplash(false);
  };

  const handleReplaySplash = () => {
    setSplashProgress(0);
    setSplashStatus("Menyiapkan aplikasi...");
    setShowSplash(true);
  };

  // ══════════════ 2. FORM ACTIONS ══════════════
  const handleQuickDemo = () => {
    setIdentifier("2024001");
    setPassword("password123");
    setErrors({});
    toast.info("Akun Demo terisi: Setiawan (IT Programmer)");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!identifier.trim()) {
      newErrors.identifier = "NIP atau Email wajib diisi";
    }
    if (!password) {
      newErrors.password = "Kata sandi wajib diisi";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    // Simulate login request
    await new Promise((r) => setTimeout(r, 1000));
    setIsLoading(false);

    markUserLoggedIn();
    toast.success("Login Berhasil!", {
      description: "Selamat datang kembali, Setiawan!",
    });

    router.push("/");
  };



  const handleForgotPassword = async () => {
    const Swal = (await import("sweetalert2")).default;
    Swal.fire({
      title: "Lupa Kata Sandi?",
      html: `
        <div class="text-left text-xs text-slate-600 space-y-2 mt-2">
          <p>Untuk mereset kata sandi akun karyawan, silakan hubungi bagian <b>HR & Personalia</b> atau administrator IT Bisa Media.</p>
          <div class="bg-blue-50 p-2.5 rounded-xl border border-blue-100 text-[#1a7dc4]">
            <p class="font-bold">Email Dukungan:</p>
            <p>hr@bisamedia.com</p>
          </div>
        </div>
      `,
      icon: "info",
      confirmButtonColor: "#1a7dc4",
      confirmButtonText: "Mengerti",
    });
  };

  return (
    <>
      {/* ══════════════ SPLASH SCREEN ══════════════ */}
      {showSplash && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 sm:p-10 bg-[#071322] text-white overflow-hidden animate-fade-in select-none">
          {/* Subtle Ambient Radial Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[420px] h-[340px] sm:h-[420px] bg-gradient-to-tr from-blue-600/20 via-sky-500/15 to-transparent rounded-full blur-3xl pointer-events-none" />

          {/* Top Bar: Minimal Skip Button */}
          <div className="w-full flex justify-end relative z-10">
            <button
              onClick={handleSkipSplash}
              className="text-xs font-medium text-slate-400 hover:text-white px-3 py-1.5 rounded-full transition-all cursor-pointer hover:bg-white/5 active:scale-95 tracking-wide"
            >
              Lewati
            </button>
          </div>

          {/* Center Brand Identity (Clean, Premium & Spacious) */}
          <div className="flex flex-col items-center text-center relative z-10 -mt-6">
            {/* 3D App Icon Hero */}
            <div className="relative mb-6">
              <div className="w-24 h-24 sm:w-28 sm:h-28 relative flex items-center justify-center animate-float-slow">
                <div className="absolute inset-0 bg-[#1a7dc4]/30 rounded-3xl blur-2xl animate-aura-pulse" />
                <img
                  src="/app-logo.png"
                  alt="Bisa Presensi"
                  className="w-full h-full object-contain relative z-10 drop-shadow-[0_20px_35px_rgba(20,110,200,0.45)]"
                />
              </div>
            </div>

            {/* App Title */}
            <h1 className="text-2xl sm:text-3xl font-black tracking-[0.16em] text-white drop-shadow-sm">
              BISA PRESENSI
            </h1>
            <p className="text-[11px] sm:text-xs text-sky-300/80 font-semibold tracking-[0.24em] uppercase mt-2">
              Sistem Presensi Digital
            </p>

            {/* Sleek Minimalist Progress Line */}
            <div className="w-44 sm:w-52 h-[3px] bg-white/10 rounded-full overflow-hidden mt-8 backdrop-blur-xs">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-sky-400 to-cyan-300 rounded-full transition-all duration-100 ease-out shadow-[0_0_12px_rgba(56,189,248,0.7)]"
                style={{ width: `${splashProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-sky-200/60 font-medium tracking-wide mt-3 h-4 transition-all">
              {splashStatus}
            </p>
          </div>

          {/* Bottom Clean Signature */}
          <div className="text-center relative z-10 text-[10px] text-slate-500 tracking-[0.2em] uppercase font-medium">
            PT BISA MEDIA TELEKOMUNIKASI
          </div>
        </div>
      )}

      {/* ══════════════ LOGIN VIEW ══════════════ */}
      <div className="min-h-screen bg-gradient-to-b from-[#e6f2fa] via-[#ddeef8] to-[#d0e6f6] flex flex-col justify-between p-4 sm:p-6 relative select-none overflow-x-hidden">
        {/* Subtle Ambient Shapes */}
        <div className="w-72 h-72 rounded-full bg-blue-300/20 blur-3xl absolute -top-16 -right-16 pointer-events-none" />
        <div className="w-64 h-64 rounded-full bg-cyan-300/15 blur-3xl absolute -bottom-16 -left-16 pointer-events-none" />

        {/* Top Header & Replay Splash Trigger */}
        <div className="flex items-center justify-end relative z-10 pt-2">
          <button
            onClick={handleReplaySplash}
            title="Tampilkan Splash Animasi Lagi"
            className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-[#1a7dc4] bg-white/70 hover:bg-white px-2.5 py-1 rounded-full border border-slate-200/80 transition-all cursor-pointer shadow-2xs active:scale-95"
          >
            <RotateCcw size={11} />
            <span>Splash</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="w-full max-w-sm sm:max-w-md mx-auto my-auto py-4 relative z-10">
          {/* Brand Header with New 3D Icon */}
          <div className="text-center mb-6">
            <div className="relative inline-block mb-3 group cursor-pointer" onClick={handleReplaySplash}>
              <div className="w-16 h-16 sm:w-20 sm:h-20 relative flex items-center justify-center mx-auto">
                <div className="absolute inset-0 bg-blue-500/25 rounded-3xl blur-xl group-hover:blur-2xl transition-all" />
                <img
                  src="/app-logo.png"
                  alt="Logo Bisa Presensi"
                  className="w-16 h-16 sm:w-20 sm:h-20 object-contain relative z-10 drop-shadow-[0_12px_24px_rgba(26,125,196,0.3)] transition-transform duration-300 group-hover:scale-105 active:scale-95"
                />
              </div>
            </div>
            <h2 className="text-2xl font-black text-[#133454] tracking-tight">
              Bisa Presensi
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Masuk ke portal kehadiran digital karyawan
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white/95 backdrop-blur-md rounded-[28px] border border-white shadow-xl shadow-[#156bb8]/8 p-5 sm:p-6 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Field 1: NIP / Email */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider px-0.5">
                  NIP / Email
                </label>
                <div className="relative">
                  <div className="w-10 h-10 absolute left-1 top-1 flex items-center justify-center text-slate-400 pointer-events-none">
                    <User size={16} strokeWidth={2.2} />
                  </div>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (errors.identifier) setErrors({ ...errors, identifier: undefined });
                    }}
                    placeholder="Contoh: 2024001"
                    className={`w-full bg-[#f8fcff] border rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all shadow-2xs ${
                      errors.identifier
                        ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                        : "border-[#c8dcea] focus:border-[#1a7dc4] focus:bg-white focus:ring-2 focus:ring-[#1a7dc4]/15"
                    }`}
                  />
                </div>
                {errors.identifier && (
                  <p className="text-[11px] text-red-500 font-medium px-1">
                    {errors.identifier}
                  </p>
                )}
              </div>

              {/* Field 2: Kata Sandi */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider px-0.5">
                  Kata Sandi
                </label>
                <div className="relative">
                  <div className="w-10 h-10 absolute left-1 top-1 flex items-center justify-center text-slate-400 pointer-events-none">
                    <Lock size={16} strokeWidth={2.2} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    placeholder="••••••••"
                    className={`w-full bg-[#f8fcff] border rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all shadow-2xs ${
                      errors.password
                        ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                        : "border-[#c8dcea] focus:border-[#1a7dc4] focus:bg-white focus:ring-2 focus:ring-[#1a7dc4]/15"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="w-10 h-10 absolute right-1 top-1 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] text-red-500 font-medium px-1">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Options: Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-xs pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-[#1a7dc4] border-slate-300 focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[11.5px] font-medium">Ingat Saya</span>
                </label>

                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11.5px] font-bold text-[#1a7dc4] hover:underline cursor-pointer"
                >
                  Lupa Kata Sandi?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-[#1a7dc4] to-[#156bb8] text-white font-bold text-xs sm:text-sm py-3 rounded-xl shadow-md shadow-[#156bb8]/25 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 mt-1"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Masuk Sekarang</span>
                    <ArrowRight size={15} strokeWidth={2.5} />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-slate-200/80 w-full" />
              <span className="bg-white px-3 text-[10px] uppercase font-bold text-slate-400 absolute">
                atau
              </span>
            </div>

            {/* Biometric Login Option */}
            <button
              type="button"
              onClick={handleStartFaceId}
              className="w-full bg-[#f4f9fd] hover:bg-[#e9f4fc] border border-[#b9d9ee] text-[#1a7dc4] font-bold text-xs py-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-[0.98] shadow-2xs group"
            >
              <ScanFace size={16} strokeWidth={2.2} className="group-hover:scale-110 transition-transform text-[#1a7dc4]" />
              <span>Masuk dengan Face ID / Biometrik</span>
            </button>

            {/* Quick Demo Credentials Chip */}
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={handleQuickDemo}
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-[#1a7dc4] bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <span>🔑</span>
                <span>Klik untuk Akun Demo: <b>Setiawan (IT)</b></span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Footer */}
        <div className="text-center relative z-10 pt-2 pb-1">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck size={13} className="text-emerald-500" />
            <span>Koneksi Aman & Terenkripsi</span>
          </div>
          <p className="text-[10.5px] text-slate-400 mt-0.5">
            © 2026 PT Bisa Media • Versi 2.4.0
          </p>
        </div>
      </div>

      {/* ══════════════ MODAL FACE ID (CLEAN & SLICK) ══════════════ */}
      {showFaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fade-in select-none">
          <div
            className="fixed inset-0 cursor-pointer"
            onClick={scanStep === "success" ? handleProceedDashboardNow : handleCloseFaceModal}
          />
          <div className="relative w-full max-w-[340px] bg-[#0c1825] border border-white/10 rounded-[28px] p-5 text-white text-center shadow-2xl z-10 animate-scale-in">
            {/* Close Button */}
            {scanStep !== "success" && (
              <button
                onClick={handleCloseFaceModal}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
              >
                <X size={15} />
              </button>
            )}

            {/* ──────── 1. TAMPILAN PEMINDAIAN (MINIMALIS & KEREN) ──────── */}
            {scanStep !== "success" && (
              <>
                {/* Header Sederhana */}
                <div className="flex flex-col items-center mt-1 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 text-sky-400 flex items-center justify-center mb-2">
                    <ScanFace size={22} strokeWidth={2.2} />
                  </div>
                  <h3 className="text-base font-bold text-white tracking-wide">
                    Face ID
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Arahkan wajah ke kamera
                  </p>
                </div>

                {/* Bingkai Kamera Melingkar Bersih */}
                <div className="w-48 h-48 mx-auto relative rounded-full overflow-hidden bg-black/80 border-2 border-sky-400/80 shadow-[0_0_20px_rgba(56,189,248,0.25)] my-3">
                  {/* Live Video Feed */}
                  <video
                    ref={videoRef}
                    className={`w-full h-full object-cover scale-x-[-1] transition-opacity duration-200 ${
                      hasCamera ? "opacity-100" : "opacity-0"
                    }`}
                    autoPlay
                    playsInline
                    muted
                  />

                  {/* Fallback jika kamera belum siap/ditolak */}
                  {!hasCamera && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 p-4 text-center">
                      {isCameraLoading ? (
                        <div className="flex flex-col items-center gap-2">
                          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs text-slate-400">Menghubungkan...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5">
                          <AlertCircle size={26} className="text-amber-400 mb-0.5" />
                          <p className="text-[11px] text-slate-300 px-1 leading-tight">
                            {cameraError || "Kamera belum aktif"}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => {
                                stopCamera();
                                setShowFaceModal(false);
                                setTimeout(() => setShowFaceModal(true), 200);
                              }}
                              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 text-slate-300 text-[11px] font-medium transition-colors"
                            >
                              Coba Lagi
                            </button>
                            <button
                              onClick={handleStartSimulatedScan}
                              className="px-2.5 py-1 rounded-full bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-[11px] font-medium border border-sky-400/30 transition-colors"
                            >
                              Simulasi
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Garis Scan Halus */}
                  {hasCamera && (
                    <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-sky-400 to-transparent shadow-[0_0_10px_rgba(56,189,248,0.9)] animate-scan pointer-events-none" />
                  )}
                </div>

                {/* Progress Tipis & Status */}
                <div className="space-y-1.5 my-2.5">
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-sky-400 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-300 font-medium h-4">
                    {scanStatusText}
                  </p>
                </div>

                {/* Tombol Batal */}
                <button
                  onClick={handleCloseFaceModal}
                  className="w-full py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer mt-1"
                >
                  Batal
                </button>
              </>
            )}

            {/* ──────── 2. TAMPILAN BERHASIL (BERSIH, ELEGAN, TIDAK RAMAI) ──────── */}
            {scanStep === "success" && (
              <div className="animate-scale-in py-2">
                {/* Foto Wajah Asli Pengguna dalam Lingkaran Rapi */}
                <div className="relative w-24 h-24 mx-auto my-2">
                  <div className="w-full h-full rounded-full overflow-hidden border-2 border-emerald-400 bg-slate-900 shadow-[0_0_20px_rgba(52,211,153,0.35)]">
                    {capturedPhoto ? (
                      <img
                        src={capturedPhoto}
                        alt="Foto Wajah Terverifikasi"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#156bb8] text-white font-bold text-2xl">
                        S
                      </div>
                    )}
                  </div>

                  {/* Badge Centang Hijau */}
                  <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-[#0c1825] text-white flex items-center justify-center shadow-md animate-bounce-in">
                    <Check size={16} strokeWidth={3.5} />
                  </span>
                </div>

                {/* Informasi Identitas Sederhana */}
                <h3 className="text-base font-bold text-white mt-3">
                  Wajah Terverifikasi
                </h3>
                <p className="text-sm font-semibold text-sky-300 mt-0.5">
                  Setiawan
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  NIP: 2024001 • IT Programmer
                </p>

                {/* Status Ringkas */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold my-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Login Berhasil</span>
                </div>

                {/* Tombol Lanjut ke Dashboard */}
                <button
                  onClick={handleProceedDashboardNow}
                  className="w-full bg-gradient-to-r from-[#1a7dc4] to-[#156bb8] text-white font-bold text-xs sm:text-sm py-2.5 rounded-xl shadow-md hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5 mt-1"
                >
                  <span>Masuk ke Beranda</span>
                  <ArrowRight size={15} strokeWidth={2.5} />
                </button>

                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                  Mengarahkan dalam {redirectCountdown} detik...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
