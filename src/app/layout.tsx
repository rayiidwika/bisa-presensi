import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import BottomNav from "@/components/layout/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bisa Presensi — Sistem Presensi Karyawan",
  description:
    "Aplikasi manajemen presensi karyawan: pengajuan cuti, izin, dan lembur secara digital.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-200`}
      >
        {/* Mobile container */}
        <div className="min-h-screen max-w-md mx-auto bg-slate-50 relative pb-24 shadow-xl overflow-hidden">
          {children}
          <BottomNav />
        </div>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              maxWidth: "420px",
              fontFamily: "var(--font-geist-sans)",
            },
          }}
        />
      </body>
    </html>
  );
}
