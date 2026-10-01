"use client";

import { useRef, useState, useEffect, useMemo } from "react";
import { Image as ImageIcon, Video, Link2, X, Trash2, ExternalLink, CheckCircle2 } from "lucide-react";
import { formatFileSize } from "@/lib/utils";

export type AttachmentType = "photo" | "video" | "link";

interface AttachmentUploaderProps {
  attachmentType: AttachmentType;
  onTypeChange: (type: AttachmentType) => void;
  fileValue: File | null;
  onFileChange: (file: File | null) => void;
  linkValue: string;
  onLinkChange: (link: string) => void;
}

export default function AttachmentUploader({
  attachmentType,
  onTypeChange,
  fileValue,
  onFileChange,
  linkValue,
  onLinkChange,
}: AttachmentUploaderProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate object URL for preview
  const previewUrl = useMemo(() => {
    if (!fileValue) return null;
    return URL.createObjectURL(fileValue);
  }, [fileValue]);

  // Reset inputs when fileValue is cleared
  useEffect(() => {
    if (!fileValue) {
      if (photoInputRef.current) photoInputRef.current.value = "";
      if (videoInputRef.current) videoInputRef.current.value = "";
    }
  }, [fileValue]);

  const handlePhotoSelect = (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setError("Harap pilih file gambar (JPG, PNG, WEBP) atau PDF");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Ukuran foto maksimal 10 MB");
      return;
    }
    onFileChange(file);
  };

  const handleVideoSelect = (file: File) => {
    setError(null);
    if (!file.type.startsWith("video/")) {
      setError("Harap pilih file video (MP4, MOV, WEBM, dll)");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("Ukuran video maksimal 50 MB");
      return;
    }
    onFileChange(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;

    if (attachmentType === "photo") {
      handlePhotoSelect(file);
    } else if (attachmentType === "video") {
      handleVideoSelect(file);
    }
  };

  const isValidUrl =
    linkValue.trim().startsWith("http://") || linkValue.trim().startsWith("https://");

  return (
    <div className="space-y-2.5">
      {/* Segmented Pill Tabs: Foto, Video, Link */}
      <div className="bg-[#edf5fb] p-1 rounded-xl flex items-center gap-1 border border-[#c8e0f0]">
        <button
          type="button"
          onClick={() => {
            onTypeChange("photo");
            setError(null);
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            attachmentType === "photo"
              ? "bg-[#1a7dc4] text-white shadow-xs"
              : "text-[#3b668d] hover:bg-[#dbebf8]"
          }`}
        >
          <ImageIcon size={14} strokeWidth={2.2} />
          <span>Foto</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onTypeChange("video");
            setError(null);
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            attachmentType === "video"
              ? "bg-[#1a7dc4] text-white shadow-xs"
              : "text-[#3b668d] hover:bg-[#dbebf8]"
          }`}
        >
          <Video size={14} strokeWidth={2.2} />
          <span>Video</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onTypeChange("link");
            setError(null);
          }}
          className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            attachmentType === "link"
              ? "bg-[#1a7dc4] text-white shadow-xs"
              : "text-[#3b668d] hover:bg-[#dbebf8]"
          }`}
        >
          <Link2 size={14} strokeWidth={2.2} />
          <span>Link</span>
        </button>
      </div>

      {/* ═══════════ TAB FOTO ═══════════ */}
      {attachmentType === "photo" && (
        <div className="space-y-2">
          {!fileValue || !fileValue.type.startsWith("image/") ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => photoInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center gap-2 cursor-pointer transition-all duration-200 ${
                dragOver
                  ? "border-[#1a7dc4] bg-[#e8f4fd] scale-[1.01]"
                  : "border-[#c8dcea] bg-[#f0f8ff] hover:bg-[#e8f4fd] hover:border-[#3b9edd]"
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-[#ddeef8] text-[#1a7dc4] flex items-center justify-center shadow-2xs">
                <ImageIcon size={22} strokeWidth={2.2} />
              </div>
              <div className="text-center">
                <p className="text-xs sm:text-sm font-bold text-[#1a3c5e]">
                  Unggah Foto Bukti
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Klik atau seret file JPG, PNG, WEBP (maks. 10 MB)
                </p>
              </div>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handlePhotoSelect(f);
                }}
              />
            </div>
          ) : (
            <div className="border border-[#b9d9ee] rounded-2xl p-3 bg-[#f8fcff] flex items-center gap-3 shadow-xs">
              {/* Thumbnail Image */}
              <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={previewUrl}
                    alt="Preview Foto"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    <ImageIcon size={20} />
                  </div>
                )}
              </div>

              {/* Info File */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[#1a7dc4] bg-[#e8f4fd] border border-[#c8e2f4] px-1.5 py-0.5 rounded">
                    Foto Terpilih
                  </span>
                </div>
                <p className="text-xs font-bold text-[#1a3c5e] truncate mt-1">
                  {fileValue.name}
                </p>
                <p className="text-[11px] text-slate-400">
                  {formatFileSize(fileValue.size)}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="text-xs font-bold text-[#1a7dc4] bg-white border border-[#c8e2f4] hover:bg-[#1a7dc4] hover:text-white px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  Ganti
                </button>
                <button
                  type="button"
                  onClick={() => onFileChange(null)}
                  className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors cursor-pointer"
                  title="Hapus file"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <input
                ref={photoInputRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handlePhotoSelect(f);
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ═══════════ TAB VIDEO ═══════════ */}
      {attachmentType === "video" && (
        <div className="space-y-2">
          {!fileValue || !fileValue.type.startsWith("video/") ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => videoInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 flex flex-col items-center gap-2 cursor-pointer transition-all duration-200 ${
                dragOver
                  ? "border-[#1a7dc4] bg-[#e8f4fd] scale-[1.01]"
                  : "border-[#c8dcea] bg-[#f0f8ff] hover:bg-[#e8f4fd] hover:border-[#3b9edd]"
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-[#ddeef8] text-[#1a7dc4] flex items-center justify-center shadow-2xs">
                <Video size={22} strokeWidth={2.2} />
              </div>
              <div className="text-center">
                <p className="text-xs sm:text-sm font-bold text-[#1a3c5e]">
                  Unggah Video Bukti
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Klik atau seret file MP4, MOV, WEBM (maks. 50 MB)
                </p>
              </div>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleVideoSelect(f);
                }}
              />
            </div>
          ) : (
            <div className="border border-[#b9d9ee] rounded-2xl p-3 bg-[#f8fcff] space-y-2.5 shadow-xs">
              {/* Video Player Preview */}
              {previewUrl && (
                <div className="rounded-xl overflow-hidden bg-black max-h-48 flex items-center justify-center">
                  <video
                    src={previewUrl}
                    controls
                    className="w-full max-h-48 object-contain"
                  />
                </div>
              )}

              {/* Video Info & Actions */}
              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-[#1a7dc4] bg-[#e8f4fd] border border-[#c8e2f4] px-1.5 py-0.5 rounded">
                      Video Terpilih
                    </span>
                  </div>
                  <p className="text-xs font-bold text-[#1a3c5e] truncate mt-1">
                    {fileValue.name}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {formatFileSize(fileValue.size)}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="text-xs font-bold text-[#1a7dc4] bg-white border border-[#c8e2f4] hover:bg-[#1a7dc4] hover:text-white px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
                  >
                    Ganti
                  </button>
                  <button
                    type="button"
                    onClick={() => onFileChange(null)}
                    className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors cursor-pointer"
                    title="Hapus video"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleVideoSelect(f);
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* ═══════════ TAB LINK ═══════════ */}
      {attachmentType === "link" && (
        <div className="space-y-2">
          <div className="relative">
            <Link2
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#3b9edd] pointer-events-none"
            />
            <input
              type="url"
              className="w-full bg-[#f8fcff] border border-[#c8dcea] hover:border-[#3b9edd] focus:border-[#1a7dc4] focus:bg-white text-xs sm:text-sm text-slate-800 rounded-xl pl-9 pr-9 py-2.5 outline-hidden transition-all placeholder:text-slate-400 shadow-2xs"
              placeholder="https://drive.google.com/..."
              value={linkValue}
              onChange={(e) => onLinkChange(e.target.value)}
            />
            {linkValue && (
              <button
                type="button"
                onClick={() => onLinkChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                title="Hapus link"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 px-1">
            <p className="text-[11px] text-slate-400">
              Tautan Google Drive, Dropbox, YouTube, atau berkas online lainnya.
            </p>
          </div>

          {/* Quick link tester chip */}
          {isValidUrl && (
            <div className="flex items-center justify-between bg-[#f0f8ff] border border-[#c8e2f4] rounded-xl px-3 py-2 text-xs">
              <div className="flex items-center gap-1.5 text-[#1a7dc4] font-semibold truncate mr-2">
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                <span className="truncate">{linkValue}</span>
              </div>
              <a
                href={linkValue}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1a7dc4] bg-white border border-[#c8e2f4] hover:bg-[#1a7dc4] hover:text-white px-2 py-1 rounded-lg shrink-0 transition-colors shadow-2xs"
              >
                <span>Buka</span>
                <ExternalLink size={10} />
              </a>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-500 font-medium flex items-center gap-1 px-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
          {error}
        </p>
      )}
    </div>
  );
}
