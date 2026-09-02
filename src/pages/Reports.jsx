// ============================================================
// FINANCEOS - REPORTS PAGE (REWORKED, REDESIGNED & DURATION-SPECIFIC)
// ============================================================

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FiCalendar,
  FiDownload,
  FiTrendingUp,
  FiTrendingDown,
  FiDollarSign,
  FiPieChart,
  FiShield,
  FiTarget,
  FiCreditCard,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiLayers,
  FiArrowUpRight,
  FiArrowDownRight,
  FiActivity,
  FiClock,
  FiPlusCircle,
  FiPlay,
} from "react-icons/fi";

import Sidebar from "../components/layout/Sidebar.jsx";
import Topbar from "../components/layout/Topbar.jsx";
import useFinance from "../context/useFinance.js";
import { generateFinancialReport } from "../utils/generateFinancialReport.js";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const QUARTERS = [
  { value: 1, label: "Q1 (Jan — Mar)", months: [1, 2, 3] },
  { value: 2, label: "Q2 (Apr — Jun)", months: [4, 5, 6] },
  { value: 3, label: "Q3 (Jul — Sep)", months: [7, 8, 9] },
  { value: 4, label: "Q4 (Oct — Dec)", months: [10, 11, 12] },
];

const HALF_YEARS = [
  { value: 1, label: "H1 (Jan — Jun)", months: [1, 2, 3, 4, 5, 6] },
  { value: 2, label: "H2 (Jul — Dec)", months: [7, 8, 9, 10, 11, 12] },
];

