import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Fuel,
  Wrench,
  UserCheck,
  Receipt,
  Car,
  CreditCard,
  Banknote,
  Share2,
  Printer,
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Info,
  DollarSign,
  PieChart,
  BarChart3,
  AlertTriangle
} from 'lucide-react';

export const MoneyAnalytics = () => {
  const {
    getPeriodAnalytics,
    analyticsPeriod,
    setAnalyticsPeriod,
    formatCurrency,
    setActiveTab,
    setCustomerSettlementData,
    setWhatsAppData,
    business,
    t
  } = useApp();

  const [activeTooltip, setActiveTooltip] = useState(null);
  const data = getPeriodAnalytics(analyticsPeriod);

  const periods = [
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
    { id: '90d', label: '90 Days' },
    { id: '6m', label: '6 Months' },
    { id: '1y', label: '1 Year' },
    { id: 'all', label: 'Total' }
  ];

  // Max value in trend series to calculate proportional bar heights
  const maxTrendValue = Math.max(
    ...data.trendSeries.map(item => Math.max(item.revenue, item.expense)),
    1000
  );

  // WhatsApp Statement share handler
  const handleShareWhatsAppReport = () => {
    const reportText = `*📊 FLEET P&L STATEMENT — ${business.name.toUpperCase()}*\n` +
      `📅 *Period:* ${data.periodLabel} (${data.dateRangeText})\n` +
      `──────────────────────────\n` +
      `📈 *Gross Fleet Revenue:* ${formatCurrency(data.grossRevenue)}\n` +
      `📉 *Total Fleet Expenses:* ${formatCurrency(data.totalExpenses)}\n` +
      `💰 *Net Operating Profit:* ${formatCurrency(data.netProfit)} (${data.profitMargin}% Margin)\n\n` +
      `🚖 *Operational Volume:*\n` +
      `• Total Trips Executed: ${data.tripsCount}\n` +
      `• Total Fleet Run: ${data.totalKm.toLocaleString()} KM\n` +
      `• Revenue Per KM: ₹${data.earningPerKm}/km\n` +
      `• Fleet Running Cost: ₹${data.costPerKm}/km\n\n` +
      `⛽ *Top Expense Categories:*\n` +
      data.expenseCategories.slice(0, 3).map(c => `• ${c.name}: ${formatCurrency(c.amount)} (${c.percentage}%)`).join('\n') + '\n\n' +
      `🏆 *Top Performing Vehicle:* ${data.vehicleAnalytics[0]?.plate || 'MH 12 QX 9012'} (+${formatCurrency(data.vehicleAnalytics[0]?.netProfit || 0)})\n` +
      `⏳ *Customer Receivables Pending:* ${formatCurrency(data.pendingReceivables)}\n` +
      `──────────────────────────\n` +
      `_Generated via GaadiDesk by AGX • Official Fleet OS_`;

    setWhatsAppData({
      type: 'custom',
      customMessage: reportText,
      title: 'Share P&L Statement',
      targetName: 'Partners / Accountant'
    });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* 1. Time Horizon Filter Pills */}
      <div className="flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar py-1">
        {periods.map(p => {
          const isActive = analyticsPeriod === p.id;
          return (
            <button
              key={p.id}
              onClick={() => setAnalyticsPeriod(p.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-black transition-all shrink-0 tap-active ${
                isActive
                  ? 'bg-[#111827] text-white shadow-xs scale-102 border border-black'
                  : 'bg-white text-[#4B5563] hover:text-[#111827] border border-[#E5DFD3]'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      {/* Date Range Subtitle & Quick Actions */}
      <div className="flex items-center justify-between text-xs px-1">
        <div className="flex items-center space-x-1.5 text-[#4B5563] font-semibold">
          <Calendar className="w-3.5 h-3.5 text-[#EA580C]" />
          <span>{data.dateRangeText}</span>
        </div>
        <button
          onClick={handleShareWhatsAppReport}
          className="flex items-center space-x-1 text-emerald-800 font-extrabold hover:text-emerald-950 tap-active bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200"
          title="Share P&L on WhatsApp"
        >
          <Share2 className="w-3 h-3 text-emerald-700" />
          <span className="text-[11px]">Share Statement</span>
        </button>
      </div>

      {/* 2. Executive P&L Financial Hero Card */}
      <div className="bg-[#071422] rounded-3xl p-5 text-white shadow-md space-y-4 border border-gray-800">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400 font-bold uppercase tracking-wider text-[10px]">
            {data.periodLabel} Net Profit
          </span>
          <span className="bg-[#22C55E] text-[#071422] font-black px-2.5 py-0.5 rounded-full text-[10px] shadow-xs">
            {data.profitMargin}% NET MARGIN
          </span>
        </div>

        <div>
          <h3 className="text-3xl font-black text-white tracking-tight">
            {formatCurrency(data.netProfit)}
          </h3>
          <p className="text-[11px] text-gray-300 mt-1 font-semibold flex items-center gap-1.5">
            <span>Gross Revenue: <b className="text-emerald-400">{formatCurrency(data.grossRevenue)}</b></span>
            <span>•</span>
            <span>Expenses: <b className="text-rose-400">{formatCurrency(data.totalExpenses)}</b></span>
          </p>
        </div>

        {/* 4 Micro Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-white/10 text-xs">
          <div className="bg-white/5 rounded-2xl p-2.5 border border-white/10">
            <span className="text-[10px] text-gray-400 block font-bold">Trips Done</span>
            <span className="text-sm font-black text-white">{data.tripsCount} trips</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-2.5 border border-white/10">
            <span className="text-[10px] text-gray-400 block font-bold">Total Run</span>
            <span className="text-sm font-black text-white">{data.totalKm.toLocaleString()} KM</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-2.5 border border-white/10">
            <span className="text-[10px] text-gray-400 block font-bold">Daily Run-Rate</span>
            <span className="text-sm font-black text-[#D4F05B]">{formatCurrency(data.avgDailyRevenue)}/d</span>
          </div>
          <div className="bg-white/5 rounded-2xl p-2.5 border border-white/10">
            <span className="text-[10px] text-gray-400 block font-bold">Cost / KM</span>
            <span className="text-sm font-black text-rose-300">₹{data.costPerKm}/km</span>
          </div>
        </div>
      </div>

      {/* 3. Revenue vs Expenses Dynamic Histogram Chart */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-[#E5DFD3] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider">
              Revenue & Expense Flow
            </h3>
            <p className="text-[10px] text-[#4B5563] font-semibold">
              Comparative trends over {data.periodLabel}
            </p>
          </div>
          <div className="flex items-center space-x-3 text-[10px] font-bold">
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
              <span className="text-gray-700">Revenue</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]" />
              <span className="text-gray-700">Expenses</span>
            </span>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-4 pb-2">
          <div className="h-40 flex items-end justify-between gap-2 px-1 border-b border-gray-200 relative">
            {data.trendSeries.map((item, idx) => {
              const revHeight = Math.max(12, Math.round((item.revenue / maxTrendValue) * 130));
              const expHeight = Math.max(8, Math.round((item.expense / maxTrendValue) * 130));
              const isSelected = activeTooltip === idx;

              return (
                <div
                  key={idx}
                  onClick={() => setActiveTooltip(isSelected ? null : idx)}
                  className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative"
                >
                  {/* Tooltip Overlay */}
                  {isSelected && (
                    <div className="absolute -top-14 bg-[#111827] text-white text-[10px] font-mono px-2.5 py-1.5 rounded-xl shadow-lg z-20 whitespace-nowrap animate-fade-in border border-gray-700 pointer-events-none">
                      <p className="text-[#22C55E] font-bold">Rev: {formatCurrency(item.revenue)}</p>
                      <p className="text-rose-400 font-bold">Exp: {formatCurrency(item.expense)}</p>
                      <p className="text-white font-bold border-t border-gray-700 mt-0.5 pt-0.5">
                        Net: +{formatCurrency(item.profit)}
                      </p>
                    </div>
                  )}

                  {/* Dual Bars */}
                  <div className="w-full flex items-end justify-center space-x-1">
                    {/* Revenue Bar */}
                    <div
                      style={{ height: `${revHeight}px` }}
                      className="w-2.5 sm:w-3.5 bg-[#10B981] hover:bg-emerald-600 rounded-t-sm transition-all shadow-xs"
                      title={`Revenue: ${formatCurrency(item.revenue)}`}
                    />
                    {/* Expense Bar */}
                    <div
                      style={{ height: `${expHeight}px` }}
                      className="w-2.5 sm:w-3.5 bg-[#EA580C] hover:bg-orange-600 rounded-t-sm transition-all shadow-xs"
                      title={`Expense: ${formatCurrency(item.expense)}`}
                    />
                  </div>
                  {/* Label */}
                  <span className="text-[9px] sm:text-[10px] text-gray-500 font-bold mt-2 truncate max-w-[48px] text-center">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Expense Breakdown by Category */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-[#E5DFD3] shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider">
              Expense Leakage & Distribution
            </h3>
            <p className="text-[10px] text-[#4B5563] font-semibold">
              Where your fleet money was spent ({data.periodLabel})
            </p>
          </div>
          <span className="text-xs font-black text-rose-700">
            Total: {formatCurrency(data.totalExpenses)}
          </span>
        </div>

        <div className="space-y-3 pt-1">
          {data.expenseCategories.map(cat => (
            <div key={cat.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-bold">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{cat.icon}</span>
                  <span className="text-[#111827] font-extrabold">{cat.name}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[#111827] font-black">{formatCurrency(cat.amount)}</span>
                  <span className="text-[10px] text-gray-500 font-bold">({cat.percentage}%)</span>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  style={{ width: `${Math.min(100, Math.max(3, cat.percentage))}%`, backgroundColor: cat.color }}
                  className="h-full rounded-full transition-all duration-500"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Vehicle Profitability Leaderboard (ROI Ranking) */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-[#E5DFD3] shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider">
              Vehicle Profitability Matrix
            </h3>
            <p className="text-[10px] text-[#4B5563] font-semibold">
              Ranked by net cash contribution ({data.periodLabel})
            </p>
          </div>
          <button
            onClick={() => setActiveTab('fleet')}
            className="text-[11px] font-black text-[#EA580C] hover:text-orange-700 flex items-center gap-0.5 tap-active"
          >
            <span>Manage Fleet</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {data.vehicleAnalytics.map((car, idx) => (
            <div
              key={car.id}
              onClick={() => setActiveTab('fleet')}
              className="p-3.5 bg-[#F8F6F0] rounded-2xl border border-[#E5DFD3] hover:border-gray-400 transition cursor-pointer tap-active space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="w-5 h-5 rounded-full bg-[#111827] text-white flex items-center justify-center text-[10px] font-black">
                    #{idx + 1}
                  </span>
                  <div>
                    <h4 className="text-xs font-black text-[#111827]">{car.plate}</h4>
                    <p className="text-[10px] text-[#4B5563] font-semibold">
                      {car.model} • {car.fuel}
                    </p>
                  </div>
                </div>
                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-2xs ${car.badgeColor}`}>
                  {car.badge}
                </span>
              </div>

              {/* Financial Metrics Strip */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#E5DFD3] text-center text-xs">
                <div className="bg-white/80 rounded-xl p-1.5 border border-gray-200">
                  <span className="text-[9px] text-gray-500 block font-bold">Revenue</span>
                  <span className="text-xs font-black text-emerald-800">{formatCurrency(car.revenue)}</span>
                </div>
                <div className="bg-white/80 rounded-xl p-1.5 border border-gray-200">
                  <span className="text-[9px] text-gray-500 block font-bold">Direct Exp</span>
                  <span className="text-xs font-black text-rose-700">{formatCurrency(car.expenses)}</span>
                </div>
                <div className="bg-white/80 rounded-xl p-1.5 border border-gray-200">
                  <span className="text-[9px] text-gray-500 block font-bold">Net Profit</span>
                  <span className="text-xs font-black text-[#111827]">
                    +{formatCurrency(car.netProfit)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Payment Channels & Collections Mix */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-[#E5DFD3] shadow-xs space-y-3.5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider">
              Payment Collections Mix
            </h3>
            <p className="text-[10px] text-[#4B5563] font-semibold">
              Payment mode distribution & pending customer dues
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-cyan-50 rounded-2xl p-2.5 border border-cyan-200">
            <span className="text-[10px] text-cyan-900 font-bold block">⚡ UPI Online</span>
            <span className="text-xs font-black text-cyan-950 block mt-0.5">
              {formatCurrency(data.paymentSplit.upi.amount)}
            </span>
            <span className="text-[9px] text-cyan-700 font-extrabold">({data.paymentSplit.upi.percent}%)</span>
          </div>

          <div className="bg-emerald-50 rounded-2xl p-2.5 border border-emerald-200">
            <span className="text-[10px] text-emerald-900 font-bold block">💵 Cash</span>
            <span className="text-xs font-black text-emerald-950 block mt-0.5">
              {formatCurrency(data.paymentSplit.cash.amount)}
            </span>
            <span className="text-[9px] text-emerald-700 font-extrabold">({data.paymentSplit.cash.percent}%)</span>
          </div>

          <div className="bg-amber-50 rounded-2xl p-2.5 border border-amber-200">
            <span className="text-[10px] text-amber-900 font-bold block">🏦 Bank / NEFT</span>
            <span className="text-xs font-black text-amber-950 block mt-0.5">
              {formatCurrency(data.paymentSplit.bank.amount)}
            </span>
            <span className="text-[9px] text-amber-700 font-extrabold">({data.paymentSplit.bank.percent}%)</span>
          </div>
        </div>

        {/* Customer Receivables Link */}
        {data.pendingReceivables > 0 && (
          <div
            onClick={() => setActiveTab('money')}
            className="p-3 bg-rose-50 rounded-2xl border border-rose-200 flex items-center justify-between cursor-pointer hover:bg-rose-100 transition tap-active text-xs"
          >
            <div className="flex items-center space-x-2">
              <span className="text-base">⏳</span>
              <div>
                <p className="font-black text-rose-950">Pending Customer Receivables</p>
                <p className="text-[10px] text-rose-800 font-semibold">
                  {formatCurrency(data.pendingReceivables)} in outstanding customer credit
                </p>
              </div>
            </div>
            <span className="text-xs font-black text-rose-700">Collect Dues →</span>
          </div>
        )}
      </div>

      {/* 7. GST & Tax Liability Reconciliation */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border-2 border-[#E5DFD3] shadow-xs space-y-3">
        <div className="flex items-center space-x-2">
          <Receipt className="w-4 h-4 text-emerald-700" />
          <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider">
            GST Tax Report (CA & Audit Filing)
          </h3>
        </div>

        <div className="p-3 bg-[#F8F6F0] rounded-2xl border border-[#E5DFD3] space-y-2 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-semibold">Taxable Fleet Turnover:</span>
            <span className="font-black text-[#111827]">{formatCurrency(data.gstTaxableTurnover)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-semibold">CGST (2.5%) Collected:</span>
            <span className="font-black text-gray-800">{formatCurrency(Math.round(data.gstTotalCollected / 2))}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600 font-semibold">SGST (2.5%) Collected:</span>
            <span className="font-black text-gray-800">{formatCurrency(Math.round(data.gstTotalCollected / 2))}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-[#E5DFD3]">
            <span className="font-black text-[#111827]">Total GST Liability (5%):</span>
            <span className="font-black text-emerald-800">{formatCurrency(data.gstTotalCollected)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
