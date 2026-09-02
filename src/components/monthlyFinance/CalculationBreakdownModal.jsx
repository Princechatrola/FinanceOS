// ============================================================
// FINANCEOS - DETAILED CALCULATION BREAKDOWN MODAL
// ============================================================
//
// Shows:
// 1. HOW EXISTING / OPENING BALANCE WAS CALCULATED (source, carry forward)
// 2. HOW AVAILABLE TO ALLOCATE WAS CALCULATED (waterfall: Opening + Inflow - Actual Outflows)
// 3. Dynamic Natural-Language Explanation
// 4. Distinguishes missing data ("— No payment recorded") from real zero
// 5. Planned vs Actual Commitments Transparency
// ============================================================

import React from "react";
import {
  FiX,
  FiArrowDown,
  FiCheckCircle,
  FiClock,
  FiInfo,
  FiDollarSign,
  FiTrendingUp,
  FiShield,
  FiCreditCard,
  FiTarget,
  FiLayers,
} from "react-icons/fi";

function fmt(val) {
  const n = Number(val);
  return Number.isFinite(n)
    ? `₹${Math.round(n).toLocaleString("en-IN")}`
    : "₹0";
}

export default function CalculationBreakdownModal({
  isOpen,
  onClose,
  breakdown,
  monthLabel,
}) {
  if (!isOpen || !breakdown) return null;

  const ob = breakdown.openingBalance || {};
  const inflow = breakdown.inflow || {};
  const outflows = breakdown.outflows || {};
  const commitments = breakdown.commitmentsContext || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-[#dce8d6] overflow-hidden">
        
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#e8efe4] bg-gradient-to-r from-[#f7fbf5] to-[#edf6ea]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#315c46] text-white flex items-center justify-center shadow-md">
              <FiLayers size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#5a806c]">
                Authoritative Financial Engine
              </span>
              <h2 className="text-lg font-bold text-[#18392c]">
                Calculation Breakdown — {breakdown.monthLabel || monthLabel}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Close modal"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* BODY SCROLL */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-[#18392c]">

          {/* DYNAMIC NATURAL LANGUAGE EXPLANATION */}
          {breakdown.explanation && (
            <div className="p-4 rounded-2xl bg-[#eef7ec] border border-[#cfe5c7] flex items-start gap-3.5">
              <div className="p-1.5 rounded-xl bg-[#315c46] text-white shrink-0 mt-0.5">
                <FiInfo size={16} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#274b38] uppercase tracking-wide">
                  Financial Summary
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[#305440]">
                  {breakdown.explanation}
                </p>
              </div>
            </div>
          )}

          {/* ====================================================
              SECTION 1: EXISTING / OPENING BALANCE BREAKDOWN
             ==================================================== */}
          <div className="rounded-2xl border border-[#e2e8dc] bg-[#fafcf9] p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#496e59]">
                1. Existing / Opening Balance Calculation
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e6f1e3] text-[#2b5940]">
                {ob.sourceType === "previous_month_closing"
                  ? "Carried Forward"
                  : ob.sourceType === "prior_month_closing"
                  ? "Prior Balance"
                  : "Initial Starting Balance"}
              </span>
            </div>

            <div className="space-y-2 text-xs divide-y divide-[#eef4ea]">
              {/* Previous Month Closing */}
              {ob.previousMonthLabel ? (
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="font-semibold text-slate-700">Previous Month Closing Balance</p>
                    <p className="text-[11px] text-slate-400">Source: {ob.previousMonthLabel}</p>
                  </div>
                  <span className="font-bold text-slate-800">{fmt(ob.previousMonthClosingBalance)}</span>
                </div>
              ) : (
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <p className="font-semibold text-slate-700">Initial Starting Balance</p>
                    <p className="text-[11px] text-slate-400">Source: User-entered starting balance</p>
                  </div>
                  <span className="font-bold text-slate-800">{fmt(ob.amount)}</span>
                </div>
              )}

              {/* Opening Adjustment (ONLY IF REAL ADJUSTMENT EXISTS) */}
              {ob.hasAdjustment && (
                <div className="flex items-center justify-between pt-2 text-amber-700">
                  <div>
                    <p className="font-semibold">Current Month Opening Adjustment</p>
                    <p className="text-[11px] text-amber-600/70">Manual adjustment entered in monthly finance</p>
                  </div>
                  <span className="font-bold">
                    {ob.adjustmentAmount > 0 ? `+ ${fmt(ob.adjustmentAmount)}` : `- ${fmt(Math.abs(ob.adjustmentAmount))}`}
                  </span>
                </div>
              )}

              {/* Result: Existing / Opening Balance */}
              <div className="flex items-center justify-between pt-3 text-sm font-bold text-[#1e4834]">
                <span>Existing / Opening Balance</span>
                <span className="text-base text-[#18392c] bg-white px-3 py-1 rounded-xl border border-[#d8e8d3]">
                  {fmt(ob.amount)}
                </span>
              </div>
            </div>
          </div>

          {/* ====================================================
              SECTION 2: AVAILABLE TO ALLOCATE / CASH FLOW WATERFALL
             ==================================================== */}
          <div className="rounded-2xl border border-[#dce8d6] bg-white p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#315c46]">
                2. Available to Allocate Calculation
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">
                Only Actual Outflows Deducted
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              
              {/* OPENING BALANCE */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#f8faf6] border border-[#ebf2e7]">
                <span className="font-medium text-slate-600">Opening / Existing Balance</span>
                <span className="font-bold text-slate-900">{fmt(ob.amount)}</span>
              </div>

              {/* (+) INCOME */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <div>
                  <span className="font-bold text-emerald-800">+ Current Month Income</span>
                  {inflow.additionalIncome > 0 && (
                    <p className="text-[10px] text-emerald-600">
                      Base: {fmt(inflow.baseIncome)} | Additional: {fmt(inflow.additionalIncome)}
                    </p>
                  )}
                </div>
                <span className="font-bold text-emerald-800">+ {fmt(inflow.totalIncome)}</span>
              </div>

              {/* TOTAL FUNDS BEFORE OUTFLOWS */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#eef5eb] border border-[#d5e7cf] font-bold text-[#1f4835]">
                <span>= Total Funds Available Before Outflows</span>
                <span className="text-sm">{fmt(breakdown.fundsBeforeOutflows)}</span>
              </div>

              <div className="pt-2 pb-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Actual Applicable Outflows Recorded:
                </p>
              </div>

              {/* (-) LIVING EXPENSES */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                <span className="text-slate-600 font-medium">− Living Expenses</span>
                <span className={`font-semibold ${outflows.expenses > 0 ? "text-amber-800" : "text-slate-400"}`}>
                  {outflows.expenses > 0 ? `− ${fmt(outflows.expenses)}` : "—"}
                </span>
              </div>

              {/* (-) ACTUAL INVESTMENT CONTRIBUTIONS */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                <div>
                  <span className="text-slate-600 font-medium">− Investment Contributions</span>
                  {outflows.hasInvestments ? (
                    <p className="text-[10px] text-slate-400">
                      {outflows.investmentDetails?.map(d => `${d.name} (${fmt(d.amount)})`).join(", ")}
                    </p>
                  ) : null}
                </div>
                <span className={`font-semibold ${outflows.hasInvestments ? "text-amber-800" : "text-slate-400"}`}>
                  {outflows.hasInvestments ? `− ${fmt(outflows.investments)}` : "— No contribution recorded"}
                </span>
              </div>

              {/* (-) ACTUAL GOAL CONTRIBUTIONS */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                <div>
                  <span className="text-slate-600 font-medium">− Saving Goal Contributions</span>
                  {outflows.hasGoals ? (
                    <p className="text-[10px] text-slate-400">
                      {outflows.goalDetails?.map(d => `${d.name} (${fmt(d.amount)})`).join(", ")}
                    </p>
                  ) : null}
                </div>
                <span className={`font-semibold ${outflows.hasGoals ? "text-amber-800" : "text-slate-400"}`}>
                  {outflows.hasGoals ? `− ${fmt(outflows.goalContributions)}` : "— No contribution recorded"}
                </span>
              </div>

              {/* (-) ACTUAL INSURANCE PAYMENTS */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                <div>
                  <span className="text-slate-600 font-medium">− Insurance Payments</span>
                  {outflows.hasInsurance ? (
                    <p className="text-[10px] text-slate-400">
                      {outflows.insuranceDetails?.map(d => `${d.name} (${fmt(d.amount)})`).join(", ")}
                    </p>
                  ) : null}
                </div>
                <span className={`font-semibold ${outflows.hasInsurance ? "text-amber-800" : "text-slate-400"}`}>
                  {outflows.hasInsurance ? `− ${fmt(outflows.insurancePayments)}` : "— No payment recorded"}
                </span>
              </div>

              {/* (-) ACTUAL LIABILITY / EMI PAYMENTS */}
              <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                <div>
                  <span className="text-slate-600 font-medium">− Liability / EMI Payments</span>
                  {outflows.hasLiabilities ? (
                    <p className="text-[10px] text-slate-400">
                      {outflows.liabilityDetails?.map(d => `${d.name} (${fmt(d.amount)})`).join(", ")}
                    </p>
                  ) : null}
                </div>
                <span className={`font-semibold ${outflows.hasLiabilities ? "text-amber-800" : "text-slate-400"}`}>
                  {outflows.hasLiabilities ? `− ${fmt(outflows.liabilityPayments)}` : "— No payment recorded"}
                </span>
              </div>

              {/* (-) OTHER OUTFLOWS (ONLY IF EXIST) */}
              {outflows.hasOther && (
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50">
                  <span className="text-slate-600 font-medium">− Other Actual Outflows</span>
                  <span className="font-semibold text-amber-800">− {fmt(outflows.other)}</span>
                </div>
              )}

              {/* DIVIDER */}
              <div className="border-t-2 border-dashed border-[#dce8d6] my-2" />

              {/* AVAILABLE TO ALLOCATE / CLOSING BALANCE */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-[#edf6ea] to-[#e4f1df] border border-[#cbe1c3]">
                <div>
                  <p className="text-sm font-extrabold text-[#18392c]">Available to Allocate</p>
                  <p className="text-[10px] text-[#4d725d]">
                    Equal to Ending Liquid Balance for {breakdown.monthName}
                  </p>
                </div>
                <span className="text-xl font-extrabold text-[#18392c]">
                  {fmt(breakdown.availableToAllocate)}
                </span>
              </div>
            </div>
          </div>

          {/* ====================================================
              SECTION 3: COMMITMENT CONTEXT & SCHEDULE OVERVIEW
             ==================================================== */}
          {commitments.totalPlannedExpected > 0 && (
            <div className="rounded-2xl border border-[#e2e8dc] bg-[#fafcf9] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Monthly Commitment Status (Planned vs Actual Paid)
                </span>
                <span className="text-[11px] font-bold text-[#315c46]">
                  {fmt(commitments.totalActualPaid)} Paid of {fmt(commitments.totalPlannedExpected)} Planned
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-white border border-[#e8efe5]">
                  <p className="text-[10px] text-slate-400 font-semibold">SIP / Invest</p>
                  <p className="font-bold text-slate-800 mt-0.5">{fmt(commitments.actualInvestmentContributions)}</p>
                  <p className="text-[9px] text-slate-400">of {fmt(commitments.plannedInvestmentsExpected)}</p>
                </div>

                <div className="p-2 rounded-xl bg-white border border-[#e8efe5]">
                  <p className="text-[10px] text-slate-400 font-semibold">Goals</p>
                  <p className="font-bold text-slate-800 mt-0.5">{fmt(commitments.actualGoalContributions)}</p>
                  <p className="text-[9px] text-slate-400">of {fmt(commitments.plannedGoalsExpected)}</p>
                </div>

                <div className="p-2 rounded-xl bg-white border border-[#e8efe5]">
                  <p className="text-[10px] text-slate-400 font-semibold">Insurance</p>
                  <p className="font-bold text-slate-800 mt-0.5">{fmt(commitments.actualInsurancePayments)}</p>
                  <p className="text-[9px] text-slate-400">of {fmt(commitments.plannedInsuranceExpected)}</p>
                </div>

                <div className="p-2 rounded-xl bg-white border border-[#e8efe5]">
                  <p className="text-[10px] text-slate-400 font-semibold">Loan EMIs</p>
                  <p className="font-bold text-slate-800 mt-0.5">{fmt(commitments.actualLiabilityPayments)}</p>
                  <p className="text-[9px] text-slate-400">of {fmt(commitments.plannedLiabilitiesExpected)}</p>
                </div>
              </div>

              {commitments.totalUnpaidCommitments > 0 && (
                <p className="text-[11px] text-slate-500 italic">
                  Note: ₹{Math.round(commitments.totalUnpaidCommitments).toLocaleString("en-IN")} of scheduled commitments have not yet been recorded as paid this month. Available to Allocate is reduced only when actual payments are recorded.
                </p>
              )}
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-[#e8efe4] bg-[#f8faf6] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-[#2a543f] bg-[#e4efe0] hover:bg-[#d5e7cf] rounded-xl transition-all cursor-pointer"
          >
            Close Breakdown
          </button>
        </div>
      </div>
    </div>
  );
}
