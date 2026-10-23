// ============================================================
// FINANCEOS - FIRST TIME USER ONBOARDING
// ============================================================
//
// PURPOSE:
//
// Show new users a short introduction to FinanceOS before
// entering the Dashboard.
//
// FLOW:
//
// Step 1 -> Welcome
// Step 2 -> How FinanceOS Works
// Step 3 -> Initial Monthly Setup
// Step 4 -> Dashboard
//
// Initial monthly finance is stored through FinanceProvider.
//
// ============================================================


// ============================================================
// IMPORTS
// ============================================================

import {
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  FiArrowRight,
  FiArrowLeft,
  FiDollarSign,
  FiLayers,
  FiActivity,
  FiCalendar,
  FiTarget,
  FiCheck,
} from "react-icons/fi";

import financeOSLogo
  from "../assets/images/financeos-logo.png";

import useFinance
  from "../context/useFinance.js";


// ============================================================
// ONBOARDING COMPONENT
// ============================================================

function Onboarding() {


  // ==========================================================
  // NAVIGATION
  // ==========================================================

  const navigate =
    useNavigate();


  // ==========================================================
  // FINANCE CONTEXT
  // ==========================================================

  const {
    updateMonthlyFinance,
  } = useFinance();


  // ==========================================================
  // CURRENT STEP
  // ==========================================================

  const [
    step,
    setStep,
  ] = useState(1);


  // ==========================================================
  // INITIAL MONTHLY FINANCE
  // ==========================================================

  const [
    income,
    setIncome,
  ] = useState("");


  const [
    expenses,
    setExpenses,
  ] = useState("");


  // ==========================================================
  // CURRENT DATE
  // ==========================================================

  const today =
    new Date();


  const currentMonthNumber =
    today.getMonth() + 1;


  const currentMonth =
    today.toLocaleString(
      "en-US",
      {
        month: "long",
      }
    );


  const currentYear =
    today.getFullYear();


  // ==========================================================
  // COMPLETE ONBOARDING
  // ==========================================================

  function completeOnboarding() {


    // --------------------------------------------------------
    // Remember that onboarding was completed.
    //
    // Later this should be stored per authenticated user in
    // MongoDB instead of using one browser-wide value.
    // --------------------------------------------------------

    localStorage.setItem(
      "financeos_onboarding_completed",
      "true"
    );


    // --------------------------------------------------------
    // DASHBOARD
    // --------------------------------------------------------

    navigate(
      "/dashboard",
      {
        replace: true,
      }
    );

  }


  // ==========================================================
  // FINISH INITIAL SETUP
  // ==========================================================

  function finishSetup() {


    // --------------------------------------------------------
    // CONVERT FORM VALUES TO NUMBERS
    // --------------------------------------------------------

    const incomeValue =
      Number(
        income || 0
      );


    const expensesValue =
      Number(
        expenses || 0
      );


    // --------------------------------------------------------
    // VALIDATION
    // --------------------------------------------------------

    if (
      !Number.isFinite(
        incomeValue
      ) ||
      incomeValue < 0
    ) {

      return;

    }


    if (
      !Number.isFinite(
        expensesValue
      ) ||
      expensesValue < 0
    ) {

      return;

    }


    // --------------------------------------------------------
    // UPDATE FINANCE PROVIDER
    // --------------------------------------------------------
    //
    // This updates the same monthlyFinance object used by:
    //
    // Dashboard
    // Monthly Finance
    // Financial Health Score
    //
    // --------------------------------------------------------

    updateMonthlyFinance({

      month:
        currentMonthNumber,

      year:
        currentYear,

      income:
        incomeValue,

      expenses:
        expensesValue,

    });


    // --------------------------------------------------------
    // COMPLETE ONBOARDING
    // --------------------------------------------------------

    completeOnboarding();

  }


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div className="min-h-screen bg-[#f6f8f4]">


      {/* ======================================================
          HEADER
         ====================================================== */}

      <header className="flex h-20 items-center justify-between border-b border-[#e2e8dc] bg-white px-6 sm:px-10">


        {/* LOGO */}

        <img
          src={financeOSLogo}
          alt="FinanceOS"
          className="w-[190px] object-contain"
        />


        {/* STEP INDICATOR */}

        <div className="hidden items-center gap-2 sm:flex">


          {[1, 2, 3].map(
            (number) => (

              <div
                key={
                  number
                }

                className={`h-2 rounded-full transition-all duration-300 ${
                  number === step
                    ? "w-8 bg-[#315c46]"
                    : number < step
                    ? "w-4 bg-[#aac59a]"
                    : "w-4 bg-[#dfe6da]"
                }`}
              />

            )
          )}


        </div>


        {/* SKIP */}

        <button
          type="button"

          onClick={
            completeOnboarding
          }

          className="text-xs font-semibold text-[#52665b] transition hover:text-[#18392c]"
        >

          Skip for now

        </button>


      </header>


      {/* ======================================================
          MAIN CONTENT
         ====================================================== */}

      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-6xl items-center justify-center px-6 py-10">


        {/* ====================================================
            STEP 1
            WELCOME
           ==================================================== */}

        {step === 1 && (

          <div className="w-full">


            {/* INTRO */}

            <div className="mx-auto max-w-3xl text-center">


              {/* ICON */}

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dff0d4] text-2xl text-[#315c46]">

                <FiActivity />

              </div>


              {/* LABEL */}

              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-[#6c8b72]">

                Welcome to FinanceOS

              </p>


              {/* TITLE */}

              <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#18392c] sm:text-4xl">

                Your finances.

                <br />

                One organized financial view.

              </h1>


              {/* DESCRIPTION */}

              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500">

                FinanceOS helps you understand your monthly
                financial position, organize saving goals and
                financial commitments, track important dates,
                and view useful financial insights in one place.

              </p>


            </div>


            {/* =================================================
                FEATURE CARDS
               ================================================= */}

            <div className="mx-auto mt-10 grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-3">


              <FeatureCard

                icon={
                  FiDollarSign
                }

                title="Monthly Finance"

                description="Record monthly income and expenses and understand how much remains after expenses."

              />


              <FeatureCard

                icon={
                  FiLayers
                }

                title="Plans & Commitments"

                description="Organize investments, insurance policies and liabilities in one financial view."

              />


              <FeatureCard

                icon={
                  FiActivity
                }

                title="Financial Insights"

                description="Understand allocation capacity, financial health and upcoming financial activity."

              />


            </div>


            {/* GET STARTED */}

            <div className="mt-10 flex justify-center">


              <button
                type="button"

                onClick={() =>
                  setStep(2)
                }

                className="flex items-center gap-2 rounded-xl bg-[#315c46] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#264c3a]"
              >

                Get Started

                <FiArrowRight />

              </button>


            </div>


          </div>

        )}


        {/* ====================================================
            STEP 2
            HOW FINANCEOS WORKS
           ==================================================== */}

        {step === 2 && (

          <div className="w-full max-w-5xl">


            {/* HEADER */}

            <div className="text-center">


              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6c8b72]">

                How FinanceOS Works

              </p>


              <h1 className="mt-3 text-3xl font-bold text-[#18392c]">

                Build your financial picture

              </h1>


              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500">

                Add your financial information and FinanceOS
                brings it together into a structured overview.

              </p>


            </div>


            {/* =================================================
                FLOW
               ================================================= */}

            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">


              <FlowCard

                number="01"

                icon={
                  FiDollarSign
                }

                title="Record Monthly Finance"

                description="Add your monthly income and expenses."

              />


              <FlowCard

                number="02"

                icon={
                  FiTarget
                }

                title="Set Saving Goals"

                description="Create financial goals and monthly allocations."

              />


              <FlowCard

                number="03"

                icon={
                  FiLayers
                }

                title="Add Commitments"

                description="Track investments, insurance policies and liabilities."

              />


              <FlowCard

                number="04"

                icon={
                  FiCalendar
                }

                title="Track & Understand"

                description="Use your calendar, reminders, reports and financial health insights."

              />


            </div>


            {/* =================================================
                INFORMATION
               ================================================= */}

            <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-[#dcebd4] bg-[#f7fbf4] p-5">


              <div className="flex items-start gap-3">


                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dff0d4] text-[#315c46]">

                  <FiCheck />

                </div>


                <p className="text-xs leading-6 text-[#52665b]">

                  You don't need to enter everything immediately.
                  Start with monthly finance and add goals,
                  investments, insurance policies or liabilities
                  whenever they become relevant.

                </p>


              </div>


            </div>


            {/* =================================================
                NAVIGATION
               ================================================= */}

            <div className="mt-10 flex items-center justify-center gap-3">


              <button
                type="button"

                onClick={() =>
                  setStep(1)
                }

                className="flex items-center gap-2 rounded-xl border border-[#dce5d7] bg-white px-5 py-3 text-sm font-semibold text-[#52665b] transition hover:bg-[#f7f9f3]"
              >

                <FiArrowLeft />

                Back

              </button>


              <button
                type="button"

                onClick={() =>
                  setStep(3)
                }

                className="flex items-center gap-2 rounded-xl bg-[#315c46] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#264c3a]"
              >

                Continue

                <FiArrowRight />

              </button>


            </div>


          </div>

        )}


        {/* ====================================================
            STEP 3
            INITIAL MONTHLY SETUP
           ==================================================== */}

        {step === 3 && (

          <div className="w-full max-w-xl">


            {/* HEADER */}

            <div className="text-center">


              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6c8b72]">

                Initial Setup

              </p>


              <h1 className="mt-3 text-3xl font-bold text-[#18392c]">

                Set up your first month

              </h1>


              <p className="mt-3 text-sm leading-6 text-slate-500">

                Start with the basics. You can update these
                values later from Monthly Finance.

              </p>


            </div>


            {/* =================================================
                FORM
               ================================================= */}

            <div className="mt-8 rounded-2xl border border-[#e2e8dc] bg-white p-6 shadow-sm">


              {/* FINANCIAL MONTH */}

              <div>


                <label className="text-xs font-semibold text-[#52665b]">

                  Financial Month

                </label>


                <div className="mt-2 rounded-xl border border-[#dfe6da] bg-[#f7f9f3] px-4 py-3 text-sm font-semibold text-[#18392c]">

                  {currentMonth} {currentYear}

                </div>


              </div>


              {/* =================================================
                  INCOME
                 ================================================= */}

              <div className="mt-5">


                <label
                  htmlFor="onboarding-income"
                  className="text-xs font-semibold text-[#52665b]"
                >

                  Monthly Income

                </label>


                <div className="relative mt-2">


                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">

                    ₹

                  </span>


                  <input
                    id="onboarding-income"

                    type="number"

                    min="0"

                    value={
                      income
                    }

                    onChange={
                      (event) =>
                        setIncome(
                          event.target.value
                        )
                    }

                    placeholder="Enter monthly income"

                    className="w-full rounded-xl border border-[#dfe6da] bg-white py-3 pl-9 pr-4 text-sm text-[#18392c] outline-none transition placeholder:text-slate-300 focus:border-[#8eb17f] focus:ring-2 focus:ring-[#e5f2dd]"
                  />


                </div>


              </div>


              {/* =================================================
                  EXPENSES
                 ================================================= */}

              <div className="mt-5">


                <label
                  htmlFor="onboarding-expenses"
                  className="text-xs font-semibold text-[#52665b]"
                >

                  Monthly Expenses

                </label>


                <div className="relative mt-2">


                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">

                    ₹

                  </span>


                  <input
                    id="onboarding-expenses"

                    type="number"

                    min="0"

                    value={
                      expenses
                    }

                    onChange={
                      (event) =>
                        setExpenses(
                          event.target.value
                        )
                    }

                    placeholder="Enter monthly expenses"

                    className="w-full rounded-xl border border-[#dfe6da] bg-white py-3 pl-9 pr-4 text-sm text-[#18392c] outline-none transition placeholder:text-slate-300 focus:border-[#8eb17f] focus:ring-2 focus:ring-[#e5f2dd]"
                  />


                </div>


              </div>


              {/* =================================================
                  LIVE PREVIEW
                 ================================================= */}

              {(income !== "" ||
                expenses !== "") && (

                <div className="mt-5 grid grid-cols-2 gap-3">


                  <div className="rounded-xl bg-[#f7f9f3] p-3">


                    <p className="text-[10px] text-slate-400">

                      Estimated Savings

                    </p>


                    <p
                      className={`mt-1 text-sm font-bold ${
                        Number(income || 0) -
                          Number(expenses || 0) >=
                        0
                          ? "text-[#315c46]"
                          : "text-red-500"
                      }`}
                    >

                      ₹
                      {(
                        Number(
                          income || 0
                        ) -
                        Number(
                          expenses || 0
                        )
                      ).toLocaleString(
                        "en-IN"
                      )}

                    </p>


                  </div>


                  <div className="rounded-xl bg-[#f7f9f3] p-3">


                    <p className="text-[10px] text-slate-400">

                      First Month

                    </p>


                    <p className="mt-1 text-sm font-bold text-[#18392c]">

                      {currentMonth}

                    </p>


                  </div>


                </div>

              )}


              {/* =================================================
                  INFORMATION
                 ================================================= */}

              <div className="mt-5 rounded-xl bg-[#f7fbf4] p-4">


                <p className="text-[11px] leading-5 text-[#5f7568]">

                  FinanceOS uses these values to calculate
                  monthly savings, allocation capacity and your
                  Financial Health Score.

                </p>


              </div>


            </div>


            {/* =================================================
                BUTTONS
               ================================================= */}

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">


              {/* BACK */}

              <button
                type="button"

                onClick={() =>
                  setStep(2)
                }

                className="flex items-center gap-2 rounded-xl border border-[#dce5d7] bg-white px-5 py-3 text-sm font-semibold text-[#52665b] transition hover:bg-[#f7f9f3]"
              >

                <FiArrowLeft />

                Back

              </button>


              {/* SKIP */}

              <button
                type="button"

                onClick={
                  completeOnboarding
                }

                className="rounded-xl px-5 py-3 text-sm font-semibold text-[#52665b] transition hover:bg-[#edf3e8]"
              >

                Skip Setup

              </button>


              {/* FINISH */}

              <button
                type="button"

                onClick={
                  finishSetup
                }

                className="flex items-center gap-2 rounded-xl bg-[#315c46] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#264c3a]"
              >

                Finish Setup

                <FiCheck />

              </button>


            </div>


          </div>

        )}


      </main>


    </div>

  );

}


