import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { getModalPortalRoot } from '../../lib/modalContainer';
import { useApp } from '../../context/AppContext';
import {
  X,
  UserCheck,
  Phone,
  MessageSquare,
  Calendar,
  CreditCard,
  MapPin,
  ShieldCheck,
  AlertCircle,
  Navigation,
  ArrowRight,
  Car,
  ChevronRight,
  Receipt,
  User,
  Gauge,
  Wallet,
  Edit3,
  Trash2,
  Save,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const DriverDetailModal = ({ driver, onClose }) => {
  const {
    bookings,
    updateDriver,
    deleteDriver,
    formatCurrency,
    formatPhoneNumber,
    setSelectedTripDetailBooking,
    setRenewalModalData,
    setWhatsAppData
  } = useApp();

  const [dutyFilter, setDutyFilter] = useState('All'); // 'All' | 'Completed' | 'Ongoing'
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: driver?.name || '',
    phone: driver?.phone || '',
    whatsapp: driver?.whatsapp || driver?.phone || '',
    dlNumber: driver?.dlNumber || '',
    dlExpiry: driver?.dlExpiry || '2028-01-01',
    payoutType: driver?.payoutType || 'Salary',
    monthlySalary: driver?.monthlySalary || 18000,
    commissionRate: driver?.commissionRate || 3,
    emergencyContact: driver?.emergencyContact || '',
    status: driver?.status || 'Available'
  });

  if (!driver) return null;

  // Filter bookings assigned to this driver by ID or name
  const driverTrips = bookings.filter(b =>
    (b.driverId && b.driverId === driver.id) ||
    (b.driverName && b.driverName.toLowerCase().includes(driver.name.toLowerCase()))
  );

  const completedTrips = driverTrips.filter(b => b.status === 'Completed');
  const ongoingTrips = driverTrips.filter(b => b.status === 'Ongoing' || b.status === 'Driver Assigned' || b.status === 'Confirmed');

  const totalKmDriven = driverTrips
    .filter(b => b.status === 'Completed')
    .reduce((sum, b) => sum + Number(b.actualKm || b.estimatedKm || 120), 0);

  const totalBataEarned = driverTrips
    .filter(b => b.status !== 'Cancelled')
    .reduce((sum, b) => sum + Number(b.driverBata || 400), 0);

  const filteredTrips = driverTrips.filter(b => {
    if (dutyFilter === 'All') return true;
    if (dutyFilter === 'Ongoing') return b.status === 'Ongoing' || b.status === 'Driver Assigned' || b.status === 'Confirmed';
    return b.status === dutyFilter;
  });

  // Calculate DL expiry urgency
  const today = new Date();
  const dlExp = driver.dlExpiry ? new Date(driver.dlExpiry) : new Date('2028-01-01');
  const daysUntilExpiry = Math.ceil((dlExp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isDlUrgent = daysUntilExpiry <= 30;

  const handleOpenTrip = (trip) => {
    onClose();
    setSelectedTripDetailBooking(trip);
  };

  const handleRenewDl = () => {
    onClose();
    setRenewalModalData({
      type: 'Driver DL',
      title: `Renew Driver's License — ${driver.name}`,
      entityId: driver.id,
      entityName: driver.name,
      currentExpiry: driver.dlExpiry,
      docType: 'Driver License (DL)'
    });
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.phone.trim()) {
      alert("Driver name and phone number are required.");
      return;
    }

    updateDriver(driver.id, editForm);
    setIsEditing(false);
    setSaveSuccessMsg('🎉 Driver details updated successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 3500);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to remove driver "${driver.name}" from fleet records?`)) {
      deleteDriver(driver.id);
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] modal-center-backdrop p-3">
      <div className="modal-card-center bg-[#F8F6F0] w-full max-w-[440px] rounded-3xl sm:rounded-4xl max-h-[88vh] flex flex-col shadow-2xl border-2 border-[#E5DFD3] overflow-hidden">
        {/* Header */}
        <div className="bg-white px-5 py-4 border-b border-[#E5DFD3] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-black shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[#111827]">{driver.name}</h3>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                  driver.status === 'On Trip'
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300 animate-pulse'
                    : driver.status === 'Leave'
                    ? 'bg-rose-100 text-rose-900 border-rose-300'
                    : 'bg-gray-100 text-gray-800 border-gray-300'
                }`}>
                  {driver.status || 'Available'}
                </span>
              </div>
              <p className="text-xs text-[#4B5563] font-semibold mt-0.5">
                📞 {formatPhoneNumber(driver.phone)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setEditForm({
                  name: driver.name || '',
                  phone: driver.phone || '',
                  whatsapp: driver.whatsapp || driver.phone || '',
                  dlNumber: driver.dlNumber || '',
                  dlExpiry: driver.dlExpiry || '2028-01-01',
                  payoutType: driver.payoutType || 'Salary',
                  monthlySalary: driver.monthlySalary || 18000,
                  commissionRate: driver.commissionRate || 3,
                  emergencyContact: driver.emergencyContact || '',
                  status: driver.status || 'Available'
                });
                setIsEditing(!isEditing);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 transition tap-active shadow-xs cursor-pointer ${
                isEditing
                  ? 'bg-amber-100 text-amber-950 border border-amber-300'
                  : 'bg-gray-100 text-[#111827] hover:bg-gray-200 border border-[#E5DFD3]'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Driver'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 space-y-4 smooth-scroll-container">
          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-emerald-950 text-xs font-black flex items-center space-x-2 animate-fade-in shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* ===================================================== */}
          {/* EDIT FORM MODE */}
          {/* ===================================================== */}
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="bg-white rounded-3xl p-5 border-2 border-amber-300 shadow-soft space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <div className="flex items-center space-x-2">
                  <Edit3 className="w-4 h-4 text-amber-600" />
                  <h4 className="text-xs font-black text-[#111827] uppercase tracking-wider">
                    Edit Driver Details
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-xs font-black text-red-600 hover:text-red-700 flex items-center gap-1 tap-active"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Driver</span>
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-black text-[#111827] block mb-1">
                    Driver Full Name *
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={e => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-[#F8F6F0] border-2 border-[#E5DFD3] rounded-2xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#111827]"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-black text-[#111827] block mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      value={editForm.phone}
                      onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full bg-[#F8F6F0] border-2 border-[#E5DFD3] rounded-2xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#111827]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-[#111827] block mb-1">
                      WhatsApp Number
                    </label>
                    <input
                      type="text"
                      value={editForm.whatsapp}
                      onChange={e => setEditForm(prev => ({ ...prev, whatsapp: e.target.value }))}
                      className="w-full bg-[#F8F6F0] border-2 border-[#E5DFD3] rounded-2xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#111827]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-black text-[#111827] block mb-1">
                      License (DL) Number
                    </label>
                    <input
                      type="text"
                      value={editForm.dlNumber}
                      onChange={e => setEditForm(prev => ({ ...prev, dlNumber: e.target.value.toUpperCase() }))}
                      placeholder="e.g. MH12 20180012345"
                      className="w-full bg-[#F8F6F0] border-2 border-[#E5DFD3] rounded-2xl px-3 py-2 text-xs font-mono font-bold text-[#111827] focus:outline-none focus:border-[#111827]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-[#111827] block mb-1">
                      License Expiry Date
                    </label>
                    <input
                      type="date"
                      value={editForm.dlExpiry}
                      onChange={e => setEditForm(prev => ({ ...prev, dlExpiry: e.target.value }))}
                      className="w-full bg-[#F8F6F0] border-2 border-[#E5DFD3] rounded-2xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#111827]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-black text-[#111827] block mb-1">
                      Payout Scheme
                    </label>
                    <select
                      value={editForm.payoutType}
                      onChange={e => setEditForm(prev => ({ ...prev, payoutType: e.target.value }))}
                      className="w-full bg-[#F8F6F0] border-2 border-[#E5DFD3] rounded-2xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#111827]"
                    >
                      <option value="Salary">Monthly Salary</option>
                      <option value="Commission">Commission Per KM</option>
                      <option value="Attached">Attached / Freelance</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-black text-[#111827] block mb-1">
                      {editForm.payoutType === 'Salary' ? 'Monthly Salary (₹)' : 'Rate / KM (₹)'}
                    </label>
                    <input
                      type="number"
                      value={editForm.payoutType === 'Salary' ? editForm.monthlySalary : editForm.commissionRate}
                      onChange={e => {
                        const val = Number(e.target.value);
                        if (editForm.payoutType === 'Salary') {
                          setEditForm(prev => ({ ...prev, monthlySalary: val }));
                        } else {
                          setEditForm(prev => ({ ...prev, commissionRate: val }));
                        }
                      }}
                      className="w-full bg-[#F8F6F0] border-2 border-[#E5DFD3] rounded-2xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#111827]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-xs font-black text-[#111827] block mb-1">
                      Duty Availability Status
                    </label>
                    <select
                      value={editForm.status}
                      onChange={e => setEditForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full bg-[#F8F6F0] border-2 border-[#E5DFD3] rounded-2xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#111827]"
                    >
                      <option value="Available">🟢 Available (Ready for Duty)</option>
                      <option value="On Trip">🟡 On Trip</option>
                      <option value="Leave">🔴 On Leave</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-black text-[#111827] block mb-1">
                      Emergency SOS Contact
                    </label>
                    <input
                      type="text"
                      value={editForm.emergencyContact}
                      onChange={e => setEditForm(prev => ({ ...prev, emergencyContact: e.target.value }))}
                      placeholder="e.g. 98901 99999 (Brother)"
                      className="w-full bg-[#F8F6F0] border-2 border-[#E5DFD3] rounded-2xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#111827]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2.5 rounded-full bg-gray-100 text-[#4B5563] text-xs font-black hover:bg-gray-200 tap-active"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 rounded-full bg-[#111827] hover:bg-black text-white text-xs font-black shadow-md flex items-center justify-center gap-1.5 tap-active"
                >
                  <Save className="w-3.5 h-3.5 text-[#D4F05B]" />
                  <span>Save Driver Profile</span>
                </button>
              </div>
            </form>
          ) : (
            /* ===================================================== */
            /* VIEW MODE */
            /* ===================================================== */
            <>
              {/* Performance & Payout Summary */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-white rounded-2xl p-3 border-2 border-[#E5DFD3] shadow-xs">
                  <span className="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider block">
                    Trips Driven
                  </span>
                  <span className="text-lg font-black text-[#111827] mt-0.5 block">
                    {driverTrips.length}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    {completedTrips.length} Completed
                  </span>
                </div>

                <div className="bg-white rounded-2xl p-3 border-2 border-[#E5DFD3] shadow-xs">
                  <span className="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider block">
                    Odometer KM
                  </span>
                  <span className="text-lg font-black text-[#111827] mt-0.5 block">
                    {totalKmDriven.toLocaleString()} KM
                  </span>
                  <span className="text-[10px] text-blue-700 font-bold">
                    Logged on Road
                  </span>
                </div>

                <div className="bg-white rounded-2xl p-3 border-2 border-[#E5DFD3] shadow-xs">
                  <span className="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider block">
                    Driver Bata / Payout
                  </span>
                  <span className="text-lg font-black text-amber-900 mt-0.5 block">
                    {formatCurrency(totalBataEarned)}
                  </span>
                  <span className="text-[10px] text-amber-800 font-bold">
                    {driver.payoutType || 'Salary'}
                  </span>
                </div>
              </div>

              {/* Compliance & License Status Card */}
              <div className="bg-white rounded-3xl p-4 border-2 border-[#E5DFD3] space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Driving License Compliance</span>
                  </h4>

                  <span className="text-xs font-mono font-black text-[#111827] bg-[#F8F6F0] px-2.5 py-1 rounded-xl border border-[#E5DFD3]">
                    {driver.dlNumber || 'MH12 20180099881'}
                  </span>
                </div>

                <div className="bg-[#F8F6F0] p-3 rounded-2xl border border-[#E5DFD3] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-[#4B5563] font-bold block">License Expiry Date</span>
                    <span className="text-xs font-black text-[#111827]">
                      📅 {driver.dlExpiry || '2028-01-01'}
                    </span>
                  </div>

                  <div className="text-right">
                    {isDlUrgent ? (
                      <span className="text-[10px] font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300">
                        ⚠️ Expiring Soon ({daysUntilExpiry} days)
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                        ✓ Active & Verified
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-[#F8F6F0] p-2.5 rounded-xl border border-[#E5DFD3]">
                    <span className="text-[10px] text-[#4B5563] font-bold block">Salary / Compensation</span>
                    <span className="font-black text-[#111827]">
                      {driver.payoutType === 'Salary'
                        ? `₹${driver.monthlySalary || 18000}/mo`
                        : `₹${driver.commissionRate || 3}/km Commission`}
                    </span>
                  </div>

                  <div className="bg-[#F8F6F0] p-2.5 rounded-xl border border-[#E5DFD3]">
                    <span className="text-[10px] text-[#4B5563] font-bold block">Emergency SOS Contact</span>
                    <span className="font-bold text-[#111827] truncate block">
                      {formatPhoneNumber(driver.emergencyContact || '+91 98220 01122')}
                    </span>
                  </div>
                </div>

                {/* Direct Action Links */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <a
                    href={`tel:${driver.phone}`}
                    className="py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-black flex items-center justify-center gap-1.5 tap-active"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Call Driver</span>
                  </a>

                  <button
                    onClick={() => setWhatsAppData({ type: 'booking', booking: { driverName: driver.name, driverPhone: driver.phone, id: 'DUTY' } })}
                    className="py-2 px-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-emerald-950 text-xs font-black flex items-center justify-center gap-1.5 tap-active"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                    <span>WhatsApp Duty</span>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ===================================================== */}
          {/* DRIVER DUTY & TRIP HISTORY */}
          {/* ===================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-[#111827] uppercase tracking-wider">
                Duty History ({driverTrips.length})
              </h4>

              {/* Filter Tabs */}
              <div className="flex bg-white p-1 rounded-full border-2 border-[#E5DFD3] text-[10px] font-black shadow-xs">
                {['All', 'Ongoing', 'Completed'].map(f => (
                  <button
                    key={f}
                    onClick={() => setDutyFilter(f)}
                    className={`px-2.5 py-0.5 rounded-full transition-all ${
                      dutyFilter === f
                        ? 'bg-[#111827] text-white shadow-xs'
                        : 'text-[#4B5563] hover:text-[#111827]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {filteredTrips.length === 0 ? (
              <div className="bg-white rounded-3xl p-6 border-2 border-[#E5DFD3] text-center space-y-2 shadow-xs">
                <Calendar className="w-8 h-8 text-gray-400 mx-auto" />
                <h5 className="text-xs font-black text-[#111827]">No Duties Found</h5>
                <p className="text-[11px] text-[#4B5563] font-semibold">
                  This driver has not been assigned to any duties in "{dutyFilter}".
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredTrips.map(trip => {
                  const isCompleted = trip.status === 'Completed';
                  const isOngoing = trip.status === 'Ongoing' || trip.status === 'Driver Assigned' || trip.status === 'Confirmed';
                  const isCancelled = trip.status === 'Cancelled';

                  return (
                    <div
                      key={trip.id}
                      onClick={() => handleOpenTrip(trip)}
                      className="bg-white rounded-2xl p-3.5 border-2 border-[#E5DFD3] hover:border-[#111827] cursor-pointer transition-all space-y-2 shadow-xs group"
                    >
                      {/* Top Bar: Trip ID, Type & Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-black text-xs text-[#111827] group-hover:text-blue-600">
                            {trip.id}
                          </span>
                          <span className="text-[10px] bg-[#F8F6F0] text-[#374151] font-black px-2 py-0.5 rounded-full border border-[#E5DFD3]">
                            {trip.tripType || 'Outstation'}
                          </span>
                        </div>

                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : isOngoing
                            ? 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse'
                            : isCancelled
                            ? 'bg-rose-50 text-rose-800 border-rose-300'
                            : 'bg-blue-50 text-blue-900 border-blue-300'
                        }`}>
                          {trip.status}
                        </span>
                      </div>

                      {/* Customer & Route */}
                      <div className="text-xs font-bold text-[#111827] flex items-center justify-between">
                        <span className="truncate">👤 {trip.customerName}</span>
                        <span className="text-[11px] text-gray-500 font-semibold">{trip.vehiclePlate?.split(' ')[0]}</span>
                      </div>

                      <div className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                        <span className="truncate">{trip.pickupLocation}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate">{trip.dropLocation}</span>
                      </div>

                      {/* Metrics: KM + Bata */}
                      <div className="flex items-center justify-between text-[11px] text-[#4B5563] pt-1 border-t border-gray-100 font-semibold">
                        <div className="flex items-center gap-2">
                          <span>📅 {new Date(trip.startDateTime || trip.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}</span>
                          <span>•</span>
                          <span>🛣️ {trip.actualKm || trip.estimatedKm || 120} KM</span>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-black text-amber-900 block">
                            Bata: {formatCurrency(trip.driverBata || 400)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="bg-white p-4 border-t border-[#E5DFD3] flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-gray-100 hover:bg-gray-200 text-[#374151] text-xs font-bold tap-active cursor-pointer"
          >
            Close
          </button>

          <button
            onClick={handleRenewDl}
            className="px-5 py-2.5 rounded-full bg-white border-2 border-[#111827] text-[#111827] text-xs font-black flex items-center gap-1.5 hover:bg-gray-50 shadow-sm tap-active cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Renew License Document</span>
          </button>
        </div>
      </div>
    </div>,
    getModalPortalRoot()
  );
};
