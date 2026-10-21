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
  const [registeredPhoto, setRegisteredPhoto] = useState<string | null>(null);
  const [registeredName, setRegisteredName] = useState<string>("Pegawai");
  const [registeredNip, setRegisteredNip] = useState<string>("BMG250001");
  const [liveMatchScore, setLiveMatchScore] = useState<number>(0);
  const [isFaceMismatch, setIsFaceMismatch] = useState<boolean>(false);
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

  // ══════════════ FACE BIOMETRIC EXTRACTOR & MATCHER (LBP + 16-ZONE + CHROMA) ══════════════
  interface BiometricDescriptor {
    lbpVector: Float32Array; // 16 blocks x 8 bins = 128 dimensi tekstur mikro wajah
    regProfile: Float32Array; // 16 area proporsi anatomis wajah
    chroma: [number, number, number]; // Komposisi rona r, g, b
  }

  const extractBiometricDescriptor = (luma: Float32Array, rawRgb: Uint8ClampedArray): BiometricDescriptor => {
    // 1. 16 Blocks (4x4 grid, masing-masing 12x12 piksel) Local Binary Patterns (LBP)
    // Mengekstrak tekstur kontur alis, sudut mata, pangkal hidung, lekuk bibir, dan rahang
    const lbpVector = new Float32Array(128);
    for (let by = 0; by < 4; by++) {
      for (let bx = 0; bx < 4; bx++) {
        const blockIdx = by * 4 + bx;
        const startX = bx * 12;
        const startY = by * 12;
        for (let y = startY + 1; y < startY + 11; y++) {
          for (let x = startX + 1; x < startX + 11; x++) {
            const c = luma[y * 48 + x];
            let code = 0;
            if (luma[(y - 1) * 48 + (x - 1)] >= c) code |= 1;
            if (luma[(y - 1) * 48 + x] >= c) code |= 2;
            if (luma[(y - 1) * 48 + (x + 1)] >= c) code |= 4;
            if (luma[y * 48 + (x + 1)] >= c) code |= 8;
            if (luma[(y + 1) * 48 + (x + 1)] >= c) code |= 16;
            if (luma[(y + 1) * 48 + x] >= c) code |= 32;
            if (luma[(y + 1) * 48 + (x - 1)] >= c) code |= 64;
            if (luma[y * 48 + (x - 1)] >= c) code |= 128;
            const bin = code >> 5; // 0..7
            lbpVector[blockIdx * 8 + bin]++;
          }
        }
      }
    }
    // Normalisasi LBP vector ke unit length untuk pembandingan Cosine
    let lbpNormSq = 0;
    for (let i = 0; i < 128; i++) lbpNormSq += lbpVector[i] * lbpVector[i];
    const lbpNorm = Math.sqrt(lbpNormSq) || 1;
    for (let i = 0; i < 128; i++) lbpVector[i] /= lbpNorm;

    // 2. 16-Zone Regional Profile dinormalisasi terhadap rata-rata intensitas wajah
    const regProfile = new Float32Array(16);
    let totalLuma = 0;
    for (let by = 0; by < 4; by++) {
      for (let bx = 0; bx < 4; bx++) {
        let bSum = 0;
        for (let y = by * 12; y < (by + 1) * 12; y++) {
          for (let x = bx * 12; x < (bx + 1) * 12; x++) {
            bSum += luma[y * 48 + x];
          }
        }
        regProfile[by * 4 + bx] = bSum / 144;
        totalLuma += bSum;
      }
    }
    const meanLuma = totalLuma / (48 * 48) || 1;
    let profNormSq = 0;
    for (let i = 0; i < 16; i++) {
      regProfile[i] /= meanLuma;
      profNormSq += regProfile[i] * regProfile[i];
    }
    const profNorm = Math.sqrt(profNormSq) || 1;
    for (let i = 0; i < 16; i++) regProfile[i] /= profNorm;

    // 3. Central Face Chroma (x: 12..36, y: 10..38)
    let rSum = 0, gSum = 0, bSum = 0, count = 0;
    for (let y = 10; y <= 38; y++) {
      for (let x = 12; x <= 36; x++) {
        const idx = (y * 48 + x) * 4;
        const r = rawRgb[idx];
        const g = rawRgb[idx + 1];
        const b = rawRgb[idx + 2];
        const sum = r + g + b || 1;
        rSum += r / sum;
        gSum += g / sum;
        bSum += b / sum;
        count++;
      }
    }
    const chroma: [number, number, number] = [
      rSum / (count || 1),
      gSum / (count || 1),
      bSum / (count || 1),
    ];

    return { lbpVector, regProfile, chroma };
  };

  const calculateBiometricSimilarity = (
    live: BiometricDescriptor,
    reg: BiometricDescriptor
  ): number => {
    // a. LBP Cosine Similarity (tekstur lekukan & fitur wajah mikro)
    let lbpDot = 0;
    for (let i = 0; i < 128; i++) {
      lbpDot += live.lbpVector[i] * reg.lbpVector[i];
    }
    const sLbp = Math.max(0, Math.min(1, lbpDot));

    // b. Regional Profile Cosine Similarity (proporsi relatif 16 area wajah)
    let profDot = 0;
    for (let i = 0; i < 16; i++) {
      profDot += live.regProfile[i] * reg.regProfile[i];
    }
    const sProf = Math.max(0, Math.min(1, profDot));

    // c. Chroma Similarity (komposisi rona warna kulit)
    const diffChroma =
      Math.abs(live.chroma[0] - reg.chroma[0]) +
      Math.abs(live.chroma[1] - reg.chroma[1]) +
      Math.abs(live.chroma[2] - reg.chroma[2]);
    const sChroma = Math.max(0, 1 - diffChroma * 1.5);

    // Nilai akhir diskriminatif
    return sLbp * 0.55 + sProf * 0.35 + sChroma * 0.10;
  };

  // ══════════════ REAL-TIME CAMERA SCAN LIFECYCLE ══════════════
  useEffect(() => {
    if (!showFaceModal) {
      stopCamera();
      setIsFaceMismatch(false);
      return;
    }

    let isCancelled = false;
    let timers: NodeJS.Timeout[] = [];
    let matchLoopAnimId: number | null = null;

    const startCamera = async () => {
      setIsCameraLoading(true);
      setCameraError(null);
      setCapturedPhoto(null);
      setLiveMatchScore(0);
      setIsFaceMismatch(false);
      setScanStep("initializing");
      setScanProgress(15);
      setScanStatusText("Mengakses kamera depan Anda...");

      // Ambil profil wajah yang terdaftar dari localStorage
      const storedPhoto =
        typeof window !== "undefined" ? localStorage.getItem("bisa_face_id_photo") : null;
      const storedName =
        (typeof window !== "undefined" && localStorage.getItem("bisa_face_id_user_name")) ||
        "Eki Permadi Nugraha";
      const storedNip =
        (typeof window !== "undefined" && localStorage.getItem("bisa_face_id_user_id")) ||
        "BMG250001";

      setRegisteredPhoto(storedPhoto);
      setRegisteredName(storedName);
      setRegisteredNip(storedNip);

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

      // Pre-komputasi matriks biometrik LBP dari area wajah terdaftar (CROP KOTAK WAJAH, BUKAN RUANGAN)
      const regCanvas = document.createElement("canvas");
      regCanvas.width = 48;
      regCanvas.height = 48;
      const regCtx = regCanvas.getContext("2d", { willReadFrequently: true });
      let regDescriptor: BiometricDescriptor | null = null;

      if (storedPhoto && regCtx) {
        const regImg = new Image();
        regImg.crossOrigin = "anonymous";
        regImg.onload = () => {
          const natW = regImg.naturalWidth || 640;
          const natH = regImg.naturalHeight || 480;
          const cropSize = Math.min(natW, natH) * 0.52;
          const cropX = (natW - cropSize) / 2;
          const cropY = (natH - cropSize) / 2 + natH * 0.02;

          // Crop hanya kotak wajah tengah, buang background ruangan
          regCtx.drawImage(regImg, cropX, cropY, cropSize, cropSize, 0, 0, 48, 48);
          const raw = regCtx.getImageData(0, 0, 48, 48).data;
          const rLuma = new Float32Array(48 * 48);
          for (let i = 0; i < 48 * 48; i++) {
            rLuma[i] = (raw[i * 4] * 299 + raw[i * 4 + 1] * 587 + raw[i * 4 + 2] * 114) / 1000;
          }
          regDescriptor = extractBiometricDescriptor(rLuma, raw);
        };
        regImg.src = storedPhoto;
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

        // Mount video track
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

        // ══════════════════════════════════════════════════════════════════════════
        // REAL-TIME BIOMETRIC DETECTION & COMPARISON ENGINE
        // ══════════════════════════════════════════════════════════════════════════
        setScanStep("scanning");
        setScanProgress(20);
        setScanStatusText("Mencari wajah di depan kamera...");

        const liveCanvas = document.createElement("canvas");
        liveCanvas.width = 48;
        liveCanvas.height = 48;
        const liveCtx = liveCanvas.getContext("2d", { willReadFrequently: true });

        let consecutiveMatches = 0;
        let matchConfidence = 20;

        const processRealtimeMatching = () => {
          if (isCancelled || !videoRef.current) return;
          const video = videoRef.current;

          if (video.readyState >= 2 && video.videoWidth > 0 && liveCtx) {
            const vW = video.videoWidth;
            const vH = video.videoHeight;
            const cropSize = Math.min(vW, vH) * 0.52;
            const cropX = (vW - cropSize) / 2;
            const cropY = (vH - cropSize) / 2 + vH * 0.02;

            // CROP HANYA KOTAK WAJAH TENGAH (MENGHILANGKAN LATAR BELAKANG RUANGAN)
            liveCtx.save();
            liveCtx.translate(48, 0);
            liveCtx.scale(-1, 1);
            liveCtx.drawImage(video, cropX, cropY, cropSize, cropSize, 0, 0, 48, 48);
            liveCtx.restore();

            const liveImgData = liveCtx.getImageData(0, 0, 48, 48).data;

            // 1. Deteksi keberadaan wajah di dalam area crop
            let facePixels = 0;
            let centerLumaSum = 0;
            let centerCount = 0;
            const liveLuma = new Float32Array(48 * 48);

            for (let y = 0; y < 48; y++) {
              for (let x = 0; x < 48; x++) {
                const idx = (y * 48 + x) * 4;
                const r = liveImgData[idx];
                const g = liveImgData[idx + 1];
                const b = liveImgData[idx + 2];
                const lum = (r * 299 + g * 587 + b * 114) / 1000;
                const pos = y * 48 + x;
                liveLuma[pos] = lum;

                const isFaceTone =
                  (r > 20 && g > 15 && b > 10) &&
                  ((r >= b * 0.75 && g >= b * 0.7) || (r > 35 && g > 25));

                if (isFaceTone) {
                  facePixels++;
                }

                if (x >= 10 && x <= 38 && y >= 8 && y <= 40) {
                  centerLumaSum += lum;
                  centerCount++;
                }
              }
            }

            const centerAvgLuma = centerLumaSum / (centerCount || 1);

            let centerVarianceSum = 0;
            for (let y = 10; y <= 38; y++) {
              for (let x = 10; x <= 38; x++) {
                const diff = liveLuma[y * 48 + x] - centerAvgLuma;
                centerVarianceSum += diff * diff;
              }
            }
            const centerStd = Math.sqrt(centerVarianceSum / ((29 * 29) || 1));

            // Wajah terdeteksi jika ada piksel rona wajah dan kontur variansi mata/hidung/mulut
            const hasFaceInView = facePixels >= 45 && centerAvgLuma > 15 && centerAvgLuma < 250 && centerStd > 7;

            if (!hasFaceInView) {
              setIsFaceMismatch(false);
              setScanStatusText("Arahkan wajah Anda ke dalam bingkai...");
              matchConfidence = Math.max(15, matchConfidence - 2.0);
              const displayScore = Math.round(matchConfidence);
              setLiveMatchScore(displayScore);
              setScanProgress(displayScore);
              consecutiveMatches = 0;
            } else if (!regDescriptor) {
              setScanStatusText("Memuat data biometrik terdaftar...");
            } else {
              // 2. Ekstraksi Fitur Biometrik Wajah Live & Bandingkan dengan Foto Wajah Terdaftar
              const liveDescriptor = extractBiometricDescriptor(liveLuma, liveImgData);
              const similarity = calculateBiometricSimilarity(liveDescriptor, regDescriptor);

              // ══════════════════════════════════════════════════════════════════════════
              // EVALUASI KESESUAIAN BIOMETRIK: THRESHOLD KETAT 68%
              // ══════════════════════════════════════════════════════════════════════════
              if (similarity < 0.68) {
                // ─── WAJAH BERBEDA / TEMAN / BUKAN PEMILIK AKUN YANG TERDAFTAR ───
                setIsFaceMismatch(true);
                consecutiveMatches = 0;
                matchConfidence = Math.max(12, matchConfidence - 2.5);
                const displayScore = Math.min(42, Math.max(15, Math.round(similarity * 100)));

                setLiveMatchScore(displayScore);
                setScanProgress(displayScore);
                setScanStatusText(`Wajah Tidak Cocok (${displayScore}%) — Bukan ${storedName}`);
                // DIJAMIN TIDAK BISA LOGIN KARENA consecutiveMatches TIDAK NAIK
              } else {
                // ─── WAJAH COCOK (PEMILIK ASLI) ───
                setIsFaceMismatch(false);

                // Kecepatan pemindaian diatur teratur (~2.5 detik agar elegan dan realistis)
                matchConfidence = Math.min(100, matchConfidence + 0.90);
                const displayScore = Math.min(99, Math.round(matchConfidence));

                setLiveMatchScore(displayScore);
                setScanProgress(displayScore);

                if (displayScore < 50) {
                  setScanStatusText(`Memindai struktur biometrik: ${displayScore}%...`);
                } else if (displayScore < 80) {
                  setScanStatusText(`Memverifikasi kontur wajah ${storedName}: ${displayScore}%...`);
                } else {
                  setScanStatusText(`Mencocokkan identitas: ${displayScore}% (Sesuai)...`);
                }

                consecutiveMatches++;

                // ══════════════ WAJAH COCOK & TERVERIFIKASI SETELAH ~2.5 DETIK ══════════════
                if (consecutiveMatches >= 25 && matchConfidence >= 98) {
                  if (matchLoopAnimId) cancelAnimationFrame(matchLoopAnimId);

                  // Capture snapshot dari live video
                  if (videoRef.current) {
                    try {
                      const snapCanvas = document.createElement("canvas");
                      snapCanvas.width = video.videoWidth || 640;
                      snapCanvas.height = video.videoHeight || 480;
                      const sCtx = snapCanvas.getContext("2d");
                      if (sCtx) {
                        sCtx.translate(snapCanvas.width, 0);
                        sCtx.scale(-1, 1);
                        sCtx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);
                        setCapturedPhoto(snapCanvas.toDataURL("image/jpeg", 0.92));
                      }
                    } catch (e) {
                      console.warn(e);
                    }
                  }

                  stopCamera();
                  setScanStep("success");
                  setScanProgress(100);
                  setLiveMatchScore(100);
                  setScanStatusText(`Wajah Terverifikasi: ${storedName}`);
                  playFaceIdChime();

                  // Otomatis langsung masuk ke dashboard dalam 1.2 detik tanpa perlu tombol
                  setTimeout(() => {
                    setShowFaceModal(false);
                    markUserLoggedIn();
                    toast.success("Login Face ID Berhasil!", {
                      description: `Selamat datang kembali, ${storedName}!`,
                    });
                    window.location.href = "/";
                  }, 1200);

                  return;
                }
              }
            }
          }

          matchLoopAnimId = requestAnimationFrame(processRealtimeMatching);
        };

        // Jalankan loop analisis frame
        matchLoopAnimId = requestAnimationFrame(processRealtimeMatching);
      } else {
        setIsCameraLoading(false);
        setHasCamera(false);
        setCameraError(
          lastErr?.name === "NotAllowedError" || lastErr?.name === "PermissionDeniedError"
            ? "Izin akses kamera belum diaktifkan. Silakan izinkan akses kamera di browser Anda."
            : "Kamera tidak terdeteksi pada perangkat ini."
        );
      }
    };

    startCamera();

    return () => {
      isCancelled = true;
      if (matchLoopAnimId) cancelAnimationFrame(matchLoopAnimId);
      timers.forEach((t: any) => {
        if (typeof t === "function") t();
        else if (t?.close) t.close();
        else clearInterval(t);
      });
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

  const handleStartFaceId = async () => {
    const isRegistered =
      typeof window !== "undefined" &&
      localStorage.getItem("bisa_face_id_registered") === "true";

    if (!isRegistered) {
      const Swal = (await import("sweetalert2")).default;
      Swal.fire({
        title: "Belum Registrasi Face ID",
        html: `
          <div class="text-center text-xs text-slate-600 space-y-3 mt-1">
            <div class="w-16 h-16 rounded-2xl bg-blue-50 text-[#1a7dc4] mx-auto flex items-center justify-center border border-blue-100 shadow-xs">
              <svg viewBox="0 0 24 24" width="34" height="34" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 7V5a2 2 0 0 1 2-2h2"/>
                <path d="M17 3h2a2 2 0 0 1 2 2v2"/>
                <path d="M21 17v2a2 2 0 0 1-2 2h-2"/>
                <path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
                <circle cx="12" cy="12" r="3"/>
                <path d="m16 16-.5-.5"/>
                <path d="m8 8 .5.5"/>
              </svg>
            </div>
            
            <p class="text-[13px] font-semibold text-slate-800 leading-snug px-2">
              Anda harus <span class="text-[#1a7dc4] font-bold">login terlebih dahulu</span>, baru kemudian melakukan <span class="text-[#1a7dc4] font-bold">registrasi Face ID di menu Setting</span>.
            </p>

            <div class="bg-slate-50 border border-slate-200/90 rounded-2xl p-3.5 text-left space-y-2 text-[11.5px] text-slate-600">
              <div class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-[#1a7dc4] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-2xs">1</span>
                <span>Masuk dengan <b>NIP & Kata Sandi</b> yang dibuatkan Admin.</span>
              </div>
              <div class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-[#1a7dc4] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-2xs">2</span>
                <span>Di Beranda, buka menu <b>Setting</b> (ikon gear ⚙️ di pojok kanan atas).</span>
              </div>
              <div class="flex items-start gap-2.5">
                <span class="w-5 h-5 rounded-full bg-[#1a7dc4] text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-2xs">3</span>
                <span>Pilih tab <b>Face ID</b> lalu lakukan pemindaian wajah Anda.</span>
              </div>
            </div>

            <p class="text-[11px] text-slate-400">
              Setelah registrasi di Setting selesai, Anda bisa login langsung menggunakan Face ID.
            </p>
          </div>
        `,
        showCloseButton: true,
        confirmButtonColor: "#1a7dc4",
        confirmButtonText: "Masuk dengan NIP & Sandi",
        customClass: {
          popup: "!w-[92vw] sm:!w-[420px] rounded-[28px] p-6 shadow-2xl",
          confirmButton: "w-full rounded-xl font-bold py-3 px-5 text-xs shadow-md shadow-[#1a7dc4]/20",
        },
      }).then(() => {
        const input = document.querySelector('input[placeholder="Contoh: 2024001"]') as HTMLInputElement;
        if (input) input.focus();
      });
      return;
    }

    setShowFaceModal(true);
  };

  const handleStartSimulatedScan = () => {
    setIsCameraLoading(false);
    setCameraError(null);
    setHasCamera(true);
    setScanStep("scanning");
    setScanProgress(45);
    setScanStatusText("Memindai biometrik kontur wajah...");

    const registeredName =
      (typeof window !== "undefined" && localStorage.getItem("bisa_face_id_user_name")) ||
      "Eki Permadi Nugraha";

    setTimeout(() => {
      setScanStep("analyzing");
      setScanProgress(80);
      setScanStatusText("Mencocokkan database wajah karyawan...");
    }, 1200);

    setTimeout(() => {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} WIB`;
      setVerificationTime(timeStr);
      setScanStep("success");
      setScanProgress(100);
      setScanStatusText(`Wajah Terverifikasi: ${registeredName}`);
      playFaceIdChime();

      let count = 2;
      setRedirectCountdown(count);
      const interval = setInterval(() => {
        count -= 1;
        setRedirectCountdown(count);
        if (count <= 0) {
          clearInterval(interval);
          setShowFaceModal(false);
          markUserLoggedIn();
          toast.success("Login Face ID Berhasil!", {
            description: `Selamat datang kembali, ${registeredName}!`,
          });
          window.location.href = "/";
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
    const registeredName =
      (typeof window !== "undefined" && localStorage.getItem("bisa_face_id_user_name")) ||
      "Eki Permadi Nugraha";
    toast.success("Login Face ID Berhasil!", {
      description: `Selamat datang kembali, ${registeredName}!`,
    });
    window.location.href = "/";
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
    await new Promise((r) => setTimeout(r, 600));
    setIsLoading(false);

    markUserLoggedIn();
    toast.success("Login Berhasil!", {
      description: "Selamat datang kembali, Setiawan!",
    });

    window.location.href = "/";
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
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center justify-center text-slate-400 pointer-events-none">
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
                    className={`w-full bg-[#f8fcff] border rounded-xl pl-10 pr-3.5 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all shadow-2xs leading-normal ${
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
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center justify-center text-slate-400 pointer-events-none">
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
                    className={`w-full bg-[#f8fcff] border rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all shadow-2xs leading-normal ${
                      errors.password
                        ? "border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100"
                        : "border-[#c8dcea] focus:border-[#1a7dc4] focus:bg-white focus:ring-2 focus:ring-[#1a7dc4]/15"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
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

      {/* ══════════════ MODAL FACE ID UNLOCK (APPLE SQUIRCLE STYLE) ══════════════ */}
      {showFaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
          <div
            className="fixed inset-0 cursor-pointer"
            onClick={scanStep === "success" ? handleProceedDashboardNow : handleCloseFaceModal}
          />
          <div className="relative w-full max-w-[340px] bg-[#09111b]/95 border border-white/10 rounded-[34px] p-6 text-white text-center shadow-[0_25px_70px_rgba(0,0,0,0.85)] z-10 animate-scale-in overflow-hidden">
            {/* Ambient Glow */}
            <div className="absolute -top-16 -left-16 w-36 h-36 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            {scanStep !== "success" && (
              <button
                type="button"
                onClick={handleCloseFaceModal}
                className="absolute top-4 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                aria-label="Tutup"
              >
                <X size={15} />
              </button>
            )}

            {/* Header Sederhana dengan Target Biometrik Terdaftar */}
            <div className="flex flex-col items-center mt-0.5 mb-1">
              {/* Profile Chip dari Hasil Registrasi */}
              {registeredPhoto ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 mb-2.5 max-w-[270px]">
                  <img
                    src={registeredPhoto}
                    alt={registeredName}
                    className="w-6 h-6 rounded-full object-cover ring-1 ring-sky-400/60 shadow-xs"
                  />
                  <div className="text-left overflow-hidden">
                    <p className="text-[9.5px] uppercase tracking-wider text-slate-400 font-medium leading-none">
                      Wajah Terdaftar
                    </p>
                    <p className="text-[11.5px] font-semibold text-white leading-tight truncate">
                      {registeredName}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 text-sky-400 flex items-center justify-center mb-2 shadow-xs">
                  <ScanFace size={22} strokeWidth={2.2} />
                </div>
              )}

              <h3 className="text-lg font-bold text-white tracking-wide">
                {scanStep === "success" ? "Wajah Terverifikasi" : "Face ID"}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {scanStep === "success"
                  ? "Identitas biometrik cocok dengan hasil registrasi"
                  : "Arahkan wajah Anda tepat ke dalam bingkai"}
              </p>
            </div>

            {/* ══════════════ APPLE SQUIRCLE DENGAN 4 CORNER BRACKETS ══════════════ */}
            <div className="relative w-48 h-48 mx-auto my-3 flex items-center justify-center select-none">
              {/* 4 Corner Biometric Brackets */}
              <svg
                viewBox="0 0 210 210"
                className="absolute inset-0 w-full h-full pointer-events-none transition-all duration-300"
              >
                {/* Top-Left Bracket */}
                <path
                  d="M 12 38 L 12 24 A 12 12 0 0 1 24 12 L 38 12"
                  fill="none"
                  stroke={
                    scanStep === "success"
                      ? "#34c759"
                      : isFaceMismatch
                      ? "#f43f5e"
                      : liveMatchScore >= 68
                      ? "#34c759"
                      : "#38bdf8"
                  }
                  strokeWidth={scanStep === "success" ? "3.5" : "3"}
                  strokeLinecap="round"
                  className="transition-colors duration-200"
                />
                {/* Top-Right Bracket */}
                <path
                  d="M 172 12 L 186 12 A 12 12 0 0 1 198 24 L 198 38"
                  fill="none"
                  stroke={
                    scanStep === "success"
                      ? "#34c759"
                      : isFaceMismatch
                      ? "#f43f5e"
                      : liveMatchScore >= 68
                      ? "#34c759"
                      : "#38bdf8"
                  }
                  strokeWidth={scanStep === "success" ? "3.5" : "3"}
                  strokeLinecap="round"
                  className="transition-colors duration-200"
                />
                {/* Bottom-Left Bracket */}
                <path
                  d="M 12 172 L 12 186 A 12 12 0 0 0 24 198 L 38 198"
                  fill="none"
                  stroke={
                    scanStep === "success"
                      ? "#34c759"
                      : isFaceMismatch
                      ? "#f43f5e"
                      : liveMatchScore >= 68
                      ? "#34c759"
                      : "#38bdf8"
                  }
                  strokeWidth={scanStep === "success" ? "3.5" : "3"}
                  strokeLinecap="round"
                  className="transition-colors duration-200"
                />
                {/* Bottom-Right Bracket */}
                <path
                  d="M 172 198 L 186 198 A 12 12 0 0 0 198 186 L 198 172"
                  fill="none"
                  stroke={
                    scanStep === "success"
                      ? "#34c759"
                      : isFaceMismatch
                      ? "#f43f5e"
                      : liveMatchScore >= 68
                      ? "#34c759"
                      : "#38bdf8"
                  }
                  strokeWidth={scanStep === "success" ? "3.5" : "3"}
                  strokeLinecap="round"
                  className="transition-colors duration-200"
                />
              </svg>

              {/* Viewport Squircle Container */}
              <div
                className={`relative w-40 h-40 rounded-[28px] overflow-hidden bg-black/90 border transition-all duration-300 flex items-center justify-center ${
                  scanStep === "success"
                    ? "border-[#34c759]/50 shadow-[0_0_35px_rgba(52,199,89,0.3)]"
                    : isFaceMismatch
                    ? "border-rose-500/60 shadow-[0_0_25px_rgba(244,63,94,0.35)]"
                    : liveMatchScore >= 68
                    ? "border-[#34c759]/40 shadow-[0_0_25px_rgba(52,199,89,0.25)]"
                    : "border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.8)]"
                }`}
              >
                {/* Live Camera Video Feed */}
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover scale-x-[-1] transition-all duration-300 ${
                    !hasCamera ? "opacity-0" : scanStep === "success" ? "opacity-35 blur-xs scale-105" : "opacity-100"
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
                        <span className="text-xs text-slate-400">Menghubungkan sensor...</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        <AlertCircle size={26} className="text-amber-400 mb-0.5" />
                        <p className="text-[11px] text-slate-300 px-1 leading-tight">
                          {cameraError || "Kamera belum aktif"}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Subtle Laser Scanning Beam saat Scanning */}
                {scanStep !== "success" && hasCamera && (
                  <div
                    className={`absolute inset-x-0 top-0 h-[2px] transition-colors duration-200 pointer-events-none animate-scan ${
                      isFaceMismatch
                        ? "bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_12px_#f43f5e]"
                        : liveMatchScore >= 68
                        ? "bg-gradient-to-r from-transparent via-[#34c759] to-transparent shadow-[0_0_12px_#34c759]"
                        : "bg-gradient-to-r from-transparent via-[#38bdf8] to-transparent shadow-[0_0_12px_#38bdf8]"
                    }`}
                  />
                )}

                {/* Success Checkmark in Center */}
                {scanStep === "success" && (
                  <div className="absolute inset-0 flex items-center justify-center animate-scale-in">
                    <div className="w-16 h-16 rounded-full bg-[#34c759] flex items-center justify-center text-white shadow-lg shadow-[#34c759]/40">
                      <Check size={36} strokeWidth={3.8} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ──────── BOTTOM REAL-TIME MATCH BAR & ACTIONS ──────── */}
            {scanStep !== "success" ? (
              <div className="space-y-3 mt-1">
                {/* Real-time Match Indicator Bar */}
                <div className="w-48 mx-auto px-1">
                  <div className="flex items-center justify-between text-[11px] font-medium mb-1.5">
                    <span className="text-slate-400 flex items-center gap-1.5 text-[10.5px]">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isFaceMismatch
                            ? "bg-rose-500 animate-pulse"
                            : liveMatchScore >= 68
                            ? "bg-[#34c759] animate-ping"
                            : "bg-sky-400 animate-pulse"
                        }`}
                      />
                      <span>Kesesuaian:</span>
                    </span>
                    <span
                      className={`font-mono text-xs font-bold transition-colors ${
                        isFaceMismatch
                          ? "text-rose-400"
                          : liveMatchScore >= 68
                          ? "text-[#34c759]"
                          : "text-sky-400"
                      }`}
                    >
                      {liveMatchScore}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-150 rounded-full ${
                        isFaceMismatch
                          ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                          : liveMatchScore >= 68
                          ? "bg-[#34c759] shadow-[0_0_8px_#34c759]"
                          : "bg-sky-400 shadow-[0_0_8px_#38bdf8]"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(10, liveMatchScore))}%` }}
                    />
                  </div>
                </div>

                {/* Status text */}
                <p
                  className={`text-xs font-medium h-4 flex items-center justify-center gap-1.5 px-2 truncate transition-colors ${
                    isFaceMismatch ? "text-rose-400 font-semibold" : "text-slate-400"
                  }`}
                >
                  <span>{scanStatusText}</span>
                </p>

                <button
                  type="button"
                  onClick={handleCloseFaceModal}
                  className="w-full py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Batal & Masuk Manual
                </button>
              </div>
            ) : (
              <div className="space-y-2 mt-1 animate-fade-in">
                {/* User Info */}
                <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full bg-[#34c759]/15 border border-[#34c759]/30 text-[#34c759] text-[11px] font-semibold mb-1">
                  <Check size={12} strokeWidth={3} />
                  <span>Biometrik 100% Cocok</span>
                </div>

                <h4 className="text-base font-bold text-white leading-tight">
                  {registeredName}
                </h4>
                <p className="text-xs text-slate-400 font-medium">
                  NIP: {registeredNip} • Terverifikasi
                </p>

                {/* Otomatis masuk tanpa tombol */}
                <div className="pt-2.5 pb-1 flex items-center justify-center gap-2 text-xs text-[#34c759] font-medium animate-pulse">
                  <div className="w-3.5 h-3.5 border-2 border-[#34c759] border-t-transparent rounded-full animate-spin" />
                  <span>Membuka aplikasi...</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
