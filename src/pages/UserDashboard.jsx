// ============================================================
// FINANCEOS - USER DASHBOARD
// ============================================================
//
// Dashboard:
//
// 1. Monthly Income
// 2. Monthly Expenses
// 3. Monthly Savings
// 4. Available to Allocate
// 5. Monthly Financial Position
// 6. Financial Suggestions
// 7. Financial Health Score
// 8. Net Worth
// 9. Active Financial Items
// 10. Upcoming Financial Activity
//
// ============================================================


// ============================================================
// IMPORT ICONS
// ============================================================

import {
  FiDollarSign,
  FiTrendingDown,
  FiSave,
  FiPieChart,
} from "react-icons/fi";


// ============================================================
// IMPORT LAYOUT
// ============================================================

import Sidebar
  from "../components/layout/Sidebar.jsx";

import Topbar
  from "../components/layout/Topbar.jsx";


// ============================================================
// IMPORT DASHBOARD COMPONENTS
// ============================================================

import FinancialSummaryCard
  from "../components/dashboard/FinancialSummaryCard.jsx";

import FinancialHealthScore
  from "../components/dashboard/FinancialHealthScore.jsx";

import NetWorthChart
  from "../components/dashboard/NetWorthChart.jsx";

import ActiveFinancialItems
  from "../components/dashboard/ActiveFinancialItems.jsx";

import UpcomingFinancialActivity
  from "../components/dashboard/UpcomingFinancialActivity.jsx";

import FinancialSuggestions
  from "../components/dashboard/FinancialSuggestions.jsx";


// ============================================================
// IMPORT FINANCE CONTEXT
// ============================================================

import useFinance
  from "../context/useFinance.js";


// ============================================================
// IMPORT CALCULATIONS
// ============================================================

import {
  calculateMonthlySavings,

  calculateMonthlyShortfall,
} from "../utils/financialCalculations.js";


// ============================================================
// USER DASHBOARD
// ============================================================

