// ============================================================
// FINANCEOS - INVESTMENT FORM
// ============================================================

import {
  useMemo,
  useState,
} from "react";

import {
  FiX,
  FiTrendingUp,
  FiCalendar,
  FiBell,
  FiDollarSign,
} from "react-icons/fi";

import useFinance from "../../context/useFinance.js";


// ============================================================
// INPUT STYLE
// ============================================================

const inputClass =
  "mt-2 w-full rounded-xl border border-[#dfe6da] bg-[#fafcf8] px-4 py-3 text-sm text-[#18392c] outline-none transition placeholder:text-slate-300 focus:border-[#9fbd8d] focus:ring-2 focus:ring-[#9fbd8d]/10";


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
// FORMAT MONEY
// ============================================================

function formatMoney(amount) {
  return safeNumber(amount).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  );
}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDateInput(date) {
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
// CALCULATE YEARS
// ============================================================

function calculateYears(
  startDate,
  maturityDate
) {

  if (
    !startDate ||
    !maturityDate
  ) {
    return 0;
  }


  const start =
    new Date(
      `${startDate}T00:00:00`
    );


  const maturity =
    new Date(
      `${maturityDate}T00:00:00`
    );


  if (
    Number.isNaN(
      start.getTime()
    ) ||
    Number.isNaN(
      maturity.getTime()
    ) ||
    maturity <= start
  ) {
    return 0;
  }


  const milliseconds =
    maturity.getTime() -
    start.getTime();


  const days =
    milliseconds /
    (
      1000 *
      60 *
      60 *
      24
    );


  return days / 365.2425;
}


// ============================================================
// COMPOUNDING PERIODS
// ============================================================

function getCompoundingPeriods(
  frequency
) {

  switch (frequency) {

    case "Monthly":
      return 12;

    case "Quarterly":
      return 4;

    case "Half Yearly":
      return 2;

    case "Yearly":
      return 1;

    default:
      return 4;
  }
}


// ============================================================
// PAYOUTS PER YEAR
// ============================================================

function getPayoutsPerYear(
  frequency
) {

  switch (frequency) {

    case "Monthly":
      return 12;

    case "Quarterly":
      return 4;

    case "Half Yearly":
      return 2;

    case "Yearly":
      return 1;

    default:
      return 1;
  }
}


// ============================================================
// CALCULATE FD DETAILS
// ============================================================

function calculateFDDetails({
  principal,
  interestRate,
  interestMethod,
  payoutFrequency,
  compoundingFrequency,
  startDate,
  maturityDate,
}) {

  const principalAmount =
    safeNumber(
      principal
    );


  const rate =
    safeNumber(
      interestRate
    );


  const years =
    calculateYears(
      startDate,
      maturityDate
    );


  if (
    principalAmount <= 0 ||
    rate <= 0 ||
    years <= 0
  ) {

    return {

      durationYears: 0,

      estimatedInterest: 0,

      estimatedMaturityAmount:
        principalAmount,

      estimatedInterestPerPayout: 0,

      estimatedAnnualInterest: 0,

    };
  }


  const annualRate =
    rate / 100;


  // ==========================================================
  // PAYOUT FD
  // ==========================================================

  if (
    interestMethod ===
    "Payout"
  ) {

    const estimatedAnnualInterest =
      principalAmount *
      annualRate;


    const payoutsPerYear =
      getPayoutsPerYear(
        payoutFrequency
      );


    const estimatedInterestPerPayout =
      estimatedAnnualInterest /
      payoutsPerYear;


    const estimatedInterest =
      estimatedAnnualInterest *
      years;


    return {

      durationYears:
        years,

      estimatedInterest,

      estimatedMaturityAmount:
        principalAmount,

      estimatedInterestPerPayout,

      estimatedAnnualInterest,

    };
  }


  // ==========================================================
  // CUMULATIVE FD
  // ==========================================================

  const periods =
    getCompoundingPeriods(
      compoundingFrequency
    );


  const maturityAmount =
    principalAmount *
    Math.pow(
      1 +
      annualRate /
      periods,

      periods *
      years
    );


  const estimatedInterest =
    maturityAmount -
    principalAmount;


  return {

    durationYears:
      years,

    estimatedInterest,

    estimatedMaturityAmount:
      maturityAmount,

    estimatedInterestPerPayout:
      0,

    estimatedAnnualInterest:
      principalAmount *
      annualRate,

  };
}


// ============================================================
// NEXT CONTRIBUTION DATE
// ============================================================

function calculateNextContributionDate(
  startDate,
  contributionDay
) {

  if (
    !startDate ||
    !contributionDay
  ) {
    return "";
  }


  const [
    year,
    month,
    day,
  ] =
    startDate
      .split("-")
      .map(Number);


  const selectedDay =
    Math.min(
      Math.max(
        Number(
          contributionDay
        ),
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


  let contributionDate =
    new Date(
      year,
      month - 1,
      selectedDay
    );


  if (
    contributionDate <
    start
  ) {

    contributionDate =
      new Date(
        year,
        month,
        selectedDay
      );
  }


  return formatDateInput(
    contributionDate
  );
}


// ============================================================
// MONTHLY EQUIVALENT
// ============================================================

function calculateMonthlyEquivalent(
  amount,
  frequency,
  contributionType
) {

  if (
    contributionType !==
    "Recurring"
  ) {
    return 0;
  }


  const value =
    safeNumber(
      amount
    );


  switch (frequency) {

    case "Monthly":
      return value;

    case "Quarterly":
      return value / 3;

    case "Half Yearly":
      return value / 6;

    case "Yearly":
      return value / 12;

    default:
      return 0;
  }
}


// ============================================================
// PREVENT NUMBER INPUT FROM CHANGING ON SCROLL
// ============================================================

function preventWheelChange(event) {
  event.currentTarget.blur();
}


// ============================================================
// INVESTMENT FORM
// ============================================================

function InvestmentForm({
  onClose,
  onSuccess,
}) {


  // ==========================================================
  // FINANCE CONTEXT
  // ==========================================================

  const finance =
    useFinance();


  const addInvestment =
    finance?.addInvestment;


  const availableToAllocate =
    safeNumber(
      finance?.availableToAllocate
    );


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
    investmentType,
    setInvestmentType,
  ] = useState("SIP");


  const [
    investmentName,
    setInvestmentName,
  ] = useState("");


  const [
    amount,
    setAmount,
  ] = useState("");


  const [
    contributionType,
    setContributionType,
  ] = useState(
    "Recurring"
  );

  // ==========================================================
  // PAYMENT SOURCE
  // ==========================================================

  const [
    paymentSource,
    setPaymentSource,
  ] = useState("");

  const [
    bankName,
    setBankName,
  ] = useState("");

  const [
    accountLast4,
    setAccountLast4,
  ] = useState("");

  const [
    upiId,
    setUpiId,
  ] = useState("");

  const [
    otherPaymentDetails,
    setOtherPaymentDetails,
  ] = useState("");


  // ==========================================================
  // INVESTMENT STATUS
  // ==========================================================

  const [
    investmentStatus,
    setInvestmentStatus,
  ] = useState("Active");


  const [
    frequency,
    setFrequency,
  ] = useState(
    "Monthly"
  );


  // ==========================================================
  // FD DETAILS
  // ==========================================================

  const [
    institution,
    setInstitution,
  ] = useState("");


  const [
    interestRate,
    setInterestRate,
  ] = useState("");


  const [
    interestMethod,
    setInterestMethod,
  ] = useState(
    "Payout"
  );


  const [
    interestPayoutFrequency,
    setInterestPayoutFrequency,
  ] = useState(
    "Quarterly"
  );


  const [
    compoundingFrequency,
    setCompoundingFrequency,
  ] = useState(
    "Quarterly"
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
    contributionDay,
    setContributionDay,
  ] = useState("5");


  const [
    maturityDate,
    setMaturityDate,
  ] = useState("");


  // ==========================================================
  // CONTRIBUTION REMINDER
  // ==========================================================

  const [
    reminderEnabled,
    setReminderEnabled,
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
  // CONTRIBUTION REMINDER CHANNELS
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
    sevenDaysBeforeMaturity,
    setSevenDaysBeforeMaturity,
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
  // IS FD
  // ==========================================================

  const isFixedDeposit =
    investmentType ===
    "Fixed Deposit";


  // ==========================================================
  // EFFECTIVE CONTRIBUTION TYPE
  // ==========================================================

  const effectiveContributionType =
    isFixedDeposit
      ? "One Time"
      : contributionType;


  // ==========================================================
  // EFFECTIVE REMINDER
  // ==========================================================

  const effectiveReminderEnabled =
    !isFixedDeposit &&
    effectiveContributionType ===
      "Recurring" &&
    reminderEnabled;


  // ==========================================================
  // AMOUNT
  // ==========================================================

  const amountNumber =
    safeNumber(
      amount
    );


  // ==========================================================
  // MONTHLY CONTRIBUTION
  // ==========================================================

  const monthlyContribution =
    useMemo(
      () => {

        if (
          isFixedDeposit ||
          effectiveContributionType !==
            "Recurring"
        ) {
          return 0;
        }


        return calculateMonthlyEquivalent(
          amountNumber,
          frequency,
          effectiveContributionType
        );

      },
      [
        amountNumber,
        frequency,
        effectiveContributionType,
        isFixedDeposit,
      ]
    );


  // ==========================================================
  // NEXT CONTRIBUTION DATE
  // ==========================================================

  const nextContributionDate =
    useMemo(
      () => {

        if (
          isFixedDeposit ||
          effectiveContributionType !==
            "Recurring"
        ) {
          return null;
        }


        return calculateNextContributionDate(
          startDate,
          contributionDay
        );

      },
      [
        startDate,
        contributionDay,
        effectiveContributionType,
        isFixedDeposit,
      ]
    );


  // ==========================================================
  // AFFORDABILITY
  // ==========================================================

  const isAffordable =
    isFixedDeposit ||
    effectiveContributionType !==
      "Recurring" ||
    monthlyContribution <=
      availableToAllocate;


  // ==========================================================
  // FD ESTIMATE
  // ==========================================================

  const fdDetails =
    useMemo(
      () =>
        calculateFDDetails({

          principal:
            amountNumber,

          interestRate,

          interestMethod,

          payoutFrequency:
            interestPayoutFrequency,

          compoundingFrequency,

          startDate,

          maturityDate,

        }),
      [
        amountNumber,
        interestRate,
        interestMethod,
        interestPayoutFrequency,
        compoundingFrequency,
        startDate,
        maturityDate,
      ]
    );


  // ==========================================================
  // TYPE CHANGE
  // ==========================================================

  function handleInvestmentTypeChange(
    event
  ) {

    const nextType =
      event.target.value;


    setInvestmentType(
      nextType
    );


    setError("");
  }


  // ==========================================================
  // SUBMIT
  // ==========================================================

  async function handleSubmit(
    event
  ) {

    event.preventDefault();


    setError("");


    // ========================================================
    // SERVICE CHECK
    // ========================================================

    if (
      typeof addInvestment !==
      "function"
    ) {

      setError(
        "Investment service is not available."
      );

      return;
    }


    // ========================================================
    // NAME
    // ========================================================

    if (
      !investmentName.trim()
    ) {

      setError(
        isFixedDeposit
          ? "Enter an FD name."
          : "Enter an investment name."
      );

      return;
    }


    // ========================================================
    // AMOUNT
    // ========================================================

    if (
      amountNumber <= 0
    ) {

      setError(
        isFixedDeposit
          ? "Enter a valid FD principal amount."
          : "Enter a valid investment amount."
      );

      return;
    }


    // ========================================================
    // START DATE
    // ========================================================

    if (
      !startDate
    ) {

      setError(
        "Select the investment start date."
      );

      return;
    }


    // ========================================================
    // PAYMENT SOURCE VALIDATION
    // ========================================================

    if (!paymentSource) {
      setError(
        "Select a payment source for this investment."
      );

      return;
    }

    if (
      paymentSource === "Bank Account" &&
      !bankName.trim()
    ) {
      setError("Enter the bank name.");
      return;
    }

    if (
      paymentSource === "Bank Account" &&
      accountLast4.length !== 4
    ) {
      setError(
        "Enter the last 4 digits of the bank account."
      );
      return;
    }

    if (
      paymentSource === "UPI" &&
      !upiId.trim()
    ) {
      setError("Enter the UPI ID.");
      return;
    }

    if (
      paymentSource === "Other" &&
      !otherPaymentDetails.trim()
    ) {
      setError(
        "Enter the payment source details."
      );
      return;
    }


    // ========================================================
    // FD VALIDATION
    // ========================================================

    if (
      isFixedDeposit
    ) {

      if (
        !institution.trim()
      ) {

        setError(
          "Enter the bank or institution where the FD is held."
        );

        return;
      }


      const numericRate =
        safeNumber(
          interestRate
        );


      if (
        numericRate <= 0 ||
        numericRate > 100
      ) {

        setError(
          "Enter a valid annual FD interest rate."
        );

        return;
      }


      if (
        !maturityDate
      ) {

        setError(
          "Select the FD maturity date."
        );

        return;
      }


      if (
        maturityDate <=
        startDate
      ) {

        setError(
          "FD maturity date must be after the start date."
        );

        return;
      }

    }


    // ========================================================
    // RECURRING INVESTMENT VALIDATION
    // ========================================================

    if (
      !isFixedDeposit &&
      effectiveContributionType ===
        "Recurring"
    ) {

      const day =
        Number(
          contributionDay
        );


      if (
        !Number.isInteger(
          day
        ) ||
        day < 1 ||
        day > 28
      ) {

        setError(
          "Contribution day must be between 1 and 28."
        );

        return;
      }


      if (
        monthlyContribution >
        availableToAllocate
      ) {

        setError(
          `This investment requires approximately ₹${formatMoney(
            monthlyContribution
          )} per month, but only ₹${formatMoney(
            availableToAllocate
          )} is currently available.`
        );

        return;
      }

    }


    // ========================================================
    // NORMAL MATURITY DATE
    // ========================================================

    if (
      !isFixedDeposit &&
      maturityDate &&
      maturityDate <
        startDate
    ) {

      setError(
        "Maturity date cannot be before the start date."
      );

      return;
    }


    // ========================================================
    // CONTRIBUTION REMINDER TIME
    // ========================================================

    if (
      effectiveReminderEnabled &&
      !fiveDaysBefore &&
      !oneDayBefore &&
      !onDueDate
    ) {

      setError(
        "Select at least one contribution reminder time."
      );

      return;
    }


    // ========================================================
    // CONTRIBUTION REMINDER CHANNEL
    // ========================================================

    if (
      effectiveReminderEnabled &&
      !inAppReminder &&
      !emailReminder &&
      !smsReminder
    ) {

      setError(
        "Select at least one contribution reminder channel."
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
        "Select a maturity date to enable the maturity reminder."
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
      !sevenDaysBeforeMaturity &&
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
    // CONTRIBUTION NOTIFICATION DAYS
    // ========================================================

    const notifyBefore = [];


    if (
      fiveDaysBefore
    ) {
      notifyBefore.push(
        5
      );
    }


    if (
      oneDayBefore
    ) {
      notifyBefore.push(
        1
      );
    }


    if (
      onDueDate
    ) {
      notifyBefore.push(
        0
      );
    }


    // ========================================================
    // MATURITY MONTHS
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
    // MATURITY DAYS
    // ========================================================

    const maturityNotifyBeforeDays =
      [];


    if (
      sevenDaysBeforeMaturity
    ) {
      maturityNotifyBeforeDays.push(
        7
      );
    }


    // ========================================================
    // INVESTMENT DATA
    // ========================================================

    const investmentData = {

      // ------------------------------------------------------
      // BASIC
      // ------------------------------------------------------

      name:
        investmentName.trim(),

      type:
        investmentType,

      amount:
        amountNumber,


      // ------------------------------------------------------
      // CONTRIBUTION
      // ------------------------------------------------------

      contributionType:
        effectiveContributionType,

      frequency:
        effectiveContributionType ===
          "Recurring"
          ? frequency
          : null,

      monthlyContribution:
        isFixedDeposit
          ? 0
          : monthlyContribution,

      // ------------------------------------------------------
      // PAYMENT SOURCE
      // ------------------------------------------------------

      paymentSource:
        paymentSource || undefined,

      paymentSourceDetails: {

        bankName:
          paymentSource === "Bank Account"
            ? bankName.trim()
            : "",

        accountLast4:
          paymentSource === "Bank Account"
            ? accountLast4
            : "",

        upiId:
          paymentSource === "UPI"
            ? upiId.trim()
            : "",

        otherDetails:
          paymentSource === "Other"
            ? otherPaymentDetails.trim()
            : "",

      },


      // ------------------------------------------------------
      // DATES
      // ------------------------------------------------------

      startDate,

      nextContributionDate:
        isFixedDeposit
          ? null
          : nextContributionDate,

      maturityDate:
        maturityDate ||
        null,


      // ------------------------------------------------------
      // STATUS
      // ------------------------------------------------------

      status:
        investmentStatus,


      // ------------------------------------------------------
      // FD DATA
      // ------------------------------------------------------

      ...(isFixedDeposit
        ? {

            institution:
              institution.trim(),

            principalAmount:
              amountNumber,

            interestRate:
              safeNumber(
                interestRate
              ),

            interestMethod,

            interestPayoutFrequency:
              interestMethod ===
                "Payout"
                ? interestPayoutFrequency
                : null,

            compoundingFrequency:
              interestMethod ===
                "Cumulative"
                ? compoundingFrequency
                : null,

            estimatedInterest:
              fdDetails
                .estimatedInterest,

            estimatedAnnualInterest:
              fdDetails
                .estimatedAnnualInterest,

            estimatedInterestPerPayout:
              fdDetails
                .estimatedInterestPerPayout,

            estimatedMaturityAmount:
              fdDetails
                .estimatedMaturityAmount,

            totalInterestReceived:
              0,

            interestTransactions:
              [],

            renewedFromId:
              null,

            renewedToId:
              null,

          }
        : {}),


      // ------------------------------------------------------
      // CONTRIBUTION REMINDER
      // ------------------------------------------------------

      reminder: {

        enabled:
          effectiveReminderEnabled,

        contributionDay:
          effectiveReminderEnabled
            ? Number(
                contributionDay
              )
            : null,

        notifyBefore:
          effectiveReminderEnabled
            ? notifyBefore
            : [],

        channels: {

          inApp:
            effectiveReminderEnabled &&
            inAppReminder,

          email:
            effectiveReminderEnabled &&
            emailReminder,

          sms:
            effectiveReminderEnabled &&
            smsReminder,

        },

      },


      // ------------------------------------------------------
      // MATURITY REMINDER
      // ------------------------------------------------------

      maturityReminder: {

        enabled:
          maturityReminderEnabled,

        notifyBeforeMonths:
          maturityReminderEnabled
            ? maturityNotifyBeforeMonths
            : [],

        notifyBeforeDays:
          maturityReminderEnabled
            ? maturityNotifyBeforeDays
            : [],

        onMaturityDate:
          maturityReminderEnabled
            ? onMaturityDate
            : false,

        channels: {

          inApp:
            maturityReminderEnabled &&
            maturityInApp,

          email:
            maturityReminderEnabled &&
            maturityEmail,

          sms:
            maturityReminderEnabled &&
            maturitySms,

        },

      },

    };


    // ========================================================
    // SAVE
    // ========================================================

    const result =
      await addInvestment(
        investmentData
      );


    // ========================================================
    // FAILURE
    // ========================================================

    if (
      result?.success ===
      false
    ) {

      setError(
        result.message ||
        "Unable to add the investment."
      );

      return;
    }


    // ========================================================
    // SUCCESS
    // ========================================================

    if (
      typeof onSuccess ===
      "function"
    ) {

      onSuccess(
        result
      );
    }


    // ========================================================
    // CLOSE
    // ========================================================

    if (
      typeof onClose ===
      "function"
    ) {

      onClose();
    }

  }


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4"

      onMouseDown={(event) => {

        if (
          event.target ===
            event.currentTarget &&
          typeof onClose ===
            "function"
        ) {

          onClose();

        }

      }}
    >


      {/* ======================================================
          MODAL
      ====================================================== */}

      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[#e2e8dc] bg-white shadow-2xl">


        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[#edf0e9] bg-white px-6 py-5">

          <div>

            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6c8b72]">
              FinanceOS
            </p>


            <h2 className="mt-1 text-lg font-bold text-[#18392c]">
              Add Investment
            </h2>


            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">
              Add investment details, contribution schedule,
              reminders and maturity information.
            </p>

          </div>


          <button
            type="button"
            onClick={
              onClose
            }
            aria-label="Close investment form"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-[#f4f7f1] hover:text-[#18392c]"
          >
            <FiX size={18} />
          </button>

        </div>


        {/* ====================================================
            FORM
        ==================================================== */}

        <form
          onSubmit={
            handleSubmit
          }
          className="flex-1 space-y-6 overflow-y-auto bg-[#fafcf8] p-6"
        >


          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (

            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3">

              <p className="text-xs font-medium text-red-600">
                {error}
              </p>

            </div>

          )}


          {/* ==================================================
              INVESTMENT DETAILS
          ================================================== */}

          <section className="rounded-2xl border border-[#e2e8dc] bg-white p-5">

            <div className="mb-5 flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf6e8] text-[#315c46]">
                <FiTrendingUp size={17} />
              </div>


              <div>

                <h3 className="text-sm font-semibold text-[#18392c]">
                  Investment Details
                </h3>


                <p className="mt-0.5 text-[11px] text-slate-400">
                  Enter the basic information for this investment.
                </p>

              </div>

            </div>


            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">


              {/* INVESTMENT TYPE */}

              <label className="block">

                <span className="text-xs font-medium text-[#52665b]">
                  Investment Type
                </span>


                <select
                  value={
                    investmentType
                  }
                  onChange={
                    handleInvestmentTypeChange
                  }
                  className={
                    inputClass
                  }
                >

                  <option value="SIP">
                    SIP
                  </option>

                  <option value="Mutual Fund">
                    Mutual Fund
                  </option>

                  <option value="Fixed Deposit">
                    Fixed Deposit (FD)
                  </option>

                  <option value="Recurring Deposit">
                    Recurring Deposit (RD)
                  </option>

                  <option value="Gold">
                    Gold
                  </option>

                  <option value="Stocks">
                    Stocks
                  </option>

                  <option value="Other">
                    Other
                  </option>

                </select>

              </label>


              {/* NAME */}

              <label className="block">

                <span className="text-xs font-medium text-[#52665b]">

                  {isFixedDeposit
                    ? "FD Name"
                    : "Investment Name"}

                </span>


                <input
                  type="text"
                  value={
                    investmentName
                  }

                  onChange={(event) => {

                    setInvestmentName(
                      event.target.value
                    );

                    setError("");

                  }}

                  placeholder={
                    isFixedDeposit
                      ? "Example: SBI 2 Year FD"
                      : "Example: Retirement SIP"
                  }

                  className={
                    inputClass
                  }
                />

              </label>


              {/* INVESTMENT STATUS */}

              <label className="block">

                <span className="text-xs font-medium text-[#52665b]">
                  Investment Status
                </span>

                <select
                  value={investmentStatus}
                  onChange={(event) => {
                    setInvestmentStatus(
                      event.target.value
                    );

                    setError("");
                  }}
                  className={inputClass}
                >

                  <option value="Active">
                    Active
                  </option>

                  <option value="Paused">
                    Paused
                  </option>

                  <option value="Completed">
                    Completed
                  </option>

                  <option value="Matured">
                    Matured
                  </option>

                  <option value="Closed">
                    Closed
                  </option>

                </select>

              </label>

            </div>


            {/* =================================================
                FD DETAILS
            ================================================= */}

            {isFixedDeposit && (

              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">


                {/* BANK */}

                <label className="block">

                  <span className="text-xs font-medium text-[#52665b]">
                    Bank / Institution
                  </span>


                  <input
                    type="text"
                    value={
                      institution
                    }

                    onChange={(event) => {

                      setInstitution(
                        event.target.value
                      );

                      setError("");

                    }}

                    placeholder="Example: SBI"
                    className={
                      inputClass
                    }
                  />

                </label>


                {/* PRINCIPAL */}

                <label className="block">

                  <span className="text-xs font-medium text-[#52665b]">
                    FD Principal Amount
                  </span>


                  <MoneyInput
                    value={
                      amount
                    }
                    onChange={
                      setAmount
                    }
                    placeholder="100000"
                  />

                </label>

              </div>

            )}


            {/* =================================================
                NORMAL INVESTMENT AMOUNT
            ================================================= */}

            {!isFixedDeposit && (

              <div className="mt-5">

                <label className="block">

                  <span className="text-xs font-medium text-[#52665b]">
                    Contribution Amount
                  </span>


                  <MoneyInput
                    value={
                      amount
                    }
                    onChange={
                      setAmount
                    }
                    placeholder="5000"
                  />

                </label>

              </div>

            )}

          </section>


          {/* ==================================================
              FD INTEREST
          ================================================== */}

          {isFixedDeposit && (

            <section className="rounded-2xl border border-[#dcebd4] bg-[#f7fbf4] p-5">

              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6c8b72]">
                Fixed Deposit
              </p>


              <h3 className="mt-1 text-sm font-semibold text-[#18392c]">
                Interest Details
              </h3>


              <p className="mt-1 text-[11px] leading-5 text-[#6c8b72]">
                Enter the FD interest terms provided by the bank.
              </p>


              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">


                {/* RATE */}

                <label className="block">

                  <span className="text-xs font-medium text-[#52665b]">
                    Annual Interest Rate (%)
                  </span>


                  <div className="relative">

                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={
                        interestRate
                      }

                      onChange={(event) => {

                        setInterestRate(
                          event.target.value
                        );

                        setError("");

                      }}

                      onWheel={
                        preventWheelChange
                      }

                      placeholder="7.25"

                      className={`${inputClass} pr-10`}
                    />


                    <span className="absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-sm text-slate-400">
                      %
                    </span>

                  </div>

                </label>


                {/* METHOD */}

                <label className="block">

                  <span className="text-xs font-medium text-[#52665b]">
                    Interest Method
                  </span>


                  <select
                    value={
                      interestMethod
                    }

                    onChange={(event) => {

                      setInterestMethod(
                        event.target.value
                      );

                      setError("");

                    }}

                    className={
                      inputClass
                    }
                  >

                    <option value="Payout">
                      Interest Payout
                    </option>

                    <option value="Cumulative">
                      Cumulative / At Maturity
                    </option>

                  </select>

                </label>


                {/* PAYOUT FREQUENCY */}

                {interestMethod ===
                  "Payout" && (

                  <label className="block md:col-span-2">

                    <span className="text-xs font-medium text-[#52665b]">
                      Interest Payout Frequency
                    </span>


                    <select
                      value={
                        interestPayoutFrequency
                      }

                      onChange={(event) =>
                        setInterestPayoutFrequency(
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


                    <p className="mt-2 text-[10px] leading-4 text-slate-400">
                      Interest credited by the bank will later
                      be recorded as additional income for the
                      month in which it is received.
                    </p>

                  </label>

                )}


                {/* COMPOUNDING */}

                {interestMethod ===
                  "Cumulative" && (

                  <label className="block md:col-span-2">

                    <span className="text-xs font-medium text-[#52665b]">
                      Compounding Frequency
                    </span>


                    <select
                      value={
                        compoundingFrequency
                      }

                      onChange={(event) =>
                        setCompoundingFrequency(
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

                  </label>

                )}

              </div>

            </section>

          )}


          {/* ==================================================
              CONTRIBUTION SETUP
          ================================================== */}

          {!isFixedDeposit && (

            <section className="rounded-2xl border border-[#e2e8dc] bg-white p-5">

              <h3 className="text-sm font-semibold text-[#18392c]">
                Contribution Setup
              </h3>


              <p className="mt-1 text-[11px] text-slate-400">
                Choose whether this investment is recurring or
                one-time.
              </p>


              <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">


                {/* CONTRIBUTION TYPE */}

                <label className="block">

                  <span className="text-xs font-medium text-[#52665b]">
                    Contribution Type
                  </span>


                  <select
                    value={
                      contributionType
                    }

                    onChange={(event) => {

                      setContributionType(
                        event.target.value
                      );

                      setError("");

                    }}

                    className={
                      inputClass
                    }
                  >

                    <option value="Recurring">
                      Recurring
                    </option>

                    <option value="One Time">
                      One Time
                    </option>

                  </select>

                </label>


                {/* FREQUENCY */}

                {effectiveContributionType ===
                  "Recurring" && (

                  <label className="block">

                    <span className="text-xs font-medium text-[#52665b]">
                      Contribution Frequency
                    </span>


                    <select
                      value={
                        frequency
                      }

                      onChange={(event) =>
                        setFrequency(
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

                  </label>

                )}

              </div>


              {/* MONTHLY COMMITMENT */}

              {effectiveContributionType ===
                "Recurring" && (

                <div
                  className={`mt-5 rounded-xl border p-4 ${
                    isAffordable
                      ? "border-[#dcebd4] bg-[#f7fbf4]"
                      : "border-red-100 bg-red-50"
                  }`}
                >

                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c8b72]">
                    Monthly Commitment
                  </p>


                  <p
                    className={`mt-1 text-lg font-bold ${
                      isAffordable
                        ? "text-[#315c46]"
                        : "text-red-600"
                    }`}
                  >
                    ₹
                    {formatMoney(
                      monthlyContribution
                    )}
                  </p>


                  <p className="mt-1 text-[10px] text-slate-400">
                    Available to allocate: ₹
                    {formatMoney(
                      availableToAllocate
                    )}
                  </p>


                  {!isAffordable && (

                    <p className="mt-2 text-[10px] font-medium text-red-600">
                      This recurring investment is currently above
                      your available monthly allocation.
                    </p>

                  )}

                </div>

              )}


              {/* ==================================================
                  PAYMENT SOURCE UI
              ================================================== */}

              <div className="mt-5 border-t border-[#edf0e9] pt-5">

                <h4 className="text-xs font-semibold uppercase tracking-wider text-[#6c8b72]">
                  Payment Source
                </h4>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Select the funding source used for this investment.
                </p>

                <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">

                  <label className="block md:col-span-2">

                    <span className="text-xs font-medium text-[#52665b]">
                      Funding Method
                    </span>

                    <select
                      value={paymentSource}
                      onChange={(event) => {
                        setPaymentSource(event.target.value);
                        setError("");
                      }}
                      className={inputClass}
                    >
                      <option value="">Select Payment Source</option>
                      <option value="Bank Account">Bank Account</option>
                      <option value="UPI">UPI</option>
                      <option value="Cash">Cash</option>
                      <option value="Other">Other</option>
                    </select>

                  </label>

                  {/* BANK ACCOUNT FIELDS */}

                  {paymentSource === "Bank Account" && (
                    <>
                      <label className="block">

                        <span className="text-xs font-medium text-[#52665b]">
                          Bank Name
                        </span>

                        <input
                          type="text"
                          value={bankName}
                          onChange={(e) => {
                            setBankName(e.target.value);
                            setError("");
                          }}
                          placeholder="Example: SBI"
                          className={inputClass}
                        />

                      </label>

                      <label className="block">

                        <span className="text-xs font-medium text-[#52665b]">
                          Last 4 Digits
                        </span>

                        <input
                          type="text"
                          maxLength={4}
                          value={accountLast4}
                          onChange={(e) => {
                            setAccountLast4(
                              e.target.value.replace(/\D/g, "").slice(0, 4)
                            );
                            setError("");
                          }}
                          placeholder="Example: 1234"
                          className={inputClass}
                        />

                      </label>
                    </>
                  )}

                  {/* UPI ID */}

                  {paymentSource === "UPI" && (

                    <label className="block md:col-span-2">

                      <span className="text-xs font-medium text-[#52665b]">
                        UPI ID
                      </span>

                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => {
                          setUpiId(e.target.value);
                          setError("");
                        }}
                        placeholder="Example: dip@upi"
                        className={inputClass}
                      />

                    </label>

                  )}

                  {/* OTHER */}

                  {paymentSource === "Other" && (

                    <label className="block md:col-span-2">

                      <span className="text-xs font-medium text-[#52665b]">
                        Payment Details
                      </span>

                      <input
                        type="text"
                        value={otherPaymentDetails}
                        onChange={(e) => {
                          setOtherPaymentDetails(e.target.value);
                          setError("");
                        }}
                        placeholder="Enter payment source details"
                        className={inputClass}
                      />

                    </label>

                  )}

                </div>

              </div>

            </section>

          )}


          {/* ==================================================
              SCHEDULE
          ================================================== */}

          <section className="rounded-2xl border border-[#e2e8dc] bg-white p-5">

            <div className="mb-5 flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f6ee] text-[#315c46]">
                <FiCalendar size={17} />
              </div>


              <div>

                <h3 className="text-sm font-semibold text-[#18392c]">
                  Schedule
                </h3>


                <p className="mt-0.5 text-[11px] text-slate-400">
                  Set the investment dates.
                </p>

              </div>

            </div>


            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">


              {/* START DATE */}

              <label className="block">

                <span className="text-xs font-medium text-[#52665b]">
                  Start Date
                </span>


                <input
                  type="date"
                  value={
                    startDate
                  }

                  onChange={(event) => {

                    setStartDate(
                      event.target.value
                    );

                    setError("");

                  }}

                  className={
                    inputClass
                  }
                />

              </label>


              {/* MATURITY DATE */}

              <label className="block">

                <span className="text-xs font-medium text-[#52665b]">

                  {isFixedDeposit
                    ? "FD Maturity Date"
                    : "Maturity Date"}

                </span>


                <input
                  type="date"
                  min={
                    startDate ||
                    undefined
                  }

                  value={
                    maturityDate
                  }

                  onChange={(event) => {

                    setMaturityDate(
                      event.target.value
                    );

                    setError("");

                  }}

                  className={
                    inputClass
                  }
                />

              </label>


              {/* CONTRIBUTION DAY */}

              {!isFixedDeposit &&
                effectiveContributionType ===
                  "Recurring" && (

                  <label className="block md:col-span-2">

                    <span className="text-xs font-medium text-[#52665b]">
                      Contribution Day
                    </span>


                    <input
                      type="number"
                      min="1"
                      max="28"
                      value={
                        contributionDay
                      }

                      onChange={(event) => {

                        setContributionDay(
                          event.target.value
                        );

                        setError("");

                      }}

                      onWheel={
                        preventWheelChange
                      }

                      className={
                        inputClass
                      }
                    />


                    <p className="mt-2 text-[10px] text-slate-400">
                      Use a day between 1 and 28 so it remains valid
                      in every month.
                    </p>

                  </label>

                )}

            </div>

          </section>


          {/* ==================================================
              FD ESTIMATE
          ================================================== */}

          {isFixedDeposit && (

            <section className="rounded-2xl border border-[#dcebd4] bg-white p-5">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf6e8] text-[#315c46]">
                  <FiDollarSign size={17} />
                </div>


                <div>

                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c8b72]">
                    FD Estimate
                  </p>


                  <h3 className="mt-0.5 text-sm font-semibold text-[#18392c]">
                    Expected Returns
                  </h3>

                </div>

              </div>


              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">

                <InfoBox
                  label="Principal"
                  value={`₹${formatMoney(
                    amountNumber
                  )}`}
                />


                <InfoBox
                  label="Rate"
                  value={`${safeNumber(
                    interestRate
                  )}% p.a.`}
                />


                <InfoBox
                  label="Estimated Interest"
                  value={`₹${formatMoney(
                    fdDetails
                      .estimatedInterest
                  )}`}
                />


                <InfoBox
                  label={
                    interestMethod ===
                    "Cumulative"
                      ? "Expected Maturity"
                      : "Principal at Maturity"
                  }

                  value={`₹${formatMoney(
                    fdDetails
                      .estimatedMaturityAmount
                  )}`}
                />

              </div>


              {/* PAYOUT INFO */}

              {interestMethod ===
                "Payout" && (

                <div className="mt-4 rounded-xl bg-[#f7fbf4] p-4">

                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c8b72]">
                    Estimated {interestPayoutFrequency} Interest
                  </p>


                  <p className="mt-1 text-lg font-bold text-[#315c46]">
                    ₹
                    {formatMoney(
                      fdDetails
                        .estimatedInterestPerPayout
                    )}
                  </p>


                  <p className="mt-1 text-[10px] leading-4 text-[#6c8b72]">
                    This is only an estimate. It is not added to
                    your monthly income until the interest is
                    actually credited.
                  </p>

                </div>

              )}


              {/* CUMULATIVE INFO */}

              {interestMethod ===
                "Cumulative" && (

                <div className="mt-4 rounded-xl bg-[#f7fbf4] p-4">

                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6c8b72]">
                    Cumulative FD
                  </p>


                  <p className="mt-1 text-xs leading-5 text-[#52665b]">
                    Interest remains invested inside the FD and is
                    included in the expected maturity amount.
                  </p>

                </div>

              )}


              <p className="mt-4 text-[10px] leading-5 text-slate-400">
                The calculation is an estimate. The bank's actual
                interest credit and maturity amount should be
                treated as the final values.
              </p>

            </section>

          )}


          {/* ==================================================
              CONTRIBUTION REMINDER
          ================================================== */}

          {!isFixedDeposit &&
            effectiveContributionType ===
              "Recurring" && (

              <section className="rounded-2xl border border-[#e2e8dc] bg-white p-5">

                <div className="flex items-center justify-between gap-4">

                  <div className="flex items-center gap-3">

                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f6ee] text-[#315c46]">
                      <FiBell size={17} />
                    </div>


                    <div>

                      <h3 className="text-sm font-semibold text-[#18392c]">
                        Contribution Reminder
                      </h3>


                      <p className="mt-0.5 text-[11px] text-slate-400">
                        Get reminded before the contribution date.
                      </p>

                    </div>

                  </div>


                  <Toggle
                    checked={
                      reminderEnabled
                    }
                    onChange={
                      setReminderEnabled
                    }
                  />

                </div>


                {reminderEnabled && (

                  <div className="mt-5 space-y-5">


                    {/* WHEN */}

                    <div>

                      <p className="text-xs font-medium text-[#52665b]">
                        Notify Me
                      </p>


                      <div className="mt-3 flex flex-wrap gap-4">

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

                    </div>


                    {/* CHANNEL */}

                    <div>

                      <p className="text-xs font-medium text-[#52665b]">
                        Notification Channel
                      </p>


                      <div className="mt-3 flex flex-wrap gap-4">

                        <CheckOption
                          label="In-App"
                          checked={
                            inAppReminder
                          }
                          onChange={
                            setInAppReminder
                          }
                        />


                        <CheckOption
                          label="Email"
                          checked={
                            emailReminder
                          }
                          onChange={
                            setEmailReminder
                          }
                        />


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
                        In-App reminders appear in the FinanceOS
                        notification bell. Email and SMS use the
                        user's registered contact information.
                      </p>

                    </div>

                  </div>

                )}

              </section>

            )}


          {/* ==================================================
              MATURITY REMINDER
          ================================================== */}

          <section className="rounded-2xl border border-[#e2e8dc] bg-white p-5">

            <div className="flex items-center justify-between gap-4">

              <div className="flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f2f6ee] text-[#315c46]">
                  <FiBell size={17} />
                </div>


                <div>

                  <h3 className="text-sm font-semibold text-[#18392c]">

                    {isFixedDeposit
                      ? "FD Maturity Reminder"
                      : "Maturity Reminder"}

                  </h3>


                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Get notified before this investment matures.
                  </p>

                </div>

              </div>


              <Toggle
                checked={
                  maturityReminderEnabled
                }
                onChange={
                  setMaturityReminderEnabled
                }
              />

            </div>


            {maturityReminderEnabled && (

              <div className="mt-5 space-y-5">


                {!maturityDate && (

                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">

                    <p className="text-[10px] leading-4 text-amber-700">
                      Select a maturity date above to use this
                      reminder.
                    </p>

                  </div>

                )}


                {/* WHEN */}

                <div>

                  <p className="text-xs font-medium text-[#52665b]">
                    Notify Me
                  </p>


                  <div className="mt-3 flex flex-wrap gap-4">

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
                      label="7 days before"
                      checked={
                        sevenDaysBeforeMaturity
                      }
                      onChange={
                        setSevenDaysBeforeMaturity
                      }
                    />


                    <CheckOption
                      label="On maturity date"
                      checked={
                        onMaturityDate
                      }
                      onChange={
                        setOnMaturityDate
                      }
                    />

                  </div>

                </div>


                {/* CHANNEL */}

                <div>

                  <p className="text-xs font-medium text-[#52665b]">
                    Notification Channel
                  </p>


                  <div className="mt-3 flex flex-wrap gap-4">

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
                    In-App maturity reminders appear in the
                    FinanceOS notification bell.
                  </p>

                </div>

              </div>

            )}

          </section>


          {/* ==================================================
              FD MATURITY ACTIONS
          ================================================== */}

          {isFixedDeposit &&
            maturityDate && (

              <section className="rounded-2xl border border-[#dcebd4] bg-[#f7fbf4] p-5">

                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6c8b72]">
                  At Maturity
                </p>


                <h3 className="mt-1 text-sm font-semibold text-[#18392c]">
                  Choose what to do with the FD
                </h3>


                <p className="mt-2 text-xs leading-5 text-[#52665b]">
                  When the maturity date arrives, FinanceOS can
                  mark the FD as matured and provide the available
                  actions.
                </p>


                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">

                  <MaturityOption
                    title="Withdraw / Close"
                    description="Close the FD and move the available proceeds to Cash & Savings."
                  />


                  <MaturityOption
                    title="Renew FD"
                    description="Keep the old FD in history and create a renewed FD with new terms."
                  />


                  <MaturityOption
                    title="Create New FD"
                    description="Use all or part of the proceeds to create another fixed deposit."
                  />


                  <MaturityOption
                    title="Allocate to Goal"
                    description="Use available maturity proceeds toward an active saving goal."
                  />

                </div>

              </section>

            )}


          {/* ==================================================
              SUMMARY
          ================================================== */}

          <section className="rounded-2xl border border-[#dcebd4] bg-[#f7fbf4] p-5">

            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6c8b72]">
              Summary
            </p>


            {isFixedDeposit ? (

              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">

                <SummaryItem
                  label="Principal"
                  value={`₹${formatMoney(
                    amountNumber
                  )}`}
                />


                <SummaryItem
                  label="Interest Rate"
                  value={`${safeNumber(
                    interestRate
                  )}%`}
                />


                <SummaryItem
                  label="Estimated Interest"
                  value={`₹${formatMoney(
                    fdDetails
                      .estimatedInterest
                  )}`}
                />


                <SummaryItem
                  label={
                    interestMethod ===
                    "Cumulative"
                      ? "Expected Maturity"
                      : "Principal at Maturity"
                  }

                  value={`₹${formatMoney(
                    fdDetails
                      .estimatedMaturityAmount
                  )}`}
                />

              </div>

            ) : (

              <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">

                <SummaryItem
                  label="Contribution"
                  value={`₹${formatMoney(
                    amountNumber
                  )}`}
                />


                <SummaryItem
                  label="Type"
                  value={
                    effectiveContributionType
                  }
                />


                <SummaryItem
                  label="Monthly Equivalent"
                  value={`₹${formatMoney(
                    monthlyContribution
                  )}`}
                />

              </div>

            )}

          </section>


          {/* ==================================================
              BUTTONS
          ================================================== */}

          <div className="sticky bottom-0 -mx-6 -mb-6 flex flex-col-reverse gap-3 border-t border-[#edf0e9] bg-white px-6 py-4 sm:flex-row sm:justify-end">

            {typeof onClose ===
              "function" && (

              <button
                type="button"
                onClick={
                  onClose
                }
                className="rounded-xl border border-[#dfe5da] bg-white px-5 py-3 text-xs font-semibold text-[#52665b] transition hover:bg-[#f7f9f4]"
              >
                Cancel
              </button>

            )}


            <button
              type="submit"
              className="rounded-xl bg-[#315c46] px-6 py-3 text-xs font-semibold text-white transition hover:bg-[#274c3a]"
            >

              {isFixedDeposit
                ? "Save Fixed Deposit"
                : "Save Investment"}

            </button>

          </div>

        </form>

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
}) {

  return (

    <div className="relative">

      <span className="absolute left-4 top-1/2 mt-1 -translate-y-1/2 text-sm text-slate-400">
        ₹
      </span>


      <input
        type="number"
        min="0"
        step="0.01"
        value={
          value
        }

        onChange={(event) =>
          onChange(
            event.target.value
          )
        }

        onWheel={
          preventWheelChange
        }

        placeholder={
          placeholder
        }

        className={`${inputClass} pl-8`}
      />

    </div>
  );
}


// ============================================================
// INFO BOX
// ============================================================

function InfoBox({
  label,
  value,
}) {

  return (

    <div className="rounded-xl bg-[#f8faf7] p-4">

      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#6c8b72]">
        {label}
      </p>


      <p className="mt-1 text-sm font-bold text-[#18392c]">
        {value}
      </p>

    </div>
  );
}


// ============================================================
// SUMMARY ITEM
// ============================================================

function SummaryItem({
  label,
  value,
}) {

  return (

    <div className="rounded-xl bg-white p-3">

      <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-[#6c8b72]">
        {label}
      </p>


      <p className="mt-1 break-words text-xs font-semibold text-[#18392c]">
        {value}
      </p>

    </div>
  );
}


// ============================================================
// MATURITY OPTION
// ============================================================

function MaturityOption({
  title,
  description,
}) {

  return (

    <div className="rounded-xl bg-white p-4">

      <p className="text-xs font-semibold text-[#18392c]">
        {title}
      </p>


      <p className="mt-1 text-[10px] leading-4 text-slate-400">
        {description}
      </p>

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

    <label className="flex cursor-pointer items-center gap-2">

      <input
        type="checkbox"
        checked={
          checked
        }

        onChange={(event) =>
          onChange(
            event.target.checked
          )
        }

        className="h-4 w-4 rounded border-slate-300 accent-[#315c46]"
      />


      <span className="text-[11px] font-medium text-[#52665b]">
        {label}
      </span>

    </label>
  );
}


// ============================================================
// TOGGLE
// ============================================================

function Toggle({
  checked,
  onChange,
}) {

  return (

    <button
      type="button"
      role="switch"
      aria-checked={
        checked
      }

      onClick={() =>
        onChange(
          !checked
        )
      }

      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked
          ? "bg-[#315c46]"
          : "bg-slate-200"
      }`}
    >

      <span
        className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-all ${
          checked
            ? "left-6"
            : "left-1"
        }`}
      />

    </button>
  );
}


// ============================================================
// EXPORT
// ============================================================

export default InvestmentForm;