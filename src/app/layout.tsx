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
        {/* Responsive Container for Mobile, Tablet, and Laptop */}
        <div className="min-h-screen w-full max-w-md md:max-w-2xl lg:max-w-3xl xl:max-w-4xl mx-auto bg-[#ddeef8] relative shadow-2xl overflow-x-hidden transition-all duration-300">
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
