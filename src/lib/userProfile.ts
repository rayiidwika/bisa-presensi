// ── User Profile & Security Management ──────────────────────────────

export interface UserProfile {
  name: string;
  nip: string;
  division: string;
  position: string;
  company: string;
  email: string;
  phone: string;
  avatarUrl?: string; // Optional custom photo base64 / URL
}

const PROFILE_STORAGE_KEY = "bisa_user_profile";
const PASSWORD_STORAGE_KEY = "bisa_user_password";

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: "Setiawan",
  nip: "2024001",
  division: "IT",
  position: "IT Programmer",
  company: "PT BISA MEDIA GRUP",
  email: "setiawan@bisamedia.com",
  phone: "0812-3456-7890",
  avatarUrl: "",
};

/** Ambil profil pengguna saat ini dari localStorage */
export function getUserProfile(): UserProfile {
  if (typeof window === "undefined") return DEFAULT_USER_PROFILE;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(DEFAULT_USER_PROFILE));
      return DEFAULT_USER_PROFILE;
    }
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_USER_PROFILE, ...parsed };
  } catch (err) {
    console.error("Error reading user profile:", err);
    return DEFAULT_USER_PROFILE;
  }
}

/** Simpan pembaruan profil ke localStorage & broadcast event */
export function saveUserProfile(profile: Partial<UserProfile>): UserProfile {
  if (typeof window === "undefined") return DEFAULT_USER_PROFILE;
  try {
    const current = getUserProfile();
    const updated: UserProfile = { ...current, ...profile };
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("bisa_profile_change"));
    return updated;
  } catch (err) {
    console.error("Error saving user profile:", err);
    return DEFAULT_USER_PROFILE;
  }
}

/** Ambil kata sandi tersimpan (default: "123456") */
export function getUserPassword(): string {
  if (typeof window === "undefined") return "123456";
  try {
    const saved = localStorage.getItem(PASSWORD_STORAGE_KEY);
    if (!saved) {
      localStorage.setItem(PASSWORD_STORAGE_KEY, "123456");
      return "123456";
    }
    return saved;
  } catch {
    return "123456";
  }
}

/** Perbarui kata sandi dengan validasi kata sandi lama */
export function changeUserPassword(oldPass: string, newPass: string): { success: boolean; message: string } {
  if (typeof window === "undefined") return { success: false, message: "Akses ditolak" };
  const currentPass = getUserPassword();
  
  if (oldPass !== currentPass) {
    return { success: false, message: "Kata sandi saat ini tidak sesuai." };
  }
  if (!newPass || newPass.length < 6) {
    return { success: false, message: "Kata sandi baru minimal 6 karakter." };
  }

  try {
    localStorage.setItem(PASSWORD_STORAGE_KEY, newPass);
    return { success: true, message: "Kata sandi berhasil diperbarui!" };
  } catch (err) {
    return { success: false, message: "Gagal menyimpan kata sandi baru." };
  }
}

