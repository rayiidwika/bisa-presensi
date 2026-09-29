"use client";

import { useRef, useState } from "react";
import { Upload, X, FileText, Image } from "lucide-react";
import { formatFileSize } from "@/lib/utils";

interface FileUploaderProps {
  value: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  maxSizeMB?: number;
  label?: string;
}

export default function FileUploader({
  value,
  onChange,
  accept = "image/*,.pdf,.doc,.docx",
  maxSizeMB = 5,
  label = "Lampiran (Opsional)",
}: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Ukuran file maksimal ${maxSizeMB} MB`);
      return;
    }
    onChange(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const isImage = value?.type.startsWith("image/");
  const isPDF = value?.type === "application/pdf";

  return (
    <div className="space-y-2">
      <label className="text-sm font-semibold text-slate-700">{label}</label>

      {!value ? (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center gap-2 cursor-pointer transition-all duration-200 ${
            dragOver
              ? "border-blue-400 bg-blue-50/80 scale-[1.01]"
              : "border-slate-200 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/40"
          }`}
        >
          <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center">
            <Upload size={22} className="text-blue-500" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-700">
              Klik atau seret file ke sini
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              PNG, JPG, PDF, DOC hingga {maxSizeMB} MB
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      ) : (
        <div className="border border-slate-200 rounded-2xl p-4 bg-white flex items-center gap-3 shadow-sm">
          {/* Preview */}
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={URL.createObjectURL(value)}
                alt="preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <FileText size={22} className="text-slate-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-700 truncate">
              {value.name}
            </p>
            <p className="text-xs text-slate-400">{formatFileSize(value.size)}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-xs text-blue-500 font-medium hover:text-blue-700 transition-colors"
            >
              Ganti
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
            >
              <X size={14} className="text-red-500" />
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 font-medium flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
          {error}
        </p>
      )}
    </div>
  );
}
