import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  Car,
  User,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  Phone
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const FleetTimelineView = ({ vehicles = [] }) => {
  const { bookings = [], setIsNewBookingOpen, setSelectedVehicleDetail } = useApp();
  
  // Base date for timeline (defaults to today)
  const [baseDate, setBaseDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [selectedTrip, setSelectedTrip] = useState(null);

  // Generate 7 days range starting from baseDate
  const days = useMemo(() => {
    const list = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() + i);
      const isToday = new Date().toDateString() === d.toDateString();
      list.push({
        dateObj: d,
        dayNum: d.getDate(),
        dayName: DAY_NAMES[d.getDay()],
        monthName: MONTH_NAMES[d.getMonth()],
        dateStr: d.toISOString().split('T')[0],
        isToday
      });
    }
    return list;
  }, [baseDate]);

  const timelineStartMs = useMemo(() => {
    const d = new Date(days[0].dateObj);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [days]);

  const timelineEndMs = useMemo(() => {
    const d = new Date(days[6].dateObj);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }, [days]);

  const timelineTotalMs = timelineEndMs - timelineStartMs;

  const handlePrevDays = () => {
    setBaseDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextDays = () => {
    setBaseDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const handleResetToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setBaseDate(d);
  };

  // Map trips for each vehicle overlapping the 7-day range
  const vehicleSchedules = useMemo(() => {
    return vehicles.map(veh => {
      const vehTrips = bookings.filter(b => {
        if (!b.vehicleId || b.vehicleId !== veh.id) return false;
        if (b.status === 'Cancelled') return false;

        const tripStart = new Date(b.startDateTime || b.pickupDateTime || b.date).getTime();
        const tripEnd = new Date(b.endDateTime || b.dropDateTime || (tripStart + 4 * 3600 * 1000)).getTime();

        return tripEnd >= timelineStartMs && tripStart <= timelineEndMs;
      }).map(b => {
        const tripStart = new Date(b.startDateTime || b.pickupDateTime || b.date).getTime();
        const tripEnd = new Date(b.endDateTime || b.dropDateTime || (tripStart + 4 * 3600 * 1000)).getTime();

        // Calculate position in percentage across the 7-day timeline
        const clampedStart = Math.max(tripStart, timelineStartMs);
        const clampedEnd = Math.min(tripEnd, timelineEndMs);

        const leftPct = Math.max(0, Math.min(100, ((clampedStart - timelineStartMs) / timelineTotalMs) * 100));
        const widthPct = Math.max(1.8, Math.min(100 - leftPct, ((clampedEnd - clampedStart) / timelineTotalMs) * 100));

        return {
          ...b,
          tripStart,
          tripEnd,
          leftPct,
          widthPct
        };
      });

      return {
        vehicle: veh,
        trips: vehTrips
      };
    });
  }, [vehicles, bookings, timelineStartMs, timelineEndMs, timelineTotalMs]);

  return (
    <div className="bg-white rounded-3xl border border-card-border shadow-soft overflow-hidden animate-fade-in">
      {/* Navigation & Date Rail Controls */}
      <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 bg-stone-50/50">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#F39E36]" />
          <span className="text-xs font-black text-[#1E232A]">
            Dispatch Rail ({days[0].dayNum} {days[0].monthName} – {days[6].dayNum} {days[6].monthName})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleResetToday}
            className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors tap-active"
          >
            Today
          </button>
          <button
            onClick={handlePrevDays}
            className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors tap-active"
            title="Previous 7 Days"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextDays}
            className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors tap-active"
            title="Next 7 Days"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Timeline Grid Container */}
      <div className="overflow-x-auto no-scrollbar">
        <div className="min-w-[760px]">
          {/* Header Days Row */}
          <div className="grid grid-cols-[160px_repeat(7,1fr)] border-b border-gray-100 text-center text-xs font-bold text-gray-600 bg-white">
            <div className="p-2.5 text-left pl-4 font-black text-gray-400 uppercase tracking-wider text-[10px] border-r border-gray-100 flex items-center">
              Vehicle
            </div>
            {days.map(d => (
              <div
                key={d.dateStr}
                className={`py-2 px-1 border-r border-gray-100 last:border-r-0 flex flex-col items-center justify-center ${
                  d.isToday ? 'bg-amber-50/60 font-black text-[#1E232A]' : ''
                }`}
              >
                <span className={`text-[10px] uppercase tracking-wider ${d.isToday ? 'text-amber-700' : 'text-gray-400'}`}>
                  {d.dayName}
                </span>
                <span className={`text-xs ${d.isToday ? 'bg-[#F39E36] text-white px-2 py-0.5 rounded-full font-black shadow-xs' : ''}`}>
                  {d.dayNum}
                </span>
              </div>
            ))}
          </div>

          {/* Vehicle Rows */}
          <div className="divide-y divide-gray-100">
            {vehicleSchedules.map(({ vehicle, trips }) => (
              <div
                key={vehicle.id}
                className="grid grid-cols-[160px_1fr] group hover:bg-stone-50/40 transition-colors items-center"
              >
                {/* Left Frozen Vehicle Card */}
                <div
                  onClick={() => setSelectedVehicleDetail(vehicle)}
                  className="p-3 pl-4 border-r border-gray-100 flex items-center justify-between cursor-pointer hover:bg-stone-100/60 transition-colors"
                >
                  <div className="overflow-hidden">
                    <div className="text-xs font-black text-[#1E232A] truncate group-hover:text-[#F39E36] transition-colors">
                      {vehicle.plate}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">
                      {vehicle.brand} {vehicle.model}
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border shrink-0 ${
                      vehicle.status === 'Free'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : vehicle.status === 'On Trip'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {vehicle.status}
                  </span>
                </div>

                {/* Right Timeline Canvas with 7 columns background & overlapping trip bars */}
                <div className="relative h-14 w-full flex">
                  {/* Vertical Day Lines Background */}
                  <div className="absolute inset-0 grid grid-cols-7 pointer-events-none">
                    {days.map(d => (
                      <div
                        key={d.dateStr}
                        className={`border-r border-gray-100 last:border-r-0 h-full ${
                          d.isToday ? 'bg-amber-50/20' : ''
                        }`}
                      />
                    ))}
                  </div>

                  {/* Trip Blocks Overlay */}
                  <div className="absolute inset-y-1.5 inset-x-1">
                    {trips.length > 0 ? (
                      trips.map(trip => {
                        const isOngoing = trip.status === 'Ongoing';
                        const isConfirmed = trip.status === 'Confirmed' || trip.status === 'Upcoming';

                        const colorClasses = isOngoing
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                          : isConfirmed
                          ? 'bg-[#111827] text-white border-gray-800 shadow-xs'
                          : 'bg-stone-200 text-stone-800 border-stone-300';

                        return (
                          <div
                            key={trip.id}
                            onClick={() => setSelectedTrip(trip)}
                            style={{
                              left: `${trip.leftPct}%`,
                              width: `${trip.widthPct}%`
                            }}
                            className={`absolute top-0 bottom-0 rounded-xl px-2 py-1 flex items-center justify-between cursor-pointer text-[10px] font-bold border transition-all hover:scale-[1.02] hover:z-20 truncate tap-active ${colorClasses}`}
                            title={`${trip.customerName} - ${trip.tripType || 'Trip'}`}
                          >
                            <div className="truncate flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D4F05B] shrink-0" />
                              <span className="font-extrabold truncate">{trip.customerName}</span>
                            </div>
                            <span className="text-[9px] opacity-80 shrink-0 ml-1">
                              {trip.pickupTime || ''}
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <div
                        onClick={() => setIsNewBookingOpen(true)}
                        className="w-full h-full border border-dashed border-gray-200 rounded-xl flex items-center justify-center text-[10px] text-gray-400 hover:bg-stone-100/50 hover:text-gray-600 cursor-pointer transition-colors"
                      >
                        + Available (Tap to Book)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Trip Overview Modal */}
      {selectedTrip && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-gray-200 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-[#F39E36]">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#1E232A]">Trip Details</h3>
                  <p className="text-[10px] text-gray-500 font-bold">{selectedTrip.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTrip(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-2xl bg-stone-50 border border-gray-100">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-gray-500" />
                  <div>
                    <div className="font-bold text-[#1E232A]">{selectedTrip.customerName}</div>
                    <div className="text-[10px] text-gray-500">{selectedTrip.customerPhone}</div>
                  </div>
                </div>
                {selectedTrip.customerPhone && (
                  <a
                    href={`tel:${selectedTrip.customerPhone}`}
                    className="p-2 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-2xl bg-stone-50 border border-gray-100">
                  <div className="text-[10px] text-gray-400 uppercase font-bold">Vehicle</div>
                  <div className="font-extrabold text-[#1E232A]">{selectedTrip.vehiclePlate || 'Unassigned'}</div>
                </div>
                <div className="p-2.5 rounded-2xl bg-stone-50 border border-gray-100">
                  <div className="text-[10px] text-gray-400 uppercase font-bold">Status</div>
                  <div className="font-extrabold text-[#F39E36]">{selectedTrip.status}</div>
                </div>
              </div>

              <div className="p-2.5 rounded-2xl bg-stone-50 border border-gray-100 space-y-1">
                <div className="flex items-center gap-1.5 text-gray-500 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span className="font-bold text-[#1E232A]">{selectedTrip.pickupLocation || 'Local'}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-bold text-[#1E232A]">{selectedTrip.dropLocation || 'City'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-500 text-[10px] pt-1 border-t border-gray-200/60">
                  <Clock className="w-3 h-3 text-blue-500 shrink-0" />
                  <span>
                    {new Date(selectedTrip.startDateTime || selectedTrip.pickupDateTime || selectedTrip.date).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedTrip(null)}
              className="w-full py-2.5 rounded-2xl bg-[#111827] text-white text-xs font-black hover:bg-black transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