/** Tampilkan Pop-up Pengaturan Utama */
export async function openSettingsModal(onLogout: () => void) {
  const Swal = (await import("sweetalert2")).default;
  const profile = getUserProfile();

  const avatarDisplay = profile.avatarUrl
    ? `<img src="${profile.avatarUrl}" alt="${profile.name}" class="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm shrink-0" />`
    : `<div class="w-12 h-12 rounded-full bg-[#156bb8] text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0 uppercase border-2 border-white">
        ${profile.name.charAt(0) || "U"}
       </div>`;

  await Swal.fire({
    title: "Pengaturan Akun",
    html: `
      <div class="text-left mt-2 space-y-3">
        {/* User Card */}
        <div class="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-100/80 rounded-2xl p-3.5 flex items-center gap-3">
          ${avatarDisplay}
          <div class="min-w-0 flex-1">
            <h4 class="font-bold text-slate-800 text-sm leading-tight truncate">${profile.name}</h4>
            <p class="text-xs text-slate-500 font-medium mt-0.5 truncate">NIP: ${profile.nip} • Divisi ${profile.division}</p>
            <p class="text-[11px] text-slate-400 font-medium truncate">${profile.position || "Staff"}</p>
          </div>
          <div class="shrink-0 flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Aktif
          </div>
        </div>

        {/* Action Buttons */}
        <div class="space-y-2 pt-1">
          <button id="btn-menu-edit-profile" class="w-full flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 active:scale-[0.99] transition-all cursor-pointer group shadow-2xs">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-blue-50 text-[#156bb8] group-hover:bg-[#156bb8] group-hover:text-white flex items-center justify-center transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
              </div>
              <div class="text-left">
                <p class="text-xs font-bold text-slate-800 group-hover:text-[#156bb8] transition-colors">Edit Profil</p>
                <p class="text-[10.5px] text-slate-400">Ubah nama, NIP, divisi, jabatan & foto profil</p>
              </div>
            </div>
            <svg class="w-4 h-4 text-slate-400 group-hover:text-[#156bb8] group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>

          <button id="btn-menu-change-pass" class="w-full flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/40 active:scale-[0.99] transition-all cursor-pointer group shadow-2xs">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-sky-50 text-[#156bb8] group-hover:bg-[#156bb8] group-hover:text-white flex items-center justify-center transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              </div>
              <div class="text-left">
                <p class="text-xs font-bold text-slate-800 group-hover:text-[#156bb8] transition-colors">Ganti Kata Sandi</p>
                <p class="text-[10.5px] text-slate-400">Perbarui kata sandi masuk aplikasi Anda</p>
              </div>
            </div>
            <svg class="w-4 h-4 text-slate-400 group-hover:text-[#156bb8] group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
          </button>
        </div>

        {/* App Info */}
        <div class="bg-slate-50 border border-slate-100 rounded-xl p-2.5 flex justify-between items-center text-xs">
          <span class="text-slate-500 font-medium">Versi Aplikasi</span>
          <span class="font-bold text-slate-700">v2.4.0 (Enterprise)</span>
        </div>
      </div>
    `,
    showCancelButton: true,
    showConfirmButton: true,
    confirmButtonText: "Keluar (Logout)",
    confirmButtonColor: "#ef4444",
    cancelButtonText: "Tutup",
    cancelButtonColor: "#94a3b8",
    reverseButtons: true,
    customClass: {
      popup: "!w-[92vw] sm:!w-[420px] !max-w-[420px] rounded-3xl p-5 shadow-2xl",
      title: "text-base font-bold text-slate-800 pb-2 border-b border-slate-100",
      confirmButton: "rounded-xl font-bold py-2.5 px-4 text-xs shadow-sm",
      cancelButton: "rounded-xl font-medium py-2.5 px-4 text-xs",
    },
    didOpen: () => {
      const btnEdit = document.getElementById("btn-menu-edit-profile");
      if (btnEdit) {
        btnEdit.addEventListener("click", () => {
          Swal.close();
          openEditProfileModal(onLogout);
        });
      }

      const btnPass = document.getElementById("btn-menu-change-pass");
      if (btnPass) {
        btnPass.addEventListener("click", () => {
          Swal.close();
          openChangePasswordModal(onLogout);
        });
      }
    },
  }).then((res) => {
    if (res.isConfirmed) {
      onLogout();
    }
  });
}

