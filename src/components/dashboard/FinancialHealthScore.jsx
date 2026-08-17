// ============================================================
// FINANCEOS - FINANCIAL HEALTH SCORE COMPONENT
// ============================================================
//
// Purpose:
//
// Display the Financial Health Score calculated by:
//
// src/utils/financialHealth.js
//
// Score:
// 0 - 100
//
// Breakdown:
//
// - Savings Health       /30
// - Expense Control      /25
// - Commitment Load      /25
// - Allocation Capacity  /20
//
// This component does NOT calculate financial values itself.
// It receives:
//
// income
// expenses
// totalCommitments
// availableToAllocate
//
// and sends them to calculateFinancialHealth().
//
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

import {
  FiActivity,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
  FiTrendingUp,
} from "react-icons/fi";


import {
  calculateFinancialHealth,
} from "../../utils/financialHealth.js";


// ============================================================
// FORMAT PERCENTAGE
// ============================================================

function formatPercentage(
  value
) {

  return `${Number(
    value || 0
  ).toFixed(1)}%`;

}


// ============================================================
// GET SCORE APPEARANCE
// ============================================================

function getScoreAppearance(
  level
) {


  // EXCELLENT

  if (
    level ===
    "excellent"
  ) {

    return {

      box:
        "border-[#b9d9a8] bg-[#f2faed]",

      circle:
        "border-[#7aa86f] bg-white text-[#315c46]",

      badge:
        "bg-[#dff0d4] text-[#315c46]",

      icon:
        FiCheckCircle,

    };

  }


  // GOOD

  if (
    level ===
    "good"
  ) {

    return {

      box:
        "border-[#d3e4c7] bg-[#f7fbf4]",

      circle:
        "border-[#8eb17f] bg-white text-[#315c46]",

      badge:
        "bg-[#e8f3e1] text-[#315c46]",

      icon:
        FiTrendingUp,

    };

  }


  // FAIR

  if (
    level ===
    "fair"
  ) {

    return {

      box:
        "border-amber-200 bg-amber-50",

      circle:
        "border-amber-400 bg-white text-amber-700",

      badge:
        "bg-amber-100 text-amber-700",

      icon:
        FiInfo,

    };

  }


  // NEEDS ATTENTION

  if (
    level ===
    "attention"
  ) {

    return {

      box:
        "border-orange-200 bg-orange-50",

      circle:
        "border-orange-400 bg-white text-orange-600",

      badge:
        "bg-orange-100 text-orange-600",

      icon:
        FiAlertCircle,

    };

  }


  // CRITICAL

  if (
    level ===
    "critical"
  ) {

    return {

      box:
        "border-red-200 bg-red-50",

      circle:
        "border-red-400 bg-white text-red-600",

      badge:
        "bg-red-100 text-red-600",

      icon:
        FiAlertCircle,

    };

  }


  // NO DATA

  return {

    box:
      "border-[#e2e8dc] bg-white",

    circle:
      "border-[#dce5d7] bg-[#fafcf8] text-slate-400",

    badge:
      "bg-[#f1f4ef] text-slate-500",

    icon:
      FiInfo,

  };

}


// ============================================================
// FINANCIAL HEALTH SCORE
// ============================================================

