import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getModalPortalRoot } from '../../lib/modalContainer';
import { useApp } from '../../context/AppContext';
import { modalStack } from '../../services/modalStack';
import {
  X,
  Car,
  Calendar,
  Fuel,
  Users,
  Gauge,
  Wrench,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Navigation,
  ArrowRight,
  CheckCircle2,
  Clock,
  Receipt,
  Edit3,
  Trash2,
  Save,
  Plus,
  Phone,
  AlertTriangle,
  ChevronRight,
  Zap,
  IndianRupee,
  Check
} from 'lucide-react';

export const VehicleDetailModal = ({ vehicle, onClose }) => {
  const {
    t,
    bookings,
    drivers,
    expenses,
    updateVehicle,
    deleteVehicle,
    updateVehicleOdometer,
    renewVehicleDocument,
    openNewBookingWithPrefill,
    setServiceModalVehicle,
    setSelectedTripDetailBooking,
    formatCurrency,
    checkVehicleClash
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState('overview'); // 'overview' | 'trips' | 'service' | 'papers'
  const [tripFilter, setTripFilter] = useState('All'); // 'All' | 'Completed' | 'Ongoing' | 'Confirmed' | 'Cancelled'
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingOdo, setIsEditingOdo] = useState(false);
  const [odoInput, setOdoInput] = useState(vehicle?.odometer || 0);
  const [editingDocType, setEditingDocType] = useState(null); // 'RC' | 'Insurance' | 'PUC' | 'Fitness' | 'Permit'
  const [newDocExpiry, setNewDocExpiry] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  // Register with modalStack for Android Back Button
  useEffect(() => {
    modalStack.push('vehicle_detail_modal', onClose);
    return () => {
      modalStack.remove('vehicle_detail_modal');
    };
  }, [onClose]);

  // Edit Vehicle Form State
  const [editForm, setEditForm] = useState({
    plate: vehicle?.plate || '',
    brand: vehicle?.brand || '',
    model: vehicle?.model || '',
    category: vehicle?.category || 'Sedan',
    fuel: vehicle?.fuel || 'Diesel',
    seats: vehicle?.seats || 4,
    ownership: vehicle?.ownership || 'Own',
    assignedDriverId: vehicle?.assignedDriverId || '',
    avgKmPerLitre: vehicle?.avgKmPerLitre || 18.0,
    status: vehicle?.status || 'Free'
  });

  if (!vehicle) return null;

  // 1. Vehicle Trips calculation
  const vehicleTrips = bookings.filter(b => 
    (b.vehicleId && b.vehicleId === vehicle.id) ||
    (b.vehiclePlate && b.vehiclePlate.toLowerCase().includes(vehicle.plate.toLowerCase()))
  );

  const completedTrips = vehicleTrips.filter(b => b.status === 'Completed');
  const ongoingTrips = vehicleTrips.filter(b => b.status === 'Ongoing');
  const confirmedTrips = vehicleTrips.filter(b => b.status === 'Confirmed' || b.status === 'Driver Assigned');

  const totalBilledRevenue = vehicleTrips
    .filter(b => b.status !== 'Cancelled')
    .reduce((sum, b) => sum + Number(b.totalFare || 0), 0);

  const filteredTrips = vehicleTrips.filter(b => {
    if (tripFilter === 'All') return true;
    if (tripFilter === 'Ongoing') return b.status === 'Ongoing';
    if (tripFilter === 'Confirmed') return b.status === 'Confirmed' || b.status === 'Driver Assigned';
    return b.status === tripFilter;
  });

  // 2. Maintenance & Expenses calculation
  const vehicleExpenses = expenses.filter(e => 
    (e.vehicleId && e.vehicleId === vehicle.id) ||
    (e.vehiclePlate && e.vehiclePlate.toLowerCase().includes(vehicle.plate.toLowerCase())) ||
    (e.description && e.description.toLowerCase().includes(vehicle.plate.toLowerCase()))
  );

  const workshopExpenses = vehicleExpenses.filter(e => 
    e.category === 'Workshop / Maintenance' || (e.description && e.description.toLowerCase().includes('service'))
  );

  const totalMaintenanceCost = workshopExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  // Service Interval Progress
  const currentOdo = Number(vehicle.odometer || 0);
  const nextServiceOdo = Number(vehicle.nextServiceDueOdometer || (vehicle.lastServiceOdometer ? vehicle.lastServiceOdometer + 10000 : (currentOdo + 4000)));
  const kmToService = nextServiceOdo - currentOdo;
  const isServiceOverdue = kmToService <= 0;
  const isServiceUrgent = kmToService > 0 && kmToService <= 1000;

  // 3. Assigned Driver
  const assignedDriver = drivers.find(d => d.id === (vehicle.assignedDriverId || editForm.assignedDriverId));

  // 4. RTO Documents Status
  const today = new Date();
  const getDocStatus = (expiryDate) => {
    if (!expiryDate) return { daysLeft: 999, status: 'valid', label: 'Valid', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    const exp = new Date(expiryDate);
    const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { daysLeft: diffDays, status: 'expired', label: 'Expired', color: 'text-rose-700 bg-rose-50 border-rose-200' };
    if (diffDays <= 15) return { daysLeft: diffDays, status: 'urgent', label: `${diffDays}d left (Urgent)`, color: 'text-amber-700 bg-amber-50 border-amber-200' };
    if (diffDays <= 30) return { daysLeft: diffDays, status: 'warning', label: `${diffDays}d left`, color: 'text-yellow-700 bg-yellow-50 border-yellow-200' };
    return { daysLeft: diffDays, status: 'valid', label: `${diffDays}d valid`, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  };

  const docList = [
    { key: 'rc', name: 'RC (Registration Certificate)', expiry: vehicle.documents?.rcExpiry || '2030-01-01', mandatory: true },
    { key: 'insurance', name: 'Commercial Vehicle Insurance', expiry: vehicle.documents?.insuranceExpiry, mandatory: true },
    { key: 'puc', name: 'PUC (Pollution Certificate)', expiry: vehicle.documents?.pucExpiry, mandatory: true },
    { key: 'fitness', name: 'RTO Fitness Certificate', expiry: vehicle.documents?.fitnessExpiry, mandatory: true },
    { key: 'permit', name: 'Tourist / Commercial Permit', expiry: vehicle.documents?.permitExpiry, mandatory: true },
  ];

  // Save updated vehicle info
  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateVehicle(vehicle.id, {
      ...editForm,
      seats: Number(editForm.seats || 4),
      avgKmPerLitre: Number(editForm.avgKmPerLitre || 18.0)
    });
    setIsEditing(false);
    setSaveMessage('Vehicle details updated successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // Save Odometer
  const handleSaveOdo = (e) => {
    e.preventDefault();
    if (!odoInput) return;
    updateVehicleOdometer(vehicle.id, Number(odoInput));
    setIsEditingOdo(false);
    setSaveMessage('Odometer calibrated successfully!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // Save Document Expiry Renewal
  const handleSaveDocExpiry = (docKey) => {
    if (!newDocExpiry) return;
    let docType = 'Insurance';
    if (docKey === 'puc') docType = 'PUC';
    else if (docKey === 'fitness') docType = 'Fitness';
    else if (docKey === 'permit') docType = 'Permit';
    else if (docKey === 'rc') docType = 'RC Book';

    renewVehicleDocument(vehicle.id, docType, newDocExpiry);
    setEditingDocType(null);
    setNewDocExpiry('');
    setSaveMessage(`${docType} renewed till ${newDocExpiry}!`);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // Launch booking for this car
  const handleBookThisCar = () => {
    onClose();
    openNewBookingWithPrefill({
      vehicleId: vehicle.id,
      category: vehicle.category,
      driverId: vehicle.assignedDriverId || ''
    });
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
        {/* Header with Indian HSRP Plate */}
        <div className="p-4 bg-white border-b border-[#EFEAE2] space-y-2.5 shrink-0">

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-2xl bg-[#111827] text-[#DDF262] flex items-center justify-center font-black text-xs shadow-xs">
                <Car className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#111827]">
                  Vehicle 360° Profile
                </h3>
                <p className="text-[10px] text-[#8A8782] font-bold">
                  {vehicle.brand} {vehicle.model}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className={`p-1.5 rounded-full border text-xs font-bold transition-all tap-active ${
                  isEditing
                    ? 'bg-[#111827] text-white border-[#111827]'
                    : 'bg-white text-[#374151] border-[#EFEAE2] hover:bg-gray-50'
                }`}
                title="Edit Vehicle Details"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white border border-[#EFEAE2] flex items-center justify-center text-[#374151] hover:bg-gray-100 tap-active shadow-xs"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Indian HSRP License Plate + Status Banner */}
          <div className="bg-[#FAF8F5] rounded-3xl p-3 border border-[#EFEAE2] flex items-center justify-between">
            {/* HSRP Plate */}
            <div className="flex items-center border-2 border-[#111827] rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="bg-[#1D4ED8] text-white text-[8px] font-black px-1.5 py-1 flex flex-col items-center justify-center leading-none">
                <span>IND</span>
              </div>
              <div className="px-2.5 py-1 text-sm font-black tracking-wider text-[#111827]">
                {vehicle.plate}
              </div>
            </div>

            {/* Status & Ownership */}
            <div className="flex items-center space-x-1.5">
              <span className="text-[10px] font-bold text-[#8A8782] bg-white border border-[#EFEAE2] px-2 py-0.5 rounded-full shadow-xs">
                {vehicle.ownership || 'Own'}
              </span>
              <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                vehicle.status === 'Free'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : vehicle.status === 'On Trip'
                  ? 'bg-amber-50 text-amber-900 border-amber-200 animate-pulse'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
                {vehicle.status === 'Free' ? '🟢 Free' : vehicle.status === 'On Trip' ? '🚖 On Road' : '🔧 Workshop'}
              </span>
            </div>
          </div>

          {/* Quick Subtitle Chips */}
          <div className="flex items-center justify-between text-xs text-[#8A8782] font-semibold px-1">
            <span className="flex items-center gap-1">
              <Fuel className="w-3.5 h-3.5 text-[#F39E36]" />
              <span>{vehicle.fuel}</span>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-sky-600" />
              <span>{vehicle.seats} Seats</span>
            </span>
            <span>•</span>
            <button
              onClick={() => setIsEditingOdo(true)}
              className="flex items-center gap-1 text-[#111827] font-black hover:text-[#F39E36] transition-colors"
            >
              <Gauge className="w-3.5 h-3.5 text-[#8A8782]" />
              <span>{vehicle.odometer?.toLocaleString()} KM ✏️</span>
            </button>
          </div>

          {/* Odometer Inline Calibration Form */}
          {isEditingOdo && (
            <form onSubmit={handleSaveOdo} className="bg-amber-50 rounded-2xl p-2.5 border border-amber-200 flex items-center justify-between gap-2 animate-fade-in">
              <div className="flex items-center gap-1.5 flex-1">
                <Gauge className="w-4 h-4 text-amber-700 shrink-0" />
                <input
                  type="number"
                  value={odoInput}
                  onChange={(e) => setOdoInput(e.target.value)}
                  placeholder="Enter current KM"
                  className="w-full bg-white px-2.5 py-1 rounded-xl text-xs font-black text-[#111827] border border-amber-300 focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="submit"
                  className="px-2.5 py-1 rounded-xl bg-amber-600 text-white text-xs font-black tap-active"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingOdo(false)}
                  className="px-2 py-1 rounded-xl bg-white text-gray-600 text-xs font-bold border border-amber-200"
                >
                  ✕
                </button>
              </div>
            </form>
          )}

          {/* Feedback Toast */}
          {saveMessage && (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-2xl p-2 text-xs font-black flex items-center gap-1.5 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveMessage}</span>
            </div>
          )}
        </div>

        {/* 4 Interactive Tabs */}
        <div className="flex items-center space-x-1.5 px-4 pt-2 border-b border-[#EFEAE2] bg-white overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Overview', icon: Car },
            { id: 'trips', label: `Trips (${vehicleTrips.length})`, icon: Navigation },
            { id: 'service', label: 'Maintenance', icon: Wrench },
            { id: 'papers', label: 'RTO Papers', icon: ShieldCheck }
          ].map(tab => {
            const isActive = activeSubTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                className={`flex items-center gap-1.5 py-2.5 px-3 border-b-2 font-black text-xs whitespace-nowrap transition-all tap-active ${
                  isActive
                    ? 'border-[#F39E36] text-[#F39E36]'
                    : 'border-transparent text-[#8A8782] hover:text-[#111827]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* ================= TAB 1: OVERVIEW ================= */}
          {activeSubTab === 'overview' && (
            <div className="space-y-4 animate-fade-in">
              {/* 4-Bento Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {/* 1. Lifetime Trips */}
                <div className="bg-white rounded-3xl p-3.5 border border-[#EFEAE2] shadow-soft space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs text-[#8A8782] font-bold">
                    <Navigation className="w-3.5 h-3.5 text-[#111827]" />
                    <span>Lifetime Trips</span>
                  </div>
                  <div className="text-xl font-black text-[#111827]">
                    {vehicleTrips.length} <span className="text-xs font-bold text-[#8A8782]">trips</span>
                  </div>
                  <div className="text-[10px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{completedTrips.length} completed</span>
                  </div>
                </div>

                {/* 2. Total Billed Revenue */}
                <div className="bg-white rounded-3xl p-3.5 border border-[#EFEAE2] shadow-soft space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs text-[#8A8782] font-bold">
                    <IndianRupee className="w-3.5 h-3.5 text-[#F39E36]" />
                    <span>Total Billed</span>
                  </div>
                  <div className="text-xl font-black text-[#111827]">
                    {formatCurrency(totalBilledRevenue)}
                  </div>
                  <div className="text-[10px] font-bold text-[#8A8782]">
                    Fleet earnings ledger
                  </div>
                </div>

                {/* 3. Fuel Mileage */}
                <div className="bg-white rounded-3xl p-3.5 border border-[#EFEAE2] shadow-soft space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs text-[#8A8782] font-bold">
                    <Fuel className="w-3.5 h-3.5 text-[#EA580C]" />
                    <span>Avg Mileage</span>
                  </div>
                  <div className="text-xl font-black text-[#111827]">
                    {vehicle.avgKmPerLitre || 22.5} <span className="text-xs font-bold text-[#8A8782]">km/L</span>
                  </div>
                  <div className="text-[10px] font-bold text-[#8A8782]">
                    {vehicle.fuel} engine
                  </div>
                </div>

                {/* 4. Service Due */}
                <div className="bg-white rounded-3xl p-3.5 border border-[#EFEAE2] shadow-soft space-y-1">
                  <div className="flex items-center space-x-1.5 text-xs text-[#8A8782] font-bold">
                    <Wrench className="w-3.5 h-3.5 text-blue-600" />
                    <span>Next Service</span>
                  </div>
                  <div className={`text-xl font-black ${isServiceOverdue ? 'text-rose-600' : 'text-[#111827]'}`}>
                    {isServiceOverdue ? 'Overdue!' : `${kmToService.toLocaleString()} KM`}
                  </div>
                  <div className="text-[10px] font-bold text-[#8A8782]">
                    Due at {nextServiceOdo.toLocaleString()} KM
                  </div>
                </div>
              </div>

              {/* Assigned Chauffeur Card */}
              <div className="bg-white rounded-3xl p-3.5 border border-[#EFEAE2] shadow-soft space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-[#111827]">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#F39E36]" />
                    <span>Primary Assigned Chauffeur</span>
                  </span>
                </div>
                {assignedDriver ? (
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-900 border border-amber-200 flex items-center justify-center font-black text-xs">
                        {assignedDriver.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-xs font-black text-[#111827]">
                          {assignedDriver.name}
                        </div>
                        <div className="text-[11px] font-semibold text-[#8A8782]">
                          {assignedDriver.phone}
                        </div>
                      </div>
                    </div>
                    <a
                      href={`tel:${assignedDriver.phone}`}
                      className="px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1 hover:bg-emerald-100 tap-active"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call</span>
                    </a>
                  </div>
                ) : (
                  <p className="text-xs text-[#8A8782] italic py-1">
                    No default driver assigned. Drivers are assigned during trip dispatch.
                  </p>
                )}
              </div>

              {/* Active & Upcoming Schedule */}
              <div className="bg-white rounded-3xl p-3.5 border border-[#EFEAE2] shadow-soft space-y-2.5">
                <div className="flex items-center justify-between text-xs font-black text-[#111827]">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-[#111827]" />
                    <span>Active & Upcoming Dispatches</span>
                  </span>
                  <span className="text-[10px] font-bold text-[#8A8782]">
                    {ongoingTrips.length + confirmedTrips.length} scheduled
                  </span>
                </div>

                {ongoingTrips.length > 0 ? (
                  ongoingTrips.map(trip => (
                    <div
                      key={trip.id}
                      onClick={() => setSelectedTripDetailBooking(trip)}
                      className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5 cursor-pointer hover:bg-amber-100/70 transition-all tap-active"
                    >
                      <div className="flex items-center justify-between text-[11px] font-black text-amber-950">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                          <span>ON-ROAD LIVE: #{trip.id}</span>
                        </span>
                        <span>{trip.customerName}</span>
                      </div>
                      <div className="text-[11px] text-[#374151] font-semibold flex items-center gap-1">
                        <span>{trip.pickupLocation?.split(',')[0]}</span>
                        <ArrowRight className="w-3 h-3 text-[#8A8782]" />
                        <span>{trip.dropLocation?.split(',')[0]}</span>
                      </div>
                    </div>
                  ))
                ) : confirmedTrips.length > 0 ? (
                  confirmedTrips.slice(0, 2).map(trip => (
                    <div
                      key={trip.id}
                      onClick={() => setSelectedTripDetailBooking(trip)}
                      className="p-2.5 rounded-2xl bg-[#FAF8F5] border border-[#EFEAE2] space-y-1 cursor-pointer hover:bg-gray-100 transition-all tap-active"
                    >
                      <div className="flex items-center justify-between text-[11px] font-black text-[#111827]">
                        <span>📅 {trip.startDateTime?.slice(0, 10)} ({trip.tripType})</span>
                        <span>{formatCurrency(trip.totalFare)}</span>
                      </div>
                      <div className="text-[11px] text-[#8A8782] font-semibold flex items-center gap-1">
                        <span>{trip.customerName}</span>
                        <span>•</span>
                        <span>{trip.pickupLocation?.split(',')[0]} ➔ {trip.dropLocation?.split(',')[0]}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-2 text-center text-xs font-bold text-emerald-700 bg-emerald-50 rounded-2xl border border-emerald-200">
                    🟢 Vehicle is 100% Free & Ready for instant booking!
                  </div>
                )}
              </div>

              {/* RTO Papers Quick Status */}
              <div className="bg-white rounded-3xl p-3.5 border border-[#EFEAE2] shadow-soft space-y-2">
                <div className="flex items-center justify-between text-xs font-black text-[#111827]">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>RTO Papers Health Vault</span>
                  </span>
                  <button
                    onClick={() => setActiveSubTab('papers')}
                    className="text-[10px] font-black text-[#F39E36] hover:underline"
                  >
                    View All 5 ›
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {docList.slice(0, 4).map(doc => {
                    const status = getDocStatus(doc.expiry);
                    return (
                      <div key={doc.key} className="p-2 rounded-2xl bg-[#FAF8F5] border border-[#EFEAE2] text-[10px] space-y-0.5">
                        <div className="text-[#8A8782] font-bold truncate">{doc.name.split(' ')[0]}</div>
                        <div className={`font-black ${status.status === 'expired' ? 'text-rose-600' : status.status === 'urgent' ? 'text-amber-700' : 'text-emerald-700'}`}>
                          {status.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB 2: TRIPS HISTORY ================= */}
          {activeSubTab === 'trips' && (
            <div className="space-y-3 animate-fade-in">
              {/* Trip Filters */}
              <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pb-1">
                {['All', 'Completed', 'Ongoing', 'Confirmed', 'Cancelled'].map(filter => (
                  <button
                    key={filter}
                    onClick={() => setTripFilter(filter)}
                    className={`px-3 py-1 rounded-full text-xs font-black transition-all tap-active ${
                      tripFilter === filter
                        ? 'bg-[#111827] text-white shadow-xs'
                        : 'bg-white border border-[#EFEAE2] text-[#8A8782] hover:bg-gray-50'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Trip Cards */}
              {filteredTrips.length > 0 ? (
                filteredTrips.map(trip => (
                  <div
                    key={trip.id}
                    onClick={() => setSelectedTripDetailBooking(trip)}
                    className="bg-white rounded-3xl p-3.5 border border-[#EFEAE2] shadow-soft space-y-2 cursor-pointer hover:shadow-soft-lg transition-all tap-active group"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-1.5">
                        <span className="font-black text-[#111827]">
                          #{trip.bookingNumber || trip.id}
                        </span>
                        <span className="text-[10px] font-bold bg-[#FAF8F5] border border-[#EFEAE2] px-2 py-0.5 rounded-full text-[#8A8782]">
                          {trip.tripType}
                        </span>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                        trip.status === 'Completed'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : trip.status === 'Ongoing'
                          ? 'bg-amber-50 text-amber-900 border-amber-200 animate-pulse'
                          : trip.status === 'Cancelled'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-blue-50 text-blue-800 border-blue-200'
                      }`}>
                        {trip.status}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-black text-[#111827]">
                        {trip.customerName}
                      </div>
                      <div className="text-[11px] text-[#8A8782] font-semibold flex items-center gap-1 mt-0.5">
                        <span>{trip.pickupLocation?.split(',')[0]}</span>
                        <ArrowRight className="w-3 h-3 text-[#8A8782]" />
                        <span>{trip.dropLocation?.split(',')[0]}</span>
                      </div>
                    </div>

                    <div className="pt-1 border-t border-[#EFEAE2] flex items-center justify-between text-[11px]">
                      <span className="text-[#8A8782] font-bold">
                        📅 {trip.startDateTime?.slice(0, 10)}
                      </span>
                      <span className="text-xs font-black text-[#111827]">
                        {formatCurrency(trip.totalFare)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center bg-white rounded-3xl border border-[#EFEAE2] p-4 space-y-2">
                  <Navigation className="w-8 h-8 text-[#8A8782] mx-auto" />
                  <p className="text-xs font-black text-[#111827]">No trips found for this filter</p>
                  <p className="text-[11px] text-[#8A8782]">Create a new booking with this car to start logging trips.</p>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 3: MAINTENANCE ================= */}
          {activeSubTab === 'service' && (
            <div className="space-y-4 animate-fade-in">
              {/* Service Countdown Progress Bar */}
              <div className="bg-white rounded-3xl p-4 border border-[#EFEAE2] shadow-soft space-y-3">
                <div className="flex items-center justify-between text-xs font-black">
                  <span className="flex items-center gap-1.5 text-[#111827]">
                    <Wrench className="w-4 h-4 text-[#F39E36]" />
                    <span>Periodic 10,000 KM Service Tracker</span>
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                    isServiceOverdue
                      ? 'bg-rose-100 text-rose-900 border-rose-300'
                      : isServiceUrgent
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  }`}>
                    {isServiceOverdue ? 'OVERDUE' : `${kmToService.toLocaleString()} KM left`}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isServiceOverdue ? 'bg-rose-500' : isServiceUrgent ? 'bg-amber-500' : 'bg-[#DDF262]'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(10, ((currentOdo % 10000) / 10000) * 100))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[#8A8782] font-bold">
                    <span>Current: {currentOdo.toLocaleString()} KM</span>
                    <span>Target: {nextServiceOdo.toLocaleString()} KM</span>
                  </div>
                </div>

                <button
                  onClick={() => setServiceModalVehicle(vehicle)}
                  className="w-full py-2.5 rounded-2xl bg-[#111827] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-sm tap-active"
                >
                  <Wrench className="w-3.5 h-3.5 text-[#DDF262]" />
                  <span>+ Log Workshop Invoice / Service</span>
                </button>
              </div>

              {/* Maintenance History */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black text-[#111827] px-1">
                  Workshop & Service Ledger
                </h4>

                {workshopExpenses.length > 0 ? (
                  workshopExpenses.map(exp => (
                    <div
                      key={exp.id}
                      className="bg-white rounded-3xl p-3.5 border border-[#EFEAE2] shadow-soft space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-[#111827]">
                          {exp.description || 'Workshop Maintenance'}
                        </span>
                        <span className="font-black text-rose-600">
                          -{formatCurrency(exp.amount)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#8A8782] font-semibold">
                        <span>📅 {exp.date}</span>
                        <span>Mode: {exp.paymentMode || 'Cash'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center bg-white rounded-3xl border border-[#EFEAE2] p-4 space-y-1">
                    <Wrench className="w-6 h-6 text-[#8A8782] mx-auto" />
                    <p className="text-xs font-black text-[#111827]">No workshop expenses recorded yet</p>
                    <p className="text-[11px] text-[#8A8782]">Service invoices logged here will link to your fleet ledger.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================= TAB 4: RTO PAPERS ================= */}
          {activeSubTab === 'papers' && (
            <div className="space-y-3 animate-fade-in">
              <div className="flex items-center justify-between px-1">
                <h4 className="text-xs font-black text-[#111827]">
                  Mandatory Commercial Vehicle Papers (5/5)
                </h4>
              </div>

              {docList.map(doc => {
                const status = getDocStatus(doc.expiry);
                const isEditingThisDoc = editingDocType === doc.key;

                return (
                  <div
                    key={doc.key}
                    className="bg-white rounded-3xl p-3.5 border border-[#EFEAE2] shadow-soft space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="text-xs font-black text-[#111827]">
                          {doc.name}
                        </div>
                        <div className="text-[11px] text-[#8A8782] font-semibold">
                          Valid Till: <span className="font-bold text-[#111827]">{doc.expiry || 'Not set'}</span>
                        </div>
                      </div>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    {isEditingThisDoc ? (
                      <div className="pt-2 border-t border-[#EFEAE2] flex items-center gap-2 animate-fade-in">
                        <input
                          type="date"
                          value={newDocExpiry}
                          onChange={(e) => setNewDocExpiry(e.target.value)}
                          className="flex-1 bg-[#FAF8F5] border border-[#EFEAE2] rounded-xl px-2.5 py-1 text-xs font-bold text-[#111827]"
                        />
                        <button
                          onClick={() => handleSaveDocExpiry(doc.key)}
                          className="px-3 py-1 rounded-xl bg-emerald-600 text-white text-xs font-black tap-active"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingDocType(null)}
                          className="px-2 py-1 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div className="pt-1.5 border-t border-[#EFEAE2]/60 flex items-center justify-end">
                        <button
                          onClick={() => {
                            setEditingDocType(doc.key);
                            setNewDocExpiry(doc.expiry || '');
                          }}
                          className="text-[11px] font-black text-[#F39E36] hover:underline flex items-center gap-1 tap-active"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Renew / Update Date</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ================= EDIT VEHICLE FORM ================= */}
          {isEditing && (
            <div className="p-4 bg-white rounded-3xl border-2 border-[#F39E36] shadow-xl space-y-3 animate-fade-in">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-sm font-black text-[#111827]">
                  Edit Vehicle Details
                </h4>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-xs font-bold text-gray-500 hover:text-gray-900"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-[10px] font-black text-[#8A8782] uppercase mb-1">Number Plate</label>
                  <input
                    type="text"
                    value={editForm.plate}
                    onChange={(e) => setEditForm({ ...editForm, plate: e.target.value })}
                    className="w-full bg-[#FAF8F5] border border-[#EFEAE2] rounded-xl px-3 py-1.5 font-black text-[#111827]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-black text-[#8A8782] uppercase mb-1">Brand</label>
                    <input
                      type="text"
                      value={editForm.brand}
                      onChange={(e) => setEditForm({ ...editForm, brand: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-[#EFEAE2] rounded-xl px-3 py-1.5 font-bold text-[#111827]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-[#8A8782] uppercase mb-1">Model</label>
                    <input
                      type="text"
                      value={editForm.model}
                      onChange={(e) => setEditForm({ ...editForm, model: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-[#EFEAE2] rounded-xl px-3 py-1.5 font-bold text-[#111827]"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-black text-[#8A8782] uppercase mb-1">Category</label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-[#EFEAE2] rounded-xl px-2 py-1.5 font-bold text-[#111827]"
                    >
                      <option value="Sedan">Sedan</option>
                      <option value="MUV">MUV</option>
                      <option value="SUV">SUV</option>
                      <option value="Hatchback">Hatchback</option>
                      <option value="Luxury">Luxury</option>
                      <option value="EV">EV</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#8A8782] uppercase mb-1">Fuel</label>
                    <select
                      value={editForm.fuel}
                      onChange={(e) => setEditForm({ ...editForm, fuel: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-[#EFEAE2] rounded-xl px-2 py-1.5 font-bold text-[#111827]"
                    >
                      <option value="Diesel">Diesel</option>
                      <option value="CNG + Petrol">CNG + Petrol</option>
                      <option value="Petrol">Petrol</option>
                      <option value="Electric">Electric</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#8A8782] uppercase mb-1">Seats</label>
                    <input
                      type="number"
                      value={editForm.seats}
                      onChange={(e) => setEditForm({ ...editForm, seats: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-[#EFEAE2] rounded-xl px-2 py-1.5 font-bold text-[#111827]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-black text-[#8A8782] uppercase mb-1">Ownership</label>
                    <select
                      value={editForm.ownership}
                      onChange={(e) => setEditForm({ ...editForm, ownership: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-[#EFEAE2] rounded-xl px-2 py-1.5 font-bold text-[#111827]"
                    >
                      <option value="Own">Own Fleet</option>
                      <option value="Attached">Attached / Market</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-[#8A8782] uppercase mb-1">Assigned Driver</label>
                    <select
                      value={editForm.assignedDriverId}
                      onChange={(e) => setEditForm({ ...editForm, assignedDriverId: e.target.value })}
                      className="w-full bg-[#FAF8F5] border border-[#EFEAE2] rounded-xl px-2 py-1.5 font-bold text-[#111827]"
                    >
                      <option value="">-- No Driver --</option>
                      {drivers.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-2xl bg-[#111827] text-white font-black text-xs tap-active flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Save className="w-3.5 h-3.5 text-[#DDF262]" />
                  <span>Save Vehicle Updates</span>
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Sticky Action Footer */}
        <div className="p-3.5 bg-white border-t border-[#EFEAE2] flex items-center gap-2 shrink-0">
          <button
            onClick={handleBookThisCar}
            className="flex-1 py-3 rounded-2xl bg-[#111827] text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-soft hover:bg-black tap-active"
          >
            <Plus className="w-4 h-4 text-[#DDF262]" />
            <span>+ Book This Car</span>
          </button>

          <button
            onClick={() => setServiceModalVehicle(vehicle)}
            className="px-4 py-3 rounded-2xl bg-white border border-[#EFEAE2] text-[#111827] text-xs font-black flex items-center justify-center gap-1.5 hover:bg-gray-50 tap-active shadow-xs"
          >
            <Wrench className="w-4 h-4 text-[#F39E36]" />
            <span>Service</span>
          </button>
        </div>
      </div>
    </div>,
    getModalPortalRoot()
  );
};
