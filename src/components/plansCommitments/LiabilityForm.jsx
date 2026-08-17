// ============================================================
// FINANCEOS - LIABILITY FORM
// ============================================================
//
// Supports:
//
// - Personal Loan
// - Home Loan
// - Vehicle Loan
// - Education Loan
// - Credit Card
// - Other Liability
//
// Reminder Channels:
//
// - In-App
// - Email
// - SMS
//
// FinanceOS automatically calculates:
//
// Remaining Payments
// Expected Completion Date
// Final Payment Amount
// Next Due Date
//
// ============================================================

import { useMemo, useState } from "react";

import {
  FiCreditCard,
  FiX,
  FiCalendar,
  FiBell,
  FiClock,
} from "react-icons/fi";

import useFinance from "../../context/useFinance.js";


// ============================================================
// COMMON INPUT STYLE
// ============================================================

const inputClass =
  "mt-2 w-full rounded-xl border border-[#dfe6da] bg-[#fafcf8] px-4 py-3 text-sm text-[#18392c] outline-none transition placeholder:text-slate-300 focus:border-[#9fbd8d]";


// ============================================================
// FORMAT MONEY
// ============================================================

function formatMoney(amount) {
  return Number(amount || 0).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  );
}


// ============================================================
// FORMAT DATE INPUT
// ============================================================

function formatDateInput(date) {
  if (
    !(date instanceof Date) ||
    Number.isNaN(date.getTime())
  ) {
    return "";
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      date.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}


// ============================================================
// FORMAT DISPLAY DATE
// ============================================================

function formatDisplayDate(
  dateString
) {
  if (!dateString) {
    return "-";
  }

  const parts =
    dateString
      .split("-")
      .map(Number);

  if (parts.length !== 3) {
    return dateString;
  }

  const [
    year,
    month,
    day,
  ] = parts;

  const date =
    new Date(
      year,
      month - 1,
      day
    );

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return dateString;
  }

  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  );
}


// ============================================================
// CALCULATE NEXT DUE DATE
// ============================================================
//
// Example:
//
// Start date = 2026-07-10
// EMI day    = 5
//
// 5 July is before the start date.
//
// Therefore:
// Next payment = 5 August 2026
//
// Due day is limited to 1-28.
// ============================================================

function calculateNextDueDate(
  startDate,
  dueDay
) {
  if (
    !startDate ||
    !dueDay
  ) {
    return "";
  }

  const [
    year,
    month,
    day,
  ] = startDate
    .split("-")
    .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return "";
  }

  const selectedDay =
    Math.min(
      Math.max(
        Number(dueDay),
        1
      ),
      28
    );

  const start =
    new Date(
      year,
      month - 1,
      day
    );

  let dueDate =
    new Date(
      year,
      month - 1,
      selectedDay
    );

  if (dueDate < start) {
    dueDate =
      new Date(
        year,
        month,
        selectedDay
      );
  }

  return formatDateInput(
    dueDate
  );
}


// ============================================================
// ADD MONTHS TO DATE
// ============================================================

function addMonthsToDate(
  dateString,
  monthsToAdd
) {
  if (!dateString) {
    return "";
  }

  const [
    year,
    month,
    day,
  ] = dateString
    .split("-")
    .map(Number);

  if (
    !year ||
    !month ||
    !day
  ) {
    return "";
  }

  const targetDate =
    new Date(
      year,
      month - 1 +
        Number(
          monthsToAdd || 0
        ),
      day
    );

  return formatDateInput(
    targetDate
  );
}


// ============================================================
// CALCULATE REPAYMENT SCHEDULE
// ============================================================

