import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DriverActiveDuty } from './DriverActiveDuty';
import {
  Navigation,
  Car,
  CheckCircle2,
  Clock,
  Sparkles,
  Calendar,
  IndianRupee,
  ShieldCheck,
  PhoneCall,
  UserCheck,
  AlertCircle
} from 'lucide-react';

export const DriverDashboard = () => {
  const {
    authUser,
    t,
    drivers,
    vehicles,
    getDriverActiveTrip,
    getDriverTrips,
    getDriverVehicle,
    getDriverCashStats,
    updateDriverStatus,
    formatCurrency
  } = useApp();

  const driverId = authUser?.driverId;
  const currentDriver = drivers.find(d => d.id === driverId) || {
    name: authUser?.name || 'Driver',
    status: 'Available'
  };

  const activeTrip = getDriverActiveTrip(driverId);
  const assignedVehicle = getDriverVehicle(driverId);
  const allTrips = getDriverTrips(driverId);
  const completedTrips = allTrips.filter(t => t.status === 'Completed');
  const cashStats = getDriverCashStats(driverId);

  const isAvailable = currentDriver.status === 'Available';

  const handleToggleAvailability = () => {
    const newStatus = isAvailable ? 'Leave' : 'Available';
    updateDriverStatus(driverId, newStatus);
  };

  // If there's an active (assigned or ongoing) trip, show the live duty cockpit directly
  if (activeTrip) {
    return <DriverActiveDuty booking={activeTrip} />;
  }

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      {/* Standby Status Hero Card */}
      <div className="bg-white rounded-3xl p-5 border-2 border-[#E5DFD3] shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black text-[#4B5563] uppercase tracking-wider block">
              Duty Status
            </span>
            <h3 className="text-base font-black text-[#111827]">
              {isAvailable ? t('driverReadyForDuty') : t('driverOnLeave')}
            </h3>
          </div>
          <button
            onClick={handleToggleAvailability}
            className={`px-3 py-1.5 rounded-full text-xs font-black transition tap-active shadow-xs flex items-center gap-1.5 ${
              isAvailable
                ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
                : 'bg-gray-100 text-[#4B5563] border border-gray-300 hover:bg-gray-200'
            }`}
          >
            <div className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-emerald-600' : 'bg-gray-400'}`} />
            <span>{isAvailable ? 'Available 🟢' : 'On Leave ⚪'}</span>
          </button>
        </div>

        <p className="text-xs text-[#4B5563] font-semibold bg-[#F8F6F0] p-3 rounded-2xl border border-[#E5DFD3]">
          {isAvailable
            ? '✨ You are online and available. When your fleet office assigns a new trip, it will appear here immediately.'
            : '⏸️ You are currently marked on leave. Tap the button above when you are ready to take duties.'}
        </p>

        {/* 3 Quick Performance Metrics */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-3 bg-[#F8F6F0] rounded-2xl border border-[#E5DFD3] text-center">
            <span className="text-[10px] font-black text-[#4B5563] uppercase block">Completed</span>
            <span className="text-sm font-black text-[#111827]">{completedTrips.length} Trips</span>
          </div>

          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-center">
            <span className="text-[10px] font-black text-amber-900 uppercase block">Bata Earned</span>
            <span className="text-sm font-black text-amber-950">{formatCurrency(cashStats.totalBata)}</span>
          </div>

          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center">
            <span className="text-[10px] font-black text-emerald-900 uppercase block">Cash in Hand</span>
            <span className="text-sm font-black text-emerald-950">{formatCurrency(cashStats.netCashDue)}</span>
          </div>
        </div>
      </div>

      {/* Assigned Vehicle Specifications Card */}
      {assignedVehicle && (
        <div className="bg-white rounded-3xl p-5 border-2 border-[#E5DFD3] shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Car className="w-5 h-5 text-[#EA580C]" />
              <h4 className="text-xs font-black text-[#111827] uppercase tracking-wider">
                My Assigned Fleet Vehicle
              </h4>
            </div>
            <span className="text-[10px] font-extrabold bg-gray-100 text-[#111827] px-2 py-0.5 rounded-full">
              {assignedVehicle.fuel}
            </span>
          </div>

          <div className="p-3 bg-[#F8F6F0] rounded-2xl border border-[#E5DFD3] flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-[#111827]">{assignedVehicle.plate}</h3>
              <p className="text-xs text-[#4B5563] font-semibold">{assignedVehicle.brand} {assignedVehicle.model} ({assignedVehicle.category})</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#4B5563] font-bold block">Current Odometer</span>
              <span className="text-xs font-black text-[#111827]">{assignedVehicle.odometer?.toLocaleString('en-IN') || 64000} KM</span>
            </div>
          </div>
        </div>
      )}

      {/* Office & Dispatch Support Quick Contact */}
      <div className="p-4 bg-gray-900 text-white rounded-3xl space-y-2 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PhoneCall className="w-4 h-4 text-[#D4F05B]" />
            <h4 className="text-xs font-black text-white uppercase tracking-wider">
              Fleet Office Support
            </h4>
          </div>
          <span className="text-[10px] bg-white/10 text-white px-2 py-0.5 rounded-full font-bold">
            24/7 Helpline
          </span>
        </div>
        <p className="text-xs text-gray-300 font-semibold">
          For urgent duty changes, car breakdown, or passenger assistance, call the owner office directly.
        </p>
        <a
          href="tel:+919822012345"
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#D4F05B] text-[#111827] text-xs font-black rounded-full hover:bg-lime-400 tap-active shadow-xs"
        >
          <PhoneCall className="w-3.5 h-3.5" />
          <span>Call Office (+91 98220 12345)</span>
        </a>
      </div>
    </div>
  );
};
