import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { getModalPortalRoot } from '../../lib/modalContainer';
import { useApp } from '../../context/AppContext';
import { modalStack } from '../../services/modalStack';
import { sendWhatsAppMessage } from '../../services/sharingService';
import {
  X,
  Users,
  Building,
  Phone,
  MessageSquare,
  Calendar,
  CreditCard,
  MapPin,
  FileText,
  Navigation,
  ArrowRight,
  CheckCircle2,
  Clock,
  Car,
  Receipt,
  UserCheck,
  ChevronRight,
  ExternalLink,
  Edit3,
  Trash2,
  Save,
  RotateCcw
} from 'lucide-react';

export const CustomerDetailModal = ({ customer, onClose }) => {
  const {
    bookings,
    updateCustomer,
    deleteCustomer,
    formatCurrency,
    formatPhoneNumber,
    openNewBookingWithPrefill,
    setCustomerSettlementData,
    setSelectedTripDetailBooking,
    setSelectedInvoiceBooking,
    setWhatsAppData,
    setSelectedCorporateCustomer
  } = useApp();

  const [tripFilter, setTripFilter] = useState('All'); // 'All' | 'Completed' | 'Ongoing' | 'Confirmed' | 'Cancelled'
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    whatsapp: customer?.whatsapp || customer?.phone || '',
    type: customer?.type || 'Personal',
    gstin: customer?.gstin || '',
    contactPerson: customer?.contactPerson || '',
    notes: customer?.notes || '',
    address: customer?.address || ''
  });

  if (!customer) return null;

  // Register with modalStack for Android Back Button
  useEffect(() => {
    modalStack.push('customer_detail_modal', onClose);
    return () => {
      modalStack.remove('customer_detail_modal');
    };
  }, [onClose]);

  // Filter bookings associated with this customer by relational customerId, or name/phone fallback
  const customerTrips = bookings.filter(b =>
    (b.customerId && customer.id && b.customerId === customer.id) ||
    (b.customerName && b.customerName.toLowerCase() === customer.name.toLowerCase()) ||
    (b.customerPhone && customer.phone && b.customerPhone.replace(/\D/g, '').slice(-10) === customer.phone.replace(/\D/g, '').slice(-10))
  );

  // Financial calculations from actual trips
  const totalBilled = customerTrips
    .filter(b => b.status !== 'Cancelled')
    .reduce((sum, b) => sum + Number(b.totalFare || 0), 0);

  const completedTripsCount = customerTrips.filter(b => b.status === 'Completed').length;
  const ongoingTripsCount = customerTrips.filter(b => b.status === 'Ongoing' || b.status === 'Driver Assigned' || b.status === 'Confirmed').length;

  const filteredTrips = customerTrips.filter(b => {
    if (tripFilter === 'All') return true;
    if (tripFilter === 'Ongoing') return b.status === 'Ongoing' || b.status === 'Driver Assigned' || b.status === 'Confirmed';
    return b.status === tripFilter;
  });

  const handleBookNewTrip = () => {
    onClose();
    openNewBookingWithPrefill({
      customerName: customer.name,
      customerPhone: customer.phone,
      pickupLocation: customer.address || ''
    });
  };

  const handleSettleDue = () => {
    onClose();
    setCustomerSettlementData(customer);
  };

  const handleOpenTrip = (trip) => {
    onClose();
    setSelectedTripDetailBooking(trip);
  };

  const handleViewInvoice = (trip, e) => {
    e.stopPropagation();
    onClose();
    setSelectedInvoiceBooking(trip);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editForm.name.trim() || !editForm.phone.trim()) {
      alert("Customer name and phone number are required.");
      return;
    }

    updateCustomer(customer.id, editForm);
    setIsEditing(false);
    setSaveSuccessMsg('🎉 Customer profile updated successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 3500);
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete customer "${customer.name}"? This action cannot be undone.`)) {
      deleteCustomer(customer.id);
      onClose();
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] modal-center-backdrop p-3">
      <div className="modal-card-center bg-[#F8F6F0] w-full max-w-[440px] rounded-3xl sm:rounded-4xl max-h-[88vh] flex flex-col shadow-2xl border-2 border-[#E5DFD3] overflow-hidden">
        {/* Header */}
        <div className="bg-white px-5 py-3.5 border-b border-[#E5DFD3] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-900 flex items-center justify-center font-black shadow-xs">
              {customer.type === 'Corporate' ? <Building className="w-5 h-5" /> : <Users className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-[#111827]">{customer.name}</h3>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                  customer.type === 'Corporate'
                    ? 'bg-purple-100 text-purple-900 border-purple-300'
                    : 'bg-blue-100 text-blue-900 border-blue-300'
                }`}>
                  {customer.type || 'Personal'}
                </span>
              </div>
              <p className="text-xs text-[#4B5563] font-semibold mt-0.5">
                📞 {formatPhoneNumber(customer.phone)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setEditForm({
                  name: customer.name || '',
                  phone: customer.phone || '',
                  whatsapp: customer.whatsapp || customer.phone || '',
                  type: customer.type || 'Personal',
                  gstin: customer.gstin || '',
                  contactPerson: customer.contactPerson || '',
                  notes: customer.notes || '',
                  address: customer.address || ''
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
              <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
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
                    Edit Customer Details
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-xs font-black text-red-600 hover:text-red-700 flex items-center gap-1 tap-active"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Party</span>
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-black text-[#111827] block mb-1">
                    Customer / Party Name *
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
                      Customer Type
                    </label>
                    <select
                      value={editForm.type}
                      onChange={e => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full bg-[#F8F6F0] border-2 border-[#E5DFD3] rounded-2xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#111827]"
                    >
                      <option value="Personal">Personal Party</option>
                      <option value="Corporate">Corporate / B2B</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-black text-[#111827] block mb-1">
                      GSTIN (Optional)
                    </label>
                    <input
                      type="text"
                      value={editForm.gstin}
                      onChange={e => setEditForm(prev => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                      placeholder="e.g. 27AAACT2941E1Z3"
                      className="w-full bg-[#F8F6F0] border-2 border-[#E5DFD3] rounded-2xl px-3 py-2 text-xs font-mono font-bold text-[#111827] focus:outline-none focus:border-[#111827]"
                    />
                  </div>
                </div>

                {editForm.type === 'Corporate' && (
                  <div>
                    <label className="text-xs font-black text-[#111827] block mb-1">
                      Contact Person & Designation
                    </label>
                    <input
                      type="text"
                      value={editForm.contactPerson}
                      onChange={e => setEditForm(prev => ({ ...prev, contactPerson: e.target.value }))}
                      placeholder="e.g. Priya Sharma (HR Manager)"
                      className="w-full bg-[#F8F6F0] border-2 border-[#E5DFD3] rounded-2xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#111827]"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-black text-[#111827] block mb-1">
                    Pickup Address / Headquarters
                  </label>
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={e => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                    placeholder="e.g. Kothrud, Pune"
                    className="w-full bg-[#F8F6F0] border-2 border-[#E5DFD3] rounded-2xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#111827]"
                  />
                </div>

                <div>
                  <label className="text-xs font-black text-[#111827] block mb-1">
                    Customer Preferences & Notes
                  </label>
                  <textarea
                    rows={2}
                    value={editForm.notes}
                    onChange={e => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="e.g. Always requests Innova Crysta, pays within 7 days."
                    className="w-full bg-[#F8F6F0] border-2 border-[#E5DFD3] rounded-2xl px-3 py-2 text-xs font-bold text-[#111827] focus:outline-none focus:border-[#111827]"
                  />
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
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          ) : (
            /* ===================================================== */
            /* VIEW MODE */
            /* ===================================================== */
            <>
              {/* Quick Metrics Grid */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-white rounded-2xl p-3 border-2 border-[#E5DFD3] shadow-xs">
                  <span className="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider block">
                    Total Bookings
                  </span>
                  <span className="text-lg font-black text-[#111827] mt-0.5 block">
                    {customerTrips.length}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">
                    {completedTripsCount} Completed
                  </span>
                </div>

                <div className="bg-white rounded-2xl p-3 border-2 border-[#E5DFD3] shadow-xs">
                  <span className="text-[10px] font-bold text-[#4B5563] uppercase tracking-wider block">
                    Lifetime Spend
                  </span>
                  <span className="text-lg font-black text-[#111827] mt-0.5 block">
                    {formatCurrency(totalBilled)}
                  </span>
                  <span className="text-[10px] text-blue-700 font-bold">
                    Gross Billed
                  </span>
                </div>

                <div className={`rounded-2xl p-3 border-2 shadow-xs ${
                  customer.pendingBalance > 0
                    ? 'bg-rose-50 border-rose-300 text-rose-950'
                    : 'bg-emerald-50 border-emerald-300 text-emerald-950'
                }`}>
                  <span className="text-[10px] font-bold uppercase tracking-wider block">
                    Pending Balance
                  </span>
                  <span className={`text-lg font-black mt-0.5 block ${
                    customer.pendingBalance > 0 ? 'text-rose-700' : 'text-emerald-700'
                  }`}>
                    {formatCurrency(customer.pendingBalance || 0)}
                  </span>
                  <span className="text-[10px] font-bold">
                    {customer.pendingBalance > 0 ? '⚠️ Due Pending' : '✓ All Cleared'}
                  </span>
                </div>
              </div>

              {/* Customer Address & Business Notes */}
              <div className="bg-white rounded-3xl p-4 border-2 border-[#E5DFD3] space-y-2.5 shadow-xs">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-[#111827] uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#EA580C]" />
                    <span>Contact & Billing Information</span>
                  </h4>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                  >
                    <span>Edit</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs text-[#374151]">
                  {customer.address ? (
                    <div className="flex items-start gap-2 bg-[#F8F6F0] p-2.5 rounded-xl border border-[#E5DFD3]">
                      <span className="font-bold text-gray-500 shrink-0">Address:</span>
                      <span className="font-semibold">{customer.address}</span>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-500 italic">No address registered.</p>
                  )}

                  {customer.gstin && (
                    <div className="flex items-center gap-2 bg-[#F8F6F0] p-2.5 rounded-xl border border-[#E5DFD3] font-mono">
                      <span className="font-bold text-gray-500 font-sans">GSTIN:</span>
                      <span className="font-bold text-[#111827]">{customer.gstin}</span>
                    </div>
                  )}

                  {customer.contactPerson && (
                    <div className="flex items-center gap-2 bg-[#F8F6F0] p-2.5 rounded-xl border border-[#E5DFD3]">
                      <span className="font-bold text-gray-500">Contact Person:</span>
                      <span className="font-bold text-[#111827]">{customer.contactPerson}</span>
                    </div>
                  )}

                  {customer.notes && (
                    <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-950 font-semibold text-[11px]">
                      <b>Note:</b> {customer.notes}
                    </div>
                  )}

                  {/* Direct Action Links */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <a
                      href={`tel:${customer.phone}`}
                      className="py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#111827] text-xs font-black flex items-center justify-center gap-1.5 tap-active"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Call Customer</span>
                    </a>

                    <button
                      onClick={() => setWhatsAppData({
                        type: customer.pendingBalance > 0 ? 'reminder' : 'booking',
                        customer: customer,
                        targetName: customer.name,
                        targetPhone: customer.phone,
                        booking: { customerName: customer.name, customerPhone: customer.phone, pickupLocation: customer.address, id: 'ENQUIRY' }
                      })}
                      className="py-2 px-3 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 text-emerald-950 text-xs font-black flex items-center justify-center gap-1.5 tap-active"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                      <span>{customer.pendingBalance > 0 ? 'Dues WhatsApp' : 'WhatsApp'}</span>
                    </button>
                  </div>

                  {/* Corporate Monthly Consolidated Invoicing Trigger */}
                  {customer.type === 'Corporate' && (
                    <div className="pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          setSelectedCorporateCustomer(customer);
                        }}
                        className="w-full py-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-950 text-xs font-black flex items-center justify-center gap-2 tap-active shadow-xs"
                      >
                        <FileText className="w-4 h-4 text-purple-700" />
                        <span>Generate B2B Monthly Consolidated Bill</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* ===================================================== */}
          {/* CUSTOMER BOOKING HISTORY */}
          {/* ===================================================== */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black text-[#111827] uppercase tracking-wider">
                Trip History ({customerTrips.length})
              </h4>

              {/* Filter Tabs */}
              <div className="flex bg-white p-1 rounded-full border-2 border-[#E5DFD3] text-[10px] font-black shadow-xs">
                {['All', 'Ongoing', 'Completed'].map(f => (
                  <button
                    key={f}
                    onClick={() => setTripFilter(f)}
                    className={`px-2.5 py-0.5 rounded-full transition-all ${
                      tripFilter === f
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
                <h5 className="text-xs font-black text-[#111827]">No Trips Found</h5>
                <p className="text-[11px] text-[#4B5563] font-semibold">
                  This party does not have any trips matching the "{tripFilter}" filter.
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

                      {/* Route */}
                      <div className="text-xs font-bold text-[#111827] flex items-center gap-1.5">
                        <span className="truncate">{trip.pickupLocation}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                        <span className="truncate text-gray-600">{trip.dropLocation}</span>
                      </div>

                      {/* Details row: Car, Driver, Date */}
                      <div className="flex items-center justify-between text-[11px] text-[#4B5563] pt-1 border-t border-gray-100 font-semibold">
                        <div className="flex items-center gap-2 truncate">
                          <span>📅 {new Date(trip.startDateTime || trip.createdAt).toLocaleDateString([], { day: 'numeric', month: 'short' })}</span>
                          <span>•</span>
                          <span className="truncate">🚘 {trip.vehiclePlate?.split(' ')[0] || 'Assigned Car'}</span>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-[#111827] block">
                            {formatCurrency(trip.totalFare)}
                          </span>
                          {trip.balancePending > 0 ? (
                            <span className="text-[10px] font-bold text-rose-600">
                              {formatCurrency(trip.balancePending)} Due
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700">
                              Paid in Full
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Quick Actions Footer inside trip card */}
                      <div className="flex items-center justify-between pt-1 border-t border-dashed border-gray-200 text-[11px]">
                        <span className="text-[#EA580C] font-black group-hover:underline flex items-center gap-0.5">
                          <span>View Full Trip Dossier</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>

                        <button
                          type="button"
                          onClick={(e) => handleViewInvoice(trip, e)}
                          className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-[#111827] rounded-md font-bold flex items-center gap-1 text-[10px]"
                        >
                          <Receipt className="w-3 h-3 text-[#EA580C]" />
                          <span>Tax Invoice</span>
                        </button>
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

          <div className="flex items-center space-x-2">
            {customer.pendingBalance > 0 && (
              <button
                onClick={handleSettleDue}
                className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1 shadow-sm tap-active cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Settle ₹{customer.pendingBalance} Due</span>
              </button>
            )}

            <button
              onClick={handleBookNewTrip}
              className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#111827] hover:bg-black text-white text-xs font-black flex items-center gap-1.5 shadow-md tap-active cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-[#D4F05B]" />
              <span>Book Trip</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    getModalPortalRoot()
  );
};
