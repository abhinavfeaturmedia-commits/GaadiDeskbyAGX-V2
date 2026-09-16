import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getModalPortalRoot } from '../../lib/modalContainer';
import { useApp } from '../../context/AppContext';
import { modalStack } from '../../services/modalStack';
import { hapticFeedback } from '../../lib/haptics';
import {
  Car,
  Plus,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Fuel,
  Users,
  Gauge,
  Search,
  CheckCircle2,
  X,
  Clock,
  Filter,
  Wrench,
  ChevronRight,
  LayoutGrid
} from 'lucide-react';
import { VehicleDetailModal } from './VehicleDetailModal';
import { FleetTimelineView } from './FleetTimelineView';

export const FleetManager = () => {
  const {
    t,
    vehicles,
    addVehicle,
    updateVehicleOdometer,
    checkVehicleClash,
    isNewVehicleOpen,
    setIsNewVehicleOpen,
    setServiceModalVehicle,
    setSelectedVehicleDetail
  } = useApp();

  const [activeView, setActiveView] = useState('grid'); // 'grid' | 'timeline'
  const [filterCategory, setFilterCategory] = useState('All');
  const [selectedVehicleForCheck, setSelectedVehicleForCheck] = useState(null);
  const [selectedVehicleForOdo, setSelectedVehicleForOdo] = useState(null);
  const [odoInput, setOdoInput] = useState('');

  const [checkStartDate, setCheckStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [checkStartTime, setCheckStartTime] = useState('09:00');
  const [checkEndDate, setCheckEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [checkEndTime, setCheckEndTime] = useState('20:00');
  const [clashResult, setClashResult] = useState(null);

  // Register local FleetManager modals with modalStack for Android Back Button
  useEffect(() => {
    if (isNewVehicleOpen) {
      modalStack.push('new_vehicle_modal', () => setIsNewVehicleOpen(false));
      return () => modalStack.remove('new_vehicle_modal');
    }
  }, [isNewVehicleOpen, setIsNewVehicleOpen]);

  useEffect(() => {
    if (selectedVehicleForOdo) {
      modalStack.push('vehicle_odo_modal', () => setSelectedVehicleForOdo(null));
      return () => modalStack.remove('vehicle_odo_modal');
    }
  }, [selectedVehicleForOdo]);

  useEffect(() => {
    if (selectedVehicleForCheck) {
      modalStack.push('vehicle_clash_modal', () => setSelectedVehicleForCheck(null));
      return () => modalStack.remove('vehicle_clash_modal');
    }
  }, [selectedVehicleForCheck]);

  // New Vehicle Form State
  const [newVehicleForm, setNewVehicleForm] = useState({
    plate: '',
    brand: '',
    model: '',
    category: 'Sedan',
    fuel: 'Diesel',
    seats: 4,
    ownership: 'Own',
    odometer: 0,
    rcExpiry: '2030-01-01',
    insuranceExpiry: '2027-01-01',
    pucExpiry: '2027-01-01',
    fitnessExpiry: '2027-01-01',
    permitExpiry: '2027-01-01',
  });

  const categories = ['All', 'Sedan', 'MUV', 'SUV', 'Hatchback', 'Luxury'];

  const filteredVehicles = vehicles.filter(v => {
    return filterCategory === 'All' || v.category === filterCategory;
  });

  const handleClashCheck = () => {
    if (!selectedVehicleForCheck) return;
    const startStr = `${checkStartDate}T${checkStartTime}`;
    const endStr = `${checkEndDate}T${checkEndTime}`;

    if (new Date(endStr) <= new Date(startStr)) {
      setClashResult({
        isAvailable: false,
        message: `⚠️ End date/time must be after start date/time.`
      });
      return;
    }

    const clash = checkVehicleClash(selectedVehicleForCheck.id, startStr, endStr);

    if (clash) {
      setClashResult({
        isAvailable: false,
        message: `❌ Booked for ${clash.customerName} (${clash.tripType}) from ${new Date(clash.startDateTime).toLocaleDateString([], { day: 'numeric', month: 'short' })} ${new Date(clash.startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to ${new Date(clash.endDateTime).toLocaleDateString([], { day: 'numeric', month: 'short' })} ${new Date(clash.endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      });
    } else {
      setClashResult({
        isAvailable: true,
        message: `✅ Car is 100% Free from ${checkStartDate} ${checkStartTime} to ${checkEndDate} ${checkEndTime}!`
      });
    }
  };

  const handleOdometerSave = (e) => {
    e.preventDefault();
    if (!selectedVehicleForOdo || !odoInput) return;
    updateVehicleOdometer(selectedVehicleForOdo.id, Number(odoInput));
    setSelectedVehicleForOdo(null);
    setOdoInput('');
  };

  const handleAddVehicleSubmit = (e) => {
    e.preventDefault();
    if (!newVehicleForm.plate || !newVehicleForm.model) {
      alert("Please enter number plate and model.");
      return;
    }

    addVehicle({
      ...newVehicleForm,
      documents: {
        rcExpiry: newVehicleForm.rcExpiry,
        insuranceExpiry: newVehicleForm.insuranceExpiry,
        pucExpiry: newVehicleForm.pucExpiry,
        fitnessExpiry: newVehicleForm.fitnessExpiry,
        permitExpiry: newVehicleForm.permitExpiry,
      }
    });

    setIsNewVehicleOpen(false);
    setNewVehicleForm({
      plate: '',
      brand: '',
      model: '',
      category: 'Sedan',
      fuel: 'Diesel',
      seats: 4,
      ownership: 'Own',
      odometer: 0,
      rcExpiry: '2030-01-01',
      insuranceExpiry: '2027-01-01',
      pucExpiry: '2027-01-01',
      fitnessExpiry: '2027-01-01',
      permitExpiry: '2027-01-01',
    });
  };

  return (
    <div className="space-y-4 pt-1 animate-fade-in">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-black text-[#1E232A]">{t('tileFleet')}</h2>
          <p className="text-xs text-text-secondary font-medium">
            {vehicles.length} active vehicles in your fleet
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Grid vs Timeline View Switcher */}
          <div className="flex items-center bg-[#F5F2EB] p-0.5 rounded-full border border-[#E5DFD3]">
            <button
              onClick={() => setActiveView('grid')}
              className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 transition-all tap-active ${
                activeView === 'grid'
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'text-[#374151] hover:text-black'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setActiveView('timeline')}
              className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 transition-all tap-active ${
                activeView === 'timeline'
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'text-[#374151] hover:text-black'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-[#F39E36]" />
              <span>Timeline</span>
            </button>
          </div>

          <button
            onClick={() => setIsNewVehicleOpen(true)}
            className="px-3.5 py-1.5 rounded-full bg-[#111827] text-white text-xs font-black flex items-center gap-1 shadow-sm tap-active"
          >
            <Plus className="w-4 h-4 text-[#D4F05B]" />
            <span>Add Car</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-1">
        {categories.map(cat => {
          const isActive = filterCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-black whitespace-nowrap transition-all tap-active ${
                isActive
                  ? 'bg-[#111827] text-white shadow-xs'
                  : 'bg-white border-2 border-[#E5DFD3] text-[#374151] hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Main Content: Timeline View or Vehicle Grid */}
      {activeView === 'timeline' ? (
        <FleetTimelineView vehicles={filteredVehicles} />
      ) : (
        <div className="space-y-3">
        {filteredVehicles.length > 0 ? (
          filteredVehicles.map(veh => {
            const isFree = veh.status === 'Free';
            const isOnTrip = veh.status === 'On Trip';
            const isWorkshop = veh.status === 'Workshop';

            return (
              <div
                key={veh.id}
                className="bg-white rounded-3xl p-4 border border-card-border shadow-soft space-y-3 hover:shadow-soft-lg transition-all group"
              >
                {/* Clickable Card Body for 360° Profile */}
                <div
                  onClick={() => setSelectedVehicleDetail(veh)}
                  className="cursor-pointer space-y-3 tap-active"
                >
                  {/* Top Row: Plate + Status Pill */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-extrabold text-[#1E232A] tracking-wider group-hover:text-[#F39E36] transition-colors">
                        {veh.plate}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {veh.ownership}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                          isFree
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : isOnTrip
                            ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {veh.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#8A8782] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>

                  {/* Model & Specs */}
                  <div>
                    <h4 className="text-base font-extrabold text-[#1E232A]">
                      {veh.brand} {veh.model}
                    </h4>
                    <div className="flex items-center space-x-3 text-xs text-text-secondary mt-1">
                      <span className="flex items-center gap-1">
                        <Fuel className="w-3.5 h-3.5 text-accent-amber" />
                        <span>{veh.fuel}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-sky-600" />
                        <span>{veh.seats} Seats</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-bold text-gray-700">
                        <Gauge className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{(veh.odometer || 0).toLocaleString('en-IN')} KM</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div className="pt-2 border-t border-card-border/60 grid grid-cols-3 gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVehicleForCheck(veh);
                    }}
                    className="py-2 rounded-2xl bg-white border border-[#E5DFD3] text-gray-800 text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-gray-50 tap-active shadow-xs"
                  >
                    <Calendar className="w-3 h-3 text-amber-600" />
                    <span>{t('btnCheckFree')}</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setServiceModalVehicle(veh);
                    }}
                    className="py-2 rounded-2xl bg-white border border-[#E5DFD3] text-[#111827] text-[11px] font-bold flex items-center justify-center gap-1 hover:bg-gray-50 tap-active shadow-xs"
                  >
                    <Wrench className="w-3 h-3 text-blue-600" />
                    <span>Service</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedVehicleForOdo(veh);
                      setOdoInput(veh.odometer || 0);
                    }}
                    className="py-2 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-black flex items-center justify-center gap-1 hover:bg-amber-100 tap-active shadow-xs"
                  >
                    <Gauge className="w-3 h-3 text-amber-700" />
                    <span>Set KM</span>
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-3xl p-6 shadow-soft border border-card-border text-center space-y-4 animate-fade-in">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mx-auto text-2xl shadow-xs">
              🚗
            </div>
            <div>
              <h3 className="text-sm font-black text-[#111827]">
                {filterCategory === 'All' ? 'No Vehicles in Fleet' : `No ${filterCategory} Vehicles Found`}
              </h3>
              <p className="text-xs text-[#8A8782] font-semibold mt-1 max-w-xs mx-auto">
                {filterCategory === 'All'
                  ? 'Add your commercial cabs (Innova, Ertiga, Dzire) to track service schedules, live odometer, and booking clash prevention.'
                  : `You don't have any ${filterCategory} category vehicles registered yet.`}
              </p>
            </div>
            <button
              onClick={() => setIsNewVehicleOpen(true)}
              className="px-5 py-2.5 rounded-full bg-[#111827] hover:bg-black text-white text-xs font-black shadow-xs tap-active inline-flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4 text-[#D4F05B]" />
              <span>+ Register First Car</span>
            </button>
          </div>
        )}
      </div>
      )}

      {/* Date Clash Checker Modal */}
      {selectedVehicleForCheck && createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedVehicleForCheck(null); }}
          className="modal-center-backdrop"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="modal-card-center max-w-[400px]"
          >
            {/* Header */}
            <div className="bg-white px-5 py-4 border-b border-card-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-black text-sm">
                  🔍
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 leading-tight">
                    Check Slot Availability
                  </h3>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    {selectedVehicleForCheck.plate} • {selectedVehicleForCheck.brand} {selectedVehicleForCheck.model}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVehicleForCheck(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors tap-active"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 overflow-y-auto smooth-scroll-container">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={checkStartDate}
                    onChange={e => setCheckStartDate(e.target.value)}
                    className="w-full bg-[#FBF8F2] border border-card-border rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={checkStartTime}
                    onChange={e => setCheckStartTime(e.target.value)}
                    className="w-full bg-[#FBF8F2] border border-card-border rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={checkEndDate}
                    onChange={e => setCheckEndDate(e.target.value)}
                    className="w-full bg-[#FBF8F2] border border-card-border rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-900 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={checkEndTime}
                    onChange={e => setCheckEndTime(e.target.value)}
                    className="w-full bg-[#FBF8F2] border border-card-border rounded-xl px-2.5 py-1.5 text-xs font-bold text-gray-900 focus:outline-none"
                  />
                </div>
              </div>

              <button
                onClick={handleClashCheck}
                className="w-full py-2.5 rounded-full bg-accent-amber text-white text-xs font-extrabold shadow-glow-amber hover:bg-amber-600 tap-active"
              >
                Check Slot
              </button>

              {clashResult && (
                <div
                  className={`p-3 rounded-2xl text-xs font-bold ${
                    clashResult.isAvailable
                      ? 'bg-green-50 text-green-900 border border-green-200'
                      : 'bg-red-50 text-red-900 border border-red-200'
                  }`}
                >
                  {clashResult.message}
                </div>
              )}
            </div>
          </div>
        </div>,
        getModalPortalRoot()
      )}

      {/* Manual Odometer Calibration Modal */}
      {selectedVehicleForOdo && createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedVehicleForOdo(null); }}
          className="modal-center-backdrop"
        >
          <form
            onSubmit={handleOdometerSave}
            onClick={(e) => e.stopPropagation()}
            className="modal-card-center max-w-[360px]"
          >
            {/* Header */}
            <div className="bg-white px-5 py-4 border-b border-card-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-black">
                  <Gauge className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 leading-tight">
                    Calibrate Odometer
                  </h3>
                  <p className="text-[11px] text-text-secondary mt-0.5">
                    {selectedVehicleForOdo.plate} • {selectedVehicleForOdo.brand}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVehicleForOdo(null)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors tap-active"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5">
              <label className="text-[11px] font-bold text-gray-700 block mb-1">
                Current Odometer Reading (KM)
              </label>
              <input
                type="number"
                required
                value={odoInput}
                onChange={e => setOdoInput(e.target.value)}
                className="w-full bg-[#FBF8F2] border border-card-border rounded-xl px-3 py-2 text-sm font-mono font-black text-gray-900 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex space-x-2 p-5 pt-0">
              <button
                type="button"
                onClick={() => setSelectedVehicleForOdo(null)}
                className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-black shadow-xs"
              >
                Save Reading
              </button>
            </div>
          </form>
        </div>,
        getModalPortalRoot()
      )}

      {/* Add New Vehicle Modal (Portal to Root with 3-Tier Pinned Layout) */}
      {isNewVehicleOpen && createPortal(
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsNewVehicleOpen(false); }}
          className="modal-center-backdrop"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="modal-card-center"
          >
            {/* 1. PINNED HEADER (shrink-0) */}
            <div className="bg-white px-5 py-3.5 border-b border-card-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-black">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 leading-tight">
                    {t('btnAddNewCar')}
                  </h3>
                  <p className="text-[10px] text-text-secondary mt-0.5 font-medium">
                    Register vehicle in fleet ledger
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewVehicleOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-800 transition-colors tap-active"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 2. SCROLLABLE FORM BODY (flex-1 min-h-0 overflow-y-auto) */}
            <form id="add-vehicle-form" onSubmit={handleAddVehicleSubmit} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3 smooth-scroll-container">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  Number Plate (e.g. MH 12 AB 1234) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="MH 12 AB 1234"
                  value={newVehicleForm.plate}
                  onChange={e => setNewVehicleForm(prev => ({ ...prev, plate: e.target.value.toUpperCase() }))}
                  className="w-full bg-[#FAF8F5] border border-card-border rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Brand (e.g. Maruti)
                  </label>
                  <input
                    type="text"
                    placeholder="Maruti Suzuki"
                    value={newVehicleForm.brand}
                    onChange={e => setNewVehicleForm(prev => ({ ...prev, brand: e.target.value }))}
                    className="w-full bg-[#FAF8F5] border border-card-border rounded-xl px-3 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Model (e.g. Dzire) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Dzire VXi"
                    value={newVehicleForm.model}
                    onChange={e => setNewVehicleForm(prev => ({ ...prev, model: e.target.value }))}
                    className="w-full bg-[#FAF8F5] border border-card-border rounded-xl px-3 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Category
                  </label>
                  <select
                    value={newVehicleForm.category}
                    onChange={e => setNewVehicleForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-[#FAF8F5] border border-card-border rounded-xl px-3 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                  >
                    <option value="Sedan">Sedan</option>
                    <option value="MUV">MUV (Innova/Ertiga)</option>
                    <option value="SUV">SUV</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="Luxury">Luxury</option>
                    <option value="Tempo">Tempo Traveller</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Fuel
                  </label>
                  <select
                    value={newVehicleForm.fuel}
                    onChange={e => setNewVehicleForm(prev => ({ ...prev, fuel: e.target.value }))}
                    className="w-full bg-[#FAF8F5] border border-card-border rounded-xl px-3 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                  >
                    <option value="Diesel">Diesel</option>
                    <option value="CNG">CNG</option>
                    <option value="Petrol">Petrol</option>
                    <option value="EV">Electric (EV)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    Insurance Expiry
                  </label>
                  <input
                    type="date"
                    value={newVehicleForm.insuranceExpiry}
                    onChange={e => setNewVehicleForm(prev => ({ ...prev, insuranceExpiry: e.target.value }))}
                    className="w-full bg-[#FAF8F5] border border-card-border rounded-xl px-3 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    PUC Expiry
                  </label>
                  <input
                    type="date"
                    value={newVehicleForm.pucExpiry}
                    onChange={e => setNewVehicleForm(prev => ({ ...prev, pucExpiry: e.target.value }))}
                    className="w-full bg-[#FAF8F5] border border-card-border rounded-xl px-3 py-2 text-xs font-medium text-gray-900 focus:outline-none focus:border-amber-500 focus:bg-white transition-colors"
                  />
                </div>
              </div>
            </form>

            {/* 3. PINNED FOOTER (shrink-0) - Permanently visible Save Action */}
            <div className="bg-white px-5 py-3 border-t border-card-border shrink-0">
              <button
                type="submit"
                form="add-vehicle-form"
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-extrabold shadow-md shadow-amber-500/20 tap-active transition-all"
              >
                Save Vehicle
              </button>
            </div>
          </div>
        </div>,
        getModalPortalRoot()
      )}
    </div>
  );
};