function safeNum(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

function fmtINR(val) {
  if (val === null || val === undefined || val === "") return "—";
  const n = Number(val);
  if (!Number.isFinite(n)) return "—";
  const sign = n < 0 ? "-" : "";
  return `${sign}₹${Math.abs(n).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function fmtPct(val) {
  if (val === null || val === undefined || val === "") return "N/A";
  const n = Number(val);
  if (!Number.isFinite(n)) return "N/A";
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;
}

function formatDate(dateVal) {
  if (!dateVal) return "—";
  const d = new Date(dateVal);
  if (Number.isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function Reports() {
  const finance = useFinance();
  const [searchParams] = useSearchParams();

  const activeMonthParam = searchParams.get("month") || finance.selectedMonth;
  let defaultYear = new Date().getFullYear();
  let defaultMonth = new Date().getMonth() + 1;

  if (activeMonthParam && /^\d{4}-\d{1,2}$/.test(activeMonthParam)) {
    const [y, m] = activeMonthParam.split("-").map(Number);
    if (y >= 2000 && y <= 2100 && m >= 1 && m <= 12) {
      defaultYear = y;
      defaultMonth = m;
    }
  }

  // Filter States
  const [duration, setDuration] = useState("monthly"); // monthly | quarterly | halfYear | yearly
  const [selectedYear, setSelectedYear] = useState(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedQuarter, setSelectedQuarter] = useState(Math.ceil(defaultMonth / 3));
  const [selectedHalf, setSelectedHalf] = useState(defaultMonth <= 6 ? 1 : 2);

  useEffect(() => {
    if (activeMonthParam && /^\d{4}-\d{1,2}$/.test(activeMonthParam)) {
      const [y, m] = activeMonthParam.split("-").map(Number);
      if (y >= 2000 && y <= 2100 && m >= 1 && m <= 12) {
        setSelectedYear(y);
        setSelectedMonth(m);
        setSelectedQuarter(Math.ceil(m / 3));
        setSelectedHalf(m <= 6 ? 1 : 2);
      }
    }
  }, [activeMonthParam]);

  // Report Data & Loading State
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Available Years
  const availableYears = useMemo(() => {
    const currentY = new Date().getFullYear();
    const years = [currentY, currentY - 1, currentY - 2, currentY - 3];
    return [...new Set(years)].sort((a, b) => b - a);
  }, []);

  // Fetch Report from Backend API
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token =
        localStorage.getItem("financeos_token") ||
        sessionStorage.getItem("financeos_token");

      const params = new URLSearchParams({
        duration,
        year: String(selectedYear),
      });

      if (duration === "monthly") params.append("month", String(selectedMonth));
      if (duration === "quarterly") params.append("quarter", String(selectedQuarter));
      if (duration === "halfYear") params.append("half", String(selectedHalf));

      const res = await fetch(`http://localhost:5000/api/reports?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to load financial report.");
      }

      setReportData(data.report);
    } catch (err) {
      console.error("Report Fetch Error:", err);
      setError(err.message || "Failed to generate report.");
    } finally {
      setLoading(false);
    }
  }, [duration, selectedYear, selectedMonth, selectedQuarter, selectedHalf]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleDownloadPDF = () => {
    if (!reportData) return;
    generateFinancialReport(reportData);
  };

  const fs = reportData?.financialSummary || {};
  const nw = reportData?.netWorthSummary || {};
  const fh = reportData?.financialHealth || {};
  const plansLifecycle = reportData?.plansLifecycle || {};
  const plans = reportData?.plans || {};
  const ledger = reportData?.transactionsLedger || [];
  const monthDetails = reportData?.monthDetails || [];
  const insights = reportData?.insights || [];
  const suggestions = reportData?.suggestions || [];

  return (
    <div className="min-h-screen bg-[#f6f8f4]">
      <Sidebar />

      <main className={`min-h-screen transition-all duration-300 ${finance.sidebarCollapsed ? "ml-20" : "ml-64"}`}>
        <Topbar />

        <div className="px-6 py-6 md:px-8 space-y-6">
          {/* ======================================================
              PAGE HEADER & CONTROLS
             ====================================================== */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#e2e8dc] shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-[#eaf4e6] text-[#315c46] border border-[#d6e5d0]">
                  {duration.toUpperCase()} STATEMENT
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {reportData?.header?.periodRangeLabel || "FinanceOS Report"}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-[#18392c] mt-1.5">
                {duration === "monthly" && "Monthly Financial Statement"}
                {duration === "quarterly" && "Quarterly Financial Review"}
                {duration === "halfYear" && "Half-Yearly Financial Audit"}
                {duration === "yearly" && "Annual Financial Statement"}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Full-spectrum analysis of cash flow, asset valuations, debt amortization, and financial health.
              </p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fetchReport}
                disabled={loading}
                className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold rounded-xl border border-[#dce5da] bg-white hover:bg-[#f4f7f2] text-[#315c46] transition-all cursor-pointer shadow-xs"
                title="Refresh Report Data"
              >
                <FiRefreshCw className={`text-sm ${loading ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPDF}
                disabled={loading || !reportData}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl bg-[#18392c] hover:bg-[#254635] text-white shadow-xs transition-all cursor-pointer"
              >
                <FiDownload className="text-sm" />
                <span>Download {duration.toUpperCase()} PDF</span>
              </button>
            </div>
          </div>

          {/* ======================================================
              DURATION SELECTOR TABS & PERIOD PICKER
             ====================================================== */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-[#e2e8dc] shadow-xs">
            {/* DURATION TABS */}
            <div className="flex items-center bg-[#f0f4ee] p-1 rounded-xl">
              {[
                { id: "monthly", label: "Monthly" },
                { id: "quarterly", label: "Quarterly" },
                { id: "halfYear", label: "Half-Yearly" },
                { id: "yearly", label: "Yearly" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDuration(tab.id)}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    duration === tab.id
                      ? "bg-white text-[#18392c] shadow-xs"
                      : "text-slate-600 hover:text-[#18392c]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* PERIOD PICKERS */}
            <div className="flex flex-wrap items-center gap-3">
              {/* YEAR SELECTOR */}
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <span>Year:</span>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-[#f8faf8] border border-[#dce5da] rounded-lg px-3 py-1.5 font-bold text-[#18392c] text-xs focus:outline-none focus:ring-1 focus:ring-[#315c46]"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              {/* MONTH SELECTOR */}
              {duration === "monthly" && (
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <span>Month:</span>
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                    className="bg-[#f8faf8] border border-[#dce5da] rounded-lg px-3 py-1.5 font-bold text-[#18392c] text-xs focus:outline-none focus:ring-1 focus:ring-[#315c46]"
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={name} value={idx + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* QUARTER SELECTOR */}
              {duration === "quarterly" && (
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <span>Quarter:</span>
                  <select
                    value={selectedQuarter}
                    onChange={(e) => setSelectedQuarter(Number(e.target.value))}
                    className="bg-[#f8faf8] border border-[#dce5da] rounded-lg px-3 py-1.5 font-bold text-[#18392c] text-xs focus:outline-none focus:ring-1 focus:ring-[#315c46]"
                  >
                    {QUARTERS.map((q) => (
                      <option key={q.value} value={q.value}>
                        {q.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* HALF-YEAR SELECTOR */}
              {duration === "halfYear" && (
                <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                  <span>Half-Year:</span>
                  <select
                    value={selectedHalf}
                    onChange={(e) => setSelectedHalf(Number(e.target.value))}
                    className="bg-[#f8faf8] border border-[#dce5da] rounded-lg px-3 py-1.5 font-bold text-[#18392c] text-xs focus:outline-none focus:ring-1 focus:ring-[#315c46]"
                  >
                    {HALF_YEARS.map((h) => (
                      <option key={h.value} value={h.value}>
                        {h.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* ======================================================
              REPORT CONTENT AREA
             ====================================================== */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-16 bg-white rounded-2xl border border-[#e2e8dc] text-center space-y-3">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#d8e6cf] border-t-[#315c46]" />
              <p className="text-sm font-semibold text-[#18392c]">Generating {duration.toUpperCase()} Financial Statement...</p>
              <p className="text-xs text-slate-400">Aggregating MongoDB cash balances, investment yields, and liability commitments.</p>
            </div>
          ) : error ? (
            <div className="p-8 bg-white rounded-2xl border border-red-200 text-center space-y-2">
              <FiAlertCircle className="mx-auto text-3xl text-red-500" />
              <h3 className="text-base font-bold text-red-700">Unable to generate report</h3>
              <p className="text-xs text-red-500">{error}</p>
            </div>
          ) : (
            <>
              {/* ==================================================
                  1. EXECUTIVE SUMMARY CARDS
                 ================================================== */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
                <div className="bg-white p-4 rounded-xl border border-[#e2e8dc] shadow-xs">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Inflow</p>
                  <p className="text-lg font-bold text-[#18392c] mt-1">{fmtINR(fs.totalIncome)}</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">Base + Extra Income</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#e2e8dc] shadow-xs">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Expenses</p>
                  <p className="text-lg font-bold text-slate-700 mt-1">{fmtINR(fs.totalExpenses)}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Discretionary & Living</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#e2e8dc] shadow-xs">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Net Savings</p>
                  <p className={`text-lg font-bold mt-1 ${fs.totalSavings >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                    {fmtINR(fs.totalSavings)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Inflow - Outflow</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#e2e8dc] shadow-xs">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Closing Balance</p>
                  <p className="text-lg font-bold text-[#315c46] mt-1">{fmtINR(fs.closingBalance)}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Cash / Liquid Fund</p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-[#e2e8dc] shadow-xs">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Available to Allocate</p>
                  <p className={`text-lg font-bold mt-1 ${fs.availableToAllocate >= 0 ? "text-blue-700" : "text-amber-600"}`}>
                    {fmtINR(fs.availableToAllocate)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Free Unallocated</p>
                </div>

                <div className="bg-[#f2faee] p-4 rounded-xl border border-[#d2e8cb] shadow-xs">
                  <p className="text-[11px] font-bold text-[#315c46] uppercase tracking-wider">Net Worth</p>
                  <p className="text-lg font-bold text-[#18392c] mt-1">{fmtINR(nw.closingNetWorth)}</p>
                  <p className="text-[10px] text-[#4d735a] mt-0.5">
                    Movement: {fmtPct(nw.netWorthChangePct)}
                  </p>
                </div>
              </div>

              {/* ==================================================
                  2. FINANCIAL HEALTH SCORE & NET WORTH PROGRESSION
                 ================================================== */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* FINANCIAL HEALTH SCORE CARD */}
                <div className="bg-white p-6 rounded-2xl border border-[#e2e8dc] shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-[#18392c] uppercase tracking-wider">Financial Health Score</h2>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        fh.score >= 80 ? "bg-emerald-100 text-emerald-800" :
                        fh.score >= 65 ? "bg-blue-100 text-blue-800" :
                        fh.score >= 50 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                      }`}>
                        {fh.status || "Fair"}
                      </span>
                    </div>

                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-4xl font-extrabold text-[#18392c]">{fh.score !== null ? fh.score : "—"}</span>
                      <span className="text-sm font-semibold text-slate-400">/ 100</span>
                    </div>

                    {/* SCORE BREAKDOWN BARS */}
                    <div className="mt-5 space-y-3">
                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                          <span>Savings Health (Max 30)</span>
                          <span>{fh.breakdown?.savingsScore ?? "—"}/30</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${((fh.breakdown?.savingsScore || 0) / 30) * 100}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                          <span>Expense Control (Max 25)</span>
                          <span>{fh.breakdown?.expenseScore ?? "—"}/25</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${((fh.breakdown?.expenseScore || 0) / 25) * 100}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                          <span>Commitment Load (Max 25)</span>
                          <span>{fh.breakdown?.commitmentScore ?? "—"}/25</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${((fh.breakdown?.commitmentScore || 0) / 25) * 100}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                          <span>Allocation Capacity (Max 20)</span>
                          <span>{fh.breakdown?.allocationScore ?? "—"}/20</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-teal-500 rounded-full" style={{ width: `${((fh.breakdown?.allocationScore || 0) / 20) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* HEALTH INSIGHT */}
                  <div className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-500">
                    <p className="font-semibold text-[#18392c]">Key Assessment:</p>
                    <p className="mt-0.5">{fh.insights?.[0] || "Financial fundamentals evaluated against monthly budget parameters."}</p>
                  </div>
                </div>

                {/* NET WORTH & TIMELINE GRAPH */}
                <div className="bg-white p-6 rounded-2xl border border-[#e2e8dc] shadow-xs lg:col-span-2 flex flex-col justify-between">
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h2 className="text-sm font-bold text-[#18392c] uppercase tracking-wider">Net Worth Timeline</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Asset Growth & Liability Amortization Progression</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold text-slate-400">Closing Net Worth: </span>
                        <span className="text-sm font-bold text-[#315c46]">{fmtINR(nw.closingNetWorth)}</span>
                      </div>
                    </div>

                    {/* TIMELINE VISUALIZATION BARS */}
                    <div className="mt-6 grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-12 gap-2 items-end min-h-[140px] pt-4 pb-2 border-b border-slate-100">
                      {(nw.history || []).map((pt) => {
                        const maxVal = Math.max(...(nw.history || []).map((h) => h.netWorth), 100000);
                        const pct = Math.max(15, Math.min(100, Math.round((pt.netWorth / maxVal) * 100)));
                        return (
                          <div key={pt.month} className="flex flex-col items-center gap-1 group">
                            <span className="text-[10px] font-bold text-[#18392c] opacity-0 group-hover:opacity-100 transition-opacity">
                              {Math.round(pt.netWorth / 1000)}k
                            </span>
                            <div className="w-full bg-[#edf6e8] rounded-t-md relative flex items-end justify-center" style={{ height: "100px" }}>
                              <div
                                className="w-full bg-[#315c46] rounded-t-md transition-all group-hover:bg-[#204030]"
                                style={{ height: `${pct}%` }}
                              />
                            </div>
                            <span className="text-[10px] font-semibold text-slate-500">{pt.shortLabel}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ASSETS VS LIABILITIES SUMMARY */}
                  <div className="mt-4 pt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Opening Assets</span>
                      <span className="font-bold text-[#18392c]">{fmtINR(nw.openingNetWorth ? nw.openingNetWorth + nw.totalLiabilities : "—")}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Total Assets</span>
                      <span className="font-bold text-emerald-700">{fmtINR(nw.totalAssets)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Total Debt / Liability</span>
                      <span className="font-bold text-red-600">{fmtINR(nw.totalLiabilities)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Net Movement</span>
                      <span className={`font-bold ${nw.netWorthChange >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                        {fmtINR(nw.netWorthChange)} ({fmtPct(nw.netWorthChangePct)})
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ==================================================
                  2B. HOW YOUR AVAILABLE TO ALLOCATE WAS CALCULATED
                 ================================================== */}
              {(() => {
                const cb = reportData?.calculationBreakdown || {};
                const ob = cb.openingBalance || {};
                const infl = cb.inflow || {};
                const outf = cb.outflows || {};
                const fundsBefore = cb.fundsBeforeOutflows !== undefined
                  ? cb.fundsBeforeOutflows
                  : (fs.openingBalance + fs.totalIncome);
                const invAmt = outf.investments !== undefined ? outf.investments : fs.totalInvestmentContributionsPeriod;
                const goalAmt = outf.goalContributions !== undefined ? outf.goalContributions : fs.totalGoalContributionsPeriod;
                const insAmt = outf.insurancePayments !== undefined ? outf.insurancePayments : fs.totalInsurancePremiumsPeriod;
                const liabAmt = outf.liabilityPayments !== undefined ? outf.liabilityPayments : fs.totalLiabilityPaymentsPeriod;
                const expAmt = outf.expenses !== undefined ? outf.expenses : fs.totalExpenses;
                const availAmt = cb.availableToAllocate !== undefined ? cb.availableToAllocate : fs.availableToAllocate;

                return (
                  <div className="bg-white rounded-2xl border border-[#dce8d6] p-6 shadow-xs space-y-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b border-[#edf3ea] pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#315c46] text-white flex items-center justify-center shadow-md">
                          <FiLayers size={20} />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-[#5a806c]">
                            Authoritative Calculation
                          </span>
                          <h2 className="text-base font-bold text-[#18392c]">
                            How Your Available to Allocate Was Calculated
                          </h2>
                        </div>
                      </div>
                      <div className="px-3.5 py-1 rounded-full bg-[#eef7ec] border border-[#cfe5c7] text-xs font-bold text-[#274b38]">
                        Available to Allocate: {fmtINR(availAmt)}
                      </div>
                    </div>

                    {/* NATURAL LANGUAGE EXPLANATION */}
                    {cb.explanation && (
                      <div className="p-3.5 rounded-xl bg-[#f7faf5] border border-[#e2ece0] flex items-start gap-3">
                        <FiInfo className="text-[#315c46] shrink-0 mt-0.5" />
                        <p className="text-xs leading-relaxed text-[#335643] italic">
                          {cb.explanation}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
                      {/* OPENING BALANCE PROVENANCE */}
                      <div className="rounded-xl border border-[#e5ede2] bg-[#fafcf9] p-4 space-y-3">
                        <h3 className="font-bold text-[#2a503c] uppercase tracking-wider text-[11px]">
                          Existing / Opening Balance Source
                        </h3>

                        <div className="space-y-2 text-slate-700">
                          {ob.previousMonthLabel ? (
                            <div className="flex items-center justify-between py-1 border-b border-[#edf4e8]">
                              <span className="text-slate-500">Previous Month Closing ({ob.previousMonthLabel}):</span>
                              <span className="font-bold text-slate-800">{fmtINR(ob.previousMonthClosingBalance)}</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between py-1 border-b border-[#edf4e8]">
                              <span className="text-slate-500">Starting Source:</span>
                              <span className="font-bold text-slate-800">Initial user-entered starting balance</span>
                            </div>
                          )}

                          {ob.hasAdjustment && (
                            <div className="flex items-center justify-between py-1 border-b border-[#edf4e8] text-amber-700">
                              <span>Opening Balance Adjustment:</span>
                              <span className="font-bold">
                                {ob.adjustmentAmount > 0 ? "+" : ""}{fmtINR(ob.adjustmentAmount)}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-1 font-bold text-[#18392c]">
                            <span>Existing / Opening Balance:</span>
                            <span className="text-sm bg-white px-2.5 py-0.5 rounded-lg border border-[#cfe1ca] text-[#24533a]">
                              {fmtINR(ob.amount || fs.openingBalance)}
                            </span>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-400 mt-2">
                          Carried forward automatically through the FinanceOS carry-forward ledger chain.
                        </p>
                      </div>

                      {/* CASH FLOW WATERFALL */}
                      <div className="rounded-xl border border-[#dce8d6] bg-white p-4 space-y-2.5 shadow-xs">
                        <h3 className="font-bold text-[#2a503c] uppercase tracking-wider text-[11px]">
                          Cash Flow Calculation Waterfall
                        </h3>

                        <div className="space-y-1.5 divide-y divide-[#f0f5ee]">
                          <div className="flex items-center justify-between pt-1">
                            <span className="font-medium text-slate-600">Opening Balance</span>
                            <span className="font-bold text-slate-800">{fmtINR(ob.amount || fs.openingBalance)}</span>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 text-emerald-800 font-semibold">
                            <span>+ Total Period Inflow</span>
                            <span>+ {fmtINR(infl.totalIncome || fs.totalIncome)}</span>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 font-bold text-[#1f4835]">
                            <span>= Funds Available Before Outflows</span>
                            <span className="bg-[#eef5eb] px-2 py-0.5 rounded text-slate-900">{fmtINR(fundsBefore)}</span>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 text-slate-600">
                            <span>− Living Expenses</span>
                            <span className="font-semibold text-amber-800">− {fmtINR(expAmt)}</span>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 text-slate-600">
                            <span>− Investment Contributions</span>
                            <span className={invAmt > 0 ? "font-semibold text-amber-800" : "text-slate-400"}>
                              {invAmt > 0 ? `− ${fmtINR(invAmt)}` : "— No contribution recorded"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 text-slate-600">
                            <span>− Saving Goal Contributions</span>
                            <span className={goalAmt > 0 ? "font-semibold text-amber-800" : "text-slate-400"}>
                              {goalAmt > 0 ? `− ${fmtINR(goalAmt)}` : "— No contribution recorded"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 text-slate-600">
                            <span>− Insurance Premiums Paid</span>
                            <span className={insAmt > 0 ? "font-semibold text-amber-800" : "text-slate-400"}>
                              {insAmt > 0 ? `− ${fmtINR(insAmt)}` : "— No payment recorded"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-1.5 text-slate-600">
                            <span>− Liability / EMI Payments</span>
                            <span className={liabAmt > 0 ? "font-semibold text-amber-800" : "text-slate-400"}>
                              {liabAmt > 0 ? `− ${fmtINR(liabAmt)}` : "— No payment recorded"}
                            </span>
                          </div>

                          <div className="flex items-center justify-between pt-2 text-sm font-extrabold text-[#18392c] border-t-2 border-dashed border-[#dce8d6]">
                            <span>Available to Allocate</span>
                            <span className="text-base text-[#18392c] bg-[#edf6ea] px-3 py-1 rounded-xl border border-[#cbe1c3]">
                              {fmtINR(availAmt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* ==================================================
                  3. CASH FLOW & MONTHLY BREAKDOWN TABLE
                 ================================================== */}
              <div className="bg-white rounded-2xl border border-[#e2e8dc] shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-[#e5ece0] flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-[#18392c] uppercase tracking-wider">Cash Flow & Carry-Forward Statement</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Month-by-month inflows, living costs, committed allocations, and carried balances</p>
                  </div>
                  {duration !== "monthly" && (
                    <div className="text-xs font-semibold text-[#315c46] bg-[#edf4ea] px-3 py-1 rounded-full border border-[#d6e5d0]">
                      Avg Monthly Income: {fmtINR(fs.avgMonthlyIncome)}
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-[#f9faf7] text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-[#e5ece0]">
                      <tr>
                        <th className="px-5 py-3">Month</th>
                        <th className="px-4 py-3">Opening</th>
                        <th className="px-4 py-3">Income</th>
                        <th className="px-4 py-3">Expenses</th>
                        <th className="px-4 py-3">Net Savings</th>
                        <th className="px-4 py-3">Committed Outflows</th>
                        <th className="px-4 py-3">Closing</th>
                        <th className="px-4 py-3">Available Capacity</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf1ea]">
                      {monthDetails.map((m) => (
                        <tr key={m.month} className="hover:bg-[#fbfcf9] transition">
                          <td className="px-5 py-3.5 font-bold text-[#18392c]">{m.monthName}</td>
                          <td className="px-4 py-3.5">{m.hasRecord || m.openingBalance > 0 ? fmtINR(m.openingBalance) : "—"}</td>
                          <td className="px-4 py-3.5 font-semibold text-emerald-700">{m.totalIncome > 0 ? fmtINR(m.totalIncome) : "—"}</td>
                          <td className="px-4 py-3.5">{m.expenses > 0 ? fmtINR(m.expenses) : "—"}</td>
                          <td className={`px-4 py-3.5 font-semibold ${m.savings >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                            {m.hasRecord || m.totalIncome > 0 ? fmtINR(m.savings) : "—"}
                          </td>
                          <td className="px-4 py-3.5">{m.totalCommitments > 0 ? fmtINR(m.totalCommitments) : "—"}</td>
                          <td className="px-4 py-3.5 font-bold text-[#315c46]">{m.hasRecord || m.closingBalance > 0 ? fmtINR(m.closingBalance) : "—"}</td>
                          <td className="px-4 py-3.5 font-semibold text-blue-700">{m.hasRecord || m.availableToAllocate > 0 ? fmtINR(m.availableToAllocate) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ==================================================
                  4. PLANS LIFECYCLE: CREATED, STARTED & FUTURE EVENTS
                 ================================================== */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* PLANS CREATED & STARTED */}
                <div className="bg-white p-6 rounded-2xl border border-[#e2e8dc] shadow-xs space-y-4">
                  <div>
                    <h2 className="text-sm font-bold text-[#18392c] uppercase tracking-wider flex items-center gap-2">
                      <FiPlusCircle className="text-emerald-600" />
                      Plans Created / Started This Period
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">New financial commitments activated during this report cycle</p>
                  </div>

                  {plansLifecycle.plansCreatedThisPeriod?.length === 0 && plansLifecycle.plansStartedThisPeriod?.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-[#fafcf9] rounded-xl border border-dashed border-[#dce5d8]">
                      No new plans created or started during this period.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {plansLifecycle.plansCreatedThisPeriod?.map((item) => (
                        <div key={`created-${item.id}`} className="flex items-center justify-between p-3 rounded-xl bg-[#f7faf5] border border-[#e2ece0] text-xs">
                          <div>
                            <span className="font-bold text-[#18392c]">{item.name}</span>
                            <span className="text-[10px] text-slate-400 block">{item.category} • {item.type}</span>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">Created</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{formatDate(item.createdDate)}</span>
                          </div>
                        </div>
                      ))}
                      {plansLifecycle.plansStartedThisPeriod?.map((item) => (
                        <div key={`started-${item.id}`} className="flex items-center justify-between p-3 rounded-xl bg-[#f7f9fa] border border-[#e0e8ec] text-xs">
                          <div>
                            <span className="font-bold text-[#18392c]">{item.name}</span>
                            <span className="text-[10px] text-slate-400 block">{item.category} • {item.type}</span>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px]">Started</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{formatDate(item.startDate)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* MATURITIES & UPCOMING FUTURE EVENTS */}
                <div className="bg-white p-6 rounded-2xl border border-[#e2e8dc] shadow-xs space-y-4">
                  <div>
                    <h2 className="text-sm font-bold text-[#18392c] uppercase tracking-wider flex items-center gap-2">
                      <FiClock className="text-amber-600" />
                      Maturities & Upcoming Events
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">Maturity closures in-period and scheduled forward commitments</p>
                  </div>

                  {plansLifecycle.maturitiesInPeriod?.length === 0 && plansLifecycle.upcomingFutureEvents?.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400 bg-[#fafcf9] rounded-xl border border-dashed border-[#dce5d8]">
                      No maturity, renewal, or expiry activity in this period.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                      {plansLifecycle.maturitiesInPeriod?.map((mat) => (
                        <div key={`mat-${mat.id}`} className="flex items-center justify-between p-3 rounded-xl bg-[#fefbf6] border border-[#faecd8] text-xs">
                          <div>
                            <span className="font-bold text-[#18392c]">{mat.name}</span>
                            <span className="text-[10px] text-slate-400 block">{mat.event} • {formatDate(mat.eventDate)}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-amber-800">{fmtINR(mat.actualAmount || mat.expectedAmount)}</span>
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] block mt-0.5">Matured</span>
                          </div>
                        </div>
                      ))}
                      {plansLifecycle.upcomingFutureEvents?.slice(0, 5).map((up) => (
                        <div key={`up-${up.id}`} className="flex items-center justify-between p-3 rounded-xl bg-[#f9faf7] border border-[#e6ede0] text-xs">
                          <div>
                            <span className="font-bold text-[#18392c]">{up.name}</span>
                            <span className="text-[10px] text-slate-400 block">{up.event} ({up.monthsRemaining} mo remaining)</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-[#315c46]">{fmtINR(up.expectedAmount)}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">{formatDate(up.eventDate)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ==================================================
                  5. CHRONOLOGICAL ACTIVITY LEDGER
                 ================================================== */}
              <div className="bg-white rounded-2xl border border-[#e2e8dc] shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-[#e5ece0] flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-[#18392c] uppercase tracking-wider">Financial Activity Ledger</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Chronological record of actual payments, contributions, and interest receipts</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">{ledger.length} Transaction(s)</span>
                </div>

                {ledger.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No individual transaction activity recorded in this selected period.
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                    <table className="w-full text-left text-xs text-slate-600">
                      <thead className="bg-[#f9faf7] text-[11px] font-bold uppercase tracking-wider text-slate-500 sticky top-0 border-b border-[#e5ece0]">
                        <tr>
                          <th className="px-5 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Category</th>
                          <th className="px-4 py-2.5">Description</th>
                          <th className="px-4 py-2.5">Source</th>
                          <th className="px-4 py-2.5">Status</th>
                          <th className="px-4 py-2.5 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#edf1ea]">
                        {ledger.map((tx, idx) => (
                          <tr key={`${tx.name}-${tx.date}-${idx}`} className="hover:bg-[#fbfcf9] transition">
                            <td className="px-5 py-2.5 font-medium text-slate-500">{formatDate(tx.date)}</td>
                            <td className="px-4 py-2.5 font-semibold text-[#18392c]">{tx.category}</td>
                            <td className="px-4 py-2.5">{tx.description}</td>
                            <td className="px-4 py-2.5 text-slate-400">{tx.source || "—"}</td>
                            <td className="px-4 py-2.5">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                {tx.status || "Completed"}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-right font-bold text-[#18392c]">{fmtINR(tx.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* ==================================================
                  6. ASSET & LIABILITY BREAKDOWNS (GOALS, INVESTMENTS, INSURANCE, LOANS)
                 ================================================== */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SAVING GOALS SUMMARY */}
                <div className="bg-white p-6 rounded-2xl border border-[#e2e8dc] shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-[#18392c] uppercase tracking-wider flex items-center gap-2">
                      <FiTarget className="text-emerald-600" />
                      Saving Goals Progress
                    </h2>
                    <span className="text-xs font-bold text-emerald-700">Period Contrib: {fmtINR(fs.totalGoalContributionsPeriod)}</span>
                  </div>

                  {plans.savingGoals?.length === 0 ? (
                    <p className="text-xs text-slate-400">No active saving goals found.</p>
                  ) : (
                    <div className="space-y-3">
                      {plans.savingGoals?.map((g) => (
                        <div key={g.id} className="p-3.5 rounded-xl bg-[#f9faf7] border border-[#e5ede0] text-xs space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-[#18392c] text-sm">{g.name}</span>
                              <span className="text-[10px] text-slate-400 block">{g.category} • Target: {fmtINR(g.targetAmount)}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                              {g.status}
                            </span>
                          </div>

                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#315c46] h-full rounded-full" style={{ width: `${g.progressPercentage}%` }} />
                          </div>

                          <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                            <span>Saved: {fmtINR(g.totalSaved)} ({g.progressPercentage}%)</span>
                            <span>Period Added: {fmtINR(g.periodContributed)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* LIABILITIES & LOANS SUMMARY */}
                <div className="bg-white p-6 rounded-2xl border border-[#e2e8dc] shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-bold text-[#18392c] uppercase tracking-wider flex items-center gap-2">
                      <FiCreditCard className="text-red-600" />
                      Liabilities & Debt Amortization
                    </h2>
                    <span className="text-xs font-bold text-red-600">Period Paid: {fmtINR(fs.totalLiabilityPaymentsPeriod)}</span>
                  </div>

                  {plans.liabilities?.length === 0 ? (
                    <p className="text-xs text-slate-400">No active liabilities or loans recorded.</p>
                  ) : (
                    <div className="space-y-3">
                      {plans.liabilities?.map((l) => (
                        <div key={l.id} className="p-3.5 rounded-xl bg-[#faf9f9] border border-[#eddfe0] text-xs space-y-1.5">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-bold text-[#18392c] text-sm">{l.name}</span>
                              <span className="text-[10px] text-slate-400 block">{l.type} • Lender: {l.lender || "Bank"}</span>
                            </div>
                            <span className="text-right">
                              <span className="font-bold text-red-600 block">{fmtINR(l.remainingAmount)}</span>
                              <span className="text-[10px] text-slate-400">Outstanding</span>
                            </span>
                          </div>

                          <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                            <span>Monthly EMI: {fmtINR(l.monthlyEMI)}</span>
                            <span>Principal Paid in Period: {fmtINR(l.periodPrincipal)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ==================================================
                  7. STRATEGIC INSIGHTS & PERSONALIZED SUGGESTIONS
                 ================================================== */}
              <div className="bg-[#f0f6ec] p-6 rounded-2xl border border-[#d6e5d0] shadow-xs space-y-3">
                <h2 className="text-sm font-bold text-[#18392c] uppercase tracking-wider flex items-center gap-2">
                  <FiInfo className="text-[#315c46]" />
                  Strategic Financial Insights & Suggestions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#204030]">
                  {insights.map((ins, idx) => (
                    <div key={`ins-${idx}`} className="flex items-start gap-2 bg-white/70 p-3 rounded-xl border border-[#d8e8d2]">
                      <FiCheckCircle className="text-emerald-600 shrink-0 mt-0.5" />
                      <span>{typeof ins === "string" ? ins : (ins.description || ins.title)}</span>
                    </div>
                  ))}
                  {suggestions.map((sug, idx) => (
                    <div key={`sug-${idx}`} className="flex items-start gap-2 bg-white/70 p-3 rounded-xl border border-[#d8e8d2]">
                      <FiTrendingUp className="text-[#315c46] shrink-0 mt-0.5" />
                      <span>{typeof sug === "string" ? sug : (sug.description || sug.title || JSON.stringify(sug))}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}