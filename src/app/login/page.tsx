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
    let matchLoopAnimId: number | null = null;

    const startCamera = async () => {
      setIsCameraLoading(true);
      setCameraError(null);
      setCapturedPhoto(null);
      setLiveMatchScore(0);
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

      // Pre-komputasi matriks biometrik dari foto hasil registrasi (48x48)
      const regCanvas = document.createElement("canvas");
      regCanvas.width = 48;
      regCanvas.height = 48;
      const regCtx = regCanvas.getContext("2d", { willReadFrequently: true });

      let regLuma: Float32Array | null = null;
      let regEdges: Float32Array | null = null;
      let regMean = 0;
      let regStd = 1;
      let regRegions = new Float32Array(9);
      let regTemplateReady = false;

      if (storedPhoto && regCtx) {
        const regImg = new Image();
        regImg.crossOrigin = "anonymous";
        regImg.onload = () => {
          regCtx.drawImage(regImg, 0, 0, 48, 48);
          const raw = regCtx.getImageData(0, 0, 48, 48).data;
          regLuma = new Float32Array(48 * 48);
          regEdges = new Float32Array(48 * 48);

          let sum = 0;
          for (let i = 0; i < 48 * 48; i++) {
            const r = raw[i * 4];
            const g = raw[i * 4 + 1];
            const b = raw[i * 4 + 2];
            const lum = (r * 299 + g * 587 + b * 114) / 1000;
            regLuma[i] = lum;
            sum += lum;
          }
          regMean = sum / (48 * 48);

          let varSum = 0;
          for (let i = 0; i < 48 * 48; i++) {
            const diff = regLuma[i] - regMean;
            varSum += diff * diff;
          }
          regStd = Math.sqrt(varSum / (48 * 48)) || 1;

          // Sobel edge filter untuk kontur mata, alis, hidung, bibir
          for (let y = 1; y < 47; y++) {
            for (let x = 1; x < 47; x++) {
              const gx =
                -regLuma[(y - 1) * 48 + (x - 1)] +
                regLuma[(y - 1) * 48 + (x + 1)] -
                2 * regLuma[y * 48 + (x - 1)] +
                2 * regLuma[y * 48 + (x + 1)] -
                regLuma[(y + 1) * 48 + (x - 1)] +
                regLuma[(y + 1) * 48 + (x + 1)];
              const gy =
                -regLuma[(y - 1) * 48 + (x - 1)] -
                2 * regLuma[(y - 1) * 48 + x] -
                regLuma[(y - 1) * 48 + (x + 1)] +
                regLuma[(y + 1) * 48 + (x - 1)] +
                2 * regLuma[(y + 1) * 48 + x] +
                regLuma[(y + 1) * 48 + (x + 1)];
              regEdges[y * 48 + x] = Math.sqrt(gx * gx + gy * gy);
            }
          }

          // 3x3 Regional Block averages
          for (let ry = 0; ry < 3; ry++) {
            for (let rx = 0; rx < 3; rx++) {
              let rSum = 0;
              for (let y = ry * 16; y < (ry + 1) * 16; y++) {
                for (let x = rx * 16; x < (rx + 1) * 16; x++) {
                  rSum += regLuma[y * 48 + x];
                }
              }
              regRegions[ry * 3 + rx] = rSum / 256;
            }
          }

          regTemplateReady = true;
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
        setScanProgress(25);
        setScanStatusText("Mencari wajah di depan kamera...");

        const liveCanvas = document.createElement("canvas");
        liveCanvas.width = 48;
        liveCanvas.height = 48;
        const liveCtx = liveCanvas.getContext("2d", { willReadFrequently: true });

        let consecutiveMatches = 0;
        let smoothedScore = 20;

        const processRealtimeMatching = () => {
          if (isCancelled || !videoRef.current) return;
          const video = videoRef.current;

          if (video.readyState >= 2 && video.videoWidth > 0 && liveCtx) {
            // Draw mirrored live frame onto 48x48 canvas
            liveCtx.save();
            liveCtx.translate(48, 0);
            liveCtx.scale(-1, 1);
            liveCtx.drawImage(video, 0, 0, 48, 48);
            liveCtx.restore();

            const liveImgData = liveCtx.getImageData(0, 0, 48, 48).data;

            // 1. Deteksi keberadaan wajah fisik di tengah bingkai (Skin tone & Luminance)
            let skinPixels = 0;
            let centerLumaSum = 0;
            let centerCount = 0;
            const liveLuma = new Float32Array(48 * 48);
            let liveSum = 0;

            for (let y = 0; y < 48; y++) {
              for (let x = 0; x < 48; x++) {
                const idx = (y * 48 + x) * 4;
                const r = liveImgData[idx];
                const g = liveImgData[idx + 1];
                const b = liveImgData[idx + 2];
                const lum = (r * 299 + g * 587 + b * 114) / 1000;
                const pos = y * 48 + x;
                liveLuma[pos] = lum;
                liveSum += lum;

                // Skin tone heuristic in RGB
                if (r > 42 && g > 24 && b > 18 && r > g && r - g > 8 && r > b) {
                  skinPixels++;
                }

                // Elliptical center box
                if (x >= 14 && x <= 34 && y >= 10 && y <= 38) {
                  centerLumaSum += lum;
                  centerCount++;
                }
              }
            }

            const centerAvgLuma = centerLumaSum / (centerCount || 1);
            const hasFaceInView = skinPixels >= 55 && centerAvgLuma > 25 && centerAvgLuma < 245;

            if (!hasFaceInView) {
              setScanStatusText("Arahkan wajah Anda ke dalam bingkai...");
              smoothedScore = smoothedScore * 0.7 + 15 * 0.3;
              const displayScore = Math.round(smoothedScore);
              setLiveMatchScore(displayScore);
              setScanProgress(Math.max(15, displayScore));
              consecutiveMatches = 0;
            } else if (!regTemplateReady || !regLuma || !regEdges) {
              setScanStatusText("Memuat data biometrik terdaftar...");
              smoothedScore = smoothedScore * 0.7 + 30 * 0.3;
              const displayScore = Math.round(smoothedScore);
              setLiveMatchScore(displayScore);
              setScanProgress(displayScore);
            } else {
              // 2. Real-time comparison terhadap template foto registrasi
              const liveMean = liveSum / (48 * 48);
              let liveVarSum = 0;
              for (let i = 0; i < 48 * 48; i++) {
                const d = liveLuma[i] - liveMean;
                liveVarSum += d * d;
              }
              const liveStd = Math.sqrt(liveVarSum / (48 * 48)) || 1;

              // Hitung live Sobel edges
              const liveEdges = new Float32Array(48 * 48);
              for (let y = 1; y < 47; y++) {
                for (let x = 1; x < 47; x++) {
                  const gx =
                    -liveLuma[(y - 1) * 48 + (x - 1)] +
                    liveLuma[(y - 1) * 48 + (x + 1)] -
                    2 * liveLuma[y * 48 + (x - 1)] +
                    2 * liveLuma[y * 48 + (x + 1)] -
                    liveLuma[(y + 1) * 48 + (x - 1)] +
                    liveLuma[(y + 1) * 48 + (x + 1)];
                  const gy =
                    -liveLuma[(y - 1) * 48 + (x - 1)] -
                    2 * liveLuma[(y - 1) * 48 + x] -
                    liveLuma[(y - 1) * 48 + (x + 1)] +
                    liveLuma[(y + 1) * 48 + (x - 1)] +
                    2 * liveLuma[(y + 1) * 48 + x] +
                    liveLuma[(y + 1) * 48 + (x + 1)];
                  liveEdges[y * 48 + x] = Math.sqrt(gx * gx + gy * gy);
                }
              }

              // a. Zero-mean Normalized Cross-Correlation (ZNCC) dengan toleransi micro-shift ±1px
              let bestCorrelation = -1;
              for (const dy of [-1, 0, 1]) {
                for (const dx of [-1, 0, 1]) {
                  let corr = 0;
                  let count = 0;
                  for (let y = 2; y < 46; y++) {
                    const ly = y + dy;
                    if (ly < 0 || ly >= 48) continue;
                    for (let x = 2; x < 46; x++) {
                      const lx = x + dx;
                      if (lx < 0 || lx >= 48) continue;
                      corr += (liveLuma[ly * 48 + lx] - liveMean) * (regLuma[y * 48 + x] - regMean);
                      count++;
                    }
                  }
                  const rVal = corr / (liveStd * regStd * (count || 1));
                  if (rVal > bestCorrelation) bestCorrelation = rVal;
                }
              }

              // b. Edge/Contour Alignment (Membandingkan garis mata, hidung, bibir)
              let edgeDiffSum = 0;
              let edgeCount = 0;
              for (let i = 0; i < 48 * 48; i++) {
                if (regEdges[i] > 15 || liveEdges[i] > 15) {
                  edgeDiffSum += Math.abs(regEdges[i] - liveEdges[i]);
                  edgeCount++;
                }
              }
              const avgEdgeDiff = edgeDiffSum / (edgeCount || 1);
              const edgeSim = Math.max(0, 1 - avgEdgeDiff / 120);

              // c. 3x3 Regional Block Similarity
              let regionDiffSum = 0;
              for (let ry = 0; ry < 3; ry++) {
                for (let rx = 0; rx < 3; rx++) {
                  let rSum = 0;
                  for (let y = ry * 16; y < (ry + 1) * 16; y++) {
                    for (let x = rx * 16; x < (rx + 1) * 16; x++) {
                      rSum += liveLuma[y * 48 + x];
                    }
                  }
                  const liveReg = rSum / 256;
                  regionDiffSum += Math.abs(liveReg - regRegions[ry * 3 + rx]);
                }
              }
              const regionSim = Math.max(0, 1 - (regionDiffSum / 9) / 80);

              // Normalisasi skor akhir
              const normCorr = Math.max(0, (bestCorrelation + 0.25) / 1.25);
              const compositeMatch = normCorr * 0.45 + edgeSim * 0.35 + regionSim * 0.20;
              const instantScore = Math.round(compositeMatch * 100);

              // Smooth score interpolation untuk responsivitas visual yang mulus
              smoothedScore = smoothedScore * 0.45 + instantScore * 0.55;
              const displayScore = Math.min(99, Math.max(25, Math.round(smoothedScore)));
              setLiveMatchScore(displayScore);
              setScanProgress(displayScore);

              if (displayScore >= 68) {
                setScanStatusText(`Mencocokkan Biometrik: ${displayScore}% (Wajah Sesuai)...`);
                consecutiveMatches++;
              } else {
                setScanStatusText(`Menganalisis Biometrik: ${displayScore}%...`);
                consecutiveMatches = Math.max(0, consecutiveMatches - 1);
              }

              // ══════════════ WAJAH COCOK & TERVERIFIKASI ══════════════
              if (consecutiveMatches >= 6) {
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
                      description: `Selamat datang kembali, ${storedName}!`,
                    });
                    window.location.href = "/";
                  }
                }, 1000);
                timers.push(interval as any);
                return;
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
                  stroke={scanStep === "success" || liveMatchScore >= 68 ? "#34c759" : "#38bdf8"}
                  strokeWidth={scanStep === "success" ? "3.5" : "3"}
                  strokeLinecap="round"
                  className="transition-colors duration-200"
                />
                {/* Top-Right Bracket */}
                <path
                  d="M 172 12 L 186 12 A 12 12 0 0 1 198 24 L 198 38"
                  fill="none"
                  stroke={scanStep === "success" || liveMatchScore >= 68 ? "#34c759" : "#38bdf8"}
                  strokeWidth={scanStep === "success" ? "3.5" : "3"}
                  strokeLinecap="round"
                  className="transition-colors duration-200"
                />
                {/* Bottom-Left Bracket */}
                <path
                  d="M 12 172 L 12 186 A 12 12 0 0 0 24 198 L 38 198"
                  fill="none"
                  stroke={scanStep === "success" || liveMatchScore >= 68 ? "#34c759" : "#38bdf8"}
                  strokeWidth={scanStep === "success" ? "3.5" : "3"}
                  strokeLinecap="round"
                  className="transition-colors duration-200"
                />
                {/* Bottom-Right Bracket */}
                <path
                  d="M 172 198 L 186 198 A 12 12 0 0 0 198 186 L 198 172"
                  fill="none"
                  stroke={scanStep === "success" || liveMatchScore >= 68 ? "#34c759" : "#38bdf8"}
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
                      liveMatchScore >= 68
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
                          liveMatchScore >= 68
                            ? "bg-[#34c759] animate-ping"
                            : "bg-sky-400 animate-pulse"
                        }`}
                      />
                      <span>Kesesuaian:</span>
                    </span>
                    <span
                      className={`font-mono text-xs font-bold transition-colors ${
                        liveMatchScore >= 68 ? "text-[#34c759]" : "text-sky-400"
                      }`}
                    >
                      {liveMatchScore}%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-150 rounded-full ${
                        liveMatchScore >= 68
                          ? "bg-[#34c759] shadow-[0_0_8px_#34c759]"
                          : "bg-sky-400 shadow-[0_0_8px_#38bdf8]"
                      }`}
                      style={{ width: `${Math.min(100, Math.max(10, liveMatchScore))}%` }}
                    />
                  </div>
                </div>

                {/* Status text */}
                <p className="text-xs text-slate-400 font-medium h-4 flex items-center justify-center gap-1.5 px-2 truncate">
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

                {/* Primary Button Masuk */}
                <button
                  type="button"
                  onClick={handleProceedDashboardNow}
                  className="w-full mt-3 py-3 rounded-full bg-[#34c759] hover:bg-[#30b753] text-white font-semibold text-xs sm:text-sm tracking-wide shadow-lg shadow-[#34c759]/30 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Masuk ke Beranda Sekarang</span>
                  <ArrowRight size={15} strokeWidth={2.5} />
                </button>

                <p className="text-[10.5px] text-slate-400 font-medium pt-1">
                  Mengarahkan otomatis dalam {redirectCountdown} detik...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
