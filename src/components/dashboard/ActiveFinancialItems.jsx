// ============================================================
// FINANCEOS - ACTIVE FINANCIAL ITEMS (TYPE-SPECIFIC RICH DETAILS)
// ============================================================
// Displays live, MongoDB-driven cards with rich type-specific
// financial metrics for Saving Goals, Investments (SIP, FD, RD,
// Mutual Funds, Gold, Stocks), Insurance (Life, Health, Vehicle, Home),
// and Liabilities (Loans, Credit Cards).
// ============================================================

import React, { useMemo } from "react";
import {
  FiTarget,
  FiTrendingUp,
  FiShield,
  FiCreditCard,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiCheck,
  FiDollarSign,
  FiPieChart,
  FiLayers,
} from "react-icons/fi";

import GoalFeasibility from "./GoalFeasibility.jsx";
import useFinance from "../../context/useFinance.js";
import { isItemActiveInMonth } from "../../utils/monthLifecycle.js";

// Helper: Format Money
function formatMoney(amount) {
  const n = Number(amount || 0);
  if (!Number.isFinite(n)) return "0";
  return n.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });
}

// Helper: Format Date
function formatDate(dateValue) {
  if (!dateValue) return "—";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return String(dateValue);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Helper: Format Date (short)
function formatDateShort(dateValue) {
  if (!dateValue) return "—";
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return String(dateValue);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

function ActiveFinancialItems({
  savingGoals = [],
  investments = [],
  insurancePolicies = [],
  liabilities = [],
  availableToAllocate = 0,
  selectedPeriod,
}) {
  const { selectedMonth } = useFinance();

  // Resolve target year and month
  const { targetYear, targetMonth, formattedPeriod } = useMemo(() => {
    if (selectedPeriod?.year && selectedPeriod?.month) {
      return {
        targetYear: selectedPeriod.year,
        targetMonth: selectedPeriod.month,
        formattedPeriod: selectedPeriod.formatted || `${selectedPeriod.month}/${selectedPeriod.year}`,
      };
    }
    const saved = selectedMonth || (typeof window !== "undefined" ? sessionStorage.getItem("financeos_selected_month") : "");
    if (saved && /^\d{4}-\d{1,2}$/.test(saved)) {
      const [y, m] = saved.split("-").map(Number);
      const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
      return {
        targetYear: y,
        targetMonth: m,
        formattedPeriod: `${months[m - 1]} ${y}`,
      };
    }
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1;
    const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
    return {
      targetYear: curYear,
      targetMonth: curMonth,
      formattedPeriod: `${months[curMonth - 1]} ${curYear}`,
    };
  }, [selectedPeriod, selectedMonth]);

  const filteredGoals = useMemo(
    () => savingGoals.filter((g) => isItemActiveInMonth(g, targetYear, targetMonth)),
    [savingGoals, targetYear, targetMonth]
  );
  const filteredInvestments = useMemo(
    () => investments.filter((i) => isItemActiveInMonth(i, targetYear, targetMonth)),
    [investments, targetYear, targetMonth]
  );
  const filteredPolicies = useMemo(
    () => insurancePolicies.filter((p) => isItemActiveInMonth(p, targetYear, targetMonth)),
    [insurancePolicies, targetYear, targetMonth]
  );
  const filteredLiabilities = useMemo(
    () => liabilities.filter((l) => isItemActiveInMonth(l, targetYear, targetMonth)),
    [liabilities, targetYear, targetMonth]
  );

  const hasItems =
    filteredGoals.length > 0 ||
    filteredInvestments.length > 0 ||
    filteredPolicies.length > 0 ||
    filteredLiabilities.length > 0;

  if (!hasItems) {
    return null;
  }

  return (
    <section className="mt-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5 gap-2">
        <div>
          <h2 className="text-lg font-bold text-[#18392c] flex items-center gap-2">
            <FiLayers className="text-[#315c46]" />
            <span>Active Financial Items</span>
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Real-time breakdown and lifecycle metrics for {formattedPeriod}.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-[#edf6e8] border border-[#d6e8ce] px-3 py-1 text-xs font-bold text-[#315c46]">
          <FiCalendar size={13} />
          {formattedPeriod}
        </span>
      </div>

      {/* Grid of Financial Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {/* ====================================================
            1. SAVING GOALS
           ==================================================== */}
        {filteredGoals.map((goal) => {
          const target = Number(goal.targetAmount || 0);
          const saved = Number(goal.currentAmount || goal.totalContributed || goal.savedAmount || 0);
          const remaining = Math.max(target - saved, 0);
          const progress = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
          const monthlyPlanned = Number(goal.monthlyContribution || goal.monthlyAllocation || 0);

          // Find contributions made specifically in the target month
          const monthContributions = (goal.contributions || goal.transactions || []).filter((c) => {
            const d = new Date(c.date || c.createdAt);
            return (
              !Number.isNaN(d.getTime()) &&
              d.getFullYear() === targetYear &&
              d.getMonth() + 1 === targetMonth
            );
          });
          const monthContributedTotal = monthContributions.reduce(
            (sum, c) => sum + Number(c.amount || 0),
            0
          );
          const isMonthFunded = monthContributedTotal > 0;

          // Duration in months
          const startDate = goal.startDate ? new Date(goal.startDate) : new Date();
          const targetDate = goal.targetDate ? new Date(goal.targetDate) : new Date();
          const durationMonths = Math.max(
            1,
            Math.ceil((targetDate - startDate) / (1000 * 60 * 60 * 24 * 30))
          );

          const goalAvailableCapacity = availableToAllocate + monthlyPlanned;

          return (
            <div
              key={`goal-${goal._id || goal.id}`}
              className="group rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf6e8] border border-[#d6e8ce] px-2.5 py-0.5 text-[11px] font-bold text-[#315c46]">
                    <FiTarget size={12} />
                    {goal.category || "Saving Goal"}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      goal.status === "Active"
                        ? "bg-emerald-100 text-emerald-800"
                        : goal.status === "Completed"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {goal.status || "Active"}
                  </span>
                </div>

                {/* Goal Name */}
                <h3 className="mt-3 text-base font-bold text-[#18392c]">
                  {goal.goalName || goal.name}
                </h3>

                {/* Progress & Target Overview */}
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Total Saved
                    </p>
                    <p className="mt-0.5 text-lg font-extrabold text-[#315c46]">
                      ₹{formatMoney(saved)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Target
                    </p>
                    <p className="mt-0.5 text-sm font-bold text-[#18392c]">
                      ₹{formatMoney(target)}
                    </p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-2.5">
                  <div className="h-2 w-full rounded-full bg-[#edf4ea] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#315c46] transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="mt-1 flex justify-between text-[10px] font-semibold">
                    <span className="text-slate-400">Remaining: ₹{formatMoney(remaining)}</span>
                    <span className="text-[#315c46]">{progress.toFixed(1)}%</span>
                  </div>
                </div>

                {/* Month-Specific Activity Box */}
                <div className="mt-3.5 rounded-xl border border-[#edf3ea] bg-[#fbfdfa] p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-500">
                      {formattedPeriod} Activity:
                    </span>
                    {isMonthFunded ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                        <FiCheckCircle size={12} />
                        +₹{formatMoney(monthContributedTotal)}
                      </span>
                    ) : (
                      <span className="font-medium text-slate-400">No contribution recorded</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Monthly Target:</span>
                    <span className="font-bold text-[#18392c]">₹{formatMoney(monthlyPlanned)}</span>
                  </div>
                  {goal.targetDate && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Target Date:</span>
                      <span className="font-medium text-slate-700">{formatDate(goal.targetDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Feasibility Check */}
              <div className="mt-3 pt-3 border-t border-slate-100">
                <GoalFeasibility
                  targetAmount={target}
                  currentAmount={saved}
                  durationMonths={durationMonths}
                  availableToAllocate={goalAvailableCapacity}
                />
              </div>
            </div>
          );
        })}

        {/* ====================================================
            2. INVESTMENTS (SIP, RD, FD, MUTUAL FUNDS, GOLD, STOCKS)
           ==================================================== */}
        {filteredInvestments.map((inv) => {
          const invType = inv.type || "Investment";
          const isSIP = invType === "SIP";
          const isRD = invType === "Recurring Deposit";
          const isFD = invType === "Fixed Deposit";
          const isMutualFund = invType === "Mutual Fund";
          const isGold = invType === "Gold";
          const isStocks = invType === "Stocks";

          // Calculate Month-Specific Status for Recurring (SIP / RD)
          let monthPaidAmount = 0;
          let monthStatus = "Remaining";
          let monthDueDate = inv.nextContributionDate || inv.dueDate;

          if (isSIP || isRD) {
            const history = inv.sipContributions || [];
            const thisMonthRecord = history.find((c) => {
              const d = new Date(c.dueDate || c.paidDate);
              return (
                !Number.isNaN(d.getTime()) &&
                d.getFullYear() === targetYear &&
                d.getMonth() + 1 === targetMonth
              );
            });
            if (thisMonthRecord) {
              if (thisMonthRecord.status === "Paid" || thisMonthRecord.paidDate) {
                monthPaidAmount = Number(thisMonthRecord.amount || inv.monthlyContribution || 0);
                monthStatus = "Paid";
              } else if (thisMonthRecord.status === "Skipped") {
                monthStatus = "Skipped";
              }
            }
          }

          const monthlyDueAmount = Number(inv.monthlyContribution || inv.amount || 0);
          const monthRemaining = Math.max(monthlyDueAmount - monthPaidAmount, 0);

          return (
            <div
              key={`investment-${inv._id || inv.id}`}
              className="group rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf6e8] border border-[#d6e8ce] px-2.5 py-0.5 text-[11px] font-bold text-[#315c46]">
                    <FiTrendingUp size={12} />
                    {invType}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      inv.status === "Active"
                        ? "bg-emerald-100 text-emerald-800"
                        : inv.status === "Matured"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {inv.status || "Active"}
                  </span>
                </div>

                {/* Investment Name */}
                <h3 className="mt-3 text-base font-bold text-[#18392c]">
                  {inv.name}
                </h3>
                {inv.schemeName && inv.schemeName !== inv.name && (
                  <p className="text-[11px] text-slate-400 font-medium">{inv.schemeName}</p>
                )}

                {/* ==============================================
                    A. SIP / RECURRING DEPOSIT DETAILS
                   ============================================== */}
                {(isSIP || isRD) && (
                  <div className="mt-3 space-y-2.5">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Monthly Installment
                        </p>
                        <p className="mt-0.5 text-base font-extrabold text-[#315c46]">
                          ₹{formatMoney(monthlyDueAmount)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Total Invested
                        </p>
                        <p className="mt-0.5 text-sm font-bold text-[#18392c]">
                          ₹{formatMoney(inv.totalContributions || inv.amount || inv.currentValue || 0)}
                        </p>
                      </div>
                    </div>

                    {/* Month Specific Status */}
                    <div className="rounded-xl border border-[#edf3ea] bg-[#fbfdfa] p-3 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-500">{formattedPeriod} Status:</span>
                        <span
                          className={`font-bold inline-flex items-center gap-1 ${
                            monthStatus === "Paid"
                              ? "text-emerald-700"
                              : "text-amber-700"
                          }`}
                        >
                          {monthStatus === "Paid" ? <FiCheckCircle size={12} /> : <FiClock size={12} />}
                          {monthStatus === "Paid" ? "Paid (₹" + formatMoney(monthPaidAmount) + ")" : "Remaining (₹" + formatMoney(monthRemaining) + ")"}
                        </span>
                      </div>

                      {monthDueDate && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Due Date:</span>
                          <span className="font-medium text-slate-700">{formatDate(monthDueDate)}</span>
                        </div>
                      )}

                      {inv.autoPay?.enabled && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>AutoPay:</span>
                          <span className="font-semibold text-[#315c46]">
                            Active {inv.autoPay.bankName ? `• ${inv.autoPay.bankName}` : ""}
                            {inv.autoPay.accountLast4 ? ` (••••${inv.autoPay.accountLast4})` : ""}
                          </span>
                        </div>
                      )}

                      {inv.startDate && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Started:</span>
                          <span className="font-medium text-slate-700">{formatDate(inv.startDate)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ==============================================
                    B. FIXED DEPOSIT (FD) DETAILS
                   ============================================== */}
                {isFD && (
                  <div className="mt-3 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Principal Amount
                        </p>
                        <p className="mt-0.5 text-base font-extrabold text-[#18392c]">
                          ₹{formatMoney(inv.amount || inv.principalAmount || 0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Maturity Value
                        </p>
                        <p className="mt-0.5 text-base font-extrabold text-emerald-700">
                          ₹{formatMoney(inv.currentValue || inv.maturityAmount || inv.amount || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#edf3ea] bg-[#fbfdfa] p-3 text-xs space-y-1.5">
                      {inv.interestRate && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Interest Rate:</span>
                          <span className="font-bold text-[#315c46]">{inv.interestRate}% p.a.</span>
                        </div>
                      )}
                      {inv.institution && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Bank / Institution:</span>
                          <span className="font-semibold text-slate-700">{inv.institution}</span>
                        </div>
                      )}
                      {inv.maturityDate && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Maturity Date:</span>
                          <span className="font-medium text-slate-700">{formatDate(inv.maturityDate)}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Payout Method:</span>
                        <span className="font-medium text-slate-700">
                          {inv.payoutFrequency || "Cumulative on Maturity"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ==============================================
                    C. MUTUAL FUND DETAILS
                   ============================================== */}
                {isMutualFund && (
                  <div className="mt-3 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Invested Amount
                        </p>
                        <p className="mt-0.5 text-base font-extrabold text-[#18392c]">
                          ₹{formatMoney(inv.amount || 0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Current Value
                        </p>
                        <p className="mt-0.5 text-base font-extrabold text-emerald-700">
                          ₹{formatMoney(inv.currentValue || inv.amount || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#edf3ea] bg-[#fbfdfa] p-3 text-xs space-y-1.5">
                      {inv.units > 0 && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Units Held:</span>
                          <span className="font-semibold text-slate-700">{Number(inv.units).toFixed(3)}</span>
                        </div>
                      )}
                      {inv.nav > 0 && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Purchase NAV:</span>
                          <span className="font-semibold text-slate-700">₹{Number(inv.nav).toFixed(2)}</span>
                        </div>
                      )}
                      {inv.amc && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Fund House:</span>
                          <span className="font-medium text-slate-700">{inv.amc}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ==============================================
                    D. GOLD DETAILS
                   ============================================== */}
                {isGold && (
                  <div className="mt-3 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Purchase Value
                        </p>
                        <p className="mt-0.5 text-base font-extrabold text-[#18392c]">
                          ₹{formatMoney(inv.amount || 0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Current Value
                        </p>
                        <p className="mt-0.5 text-base font-extrabold text-amber-700">
                          ₹{formatMoney(inv.currentValue || inv.amount || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#edf3ea] bg-[#fbfdfa] p-3 text-xs space-y-1.5">
                      {inv.goldType && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Gold Form:</span>
                          <span className="font-bold text-[#18392c]">{inv.goldType}</span>
                        </div>
                      )}
                      {inv.weight > 0 && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Weight & Purity:</span>
                          <span className="font-semibold text-slate-700">
                            {inv.weight}g {inv.purity ? `• ${inv.purity}` : ""}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ==============================================
                    E. STOCKS & OTHER DETAILS
                   ============================================== */}
                {isStocks && (
                  <div className="mt-3 space-y-2.5">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Total Invested
                        </p>
                        <p className="mt-0.5 text-base font-extrabold text-[#18392c]">
                          ₹{formatMoney(inv.amount || 0)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          Current Value
                        </p>
                        <p className="mt-0.5 text-base font-extrabold text-emerald-700">
                          ₹{formatMoney(inv.currentValue || inv.amount || 0)}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-[#edf3ea] bg-[#fbfdfa] p-3 text-xs space-y-1.5">
                      {inv.symbol && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Ticker / Symbol:</span>
                          <span className="font-bold text-[#315c46]">{inv.symbol}</span>
                        </div>
                      )}
                      {inv.quantity > 0 && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Shares & Buy Price:</span>
                          <span className="font-semibold text-slate-700">
                            {inv.quantity} shares {inv.purchasePrice ? `@ ₹${formatMoney(inv.purchasePrice)}` : ""}
                          </span>
                        </div>
                      )}
                      {inv.broker && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Broker:</span>
                          <span className="font-medium text-slate-700">{inv.broker}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Fallback for other investment types */}
                {!isSIP && !isRD && !isFD && !isMutualFund && !isGold && !isStocks && (
                  <div className="mt-3 rounded-xl border border-[#edf3ea] bg-[#fbfdfa] p-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Invested Amount:</span>
                      <span className="font-bold text-[#18392c]">₹{formatMoney(inv.amount)}</span>
                    </div>
                    {inv.currentValue > 0 && (
                      <div className="flex items-center justify-between text-[11px] text-slate-500">
                        <span>Current Value:</span>
                        <span className="font-bold text-emerald-700">₹{formatMoney(inv.currentValue)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Updated in MongoDB</span>
                <span className="font-semibold text-slate-600">
                  {inv.updatedAt ? formatDateShort(inv.updatedAt) : "Live"}
                </span>
              </div>
            </div>
          );
        })}

        {/* ====================================================
            3. INSURANCE POLICIES (LIFE, HEALTH, VEHICLE, HOME)
           ==================================================== */}
        {filteredPolicies.map((policy) => {
          const policyType = policy.type || "Insurance";
          const premium = Number(policy.premiumAmount || policy.amount || policy.monthlyPremium || 0);
          const coverage = Number(policy.sumAssured || policy.coverageAmount || policy.coverage || 0);

          // Check Month-Specific Payment Status
          let monthStatus = "Remaining";
          let monthPaidAmount = 0;
          const payments = policy.payments || [];
          const thisMonthPayment = payments.find((p) => {
            const d = new Date(p.date || p.paidDate);
            return (
              !Number.isNaN(d.getTime()) &&
              d.getFullYear() === targetYear &&
              d.getMonth() + 1 === targetMonth
            );
          });
          if (thisMonthPayment) {
            monthStatus = "Paid";
            monthPaidAmount = Number(thisMonthPayment.amount || premium);
          }

          return (
            <div
              key={`insurance-${policy._id || policy.id}`}
              className="group rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef4f0] border border-[#d6e5da] px-2.5 py-0.5 text-[11px] font-bold text-[#315c46]">
                    <FiShield size={12} />
                    {policyType}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      policy.status === "Active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {policy.status || "Active"}
                  </span>
                </div>

                {/* Policy Name & Provider */}
                <h3 className="mt-3 text-base font-bold text-[#18392c]">
                  {policy.name || policy.policyName}
                </h3>
                {policy.provider && (
                  <p className="text-[11px] text-slate-400 font-medium">
                    {policy.provider} {policy.policyNumber ? `• ••••${String(policy.policyNumber).slice(-4)}` : ""}
                  </p>
                )}

                {/* Premium & Coverage Overview */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Premium
                    </p>
                    <p className="mt-0.5 text-base font-extrabold text-[#315c46]">
                      ₹{formatMoney(premium)}
                    </p>
                    <span className="text-[10px] text-slate-400">
                      {policy.premiumFrequency ? `/${policy.premiumFrequency}` : "/Year"}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Coverage / Sum Assured
                    </p>
                    <p className="mt-0.5 text-base font-extrabold text-[#18392c]">
                      ₹{formatMoney(coverage)}
                    </p>
                  </div>
                </div>

                {/* Month-Specific Premium & Policy Details Box */}
                <div className="mt-3 rounded-xl border border-[#edf3ea] bg-[#fbfdfa] p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-500">{formattedPeriod} Premium:</span>
                    <span
                      className={`font-bold inline-flex items-center gap-1 ${
                        monthStatus === "Paid" ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {monthStatus === "Paid" ? <FiCheckCircle size={12} /> : <FiClock size={12} />}
                      {monthStatus === "Paid" ? "Paid (₹" + formatMoney(monthPaidAmount) + ")" : "Due in " + formattedPeriod}
                    </span>
                  </div>

                  {policy.renewalDate && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Renewal / Due Date:</span>
                      <span className="font-medium text-slate-700">{formatDate(policy.renewalDate)}</span>
                    </div>
                  )}

                  {policy.startDate && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Policy Start Date:</span>
                      <span className="font-medium text-slate-700">{formatDate(policy.startDate)}</span>
                    </div>
                  )}

                  {policy.maturityDate && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Maturity Date:</span>
                      <span className="font-medium text-slate-700">{formatDate(policy.maturityDate)}</span>
                    </div>
                  )}

                  {/* Health specific info */}
                  {policy.healthDetails?.membersCount && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Covered Members:</span>
                      <span className="font-medium text-slate-700">{policy.healthDetails.membersCount} Persons</span>
                    </div>
                  )}

                  {/* Vehicle specific info */}
                  {policy.vehicleDetails?.vehicleNumber && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Vehicle Reg:</span>
                      <span className="font-medium text-slate-700">{policy.vehicleDetails.vehicleNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Insured Protection</span>
                <span className="font-semibold text-emerald-800">Active</span>
              </div>
            </div>
          );
        })}

        {/* ====================================================
            4. LIABILITIES (LOANS, EMIS, CREDIT CARDS)
           ==================================================== */}
        {filteredLiabilities.map((liability) => {
          const isCC = liability.type === "Credit Card";
          const original = Number(liability.principalAmount || liability.loanAmount || 0);
          const remaining = Number(liability.remainingAmount || liability.outstandingAmount || 0);
          const monthlyEMI = Number(liability.monthlyEMI || 0);

          // Check Month-Specific EMI Payment Status
          let monthStatus = "Remaining";
          let monthPaidAmount = 0;
          const payments = liability.payments || [];
          const thisMonthPayment = payments.find((p) => {
            const d = new Date(p.date || p.paidDate);
            return (
              !Number.isNaN(d.getTime()) &&
              d.getFullYear() === targetYear &&
              d.getMonth() + 1 === targetMonth
            );
          });
          if (thisMonthPayment) {
            monthStatus = "Paid";
            monthPaidAmount = Number(thisMonthPayment.amount || monthlyEMI);
          }

          const progressVal =
            original > 0
              ? isCC
                ? (remaining / original) * 100
                : ((original - remaining) / original) * 100
              : 0;

          const progressColor = isCC ? "bg-amber-600" : "bg-[#315c46]";

          return (
            <div
              key={`liability-${liability._id || liability.id}`}
              className="group rounded-2xl border border-[#dfe8dc] bg-white p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Header Badge */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff3e8] border border-[#f5dfca] px-2.5 py-0.5 text-[11px] font-bold text-[#9a642c]">
                    <FiCreditCard size={12} />
                    {liability.type || "Liability"}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      liability.status === "Active"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {liability.status || "Active"}
                  </span>
                </div>

                {/* Liability Name & Lender */}
                <h3 className="mt-3 text-base font-bold text-[#18392c]">
                  {liability.name}
                </h3>
                {liability.lender && (
                  <p className="text-[11px] text-slate-400 font-medium">
                    {liability.lender} {liability.accountNumber ? `• ••••${String(liability.accountNumber).slice(-4)}` : ""}
                  </p>
                )}

                {/* Principal and Remaining Grid */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      {isCC ? "Credit Limit" : "Original Amount"}
                    </p>
                    <p className="mt-0.5 text-base font-extrabold text-[#18392c]">
                      ₹{formatMoney(original)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Outstanding
                    </p>
                    <p className="mt-0.5 text-base font-extrabold text-amber-700">
                      ₹{formatMoney(remaining)}
                    </p>
                  </div>
                </div>

                {/* Repayment Progress */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                    <span>{isCC ? "Limit Utilization" : "Repayment Progress"}</span>
                    <span className="text-[#18392c]">{progressVal.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#edf4ea] overflow-hidden">
                    <div
                      className={`h-full ${progressColor} transition-all duration-300`}
                      style={{ width: `${Math.min(Math.max(progressVal, 0), 100)}%` }}
                    />
                  </div>
                </div>

                {/* Month-Specific EMI Box */}
                <div className="mt-3 rounded-xl border border-[#edf3ea] bg-[#fbfdfa] p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-500">{formattedPeriod} Payment:</span>
                    <span
                      className={`font-bold inline-flex items-center gap-1 ${
                        monthStatus === "Paid" ? "text-emerald-700" : "text-amber-700"
                      }`}
                    >
                      {monthStatus === "Paid" ? <FiCheckCircle size={12} /> : <FiClock size={12} />}
                      {monthStatus === "Paid" ? "Paid (₹" + formatMoney(monthPaidAmount) + ")" : "Remaining (₹" + formatMoney(monthlyEMI) + ")"}
                    </span>
                  </div>

                  {monthlyEMI > 0 && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Monthly EMI:</span>
                      <span className="font-bold text-[#18392c]">₹{formatMoney(monthlyEMI)}</span>
                    </div>
                  )}

                  {liability.interestRate && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Interest Rate:</span>
                      <span className="font-semibold text-slate-700">{liability.interestRate}% p.a.</span>
                    </div>
                  )}

                  {liability.nextDueDate && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Next Due Date:</span>
                      <span className="font-medium text-slate-700">{formatDate(liability.nextDueDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Liability Status</span>
                <span className="font-semibold text-amber-800">
                  {remaining === 0 ? "Fully Cleared" : "Under Repayment"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ActiveFinancialItems;