function FinancialHealthScore({

  income = 0,

  expenses = 0,

  totalCommitments = 0,

  availableToAllocate = 0,

}) {


  // ==========================================================
  // CALCULATE FINANCIAL HEALTH
  // ==========================================================

  const health =
    calculateFinancialHealth({

      income,

      expenses,

      totalCommitments,

      availableToAllocate,

    });


  // ==========================================================
  // APPEARANCE
  // ==========================================================

  const appearance =
    getScoreAppearance(
      health.level
    );


  const StatusIcon =
    appearance.icon;


  // ==========================================================
  // NO DATA
  // ==========================================================

  if (
    health.insufficientData
  ) {

    return (

      <section className="mt-6 rounded-2xl border border-[#e2e8dc] bg-white p-5">


        {/* HEADER */}

        <div className="flex items-center gap-3">


          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf6e8] text-[#315c46]">

            <FiActivity />

          </div>


          <div>


            <h2 className="text-base font-semibold text-[#18392c]">

              Financial Health

            </h2>


            <p className="mt-1 text-xs text-slate-400">

              A score based on your monthly financial position.

            </p>


          </div>


        </div>


        {/* EMPTY STATE */}

        <div className="mt-5 rounded-xl border border-dashed border-[#dce5d7] bg-[#fafcf8] px-6 py-8 text-center">


          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#dce5d7] bg-white">


            <span className="text-lg font-bold text-slate-400">

              --

            </span>


          </div>


          <p className="mt-4 text-sm font-semibold text-[#18392c]">

            Financial Health Score not available

          </p>


          <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-400">

            Add your monthly income and financial information
            to calculate your Financial Health Score.

          </p>


        </div>


      </section>

    );

  }


  // ==========================================================
  // SCORE BREAKDOWN
  // ==========================================================

  const breakdownItems = [

    health.breakdown.savings,

    health.breakdown.expenses,

    health.breakdown.commitments,

    health.breakdown.allocation,

  ];


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <section className="mt-6 rounded-2xl border border-[#e2e8dc] bg-white p-5">


      {/* ======================================================
          HEADER
         ====================================================== */}

      <div className="flex flex-wrap items-start justify-between gap-4">


        <div className="flex items-center gap-3">


          {/* ICON */}

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf6e8] text-[#315c46]">

            <FiActivity />

          </div>


          <div>


            <h2 className="text-base font-semibold text-[#18392c]">

              Financial Health

            </h2>


            <p className="mt-1 text-xs text-slate-400">

              Your financial health based on savings,
              expenses and existing commitments.

            </p>


          </div>


        </div>


        {/* STATUS BADGE */}

        <div
          className={`flex items-center gap-2 rounded-full px-3 py-1.5 ${appearance.badge}`}
        >


          <StatusIcon className="text-sm" />


          <span className="text-[10px] font-semibold">

            {
              health.status
            }

          </span>


        </div>


      </div>


      {/* ======================================================
          SCORE + BREAKDOWN
         ====================================================== */}

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">


        {/* ====================================================
            SCORE
           ==================================================== */}

        <div
          className={`flex flex-col items-center justify-center rounded-2xl border p-6 ${appearance.box}`}
        >


          {/* SCORE CIRCLE */}

          <div
            className={`flex h-32 w-32 flex-col items-center justify-center rounded-full border-[8px] ${appearance.circle}`}
          >


            <span className="text-3xl font-bold">

              {
                health.score
              }

            </span>


            <span className="mt-1 text-[10px] font-semibold opacity-70">

              / 100

            </span>


          </div>


          {/* STATUS */}

          <p className="mt-4 text-sm font-bold text-[#18392c]">

            {
              health.status
            }

          </p>


          <p className="mt-1 text-center text-[10px] leading-4 text-slate-500">

            Financial Health Score

          </p>


        </div>


        {/* ====================================================
            SCORE BREAKDOWN
           ==================================================== */}

        <div>


          <div className="flex items-center justify-between">


            <div>


              <h3 className="text-sm font-semibold text-[#18392c]">

                Score Breakdown

              </h3>


              <p className="mt-1 text-[10px] text-slate-400">

                See what contributes to your overall score.

              </p>


            </div>


          </div>


          {/* BREAKDOWN ITEMS */}

          <div className="mt-5 space-y-4">


            {breakdownItems.map(
              (
                item
              ) => (

                <ScoreBreakdownRow

                  key={
                    item.label
                  }

                  label={
                    item.label
                  }

                  score={
                    item.score
                  }

                  max={
                    item.max
                  }

                />

              )
            )}


          </div>


          {/* TOTAL */}

          <div className="mt-5 flex items-center justify-between border-t border-[#edf0e9] pt-4">


            <p className="text-xs font-semibold text-[#52665b]">

              Total Financial Health

            </p>


            <p className="text-sm font-bold text-[#315c46]">

              {
                health.score
              } / 100

            </p>


          </div>


        </div>


      </div>


      {/* ======================================================
          FINANCIAL RATIOS
         ====================================================== */}

      <div className="mt-6">


        <h3 className="text-sm font-semibold text-[#18392c]">

          Financial Indicators

        </h3>


        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">


          <IndicatorCard

            label="Savings Rate"

            value={
              formatPercentage(
                health.ratios
                  .savingsRate
              )
            }

          />


          <IndicatorCard

            label="Expense Ratio"

            value={
              formatPercentage(
                health.ratios
                  .expenseRatio
              )
            }

          />


          <IndicatorCard

            label="Commitment Ratio"

            value={
              formatPercentage(
                health.ratios
                  .commitmentRatio
              )
            }

          />


          <IndicatorCard

            label="Allocation Capacity"

            value={
              formatPercentage(
                health.ratios
                  .allocationRatio
              )
            }

            negative={
              health.ratios
                .allocationRatio < 0
            }

          />


        </div>


      </div>


      {/* ======================================================
          INSIGHTS
         ====================================================== */}

      {health.insights.length >
        0 && (

        <div className="mt-6">


          <h3 className="text-sm font-semibold text-[#18392c]">

            Health Insights

          </h3>


          <div className="mt-3 space-y-2">


            {health.insights.map(
              (
                insight,
                index
              ) => (

                <div
                  key={
                    `${index}-${insight}`
                  }

                  className="flex items-start gap-3 rounded-xl border border-[#e5eadf] bg-[#fafcf8] px-4 py-3"
                >


                  <FiInfo className="mt-0.5 shrink-0 text-sm text-[#6c8b72]" />


                  <p className="text-xs leading-5 text-[#52665b]">

                    {
                      insight
                    }

                  </p>


                </div>

              )
            )}


          </div>


        </div>

      )}


      {/* ======================================================
          SCORE INFORMATION
         ====================================================== */}

      <div className="mt-6 border-t border-[#edf0e9] pt-4">


        <div className="flex items-start gap-2">


          <FiInfo className="mt-0.5 shrink-0 text-xs text-slate-400" />


          <p className="text-[10px] leading-4 text-slate-400">

            This score is a FinanceOS planning indicator based
            on the financial information recorded in your
            account. It is not a credit score or professional
            financial assessment.

          </p>


        </div>


      </div>


    </section>

  );

}


