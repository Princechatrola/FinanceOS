// ============================================================
// FINANCEOS - MONTHLY FINANCE FORM
// ============================================================

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  FiLayers,
  FiInfo,
  FiCheckCircle,
  FiArrowRight,
  FiTrendingUp,
} from "react-icons/fi";

import useFinance
  from "../../context/useFinance.js";

import CalculationBreakdownModal
  from "./CalculationBreakdownModal.jsx";


// ============================================================
// API
// ============================================================

const API_URL =
  "http://localhost:5000/api/monthly-finance";


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
// HELPERS
// ============================================================

function safeNumber(
  value,
  fallback = 0
) {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;
}


function formatMoney(value) {
  return safeNumber(value)
    .toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    });
}


function preventWheelChange(event) {
  event.currentTarget.blur();
}


function getAuthToken() {
  return (
    localStorage.getItem(
      "financeos_token"
    ) ||
    sessionStorage.getItem(
      "financeos_token"
    )
  );
}


// ============================================================
// MAIN COMPONENT
// ============================================================

function MonthlyFinanceForm() {

  const navigate =
    useNavigate();


  // ==========================================================
  // FINANCE CONTEXT
  // ==========================================================

  const {
    monthlyFinance,

    updateMonthlyFinance,
    updateCashBalance,
    saveNetWorthSnapshot,
    selectedMonth,
    setSelectedMonth,

    goalMonthlyCommitment = 0,
    investmentMonthlyCommitment = 0,
    insuranceMonthlyCommitment = 0,
    liabilityMonthlyCommitment = 0,

    // Real-time actual outflows & authoritative breakdown
    cashFlowBreakdown,
    totalActualOutflowCommitments = 0,
    totalMonthlyCommitments = 0,
    actualInvestmentOutflow = 0,
    actualGoalOutflow = 0,
    actualInsuranceOutflow = 0,
    actualLiabilityOutflow = 0,
  } = useFinance();

  const [searchParams, setSearchParams] = useSearchParams();
  const [showBreakdownModal, setShowBreakdownModal] = useState(false);

  // ==========================================================
  // CURRENT PERIOD
  // ==========================================================

  const today =
    new Date();

  const currentMonth =
    today.getMonth() + 1;

  const currentYear =
    today.getFullYear();

  // ==========================================================
  // RESOLVE INITIAL PERIOD FROM URL / CONTEXT
  // ==========================================================

  const monthParamStr = searchParams.get("month") || selectedMonth;
  let resolvedInitialMonth = currentMonth;
  let resolvedInitialYear = currentYear;

  if (monthParamStr && /^\d{4}-\d{1,2}$/.test(monthParamStr)) {
    const [y, m] = monthParamStr.split("-").map(Number);
    if (y >= 2000 && y <= 2100 && m >= 1 && m <= 12) {
      resolvedInitialYear = y;
      resolvedInitialMonth = m;
    }
  } else if (monthlyFinance?.year && monthlyFinance?.month) {
    resolvedInitialYear = safeNumber(monthlyFinance.year, currentYear);
    resolvedInitialMonth = safeNumber(monthlyFinance.month, currentMonth);
  }

  // ==========================================================
  // FORM STATE
  // ==========================================================

  const [month, setMonth] =
    useState(resolvedInitialMonth);

  const [year, setYear] =
    useState(resolvedInitialYear);

  const [income, setIncome] =
    useState("");

  const [expenses, setExpenses] =
    useState("");

  const [
    existingSavings,
    setExistingSavings,
  ] = useState("");

  const [
    updateDate,
    setUpdateDate,
  ] = useState(new Date().toISOString().split('T')[0]);

  const [
    reminderEnabled,
    setReminderEnabled,
  ] = useState(false);

  const [
    emailNotification,
    setEmailNotification,
  ] = useState(false);
  // ==========================================================
  // DATABASE RECORD
  // ==========================================================

  const [
    existingRecord,
    setExistingRecord,
  ] = useState(null);


  // ==========================================================
  // UI STATE
  // ==========================================================

  const [
    isLoading,
    setIsLoading,
  ] = useState(false);

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    showConfirmation,
    setShowConfirmation,
  ] = useState(false);


  // ==========================================================
  // PERIOD VALUES
  // ==========================================================

  const numericMonth =
    Number(month);

  const numericYear =
    Number(year);


  const isFuturePeriod =
    numericYear > currentYear ||
    (
      numericYear === currentYear &&
      numericMonth > currentMonth
    );


  const isPreviousMonth =
    numericYear < currentYear ||
    (
      numericYear === currentYear &&
      numericMonth < currentMonth
    );


  const monthLabel =
    MONTHS[numericMonth - 1] ||
    "Selected month";


  // ==========================================================
  // FINANCIAL CALCULATIONS
  // ==========================================================

  const numericIncome =
    safeNumber(income);

  const numericExpenses =
    safeNumber(expenses);

  const numericOpening =
    safeNumber(existingSavings);

  const monthlySavings =
    numericIncome -
    numericExpenses;


  const goalCommitment =
    safeNumber(
      goalMonthlyCommitment
    );

  const investmentCommitment =
    safeNumber(
      investmentMonthlyCommitment
    );

  const insuranceCommitment =
    safeNumber(
      insuranceMonthlyCommitment
    );

  const liabilityCommitment =
    safeNumber(
      liabilityMonthlyCommitment
    );


  // Actual Outflows (Only actual paid cash deducted)
  const actualOutflowsTotal =
    safeNumber(actualInvestmentOutflow) +
    safeNumber(actualGoalOutflow) +
    safeNumber(actualInsuranceOutflow) +
    safeNumber(actualLiabilityOutflow);

  const availableToAllocate =
    numericOpening +
    monthlySavings -
    actualOutflowsTotal;

  const remainingBalance =
    availableToAllocate;

  const closingBalance =
    availableToAllocate;


  // ==========================================================
  // LOAD SELECTED MONTH FROM MONGODB
  // ==========================================================

  useEffect(
    () => {

      async function loadMonth() {

        if (
          !Number.isInteger(
            numericMonth
          ) ||
          numericMonth < 1 ||
          numericMonth > 12 ||
          !Number.isInteger(
            numericYear
          ) ||
          numericYear < 2000 ||
          isFuturePeriod
        ) {
          return;
        }


        const token =
          getAuthToken();


        if (!token) {

          setErrorMessage(
            "Your login session was not found. Please sign in again."
          );

          return;
        }


        try {

          setIsLoading(true);
          setErrorMessage("");
          setSuccessMessage("");


          const response =
            await fetch(
              `${API_URL}/${numericYear}/${numericMonth}`,
              {
                method: "GET",

                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );


          const data =
            await response.json();


          if (!response.ok) {

            throw new Error(
              data.message ||
              "Unable to load monthly finance."
            );
          }


          // ==================================================
          // EXISTING RECORD
          // ==================================================

          if (data.finance) {

            const finance =
              data.finance;


            setExistingRecord(
              finance
            );


            setIncome(
              finance.income ?? 0
            );


            setExpenses(
              finance.expenses ?? 0
            );

            const opening =
              finance.openingBalance !== undefined
                ? finance.openingBalance
                : (finance.cashBalance ?? 0);

            setExistingSavings(
              opening
            );


            setUpdateDate(
              finance.updateDate ? new Date(finance.updateDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            );


            setReminderEnabled(
              Boolean(
                finance.reminderEnabled
              )
            );


            setEmailNotification(
              Boolean(
                finance.emailNotification
              )
            );


            return;
          }


          // ==================================================
          // NO RECORD FOR THIS MONTH (USE CARRIED BALANCE)
          // ==================================================

          setExistingRecord(null);

          setIncome("");
          setExpenses("");
          setExistingSavings(
            data.carriedOpeningBalance !== undefined ? data.carriedOpeningBalance : ""
          );
          setUpdateDate(new Date().toISOString().split('T')[0]);

          setReminderEnabled(false);
          setEmailNotification(false);

        } catch (error) {

          console.error(
            "Load monthly finance error:",
            error
          );


          setErrorMessage(
            error.message ||
            "Unable to load monthly finance."
          );

        } finally {

          setIsLoading(false);

        }
      }


      loadMonth();

    },
    [
      numericMonth,
      numericYear,
      isFuturePeriod,
    ]
  );


  // ==========================================================
  // CLEAR SUCCESS MESSAGE
  // ==========================================================

  useEffect(
    () => {

      if (!successMessage) {
        return undefined;
      }


      const timer =
        window.setTimeout(
          () => {
            setSuccessMessage("");
          },
          3500
        );


      return () =>
        window.clearTimeout(
          timer
        );

    },
    [successMessage]
  );


  // ==========================================================
  // MONTH CHANGE
  // ==========================================================

  function handleMonthChange(
    event
  ) {

    const selected =
      Number(
        event.target.value
      );


    if (
      Number(year) === currentYear &&
      selected > currentMonth
    ) {

      setErrorMessage(
        "Future monthly finance records are not allowed."
      );

      return;
    }


    setMonth(selected);

    if (year && selected) {
      const formatted = `${year}-${String(selected).padStart(2, "0")}`;
      setSelectedMonth(formatted);
      setSearchParams({ month: formatted });
    }

    setErrorMessage("");
    setSuccessMessage("");

  }


  // ==========================================================
  // YEAR CHANGE
  // ==========================================================

  function handleYearChange(
    event
  ) {

    const value =
      event.target.value;


    if (value === "") {

      setYear("");

      return;
    }


    const selected =
      Number(value);


    if (!Number.isInteger(selected)) {
      return;
    }


    if (selected > currentYear) {

      setErrorMessage(
        `You cannot create monthly finance records after ${currentYear}.`
      );

      return;
    }


    setYear(selected);

    let activeM = month;
    if (
      selected === currentYear &&
      Number(month) > currentMonth
    ) {
      activeM = currentMonth;
      setMonth(
        currentMonth
      );
    }

    if (selected && activeM) {
      const formatted = `${selected}-${String(activeM).padStart(2, "0")}`;
      setSelectedMonth(formatted);
      setSearchParams({ month: formatted });
    }

    setErrorMessage("");
    setSuccessMessage("");

  }


  // ==========================================================
  // VALIDATE
  // ==========================================================

  function validateForm() {

    const incomeValue =
      Number(income);

    const expensesValue =
      Number(expenses);

    const savingsValue =
      Number(existingSavings);


    if (
      !Number.isFinite(
        incomeValue
      ) ||
      incomeValue < 0
    ) {

      setErrorMessage(
        "Please enter a valid monthly income."
      );

      return false;
    }


    if (
      !Number.isFinite(
        expensesValue
      ) ||
      expensesValue < 0
    ) {

      setErrorMessage(
        "Please enter valid monthly expenses."
      );

      return false;
    }


    if (
      !Number.isFinite(
        savingsValue
      ) ||
      savingsValue < 0
    ) {

      setErrorMessage(
        "Please enter a valid existing cash and savings amount."
      );

      return false;
    }


    if (
      !Number.isInteger(
        numericMonth
      ) ||
      numericMonth < 1 ||
      numericMonth > 12
    ) {

      setErrorMessage(
        "Please select a valid month."
      );

      return false;
    }


    if (
      !Number.isInteger(
        numericYear
      ) ||
      numericYear < 2000 ||
      numericYear > currentYear
    ) {

      setErrorMessage(
        `Please enter a year between 2000 and ${currentYear}.`
      );

      return false;
    }


    if (isFuturePeriod) {

      setErrorMessage(
        "Future monthly finance records are not allowed."
      );

      return false;
    }

    if (!updateDate || isNaN(new Date(updateDate).getTime())) {
      setErrorMessage(
        "Please select a valid update date."
      );
      return false;
    }


    if (
      reminderEnabled &&
      !emailNotification
    ) {

      setErrorMessage(
        "Select Email when the monthly reminder is enabled."
      );

      return false;
    }


    setErrorMessage("");

    return true;
  }


  // ==========================================================
  // CHECK WHETHER EXISTING RECORD CHANGED
  // ==========================================================

  function hasChanges() {

    if (!existingRecord) {
      return true;
    }

    const currentIncome = Number(income);
    const currentExpenses = Number(expenses);
    const currentSavings = Number(existingSavings);

    const prevIncome = Number(existingRecord.income ?? 0);
    const prevExpenses = Number(existingRecord.expenses ?? 0);
    const prevSavings = Number(
      existingRecord.openingBalance !== undefined
        ? existingRecord.openingBalance
        : (existingRecord.cashBalance ?? 0)
    );

    const prevUpdateDate = existingRecord.updateDate
      ? new Date(existingRecord.updateDate).toISOString().split("T")[0]
      : "";

    const prevReminder = Boolean(existingRecord.reminderEnabled);
    const prevEmail = Boolean(existingRecord.emailNotification);

    return (
      currentIncome !== prevIncome ||
      currentExpenses !== prevExpenses ||
      currentSavings !== prevSavings ||
      updateDate !== prevUpdateDate ||
      Boolean(reminderEnabled) !== prevReminder ||
      Boolean(emailNotification) !== prevEmail
    );
  }


  // ==========================================================
  // FORM SUBMIT
  // ==========================================================

  function handleSubmit(
    event
  ) {

    event.preventDefault();


    setSuccessMessage("");


    if (!validateForm()) {
      return;
    }


    // Existing MongoDB record - show confirmation modal before updating
    if (existingRecord) {
      setShowConfirmation(true);
      return;
    }


    // New month does not need update confirmation.
    saveMonthlyFinance();
  }


  // ==========================================================
  // SAVE TO MONGODB
  // ==========================================================

  async function saveMonthlyFinance() {

    if (isSaving) {
      return;
    }


    const token =
      getAuthToken();


    if (!token) {

      setShowConfirmation(false);

      setErrorMessage(
        "Your login session was not found. Please sign in again."
      );

      return;
    }


    const numericIncome =
      Number(income);

    const numericExpenses =
      Number(expenses);

    const numericSavings =
      Number(existingSavings);


    const savedMonthlySavings =
      numericIncome -
      numericExpenses;


    const savedTotalCommitments =
      actualOutflowsTotal;

    const savedAvailable =
      numericSavings +
      savedMonthlySavings -
      savedTotalCommitments;


    try {

      setIsSaving(true);

      setErrorMessage("");
      setSuccessMessage("");


      const response =
        await fetch(
          API_URL,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                year:
                  numericYear,

                month:
                  numericMonth,

                income:
                  numericIncome,

                expenses:
                  numericExpenses,

                cashBalance:
                  numericSavings,

                openingBalance:
                  numericSavings,

                commitments:
                  savedTotalCommitments,

                closingBalance:
                  savedAvailable,

                updateDate:
                  updateDate,

                reminderEnabled,

                emailNotification,
              }),
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.message ||
          "Unable to save monthly finance."
        );

      }


      // ======================================================
      // MONGODB SUCCESS
      // ======================================================

      const savedFinance =
        data.finance;


      setExistingRecord(
        savedFinance
      );


      // ======================================================
      // UPDATE FINANCE CONTEXT
      //
      // Only after MongoDB succeeded.
      // ======================================================

      updateMonthlyFinance({
        month:
          numericMonth,

        year:
          numericYear,

        income:
          numericIncome,

        expenses:
          numericExpenses,

        cashBalance:
          numericSavings,

        openingBalance:
          numericSavings,

        closingBalance:
          savedAvailable,

        commitments:
          savedTotalCommitments,

        updateDate:
          updateDate,

        reminderEnabled,

        emailNotification,
      });


      updateCashBalance(
        numericSavings
      );


      // ======================================================
      // SAVE SNAPSHOT
      // ======================================================

      saveNetWorthSnapshot({
        month:
          numericMonth,

        year:
          numericYear,

        income:
          numericIncome,

        expenses:
          numericExpenses,

        cashBalance:
          numericSavings,

        monthlySavings:
          savedMonthlySavings,

        goalCommitment,

        investmentCommitment,

        insuranceCommitment,

        liabilityCommitment,

        totalCommitments:
          savedTotalCommitments,

        availableToAllocate:
          savedAvailable,

        remainingBalance:
          savedAvailable,
      });


      // ======================================================
      // FLASH MESSAGE
      // ======================================================

      const wasUpdate =
        Boolean(
          existingRecord
        );


      if (wasUpdate) {

        setSuccessMessage(
          `${monthLabel} ${numericYear} financial information updated successfully.`
        );

      } else {

        setSuccessMessage(
          `${monthLabel} ${numericYear} financial information saved successfully.`
        );

      }


      setShowConfirmation(false);


      // Do NOT immediately navigate.
      // User can see the success flash.
      //
      // Dashboard state has already been updated.

    } catch (error) {

      console.error(
        "Save monthly finance error:",
        error
      );


      setShowConfirmation(false);


      setErrorMessage(
        error.message ||
        "Unable to save monthly finance."
      );

    } finally {

      setIsSaving(false);

    }
  }


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <>

      {/* ======================================================
          SUCCESS FLASH
      ====================================================== */}

      {successMessage && (

        <div className="fixed right-6 top-6 z-[100] w-full max-w-sm rounded-2xl border border-green-200 bg-white p-4 shadow-xl">

          <div className="flex items-start gap-3">

            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-100 text-lg text-green-700">
              ✓
            </div>


            <div>

              <p className="text-sm font-semibold text-[#18392c]">
                Monthly Finance Updated
              </p>


              <p className="mt-1 text-xs leading-5 text-[#5f7568]">
                {successMessage}
              </p>

            </div>

          </div>

        </div>

      )}


      {/* ======================================================
          CONFIRMATION MODAL
      ====================================================== */}

      {showConfirmation && (

        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/35 px-4">

          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">


            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-xl text-amber-700">
              !
            </div>


            <h2 className="mt-4 text-lg font-bold text-[#18392c]">

              {isPreviousMonth
                ? `Update previous month?`
                : `Update ${monthLabel} ${numericYear}?`}

            </h2>


            {isPreviousMonth ? (

              <p className="mt-2 text-sm leading-6 text-slate-500">

                You are changing financial information for{" "}

                <span className="font-semibold text-[#18392c]">
                  {monthLabel} {numericYear}
                </span>.

                {" "}This is historical financial data.
                Updating it may change historical savings,
                reports, financial trends and related
                calculations.

              </p>

            ) : (

              <p className="mt-2 text-sm leading-6 text-slate-500">

                Financial information already exists for{" "}

                <span className="font-semibold text-[#18392c]">
                  {monthLabel} {numericYear}
                </span>.

                {" "}Updating it will recalculate your
                savings, available allocation and related
                financial figures.

              </p>

            )}


            <div className="mt-6 flex justify-end gap-3">


              <button
                type="button"

                disabled={
                  isSaving
                }

                onClick={() =>
                  setShowConfirmation(
                    false
                  )
                }

                className="rounded-xl border border-[#dce5d7] bg-white px-5 py-2.5 text-sm font-semibold text-[#52665b] transition hover:bg-[#f7f9f4] disabled:opacity-50"
              >
                Cancel
              </button>


              <button
                type="button"

                disabled={
                  isSaving
                }

                onClick={
                  saveMonthlyFinance
                }

                className="rounded-xl bg-[#315c46] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#264b39] disabled:cursor-not-allowed disabled:opacity-60"
              >

                {isSaving
                  ? "Updating..."
                  : isPreviousMonth
                    ? "Update Previous Month"
                    : "Update Finance"}

              </button>


            </div>

          </div>

        </div>

      )}


      {/* ======================================================
          FORM
      ====================================================== */}

      <form
        onSubmit={
          handleSubmit
        }
        className="space-y-7"
      >


        {/* ====================================================
            FINANCIAL PERIOD
        ==================================================== */}

        <section>

          <SectionTitle
            eyebrow="Period"
            title="Financial Period"
            description="Select the month and year for the financial information you are recording."
          />


          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">


            <FormField
              label="Month"
              description="Future months cannot be selected."
            >

              <select
                value={month}

                disabled={
                  isLoading ||
                  isSaving
                }

                onChange={
                  handleMonthChange
                }

                className="w-full rounded-xl border border-[#dce5d7] bg-white px-4 py-3 text-sm text-[#18392c] outline-none transition focus:border-[#79a966] focus:ring-2 focus:ring-[#79a966]/10 disabled:bg-slate-50"
              >

                {MONTHS.map(
                  (
                    name,
                    index
                  ) => {

                    const value =
                      index + 1;


                    const future =
                      Number(year) === currentYear &&
                      value > currentMonth;


                    return (

                      <option
                        key={name}
                        value={value}
                        disabled={future}
                      >

                        {name}

                        {future
                          ? " - Not Available Yet"
                          : ""}

                      </option>

                    );
                  }
                )}

              </select>

            </FormField>


            <FormField
              label="Year"
              description={`Future years are not allowed. Maximum year: ${currentYear}.`}
            >

              <input
                type="number"

                min="2000"
                max={currentYear}
                step="1"

                value={year}

                disabled={
                  isLoading ||
                  isSaving
                }

                onChange={
                  handleYearChange
                }

                onWheel={
                  preventWheelChange
                }

                className="w-full rounded-xl border border-[#dce5d7] bg-white px-4 py-3 text-sm text-[#18392c] outline-none transition focus:border-[#79a966] focus:ring-2 focus:ring-[#79a966]/10 disabled:bg-slate-50"
              />

            </FormField>

          </div>


          <div className="mt-4 rounded-xl border border-[#dcebd4] bg-[#f7fbf4] px-4 py-3">

            <p className="text-xs text-[#5f7568]">

              Current available period:{" "}

              <span className="font-semibold text-[#18392c]">

                {MONTHS[
                  currentMonth - 1
                ]}{" "}

                {currentYear}

              </span>

            </p>


            <p className="mt-1 text-[11px] text-slate-400">

              You can record the current month or previous months,
              but future months cannot be created or changed.

            </p>

          </div>


          {isLoading && (

            <div className="mt-4 rounded-xl border border-[#e4ebe0] bg-white px-4 py-3">

              <p className="text-xs font-medium text-[#5f7568]">
                Loading {monthLabel} {numericYear} from FinanceOS...
              </p>

            </div>

          )}


          {!isLoading &&
            existingRecord && (

              <div className="mt-4 rounded-xl border border-[#dcebd4] bg-[#f7fbf4] px-4 py-3">

                <p className="text-xs font-semibold text-[#315c46]">

                  Existing record found for {monthLabel} {numericYear}.

                </p>


                <p className="mt-1 text-[11px] text-[#5f7568]">

                  Changes to this record will require confirmation before updating.

                </p>

              </div>

            )}

        </section>


        {/* ====================================================
            INCOME & EXPENSES
        ==================================================== */}

        <section>

          <SectionTitle
            eyebrow="Monthly Position"
            title="Income & Expenses"
            description="Enter your income and regular expenses for this month."
          />


          <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">


            <FormField
              label="Monthly Income"
              description="Your total income for the selected month."
            >

              <MoneyInput
                value={income}
                onChange={setIncome}
                placeholder="Enter monthly income"
                disabled={isLoading || isSaving}
              />

            </FormField>


            <FormField
              label="Monthly Expenses"
              description="Your regular expenses for the selected month."
            >

              <MoneyInput
                value={expenses}
                onChange={setExpenses}
                placeholder="Enter monthly expenses"
                disabled={isLoading || isSaving}
              />

            </FormField>

          </div>


          <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#f3f7ef] px-5 py-5">

            <div>

              <p className="text-xs font-medium text-[#5f7568]">
                Estimated Monthly Savings
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Monthly income minus monthly expenses.
              </p>

            </div>


            <MoneyValue
              value={
                monthlySavings
              }
              large
            />

          </div>

        </section>


        {/* ====================================================
            OPENING / EXISTING BALANCE
        ==================================================== */}

        <section className="rounded-2xl border border-[#dce5d7] bg-[#fcfdfb] p-5">

          <SectionTitle
            eyebrow="Financial Position"
            title="Opening / Existing Balance"
            description="Money available at the start of this month. For ongoing months, this carries forward automatically from the previous month's closing balance."
          />


          <div className="mt-5 max-w-xl">

            <FormField
              label="Opening / Starting Balance"
              description="Funds already available in cash, bank accounts or liquid savings at the beginning of the month."
            >

              <MoneyInput
                value={
                  existingSavings
                }

                onChange={
                  setExistingSavings
                }

                placeholder="Enter starting balance"

                disabled={
                  isLoading ||
                  isSaving
                }
              />

            </FormField>

          </div>

          {/* ====================================================
              DETAILED OPENING BALANCE CALCULATION CARD (RULE 2 & 7)
             ==================================================== */}
          <div className="mt-5 rounded-2xl border border-[#dce8d6] bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FiInfo className="text-[#315c46]" />
                <span className="text-xs font-bold text-[#18392c] uppercase tracking-wider">
                  Opening Balance Provenance
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowBreakdownModal(true)}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#315c46] hover:text-[#18392c] hover:underline cursor-pointer"
              >
                <span>View Full Calculation</span>
                <FiArrowRight size={12} />
              </button>
            </div>

            <div className="text-xs space-y-1.5 text-[#305440]">
              {cashFlowBreakdown?.openingBalance?.previousMonthLabel ? (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 border-b border-[#f0f4ee]">
                  <span className="text-slate-600">Previous Month Closing ({cashFlowBreakdown.openingBalance.previousMonthLabel}):</span>
                  <span className="font-bold text-slate-800">
                    ₹{formatMoney(cashFlowBreakdown.openingBalance.previousMonthClosingBalance)}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 border-b border-[#f0f4ee]">
                  <span className="text-slate-600">Starting Source:</span>
                  <span className="font-bold text-slate-800">User-entered initial starting balance</span>
                </div>
              )}

              {cashFlowBreakdown?.openingBalance?.hasAdjustment && (
                <div className="flex items-center justify-between py-1 border-b border-[#f0f4ee] text-amber-700">
                  <span>Current Month Opening Adjustment:</span>
                  <span className="font-bold">
                    {cashFlowBreakdown.openingBalance.adjustmentAmount > 0 ? "+" : ""}
                    ₹{formatMoney(cashFlowBreakdown.openingBalance.adjustmentAmount)}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between pt-1 font-bold text-[#18392c]">
                <span>Existing / Opening Balance:</span>
                <span className="text-sm text-[#24533a] bg-[#eef7ec] px-2.5 py-0.5 rounded-lg border border-[#cbe1c3]">
                  ₹{formatMoney(numericOpening)}
                </span>
              </div>
            </div>
          </div>

        </section>


        {/* ====================================================
            COMMITMENTS
        ==================================================== */}

        <section>

          <SectionTitle
            eyebrow="Commitments"
            title="Monthly Financial Commitments"
            description="FinanceOS subtracts active commitments and expenses from your opening balance and income to calculate available allocation and closing balance."
          />


          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

            <CommitmentCard
              label="Saving Goals"
              value={
                goalCommitment
              }
            />

            <CommitmentCard
              label="Investments"
              value={
                investmentCommitment
              }
            />

            <CommitmentCard
              label="Insurance"
              value={
                insuranceCommitment
              }
            />

            <CommitmentCard
              label="Liabilities"
              value={
                liabilityCommitment
              }
            />

          </div>


          {/* Monthly Summary & Carry-Forward Card */}
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">


            <div className="rounded-xl border border-[#e4ebe0] bg-[#f8faf6] p-4">

              <p className="text-xs text-[#5f7568]">
                Total Actual Outflows Recorded
              </p>


              <div className="mt-2">

                <MoneyValue
                  value={
                    actualOutflowsTotal
                  }
                />

              </div>

              <p className="mt-1 text-[11px] text-slate-400">
                Sum of actual paid investments, goals, insurance & EMIs.
              </p>

            </div>


            <div className="rounded-xl border border-[#dcebd4] bg-[#f3f8ef] p-4">

              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[#315c46]">
                  Available to Allocate
                </p>
                <button
                  type="button"
                  onClick={() => setShowBreakdownModal(true)}
                  className="text-[10px] font-bold text-[#315c46] hover:underline cursor-pointer"
                >
                  View Details
                </button>
              </div>


              <div className="mt-2">

                <MoneyValue
                  value={
                    availableToAllocate
                  }
                />

              </div>

              <p className="mt-1 text-[11px] text-[#5f7568]">
                Opening (₹{formatMoney(numericOpening)}) + Income (₹{formatMoney(numericIncome)}) − Outflows (₹{formatMoney(numericExpenses + actualOutflowsTotal)})
              </p>

            </div>


            <div className="rounded-xl border border-[#cfe2c9] bg-[#eaf4e6] p-4">

              <p className="text-xs font-semibold text-[#18392c]">
                Next Month Opening Balance
              </p>


              <div className="mt-2">

                <MoneyValue
                  value={
                    closingBalance
                  }
                />

              </div>

              <p className="mt-1 text-[11px] text-[#4f6e5c]">
                Carried forward automatically into next month.
              </p>

            </div>


          </div>

          {/* ====================================================
              CALCULATION BREAKDOWN MODAL
             ==================================================== */}
          <CalculationBreakdownModal
            isOpen={showBreakdownModal}
            onClose={() => setShowBreakdownModal(false)}
            breakdown={cashFlowBreakdown}
            monthLabel={`${monthLabel} ${numericYear}`}
          />

        </section>


        {/* ====================================================
            UPDATE DATE
        ==================================================== */}

        <section>

          <SectionTitle
            eyebrow="Monthly Update"
            title="Monthly Update Date"
            description="Choose the date you normally update your monthly financial position."
          />


          <div className="mt-4 max-w-xl">

            <FormField
              label="Update Date"
              description="Pick the date you normally update your monthly financial position."
            >

              <input
                type="date"
                value={updateDate}

                disabled={
                  isLoading ||
                  isSaving
                }

                onChange={
                  (event) =>
                    setUpdateDate(
                      event.target.value
                    )
                }

                className="w-full rounded-xl border border-[#dce5d7] bg-white px-4 py-3 text-sm text-[#18392c] outline-none transition focus:border-[#79a966] focus:ring-2 focus:ring-[#79a966]/10 disabled:bg-slate-50"
              />

            </FormField>

          </div>

        </section>


        {/* ====================================================
            REMINDER
        ==================================================== */}

        <section className="rounded-2xl border border-[#dce5d7] bg-[#fcfdfb] p-5">

          <SectionTitle
            eyebrow="Reminder"
            title="Monthly Finance Reminder"
            description="FinanceOS can remind you to update your monthly financial information."
          />


          <div className="mt-5">

            <label className="flex items-center gap-3">

              <input
                type="checkbox"

                checked={
                  reminderEnabled
                }

                disabled={
                  isLoading ||
                  isSaving
                }

                onChange={
                  (event) =>
                    setReminderEnabled(
                      event.target.checked
                    )
                }

                className="h-4 w-4 accent-[#315c46]"
              />


              <span className="text-sm font-medium text-[#18392c]">
                Enable Monthly Reminder
              </span>

            </label>

          </div>


          {reminderEnabled && (

            <div className="mt-5 rounded-xl border border-[#e4ebe0] bg-white p-4">

              <div className="mt-4 flex flex-col gap-4">

                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={emailNotification}
                    onChange={(e) =>
                      setEmailNotification(e.target.checked)
                    }
                    className="h-4 w-4 rounded border-gray-300 text-[#315c46] focus:ring-[#315c46]"
                  />
                  <span className="text-sm font-medium text-[#18392c]">
                    Email Notification
                  </span>
                </label>

              </div>

            </div>

          )}

        </section>


        {/* ====================================================
            ERROR
        ==================================================== */}

        {errorMessage && (

          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">

            <p className="text-sm font-medium text-red-600">
              {errorMessage}
            </p>

          </div>

        )}


        {/* ====================================================
            SAVE
        ==================================================== */}

        <div className="flex items-center justify-between border-t border-[#edf0ea] pt-6">


          <button
            type="button"

            onClick={() =>
              navigate(
                selectedMonth ? `/dashboard?month=${selectedMonth}` : "/dashboard"
              )
            }

            className="rounded-xl border border-[#dce5d7] bg-white px-5 py-3 text-sm font-semibold text-[#52665b] transition hover:bg-[#f7f9f4]"
          >
            Back to Dashboard
          </button>


          <button
            type="submit"

            disabled={
              isFuturePeriod ||
              isLoading ||
              isSaving
            }

            className={`rounded-xl px-7 py-3 text-sm font-semibold text-white transition ${
              isFuturePeriod ||
              isLoading ||
              isSaving

                ? "cursor-not-allowed bg-slate-300"

                : "bg-[#315c46] hover:bg-[#264b39]"
            }`}
          >

            {isSaving
              ? "Saving..."
              : existingRecord
                ? "Update Monthly Finance"
                : "Save Monthly Finance"}

          </button>

        </div>


      </form>

    </>
  );
}


// ============================================================
// SECTION TITLE
// ============================================================

function SectionTitle({
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


      <h3 className="mt-1 text-sm font-semibold text-[#18392c]">
        {title}
      </h3>


      {description && (

        <p className="mt-1 text-xs leading-5 text-slate-400">
          {description}
        </p>

      )}

    </div>
  );
}


// ============================================================
// FORM FIELD
// ============================================================

function FormField({
  label,
  description,
  children,
}) {

  return (
    <div>

      <label className="block text-xs font-medium text-[#5f7568]">
        {label}
      </label>


      {description && (

        <p className="mt-1 text-[11px] leading-4 text-slate-400">
          {description}
        </p>

      )}


      <div className="mt-2">
        {children}
      </div>

    </div>
  );
}


// ============================================================
// MONEY INPUT
// ============================================================

function MoneyInput({
  value,
  onChange,
  placeholder,
  disabled = false,
}) {

  function handleChange(
    event
  ) {

    const newValue =
      event.target.value;


    if (newValue === "") {

      onChange("");

      return;
    }


    const number =
      Number(newValue);


    if (
      Number.isFinite(number) &&
      number >= 0
    ) {

      onChange(
        newValue
      );

    }
  }


  return (

    <div className="relative">

      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium text-[#315c46]">
        ₹
      </span>


      <input
        type="number"

        min="0"
        step="1"

        value={
          value
        }

        disabled={
          disabled
        }

        onChange={
          handleChange
        }

        onWheel={
          preventWheelChange
        }

        placeholder={
          placeholder
        }

        className="w-full rounded-xl border border-[#dce5d7] bg-white py-3 pl-10 pr-4 text-sm text-[#18392c] outline-none transition focus:border-[#79a966] focus:ring-2 focus:ring-[#79a966]/10 disabled:bg-slate-50"
      />

    </div>

  );
}


// ============================================================
// MONEY VALUE
// ============================================================

function MoneyValue({
  value,
  large = false,
}) {

  const number =
    safeNumber(value);


  const negative =
    number < 0;


  return (

    <p
      className={`font-bold ${
        large
          ? "text-2xl"
          : "text-lg"
      } ${
        negative
          ? "text-red-600"
          : "text-[#315c46]"
      }`}
    >

      {negative
        ? "-"
        : ""}

      ₹
      {formatMoney(
        Math.abs(
          number
        )
      )}

    </p>

  );
}


// ============================================================
// COMMITMENT CARD
// ============================================================

function CommitmentCard({
  label,
  value,
}) {

  return (

    <div className="rounded-xl border border-[#e4ebe0] bg-white p-4">

      <p className="text-[10px] font-medium text-slate-400">
        {label}
      </p>


      <p className="mt-2 text-sm font-bold text-[#18392c]">

        ₹
        {formatMoney(
          value
        )}

      </p>

    </div>

  );
}


// ============================================================
// EXPORT
// ============================================================

export default MonthlyFinanceForm;