// ============================================================
// FEATURE CARD
// ============================================================

function FeatureCard({

  icon: Icon,

  title,

  description,

}) {

  return (

    <div className="rounded-2xl border border-[#e2e8dc] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-sm">


      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9f4e2] text-[#315c46]">

        <Icon />

      </div>


      <h3 className="mt-4 text-sm font-bold text-[#18392c]">

        {title}

      </h3>


      <p className="mt-2 text-xs leading-5 text-slate-500">

        {description}

      </p>


    </div>

  );

}


// ============================================================
// FLOW CARD
// ============================================================

function FlowCard({

  number,

  icon: Icon,

  title,

  description,

}) {

  return (

    <div className="relative rounded-2xl border border-[#e2e8dc] bg-white p-5">


      {/* NUMBER */}

      <span className="text-[10px] font-bold tracking-widest text-[#8eb17f]">

        {number}

      </span>


      {/* ICON */}

      <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e9f4e2] text-[#315c46]">

        <Icon />

      </div>


      {/* TITLE */}

      <h3 className="mt-4 text-sm font-bold text-[#18392c]">

        {title}

      </h3>


      {/* DESCRIPTION */}

      <p className="mt-2 text-xs leading-5 text-slate-500">

        {description}

      </p>


    </div>

  );

}


// ============================================================
// EXPORT
// ============================================================

export default Onboarding;