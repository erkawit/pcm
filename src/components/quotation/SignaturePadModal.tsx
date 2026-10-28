'use client';

import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Trash2, CheckCircle2, X, Upload } from 'lucide-react';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSignature: (signatureDataUrl: string) => void;
  title?: string;
  initialSignature?: string;
}

export default function SignaturePadModal({
  isOpen,
  onClose,
  onSaveSignature,
  title = 'ลงนาม / วาดลายมือชื่อดิจิทัล',
  initialSignature,
}: SignaturePadModalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [strokeColor, setStrokeColor] = useState('#1d4ed8'); // Classic Business Royal Blue signature ink
  const [strokeWidth, setStrokeWidth] = useState(3);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);

        // If there is an initial signature, draw it
        if (initialSignature) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 20, 20, canvas.width - 40, canvas.height - 40);
            setHasDrawn(true);
          };
          img.src = initialSignature;
        }
      }
    }
  }, [isOpen, initialSignature]);

  if (!isOpen) return null;

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSaveSignature(dataUrl);
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result && canvasRef.current) {
          const img = new Image();
          img.onload = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 20, 20, canvas.width - 40, canvas.height - 40);
            setHasDrawn(true);
          };
          img.src = result;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col text-slate-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600 border border-blue-200">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">{title}</h3>
              <p className="text-xs text-slate-500">ใช้เมาส์ ปากกาสไตลัส หรือนิ้วสัมผัสเพื่อเซ็นลายมือชื่อ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Body */}
        <div className="p-6 flex flex-col items-center">
          <div className="w-full relative bg-slate-50/50 border-2 border-dashed border-slate-300 rounded-xl overflow-hidden shadow-inner flex justify-center">
            <canvas
              ref={canvasRef}
              width={460}
              height={180}
              className="cursor-crosshair touch-none bg-white"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {!hasDrawn && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-sm">
                วาดลายมือชื่อลงในกรอบนี้
              </div>
            )}
            <div className="absolute bottom-3 left-8 right-8 border-b border-slate-200 pointer-events-none" />
          </div>

          {/* Color & Pen options */}
          <div className="w-full mt-4 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">สีหมึก:</span>
              <button
                type="button"
                onClick={() => setStrokeColor('#1d4ed8')}
                className={`w-6 h-6 rounded-full bg-blue-700 border-2 transition ${
                  strokeColor === '#1d4ed8' ? 'border-slate-800 scale-110 shadow-xs' : 'border-transparent'
                }`}
                title="น้ำเงินเข้ม (Royal Blue)"
              />
              <button
                type="button"
                onClick={() => setStrokeColor('#0f172a')}
                className={`w-6 h-6 rounded-full bg-slate-900 border-2 transition ${
                  strokeColor === '#0f172a' ? 'border-blue-500 scale-110 shadow-xs' : 'border-transparent'
                }`}
                title="ดำ (Black)"
              />
              <button
                type="button"
                onClick={() => setStrokeColor('#0284c7')}
                className={`w-6 h-6 rounded-full bg-sky-600 border-2 transition ${
                  strokeColor === '#0284c7' ? 'border-slate-800 scale-110 shadow-xs' : 'border-transparent'
                }`}
                title="ฟ้าสว่าง (Sky)"
              />
              <button
                type="button"
                onClick={() => setStrokeColor('#b91c1c')}
                className={`w-6 h-6 rounded-full bg-red-700 border-2 transition ${
                  strokeColor === '#b91c1c' ? 'border-slate-800 scale-110 shadow-xs' : 'border-transparent'
                }`}
                title="แดง (Red)"
              />
            </div>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-blue-600 transition">
              <Upload className="w-4 h-4 text-slate-500" />
              <span>อัปโหลดรูปภาพลายเซ็น</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={clearCanvas}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-slate-200 transition text-xs font-medium"
          >
            <Trash2 className="w-4 h-4" />
            <span>ล้างกระดาน</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition text-xs font-medium"
            >
              ยกเลิก
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!hasDrawn}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition shadow-xs ${
                hasDrawn
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>บันทึกลายมือชื่อ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
