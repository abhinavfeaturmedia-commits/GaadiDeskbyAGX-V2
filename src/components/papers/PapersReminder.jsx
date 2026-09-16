import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  ShieldAlert,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  Calendar,
  Car,
  User,
  Plus,
  RefreshCw
} from 'lucide-react';

export const PapersReminder = () => {
  const { t, vehicles, drivers, getDocumentAlerts, getServiceAlerts, setRenewalModalData, setServiceModalVehicle } = useApp();
  const alerts = getDocumentAlerts();
  const serviceAlerts = getServiceAlerts ? getServiceAlerts() : [];

  return (
    <div className="space-y-4 pt-1 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-[#111827]">
          {t('expiryAlertTitle')}
        </h2>
        <p className="text-xs text-[#4B5563] font-semibold">
          Track Insurance, PUC, Fitness, Permits, DLs & Periodic Maintenance
        </p>
      </div>

      {/* Urgent Expiry Cards */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider">
          Urgent RTO Renewals (&lt; 30 Days)
        </h3>

        {alerts.length === 0 ? (
          <div className="bg-white rounded-3xl p-6 text-center border-2 border-[#E5DFD3] shadow-xs space-y-1.5">
            <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto" />
            <p className="text-xs font-black text-[#111827]">All Papers Up to Date!</p>
            <p className="text-[11px] text-[#4B5563] font-semibold">No vehicle or driver document is expiring in 30 days.</p>
          </div>
        ) : (
          alerts.map((alt, idx) => (
            <div
              key={idx}
              className={`rounded-3xl p-4 border-2 flex items-center justify-between shadow-xs ${
                alt.isExpired
                  ? 'bg-rose-50/90 border-rose-300'
                  : alt.isUrgent
                  ? 'bg-amber-50/90 border-amber-300'
                  : 'bg-yellow-50/80 border-yellow-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs ${
                    alt.isExpired
                      ? 'bg-rose-200 text-rose-900'
                      : alt.isUrgent
                      ? 'bg-amber-200 text-amber-900'
                      : 'bg-yellow-200 text-yellow-900'
                  }`}
                >
                  {alt.isExpired ? '⚠️' : '⏳'}
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#111827]">
                    {alt.driverName || alt.vehiclePlate}
                  </h4>
                  <p className="text-[11px] text-[#374151] font-bold">
                    {alt.docType} • Expiry: <b>{alt.expiryDate}</b>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span
                  className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                    alt.isExpired
                      ? 'bg-rose-200 text-rose-950 font-black'
                      : 'bg-white/90 text-[#111827] font-bold border border-[#E5DFD3]'
                  }`}
                >
                  {alt.isExpired ? 'EXPIRED' : `${alt.daysLeft}d left`}
                </span>

                <button
                  onClick={() => setRenewalModalData(alt)}
                  className="px-3 py-1.5 rounded-full bg-[#111827] text-white text-[10px] font-black shadow-xs hover:bg-black tap-active"
                >
                  Renew
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Periodic Maintenance & Service Alerts */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider flex items-center justify-between">
          <span>Periodic Mechanical Service Alerts</span>
          <span className="text-[10px] text-[#4B5563] font-bold">Odometer Threshold</span>
        </h3>

        {serviceAlerts.length === 0 ? (
          <div className="bg-white rounded-3xl p-4 text-center border-2 border-[#E5DFD3] shadow-xs">
            <p className="text-xs font-bold text-emerald-800">✅ All fleet mechanical services & oil changes are on track!</p>
          </div>
        ) : (
          serviceAlerts.map((sa, idx) => (
            <div
              key={idx}
              className={`rounded-3xl p-3.5 border-2 flex items-center justify-between shadow-xs ${
                sa.isOverdue ? 'bg-rose-50/90 border-rose-300' : 'bg-amber-50/90 border-amber-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs ${
                  sa.isOverdue ? 'bg-rose-200 text-rose-900' : 'bg-amber-200 text-amber-900'
                }`}>
                  🔧
                </div>
                <div>
                  <h4 className="text-xs font-black text-[#111827]">{sa.vehiclePlate}</h4>
                  <p className="text-[11px] text-[#374151] font-bold">
                    {sa.serviceType} • Odo: <b>{sa.currentOdometer.toLocaleString()} KM</b>
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                  sa.isOverdue ? 'bg-rose-200 text-rose-950' : 'bg-amber-200 text-amber-950'
                }`}>
                  {sa.isOverdue ? 'OVERDUE' : `${sa.kmRemaining.toLocaleString()} KM left`}
                </span>
                <button
                  onClick={() => {
                    const targetV = vehicles.find(v => v.id === sa.vehicleId);
                    if (targetV) setServiceModalVehicle(targetV);
                  }}
                  className="px-3 py-1.5 rounded-full bg-[#111827] text-white text-[10px] font-black shadow-xs hover:bg-black tap-active"
                >
                  Log Service
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Complete Vehicle Paper Inventory */}
      <div className="bg-white rounded-3xl p-4 border-2 border-[#E5DFD3] shadow-xs space-y-3">
        <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider">
          All Fleet Vehicles Paper Vault
        </h3>

        <div className="space-y-3">
          {vehicles.map(veh => (
            <div key={veh.id} className="p-3 bg-[#F8F6F0] rounded-2xl border border-[#E5DFD3] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Car className="w-4 h-4 text-[#111827]" />
                  <span className="text-xs font-black text-[#111827]">{veh.plate}</span>
                  <span className="text-[10px] text-[#4B5563] font-semibold">{veh.brand} {veh.model}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <div className="bg-white p-2 rounded-xl border border-[#E5DFD3] flex justify-between items-center">
                  <span className="text-[#4B5563] font-bold">Insurance:</span>
                  <span className="font-mono font-bold text-[#111827]">{veh.documents?.insuranceExpiry || 'N/A'}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-[#E5DFD3] flex justify-between items-center">
                  <span className="text-[#4B5563] font-bold">PUC:</span>
                  <span className="font-mono font-bold text-[#111827]">{veh.documents?.pucExpiry || 'N/A'}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-[#E5DFD3] flex justify-between items-center">
                  <span className="text-[#4B5563] font-bold">Fitness:</span>
                  <span className="font-mono font-bold text-[#111827]">{veh.documents?.fitnessExpiry || 'N/A'}</span>
                </div>
                <div className="bg-white p-2 rounded-xl border border-[#E5DFD3] flex justify-between items-center">
                  <span className="text-[#4B5563] font-bold">Permit:</span>
                  <span className="font-mono font-bold text-[#111827]">{veh.documents?.permitExpiry || 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
