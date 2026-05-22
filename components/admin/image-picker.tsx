"use client";

import { useRef, useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import type { Area } from "react-easy-crop";
import { Camera, Upload, X, ZoomIn, ZoomOut, Check } from "lucide-react";

type Props = {
  currentUrl: string;
  onFileReady: (file: File) => void;
  onClear: () => void;
};

async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<File> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = imageSrc;
  });

  const canvas = document.createElement("canvas");
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, pixelCrop.width, pixelCrop.height);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) { reject(new Error("Canvas toBlob failed")); return; }
      resolve(new File([blob], "product.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  });
}

export function ImagePicker({ currentUrl, onFileReady, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rawSrc, setRawSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [confirming, setConfirming] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setRawSrc(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedArea(pixels);
  }, []);

  async function handleConfirm() {
    if (!rawSrc || !croppedArea) return;
    setConfirming(true);
    try {
      const file = await getCroppedBlob(rawSrc, croppedArea);
      onFileReady(file);
      setRawSrc(null);
    } finally {
      setConfirming(false);
    }
  }

  function handleCancel() {
    setRawSrc(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  }

  // Cropper modal
  if (rawSrc) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col bg-black">
        {/* Cropper area */}
        <div className="relative flex-1">
          <Cropper
            image={rawSrc}
            crop={crop}
            zoom={zoom}
            aspect={4 / 3}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            showGrid={false}
            style={{ containerStyle: { background: "#000" } }}
          />
        </div>

        {/* Controls */}
        <div className="bg-black/90 px-4 pt-3 pb-6 space-y-3">
          {/* Zoom slider */}
          <div className="flex items-center gap-3">
            <ZoomOut size={16} className="text-white/60 flex-shrink-0" />
            <input
              type="range" min={1} max={3} step={0.01}
              value={zoom} onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-orange-500"
            />
            <ZoomIn size={16} className="text-white/60 flex-shrink-0" />
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="button" onClick={handleCancel}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white border border-white/20"
            >
              <X size={16} /> Cancelar
            </button>
            <button
              type="button" onClick={handleConfirm} disabled={confirming}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: "var(--orange)" }}
            >
              <Check size={16} />
              {confirming ? "Aguarde..." : "Usar foto"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Placeholder / preview
  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        className="relative w-full aspect-[4/3] rounded-xl overflow-hidden cursor-pointer group"
        style={{ background: "var(--cream-dark)" }}
        onClick={() => inputRef.current?.click()}
      >
        {currentUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentUrl} alt="Produto" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-text-muted">
            <Camera size={32} className="opacity-40" />
            <span className="text-xs">Toque para adicionar foto</span>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
          <Upload size={22} className="text-white" />
          <span className="text-white text-xs font-medium">Trocar imagem</span>
        </div>
      </div>

      {/* Action buttons below preview */}
      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-colors hover:bg-gray-50"
          style={{ borderColor: "var(--cream-dark)", color: "var(--text-muted)" }}
        >
          <Upload size={13} /> Galeria / arquivo
        </button>
        <button
          type="button"
          onClick={() => {
            if (inputRef.current) {
              inputRef.current.setAttribute("capture", "environment");
              inputRef.current.click();
              setTimeout(() => inputRef.current?.removeAttribute("capture"), 500);
            }
          }}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium border transition-colors hover:bg-gray-50"
          style={{ borderColor: "var(--cream-dark)", color: "var(--text-muted)" }}
        >
          <Camera size={13} /> Câmera
        </button>
        {currentUrl && (
          <button
            type="button"
            onClick={onClear}
            className="px-3 py-2 rounded-lg text-xs font-medium border transition-colors hover:bg-red-50 hover:text-red-500 hover:border-red-200"
            style={{ borderColor: "var(--cream-dark)", color: "var(--text-muted)" }}
          >
            <X size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
