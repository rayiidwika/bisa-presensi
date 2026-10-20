"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { X, Check, ZoomIn, ZoomOut, RotateCw, Move } from "lucide-react";

interface AvatarCropModalProps {
  imageSrc: string;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedBase64: string) => void;
}

export default function AvatarCropModal({
  imageSrc,
  isOpen,
  onClose,
  onCropComplete,
}: AvatarCropModalProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  const [imageSize, setImageSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement | null>(null);

  const CROP_SIZE = 260; // Diameter of circular crop viewport in pixels

  // Load natural image dimensions when imageSrc changes
  useEffect(() => {
    if (!imageSrc) return;
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setRotation(0);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Calculate base scale to fit/cover the circular viewport
  const isRotated90or270 = rotation % 180 !== 0;
  const naturalW = isRotated90or270 ? imageSize.height : imageSize.width;
  const naturalH = isRotated90or270 ? imageSize.width : imageSize.height;

  const baseScale =
    naturalW > 0 && naturalH > 0
      ? Math.max(CROP_SIZE / naturalW, CROP_SIZE / naturalH)
      : 1;

  const currentScale = baseScale * zoom;
  const renderedW = naturalW * currentScale;
  const renderedH = naturalH * currentScale;

  const maxOffsetX = Math.max(0, (renderedW - CROP_SIZE) / 2);
  const maxOffsetY = Math.max(0, (renderedH - CROP_SIZE) / 2);

  // Clamp offset so the circular crop viewport is always 100% covered by the image
  const clampOffset = useCallback(
    (x: number, y: number) => {
      const clampedX = Math.max(-maxOffsetX, Math.min(maxOffsetX, x));
      const clampedY = Math.max(-maxOffsetY, Math.min(maxOffsetY, y));
      return { x: clampedX, y: clampedY };
    },
    [maxOffsetX, maxOffsetY]
  );

  // Re-clamp offset if zoom or rotation changes
  useEffect(() => {
    setOffset((prev) => clampOffset(prev.x, prev.y));
  }, [clampOffset]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    startOffsetRef.current = { ...offset };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setOffset(clampOffset(startOffsetRef.current.x + dx, startOffsetRef.current.y + dy));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch drag handlers for mobile devices
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      startOffsetRef.current = { ...offset };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStartRef.current.x;
    const dy = e.touches[0].clientY - dragStartRef.current.y;
    setOffset(clampOffset(startOffsetRef.current.x + dx, startOffsetRef.current.y + dy));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.002;
    setZoom((prev) => Math.min(3, Math.max(1, prev + delta)));
  };

  // Rotate by 90 degrees
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
    setOffset({ x: 0, y: 0 });
  };

  // Perform canvas cropping and compression
  const handleSaveCrop = () => {
    if (!imageRef.current) return;
    const OUTPUT_SIZE = 600; // Output dimensions for crisp retina avatar
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const ratio = OUTPUT_SIZE / CROP_SIZE;

    ctx.save();
    // Move to center of canvas
    ctx.translate(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2);
    // Apply user rotation
    ctx.rotate((rotation * Math.PI) / 180);
    // Apply user translation (taking rotation into account)
    const rad = (-rotation * Math.PI) / 180;
    const rotatedOffsetX = offset.x * Math.cos(rad) - offset.y * Math.sin(rad);
    const rotatedOffsetY = offset.x * Math.sin(rad) + offset.y * Math.cos(rad);

    ctx.translate(rotatedOffsetX * ratio, rotatedOffsetY * ratio);

    // Draw the image centered
    const drawW = imageSize.width * currentScale * ratio;
    const drawH = imageSize.height * currentScale * ratio;
    ctx.drawImage(imageRef.current, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    // Export as high quality compressed JPEG
    const base64 = canvas.toDataURL("image/jpeg", 0.85);
    onCropComplete(base64);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="bg-[#121820] text-white w-full max-w-[380px] rounded-[28px] sm:rounded-[32px] shadow-2xl border border-slate-800 overflow-hidden flex flex-col animate-scale-up">
        {/* Header (Mirip Instagram) */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
            aria-label="Batal"
          >
            <X size={16} strokeWidth={2.2} />
          </button>
          <div className="text-center">
            <h3 className="text-sm font-bold tracking-wide text-white">Sesuaikan Foto</h3>
            <p className="text-[10px] text-slate-400 font-medium">Geser untuk memposisikan foto</p>
          </div>
          <button
            type="button"
            onClick={handleSaveCrop}
            className="px-3 py-1.5 rounded-full bg-[#156bb8] hover:bg-[#1f7cd0] text-white text-xs font-bold transition-all shadow-xs active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <Check size={13} strokeWidth={2.6} />
            <span>Pilih</span>
          </button>
        </div>

        {/* Viewport Area dengan Mask Lingkaran */}
        <div className="py-6 px-4 flex flex-col items-center justify-center bg-slate-950">
          <div
            className="relative overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none"
            style={{ width: `${CROP_SIZE}px`, height: `${CROP_SIZE}px` }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            {/* The Image being panned & zoomed */}
            <div
              className="absolute pointer-events-none transition-transform duration-75 will-change-transform"
              style={{
                width: `${renderedW}px`,
                height: `${renderedH}px`,
                left: `${CROP_SIZE / 2 - renderedW / 2 + offset.x}px`,
                top: `${CROP_SIZE / 2 - renderedH / 2 + offset.y}px`,
                transform: `rotate(${rotation}deg)`,
                transformOrigin: "center center",
              }}
            >
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                className="w-full h-full object-fill select-none"
                draggable={false}
              />
            </div>

            {/* Instagram Style Circular Cutout Mask */}
            <div
              className="absolute inset-0 pointer-events-none rounded-full border-2 border-white/90 shadow-[0_0_0_9999px_rgba(10,15,22,0.75)]"
              style={{ width: `${CROP_SIZE}px`, height: `${CROP_SIZE}px` }}
            />

            {/* Subtle Grid / Crosshairs for Alignment */}
            <div className="absolute inset-0 pointer-events-none rounded-full flex items-center justify-center opacity-20">
              <div className="w-full h-[1px] bg-white" />
              <div className="h-full w-[1px] bg-white absolute" />
            </div>

            {/* Move Hint Icon overlay */}
            <div className="absolute top-2.5 left-2.5 pointer-events-none bg-slate-900/60 backdrop-blur-xs text-white/80 p-1.5 rounded-full border border-white/10">
              <Move size={12} />
            </div>
          </div>
        </div>

        {/* Controls Bar (Zoom Slider & Rotate) */}
        <div className="px-6 py-4 bg-[#121820] border-t border-slate-800 space-y-3">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.max(1, prev - 0.2))}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
              title="Perkecil"
            >
              <ZoomOut size={16} />
            </button>
            <input
              type="range"
              min="1"
              max="3"
              step="0.01"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#156bb8]"
            />
            <button
              type="button"
              onClick={() => setZoom((prev) => Math.min(3, prev + 0.2))}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1"
              title="Perbesar"
            >
              <ZoomIn size={16} />
            </button>

            {/* Rotate Button */}
            <button
              type="button"
              onClick={handleRotate}
              className="ml-2 w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
              title="Putar 90°"
            >
              <RotateCw size={13} />
            </button>
          </div>

          <p className="text-[11px] text-slate-400 text-center font-medium">
            Tahan & geser foto untuk memilih bagian wajah/area terbaik
          </p>
        </div>
      </div>
    </div>
  );
}
