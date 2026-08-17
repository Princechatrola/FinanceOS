// ============================================================
// FINANCEOS - GOAL AFFORDABILITY
// ============================================================
//
// Purpose:
// Shows whether a proposed Saving Goal fits within the user's
// current Available to Allocate amount.
//
// This component DOES NOT:
// - Create a goal
// - Modify financial data
// - Transfer money
//
// It only displays the result of calculations performed by
// the Saving Goal form.
//
// Example:
//
// Available to Allocate     ₹10,000/month
// Goal Requirement           ₹6,000/month
//
// Result:
// Affordable
//
// ------------------------------------------------------------
//
// Available to Allocate      ₹5,000/month
// Goal Requirement           ₹8,000/month
//
// Result:
// Not Currently Affordable
//
// Monthly Gap                ₹3,000
//
// FinanceOS may also suggest a longer duration.
// ============================================================


// ============================================================
// GOAL AFFORDABILITY COMPONENT
// ============================================================

function GoalAffordability({

  // Whether the goal fits current available capacity
  isAffordable,

  // Required amount per month for this goal
  requiredPerMonth,

  // Current amount available before adding this new goal
  availableToAllocate,

  // Difference between requirement and available capacity
  monthlyGap,

  // Suggested duration when selected duration is too short
  suggestedDuration,

}) {


  // ==========================================================
  // SAFE VALUES
  // ==========================================================

  const required =
    Number(requiredPerMonth) || 0;


  const available =
    Number(availableToAllocate) || 0;


  const gap =
    Number(monthlyGap) || 0;


  // ==========================================================
  // FORMAT MONEY
  // ==========================================================

  const formatMoney = (amount) => {

    return Number(amount).toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 0,
      }
    );

  };


  // ==========================================================
  // AFFORDABLE GOAL
  // ==========================================================

  if (isAffordable) {

    return (

      <div className="rounded-2xl border border-[#dcebd4] bg-[#f4faef] p-5">


        {/* STATUS */}

        <div className="flex items-start justify-between gap-4">


          <div>

            <p className="text-xs font-semibold uppercase tracking-wide text-[#6c8b72]">
              Goal Feasibility
            </p>


            <h3 className="mt-1 text-base font-bold text-[#315c46]">
              Affordable
            </h3>


            <p className="mt-1 text-xs leading-5 text-[#5f7568]">

              This goal currently fits within your available
              monthly financial capacity.

            </p>

          </div>


          {/* STATUS BADGE */}

          <span className="shrink-0 rounded-full bg-[#dff2d2] px-3 py-1 text-xs font-semibold text-[#315c46]">
            Fits Budget
          </span>


        </div>


        {/* ====================================================
            FINANCIAL BREAKDOWN
           ==================================================== */}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">


          {/* REQUIRED PER MONTH */}

          <div className="rounded-xl bg-white p-4">

            <p className="text-[11px] text-slate-400">
              Required Per Month
            </p>


            <p className="mt-1 text-lg font-bold text-[#18392c]">

              ₹{formatMoney(required)}

            </p>

          </div>


          {/* AVAILABLE BEFORE GOAL */}

          <div className="rounded-xl bg-white p-4">

            <p className="text-[11px] text-slate-400">
              Available Before This Goal
            </p>


            <p className="mt-1 text-lg font-bold text-[#315c46]">

              ₹{formatMoney(available)}

            </p>

          </div>


        </div>


        {/* ====================================================
            AVAILABLE AFTER GOAL
           ==================================================== */}

        <div className="mt-3 rounded-xl border border-[#dcebd4] bg-white p-4">

          <div className="flex items-center justify-between gap-4">


            <div>

              <p className="text-xs font-medium text-[#52665b]">
                Estimated Available After Goal
              </p>


              <p className="mt-1 text-[11px] text-slate-400">
                If this goal becomes an active monthly commitment.
              </p>

            </div>


            <p className="text-lg font-bold text-[#315c46]">

              ₹{formatMoney(
                available - required
              )}

            </p>


          </div>

        </div>


      </div>

    );

  }


  // ==========================================================
  // NOT AFFORDABLE
  // ==========================================================

  return (

    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">


      {/* STATUS */}

      <div className="flex items-start justify-between gap-4">


        <div>

          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Goal Feasibility
          </p>


          <h3 className="mt-1 text-base font-bold text-amber-800">
            Not Currently Affordable
          </h3>


          <p className="mt-1 text-xs leading-5 text-amber-700">

            The monthly amount required for this goal is higher
            than the amount currently available for a new
            financial commitment.

          </p>

        </div>


        {/* STATUS BADGE */}

        <span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
          Review Goal
        </span>


      </div>


      {/* ======================================================
          FINANCIAL BREAKDOWN
         ====================================================== */}

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">


        {/* REQUIRED */}

        <div className="rounded-xl bg-white p-4">

          <p className="text-[11px] text-slate-400">
            Required Per Month
          </p>


          <p className="mt-1 text-lg font-bold text-[#18392c]">

            ₹{formatMoney(required)}

          </p>

        </div>


        {/* AVAILABLE */}

        <div className="rounded-xl bg-white p-4">

          <p className="text-[11px] text-slate-400">
            Currently Available
          </p>


          <p
            className={`mt-1 text-lg font-bold ${
              available >= 0
                ? "text-[#315c46]"
                : "text-red-600"
            }`}
          >

            ₹{formatMoney(available)}

          </p>

        </div>


        {/* MONTHLY GAP */}

        <div className="rounded-xl bg-white p-4">

          <p className="text-[11px] text-slate-400">
            Monthly Gap
          </p>


          <p className="mt-1 text-lg font-bold text-amber-700">

            ₹{formatMoney(gap)}

          </p>

        </div>


      </div>


      {/* ======================================================
          SUGGEST LONGER DURATION
         ====================================================== */}

      {suggestedDuration !== null &&
       suggestedDuration !== undefined &&
       suggestedDuration > 0 && (

        <div className="mt-4 rounded-xl border border-amber-200 bg-white p-4">


          <p className="text-xs font-semibold text-amber-800">
            Suggested Duration
          </p>


          <p className="mt-1 text-xs leading-5 text-amber-700">

            Based on your current available monthly amount,
            consider approximately{" "}

            <span className="font-bold">
              {suggestedDuration} months
            </span>

            {" "}or longer for this goal.

          </p>


        </div>

      )}


      {/* ======================================================
          NO CURRENT CAPACITY
         ====================================================== */}

      {available <= 0 && (

        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">


          <p className="text-xs font-semibold text-red-600">
            No monthly capacity is currently available for a new goal.
          </p>


          <p className="mt-1 text-xs leading-5 text-red-500">

            Review your monthly expenses or existing financial
            commitments before adding another monthly allocation.

          </p>


        </div>

      )}


    </div>

  );

}


// ============================================================
// EXPORT COMPONENT
// ============================================================

export default GoalAffordability;