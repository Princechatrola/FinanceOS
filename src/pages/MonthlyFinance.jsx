// ============================================================
// FINANCEOS - MONTHLY FINANCE PAGE
// ============================================================
//
// Purpose:
//
// This page allows the user to maintain the financial
// information used throughout FinanceOS.
//
// User can manage:
//
// 1. Monthly Income
// 2. Monthly Expenses
// 3. Existing Cash & Savings
// 4. Monthly update date
// 5. Reminders
// 6. Notification channels
//
// FinanceOS uses this information for:
//
// - Monthly Savings
// - Available to Allocate
// - Financial Health Score
// - Net Worth
// - Net Worth Growth
// - Reports
//
// IMPORTANT:
//
// MonthlyFinance.jsx
//      = Page structure
//
// MonthlyFinanceForm.jsx
//      = Form functionality
//
// ============================================================


// ============================================================
// IMPORT LAYOUT COMPONENTS
// ============================================================

import Sidebar
  from "../components/layout/Sidebar.jsx";

import Topbar
  from "../components/layout/Topbar.jsx";


// ============================================================
// IMPORT MONTHLY FINANCE FORM
// ============================================================

import MonthlyFinanceForm
  from "../components/monthlyFinance/MonthlyFinanceForm.jsx";

import useFinance
  from "../context/useFinance.js";


// ============================================================
// MONTHLY FINANCE PAGE
// ============================================================

function MonthlyFinance() {

  const { sidebarCollapsed } = useFinance();

  return (

    <div className="min-h-screen bg-[#f6f8f4]">


      {/* ======================================================
          SIDEBAR
         ====================================================== */}

      <Sidebar />


      {/* ======================================================
          MAIN PAGE
         ====================================================== */}

      <main className={`min-h-screen transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-64"}`}>


        {/* ====================================================
            TOPBAR
           ==================================================== */}

        <Topbar />


        {/* ====================================================
            PAGE CONTENT
           ==================================================== */}

        <div className="px-8 py-6">


          {/* ==================================================
              PAGE HEADER
             ================================================== */}

          <div className="mb-6">


            <p className="text-sm font-medium text-[#5f7568]">

              FinanceOS

            </p>


            <h1 className="mt-1 text-2xl font-bold text-[#18392c]">

              Monthly Finance

            </h1>


            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">

              Record your monthly income, expenses and financial
              position so FinanceOS can calculate savings,
              available allocation, financial health and net
              worth.

            </p>


          </div>


          {/* ==================================================
              INFORMATION CARDS
             ================================================== */}

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">


            {/* =================================================
                MONTHLY FINANCE
               ================================================= */}

            <div className="rounded-2xl border border-[#e2e8dc] bg-white p-4">


              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6c8b72]">

                Monthly Position

              </p>


              <h3 className="mt-2 text-sm font-semibold text-[#18392c]">

                Income & Expenses

              </h3>


              <p className="mt-1 text-xs leading-5 text-slate-400">

                Record your monthly income and expenses to
                calculate how much you save during the month.

              </p>


            </div>


            {/* =================================================
                CASH & SAVINGS
               ================================================= */}

            <div className="rounded-2xl border border-[#e2e8dc] bg-white p-4">


              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6c8b72]">

                Financial Position

              </p>


              <h3 className="mt-2 text-sm font-semibold text-[#18392c]">

                Cash & Savings

              </h3>


              <p className="mt-1 text-xs leading-5 text-slate-400">

                Record your existing cash and savings so your
                financial position reflects money you already
                own.

              </p>


            </div>


            {/* =================================================
                AVAILABLE TO ALLOCATE BREAKDOWN
               ================================================= */}

            <div className="rounded-2xl border border-[#dcebd4] bg-[#f7fbf4] p-4">


              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#315c46]">

                Cash Flow Engine

              </p>


              <h3 className="mt-2 text-sm font-semibold text-[#18392c]">

                Available to Allocate

              </h3>


              <p className="mt-1 text-xs leading-5 text-[#5f7568]">

                Opening balance plus monthly income minus actual
                recorded cash outflows to show true unallocated liquidity.

              </p>


            </div>


            {/* =================================================
                NET WORTH
               ================================================= */}

            <div className="rounded-2xl border border-[#e2e8dc] bg-white p-4">


              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6c8b72]">

                Dashboard

              </p>


              <h3 className="mt-2 text-sm font-semibold text-[#18392c]">

                Net Worth

              </h3>


              <p className="mt-1 text-xs leading-5 text-slate-400">

                FinanceOS combines cash, savings and
                investments, then subtracts outstanding
                liabilities.

              </p>


            </div>


          </div>


          {/* ==================================================
              MONTHLY FINANCE FORM CONTAINER
             ================================================== */}

          <section className="rounded-2xl border border-[#e2e8dc] bg-white p-6">


            {/* =================================================
                FORM HEADER
               ================================================= */}

            <div className="mb-6">


              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6c8b72]">

                Monthly Setup

              </p>


              <h2 className="mt-1 text-base font-semibold text-[#18392c]">

                Set Your Monthly Finance

              </h2>


              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">

                Enter or update the financial information for
                the selected month. Your Dashboard will update
                automatically after the information is saved.

              </p>


            </div>


            {/* =================================================
                FORM
               ================================================= */}

            <MonthlyFinanceForm />


          </section>


          {/* ==================================================
              NET WORTH EXPLANATION
             ================================================== */}

          <section className="mt-6 rounded-2xl border border-[#dcebd4] bg-[#f7fbf4] p-5">


            <h2 className="text-sm font-semibold text-[#18392c]">

              How FinanceOS uses this information

            </h2>


            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">


              {/* SAVINGS */}

              <div className="rounded-xl bg-white p-4">


                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c8b72]">

                  Monthly Savings

                </p>


                <p className="mt-2 text-xs font-medium text-[#18392c]">

                  Income − Expenses

                </p>


              </div>


              {/* ASSETS */}

              <div className="rounded-xl bg-white p-4">


                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c8b72]">

                  Assets

                </p>


                <p className="mt-2 text-xs font-medium text-[#18392c]">

                  Cash & Savings + Investments

                </p>


              </div>


              {/* NET WORTH */}

              <div className="rounded-xl bg-white p-4">


                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c8b72]">

                  Net Worth

                </p>


                <p className="mt-2 text-xs font-medium text-[#18392c]">

                  Total Assets − Outstanding Liabilities

                </p>


              </div>


            </div>


            <p className="mt-4 text-[11px] leading-5 text-[#5f7568]">

              Monthly income itself is not counted as an asset.
              FinanceOS uses the amount remaining after expenses
              when calculating monthly savings.

            </p>


          </section>


        </div>


      </main>


    </div>

  );

}


// ============================================================
// EXPORT
// ============================================================

export default MonthlyFinance;