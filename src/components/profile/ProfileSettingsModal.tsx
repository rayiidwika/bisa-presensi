"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  User,
  Lock,
  Camera,
  Trash2,
  Check,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import {
  getUserProfile,
  saveUserProfile,
  changeUserPassword,
  UserProfile,
} from "@/lib/userProfile";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = "profile" | "password";

export default function ProfileSettingsModal({
  isOpen,
  onClose,
}: ProfileSettingsModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("profile");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form State
  const [profileForm, setProfileForm] = useState<UserProfile>(getUserProfile());
  const [avatarPreview, setAvatarPreview] = useState<string>("");

  // Password Form State
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync profile when opened
  useEffect(() => {
    if (isOpen) {
      const current = getUserProfile();
      setProfileForm(current);
      setAvatarPreview(current.avatarUrl || "");
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
    }
  }, [isOpen]);

  // Handle Logout
  const handleLogout = () => {
    Swal.fire({
      title: "Konfirmasi Keluar",
      text: "Apakah Anda yakin ingin keluar dari akun ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      cancelButtonColor: "#94a3b8",
      confirmButtonText: "Ya, Keluar",
      cancelButtonText: "Batal",
      reverseButtons: true,
      customClass: {
        popup: "rounded-[24px]",
        confirmButton: "rounded-xl font-bold text-sm px-4 py-2",
        cancelButton: "rounded-xl font-bold text-sm px-4 py-2",
      },
    }).then((result) => {
      if (result.isConfirmed) {
        try {
          localStorage.removeItem("bisa_logged_in");
          localStorage.removeItem("bisa_user_role");
          document.cookie = "bisa_logged_in=; path=/; max-age=0; SameSite=Lax";
        } catch (e) {
          console.warn(e);
        }
        onClose();
        router.push("/login");
      }
    });
  };

  if (!isOpen) return null;

  // Handle Photo Upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      toast.error("Ukuran foto maksimal 3MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const base64 = evt.target?.result as string;
      if (base64) {
        setAvatarPreview(base64);
        setProfileForm((prev) => ({ ...prev, avatarUrl: base64 }));
        toast.success("Foto berhasil dipilih");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setAvatarPreview("");
    setProfileForm((prev) => ({ ...prev, avatarUrl: "" }));
    toast.info("Foto profil dihapus");
  };

  // Handle Save Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      toast.error("Nama lengkap wajib diisi!");
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      saveUserProfile({
        ...profileForm,
        avatarUrl: avatarPreview,
      });
      setIsSaving(false);
      toast.success("Profil Berhasil Diperbarui!", {
        description: "Data profil Anda telah disimpan.",
      });
      onClose();
    }, 250);
  };

  // Handle Save Password
  const handleSavePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPass) {
      toast.error("Masukkan kata sandi saat ini!");
      return;
    }
    if (!newPass || newPass.length < 6) {
      toast.error("Kata sandi baru minimal 6 karakter!");
      return;
    }
    if (newPass !== confirmPass) {
      toast.error("Konfirmasi kata sandi baru tidak cocok!");
      return;
    }

    setIsSaving(true);
    setTimeout(() => {
      const res = changeUserPassword(currentPass, newPass);
      setIsSaving(false);
      if (res.success) {
        toast.success("Kata Sandi Berhasil Diperbarui!", {
          description: "Kata sandi akun Anda telah diperbarui.",
        });
        setCurrentPass("");
        setNewPass("");
        setConfirmPass("");
        onClose();
      } else {
        toast.error(res.message);
      }
    }, 250);
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in select-none"
    >
      <div className="bg-white w-full max-w-[390px] rounded-[28px] sm:rounded-[32px] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90dvh] animate-scale-up">
        {/* ══════════════ HEADER WITH 2 TABS ONLY ══════════════ */}
        <div className="px-5 pt-4 pb-3 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-slate-800 leading-tight">
              Pengaturan
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              aria-label="Tutup"
            >
              <X size={15} />
            </button>
          </div>

          {/* 2 Tabs: Ganti Profil & Ganti Sandi */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-slate-100 border border-slate-200/60">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "profile"
                  ? "bg-white text-[#156bb8] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <User size={14} />
              <span>Ganti Profil</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("password")}
              className={`py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === "password"
                  ? "bg-white text-[#156bb8] shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <KeyRound size={14} />
              <span>Ganti Sandi</span>
            </button>
          </div>
        </div>

        {/* ══════════════ MODAL BODY ══════════════ */}
        <div className="px-5 py-4 overflow-y-auto space-y-4 flex-1 overscroll-contain">
          {/* ────────────────────────────────────────────────────────
              TAB 1: GANTI PROFIL (FOTO & NAMA SAJA)
          ──────────────────────────────────────────────────────── */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-4 animate-fade-in">
              {/* Photo Avatar Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-b from-blue-50/70 to-slate-50 border border-blue-100 flex flex-col items-center justify-center text-center gap-3">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-white border-2 border-[#156bb8] shadow-md flex items-center justify-center overflow-hidden">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Foto Profil"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <svg viewBox="0 0 64 64" fill="none" className="w-full h-full bg-slate-200">
                        <circle cx="32" cy="24" r="11" fill="#475569" />
                        <path
                          d="M14 56C14 45 22 41 32 41C42 41 50 45 50 56"
                          fill="#475569"
                        />
                      </svg>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#156bb8] text-white flex items-center justify-center shadow-md hover:scale-110 active:scale-90 transition-transform cursor-pointer"
                    title="Ganti Foto"
                  >
                    <Camera size={13} strokeWidth={2.5} />
                  </button>
                </div>

                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-bold text-[#156bb8] bg-white hover:bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl cursor-pointer transition-colors shadow-2xs"
                    >
                      Pilih Foto Profil
                    </button>
                    {avatarPreview && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors px-2 py-1.5"
                      >
                        <Trash2 size={12} />
                        Hapus Foto
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Input Nama Lengkap */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Nama Lengkap <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <User size={15} />
                  </div>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Masukkan nama lengkap Anda"
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#156bb8] focus:bg-white transition-all shadow-2xs"
                    required
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#1a7dc4] to-[#156bb8] hover:brightness-105 text-white font-bold text-xs shadow-md shadow-[#156bb8]/30 transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1.5"
                >
                  <Check size={14} strokeWidth={2.5} />
                  <span>{isSaving ? "Menyimpan..." : "Simpan Profil"}</span>
                </button>
              </div>
            </form>
          )}

          {/* ────────────────────────────────────────────────────────
              TAB 2: GANTI KATA SANDI
          ──────────────────────────────────────────────────────── */}
          {activeTab === "password" && (
            <form onSubmit={handleSavePassword} className="space-y-3.5 animate-fade-in">
              {/* Kata Sandi Saat Ini */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Kata Sandi Saat Ini <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Lock size={15} />
                  </div>
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder="Masukkan kata sandi saat ini"
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#156bb8] focus:bg-white transition-all shadow-2xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Kata Sandi Baru */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <KeyRound size={15} />
                  </div>
                  <input
                    type={showNewPass ? "text" : "password"}
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#156bb8] focus:bg-white transition-all shadow-2xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Konfirmasi Kata Sandi Baru */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 block">
                  Konfirmasi Kata Sandi Baru <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                    <Check size={15} />
                  </div>
                  <input
                    type={showConfirmPass ? "text" : "password"}
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#156bb8] focus:bg-white transition-all shadow-2xs"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#1a7dc4] to-[#156bb8] hover:brightness-105 text-white font-bold text-xs shadow-md shadow-[#156bb8]/30 transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1.5"
                >
                  <Check size={14} strokeWidth={2.5} />
                  <span>{isSaving ? "Menyimpan..." : "Simpan Sandi"}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ══════════════ MODAL FOOTER (LOGOUT) ══════════════ */}
        <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-50 hover:bg-rose-100/90 active:bg-rose-200/80 text-rose-600 font-bold text-xs border border-rose-200/80 transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2 shadow-2xs"
          >
            <LogOut size={14} strokeWidth={2.2} />
            <span>Keluar dari Akun (Logout)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