function UserDashboard() {


  // ==========================================================
  // GET FINANCE DATA
  // ==========================================================

  const {
    userData,
    monthlyFinance,
    savingGoals,
    liabilities,
    investments,
    insurancePolicies,

    availableToAllocate
  } = useFinance();


  // ==========================================================
  // SAFE ARRAYS
  // ==========================================================

  const goals =
    Array.isArray(savingGoals)
      ? savingGoals
      : [];


  const liabilityRecords =
    Array.isArray(liabilities)
      ? liabilities
      : [];


  const investmentRecords =
    Array.isArray(investments)
      ? investments
      : [];


  const insuranceRecords =
    Array.isArray(insurancePolicies)
      ? insurancePolicies
      : [];


  // ==========================================================
  // MONTHLY FINANCE
  // ==========================================================

  const income =
    Number(
      monthlyFinance?.income || 0
    );


  const expenses =
    Number(
      monthlyFinance?.expenses || 0
    );


  // ==========================================================
  // MONTHLY SAVINGS
  // ==========================================================

  const monthlySavings =
    calculateMonthlySavings(
      income,
      expenses
    );


  // ==========================================================
  // GOAL ALLOCATIONS
  // ==========================================================

  const totalGoalAllocations =
    goals
      .filter(
        (goal) =>
          goal.status === "Active"
      )
      .reduce(
        (total, goal) =>
          total +
          (
            Number(
              goal.monthlyContribution ||
              goal.monthlyAllocation ||
              goal.requiredMonthly ||
              0
            ) || 0
          ),
        0
      );


  // ==========================================================
  // LOAN / LIABILITY PAYMENTS
  // ==========================================================

  const totalLoanEMIs =
    liabilityRecords
      .filter(
        (liability) =>
          liability.status === "Active"
      )
      .reduce(
        (total, liability) =>
          total +
          (
            Number(
              liability.monthlyPayment ||
              liability.monthlyEMI ||
              liability.monthlyEmi ||
              liability.emi ||
              0
            ) || 0
          ),
        0
      );


  // ==========================================================
  // INVESTMENT CONTRIBUTIONS
  // ==========================================================

  const totalInvestmentContributions =
    investmentRecords
      .filter(
        (investment) =>
          investment.status === "Active"
      )
      .reduce(
        (total, investment) =>
          total +
          (
            Number(
              investment.monthlyContribution ||
              investment.monthlyAmount ||
              0
            ) || 0
          ),
        0
      );


  // ==========================================================
  // INSURANCE MONTHLY EQUIVALENT
  // ==========================================================
  //
  // Supports:
  //
  // monthlyPremium
  //
  // OR:
  //
  // premiumAmount
  // premiumFrequency
  //
  // ==========================================================

  const totalInsurancePremiums =
    insuranceRecords
      .filter(
        (policy) =>
          policy.status === "Active"
      )
      .reduce(
        (total, policy) => {


          // ---------------------------------------------------
          // OLD STRUCTURE
          // ---------------------------------------------------

          const oldMonthlyPremium =
            Number(
              policy.monthlyPremium || 0
            );


          if (
            oldMonthlyPremium > 0
          ) {

            return (
              total +
              oldMonthlyPremium
            );

          }


          // ---------------------------------------------------
          // NEW STRUCTURE
          // ---------------------------------------------------

          const premiumAmount =
            Number(
              policy.premiumAmount ||
              policy.amount ||
              0
            );


          if (
            premiumAmount <= 0
          ) {

            return total;

          }


          const frequency =
            String(
              policy.premiumFrequency ||
              policy.frequency ||
              "Monthly"
            ).toLowerCase();


          // ---------------------------------------------------
          // MONTHLY
          // ---------------------------------------------------

          if (
            frequency.includes(
              "month"
            )
          ) {

            return (
              total +
              premiumAmount
            );

          }


          // ---------------------------------------------------
          // QUARTERLY
          // ---------------------------------------------------

          if (
            frequency.includes(
              "quarter"
            )
          ) {

            return (
              total +
              premiumAmount / 3
            );

          }


          // ---------------------------------------------------
          // HALF YEARLY
          // ---------------------------------------------------

          if (
            frequency.includes(
              "half"
            )
          ) {

            return (
              total +
              premiumAmount / 6
            );

          }


          // ---------------------------------------------------
          // YEARLY / ANNUAL
          // ---------------------------------------------------

          if (
            frequency.includes(
              "year"
            ) ||
            frequency.includes(
              "annual"
            )
          ) {

            return (
              total +
              premiumAmount / 12
            );

          }


          // ---------------------------------------------------
          // FALLBACK
          // ---------------------------------------------------

          return (
            total +
            premiumAmount
          );

        },
        0
      );


  // ==========================================================
  // TOTAL COMMITMENTS
  // ==========================================================

  const totalCommitments =
    totalGoalAllocations +
    totalLoanEMIs +
    totalInvestmentContributions +
    totalInsurancePremiums;


  // ==========================================================
  // AVAILABLE TO ALLOCATE
  // ==========================================================

  


  // ==========================================================
  // MONTHLY SHORTFALL
  // ==========================================================

  const monthlyShortfall =
    calculateMonthlyShortfall(
      availableToAllocate
    );


  // ==========================================================
  // CURRENT FINANCIAL MONTH
  // ==========================================================

  const financeMonth =
    Number(
      monthlyFinance?.month
    ) ||
    new Date().getMonth() + 1;


  const financeYear =
    Number(
      monthlyFinance?.year
    ) ||
    new Date().getFullYear();


  const currentMonth =
    new Date(
      financeYear,
      financeMonth - 1
    ).toLocaleString(
      "en-US",
      {
        month: "long",
        year: "numeric",
      }
    );


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div className="min-h-screen bg-[#f6f8f4]">


      {/* ======================================================
          SIDEBAR
         ====================================================== */}

      <Sidebar />


      {/* ======================================================
          MAIN DASHBOARD
         ====================================================== */}

      <main className="ml-64 min-h-screen">


        {/* ====================================================
            TOPBAR
           ==================================================== */}

        <Topbar />


        {/* ====================================================
            CONTENT
           ==================================================== */}

        <div className="px-8 py-6">


          {/* ==================================================
              WELCOME
             ================================================== */}

          <div className="mb-6">


            <p className="text-sm font-medium text-[#5f7568]">

              {currentMonth}

            </p>


            <h1 className="mt-1 text-2xl font-bold text-[#18392c]">

              Welcome back,{" "}

              {
                userData?.name ||
                "User"
              }

              ! 👋

            </h1>


            <p className="mt-1 text-sm text-slate-500">

              Here is an overview of your financial position.

            </p>


          </div>


          {/* ==================================================
              SUMMARY CARDS
             ================================================== */}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">


            {/* =================================================
                INCOME
               ================================================= */}

            <FinancialSummaryCard

              title="Monthly Income"

              amount={`₹${income.toLocaleString(
                "en-IN"
              )}`}

              description="Total income recorded for this month"

              icon={
                FiDollarSign
              }

              type="normal"

            />


            {/* =================================================
                EXPENSES
               ================================================= */}

            <FinancialSummaryCard

              title="Monthly Expenses"

              amount={`₹${expenses.toLocaleString(
                "en-IN"
              )}`}

              description="Total expenses recorded for this month"

              icon={
                FiTrendingDown
              }

              type="negative"

            />


            {/* =================================================
                SAVINGS
               ================================================= */}

            <FinancialSummaryCard

              title="Monthly Savings"

              amount={`₹${monthlySavings.toLocaleString(
                "en-IN"
              )}`}

              description="Income remaining after monthly expenses"

              icon={
                FiSave
              }

              type={
                monthlySavings >= 0
                  ? "positive"
                  : "negative"
              }

            />


            {/* =================================================
                AVAILABLE TO ALLOCATE
               ================================================= */}

            <FinancialSummaryCard

              title="Available to Allocate"

              amount={`₹${availableToAllocate.toLocaleString(
                "en-IN",
                {
                  maximumFractionDigits: 0,
                }
              )}`}

              description={
                totalCommitments > 0
                  ? "Amount remaining after existing commitments"
                  : "Currently available for goals and commitments"
              }

              icon={
                FiPieChart
              }

              type={
                availableToAllocate >= 0
                  ? "positive"
                  : "negative"
              }

            />


          </div>


          {/* ==================================================
              MONTHLY FINANCIAL POSITION
             ================================================== */}

          <section className="mt-5 rounded-2xl border border-[#e2e8dc] bg-white p-5">


            {/* =================================================
                HEADER
               ================================================= */}

            <div>


              <h2 className="text-base font-semibold text-[#18392c]">

                Monthly Financial Position

              </h2>


              <p className="mt-1 text-xs text-slate-400">

                {
                  totalCommitments > 0
                    ? "See how your monthly savings are distributed across existing commitments."
                    : "See how much remains after your monthly expenses."
                }

              </p>


            </div>


            {/* =================================================
                CORE VALUES
               ================================================= */}

            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">


              {/* =================================================
                  INCOME
                 ================================================= */}

              <div className="rounded-xl bg-[#f7f9f3] p-4">


                <p className="text-xs text-slate-500">

                  Income

                </p>


                <p className="mt-2 text-lg font-bold text-[#18392c]">

                  ₹
                  {
                    income.toLocaleString(
                      "en-IN"
                    )
                  }

                </p>


              </div>


              {/* =================================================
                  EXPENSES
                 ================================================= */}

              <div className="rounded-xl bg-[#f7f9f3] p-4">


                <p className="text-xs text-slate-500">

                  Expenses

                </p>


                <p className="mt-2 text-lg font-bold text-[#18392c]">

                  ₹
                  {
                    expenses.toLocaleString(
                      "en-IN"
                    )
                  }

                </p>


              </div>


              {/* =================================================
                  SAVINGS
                 ================================================= */}

              <div className="rounded-xl bg-[#f7f9f3] p-4">


                <p className="text-xs text-slate-500">

                  Monthly Savings

                </p>


                <p
                  className={`mt-2 text-lg font-bold ${
                    monthlySavings >= 0
                      ? "text-[#315c46]"
                      : "text-red-500"
                  }`}
                >

                  ₹
                  {
                    monthlySavings.toLocaleString(
                      "en-IN"
                    )
                  }

                </p>


              </div>


              {/* =================================================
                  AVAILABLE
                 ================================================= */}

              <div
                className={`rounded-xl p-4 ${
                  availableToAllocate >= 0
                    ? "bg-[#edf6e8]"
                    : "bg-red-50"
                }`}
              >


                <p
                  className={`text-xs ${
                    availableToAllocate >= 0
                      ? "text-[#5f7568]"
                      : "text-red-500"
                  }`}
                >

                  Available to Allocate

                </p>


                <p
                  className={`mt-2 text-lg font-bold ${
                    availableToAllocate >= 0
                      ? "text-[#315c46]"
                      : "text-red-600"
                  }`}
                >

                  ₹
                  {
                    availableToAllocate.toLocaleString(
                      "en-IN",
                      {
                        maximumFractionDigits: 0,
                      }
                    )
                  }

                </p>


              </div>


            </div>


            {/* =================================================
                COMMITMENTS
               ================================================= */}

            {totalCommitments > 0 && (

              <div className="mt-5">


                <p className="mb-3 text-xs font-semibold text-[#52665b]">

                  Existing Monthly Commitments

                </p>


                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">


                  {/* =============================================
                      GOALS
                     ============================================= */}

                  {totalGoalAllocations > 0 && (

                    <CommitmentCard

                      label="Goal Allocations"

                      amount={
                        totalGoalAllocations
                      }

                    />

                  )}


                  {/* =============================================
                      LOANS
                     ============================================= */}

                  {totalLoanEMIs > 0 && (

                    <CommitmentCard

                      label="Loan EMIs"

                      amount={
                        totalLoanEMIs
                      }

                    />

                  )}


                  {/* =============================================
                      INVESTMENTS
                     ============================================= */}

                  {totalInvestmentContributions > 0 && (

                    <CommitmentCard

                      label="Investments"

                      amount={
                        totalInvestmentContributions
                      }

                    />

                  )}


                  {/* =============================================
                      INSURANCE
                     ============================================= */}

                  {totalInsurancePremiums > 0 && (

                    <CommitmentCard

                      label="Insurance"

                      amount={
                        totalInsurancePremiums
                      }

                    />

                  )}


                  {/* =============================================
                      TOTAL
                     ============================================= */}

                  <div className="rounded-xl border border-[#dcebd4] bg-[#f7fbf4] p-3">


                    <p className="text-[10px] text-[#5f7568]">

                      Total Commitments

                    </p>


                    <p className="mt-1 text-sm font-semibold text-[#315c46]">

                      ₹
                      {
                        totalCommitments.toLocaleString(
                          "en-IN",
                          {
                            maximumFractionDigits: 0,
                          }
                        )
                      }

                    </p>


                  </div>


                </div>


              </div>

            )}


            {/* =================================================
                EXPLANATION
               ================================================= */}

            {totalCommitments > 0 && (

              <div className="mt-5 rounded-xl border border-[#e5eadf] bg-[#fafcf8] p-4">


                <p className="text-xs leading-5 text-slate-500">

                  Monthly savings are calculated after expenses.
                  Active financial commitments are then deducted
                  to calculate the amount still available to
                  allocate.

                </p>


              </div>

            )}


            {/* =================================================
                SHORTFALL WARNING
               ================================================= */}

            {availableToAllocate < 0 && (

              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">


                <p className="text-sm font-semibold text-red-600">

                  Your existing commitments exceed your monthly savings.

                </p>


                <p className="mt-1 text-xs leading-5 text-red-500">

                  Your current monthly shortfall is ₹
                  {
                    monthlyShortfall.toLocaleString(
                      "en-IN",
                      {
                        maximumFractionDigits: 0,
                      }
                    )
                  }
                  . Review your existing financial commitments
                  before creating another voluntary commitment.

                </p>


              </div>

            )}


          </section>


          {/* ==================================================
              FINANCIAL SUGGESTIONS
             ==================================================
             
              This is the new section.

              It automatically checks:
              
              - Remaining monthly balance
              - Completed goals
              - Matured investments
              - Matured insurance
              - Completed loans
              - Financial shortfall
              
              It is NOT a chatbot.
              
             ================================================== */}

          <section className="mt-5">

            <FinancialSuggestions />

          </section>


          {/* ==================================================
              FINANCIAL HEALTH SCORE
             ================================================== */}

          <FinancialHealthScore

            income={
              income
            }

            expenses={
              expenses
            }

            totalCommitments={
              totalCommitments
            }

            availableToAllocate={
              availableToAllocate
            }

          />


          {/* ==================================================
              NET WORTH
             ================================================== */}

          <NetWorthChart />


          {/* ==================================================
              ACTIVE FINANCIAL ITEMS
             ================================================== */}

          <ActiveFinancialItems

            savingGoals={
              goals
            }

            liabilities={
              liabilityRecords
            }

            investments={
              investmentRecords
            }

            insurancePolicies={
              insuranceRecords
            }

            availableToAllocate={
              availableToAllocate
            }

          />


          {/* ==================================================
              UPCOMING FINANCIAL ACTIVITY
             ================================================== */}

          <UpcomingFinancialActivity

            savingGoals={
              goals
            }

            investments={
              investmentRecords
            }

            insurancePolicies={
              insuranceRecords
            }

            liabilities={
              liabilityRecords
            }

          />


        </div>


      </main>


    </div>

  );

}


// ============================================================
// COMMITMENT CARD
// ============================================================

function CommitmentCard({
  label,
  amount,
}) {

  return (

    <div className="rounded-xl border border-[#e5eadf] p-3">


      <p className="text-[10px] text-slate-400">

        {label}

      </p>


      <p className="mt-1 text-sm font-semibold text-[#18392c]">

        ₹
        {
          Number(
            amount || 0
          ).toLocaleString(
            "en-IN",
            {
              maximumFractionDigits: 0,
            }
          )
        }

      </p>


    </div>

  );

}


// ============================================================
// EXPORT
// ============================================================

export default UserDashboard;