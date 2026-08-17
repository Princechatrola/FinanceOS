// ============================================================
// FINANCEOS - REPORTS PAGE
// ============================================================
//
// DATA FLOW:
//
// monthlyHistory
//        +
// netWorthSnapshots
//        +
// CURRENT LIVE FINANCE DATA
//        ↓
// merged monthly records
//        ↓
// Monthly / Quarterly / 6 Months / Yearly
//        ↓
// PDF
//
// IMPORTANT:
//
// Historical month:
//   Uses saved monthlyHistory + saved snapshot.
//
// Current month:
//   Uses saved income/expenses
//   + LIVE commitments
//   + LIVE assets
//   + LIVE liabilities
//   + LIVE net worth.
//
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

import { useMemo, useState } from "react";

import {
  FiBarChart2,
  FiCalendar,
  FiFileText,
  FiTrendingUp,
  FiDollarSign,
} from "react-icons/fi";

import Sidebar from "../components/layout/Sidebar.jsx";
import Topbar from "../components/layout/Topbar.jsx";

import useFinance from "../context/useFinance.js";

import {
  generateFinancialReport,
} from "../utils/generateFinancialReport.js";


// ============================================================
// MONTHS
// ============================================================

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];


// ============================================================
// QUARTERS
// ============================================================

const QUARTERS = [
  {
    value: 1,
    label: "Q1 — Jan to Mar",
    months: [1, 2, 3],
  },
  {
    value: 2,
    label: "Q2 — Apr to Jun",
    months: [4, 5, 6],
  },
  {
    value: 3,
    label: "Q3 — Jul to Sep",
    months: [7, 8, 9],
  },
  {
    value: 4,
    label: "Q4 — Oct to Dec",
    months: [10, 11, 12],
  },
];


// ============================================================
// HALF YEARS
// ============================================================

const HALF_YEARS = [
  {
    value: 1,
    label: "January — June",
    months: [1, 2, 3, 4, 5, 6],
  },
  {
    value: 2,
    label: "July — December",
    months: [7, 8, 9, 10, 11, 12],
  },
];


// ============================================================
// SAFE NUMBER
// ============================================================

function safeNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}


// ============================================================
// MONEY FORMAT
// ============================================================

function formatMoney(value) {
  return safeNumber(value).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  );
}


// ============================================================
// PERCENT FORMAT
// ============================================================

function formatPercent(value) {
  return `${safeNumber(value).toFixed(1)}%`;
}


// ============================================================
// MONTH KEY
// ============================================================

function getMonthKey(year, month) {
  return `${Number(year)}-${Number(month)}`;
}


// ============================================================
// REPORTS
// ============================================================