// ============================================================
// SCORE BREAKDOWN ROW
// ============================================================

function ScoreBreakdownRow({

  label,

  score,

  max,

}) {


  // ==========================================================
  // PROGRESS PERCENTAGE
  // ==========================================================

  const percentage =
    max > 0
      ? Math.min(
          Math.max(
            (
              score /
              max
            ) * 100,
            0
          ),
          100
        )
      : 0;


  return (

    <div>


      {/* LABEL + SCORE */}

      <div className="flex items-center justify-between">


        <p className="text-xs font-medium text-[#52665b]">

          {
            label
          }

        </p>


        <p className="text-xs font-semibold text-[#18392c]">

          {
            score
          }
          /
          {
            max
          }

        </p>


      </div>


      {/* PROGRESS BAR */}

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#edf0e9]">


        <div
          className="h-full rounded-full bg-[#7aa86f] transition-all duration-500"

          style={{
            width:
              `${percentage}%`,
          }}
        />


      </div>


    </div>

  );

}


// ============================================================
// INDICATOR CARD
// ============================================================

function IndicatorCard({

  label,

  value,

  negative = false,

}) {

  return (

    <div
      className={`rounded-xl border p-3 ${
        negative
          ? "border-red-200 bg-red-50"
          : "border-[#e5eadf] bg-[#fafcf8]"
      }`}
    >


      <p
        className={`text-[9px] ${
          negative
            ? "text-red-400"
            : "text-slate-400"
        }`}
      >

        {
          label
        }

      </p>


      <p
        className={`mt-1 text-sm font-bold ${
          negative
            ? "text-red-600"
            : "text-[#18392c]"
        }`}
      >

        {
          value
        }

      </p>


    </div>

  );

}


// ============================================================
// EXPORT
// ============================================================

export default FinancialHealthScore;