/** Tampilkan Pop-up Edit Profil */
export async function openEditProfileModal(onLogout: () => void) {
  const Swal = (await import("sweetalert2")).default;
  const profile = getUserProfile();
  let tempAvatarUrl = profile.avatarUrl || "";

  const renderAvatarPreview = (url: string) => {
    if (url) {
      return `<img src="${url}" class="w-16 h-16 rounded-full object-cover border-2 border-[#156bb8] shadow-sm" />`;
    }
    return `
      <div class="w-16 h-16 rounded-full bg-[#156bb8] text-white flex items-center justify-center font-bold text-xl uppercase border-2 border-white shadow-sm">
        ${profile.name.charAt(0) || "U"}
      </div>
    `;
  };

  const { value: formValues } = await Swal.fire({
    title: "Edit Profil Karyawan",
    html: `
      <div class="text-left mt-2 space-y-3 max-h-[70vh] overflow-y-auto pr-1 no-scrollbar">
        {/* Avatar Upload Area */}
        <div class="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div id="avatar-preview-container" class="shrink-0">
            ${renderAvatarPreview(tempAvatarUrl)}
          </div>
          <div class="flex-1 space-y-1.5">
            <p class="text-xs font-bold text-slate-700 leading-tight">Foto Profil</p>
            <div class="flex items-center gap-2">
              <label for="input-avatar-file" class="bg-[#156bb8] hover:bg-blue-700 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg cursor-pointer transition-colors inline-block">
                Pilih Foto
              </label>
              <input type="file" id="input-avatar-file" accept="image/*" class="hidden" />
              ${
                tempAvatarUrl
                  ? `<button type="button" id="btn-remove-avatar" class="text-[11px] font-semibold text-rose-600 hover:underline cursor-pointer">Hapus Foto</button>`
                  : ""
              }
            </div>
            <p class="text-[10px] text-slate-400">Format JPG, PNG (Maks 2MB)</p>
          </div>
        </div>

        {/* Input: Nama */}
        <div>
          <label class="text-[11px] font-bold text-slate-700 mb-1 block">Nama Lengkap: <span class="text-rose-500">*</span></label>
          <input type="text" id="edit-name" value="${profile.name}" class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#156bb8] font-semibold" placeholder="Masukkan nama lengkap..." />
        </div>

        {/* Input: NIP & Divisi */}
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-[11px] font-bold text-slate-700 mb-1 block">NIP: <span class="text-rose-500">*</span></label>
            <input type="text" id="edit-nip" value="${profile.nip}" class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#156bb8]" placeholder="2024001" />
          </div>
          <div>
            <label class="text-[11px] font-bold text-slate-700 mb-1 block">Divisi: <span class="text-rose-500">*</span></label>
            <select id="edit-division" class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#156bb8] cursor-pointer">
              <option value="IT" ${profile.division === "IT" ? "selected" : ""}>IT</option>
              <option value="HR" ${profile.division === "HR" ? "selected" : ""}>HR</option>
              <option value="Keuangan" ${profile.division === "Keuangan" ? "selected" : ""}>Keuangan</option>
              <option value="Operasional" ${profile.division === "Operasional" ? "selected" : ""}>Operasional</option>
              <option value="Marketing" ${profile.division === "Marketing" ? "selected" : ""}>Marketing</option>
            </select>
          </div>
        </div>

        {/* Input: Jabatan / Staff */}
        <div>
          <label class="text-[11px] font-bold text-slate-700 mb-1 block">Jabatan / Staff: <span class="text-rose-500">*</span></label>
          <input type="text" id="edit-position" value="${profile.position}" class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#156bb8]" placeholder="Contoh: IT Programmer" />
        </div>

        {/* Input: Perusahaan */}
        <div>
          <label class="text-[11px] font-bold text-slate-700 mb-1 block">Nama Perusahaan:</label>
          <input type="text" id="edit-company" value="${profile.company}" class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#156bb8]" placeholder="PT BISA MEDIA GRUP" />
        </div>

        {/* Input: No HP */}
        <div>
          <label class="text-[11px] font-bold text-slate-700 mb-1 block">No. Telepon / WhatsApp:</label>
          <input type="tel" id="edit-phone" value="${profile.phone || ""}" class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#156bb8]" placeholder="0812-xxxx-xxxx" />
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Simpan Profil",
    cancelButtonText: "Batal",
    confirmButtonColor: "#156bb8",
    cancelButtonColor: "#94a3b8",
    reverseButtons: true,
    customClass: {
      popup: "!w-[92vw] sm:!w-[440px] !max-w-[440px] rounded-3xl p-5 shadow-2xl",
      title: "text-base font-bold text-slate-800 pb-2 border-b border-slate-100",
      confirmButton: "rounded-xl font-bold py-2.5 px-5 text-xs shadow-sm",
      cancelButton: "rounded-xl font-medium py-2.5 px-4 text-xs",
    },
    didOpen: () => {
      const fileInput = document.getElementById("input-avatar-file") as HTMLInputElement | null;
      const previewContainer = document.getElementById("avatar-preview-container");

      if (fileInput && previewContainer) {
        fileInput.addEventListener("change", (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (loadEvt) => {
              const res = loadEvt.target?.result as string;
              if (res) {
                tempAvatarUrl = res;
                previewContainer.innerHTML = renderAvatarPreview(tempAvatarUrl);
              }
            };
            reader.readAsDataURL(file);
          }
        });
      }

      const btnRemove = document.getElementById("btn-remove-avatar");
      if (btnRemove && previewContainer) {
        btnRemove.addEventListener("click", () => {
          tempAvatarUrl = "";
          previewContainer.innerHTML = renderAvatarPreview("");
          btnRemove.remove();
        });
      }
    },
    preConfirm: () => {
      const nameInput = document.getElementById("edit-name") as HTMLInputElement | null;
      const nipInput = document.getElementById("edit-nip") as HTMLInputElement | null;
      const divInput = document.getElementById("edit-division") as HTMLSelectElement | null;
      const posInput = document.getElementById("edit-position") as HTMLInputElement | null;
      const compInput = document.getElementById("edit-company") as HTMLInputElement | null;
      const phoneInput = document.getElementById("edit-phone") as HTMLInputElement | null;

      const name = nameInput?.value.trim() || "";
      const nip = nipInput?.value.trim() || "";
      const division = divInput?.value.trim() || "";
      const position = posInput?.value.trim() || "";
      const company = compInput?.value.trim() || "PT BISA MEDIA GRUP";
      const phone = phoneInput?.value.trim() || "";

      if (!name) {
        Swal.showValidationMessage("Nama lengkap wajib diisi!");
        return false;
      }
      if (!nip) {
        Swal.showValidationMessage("NIP wajib diisi!");
        return false;
      }

      return {
        name,
        nip,
        division,
        position,
        company,
        phone,
        avatarUrl: tempAvatarUrl,
      };
    },
  });

  if (formValues) {
    saveUserProfile(formValues);
    await Swal.fire({
      title: "Profil Diperbarui!",
      text: "Data profil Anda berhasil disimpan dan langsung diterapkan ke halaman utama.",
      icon: "success",
      confirmButtonColor: "#156bb8",
      confirmButtonText: "OK",
      customClass: {
        popup: "!w-[92vw] sm:!w-[400px] !max-w-[400px] rounded-3xl p-5 shadow-2xl",
        confirmButton: "rounded-xl font-bold py-2 px-5 text-xs shadow-sm",
      },
    });
    openSettingsModal(onLogout);
  } else {
    openSettingsModal(onLogout);
  }
}

/** Tampilkan Pop-up Ganti Kata Sandi */
export async function openChangePasswordModal(onLogout: () => void) {
  const Swal = (await import("sweetalert2")).default;

  const { value: passValues } = await Swal.fire({
    title: "Ganti Kata Sandi",
    html: `
      <div class="text-left mt-2 space-y-3">
        <p class="text-xs text-slate-600 leading-relaxed">
          Masukkan kata sandi saat ini dan tentukan kata sandi baru minimal 6 karakter.
        </p>

        <div>
          <label class="text-[11px] font-bold text-slate-700 mb-1 block">Kata Sandi Saat Ini: <span class="text-rose-500">*</span></label>
          <input type="password" id="pass-current" class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#156bb8]" placeholder="Masukkan kata sandi saat ini..." />
          <p class="text-[10px] text-slate-400 mt-1">Default kata sandi akun demo: <strong>123456</strong></p>
        </div>

        <div>
          <label class="text-[11px] font-bold text-slate-700 mb-1 block">Kata Sandi Baru: <span class="text-rose-500">*</span></label>
          <input type="password" id="pass-new" class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#156bb8]" placeholder="Minimal 6 karakter..." />
        </div>

        <div>
          <label class="text-[11px] font-bold text-slate-700 mb-1 block">Konfirmasi Kata Sandi Baru: <span class="text-rose-500">*</span></label>
          <input type="password" id="pass-confirm" class="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#156bb8]" placeholder="Ulangi kata sandi baru..." />
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Simpan Sandi",
    cancelButtonText: "Batal",
    confirmButtonColor: "#156bb8",
    cancelButtonColor: "#94a3b8",
    reverseButtons: true,
    customClass: {
      popup: "!w-[92vw] sm:!w-[420px] !max-w-[420px] rounded-3xl p-5 shadow-2xl",
      title: "text-base font-bold text-slate-800 pb-2 border-b border-slate-100",
      confirmButton: "rounded-xl font-bold py-2.5 px-5 text-xs shadow-sm",
      cancelButton: "rounded-xl font-medium py-2.5 px-4 text-xs",
    },
    preConfirm: () => {
      const curInput = document.getElementById("pass-current") as HTMLInputElement | null;
      const newInput = document.getElementById("pass-new") as HTMLInputElement | null;
      const confInput = document.getElementById("pass-confirm") as HTMLInputElement | null;

      const currentPass = curInput?.value || "";
      const newPass = newInput?.value || "";
      const confPass = confInput?.value || "";

      if (!currentPass) {
        Swal.showValidationMessage("Harap masukkan kata sandi saat ini!");
        return false;
      }
      if (!newPass || newPass.length < 6) {
        Swal.showValidationMessage("Kata sandi baru minimal 6 karakter!");
        return false;
      }
      if (newPass !== confPass) {
        Swal.showValidationMessage("Konfirmasi kata sandi baru tidak cocok!");
        return false;
      }

      const res = changeUserPassword(currentPass, newPass);
      if (!res.success) {
        Swal.showValidationMessage(res.message);
        return false;
      }

      return true;
    },
  });

  if (passValues) {
    await Swal.fire({
      title: "Sandi Diperbarui!",
      text: "Kata sandi akun Anda telah berhasil diubah.",
      icon: "success",
      confirmButtonColor: "#156bb8",
      confirmButtonText: "OK",
      customClass: {
        popup: "!w-[92vw] sm:!w-[400px] !max-w-[400px] rounded-3xl p-5 shadow-2xl",
        confirmButton: "rounded-xl font-bold py-2 px-5 text-xs shadow-sm",
      },
    });
    openSettingsModal(onLogout);
  } else {
    openSettingsModal(onLogout);
  }
}

