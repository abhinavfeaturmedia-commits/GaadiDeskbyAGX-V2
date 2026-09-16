import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { getModalPortalRoot } from '../../lib/modalContainer';
import { useApp } from '../../context/AppContext';
import {
  X,
  Wrench,
  Gauge,
  Calendar,
  IndianRupee,
  CheckCircle2,
  AlertTriangle,
  Building,
  FileText
} from 'lucide-react';

export const VehicleServiceModal = ({ vehicle, onClose }) => {
  const { addExpense, updateVehicleServiceSchedule, formatCurrency } = useApp();

  const [serviceType, setServiceType] = useState('Engine Oil & Filter'); // Engine Oil | Brake Pads | Tyre Rotation | Major Overhaul | General Servicing
  const [odometer, setOdometer] = useState(vehicle?.odometer || 65000);
  const [cost, setCost] = useState('3200');
  const [workshopName, setWorkshopName] = useState('Sai Service Center Swargate');
  const [notes, setNotes] = useState('Full synthetic engine oil + oil filter replacement');
  const [intervalKm, setIntervalKm] = useState(10000); // 10,000 km next interval

  const handleSubmit = (e) => {
    e.preventDefault();
    const serviceCost = Number(cost || 0);
    const currentOdo = Number(odometer || vehicle?.odometer || 0);
    const nextDueOdo = currentOdo + Number(intervalKm || 10000);

    // 1. Record Workshop Expense in Central Ledger
    addExpense({
      category: 'Workshop / Maintenance',
      description: `${serviceType} at ${workshopName} (${vehicle.plate})`,
      amount: serviceCost,
      paymentMode: 'Cash',
      vehicleId: vehicle.id,
      vehiclePlate: vehicle.plate,
      date: new Date().toISOString().split('T')[0]
    });

    // 2. Update Vehicle Maintenance Schedule in State
    if (updateVehicleServiceSchedule) {
      updateVehicleServiceSchedule(vehicle.id, {
        lastServiceOdometer: currentOdo,
        nextServiceDueOdometer: nextDueOdo,
        lastServiceDate: new Date().toISOString().split('T')[0],
        lastServiceType: serviceType,
        lastServiceCost: serviceCost,
        lastWorkshop: workshopName
      });
    }

    alert(`Service record logged! Next service due at ${nextDueOdo.toLocaleString()} KM.`);
    onClose();
  };

  return createPortal(
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      className="modal-center-backdrop"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="modal-card-center max-w-[440px]"
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#E5DFD3] flex items-center justify-between bg-[#F8F6F0] shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-2xl bg-[#111827] text-[#D4F05B] flex items-center justify-center font-black text-xs shadow-xs">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#111827]">
                Log Maintenance & Service
              </h3>
              <p className="text-[10px] text-[#4B5563] font-semibold">
                {vehicle?.brand} {vehicle?.model} • {vehicle?.plate}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#E5DFD3] flex items-center justify-center text-[#4B5563] hover:bg-gray-100 tap-active shadow-xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form id="service-form" onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4 text-xs text-[#111827] smooth-scroll-container">
          {/* Current Odometer Strip */}
          <div className="p-3 bg-[#F8F6F0] rounded-2xl border border-[#E5DFD3] flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#4B5563] uppercase block">Current Odometer</span>
              <span className="text-sm font-black text-[#111827] flex items-center gap-1">
                <Gauge className="w-3.5 h-3.5 text-[#EA580C]" />
                <span>{Number(vehicle?.odometer || 0).toLocaleString()} KM</span>
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-[#4B5563] uppercase block">Next Service Interval</span>
              <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                + {intervalKm.toLocaleString()} KM
              </span>
            </div>
          </div>

          {/* Service Category Buttons */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black text-[#4B5563] uppercase tracking-wider block">
              1. Service Category
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                'Engine Oil & Filter',
                'Brake Pads & Disc',
                'Tyre Replacement',
                'General 10K Service'
              ].map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setServiceType(st)}
                  className={`p-2 rounded-xl text-[11px] font-bold transition tap-active text-left ${
                    serviceType === st
                      ? 'bg-[#111827] text-white shadow-xs'
                      : 'bg-[#F8F6F0] text-[#4B5563] border border-[#E5DFD3] hover:bg-gray-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Service Details Inputs */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-[#4B5563] block mb-1">Service Odometer (KM)</label>
                <input
                  type="number"
                  required
                  value={odometer}
                  onChange={e => setOdometer(e.target.value)}
                  className="w-full bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl px-2.5 py-1.5 text-xs font-black focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-[#4B5563] block mb-1">Bill Amount (₹)</label>
                <input
                  type="number"
                  required
                  placeholder="3200"
                  value={cost}
                  onChange={e => setCost(e.target.value)}
                  className="w-full bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl px-2.5 py-1.5 text-xs font-black focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#4B5563] block mb-1">Workshop / Garage Name</label>
              <input
                type="text"
                value={workshopName}
                onChange={e => setWorkshopName(e.target.value)}
                className="w-full bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-[#4B5563] block mb-1">Work Done / Parts Replaced</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-[#F8F6F0] border border-[#E5DFD3] rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none"
              />
            </div>
          </div>
        </form>

        {/* Pinned Footer Action */}
        <div className="p-4 bg-white border-t border-[#E5DFD3] shrink-0">
          <button
            type="submit"
            form="service-form"
            className="w-full py-2.5 rounded-2xl bg-[#111827] text-white text-xs font-black flex items-center justify-center gap-1.5 hover:bg-black tap-active shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-[#D4F05B]" />
            <span>Save Service Record & Auto-Log Expense</span>
          </button>
        </div>
      </div>
    </div>,
    getModalPortalRoot()
  );
};
