import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  SlidersHorizontal,
  Car,
  Wallet,
  ArrowRight,
  TrendingUp,
  Activity
} from 'lucide-react';

export const FleetHealthRingWidget = () => {
  const {
    vehicles,
    getFleetStats,
    getFinancialStats,
    setActiveTab,
    formatCurrency,
    language
  } = useApp();

  const [mode, setMode] = useState('fleet'); // 'fleet' | 'revenue'
  const isHindi = language === 'hi';

  const fleetStats = getFleetStats();
  const financialStats = getFinancialStats();

  const totalVehicles = Math.max(1, vehicles.length);
  const onTripCount = fleetStats.onTrip || 0;
  const freeCount = fleetStats.free || 0;
  const workshopCount = fleetStats.workshop || 0;

  // Occupancy percentage
  const occupancyPct = Math.round((onTripCount / totalVehicles) * 100);

  // Revenue stats
  const dailyTarget = 25000;
  const collectedToday = financialStats.totalCollectedToday || 0;
  const pendingDues = financialStats.pendingCustomers || 0;
  const revenuePct = Math.min(100, Math.round((collectedToday / dailyTarget) * 100));

  // SVG Donut calculation
  const size = 128;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2; // (128 - 20) / 2 = 54
  const circumference = 2 * Math.PI * radius; // ~339.29

  // Helper to compute SVG dash offsets
  const getFleetSegments = () => {
    // Real proportions without mock fallbacks
    const s1Pct = vehicles.length > 0 ? (onTripCount / totalVehicles) : 0;
    const s2Pct = vehicles.length > 0 ? (freeCount / totalVehicles) : 0;
    const s3Pct = vehicles.length > 0 ? (workshopCount / totalVehicles) : 0;

    const s1Len = s1Pct * circumference;
    const s2Len = s2Pct * circumference;
    const s3Len = s3Pct * circumference;

    return [
      {
        id: 'ontrip',
        color: '#D4F05B', // Accent Lime
        dashArray: `${s1Len} ${circumference - s1Len}`,
        dashOffset: 0,
        pct: Math.round(s1Pct * 100),
        angle: (s1Pct * 360) / 2 - 90
      },
      {
        id: 'free',
        color: '#FED7AA', // Soft Peach
        dashArray: `${s2Len} ${circumference - s2Len}`,
        dashOffset: -s1Len,
        pct: Math.round(s2Pct * 100),
        angle: s1Pct * 360 + (s2Pct * 360) / 2 - 90
      },
      {
        id: 'workshop',
        color: '#93C5FD', // Sky Blue / Cyan
        dashArray: `${s3Len} ${circumference - s3Len}`,
        dashOffset: -(s1Len + s2Len),
        pct: Math.round(s3Pct * 100),
        angle: (s1Pct + s2Pct) * 360 + (s3Pct * 360) / 2 - 90
      }
    ];
  };

  const getRevenueSegments = () => {
    const totalRevBase = Math.max(1, collectedToday + pendingDues);
    const s1Pct = (collectedToday + pendingDues > 0) ? (collectedToday / totalRevBase) : 0;
    const s2Pct = (collectedToday + pendingDues > 0) ? (pendingDues / totalRevBase) : 0;
    const s3Pct = Math.max(0.15, 1 - s1Pct - s2Pct);

    const s1Len = s1Pct * circumference;
    const s2Len = s2Pct * circumference;
    const s3Len = s3Pct * circumference;

    return [
      {
        id: 'collected',
        color: '#D4F05B', // Lime
        dashArray: `${s1Len} ${circumference - s1Len}`,
        dashOffset: 0,
        angle: (s1Pct * 360) / 2 - 90
      },
      {
        id: 'pending',
        color: '#FED7AA', // Peach
        dashArray: `${s2Len} ${circumference - s2Len}`,
        dashOffset: -s1Len,
        angle: s1Pct * 360 + (s2Pct * 360) / 2 - 90
      },
      {
        id: 'remaining',
        color: '#93C5FD', // Sky Blue
        dashArray: `${s3Len} ${circumference - s3Len}`,
        dashOffset: -(s1Len + s2Len),
        angle: (s1Pct + s2Pct) * 360 + (s3Pct * 360) / 2 - 90
      }
    ];
  };

  const segments = mode === 'fleet' ? getFleetSegments() : getRevenueSegments();

  // Helper to get dot position on circle
  const getDotPosition = (angleDeg) => {
    const rad = (angleDeg * Math.PI) / 180;
    const cx = size / 2;
    const cy = size / 2;
    const x = cx + radius * Math.cos(rad);
    const y = cy + radius * Math.sin(rad);
    return { x, y };
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-soft border border-[#EFEAE2]/80 space-y-4 animate-fade-in">
      {/* Header with Title and Mode Switcher */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-[#111827]">
            {mode === 'fleet'
              ? (isHindi ? 'फ्लीट क्षमता व उपयोग' : 'Fleet Occupancy')
              : (isHindi ? 'दैनिक कलेक्शन लक्ष्य' : 'Daily Revenue Goal')}
          </h3>
          <p className="text-[11px] text-[#4B5563] font-semibold">
            {mode === 'fleet'
              ? (isHindi ? `${occupancyPct}% गाड़ियां ऑन-रोड चालू हैं` : `${occupancyPct}% fleet currently active on-road`)
              : (isHindi ? `लक्ष्य का ${revenuePct}% हिस्सा कलेक्ट हुआ` : `${revenuePct}% of daily ₹${(dailyTarget/1000)}k target achieved`)}
          </p>
        </div>

        {/* Mode Switch Toggle Button */}
        <button
          onClick={() => setMode(prev => prev === 'fleet' ? 'revenue' : 'fleet')}
          className="p-1.5 rounded-full bg-[#F8F6F0] border-2 border-[#E5DFD3] text-[#111827] hover:bg-gray-100 flex items-center gap-1 tap-active shadow-xs text-[10px] font-black px-2.5"
          title="Switch between Fleet & Revenue mode"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#EA580C]" />
          <span>{mode === 'fleet' ? 'Fleet' : 'Cash'}</span>
        </button>
      </div>

      {/* Main Content: Left Metrics + Right Donut Ring */}
      <div className="flex items-center justify-between pt-1">
        {/* Left Metrics Column */}
        <div className="space-y-3 flex-1 pr-2">
          {mode === 'fleet' ? (
            <>
              {/* Metric 1: On Trip */}
              <div
                onClick={() => setActiveTab('trips')}
                className="flex items-start space-x-2 cursor-pointer tap-active group"
              >
                <div className="w-1.5 h-7 rounded-full bg-[#84CC16] mt-0.5" />
                <div>
                  <div className="text-xs font-black text-[#111827] group-hover:text-[#EA580C]">
                    {onTripCount} {isHindi ? 'गाड़ियां ट्रिप पर' : 'Cars On-Road'}
                  </div>
                  <div className="text-[10px] text-[#4B5563] font-bold">
                    {occupancyPct}% {isHindi ? 'सक्रिय उपयोग' : 'Active Occupancy'}
                  </div>
                </div>
              </div>

              {/* Metric 2: Free Available */}
              <div
                onClick={() => setActiveTab('fleet')}
                className="flex items-start space-x-2 cursor-pointer tap-active group"
              >
                <div className="w-1.5 h-7 rounded-full bg-[#FB923C] mt-0.5" />
                <div>
                  <div className="text-xs font-black text-[#111827] group-hover:text-[#EA580C]">
                    {freeCount} {isHindi ? 'गाड़ियां उपलब्ध' : 'Cars Available'}
                  </div>
                  <div className="text-[10px] text-[#4B5563] font-bold">
                    {isHindi ? 'बुकिंग के लिए तैयार' : 'Ready for dispatch'}
                  </div>
                </div>
              </div>

              {/* Metric 3: Workshop */}
              <div
                onClick={() => setActiveTab('fleet')}
                className="flex items-start space-x-2 cursor-pointer tap-active group"
              >
                <div className="w-1.5 h-7 rounded-full bg-[#60A5FA] mt-0.5" />
                <div>
                  <div className="text-xs font-black text-[#111827] group-hover:text-[#EA580C]">
                    {workshopCount} {isHindi ? 'गैरेज / सर्विस' : 'Workshop'}
                  </div>
                  <div className="text-[10px] text-[#4B5563] font-bold">
                    {isHindi ? 'मेंटिनेंस में' : 'Under maintenance'}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Metric 1: Revenue Collected */}
              <div
                onClick={() => setActiveTab('money')}
                className="flex items-start space-x-2 cursor-pointer tap-active group"
              >
                <div className="w-1.5 h-7 rounded-full bg-[#84CC16] mt-0.5" />
                <div>
                  <div className="text-xs font-black text-[#111827] group-hover:text-[#EA580C]">
                    {formatCurrency(collectedToday)}
                  </div>
                  <div className="text-[10px] text-[#4B5563] font-bold">
                    {isHindi ? 'आज का कुल कलेक्शन' : 'Collected Today'}
                  </div>
                </div>
              </div>

              {/* Metric 2: Pending Dues */}
              <div
                onClick={() => setActiveTab('money')}
                className="flex items-start space-x-2 cursor-pointer tap-active group"
              >
                <div className="w-1.5 h-7 rounded-full bg-[#FB923C] mt-0.5" />
                <div>
                  <div className="text-xs font-black text-[#111827] group-hover:text-[#EA580C]">
                    {formatCurrency(pendingDues)}
                  </div>
                  <div className="text-[10px] text-[#4B5563] font-bold">
                    {isHindi ? 'ग्राहकों का बकाया' : 'Customer Dues'}
                  </div>
                </div>
              </div>

              {/* Metric 3: Target Remaining */}
              <div
                onClick={() => setActiveTab('money')}
                className="flex items-start space-x-2 cursor-pointer tap-active group"
              >
                <div className="w-1.5 h-7 rounded-full bg-[#60A5FA] mt-0.5" />
                <div>
                  <div className="text-xs font-black text-[#111827] group-hover:text-[#EA580C]">
                    {formatCurrency(Math.max(0, dailyTarget - collectedToday))}
                  </div>
                  <div className="text-[10px] text-[#4B5563] font-bold">
                    {isHindi ? 'दैनिक लक्ष्य शेष' : 'Remaining to Goal'}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Circular Donut Ring */}
        <div
          onClick={() => setActiveTab(mode === 'fleet' ? 'fleet' : 'money')}
          className="relative cursor-pointer select-none tap-active flex items-center justify-center p-1"
          title={`Click to view ${mode === 'fleet' ? 'Fleet' : 'Money'} details`}
        >
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90"
          >
            {/* Background track circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke="#F3F4F6"
              strokeWidth={strokeWidth}
            />

            {/* Segment Arcs */}
            {segments.map((seg, i) => (
              <circle
                key={seg.id || i}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={seg.dashArray}
                strokeDashoffset={seg.dashOffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            ))}

            {/* Accent Indicator Dots on Segments */}
            {segments.map((seg, i) => {
              const pos = getDotPosition(seg.angle);
              return (
                <circle
                  key={`dot-${i}`}
                  cx={pos.x}
                  cy={pos.y}
                  r="3.5"
                  fill="#111827"
                  className="transition-all duration-500"
                />
              );
            })}
          </svg>

          {/* Center Text inside Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-base font-black text-[#111827] leading-none">
              {mode === 'fleet' ? `${occupancyPct}%` : `${revenuePct}%`}
            </span>
            <span className="text-[9px] font-bold text-[#4B5563] mt-0.5 uppercase tracking-tighter">
              {mode === 'fleet' ? (isHindi ? 'सक्रिय' : 'Active') : (isHindi ? 'लक्ष्य' : 'Goal')}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Mini Distribution Strip (matching Screen 3 in app_ui_ux.jpg) */}
      <div className="pt-2 border-t border-[#EFEAE2]/60 flex items-center justify-between px-1">
        <span className="text-[10px] font-bold text-[#8A8782] uppercase tracking-wider">
          {isHindi ? 'गाड़ी स्थिति' : 'Fleet Distribution'}
        </span>
        <div className="flex items-center space-x-2">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#DDF262]" />
            <span className="text-[10px] font-extrabold text-[#111827]">{onTripCount} On-Road</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#F39E36]" />
            <span className="text-[10px] font-extrabold text-[#111827]">{freeCount} Free</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-[#85CFF3]" />
            <span className="text-[10px] font-extrabold text-[#111827]">{workshopCount} Garage</span>
          </div>
        </div>
      </div>
    </div>
  );
};
