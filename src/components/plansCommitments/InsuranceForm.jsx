// ============================================================
// FINANCEOS - INSURANCE FORM
// ============================================================
//
// Supports:
//
// - Life Insurance
// - Health Insurance
// - Vehicle Insurance
// - Term Insurance
// - Other Insurance
//
// REMINDERS:
//
// 1. Premium Payment Reminder
//    - 5 days before
//    - 1 day before
//    - On due date
//
// 2. Maturity / Expiry Reminder
//    - 2 months before
//    - 1 month before
//    - On maturity / expiry date
//
// CHANNELS:
//
// - In-App
// - Email
// - SMS
//
// ============================================================

import {
  useMemo,
  useState,
} from "react";

import {
  FiShield,
  FiX,
  FiCalendar,
  FiBell,
} from "react-icons/fi";

import useFinance
  from "../../context/useFinance.js";


// ============================================================
// INPUT STYLE
// ============================================================

const inputClass =
  "mt-2 w-full rounded-xl border border-[#dfe6da] bg-[#fafcf8] px-4 py-3 text-sm text-[#18392c] outline-none transition placeholder:text-slate-300 focus:border-[#9fbd8d]";


// ============================================================
// MONEY FORMAT
// ============================================================

function formatMoney(amount) {
  return Number(
    amount || 0
  ).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  );
}


// ============================================================
// DATE FORMAT FOR INPUT
// ============================================================

function formatDateInput(date) {

  if (
    !(date instanceof Date) ||
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "";
  }

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;
}


// ============================================================
// CALCULATE MONTHLY PREMIUM
// ============================================================

function calculateMonthlyPremium(
  premiumAmount,
  frequency
) {

  const amount =
    Number(
      premiumAmount || 0
    );

  switch (frequency) {

    case "Monthly":
      return amount;

    case "Quarterly":
      return amount / 3;

    case "Half Yearly":
      return amount / 6;

    case "Yearly":
      return amount / 12;

    default:
      return 0;
  }
}


// ============================================================
// ADD MONTHS TO DATE
// ============================================================

function addMonths(
  date,
  months
) {

  const result =
    new Date(date);

  result.setMonth(
    result.getMonth() +
      months
  );

  return result;
}


// ============================================================
// CALCULATE NEXT PREMIUM DATE
// ============================================================

