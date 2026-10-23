// ============================================================
// FINANCEOS - FD INTEREST MODAL
// ============================================================
//
// Purpose:
//
// Allows the user to record ACTUAL interest credited by the
// bank for a payout Fixed Deposit.
//
// Example:
//
// Base Income      = ₹50,000
// FD Interest      = ₹5,000
// Total Income     = ₹55,000
//
// IMPORTANT:
//
// - Only actual credited interest is recorded.
// - Estimated interest is shown only as a reference.
// - Cumulative FD interest is NOT recorded periodically.
// - FinanceProvider handles duplicate protection.
//
// ============================================================


import {
  useMemo,
  useState,
} from "react";

import {
  FiX,
  FiDollarSign,
  FiCalendar,
  FiTrendingUp,
  FiCheckCircle,
} from "react-icons/fi";

import useFinance from "../../context/useFinance.js";


// ============================================================
// HELPERS
// ============================================================

function safeNumber(value) {

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : 0;

}


function formatMoney(value) {

  return safeNumber(value)
    .toLocaleString(
      "en-US",
      {
        maximumFractionDigits: 2,
      }
    );

}


function getToday() {

  return new Date()
    .toISOString()
    .slice(0, 10);

}


// ============================================================
// COMPONENT
// ============================================================

function FDInterestModal({
  investment,
  onClose,
}) {


  // ==========================================================
  // FINANCE CONTEXT
  // ==========================================================

  const {
    recordFDInterest,
  } = useFinance();


  // ==========================================================
  // FORM STATE
  // ==========================================================

  const [
    amount,
    setAmount,
  ] = useState("");


  const [
    creditDate,
    setCreditDate,
  ] = useState(
    getToday()
  );


  const [
    referenceId,
    setReferenceId,
  ] = useState("");


  const [
    note,
    setNote,
  ] = useState("");


  const [
    error,
    setError,
  ] = useState("");


  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");


  const [
    isSubmitting,
    setIsSubmitting,
  ] = useState(false);


  // ==========================================================
  // FD VALUES
  // ==========================================================

  const principal =
    useMemo(
      () =>
        safeNumber(
          investment?.principalAmount ||
          investment?.amount
        ),

      [
        investment,
      ]
    );


  const interestRate =
    useMemo(
      () =>
        safeNumber(
          investment?.interestRate
        ),

      [
        investment,
      ]
    );


  const estimatedPayout =
    useMemo(
      () =>
        safeNumber(
          investment?.estimatedInterestPerPayout
        ),

      [
        investment,
      ]
    );


  const totalInterestReceived =
    useMemo(
      () =>
        safeNumber(
          investment?.totalInterestReceived
        ),

      [
        investment,
      ]
    );


  const payoutFrequency =
    investment?.interestPayoutFrequency ||
    "Not specified";


  // ==========================================================
  // VALIDATE FD
  // ==========================================================

  const isFixedDeposit =
    String(
      investment?.type ||
      ""
    )
      .trim()
      .toLowerCase() ===
    "fixed deposit";


  const isPayoutFD =
    String(
      investment?.interestMethod ||
      ""
    )
      .trim()
      .toLowerCase() ===
    "payout";


  // ==========================================================
  // INPUT CLASS
  // ==========================================================

  const inputClass =
    "mt-2 w-full rounded-xl border border-[#dfe5da] bg-white px-4 py-3 text-sm text-[#18392c] outline-none transition placeholder:text-slate-300 focus:border-[#8eaa92] focus:ring-2 focus:ring-[#dcebd4]";


  // ==========================================================
  // SUBMIT
  // ==========================================================

  const handleSubmit = async (
    event
  ) => {

    event.preventDefault();


    setError("");
    setSuccessMessage("");


    // --------------------------------------------------------
    // Investment validation
    // --------------------------------------------------------

    if (
      !investment?.id
    ) {

      setError(
        "Fixed deposit information is missing."
      );

      return;
    }


    if (
      !isFixedDeposit
    ) {

      setError(
        "Interest can only be recorded for a Fixed Deposit."
      );

      return;
    }


    if (
      !isPayoutFD
    ) {

      setError(
        "This is a cumulative FD. Its interest remains in the deposit until maturity."
      );

      return;
    }


    // --------------------------------------------------------
    // Amount validation
    // --------------------------------------------------------

    const interestAmount =
      safeNumber(
        amount
      );


    if (
      interestAmount <= 0
    ) {

      setError(
        "Enter the actual interest amount credited by the bank."
      );

      return;
    }


    // --------------------------------------------------------
    // Date validation
    // --------------------------------------------------------

    if (
      !creditDate
    ) {

      setError(
        "Select the interest credit date."
      );

      return;
    }


    // --------------------------------------------------------
    // Record interest
    // --------------------------------------------------------

    setIsSubmitting(true);


    try {

      const result =
        await recordFDInterest(
          investment.id,
          {
            amount:
              interestAmount,

            date:
              creditDate,

            referenceId:
              referenceId.trim() ||
              undefined,

            note:
              note.trim(),
          }
        );


      if (
        !result?.success
      ) {

        setError(
          result?.message ||
          "Unable to record FD interest."
        );

        setIsSubmitting(false);

        return;
      }


      setSuccessMessage(
        result.message ||
        "FD interest recorded successfully."
      );


      // Clear fields after successful record.

      setAmount("");
      setReferenceId("");
      setNote("");


      // ------------------------------------------------------
      // Close modal shortly after success
      // ------------------------------------------------------

      window.setTimeout(
        () => {

          if (
            typeof onClose ===
            "function"
          ) {
            onClose();
          }

        },
        700
      );

    } catch (submitError) {

      console.error(
        "FD interest error:",
        submitError
      );


      setError(
        "Something went wrong while recording FD interest."
      );


      setIsSubmitting(false);

    }

  };


  // ==========================================================
  // CLOSE
  // ==========================================================

  const handleClose = () => {

    if (
      isSubmitting
    ) {
      return;
    }


    if (
      typeof onClose ===
      "function"
    ) {
      onClose();
    }

  };


  // ==========================================================
  // INVALID INVESTMENT
  // ==========================================================

  if (
    !investment
  ) {

    return null;

  }


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 backdrop-blur-[2px]"
      onMouseDown={(event) => {

        if (
          event.target ===
          event.currentTarget
        ) {
          handleClose();
        }

      }}
    >

      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-[#e2e8dc] bg-white shadow-2xl">


        {/* ====================================================
            HEADER
           ==================================================== */}

        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#edf0e9] bg-white px-6 py-5">

          <div>

            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6c8b72]">

              Fixed Deposit

            </p>


            <h2 className="mt-1 text-lg font-semibold text-[#18392c]">

              Record FD Interest

            </h2>


            <p className="mt-1 text-xs leading-5 text-slate-400">

              Record interest only after the bank has actually
              credited it.

            </p>

          </div>


          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#e2e8dc] text-slate-400 transition hover:bg-[#f7f9f4] hover:text-[#18392c] disabled:cursor-not-allowed disabled:opacity-50"
          >

            <FiX size={17} />

          </button>

        </div>


        <form
          onSubmit={handleSubmit}
          className="space-y-5 p-6"
        >


          {/* ==================================================
              FD INFORMATION
             ================================================== */}

          <section className="rounded-2xl border border-[#dcebd4] bg-[#f7fbf4] p-5">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#315c46]">

                <FiTrendingUp
                  size={18}
                />

              </div>


              <div>

                <p className="text-sm font-semibold text-[#18392c]">

                  {investment.name ||
                    "Fixed Deposit"}

                </p>


                <p className="mt-0.5 text-[11px] text-[#6c8b72]">

                  {investment.institution ||
                    "Bank / Institution not specified"}

                </p>

              </div>

            </div>


            <div className="mt-5 grid grid-cols-2 gap-3">

              <InfoBox
                label="Principal"
                value={`₹${formatMoney(
                  principal
                )}`}
              />


              <InfoBox
                label="Interest Rate"
                value={`${interestRate}% p.a.`}
              />


              <InfoBox
                label="Payout"
                value={payoutFrequency}
              />


              <InfoBox
                label="Interest Received"
                value={`₹${formatMoney(
                  totalInterestReceived
                )}`}
              />

            </div>

          </section>


          {/* ==================================================
              ESTIMATED PAYOUT
             ================================================== */}

          {estimatedPayout > 0 && (

            <section className="rounded-2xl border border-[#e2e8dc] bg-white p-5">

              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#6c8b72]">

                Expected Payout

              </p>


              <p className="mt-2 text-xl font-bold text-[#315c46]">

                ₹
                {formatMoney(
                  estimatedPayout
                )}

              </p>


              <p className="mt-1 text-[11px] leading-5 text-slate-400">

                This is an estimate from the FD details.
                Enter the amount actually credited by the bank
                below.

              </p>

            </section>

          )}


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
              SUCCESS
             ================================================== */}

          {successMessage && (

            <div className="flex items-start gap-3 rounded-xl border border-[#dcebd4] bg-[#f7fbf4] px-4 py-3">

              <FiCheckCircle
                className="mt-0.5 shrink-0 text-[#315c46]"
                size={16}
              />


              <p className="text-xs font-medium leading-5 text-[#315c46]">

                {successMessage}

              </p>

            </div>

          )}


          {/* ==================================================
              ACTUAL INTEREST
             ================================================== */}

          <section className="rounded-2xl border border-[#e2e8dc] bg-white p-5">

            <div className="mb-5 flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf6e8] text-[#315c46]">

                <FiDollarSign
                  size={17}
                />

              </div>


              <div>

                <h3 className="text-sm font-semibold text-[#18392c]">

                  Interest Credit

                </h3>


                <p className="mt-0.5 text-[11px] text-slate-400">

                  Enter the actual bank credit.

                </p>

              </div>

            </div>


            {/* AMOUNT */}

            <label className="block">

              <span className="text-xs font-medium text-[#52665b]">

                Interest Received

              </span>


              <div className="relative">

                <span className="absolute left-4 top-1/2 mt-1 -translate-y-1/2 text-sm text-slate-400">

                  ₹

                </span>


                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(event) => {

                    setAmount(
                      event.target.value
                    );

                    setError("");

                  }}
                  placeholder={
                    estimatedPayout > 0
                      ? String(
                          estimatedPayout.toFixed(
                            2
                          )
                        )
                      : "5000"
                  }
                  className={`${inputClass} pl-8`}
                />

              </div>

            </label>


            {/* CREDIT DATE */}

            <label className="mt-5 block">

              <span className="text-xs font-medium text-[#52665b]">

                Credit Date

              </span>


              <div className="relative">

                <FiCalendar
                  size={15}
                  className="absolute left-4 top-1/2 mt-1 -translate-y-1/2 text-slate-400"
                />


                <input
                  type="date"
                  value={creditDate}
                  onChange={(event) => {

                    setCreditDate(
                      event.target.value
                    );

                    setError("");

                  }}
                  className={`${inputClass} pl-10`}
                />

              </div>


              <p className="mt-2 text-[10px] leading-4 text-slate-400">

                FinanceOS adds the interest to income for the
                month containing this date.

              </p>

            </label>

          </section>


          {/* ==================================================
              OPTIONAL DETAILS
             ================================================== */}

          <section className="rounded-2xl border border-[#e2e8dc] bg-white p-5">

            <h3 className="text-sm font-semibold text-[#18392c]">

              Optional Details

            </h3>


            {/* REFERENCE */}

            <label className="mt-4 block">

              <span className="text-xs font-medium text-[#52665b]">

                Bank Reference ID

              </span>


              <input
                type="text"
                value={referenceId}
                onChange={(event) => {

                  setReferenceId(
                    event.target.value
                  );

                  setError("");

                }}
                placeholder="Example: FDINT-270726"
                className={inputClass}
              />


              <p className="mt-2 text-[10px] text-slate-400">

                A reference ID helps prevent the same bank
                credit from being recorded twice.

              </p>

            </label>


            {/* NOTE */}

            <label className="mt-5 block">

              <span className="text-xs font-medium text-[#52665b]">

                Note

              </span>


              <textarea
                rows={3}
                value={note}
                onChange={(event) =>
                  setNote(
                    event.target.value
                  )
                }
                placeholder="Example: Quarterly FD interest credited"
                className={`${inputClass} resize-none`}
              />

            </label>

          </section>


          {/* ==================================================
              INCOME INFORMATION
             ================================================== */}

          <section className="rounded-2xl border border-[#dcebd4] bg-[#f7fbf4] p-4">

            <p className="text-xs font-semibold text-[#18392c]">

              How this affects FinanceOS

            </p>


            <p className="mt-2 text-[11px] leading-5 text-[#5f7568]">

              The credited amount becomes additional income for
              the selected month. Your normal monthly income is
              not changed permanently.

            </p>

          </section>


          {/* ==================================================
              ACTIONS
             ================================================== */}

          <div className="flex flex-col-reverse gap-3 border-t border-[#edf0e9] pt-5 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-xl border border-[#dfe5da] bg-white px-5 py-3 text-xs font-semibold text-[#52665b] transition hover:bg-[#f7f9f4] disabled:cursor-not-allowed disabled:opacity-50"
            >

              Cancel

            </button>


            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-[#315c46] px-6 py-3 text-xs font-semibold text-white transition hover:bg-[#274c3a] disabled:cursor-not-allowed disabled:opacity-60"
            >

              {isSubmitting
                ? "Recording..."
                : "Record Interest"}

            </button>

          </div>


        </form>

      </div>

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
// EXPORT
// ============================================================

export default FDInterestModal;