function Reports() {


  // ==========================================================
  // FINANCE CONTEXT
  // ==========================================================

  const finance = useFinance();


  // ==========================================================
  // LIVE FINANCE VALUES
  // ==========================================================

  const goalMonthlyCommitment =
    safeNumber(
      finance?.goalMonthlyCommitment
    );


  const investmentMonthlyCommitment =
    safeNumber(
      finance?.investmentMonthlyCommitment
    );


  const insuranceMonthlyCommitment =
    safeNumber(
      finance?.insuranceMonthlyCommitment
    );


  const liabilityMonthlyCommitment =
    safeNumber(
      finance?.liabilityMonthlyCommitment
    );


  const liveTotalAssets =
    safeNumber(
      finance?.totalAssets
    );


  const liveTotalLiabilities =
    safeNumber(
      finance?.totalLiabilities
    );


  // Always enforce:
  //
  // Net Worth = Assets - Liabilities
  //
  // This prevents a stale netWorth value from making the
  // report inconsistent with the asset/liability cards.

  const liveNetWorth =
    liveTotalAssets -
    liveTotalLiabilities;


  // ==========================================================
  // FINANCE DATA
  // ==========================================================

  const monthlyFinance =
    finance?.monthlyFinance || {};


  const monthlyHistory =
    Array.isArray(
      finance?.monthlyHistory
    )
      ? finance.monthlyHistory
      : [];


  const netWorthSnapshots =
    Array.isArray(
      finance?.netWorthSnapshots
    )
      ? finance.netWorthSnapshots
      : [];


  const savingGoals =
    Array.isArray(
      finance?.savingGoals
    )
      ? finance.savingGoals
      : [];


  const investments =
    Array.isArray(
      finance?.investments
    )
      ? finance.investments
      : [];


  const insurancePolicies =
    Array.isArray(
      finance?.insurancePolicies
    )
      ? finance.insurancePolicies
      : [];


  const liabilities =
    Array.isArray(
      finance?.liabilities
    )
      ? finance.liabilities
      : [];


  // ==========================================================
  // CURRENT DATE
  // ==========================================================

  const currentDate =
    new Date();


  const currentMonth =
    safeNumber(
      monthlyFinance?.month
    ) ||
    currentDate.getMonth() + 1;


  const currentYear =
    safeNumber(
      monthlyFinance?.year
    ) ||
    currentDate.getFullYear();


  // ==========================================================
  // REPORT FILTERS
  // ==========================================================

  const [
    reportType,
    setReportType,
  ] = useState("monthly");


  const [
    selectedMonth,
    setSelectedMonth,
  ] = useState(
    currentMonth
  );


  const [
    selectedQuarter,
    setSelectedQuarter,
  ] = useState(
    Math.ceil(
      currentMonth / 3
    )
  );


  const [
    selectedHalf,
    setSelectedHalf,
  ] = useState(
    currentMonth <= 6
      ? 1
      : 2
  );


  const [
    selectedYear,
    setSelectedYear,
  ] = useState(
    currentYear
  );


  // ==========================================================
  // AVAILABLE YEARS
  // ==========================================================

  const availableYears =
    useMemo(() => {

      const years = [
        currentYear,

        ...monthlyHistory.map(
          (record) =>
            safeNumber(
              record?.year
            )
        ),

        ...netWorthSnapshots.map(
          (record) =>
            safeNumber(
              record?.year
            )
        ),
      ]
        .filter(
          (year) =>
            year > 0
        );


      return [
        ...new Set(years),
      ].sort(
        (a, b) =>
          b - a
      );

    }, [
      currentYear,
      monthlyHistory,
      netWorthSnapshots,
    ]);


  // ==========================================================
  // SELECTED MONTHS
  // ==========================================================

  const selectedMonths =
    useMemo(() => {

      // MONTHLY

      if (
        reportType ===
        "monthly"
      ) {
        return [
          Number(
            selectedMonth
          ),
        ];
      }


      // QUARTERLY

      if (
        reportType ===
        "quarterly"
      ) {
        return (
          QUARTERS.find(
            (quarter) =>
              quarter.value ===
              Number(
                selectedQuarter
              )
          )?.months || []
        );
      }


      // 6 MONTHS

      if (
        reportType ===
        "halfYear"
      ) {
        return (
          HALF_YEARS.find(
            (period) =>
              period.value ===
              Number(
                selectedHalf
              )
          )?.months || []
        );
      }


      // YEARLY

      return [
        1, 2, 3, 4, 5, 6,
        7, 8, 9, 10, 11, 12,
      ];

    }, [
      reportType,
      selectedMonth,
      selectedQuarter,
      selectedHalf,
    ]);


  // ==========================================================
  // SNAPSHOT MAP
  // ==========================================================

  const snapshotMap =
    useMemo(() => {

      const map =
        new Map();


      netWorthSnapshots.forEach(
        (snapshot) => {

          const year =
            safeNumber(
              snapshot?.year
            );


          const month =
            safeNumber(
              snapshot?.month
            );


          if (
            year > 0 &&
            month >= 1 &&
            month <= 12
          ) {
            map.set(
              getMonthKey(
                year,
                month
              ),
              snapshot
            );
          }

        }
      );


      return map;

    }, [
      netWorthSnapshots,
    ]);


  // ==========================================================
  // MERGED MONTHLY HISTORY
  // ==========================================================
  //
  // THIS IS THE MAIN FIX.
  //
  // Current month:
  //
  // commitment data = LIVE context values
  //
  // historical month:
  //
  // commitment data = saved record/snapshot
  //
  // ==========================================================

  const mergedMonthlyHistory =
    useMemo(() => {

      return monthlyHistory

        .map(
          (monthlyRecord) => {

            // ================================================
            // YEAR / MONTH
            // ================================================

            const year =
              safeNumber(
                monthlyRecord?.year
              );


            const month =
              safeNumber(
                monthlyRecord?.month
              );


            if (
              year <= 0 ||
              month < 1 ||
              month > 12
            ) {
              return null;
            }


            // ================================================
            // SNAPSHOT
            // ================================================

            const snapshot =
              snapshotMap.get(
                getMonthKey(
                  year,
                  month
                )
              ) || {};


            // ================================================
            // CURRENT MONTH?
            // ================================================

            const isCurrentMonth =
              Number(year) ===
                Number(currentYear) &&
              Number(month) ===
                Number(currentMonth);


            // ================================================
            // INCOME
            // ================================================

            const income =
              safeNumber(

                monthlyRecord?.totalIncome ??

                monthlyRecord?.income

              );


            // ================================================
            // EXPENSES
            // ================================================

            const expenses =
              safeNumber(

                monthlyRecord?.totalExpenses ??

                monthlyRecord?.expenses

              );


            // ================================================
            // SAVINGS
            // ================================================

            const monthlySavings =
              safeNumber(

                monthlyRecord?.savings ??

                monthlyRecord?.monthlySavings ??

                (
                  income -
                  expenses
                )

              );


            // ================================================
            // SAVING GOAL COMMITMENT
            // ================================================

            const goalCommitment =
              isCurrentMonth

                ? goalMonthlyCommitment

                : safeNumber(

                    monthlyRecord
                      ?.goalCommitment ??

                    snapshot
                      ?.goalCommitment

                  );


            // ================================================
            // INVESTMENT COMMITMENT
            // ================================================

            const investmentCommitment =
              isCurrentMonth

                ? investmentMonthlyCommitment

                : safeNumber(

                    monthlyRecord
                      ?.investmentCommitment ??

                    snapshot
                      ?.investmentCommitment

                  );


            // ================================================
            // INSURANCE COMMITMENT
            // ================================================

            const insuranceCommitment =
              isCurrentMonth

                ? insuranceMonthlyCommitment

                : safeNumber(

                    monthlyRecord
                      ?.insuranceCommitment ??

                    snapshot
                      ?.insuranceCommitment

                  );


            // ================================================
            // LIABILITY / EMI
            // ================================================

            const liabilityCommitment =
              isCurrentMonth

                ? liabilityMonthlyCommitment

                : safeNumber(

                    monthlyRecord
                      ?.liabilityCommitment ??

                    snapshot
                      ?.liabilityCommitment

                  );


            // ================================================
            // TOTAL COMMITMENTS
            // ================================================
            //
            // Always calculate this ourselves.
            //
            // Do NOT use old snapshot.totalCommitments.
            //
            // ================================================

            const totalCommitments =
              goalCommitment +
              investmentCommitment +
              insuranceCommitment +
              liabilityCommitment;


            // ================================================
            // REMAINING BALANCE
            // ================================================
            //
            // Savings - Commitments
            //
            // ================================================

            const availableToAllocate =
              monthlySavings -
              totalCommitments;


            // ================================================
            // TOTAL ASSETS
            // ================================================

            const totalAssets =
              isCurrentMonth

                ? liveTotalAssets

                : safeNumber(

                    snapshot
                      ?.totalAssets ??

                    monthlyRecord
                      ?.totalAssets

                  );


            // ================================================
            // TOTAL LIABILITIES
            // ================================================

            const totalLiabilities =
              isCurrentMonth

                ? liveTotalLiabilities

                : safeNumber(

                    snapshot
                      ?.totalLiabilities ??

                    snapshot
                      ?.liabilities ??

                    monthlyRecord
                      ?.totalLiabilities ??

                    monthlyRecord
                      ?.liabilities

                  );


            // ================================================
            // NET WORTH
            // ================================================
            //
            // Always:
            //
            // Assets - Liabilities
            //
            // ================================================

            const netWorth =
              isCurrentMonth

                ? liveNetWorth

                : (
                    totalAssets -
                    totalLiabilities
                  );


            // ================================================
            // FINAL RECORD
            // ================================================

            return {

              ...monthlyRecord,
              ...snapshot,

              year,
              month,

              income,
              expenses,

              monthlySavings,

              goalCommitment,

              investmentCommitment,

              insuranceCommitment,

              liabilityCommitment,

              totalCommitments,

              availableToAllocate,

              remainingBalance:
                availableToAllocate,

              totalAssets,

              totalLiabilities,

              liabilities:
                totalLiabilities,

              netWorth,

            };

          }
        )

        .filter(Boolean)

        .sort(
          (a, b) => {

            if (
              a.year !==
              b.year
            ) {
              return (
                a.year -
                b.year
              );
            }

            return (
              a.month -
              b.month
            );

          }
        );

    }, [
      monthlyHistory,
      snapshotMap,

      currentMonth,
      currentYear,

      goalMonthlyCommitment,
      investmentMonthlyCommitment,
      insuranceMonthlyCommitment,
      liabilityMonthlyCommitment,

      liveTotalAssets,
      liveTotalLiabilities,
      liveNetWorth,
    ]);


  // ==========================================================
  // FILTER REPORT RECORDS
  // ==========================================================

  const reportRecords =
    useMemo(() => {

      return mergedMonthlyHistory

        .filter(
          (record) =>

            Number(
              record.year
            ) ===
              Number(
                selectedYear
              ) &&

            selectedMonths.includes(
              Number(
                record.month
              )
            )
        )

        .sort(
          (a, b) =>
            Number(
              a.month
            ) -
            Number(
              b.month
            )
        );

    }, [
      mergedMonthlyHistory,
      selectedYear,
      selectedMonths,
    ]);


  // ==========================================================
  // REPORT TITLE
  // ==========================================================

  const reportTitle =
    useMemo(() => {

      if (
        reportType ===
        "monthly"
      ) {

        return `${
          MONTHS[
            Number(
              selectedMonth
            ) - 1
          ]
        } ${selectedYear}`;

      }


      if (
        reportType ===
        "quarterly"
      ) {

        return `Q${selectedQuarter} ${selectedYear}`;

      }


      if (
        reportType ===
        "halfYear"
      ) {

        return `${
          Number(
            selectedHalf
          ) === 1
            ? "January – June"
            : "July – December"
        } ${selectedYear}`;

      }


      return `Year ${selectedYear}`;

    }, [
      reportType,
      selectedMonth,
      selectedQuarter,
      selectedHalf,
      selectedYear,
    ]);


  // ==========================================================
  // EXPECTED MONTHS
  // ==========================================================

  const expectedMonths =
    selectedMonths.length;


  // ==========================================================
  // REPORT CALCULATIONS
  // ==========================================================

  const reportData =
    useMemo(() => {

      const count =
        reportRecords.length;


      // ======================================================
      // TOTALS
      // ======================================================

      const totals =
        reportRecords.reduce(
          (
            result,
            record
          ) => {

            result.income +=
              safeNumber(
                record.income
              );


            result.expenses +=
              safeNumber(
                record.expenses
              );


            result.savings +=
              safeNumber(
                record.monthlySavings
              );


            result.goalCommitment +=
              safeNumber(
                record.goalCommitment
              );


            result.investmentCommitment +=
              safeNumber(
                record.investmentCommitment
              );


            result.insuranceCommitment +=
              safeNumber(
                record.insuranceCommitment
              );


            result.liabilityCommitment +=
              safeNumber(
                record.liabilityCommitment
              );


            result.totalCommitments +=
              safeNumber(
                record.totalCommitments
              );


            result.remainingBalance +=
              safeNumber(
                record.availableToAllocate
              );


            return result;

          },
          {
            income: 0,
            expenses: 0,
            savings: 0,

            goalCommitment: 0,
            investmentCommitment: 0,
            insuranceCommitment: 0,
            liabilityCommitment: 0,

            totalCommitments: 0,
            remainingBalance: 0,
          }
        );


      // ======================================================
      // AVERAGES
      // ======================================================

      const averageIncome =
        count > 0
          ? totals.income / count
          : 0;


      const averageExpenses =
        count > 0
          ? totals.expenses / count
          : 0;


      const averageSavings =
        count > 0
          ? totals.savings / count
          : 0;


      const averageCommitments =
        count > 0
          ? totals.totalCommitments /
            count
          : 0;


      const averageRemainingBalance =
        count > 0
          ? totals.remainingBalance /
            count
          : 0;


      // ======================================================
      // RATIOS
      // ======================================================

      const savingsRate =
        totals.income > 0
          ? (
              totals.savings /
              totals.income
            ) * 100
          : 0;


      const expenseRatio =
        totals.income > 0
          ? (
              totals.expenses /
              totals.income
            ) * 100
          : 0;


      const commitmentRatio =
        totals.income > 0
          ? (
              totals.totalCommitments /
              totals.income
            ) * 100
          : 0;


      const remainingBalanceRatio =
        totals.income > 0
          ? (
              totals.remainingBalance /
              totals.income
            ) * 100
          : 0;


      // ======================================================
      // FIRST / LAST
      // ======================================================

      const firstRecord =
        count > 0
          ? reportRecords[0]
          : null;


      const lastRecord =
        count > 0
          ? reportRecords[
              count - 1
            ]
          : null;


      // ======================================================
      // FINANCIAL POSITION
      // ======================================================

      const totalAssets =
        safeNumber(
          lastRecord?.totalAssets
        );


      const totalLiabilities =
        safeNumber(
          lastRecord?.totalLiabilities
        );


      // Do not trust a separately stored net worth here.

      const netWorth =
        totalAssets -
        totalLiabilities;


      // ======================================================
      // NET WORTH MOVEMENT
      // ======================================================

      const startingNetWorth =
        firstRecord
          ? (
              safeNumber(
                firstRecord.totalAssets
              ) -
              safeNumber(
                firstRecord.totalLiabilities
              )
            )
          : 0;


      const endingNetWorth =
        lastRecord
          ? (
              safeNumber(
                lastRecord.totalAssets
              ) -
              safeNumber(
                lastRecord.totalLiabilities
              )
            )
          : 0;


      const netWorthChange =
        count > 1
          ? endingNetWorth -
            startingNetWorth
          : 0;


      const netWorthChangePercent =
        count > 1 &&
        startingNetWorth !== 0

          ? (
              netWorthChange /
              Math.abs(
                startingNetWorth
              )
            ) * 100

          : 0;


      // ======================================================
      // RETURN
      // ======================================================

      return {

        count,

        totals,

        averageIncome,
        averageExpenses,
        averageSavings,
        averageCommitments,
        averageRemainingBalance,

        savingsRate,
        expenseRatio,
        commitmentRatio,
        remainingBalanceRatio,

        totalAssets,
        totalLiabilities,
        netWorth,

        startingNetWorth,
        endingNetWorth,

        netWorthChange,
        netWorthChangePercent,

      };

    }, [
      reportRecords,
    ]);


  // ==========================================================
  // GOAL SUMMARY
  // ==========================================================

  const goalSummary =
    useMemo(() => {

      const totalTarget =
        savingGoals.reduce(
          (
            total,
            goal
          ) =>
            total +
            safeNumber(

              goal.targetAmount ??

              goal.amount

            ),
          0
        );


      const totalSaved =
        savingGoals.reduce(
          (
            total,
            goal
          ) =>
            total +
            safeNumber(

              goal.totalContributed ??

              goal.savedAmount ??

              goal.alreadySaved

            ),
          0
        );


      const progress =
        totalTarget > 0

          ? Math.min(
              (
                totalSaved /
                totalTarget
              ) * 100,
              100
            )

          : 0;


      return {

        totalTarget,

        totalSaved,

        progress,

      };

    }, [
      savingGoals,
    ]);


  // ==========================================================
  // ACTIVE INVESTMENTS
  // ==========================================================

  const activeInvestments =
    investments.filter(
      (item) => {

        const status =
          String(
            item?.status ||
            "Active"
          ).toLowerCase();


        return ![
          "closed",
          "completed",
          "matured",
        ].includes(
          status
        );

      }
    ).length;


  // ==========================================================
  // ACTIVE INSURANCE
  // ==========================================================

  const activeInsurance =
    insurancePolicies.filter(
      (item) => {

        const status =
          String(
            item?.status ||
            "Active"
          ).toLowerCase();


        return ![
          "closed",
          "completed",
          "matured",
        ].includes(
          status
        );

      }
    ).length;


  // ==========================================================
  // ACTIVE LIABILITIES
  // ==========================================================

  const activeLiabilities =
    liabilities.filter(
      (item) => {

        const status =
          String(
            item?.status ||
            "Active"
          ).toLowerCase();


        const remainingAmount =
          safeNumber(

            item?.remainingAmount ??

            item?.outstandingAmount ??

            item?.balance

          );


        return (
          ![
            "closed",
            "completed",
          ].includes(
            status
          ) &&
          remainingAmount > 0
        );

      }
    ).length;


  // ==========================================================
  // REPORT TYPE CHANGE
  // ==========================================================

  function handleReportTypeChange(
    event
  ) {

    setReportType(
      event.target.value
    );

  }


  // ==========================================================
  // DOWNLOAD PDF
  // ==========================================================

  function handleDownloadPDF() {

    if (
      reportData.count === 0
    ) {
      return;
    }


    generateFinancialReport({

      reportTitle,

      reportType,

      selectedYear,

      expectedMonths,

      reportRecords,

      reportData,

      savingGoals,

      investments,

      insurancePolicies,

      liabilities,


      // ======================================================
      // CORRECT COMMITMENT DATA FOR PDF
      // ======================================================

      commitmentSummary: {

        savingGoals:
          reportData.totals
            .goalCommitment,

        investments:
          reportData.totals
            .investmentCommitment,

        insurance:
          reportData.totals
            .insuranceCommitment,

        liabilities:
          reportData.totals
            .liabilityCommitment,

        total:
          reportData.totals
            .totalCommitments,

      },


      // ======================================================
      // CORRECT FINANCIAL POSITION FOR PDF
      // ======================================================

      financialPosition: {

        totalAssets:
          reportData.totalAssets,

        totalLiabilities:
          reportData.totalLiabilities,

        netWorth:
          reportData.netWorth,

      },

    });

  }


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div className="min-h-screen bg-[#f6f8f4]">

      <Sidebar />

      <main className="ml-64 min-h-screen">

        <Topbar />

        <div className="px-8 py-6">


          {/* ==================================================
              PAGE HEADER
             ================================================== */}

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <p className="text-sm font-medium text-[#5f7568]">
                FinanceOS
              </p>

              <h1 className="mt-1 text-2xl font-bold text-[#18392c]">
                Financial Reports
              </h1>

              <p className="mt-1 max-w-3xl text-sm text-slate-500">
                Review income, expenses, savings, commitments
                and remaining balance across monthly,
                quarterly, six-month and yearly periods.
              </p>

            </div>


            <button
              type="button"
              onClick={
                handleDownloadPDF
              }
              disabled={
                reportData.count === 0
              }
              title={
                reportData.count > 0
                  ? `Download ${reportTitle} report`
                  : "No saved financial data available for this period"
              }
              className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
                reportData.count > 0
                  ? "bg-[#315c46] text-white hover:bg-[#264b39]"
                  : "cursor-not-allowed border border-[#dce5d7] bg-white text-slate-300"
              }`}
            >

              <FiFileText />

              Download PDF

            </button>

          </div>


          {/* ==================================================
              REPORT FILTERS
             ================================================== */}

          <div className="mt-6 rounded-2xl border border-[#e2e8dc] bg-white p-6">

            <div className="mb-5">

              <div className="flex items-center gap-2">

                <FiCalendar className="text-[#315c46]" />

                <h2 className="text-base font-semibold text-[#18392c]">
                  Report Period
                </h2>

              </div>

              <p className="mt-1 text-xs text-slate-400">
                Select the period you want to analyze.
              </p>

            </div>


            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

              <SelectField
                label="Report Type"
                value={reportType}
                onChange={
                  handleReportTypeChange
                }
              >

                <option value="monthly">
                  Monthly
                </option>

                <option value="quarterly">
                  Quarterly
                </option>

                <option value="halfYear">
                  6 Months
                </option>

                <option value="yearly">
                  Yearly
                </option>

              </SelectField>


              {reportType ===
                "monthly" && (

                <SelectField
                  label="Month"
                  value={
                    selectedMonth
                  }
                  onChange={
                    (event) =>
                      setSelectedMonth(
                        Number(
                          event.target.value
                        )
                      )
                  }
                >

                  {MONTHS.map(
                    (
                      month,
                      index
                    ) => (

                      <option
                        key={month}
                        value={
                          index + 1
                        }
                      >
                        {month}
                      </option>

                    )
                  )}

                </SelectField>

              )}


              {reportType ===
                "quarterly" && (

                <SelectField
                  label="Quarter"
                  value={
                    selectedQuarter
                  }
                  onChange={
                    (event) =>
                      setSelectedQuarter(
                        Number(
                          event.target.value
                        )
                      )
                  }
                >

                  {QUARTERS.map(
                    (quarter) => (

                      <option
                        key={
                          quarter.value
                        }
                        value={
                          quarter.value
                        }
                      >
                        {quarter.label}
                      </option>

                    )
                  )}

                </SelectField>

              )}


              {reportType ===
                "halfYear" && (

                <SelectField
                  label="6-Month Period"
                  value={
                    selectedHalf
                  }
                  onChange={
                    (event) =>
                      setSelectedHalf(
                        Number(
                          event.target.value
                        )
                      )
                  }
                >

                  {HALF_YEARS.map(
                    (period) => (

                      <option
                        key={
                          period.value
                        }
                        value={
                          period.value
                        }
                      >
                        {period.label}
                      </option>

                    )
                  )}

                </SelectField>

              )}


              {reportType ===
                "yearly" && (

                <div className="rounded-xl bg-[#f6f8f4] px-4 py-3">

                  <p className="text-xs font-medium text-[#5f7568]">
                    Period
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#18392c]">
                    January – December
                  </p>

                </div>

              )}


              <SelectField
                label="Year"
                value={
                  selectedYear
                }
                onChange={
                  (event) =>
                    setSelectedYear(
                      Number(
                        event.target.value
                      )
                    )
                }
              >

                {availableYears.map(
                  (year) => (

                    <option
                      key={year}
                      value={year}
                    >
                      {year}
                    </option>

                  )
                )}

              </SelectField>

            </div>

          </div>


          {/* ==================================================
              SELECTED REPORT
             ================================================== */}

          <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-[#dcebd4] bg-[#f3f8ef] p-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6c8b72]">
                Selected Report
              </p>

              <h2 className="mt-1 text-lg font-bold text-[#18392c]">
                {reportTitle}
              </h2>

            </div>


            <div className="text-left sm:text-right">

              <p className="text-xs text-[#5f7568]">
                Data Available
              </p>

              <p className="mt-1 text-sm font-semibold text-[#18392c]">

                {reportData.count} of{" "}
                {expectedMonths}{" "}

                {expectedMonths === 1
                  ? "month"
                  : "months"}

              </p>

            </div>

          </div>


          {/* ==================================================
              EMPTY STATE
             ================================================== */}

          {reportData.count === 0 ? (

            <div className="mt-6 rounded-2xl border border-dashed border-[#ccd8c7] bg-white p-10 text-center">

              <FiBarChart2 className="mx-auto text-3xl text-[#8aa394]" />

              <h2 className="mt-4 text-base font-semibold text-[#18392c]">
                No financial data for this period
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400">
                Save Monthly Finance data for {reportTitle}.
                FinanceOS will then create the report from the
                saved monthly record.
              </p>

            </div>

          ) : (

            <>

              {/* ==================================================
                  MAIN SUMMARY CARDS
                 ================================================== */}

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <MetricCard
                  icon={FiDollarSign}
                  label="Total Income"
                  value={`₹${formatMoney(
                    reportData.totals.income
                  )}`}
                  description="Income recorded during this period."
                />

                <MetricCard
                  icon={FiDollarSign}
                  label="Total Expenses"
                  value={`₹${formatMoney(
                    reportData.totals.expenses
                  )}`}
                  description="Expenses recorded during this period."
                />

                <MetricCard
                  icon={FiTrendingUp}
                  label="Total Savings"
                  value={`₹${formatMoney(
                    reportData.totals.savings
                  )}`}
                  description="Income minus expenses."
                />

                <MetricCard
                  icon={FiBarChart2}
                  label="Remaining Balance"
                  value={`₹${formatMoney(
                    reportData.totals.remainingBalance
                  )}`}
                  description="Savings remaining after commitments."
                />

              </div>
                            {/* ==================================================
                  FINANCIAL PERFORMANCE
                 ================================================== */}

              <section className="mt-6 rounded-2xl border border-[#e2e8dc] bg-white p-6">

                <SectionHeader
                  eyebrow="Performance"
                  title="Financial Performance"
                  description="Summary of your financial activity during the selected period."
                />


                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

                  <InfoCard
                    label="Average Income"
                    value={`₹${formatMoney(
                      reportData.averageIncome
                    )}`}
                  />

                  <InfoCard
                    label="Average Expenses"
                    value={`₹${formatMoney(
                      reportData.averageExpenses
                    )}`}
                  />

                  <InfoCard
                    label="Average Savings"
                    value={`₹${formatMoney(
                      reportData.averageSavings
                    )}`}
                  />

                  <InfoCard
                    label="Average Commitments"
                    value={`₹${formatMoney(
                      reportData.averageCommitments
                    )}`}
                  />

                </div>


                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">

                  <RatioCard
                    label="Savings Rate"
                    value={
                      reportData.savingsRate
                    }
                    description="Savings as a percentage of income."
                  />

                  <RatioCard
                    label="Expense Ratio"
                    value={
                      reportData.expenseRatio
                    }
                    description="Expenses as a percentage of income."
                  />

                  <RatioCard
                    label="Commitment Ratio"
                    value={
                      reportData.commitmentRatio
                    }
                    description="Financial commitments compared with income."
                  />

                  <RatioCard
                    label="Remaining Ratio"
                    value={
                      reportData.remainingBalanceRatio
                    }
                    description="Remaining balance compared with income."
                  />

                </div>

              </section>


              {/* ==================================================
                  COMMITMENT BREAKDOWN
                 ================================================== */}

              <section className="mt-6 rounded-2xl border border-[#e2e8dc] bg-white p-6">

                <SectionHeader
                  eyebrow="Commitments"
                  title="Commitment Breakdown"
                  description="Financial commitments recorded during the selected period."
                />


                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                  <InfoCard
                    label="Saving Goals"
                    value={`₹${formatMoney(
                      reportData.totals.goalCommitment
                    )}`}
                  />

                  <InfoCard
                    label="Investments"
                    value={`₹${formatMoney(
                      reportData.totals.investmentCommitment
                    )}`}
                  />

                  <InfoCard
                    label="Insurance"
                    value={`₹${formatMoney(
                      reportData.totals.insuranceCommitment
                    )}`}
                  />

                  <InfoCard
                    label="Loan / EMI"
                    value={`₹${formatMoney(
                      reportData.totals.liabilityCommitment
                    )}`}
                  />

                </div>


                <div className="mt-5 flex flex-col gap-3 rounded-xl bg-[#f7faf5] p-4 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <p className="text-xs font-medium text-[#5f7568]">
                      Total Commitments
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                      Goals + investments + insurance + liabilities.
                    </p>

                  </div>


                  <p className="text-xl font-bold text-[#18392c]">
                    ₹
                    {formatMoney(
                      reportData.totals.totalCommitments
                    )}
                  </p>

                </div>

              </section>


              {/* ==================================================
                  FINANCIAL POSITION
                 ================================================== */}

              <section className="mt-6 rounded-2xl border border-[#dcebd4] bg-[#f7fbf4] p-6">

                <SectionHeader
                  eyebrow="Position"
                  title="Financial Position"
                  description="Latest financial position available within the selected report period."
                />


                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">

                  <PositionCard
                    label="Total Assets"
                    value={
                      reportData.totalAssets
                    }
                  />

                  <PositionCard
                    label="Total Liabilities"
                    value={
                      reportData.totalLiabilities
                    }
                  />

                  <PositionCard
                    label="Net Worth"
                    value={
                      reportData.netWorth
                    }
                    highlight
                  />

                </div>


                {reportData.count > 1 && (

                  <div className="mt-5 rounded-xl border border-[#dce5d7] bg-white p-4">

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                      <div>

                        <p className="text-xs font-semibold text-[#18392c]">
                          Net Worth Movement
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                          Change between the first and last saved month in this report.
                        </p>

                      </div>


                      <div className="sm:text-right">

                        <p
                          className={`text-lg font-bold ${
                            reportData.netWorthChange < 0
                              ? "text-red-600"
                              : "text-[#315c46]"
                          }`}
                        >

                          {reportData.netWorthChange < 0
                            ? "-"
                            : ""}

                          ₹
                          {formatMoney(
                            Math.abs(
                              reportData.netWorthChange
                            )
                          )}

                        </p>


                        <p
                          className={`mt-1 text-xs font-medium ${
                            reportData.netWorthChangePercent < 0
                              ? "text-red-500"
                              : "text-[#6c8b72]"
                          }`}
                        >

                          {reportData.netWorthChangePercent > 0
                            ? "+"
                            : ""}

                          {formatPercent(
                            reportData.netWorthChangePercent
                          )}

                        </p>

                      </div>

                    </div>

                  </div>

                )}

              </section>


              {/* ==================================================
                  MONTHLY BREAKDOWN
                 ================================================== */}

              <section className="mt-6 rounded-2xl border border-[#e2e8dc] bg-white p-6">

                <SectionHeader
                  eyebrow="History"
                  title="Monthly Breakdown"
                  description="Saved monthly financial records included in this report."
                />


                <div className="mt-5 overflow-x-auto">

                  <table className="w-full min-w-[950px] border-collapse">

                    <thead>

                      <tr className="border-b border-[#e6ebe2]">

                        <TableHeading>
                          Month
                        </TableHeading>

                        <TableHeading right>
                          Income
                        </TableHeading>

                        <TableHeading right>
                          Expenses
                        </TableHeading>

                        <TableHeading right>
                          Savings
                        </TableHeading>

                        <TableHeading right>
                          Commitments
                        </TableHeading>

                        <TableHeading right>
                          Remaining
                        </TableHeading>

                        <TableHeading right>
                          Net Worth
                        </TableHeading>

                      </tr>

                    </thead>


                    <tbody>

                      {reportRecords.map(
                        (record) => {

                          const monthName =
                            MONTHS[
                              Number(
                                record.month
                              ) - 1
                            ] ||
                            `Month ${record.month}`;


                          return (

                            <tr
                              key={`${record.year}-${record.month}`}
                              className="border-b border-[#f0f2ee] last:border-b-0"
                            >

                              <TableCell>

                                <div>

                                  <p className="font-semibold text-[#18392c]">
                                    {monthName}
                                  </p>

                                  <p className="mt-0.5 text-[10px] text-slate-400">
                                    {record.year}
                                  </p>

                                </div>

                              </TableCell>


                              <TableCell right>
                                ₹
                                {formatMoney(
                                  record.income
                                )}
                              </TableCell>


                              <TableCell right>
                                ₹
                                {formatMoney(
                                  record.expenses
                                )}
                              </TableCell>


                              <TableCell
                                right
                                positive={
                                  safeNumber(
                                    record.monthlySavings
                                  ) >= 0
                                }
                                negative={
                                  safeNumber(
                                    record.monthlySavings
                                  ) < 0
                                }
                              >

                                {safeNumber(
                                  record.monthlySavings
                                ) < 0
                                  ? "-"
                                  : ""}

                                ₹
                                {formatMoney(
                                  Math.abs(
                                    safeNumber(
                                      record.monthlySavings
                                    )
                                  )
                                )}

                              </TableCell>


                              <TableCell right>
                                ₹
                                {formatMoney(
                                  record.totalCommitments
                                )}
                              </TableCell>


                              <TableCell
                                right
                                positive={
                                  safeNumber(
                                    record.availableToAllocate
                                  ) >= 0
                                }
                                negative={
                                  safeNumber(
                                    record.availableToAllocate
                                  ) < 0
                                }
                              >

                                {safeNumber(
                                  record.availableToAllocate
                                ) < 0
                                  ? "-"
                                  : ""}

                                ₹
                                {formatMoney(
                                  Math.abs(
                                    safeNumber(
                                      record.availableToAllocate
                                    )
                                  )
                                )}

                              </TableCell>


                              <TableCell
                                right
                                positive={
                                  safeNumber(
                                    record.netWorth
                                  ) >= 0
                                }
                                negative={
                                  safeNumber(
                                    record.netWorth
                                  ) < 0
                                }
                              >

                                {safeNumber(
                                  record.netWorth
                                ) < 0
                                  ? "-"
                                  : ""}

                                ₹
                                {formatMoney(
                                  Math.abs(
                                    safeNumber(
                                      record.netWorth
                                    )
                                  )
                                )}

                              </TableCell>

                            </tr>

                          );

                        }
                      )}

                    </tbody>

                  </table>

                </div>

              </section>


              {/* ==================================================
                  SAVING GOALS
                 ================================================== */}

              <section className="mt-6 rounded-2xl border border-[#e2e8dc] bg-white p-6">

                <SectionHeader
                  eyebrow="Goals"
                  title="Saving Goals"
                  description="Overall progress of your saving goals."
                />


                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">

                  <InfoCard
                    label="Total Goal Target"
                    value={`₹${formatMoney(
                      goalSummary.totalTarget
                    )}`}
                  />

                  <InfoCard
                    label="Total Saved"
                    value={`₹${formatMoney(
                      goalSummary.totalSaved
                    )}`}
                  />

                  <InfoCard
                    label="Overall Progress"
                    value={
                      formatPercent(
                        goalSummary.progress
                      )
                    }
                  />

                </div>


                <div className="mt-5">

                  <div className="mb-2 flex items-center justify-between">

                    <p className="text-xs font-medium text-[#5f7568]">
                      Goal Progress
                    </p>

                    <p className="text-xs font-semibold text-[#315c46]">
                      {formatPercent(
                        goalSummary.progress
                      )}
                    </p>

                  </div>


                  <div className="h-2.5 overflow-hidden rounded-full bg-[#e7eee3]">

                    <div
                      className="h-full rounded-full bg-[#315c46] transition-all"
                      style={{
                        width: `${Math.min(
                          Math.max(
                            goalSummary.progress,
                            0
                          ),
                          100
                        )}%`,
                      }}
                    />

                  </div>

                </div>


                {savingGoals.length === 0 && (

                  <p className="mt-5 rounded-xl bg-[#f8faf7] px-4 py-3 text-xs text-slate-400">
                    No saving goals have been added yet.
                  </p>

                )}

              </section>


              {/* ==================================================
                  PLANS & COMMITMENTS
                 ================================================== */}

              <section className="mt-6 rounded-2xl border border-[#e2e8dc] bg-white p-6">

                <SectionHeader
                  eyebrow="Plans"
                  title="Plans & Commitments"
                  description="Current financial plans recorded in FinanceOS."
                />


                <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">

                  <PlanCountCard
                    label="Active Investments"
                    value={
                      activeInvestments
                    }
                  />

                  <PlanCountCard
                    label="Active Insurance"
                    value={
                      activeInsurance
                    }
                  />

                  <PlanCountCard
                    label="Active Liabilities"
                    value={
                      activeLiabilities
                    }
                  />

                </div>

              </section>


              {/* ==================================================
                  REPORT INFORMATION
                 ================================================== */}

              <section className="mt-6 rounded-2xl border border-[#dcebd4] bg-[#f3f8ef] p-5">

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#315c46]">
                    <FiFileText />
                  </div>


                  <div>

                    <p className="text-sm font-semibold text-[#18392c]">
                      {reportTitle} Report
                    </p>

                    <p className="mt-1 text-xs leading-5 text-[#5f7568]">

                      This report contains{" "}

                      <span className="font-semibold">
                        {reportData.count}
                      </span>

                      {" "}saved{" "}

                      {reportData.count === 1
                        ? "month"
                        : "months"}

                      {" "}out of{" "}

                      <span className="font-semibold">
                        {expectedMonths}
                      </span>

                      {" "}expected for the selected period.

                    </p>

                  </div>

                </div>

              </section>

            </>

          )}


          {/* ==================================================
              PAGE BOTTOM
             ================================================== */}

          <div className="h-8" />

        </div>

      </main>

    </div>

  );

}


// ============================================================
// SELECT FIELD
// ============================================================

function SelectField({
  label,
  value,
  onChange,
  children,
}) {

  return (

    <label className="block">

      <span className="text-xs font-medium text-[#5f7568]">
        {label}
      </span>


      <select
        value={value}
        onChange={onChange}
        className="mt-2 w-full rounded-xl border border-[#dce5d7] bg-white px-4 py-3 text-sm text-[#18392c] outline-none transition focus:border-[#79a966] focus:ring-2 focus:ring-[#79a966]/10"
      >
        {children}
      </select>

    </label>

  );

}


// ============================================================
// SECTION HEADER
// ============================================================

function SectionHeader({
  eyebrow,
  title,
  description,
}) {

  return (

    <div>

      {eyebrow && (

        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6c8b72]">
          {eyebrow}
        </p>

      )}


      <h2 className="mt-1 text-base font-semibold text-[#18392c]">
        {title}
      </h2>


      {description && (

        <p className="mt-1 text-xs leading-5 text-slate-400">
          {description}
        </p>

      )}

    </div>

  );

}


// ============================================================
// METRIC CARD
// ============================================================

function MetricCard({
  icon: Icon,
  label,
  value,
  description,
}) {

  return (

    <div className="rounded-2xl border border-[#e2e8dc] bg-white p-5">

      <div className="flex items-center justify-between gap-4">

        <div>

          <p className="text-xs font-medium text-[#5f7568]">
            {label}
          </p>

          <p className="mt-2 text-xl font-bold text-[#18392c]">
            {value}
          </p>

        </div>


        {Icon && (

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf6e8] text-[#315c46]">
            <Icon />
          </div>

        )}

      </div>


      {description && (

        <p className="mt-3 text-[10px] leading-4 text-slate-400">
          {description}
        </p>

      )}

    </div>

  );

}


// ============================================================
// INFO CARD
// ============================================================

function InfoCard({
  label,
  value,
}) {

  return (

    <div className="rounded-xl border border-[#e8ece5] bg-[#fafcf8] p-4">

      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6c8b72]">
        {label}
      </p>

      <p className="mt-2 break-words text-base font-bold text-[#18392c]">
        {value}
      </p>

    </div>

  );

}


// ============================================================
// RATIO CARD
// ============================================================

function RatioCard({
  label,
  value,
  description,
}) {

  const numericValue =
    safeNumber(value);


  return (

    <div className="rounded-xl border border-[#e8ece5] bg-[#fafcf8] p-4">

      <p className="text-xs font-medium text-[#5f7568]">
        {label}
      </p>


      <p
        className={`mt-2 text-lg font-bold ${
          numericValue < 0
            ? "text-red-600"
            : "text-[#315c46]"
        }`}
      >

        {formatPercent(
          numericValue
        )}

      </p>


      <p className="mt-2 text-[10px] leading-4 text-slate-400">
        {description}
      </p>

    </div>

  );

}


// ============================================================
// POSITION CARD
// ============================================================

function PositionCard({
  label,
  value,
  highlight = false,
}) {

  const number =
    safeNumber(value);


  return (

    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? "border-[#bfd6b2] bg-white"
          : "border-[#e2e8dc] bg-white/80"
      }`}
    >

      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6c8b72]">
        {label}
      </p>


      <p
        className={`mt-2 text-lg font-bold ${
          number < 0
            ? "text-red-600"
            : highlight
              ? "text-[#315c46]"
              : "text-[#18392c]"
        }`}
      >

        {number < 0
          ? "-"
          : ""}

        ₹
        {formatMoney(
          Math.abs(
            number
          )
        )}

      </p>

    </div>

  );

}


// ============================================================
// PLAN COUNT CARD
// ============================================================

function PlanCountCard({
  label,
  value,
}) {

  return (

    <div className="rounded-xl border border-[#e8ece5] bg-[#fafcf8] p-4">

      <p className="text-xs font-medium text-[#5f7568]">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-[#315c46]">
        {safeNumber(value)}
      </p>

    </div>

  );

}


// ============================================================
// TABLE HEADING
// ============================================================

function TableHeading({
  children,
  right = false,
}) {

  return (

    <th
      className={`px-3 py-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#6c8b72] ${
        right
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </th>

  );

}


// ============================================================
// TABLE CELL
// ============================================================

function TableCell({
  children,
  right = false,
  positive = false,
  negative = false,
}) {

  let valueClass =
    "text-[#52665b]";


  if (negative) {

    valueClass =
      "font-semibold text-red-600";

  } else if (positive) {

    valueClass =
      "font-semibold text-[#315c46]";

  }


  return (

    <td
      className={`px-3 py-4 text-xs ${valueClass} ${
        right
          ? "text-right"
          : "text-left"
      }`}
    >
      {children}
    </td>

  );

}


// ============================================================
// EXPORT
// ============================================================

export default Reports;