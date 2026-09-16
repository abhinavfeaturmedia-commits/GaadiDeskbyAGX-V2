import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Clock,
  Navigation,
  CheckCircle2,
  Calendar,
  IndianRupee,
  MapPin,
  Car,
  ChevronRight
} from 'lucide-react';

export const DriverTripHistory = () => {
  const { authUser, getDriverTrips, formatCurrency, t } = useApp();
  const trips = getDriverTrips(authUser?.driverId);

  const [filter, setFilter] = useState('all'); // 'all' | 'completed' | 'ongoing'

  const filteredTrips = trips.filter(tr => {
    if (filter === 'completed') return tr.status === 'Completed';
    if (filter === 'ongoing') return tr.status === 'Ongoing' || tr.status === 'Driver Assigned';
    return true;
  });

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-[#111827]">
            {t('navDriverTrips')}
          </h2>
          <p className="text-xs text-[#4B5563] font-semibold">
            {trips.length} total assigned duties
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex bg-white p-1 rounded-full border-2 border-[#E5DFD3] shadow-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-black transition ${
              filter === 'all' ? 'bg-[#111827] text-white shadow-xs' : 'text-[#4B5563]'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1 rounded-full text-xs font-black transition ${
              filter === 'completed' ? 'bg-[#111827] text-white shadow-xs' : 'text-[#4B5563]'
            }`}
          >
            Done
          </button>
        </div>
      </div>

      {/* Trips List */}
      {filteredTrips.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 border-2 border-[#E5DFD3] text-center space-y-2 shadow-soft">
          <Clock className="w-10 h-10 text-[#4B5563] mx-auto opacity-40" />
          <h4 className="text-sm font-black text-[#111827]">No Trips Found</h4>
          <p className="text-xs text-[#4B5563] font-semibold">
            Completed duties will be archived here automatically with full meter readings and bata records.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTrips.map(tr => {
            const isDone = tr.status === 'Completed';
            const isOngoing = tr.status === 'Ongoing';

            return (
              <div
                key={tr.id}
                className="bg-white rounded-3xl p-4 border-2 border-[#E5DFD3] shadow-soft space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-black text-[#111827]">{tr.id}</span>
                    <span className="text-[10px] font-bold bg-gray-100 text-[#4B5563] px-2 py-0.5 rounded-full">
                      {tr.tripType}
                    </span>
                  </div>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    isDone
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : isOngoing
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-blue-100 text-blue-900 border border-blue-300'
                  }`}>
                    {tr.status}
                  </span>
                </div>

                {/* Route */}
                <div className="text-xs font-bold text-[#111827] space-y-1">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-emerald-600 font-black">●</span>
                    <span className="truncate">{tr.pickupLocation}</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-red-500 font-black">●</span>
                    <span className="truncate">{tr.dropLocation}</span>
                  </div>
                </div>

                {/* Meter & Financial Summary */}
                <div className="p-2.5 bg-[#F8F6F0] rounded-2xl border border-[#E5DFD3] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-[#4B5563] font-bold block">
                      {isDone ? `Meter: ${tr.startKm || tr.startOdometer || 0} ➔ ${tr.endKm || 0} KM` : `Scheduled: ${new Date(tr.startDateTime).toLocaleDateString('en-IN')}`}
                    </span>
                    <span className="font-black text-[#111827]">
                      {isDone ? `${tr.actualKm || 0} KM Run` : tr.vehiclePlate}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-amber-800 font-bold block">Driver Bata</span>
                    <span className="font-black text-amber-950">{formatCurrency(tr.driverBata || 0)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
