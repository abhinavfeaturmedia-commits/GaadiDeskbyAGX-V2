import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  User,
  ShieldCheck,
  Phone,
  AlertTriangle,
  Languages,
  LogOut,
  Car,
  Building,
  CheckCircle2,
  Calendar
} from 'lucide-react';

export const DriverProfile = () => {
  const {
    authUser,
    drivers,
    business,
    getDriverVehicle,
    language,
    toggleLanguage,
    logoutUser,
    t
  } = useApp();

  const driverId = authUser?.driverId;
  const currentDriver = drivers.find(d => d.id === driverId) || {
    name: authUser?.name || 'Driver',
    phone: authUser?.phone || '+91 98901 44321',
    dlNumber: 'MH12 20140028912',
    dlExpiry: '2028-04-14',
    payoutType: 'Salary',
    monthlySalary: 18000,
    emergencyContact: '+91 98901 99999 (Brother)'
  };

  const assignedVehicle = getDriverVehicle(driverId);

  // Check DL expiry days
  const today = new Date();
  const dlExp = currentDriver.dlExpiry ? new Date(currentDriver.dlExpiry) : new Date('2028-01-01');
  const diffDays = Math.ceil((dlExp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = diffDays <= 30;

  return (
    <div className="space-y-4 animate-fade-in pb-4">
      {/* Driver Header Profile Card */}
      <div className="bg-white rounded-3xl p-5 border-2 border-[#E5DFD3] shadow-soft space-y-4 text-center">
        <div className="relative w-20 h-20 mx-auto">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-emerald-500 shadow-md bg-emerald-100 flex items-center justify-center font-black text-2xl text-emerald-950">
            {currentDriver.name?.charAt(0) || 'D'}
          </div>
          <div className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs shadow-xs">
            ✓
          </div>
        </div>

        <div>
          <h2 className="text-lg font-black text-[#111827]">{currentDriver.name}</h2>
          <p className="text-xs text-[#4B5563] font-semibold">{currentDriver.phone}</p>
          <span className="inline-block mt-1.5 text-[10px] font-black bg-emerald-100 text-emerald-900 border border-emerald-300 px-3 py-0.5 rounded-full">
            Verified Fleet Driver • {business.name || 'GaadiDesk Fleet'}
          </span>
        </div>
      </div>

      {/* Driver License & Compliance Card */}
      <div className="bg-white rounded-3xl p-5 border-2 border-[#E5DFD3] shadow-soft space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider">
              Driving License & Documents
            </h3>
          </div>
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
            isExpiringSoon
              ? 'bg-red-100 text-red-900 border border-red-300'
              : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
          }`}>
            {isExpiringSoon ? 'Expiring Soon' : 'Valid 🟢'}
          </span>
        </div>

        <div className="p-3 bg-[#F8F6F0] rounded-2xl border border-[#E5DFD3] space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-[#4B5563] font-bold">DL Number:</span>
            <span className="font-mono font-black text-[#111827]">{currentDriver.dlNumber || 'MH12 20140028912'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#4B5563] font-bold">Expiry Date:</span>
            <span className="font-black text-[#111827]">{currentDriver.dlExpiry || '2028-04-14'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#4B5563] font-bold">Payout Mode:</span>
            <span className="font-black text-emerald-700">{currentDriver.payoutType || 'Salary / Bata'}</span>
          </div>
        </div>

        {isExpiringSoon && (
          <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-[11px] font-bold text-red-900">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Your license is expiring in {diffDays} days. Please inform the fleet office to renew.</span>
          </div>
        )}
      </div>

      {/* Emergency & SOS Contacts Card */}
      <div className="bg-white rounded-3xl p-5 border-2 border-[#E5DFD3] shadow-soft space-y-3">
        <div className="flex items-center space-x-2">
          <Phone className="w-4 h-4 text-[#EA580C]" />
          <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider">
            {t('driverEmergencyContact')}
          </h3>
        </div>

        <div className="p-3 bg-[#F8F6F0] rounded-2xl border border-[#E5DFD3] space-y-1.5 text-xs">
          <div>
            <span className="text-[10px] text-[#4B5563] font-bold block">Personal Emergency Contact</span>
            <span className="font-black text-[#111827]">{currentDriver.emergencyContact || '+91 98901 99999 (Family)'}</span>
          </div>
          <div className="pt-1 border-t border-[#E5DFD3]">
            <span className="text-[10px] text-[#4B5563] font-bold block">Fleet Owner / Office Manager</span>
            <span className="font-black text-[#111827]">{business.ownerName || business.name || 'Fleet Office'} {business.phone ? `(${business.phone})` : ''}</span>
          </div>
        </div>
      </div>

      {/* Preferences & Logout */}
      <div className="space-y-2 pt-2">
        <button
          onClick={toggleLanguage}
          className="w-full py-3 rounded-full bg-white border-2 border-[#E5DFD3] hover:bg-gray-50 text-[#111827] font-black text-xs shadow-xs tap-active flex items-center justify-center space-x-2"
        >
          <Languages className="w-4 h-4 text-[#EA580C]" />
          <span>Switch App Language ({language === 'en' ? 'हिन्दी में बदलें' : 'Switch to English'})</span>
        </button>

        <button
          onClick={logoutUser}
          className="w-full py-3 rounded-full bg-red-50 hover:bg-red-100 border-2 border-red-200 text-red-900 font-black text-xs shadow-xs tap-active flex items-center justify-center space-x-2"
        >
          <LogOut className="w-4 h-4 text-red-600" />
          <span>Logout Driver Account</span>
        </button>
      </div>
    </div>
  );
};