function calculateNextPremiumDate(
  startDate,
  frequency
) {

  if (!startDate) {
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

  const start =
    new Date(
      year,
      month - 1,
      day
    );

  let monthsToAdd;

  switch (frequency) {

    case "Monthly":
      monthsToAdd = 1;
      break;

    case "Quarterly":
      monthsToAdd = 3;
      break;

    case "Half Yearly":
      monthsToAdd = 6;
      break;

    case "Yearly":
      monthsToAdd = 12;
      break;

    default:
      monthsToAdd = 1;
  }

  const nextDate =
    addMonths(
      start,
      monthsToAdd
    );

  return formatDateInput(
    nextDate
  );
}


// ============================================================
// INSURANCE FORM
// ============================================================

function InsuranceForm({
  onClose,
  onSuccess,
}) {


  // ==========================================================
  // CONTEXT
  // ==========================================================

  const {
    addInsurancePolicy,
    availableToAllocate,
  } = useFinance();


  // ==========================================================
  // TODAY
  // ==========================================================

  const today =
    formatDateInput(
      new Date()
    );


  // ==========================================================
  // POLICY DETAILS
  // ==========================================================

  const [
    policyType,
    setPolicyType,
  ] = useState(
    "Life Insurance"
  );

  const [
    policyName,
    setPolicyName,
  ] = useState("");

  const [
    policyNumber,
    setPolicyNumber,
  ] = useState("");


  // ==========================================================
  // PREMIUM
  // ==========================================================

  const [
    premiumAmount,
    setPremiumAmount,
  ] = useState("");

  const [
    premiumFrequency,
    setPremiumFrequency,
  ] = useState(
    "Monthly"
  );


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
    maturityDate,
    setMaturityDate,
  ] = useState("");


  // ==========================================================
  // PREMIUM PAYMENT REMINDER
  // ==========================================================

  const [
    paymentReminderEnabled,
    setPaymentReminderEnabled,
  ] = useState(false);

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
  // PREMIUM REMINDER CHANNELS
  // ==========================================================

  const [
    premiumInApp,
    setPremiumInApp,
  ] = useState(true);

  const [
    premiumEmail,
    setPremiumEmail,
  ] = useState(true);

  const [
    premiumSms,
    setPremiumSms,
  ] = useState(false);


  // ==========================================================
  // MATURITY REMINDER
  // ==========================================================

  const [
    maturityReminderEnabled,
    setMaturityReminderEnabled,
  ] = useState(false);

  const [
    twoMonthsBefore,
    setTwoMonthsBefore,
  ] = useState(true);

  const [
    oneMonthBefore,
    setOneMonthBefore,
  ] = useState(true);

  const [
    onMaturityDate,
    setOnMaturityDate,
  ] = useState(true);


  // ==========================================================
  // MATURITY REMINDER CHANNELS
  // ==========================================================

  const [
    maturityInApp,
    setMaturityInApp,
  ] = useState(true);

  const [
    maturityEmail,
    setMaturityEmail,
  ] = useState(true);

  const [
    maturitySms,
    setMaturitySms,
  ] = useState(false);


  // ==========================================================
  // ERROR
  // ==========================================================

  const [
    error,
    setError,
  ] = useState("");


  // ==========================================================
  // CALCULATED MONTHLY PREMIUM
  // ==========================================================

  const monthlyPremium =
    useMemo(
      () =>
        calculateMonthlyPremium(
          premiumAmount,
          premiumFrequency
        ),
      [
        premiumAmount,
        premiumFrequency,
      ]
    );


  // ==========================================================
  // NEXT PREMIUM DATE
  // ==========================================================

  const nextPremiumDate =
    useMemo(
      () =>
        calculateNextPremiumDate(
          startDate,
          premiumFrequency
        ),
      [
        startDate,
        premiumFrequency,
      ]
    );


  // ==========================================================
  // AFFORDABILITY
  // ==========================================================

  const isAffordable =
    monthlyPremium <=
    Number(
      availableToAllocate || 0
    );


  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = (
    event
  ) => {

    event.preventDefault();

    setError("");


    // ========================================================
    // POLICY NAME
    // ========================================================

    if (
      !policyName.trim()
    ) {

      setError(
        "Enter the insurance policy name."
      );

      return;
    }


    // ========================================================
    // PREMIUM
    // ========================================================

    const premium =
      Number(
        premiumAmount
      );

    if (
      !Number.isFinite(
        premium
      ) ||
      premium <= 0
    ) {

      setError(
        "Enter a valid premium amount."
      );

      return;
    }


    // ========================================================
    // START DATE
    // ========================================================

    if (!startDate) {

      setError(
        "Select the policy start date."
      );

      return;
    }


    // ========================================================
    // MATURITY DATE
    // ========================================================

    if (
      maturityDate &&
      maturityDate <
        startDate
    ) {

      setError(
        "Maturity / expiry date cannot be before the policy start date."
      );

      return;
    }


    // ========================================================
    // AFFORDABILITY
    // ========================================================

    if (!isAffordable) {

      setError(
        `This policy adds approximately ₹${formatMoney(
          monthlyPremium
        )} per month to your commitments, but only ₹${formatMoney(
          availableToAllocate
        )} is currently available to allocate.`
      );

      return;
    }


    // ========================================================
    // PREMIUM REMINDER TIME VALIDATION
    // ========================================================

    if (
      paymentReminderEnabled &&
      !fiveDaysBefore &&
      !oneDayBefore &&
      !onDueDate
    ) {

      setError(
        "Select at least one premium reminder time."
      );

      return;
    }


    // ========================================================
    // PREMIUM REMINDER CHANNEL VALIDATION
    // ========================================================

    if (
      paymentReminderEnabled &&
      !premiumInApp &&
      !premiumEmail &&
      !premiumSms
    ) {

      setError(
        "Select at least one premium reminder channel."
      );

      return;
    }


    // ========================================================
    // MATURITY REMINDER DATE
    // ========================================================

    if (
      maturityReminderEnabled &&
      !maturityDate
    ) {

      setError(
        "Select a maturity / expiry date before enabling the maturity reminder."
      );

      return;
    }


    // ========================================================
    // MATURITY REMINDER TIME
    // ========================================================

    if (
      maturityReminderEnabled &&
      !twoMonthsBefore &&
      !oneMonthBefore &&
      !onMaturityDate
    ) {

      setError(
        "Select at least one maturity reminder time."
      );

      return;
    }


    // ========================================================
    // MATURITY REMINDER CHANNEL
    // ========================================================

    if (
      maturityReminderEnabled &&
      !maturityInApp &&
      !maturityEmail &&
      !maturitySms
    ) {

      setError(
        "Select at least one maturity reminder channel."
      );

      return;
    }


    // ========================================================
    // PREMIUM NOTIFY BEFORE
    //
    // Stored as DAYS:
    //
    // 5 = five days before
    // 1 = one day before
    // 0 = due date
    // ========================================================

    const premiumNotifyBefore =
      [];

    if (
      fiveDaysBefore
    ) {
      premiumNotifyBefore.push(
        5
      );
    }

    if (
      oneDayBefore
    ) {
      premiumNotifyBefore.push(
        1
      );
    }

    if (
      onDueDate
    ) {
      premiumNotifyBefore.push(
        0
      );
    }


    // ========================================================
    // MATURITY NOTIFY BEFORE
    //
    // Stored as MONTHS:
    //
    // 2 = two months before
    // 1 = one month before
    //
    // Actual maturity date is stored separately as:
    //
    // onMaturityDate: true
    // ========================================================

    const maturityNotifyBeforeMonths =
      [];

    if (
      twoMonthsBefore
    ) {
      maturityNotifyBeforeMonths.push(
        2
      );
    }

    if (
      oneMonthBefore
    ) {
      maturityNotifyBeforeMonths.push(
        1
      );
    }


    // ========================================================
    // CREATE POLICY
    // ========================================================

    const newPolicy =
      addInsurancePolicy({


        // ----------------------------------------------------
        // BASIC DETAILS
        // ----------------------------------------------------

        name:
          policyName.trim(),

        type:
          policyType,

        policyNumber:
          policyNumber.trim(),


        // ----------------------------------------------------
        // PREMIUM
        // ----------------------------------------------------

        premiumAmount:
          premium,

        premiumFrequency,

        monthlyPremium,


        // ----------------------------------------------------
        // DATES
        // ----------------------------------------------------

        startDate,

        nextPremiumDate,

        maturityDate:
          maturityDate ||
          null,


        // ----------------------------------------------------
        // STATUS
        // ----------------------------------------------------

        status:
          "Active",


        // ----------------------------------------------------
        // PREMIUM PAYMENT REMINDER
        // ----------------------------------------------------

        paymentReminder: {

          enabled:
            paymentReminderEnabled,

          notifyBefore:
            paymentReminderEnabled
              ? premiumNotifyBefore
              : [],

          channels: {

            inApp:
              paymentReminderEnabled
                ? premiumInApp
                : false,

            email:
              paymentReminderEnabled
                ? premiumEmail
                : false,

            sms:
              paymentReminderEnabled
                ? premiumSms
                : false,

          },

        },


        // ----------------------------------------------------
        // MATURITY / EXPIRY REMINDER
        // ----------------------------------------------------

        maturityReminder: {

          enabled:
            maturityReminderEnabled,

          notifyBeforeMonths:
            maturityReminderEnabled
              ? maturityNotifyBeforeMonths
              : [],

          onMaturityDate:
            maturityReminderEnabled
              ? onMaturityDate
              : false,

          channels: {

            inApp:
              maturityReminderEnabled
                ? maturityInApp
                : false,

            email:
              maturityReminderEnabled
                ? maturityEmail
                : false,

            sms:
              maturityReminderEnabled
                ? maturitySms
                : false,

          },

        },

      });


    // ========================================================
    // SUCCESS
    // ========================================================

    if (onSuccess) {

      onSuccess(
        newPolicy
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

              <FiShield />

              <p className="text-[10px] font-semibold uppercase tracking-[0.15em]">
                Insurance
              </p>

            </div>


            <h2 className="mt-2 text-xl font-bold text-[#18392c]">
              Add Insurance Policy
            </h2>


            <p className="mt-1 text-xs leading-5 text-slate-400">
              Add your policy, premium schedule, important dates
              and reminders.
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
              POLICY DETAILS
          ================================================== */}

          <SectionHeading
            title="Policy Details"
            description="Enter the insurance policy you currently have or want FinanceOS to track."
          />


          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">


            {/* POLICY TYPE */}

            <div>

              <FieldLabel>
                Insurance Type
              </FieldLabel>


              <select
                value={
                  policyType
                }
                onChange={
                  (event) =>
                    setPolicyType(
                      event.target.value
                    )
                }
                className={
                  inputClass
                }
              >

                <option value="Life Insurance">
                  Life Insurance
                </option>

                <option value="Health Insurance">
                  Health Insurance
                </option>

                <option value="Term Insurance">
                  Term Insurance
                </option>

                <option value="Vehicle Insurance">
                  Vehicle Insurance
                </option>

                <option value="Other Insurance">
                  Other Insurance
                </option>

              </select>

            </div>


            {/* POLICY NAME */}

            <div>

              <FieldLabel>
                Policy Name
              </FieldLabel>


              <input
                type="text"
                value={
                  policyName
                }
                onChange={
                  (event) =>
                    setPolicyName(
                      event.target.value
                    )
                }
                placeholder="Example: LIC Jeevan Anand"
                className={
                  inputClass
                }
              />

            </div>

          </div>


          {/* POLICY NUMBER */}

          <div className="mt-4">

            <FieldLabel>
              Policy Number
            </FieldLabel>


            <input
              type="text"
              value={
                policyNumber
              }
              onChange={
                (event) =>
                  setPolicyNumber(
                    event.target.value
                  )
              }
              placeholder="Enter policy number"
              className={
                inputClass
              }
            />


            <p className="mt-1 text-[10px] text-slate-400">
              Optional for now.
            </p>

          </div>


          {/* ==================================================
              PREMIUM DETAILS
          ================================================== */}

          <div className="mt-7 border-t border-[#edf0e9] pt-6">

            <SectionHeading
              title="Premium Details"
              description="Enter the premium amount and how frequently you pay it."
            />


            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">


              {/* PREMIUM */}

              <div>

                <FieldLabel>
                  Premium Amount
                </FieldLabel>


                <MoneyInput
                  value={
                    premiumAmount
                  }
                  onChange={
                    setPremiumAmount
                  }
                  placeholder="12000"
                />

              </div>


              {/* FREQUENCY */}

              <div>

                <FieldLabel>
                  Premium Frequency
                </FieldLabel>


                <select
                  value={
                    premiumFrequency
                  }
                  onChange={
                    (event) =>
                      setPremiumFrequency(
                        event.target.value
                      )
                  }
                  className={
                    inputClass
                  }
                >

                  <option value="Monthly">
                    Monthly
                  </option>

                  <option value="Quarterly">
                    Quarterly
                  </option>

                  <option value="Half Yearly">
                    Half Yearly
                  </option>

                  <option value="Yearly">
                    Yearly
                  </option>

                </select>

              </div>

            </div>


            {/* ==================================================
                MONTHLY EQUIVALENT
            ================================================== */}

            <div
              className={
                isAffordable
                  ? "mt-4 rounded-xl border border-[#d7ead0] bg-[#f4faef] p-4"
                  : "mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"
              }
            >

              <div className="flex items-center justify-between gap-4">

                <div>

                  <p className="text-[10px] text-slate-400">
                    Monthly Premium Equivalent
                  </p>


                  <p className="mt-1 text-lg font-bold text-[#18392c]">
                    ₹
                    {formatMoney(
                      monthlyPremium
                    )}
                  </p>

                </div>


                <div className="text-right">

                  <p className="text-[10px] text-slate-400">
                    Available to Allocate
                  </p>


                  <p className="mt-1 text-sm font-semibold text-[#315c46]">
                    ₹
                    {formatMoney(
                      availableToAllocate
                    )}
                  </p>

                </div>

              </div>


              {!isAffordable &&
                Number(
                  premiumAmount || 0
                ) > 0 && (

                <p className="mt-3 text-[10px] leading-4 text-amber-700">
                  This policy premium is above your currently
                  available monthly allocation.
                </p>

              )}

            </div>

          </div>


          {/* ==================================================
              POLICY SCHEDULE
          ================================================== */}

          <div className="mt-7 border-t border-[#edf0e9] pt-6">

            <SectionHeading
              title="Policy Schedule"
              description="These dates can later appear in your Financial Calendar."
            />


            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">


              {/* START DATE */}

              <div>

                <FieldLabel>
                  Policy Start Date
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


              {/* MATURITY DATE */}

              <div>

                <FieldLabel>
                  Maturity / Expiry Date
                </FieldLabel>


                <input
                  type="date"
                  min={
                    startDate
                  }
                  value={
                    maturityDate
                  }
                  onChange={
                    (event) =>
                      setMaturityDate(
                        event.target.value
                      )
                  }
                  className={
                    inputClass
                  }
                />


                <p className="mt-1 text-[10px] text-slate-400">
                  Optional if the policy has no fixed end date.
                </p>

              </div>

            </div>


            {/* NEXT PREMIUM */}

            {nextPremiumDate && (

              <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#e2e8dc] bg-[#fafcf8] p-4">

                <FiCalendar className="mt-0.5 shrink-0 text-[#315c46]" />


                <div>

                  <p className="text-xs font-semibold text-[#18392c]">
                    Next Premium Date
                  </p>


                  <p className="mt-1 text-xs text-slate-500">
                    {nextPremiumDate}
                  </p>


                  <p className="mt-1 text-[10px] leading-4 text-slate-400">
                    FinanceOS calculates this from the policy
                    start date and premium frequency.
                  </p>

                </div>

              </div>

            )}

          </div>


          {/* ==================================================
              PREMIUM PAYMENT REMINDER
          ================================================== */}

          <div className="mt-7 border-t border-[#edf0e9] pt-6">

            <ReminderHeader
              title="Premium Payment Reminder"
              description="Remind me before the next insurance premium is due."
              enabled={
                paymentReminderEnabled
              }
              setEnabled={
                setPaymentReminderEnabled
              }
            />


            {paymentReminderEnabled && (

              <div className="mt-4 rounded-xl border border-[#e2e8dc] bg-[#fafcf8] p-4">


                {/* REMINDER TIME */}

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


                {/* CHANNELS */}

                <div className="mt-5">

                  <FieldLabel>
                    Send Reminder Through
                  </FieldLabel>


                  <div className="flex flex-wrap gap-4">

                    <CheckOption
                      label="In-App"
                      checked={
                        premiumInApp
                      }
                      onChange={
                        setPremiumInApp
                      }
                    />


                    <CheckOption
                      label="Email"
                      checked={
                        premiumEmail
                      }
                      onChange={
                        setPremiumEmail
                      }
                    />


                    <CheckOption
                      label="SMS"
                      checked={
                        premiumSms
                      }
                      onChange={
                        setPremiumSms
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


          {/* ==================================================
              MATURITY / EXPIRY REMINDER
          ================================================== */}

          <div className="mt-7 border-t border-[#edf0e9] pt-6">

            <ReminderHeader
              title="Maturity / Expiry Reminder"
              description="Remind me before this insurance policy reaches its maturity or expiry date."
              enabled={
                maturityReminderEnabled
              }
              setEnabled={
                setMaturityReminderEnabled
              }
            />


            {maturityReminderEnabled && (

              <div className="mt-4 rounded-xl border border-[#e2e8dc] bg-[#fafcf8] p-4">


                {!maturityDate && (

                  <p className="mb-4 text-[10px] leading-4 text-amber-600">
                    Select a maturity / expiry date above to use
                    this reminder.
                  </p>

                )}


                {/* MATURITY TIMES */}

                <FieldLabel>
                  Notify Me
                </FieldLabel>


                <div className="space-y-2">

                  <CheckOption
                    label="2 months before"
                    checked={
                      twoMonthsBefore
                    }
                    onChange={
                      setTwoMonthsBefore
                    }
                  />


                  <CheckOption
                    label="1 month before"
                    checked={
                      oneMonthBefore
                    }
                    onChange={
                      setOneMonthBefore
                    }
                  />


                  <CheckOption
                    label="On maturity / expiry date"
                    checked={
                      onMaturityDate
                    }
                    onChange={
                      setOnMaturityDate
                    }
                  />

                </div>


                {/* MATURITY CHANNELS */}

                <div className="mt-5">

                  <FieldLabel>
                    Send Reminder Through
                  </FieldLabel>


                  <div className="flex flex-wrap gap-4">

                    <CheckOption
                      label="In-App"
                      checked={
                        maturityInApp
                      }
                      onChange={
                        setMaturityInApp
                      }
                    />


                    <CheckOption
                      label="Email"
                      checked={
                        maturityEmail
                      }
                      onChange={
                        setMaturityEmail
                      }
                    />


                    <CheckOption
                      label="SMS"
                      checked={
                        maturitySms
                      }
                      onChange={
                        setMaturitySms
                      }
                    />

                  </div>


                  <p className="mt-3 text-[10px] leading-4 text-slate-400">
                    These channels apply only to the policy
                    maturity or expiry reminder.
                  </p>

                </div>

              </div>

            )}

          </div>


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
              Add Insurance
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

export default InsuranceForm;