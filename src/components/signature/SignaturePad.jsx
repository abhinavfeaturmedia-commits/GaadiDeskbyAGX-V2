import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Check, PenTool } from 'lucide-react';

export const SignaturePad = ({ onSave, initialSignature = null, label = "Customer Digital Signature" }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(Boolean(initialSignature));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set actual resolution
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#111827';

    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = initialSignature;
    }
  }, []);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    if (e.touches && e.touches[0]) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (isDrawing) {
      e?.preventDefault();
      setIsDrawing(false);
      const canvas = canvasRef.current;
      if (canvas && onSave) {
        onSave(canvas.toDataURL('image/png'));
      }
    }
  };

  const handleClear = (e) => {
    e?.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    if (onSave) onSave(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-black text-[#111827] flex items-center gap-1.5">
          <PenTool className="w-3.5 h-3.5 text-[#EA580C]" />
          <span>{label}</span>
        </label>
        {hasDrawn && (
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] font-black text-rose-700 hover:text-rose-900 flex items-center gap-1 tap-active"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Clear Sign</span>
          </button>
        )}
      </div>

      <div className="relative border-2 border-dashed border-[#E5DFD3] rounded-2xl bg-white overflow-hidden touch-none shadow-xs">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-32 block cursor-crosshair"
        />

        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[#9CA3AF] text-xs font-semibold">
            <span>✍️ Sign here with finger / stylus</span>
          </div>
        )}
      </div>
      <p className="text-[10px] text-[#6B7280] font-medium">
        Digital signature will be printed on the official Trip Duty Slip & Bill.
      </p>
    </div>
  );
};