function calculateRepaymentSchedule(
  remaining,
  emi,
  nextDueDate
) {
  const balance =
    Number(
      remaining || 0
    );

  const payment =
    Number(
      emi || 0
    );

  if (
    !Number.isFinite(balance) ||
    !Number.isFinite(payment) ||
    balance <= 0 ||
    payment <= 0 ||
    !nextDueDate
  ) {
    return {
      remainingPayments: 0,
      expectedEndDate: "",
      finalPaymentAmount: 0,
    };
  }

  // Number of remaining payments

  const remainingPayments =
    Math.ceil(
      balance / payment
    );

  // nextDueDate is payment #1.
  // Therefore 12 payments means add 11 months.

  const expectedEndDate =
    addMonthsToDate(
      nextDueDate,
      remainingPayments - 1
    );

  // Calculate final payment

  const amountBeforeLastPayment =
    payment *
    (
      remainingPayments - 1
    );

  const finalPaymentAmount =
    Math.max(
      balance -
        amountBeforeLastPayment,
      0
    );

  return {
    remainingPayments,
    expectedEndDate,
    finalPaymentAmount,
  };
}


// ============================================================
// LIABILITY FORM
// ============================================================

function LiabilityForm({
  onClose,
  onSuccess,
}) {

  // ==========================================================
  // FINANCE CONTEXT
  // ==========================================================

  const {
    addLiability,
  } = useFinance();


  // ==========================================================
  // TODAY
  // ==========================================================

  const today =
    formatDateInput(
      new Date()
    );


  // ==========================================================
  // BASIC DETAILS
  // ==========================================================

  const [
    liabilityType,
    setLiabilityType,
  ] = useState(
    "Personal Loan"
  );

  const [
    liabilityName,
    setLiabilityName,
  ] = useState("");


  // ==========================================================
  // AMOUNTS
  // ==========================================================

  const [
    originalAmount,
    setOriginalAmount,
  ] = useState("");

  const [
    remainingAmount,
    setRemainingAmount,
  ] = useState("");

  const [
    monthlyEMI,
    setMonthlyEMI,
  ] = useState("");


  // ==========================================================
  // DATES
  // ==========================================================

  const [
    startDate,
    setStartDate,
  ] = useState(
    today
  );

  const [
    dueDay,
    setDueDay,
  ] = useState("5");


  // ==========================================================
  // PAYMENT REMINDER
  // ==========================================================

  const [
    reminderEnabled,
    setReminderEnabled,
  ] = useState(false);


  // ==========================================================
  // REMINDER TIMES
  // ==========================================================

  const [
    fiveDaysBefore,
    setFiveDaysBefore,
  ] = useState(false);

  const [
    oneDayBefore,
    setOneDayBefore,
  ] = useState(true);

  const [
    onDueDate,
    setOnDueDate,
  ] = useState(true);


  // ==========================================================
  // REMINDER CHANNELS
  // ==========================================================

  const [
    inAppReminder,
    setInAppReminder,
  ] = useState(true);

  const [
    emailReminder,
    setEmailReminder,
  ] = useState(true);

  const [
    smsReminder,
    setSmsReminder,
  ] = useState(false);


  // ==========================================================
  // ERROR
  // ==========================================================

  const [
    error,
    setError,
  ] = useState("");


  // ==========================================================
  // CALCULATED AMOUNTS
  // ==========================================================

  const original =
    Number(
      originalAmount || 0
    );

  const remaining =
    remainingAmount === ""
      ? original
      : Number(
          remainingAmount || 0
        );

  const emi =
    Number(
      monthlyEMI || 0
    );


  // ==========================================================
  // NEXT DUE DATE
  // ==========================================================

  const nextDueDate =
    useMemo(
      () =>
        calculateNextDueDate(
          startDate,
          dueDay
        ),
      [
        startDate,
        dueDay,
      ]
    );


  // ==========================================================
  // AUTOMATIC REPAYMENT SCHEDULE
  // ==========================================================

  const repaymentSchedule =
    useMemo(
      () =>
        calculateRepaymentSchedule(
          remaining,
          emi,
          nextDueDate
        ),
      [
        remaining,
        emi,
        nextDueDate,
      ]
    );

  const remainingPayments =
    repaymentSchedule
      .remainingPayments;

  const expectedEndDate =
    repaymentSchedule
      .expectedEndDate;

  const finalPaymentAmount =
    repaymentSchedule
      .finalPaymentAmount;


  // ==========================================================
  // REPAYMENT PROGRESS
  // ==========================================================

  const repaymentProgress =
    original > 0
      ? Math.min(
          Math.max(
            (
              (
                original -
                remaining
              ) /
              original
            ) * 100,
            0
          ),
          100
        )
      : 0;


  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = (
    event
  ) => {
    event.preventDefault();

    setError("");


    // ========================================================
    // NAME VALIDATION
    // ========================================================

    if (
      !liabilityName.trim()
    ) {
      setError(
        "Enter a liability name."
      );

      return;
    }


    // ========================================================
    // ORIGINAL AMOUNT
    // ========================================================

    if (
      !Number.isFinite(original) ||
      original <= 0
    ) {
      setError(
        "Enter a valid original loan or outstanding amount."
      );

      return;
    }


    // ========================================================
    // REMAINING BALANCE
    // ========================================================

    if (
      !Number.isFinite(remaining) ||
      remaining < 0
    ) {
      setError(
        "Enter a valid remaining balance."
      );

      return;
    }

    if (
      remaining >
      original
    ) {
      setError(
        "Remaining balance cannot be greater than the original amount."
      );

      return;
    }


    // ========================================================
    // EMI
    // ========================================================

    if (
      remaining > 0 &&
      (
        !Number.isFinite(emi) ||
        emi <= 0
      )
    ) {
      setError(
        "Enter a valid monthly EMI or payment amount."
      );

      return;
    }


    // ========================================================
    // START DATE
    // ========================================================

    if (!startDate) {
      setError(
        "Select the liability start date."
      );

      return;
    }


    // ========================================================
    // DUE DAY
    // ========================================================

    const dueDayNumber =
      Number(
        dueDay
      );

    if (
      !Number.isInteger(
        dueDayNumber
      ) ||
      dueDayNumber < 1 ||
      dueDayNumber > 28
    ) {
      setError(
        "Payment due day must be between 1 and 28."
      );

      return;
    }


    // ========================================================
    // REMINDER TIME VALIDATION
    // ========================================================

    if (
      reminderEnabled &&
      !fiveDaysBefore &&
      !oneDayBefore &&
      !onDueDate
    ) {
      setError(
        "Select at least one payment reminder time."
      );

      return;
    }


    // ========================================================
    // REMINDER CHANNEL VALIDATION
    // ========================================================

    if (
      reminderEnabled &&
      !inAppReminder &&
      !emailReminder &&
      !smsReminder
    ) {
      setError(
        "Select at least one payment reminder channel."
      );

      return;
    }


    // ========================================================
    // NOTIFY BEFORE
    // ========================================================

    const notifyBefore =
      [];

    if (
      fiveDaysBefore
    ) {
      notifyBefore.push(5);
    }

    if (
      oneDayBefore
    ) {
      notifyBefore.push(1);
    }

    if (
      onDueDate
    ) {
      notifyBefore.push(0);
    }


    // ========================================================
    // CREATE LIABILITY
    // ========================================================

    const newLiability =
      addLiability({

        // ----------------------------------------------------
        // DETAILS
        // ----------------------------------------------------

        name:
          liabilityName.trim(),

        type:
          liabilityType,


        // ----------------------------------------------------
        // AMOUNTS
        // ----------------------------------------------------

        originalAmount:
          original,

        remainingAmount:
          remaining,

        monthlyEMI:
          remaining === 0
            ? 0
            : emi,


        // ----------------------------------------------------
        // CALCULATED REPAYMENT
        // ----------------------------------------------------

        remainingPayments:
          remaining === 0
            ? 0
            : remainingPayments,

        expectedEndDate:
          remaining === 0
            ? null
            : expectedEndDate,

        finalPaymentAmount:
          remaining === 0
            ? 0
            : finalPaymentAmount,


        // ----------------------------------------------------
        // CALENDAR
        // ----------------------------------------------------

        startDate,

        nextDueDate:
          remaining === 0
            ? null
            : nextDueDate,


        // ----------------------------------------------------
        // STATUS
        // ----------------------------------------------------

        status:
          remaining === 0
            ? "Completed"
            : "Active",


        // ----------------------------------------------------
        // PAYMENT REMINDER
        // ----------------------------------------------------

        reminder: {

          enabled:
            remaining > 0
              ? reminderEnabled
              : false,

          dueDay:
            dueDayNumber,

          notifyBefore:
            remaining > 0 &&
            reminderEnabled
              ? notifyBefore
              : [],


          // ==================================================
          // CHANNELS
          // ==================================================

          channels: {

            inApp:
              remaining > 0 &&
              reminderEnabled
                ? inAppReminder
                : false,

            email:
              remaining > 0 &&
              reminderEnabled
                ? emailReminder
                : false,

            sms:
              remaining > 0 &&
              reminderEnabled
                ? smsReminder
                : false,

          },

        },

      });


    // ========================================================
    // SUCCESS
    // ========================================================

    if (onSuccess) {
      onSuccess(
        newLiability
      );
    }


    // ========================================================
    // CLOSE
    // ========================================================

    if (onClose) {
      onClose();
    }
  };


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4">

      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[#e2e8dc] bg-white shadow-xl">


        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-[#edf0e9] bg-white p-6">

          <div>

            <div className="flex items-center gap-2 text-[#315c46]">

              <FiCreditCard />

              <p className="text-[10px] font-semibold uppercase tracking-[0.15em]">
                Liability
              </p>

            </div>


            <h2 className="mt-2 text-xl font-bold text-[#18392c]">
              Add Liability
            </h2>


            <p className="mt-1 text-xs leading-5 text-slate-400">
              Add a loan, credit card balance or another
              financial obligation.
            </p>

          </div>


          <button
            type="button"
            onClick={
              onClose
            }
            aria-label="Close"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-400 transition hover:bg-[#f4f7f1]"
          >
            <FiX />
          </button>

        </div>


        {/* ====================================================
            FORM
        ==================================================== */}

        <form
          onSubmit={
            handleSubmit
          }
          className="p-6"
        >


          {/* ==================================================
              LIABILITY DETAILS
          ================================================== */}

          <SectionHeading
            title="Liability Details"
            description="Enter the loan or outstanding balance you want FinanceOS to track."
          />


          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">


            {/* TYPE */}

            <div>

              <FieldLabel>
                Liability Type
              </FieldLabel>


              <select
                value={
                  liabilityType
                }
                onChange={
                  (event) =>
                    setLiabilityType(
                      event.target.value
                    )
                }
                className={
                  inputClass
                }
              >

                <option value="Personal Loan">
                  Personal Loan
                </option>

                <option value="Home Loan">
                  Home Loan
                </option>

                <option value="Vehicle Loan">
                  Vehicle Loan
                </option>

                <option value="Education Loan">
                  Education Loan
                </option>

                <option value="Credit Card">
                  Credit Card Outstanding
                </option>

                <option value="Other Liability">
                  Other Liability
                </option>

              </select>

            </div>


            {/* NAME */}

            <div>

              <FieldLabel>
                Name
              </FieldLabel>


              <input
                type="text"
                value={
                  liabilityName
                }
                onChange={
                  (event) =>
                    setLiabilityName(
                      event.target.value
                    )
                }
                placeholder="Example: SBI Home Loan"
                className={
                  inputClass
                }
              />

            </div>

          </div>


          {/* ==================================================
              BALANCE
          ================================================== */}

          <div className="mt-7 border-t border-[#edf0e9] pt-6">

            <SectionHeading
              title="Balance & Payment"
              description="Enter the original amount, current remaining balance and regular monthly payment."
            />


            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">


              {/* ORIGINAL */}

              <div>

                <FieldLabel>
                  Original Amount
                </FieldLabel>


                <MoneyInput
                  value={
                    originalAmount
                  }
                  onChange={
                    setOriginalAmount
                  }
                  placeholder="50000"
                />

              </div>


              {/* REMAINING */}

              <div>

                <FieldLabel>
                  Remaining Balance
                </FieldLabel>


                <MoneyInput
                  value={
                    remainingAmount
                  }
                  onChange={
                    setRemainingAmount
                  }
                  placeholder={
                    originalAmount ||
                    "50000"
                  }
                />


                <p className="mt-1 text-[10px] leading-4 text-slate-400">
                  Leave empty if the full original amount is
                  still outstanding.
                </p>

              </div>


              {/* EMI */}

              <div>

                <FieldLabel>
                  Monthly EMI / Payment
                </FieldLabel>


                <MoneyInput
                  value={
                    monthlyEMI
                  }
                  onChange={
                    setMonthlyEMI
                  }
                  placeholder="3000"
                />

              </div>

            </div>


            {/* ==================================================
                REPAYMENT PROGRESS
            ================================================== */}

            {original > 0 && (

              <div className="mt-5 rounded-xl border border-[#e2e8dc] bg-[#fafcf8] p-4">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-[10px] text-slate-400">
                      Repaid
                    </p>

                    <p className="mt-1 text-sm font-semibold text-[#18392c]">
                      ₹
                      {formatMoney(
                        Math.max(
                          original -
                            remaining,
                          0
                        )
                      )}
                    </p>

                  </div>


                  <div className="text-right">

                    <p className="text-[10px] text-slate-400">
                      Remaining
                    </p>

                    <p className="mt-1 text-sm font-semibold text-[#18392c]">
                      ₹
                      {formatMoney(
                        remaining
                      )}
                    </p>

                  </div>

                </div>


                <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e7eee2]">

                  <div
                    className="h-full rounded-full bg-[#315c46] transition-all"
                    style={{
                      width: `${repaymentProgress}%`,
                    }}
                  />

                </div>


                <p className="mt-2 text-[10px] text-slate-400">
                  {repaymentProgress.toFixed(
                    1
                  )}
                  % repaid
                </p>

              </div>

            )}

          </div>


          {/* ==================================================
              PAYMENT SCHEDULE
          ================================================== */}

          <div className="mt-7 border-t border-[#edf0e9] pt-6">

            <SectionHeading
              title="Payment Schedule"
              description="FinanceOS automatically estimates when the liability will be completed."
            />


            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">


              {/* START DATE */}

              <div>

                <FieldLabel>
                  Start Date
                </FieldLabel>


                <input
                  type="date"
                  value={
                    startDate
                  }
                  onChange={
                    (event) =>
                      setStartDate(
                        event.target.value
                      )
                  }
                  className={
                    inputClass
                  }
                />

              </div>


              {/* DUE DAY */}

              <div>

                <FieldLabel>
                  Payment Due Day
                </FieldLabel>


                <select
                  value={
                    dueDay
                  }
                  onChange={
                    (event) =>
                      setDueDay(
                        event.target.value
                      )
                  }
                  className={
                    inputClass
                  }
                >

                  {Array.from(
                    {
                      length: 28,
                    },
                    (
                      _,
                      index
                    ) =>
                      index + 1
                  ).map(
                    (day) => (

                      <option
                        key={
                          day
                        }
                        value={
                          day
                        }
                      >
                        Day {day}
                      </option>

                    )
                  )}

                </select>

              </div>

            </div>


            {/* ==================================================
                NEXT PAYMENT
            ================================================== */}

            {nextDueDate &&
              remaining > 0 && (

              <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#e2e8dc] bg-[#fafcf8] p-4">

                <FiCalendar className="mt-0.5 shrink-0 text-[#315c46]" />


                <div>

                  <p className="text-xs font-semibold text-[#18392c]">
                    Next Payment Date
                  </p>


                  <p className="mt-1 text-sm font-semibold text-[#315c46]">
                    {formatDisplayDate(
                      nextDueDate
                    )}
                  </p>


                  <p className="mt-1 text-[10px] leading-4 text-slate-400">
                    FinanceOS calculates this from the start
                    date and selected payment due day.
                  </p>

                </div>

              </div>

            )}


            {/* ==================================================
                COMPLETION ESTIMATE
            ================================================== */}

            {remaining > 0 &&
              emi > 0 &&
              expectedEndDate && (

              <div className="mt-4 rounded-xl border border-[#cfe0c7] bg-[#f5faf2] p-5">

                <div className="flex items-start gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#315c46]">
                    <FiClock />
                  </div>


                  <div className="min-w-0 flex-1">

                    <p className="text-xs font-semibold text-[#18392c]">
                      Expected Loan Completion
                    </p>


                    <p className="mt-2 text-lg font-bold text-[#315c46]">
                      {formatDisplayDate(
                        expectedEndDate
                      )}
                    </p>


                    <p className="mt-1 text-[10px] leading-4 text-[#6c8b72]">
                      Automatically calculated from the current
                      remaining balance, monthly EMI and payment
                      schedule.
                    </p>

                  </div>

                </div>


                {/* DETAILS */}

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">

                  <ScheduleInfo
                    label="Remaining Balance"
                    value={`₹${formatMoney(
                      remaining
                    )}`}
                  />


                  <ScheduleInfo
                    label="Payments Remaining"
                    value={
                      remainingPayments
                    }
                  />


                  <ScheduleInfo
                    label="Monthly EMI"
                    value={`₹${formatMoney(
                      emi
                    )}`}
                  />

                </div>


                {/* FINAL PAYMENT */}

                {finalPaymentAmount > 0 &&
                  finalPaymentAmount !==
                    emi && (

                  <div className="mt-4 rounded-lg border border-[#e1eadc] bg-white px-4 py-3">

                    <p className="text-[10px] text-slate-400">
                      Estimated Final Payment
                    </p>

                    <p className="mt-1 text-xs font-semibold text-[#18392c]">
                      ₹
                      {formatMoney(
                        finalPaymentAmount
                      )}
                    </p>

                  </div>

                )}


                <p className="mt-4 text-[10px] leading-4 text-slate-400">
                  This date will automatically change whenever
                  the remaining balance or EMI changes.
                </p>

              </div>

            )}


            {/* ==================================================
                COMPLETED
            ================================================== */}

            {original > 0 &&
              remaining === 0 && (

              <div className="mt-4 rounded-xl border border-[#bcd7ae] bg-[#f2f9ee] p-4">

                <p className="text-xs font-semibold text-[#315c46]">
                  Liability Completed
                </p>


                <p className="mt-1 text-[10px] leading-4 text-[#6c8b72]">
                  There is no remaining balance. FinanceOS will
                  save this liability as Completed and it will
                  not create future EMI commitments or payment
                  reminders.
                </p>

              </div>

            )}

          </div>


          {/* ==================================================
              PAYMENT REMINDER
          ================================================== */}

          {remaining > 0 && (

            <div className="mt-7 border-t border-[#edf0e9] pt-6">

              <ReminderHeader
                title="Payment Reminder"
                description="Remind me before the EMI or payment is due."
                enabled={
                  reminderEnabled
                }
                setEnabled={
                  setReminderEnabled
                }
              />


              {reminderEnabled && (

                <div className="mt-4 rounded-xl border border-[#e2e8dc] bg-[#fafcf8] p-4">


                  {/* ==========================================
                      REMINDER TIME
                  ========================================== */}

                  <FieldLabel>
                    Notify Me
                  </FieldLabel>


                  <div className="space-y-2">

                    <CheckOption
                      label="5 days before"
                      checked={
                        fiveDaysBefore
                      }
                      onChange={
                        setFiveDaysBefore
                      }
                    />


                    <CheckOption
                      label="1 day before"
                      checked={
                        oneDayBefore
                      }
                      onChange={
                        setOneDayBefore
                      }
                    />


                    <CheckOption
                      label="On due date"
                      checked={
                        onDueDate
                      }
                      onChange={
                        setOnDueDate
                      }
                    />

                  </div>


                  {/* ==========================================
                      REMINDER CHANNELS
                  ========================================== */}

                  <div className="mt-5">

                    <FieldLabel>
                      Send Reminder Through
                    </FieldLabel>


                    <div className="flex flex-wrap gap-4">


                      {/* IN-APP */}

                      <CheckOption
                        label="In-App"
                        checked={
                          inAppReminder
                        }
                        onChange={
                          setInAppReminder
                        }
                      />


                      {/* EMAIL */}

                      <CheckOption
                        label="Email"
                        checked={
                          emailReminder
                        }
                        onChange={
                          setEmailReminder
                        }
                      />


                      {/* SMS */}

                      <CheckOption
                        label="SMS"
                        checked={
                          smsReminder
                        }
                        onChange={
                          setSmsReminder
                        }
                      />

                    </div>


                    <p className="mt-3 text-[10px] leading-4 text-slate-400">
                      In-App reminders appear in your FinanceOS
                      notification bell. Email and SMS reminders
                      use your registered contact information.
                    </p>

                  </div>

                </div>

              )}

            </div>

          )}


          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (

            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">

              <p className="text-xs leading-5 text-red-600">
                {error}
              </p>

            </div>

          )}


          {/* ==================================================
              BUTTONS
          ================================================== */}

          <div className="mt-7 flex justify-end gap-3 border-t border-[#edf0e9] pt-5">

            <button
              type="button"
              onClick={
                onClose
              }
              className="rounded-xl border border-[#dfe6da] px-5 py-2.5 text-xs font-semibold text-[#52665b] transition hover:bg-[#f4f7f1]"
            >
              Cancel
            </button>


            <button
              type="submit"
              className="rounded-xl bg-[#18392c] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#244c3b]"
            >
              Add Liability
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}


// ============================================================
// SECTION HEADING
// ============================================================

function SectionHeading({
  title,
  description,
}) {
  return (

    <div>

      <h3 className="text-sm font-semibold text-[#18392c]">
        {title}
      </h3>


      <p className="mt-1 text-[10px] leading-4 text-slate-400">
        {description}
      </p>

    </div>
  );
}


// ============================================================
// FIELD LABEL
// ============================================================

function FieldLabel({
  children,
}) {
  return (

    <label className="mb-2 block text-xs font-semibold text-[#52665b]">
      {children}
    </label>
  );
}


// ============================================================
// MONEY INPUT
// ============================================================

function MoneyInput({
  value,
  onChange,
  placeholder,
}) {
  return (

    <div className="relative">

      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
        ₹
      </span>


      <input
        type="number"
        min="0"
        step="1"
        value={
          value
        }
        onChange={
          (event) =>
            onChange(
              event.target.value
            )
        }
        onWheel={
          (event) =>
            event.currentTarget.blur()
        }
        placeholder={
          placeholder
        }
        className={`${inputClass} pl-9`}
      />

    </div>
  );
}


// ============================================================
// SCHEDULE INFO
// ============================================================

function ScheduleInfo({
  label,
  value,
}) {
  return (

    <div className="rounded-lg border border-[#e1eadc] bg-white px-4 py-3">

      <p className="text-[10px] text-slate-400">
        {label}
      </p>


      <p className="mt-1 text-sm font-semibold text-[#18392c]">
        {value}
      </p>

    </div>
  );
}


// ============================================================
// REMINDER HEADER
// ============================================================

function ReminderHeader({
  title,
  description,
  enabled,
  setEnabled,
}) {
  return (

    <div className="flex items-start justify-between gap-5">

      <div>

        <div className="flex items-center gap-2">

          <FiBell className="text-[#315c46]" />


          <h3 className="text-sm font-semibold text-[#18392c]">
            {title}
          </h3>

        </div>


        <p className="mt-1 text-[10px] leading-4 text-slate-400">
          {description}
        </p>

      </div>


      <button
        type="button"
        onClick={
          () =>
            setEnabled(
              !enabled
            )
        }
        aria-label={
          enabled
            ? `Disable ${title}`
            : `Enable ${title}`
        }
        className={
          enabled
            ? "relative h-6 w-11 shrink-0 rounded-full bg-[#315c46] transition"
            : "relative h-6 w-11 shrink-0 rounded-full bg-slate-200 transition"
        }
      >

        <span
          className={
            enabled
              ? "absolute right-1 top-1 h-4 w-4 rounded-full bg-white transition"
              : "absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition"
          }
        />

      </button>

    </div>
  );
}


// ============================================================
// CHECK OPTION
// ============================================================

function CheckOption({
  label,
  checked,
  onChange,
}) {
  return (

    <label className="flex cursor-pointer items-center gap-2 text-xs text-[#52665b]">

      <input
        type="checkbox"
        checked={
          checked
        }
        onChange={
          (event) =>
            onChange(
              event.target.checked
            )
        }
        className="h-4 w-4 accent-[#315c46]"
      />

      {label}

    </label>
  );
}


// ============================================================
// EXPORT
// ============================================================

export default LiabilityForm;