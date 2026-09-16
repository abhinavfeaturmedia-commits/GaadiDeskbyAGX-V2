import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { getModalPortalRoot } from '../../lib/modalContainer';
import { useApp } from '../../context/AppContext';
import { uploadMediaToCloud } from '../../services/storageService';
import {
  X,
  ShieldCheck,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Fuel,
  Wrench,
  Car,
  FileText,
  Loader2,
  Trash2
} from 'lucide-react';

export const VehicleInspectionModal = ({ booking, onSave, onClose }) => {
  const { vehicles } = useApp();
  const vehicle = vehicles.find(v => v.id === booking?.vehicleId) || {};

  const existingInspection = booking?.inspectionData || {};

  const [inspection, setInspection] = useState({
    frontBumper: existingInspection.frontBumper || 'Clean', // Clean | Minor Scratch | Dent
    leftSide: existingInspection.leftSide || 'Clean',
    rightSide: existingInspection.rightSide || 'Clean',
    rearBumper: existingInspection.rearBumper || 'Clean',
    stepneyAndJack: existingInspection.stepneyAndJack ?? true,
    fuelLevel: existingInspection.fuelLevel || '100% Full', // 25% | 50% | 75% | 100% Full
    odometerStart: existingInspection.odometerStart || vehicle.odometer || 64200,
    notes: existingInspection.notes || '',
    photos: existingInspection.photos || [],
    inspectedAt: new Date().toISOString()
  });

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = useRef(null);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingPhoto(true);
    const res = await uploadMediaToCloud(file, 'inspection-photos', 'inspections');
    if (res.url) {
      setInspection(prev => ({
        ...prev,
        photos: [...(prev.photos || []), res.url]
      }));
    }
    setIsUploadingPhoto(false);
  };

  const handleRemovePhoto = (index) => {
    setInspection(prev => ({
      ...prev,
      photos: (prev.photos || []).filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSave) {
      onSave(inspection);
    }
    onClose();
  };

  const statusOptions = ['Clean', 'Minor Scratch', 'Dent / Scratch'];

  return createPortal(
    <div className="fixed inset-0 z-[9999] modal-center-backdrop p-3">
      <div className="modal-card-center bg-white rounded-4xl max-w-[420px] w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#E5DFD3] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#E5DFD3] flex items-center justify-between bg-[#F8F6F0] shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#111827]">
                6-Point Vehicle Handover Check
              </h3>
              <p className="text-[10px] text-[#4B5563] font-semibold">
                {vehicle.plate || booking?.vehiclePlate || 'Vehicle Inspection'} • Self-Drive / Rental
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E5DFD3] flex items-center justify-center text-[#4B5563] hover:bg-gray-100 tap-active shadow-xs cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Inspection Form */}
        <form id="vehicle-inspection-form" onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 text-xs text-[#111827] smooth-scroll-container">
            <p className="text-[11px] text-[#4B5563] font-medium bg-[#F8F6F0] p-3 rounded-2xl border border-[#E5DFD3]">
              Record existing vehicle condition before handover to prevent return deposit disputes.
            </p>

          {/* 4 Body Exterior Points */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-black text-[#4B5563] uppercase tracking-wider block">
              Exterior Body Inspection
            </label>

            {[
              { id: 'frontBumper', label: '1. Front Bumper & Lights' },
              { id: 'leftSide', label: '2. Left Doors & Fender' },
              { id: 'rightSide', label: '3. Right Doors & Panels' },
              { id: 'rearBumper', label: '4. Rear Bumper & Boot' },
            ].map(item => (
              <div key={item.id} className="p-2.5 bg-white rounded-2xl border border-[#E5DFD3] flex items-center justify-between">
                <span className="font-bold text-[#111827]">{item.label}</span>
                <div className="flex gap-1">
                  {statusOptions.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setInspection({ ...inspection, [item.id]: opt })}
                      className={`px-2 py-1 rounded-xl text-[10px] font-black transition tap-active ${
                        inspection[item.id] === opt
                          ? opt === 'Clean'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : 'bg-rose-100 text-rose-900 border border-rose-300'
                          : 'bg-gray-50 text-gray-500 border border-gray-200'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Fuel & Toolkit Points */}
          <div className="space-y-2.5">
            <label className="text-[11px] font-black text-[#4B5563] uppercase tracking-wider block">
              Fuel & Toolkit Inventory
            </label>

            {/* Fuel Level */}
            <div className="p-3 bg-white rounded-2xl border border-[#E5DFD3] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#111827] flex items-center gap-1">
                  <Fuel className="w-3.5 h-3.5 text-amber-600" />
                  <span>5. Fuel Meter Level</span>
                </span>
                <span className="font-black text-[#EA580C]">{inspection.fuelLevel}</span>
              </div>
              <div className="grid grid-cols-4 gap-1 pt-1">
                {['25% Tank', '50% Tank', '75% Tank', '100% Full'].map(fl => (
                  <button
                    key={fl}
                    type="button"
                    onClick={() => setInspection({ ...inspection, fuelLevel: fl })}
                    className={`py-1 rounded-xl text-[10px] font-black transition tap-active ${
                      inspection.fuelLevel === fl
                        ? 'bg-[#111827] text-white'
                        : 'bg-gray-50 text-gray-500 border border-gray-200'
                    }`}
                  >
                    {fl}
                  </button>
                ))}
              </div>
            </div>

            {/* Toolkit & Stepney */}
            <div className="p-3 bg-white rounded-2xl border border-[#E5DFD3] flex items-center justify-between">
              <span className="font-bold text-[#111827] flex items-center gap-1">
                <Wrench className="w-3.5 h-3.5 text-blue-600" />
                <span>6. Stepney Tyre & Jack Toolkit</span>
              </span>
              <button
                type="button"
                onClick={() => setInspection({ ...inspection, stepneyAndJack: !inspection.stepneyAndJack })}
                className={`px-3 py-1 rounded-full text-xs font-black transition tap-active ${
                  inspection.stepneyAndJack
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}
              >
                {inspection.stepneyAndJack ? 'Present ✅' : 'Missing ❌'}
              </button>
            </div>
          </div>

          {/* Vehicle Condition Photos */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-[#4B5563] uppercase tracking-wider block">
                Condition Photos ({inspection.photos?.length || 0})
              </label>
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={photoInputRef}
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={isUploadingPhoto}
                className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-black flex items-center gap-1 tap-active"
              >
                {isUploadingPhoto ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Camera className="w-3 h-3" />
                    <span>+ Add Photo</span>
                  </>
                )}
              </button>
            </div>

            {/* Photos Gallery */}
            {inspection.photos && inspection.photos.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {inspection.photos.map((url, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-[#E5DFD3] h-20 bg-black/5">
                    <img src={url} alt={`Damage ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600 text-white flex items-center justify-center text-[10px] opacity-90 hover:opacity-100"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-[#F8F6F0] rounded-xl border border-dashed border-[#E5DFD3] text-center text-[10px] font-semibold text-[#6B7280]">
                No photos attached yet. Tap "+ Add Photo" to snap existing bumper or scratch photos.
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-[11px] font-bold text-[#4B5563] block mb-1">Scratch Notes / Damage Comments</label>
            <input
              type="text"
              placeholder="e.g. Minor scratch on left rear door"
              value={inspection.notes}
              onChange={e => setInspection({ ...inspection, notes: e.target.value })}
              className="w-full bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none"
            />
          </div>
          </div>

          {/* Pinned Action Footer */}
          <div className="p-4 border-t border-[#E5DFD3] bg-[#F8F6F0] shrink-0">
            <button
              type="submit"
              form="vehicle-inspection-form"
              className="w-full py-2.5 rounded-2xl bg-[#111827] text-white text-xs font-black flex items-center justify-center gap-1.5 hover:bg-black tap-active shadow-xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#D4F05B]" />
              <span>Save Inspection Checklist</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    getModalPortalRoot()
  );
};
