// ============================================================
// FINANCEOS - MONTHLY FINANCE FORM
// ============================================================

import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import useFinance
  from "../../context/useFinance.js";


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

    goalMonthlyCommitment = 0,
    investmentMonthlyCommitment = 0,
    insuranceMonthlyCommitment = 0,
    liabilityMonthlyCommitment = 0,
  } = useFinance();


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
  // INITIAL PERIOD
  // ==========================================================

  const contextMonth =
    safeNumber(
      monthlyFinance?.month,
      currentMonth
    );

  const contextYear =
    safeNumber(
      monthlyFinance?.year,
      currentYear
    );


  const contextIsFuture =
    contextYear > currentYear ||
    (
      contextYear === currentYear &&
      contextMonth > currentMonth
    );


  const initialMonth =
    contextIsFuture
      ? currentMonth
      : contextMonth;


  const initialYear =
    contextIsFuture
      ? currentYear
      : contextYear;


  // ==========================================================
  // FORM STATE
  // ==========================================================

  const [month, setMonth] =
    useState(initialMonth);

  const [year, setYear] =
    useState(initialYear);

  const [income, setIncome] =
    useState("");

  const [expenses, setExpenses] =
    useState("");

  const [
    existingSavings,
    setExistingSavings,
  ] = useState("");

  const [
    updateDay,
    setUpdateDay,
  ] = useState(1);

  const [
    reminderEnabled,
    setReminderEnabled,
  ] = useState(false);

  const [
    emailNotification,
    setEmailNotification,
  ] = useState(false);

  const [
    smsNotification,
    setSmsNotification,
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


  const totalMonthlyCommitments =
    goalCommitment +
    investmentCommitment +
    insuranceCommitment +
    liabilityCommitment;


  const remainingBalance =
    monthlySavings -
    totalMonthlyCommitments;


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


            setExistingSavings(
              finance.cashBalance ?? 0
            );


            setUpdateDay(
              finance.updateDay ?? 1
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


            setSmsNotification(
              Boolean(
                finance.smsNotification
              )
            );


            return;
          }


          // ==================================================
          // NO RECORD FOR THIS MONTH
          // ==================================================

          setExistingRecord(null);

          setIncome("");
          setExpenses("");
          setExistingSavings("");
          setUpdateDay(1);

          setReminderEnabled(false);
          setEmailNotification(false);
          setSmsNotification(false);

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


    if (
      selected === currentYear &&
      Number(month) > currentMonth
    ) {

      setMonth(
        currentMonth
      );

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

    const dayValue =
      Number(updateDay);


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


    if (
      !Number.isInteger(
        dayValue
      ) ||
      dayValue < 1 ||
      dayValue > 31
    ) {

      setErrorMessage(
        "Monthly update day must be between 1 and 31."
      );

      return false;
    }


    if (
      reminderEnabled &&
      !emailNotification &&
      !smsNotification
    ) {

      setErrorMessage(
        "Select Email or SMS when the monthly reminder is enabled."
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


    return (
      Number(income) !==
        Number(
          existingRecord.income
        ) ||

      Number(expenses) !==
        Number(
          existingRecord.expenses
        ) ||

      Number(existingSavings) !==
        Number(
          existingRecord.cashBalance
        ) ||

      Number(updateDay) !==
        Number(
          existingRecord.updateDay
        ) ||

      Boolean(
        reminderEnabled
      ) !==
        Boolean(
          existingRecord.reminderEnabled
        ) ||

      Boolean(
        emailNotification
      ) !==
        Boolean(
          existingRecord.emailNotification
        ) ||

      Boolean(
        smsNotification
      ) !==
        Boolean(
          existingRecord.smsNotification
        )
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


    // Existing MongoDB record.
    if (existingRecord) {

      if (!hasChanges()) {

        setErrorMessage(
          "No changes to save."
        );

        return;
      }


      // Show confirmation before update.
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


    const savedIncome =
      Number(income);

    const savedExpenses =
      Number(expenses);

    const savedCashBalance =
      Number(existingSavings);

    const savedUpdateDay =
      Number(updateDay);


    const savedMonthlySavings =
      savedIncome -
      savedExpenses;


    const savedTotalCommitments =
      totalMonthlyCommitments;


    const savedAvailable =
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
                  savedIncome,

                expenses:
                  savedExpenses,

                cashBalance:
                  savedCashBalance,

                updateDay:
                  savedUpdateDay,

                reminderEnabled:
                  Boolean(
                    reminderEnabled
                  ),

                emailNotification:
                  Boolean(
                    emailNotification
                  ),

                smsNotification:
                  Boolean(
                    smsNotification
                  ),
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
          savedIncome,

        expenses:
          savedExpenses,

        cashBalance:
          savedCashBalance,

        updateDay:
          savedUpdateDay,

        reminderEnabled:
          Boolean(
            reminderEnabled
          ),

        emailNotification:
          Boolean(
            emailNotification
          ),

        smsNotification:
          Boolean(
            smsNotification
          ),
      });


      updateCashBalance(
        savedCashBalance
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
          savedIncome,

        expenses:
          savedExpenses,

        cashBalance:
          savedCashBalance,

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
            CASH & SAVINGS
        ==================================================== */}

        <section className="rounded-2xl border border-[#dce5d7] bg-[#fcfdfb] p-5">

          <SectionTitle
            eyebrow="Financial Position"
            title="Existing Cash & Savings"
            description="Enter the cash and savings you already had before this month's calculated savings."
          />


          <div className="mt-5 max-w-xl">

            <FormField
              label="Existing Balance"
              description="Money already available in cash, bank accounts or savings."
            >

              <MoneyInput
                value={
                  existingSavings
                }

                onChange={
                  setExistingSavings
                }

                placeholder="Enter existing balance"

                disabled={
                  isLoading ||
                  isSaving
                }
              />

            </FormField>

          </div>

        </section>


        {/* ====================================================
            COMMITMENTS
        ==================================================== */}

        <section>

          <SectionTitle
            eyebrow="Commitments"
            title="Monthly Financial Commitments"
            description="FinanceOS subtracts active commitments from monthly savings to calculate the amount available to allocate."
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


          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">


            <div className="rounded-xl border border-[#e4ebe0] bg-[#f8faf6] p-4">

              <p className="text-xs text-[#5f7568]">
                Total Monthly Commitments
              </p>


              <div className="mt-2">

                <MoneyValue
                  value={
                    totalMonthlyCommitments
                  }
                />

              </div>

            </div>


            <div className="rounded-xl border border-[#dcebd4] bg-[#f3f8ef] p-4">

              <p className="text-xs text-[#5f7568]">
                Available to Allocate
              </p>


              <div className="mt-2">

                <MoneyValue
                  value={
                    remainingBalance
                  }
                />

              </div>

            </div>

          </div>

        </section>


        {/* ====================================================
            UPDATE DAY
        ==================================================== */}

        <section>

          <SectionTitle
            eyebrow="Monthly Update"
            title="Monthly Update Date"
            description="Choose the day you normally update your monthly financial position."
          />


          <div className="mt-4 max-w-xl">

            <FormField
              label="Update Day"
              description="Enter a day between 1 and 31."
            >

              <input
                type="number"

                min="1"
                max="31"
                step="1"

                value={
                  updateDay
                }

                disabled={
                  isLoading ||
                  isSaving
                }

                onChange={
                  (event) =>
                    setUpdateDay(
                      event.target.value
                    )
                }

                onWheel={
                  preventWheelChange
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

              <p className="text-xs font-medium text-[#5f7568]">
                Notification Channels
              </p>


              <p className="mt-1 text-[11px] text-slate-400">
                Select how you want FinanceOS to send the reminder.
              </p>


              <div className="mt-4 flex flex-wrap gap-6">


                <label className="flex items-center gap-2">

                  <input
                    type="checkbox"

                    checked={
                      emailNotification
                    }

                    disabled={
                      isLoading ||
                      isSaving
                    }

                    onChange={
                      (event) =>
                        setEmailNotification(
                          event.target.checked
                        )
                    }

                    className="h-4 w-4 accent-[#315c46]"
                  />

                  <span className="text-sm text-[#18392c]">
                    Email
                  </span>

                </label>


                <label className="flex items-center gap-2">

                  <input
                    type="checkbox"

                    checked={
                      smsNotification
                    }

                    disabled={
                      isLoading ||
                      isSaving
                    }

                    onChange={
                      (event) =>
                        setSmsNotification(
                          event.target.checked
                        )
                    }

                    className="h-4 w-4 accent-[#315c46]"
                  />

                  <span className="text-sm text-[#18392c]">
                    SMS
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
                "/dashboard"
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