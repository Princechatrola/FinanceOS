/*
  ============================================================
  FINANCEOS - GOAL FEASIBILITY
  ============================================================

  This component checks whether a saving goal can be achieved
  within the duration selected by the user.

  Example:

  Target Amount        = ₹1,00,000
  Current Saved        = ₹0
  Duration             = 6 months
  Available Amount     = ₹5,000/month

  Required Amount      ≈ ₹16,667/month

  Because ₹16,667 is greater than ₹5,000,
  FinanceOS warns the user that the selected duration
  is currently not feasible.

  IMPORTANT:
  FinanceOS does not prevent the user from having a goal.
  It provides financial guidance based on current data.
*/


// Import financial calculation functions
import {
  checkGoalAffordability,
  calculateMinimumGoalDuration,
} from "../../utils/financialCalculations.js";


// ============================================================
// GOAL FEASIBILITY COMPONENT
// ============================================================

function GoalFeasibility({
  targetAmount,
  currentAmount,
  durationMonths,
  availableToAllocate,
}) {

  /*
    Check whether the goal fits within the user's current
    Available to Allocate amount.
  */
  const affordability = checkGoalAffordability({
    targetAmount,
    currentAmount,
    durationMonths,
    availableToAllocate,
  });


  /*
    Calculate approximately how many months would be required
    if the user allocated their currently available amount.
  */
  const suggestedDuration = calculateMinimumGoalDuration(
    targetAmount,
    currentAmount,
    availableToAllocate
  );


  // ==========================================================
  // AFFORDABLE GOAL
  // ==========================================================

  if (affordability.isAffordable) {
    return (
      <div className="mt-4 rounded-xl border border-[#dcebd4] bg-[#f2f9ed] p-3">

        <p className="text-xs font-semibold text-[#315c46]">
          Goal is feasible
        </p>

        <p className="mt-1 text-[11px] leading-5 text-[#5f7568]">
          This goal currently fits within your available monthly
          allocation.
        </p>

      </div>
    );
  }


  // ==========================================================
  // NO MONEY AVAILABLE
  // ==========================================================

  if (availableToAllocate <= 0) {
    return (
      <div className="mt-4 rounded-xl border border-[#f1d7bd] bg-[#fff8ef] p-3">

        <p className="text-xs font-semibold text-[#9a642c]">
          No amount currently available
        </p>

        <p className="mt-1 text-[11px] leading-5 text-[#80664c]">
          Your current monthly savings are already allocated to
          existing commitments. Review your commitments before
          adding another monthly goal allocation.
        </p>

      </div>
    );
  }


  // ==========================================================
  // GOAL DURATION IS NOT CURRENTLY FEASIBLE
  // ==========================================================

  return (
    <div className="mt-4 rounded-xl border border-[#f1d7bd] bg-[#fff8ef] p-3">

      {/* Warning heading */}
      <p className="text-xs font-semibold text-[#9a642c]">
        Selected duration may be too short
      </p>


      {/* Required monthly amount */}
      <p className="mt-2 text-[11px] leading-5 text-[#80664c]">

        To reach this goal in {durationMonths} months, you would
        need approximately{" "}

        <span className="font-semibold">
          ₹
          {Math.ceil(
            affordability.requiredPerMonth
          ).toLocaleString("en-IN")}
        </span>

        {" "}per month.

      </p>


      {/* Current available amount */}
      <p className="mt-1 text-[11px] leading-5 text-[#80664c]">

        Your current available amount is{" "}

        <span className="font-semibold">
          ₹{availableToAllocate.toLocaleString("en-IN")}
        </span>

        {" "}per month.

      </p>


      {/* Suggested duration */}
      {suggestedDuration && (
        <div className="mt-3 rounded-lg bg-white/70 p-2.5">

          <p className="text-[11px] leading-5 text-[#6f5a43]">

            At ₹{availableToAllocate.toLocaleString("en-IN")} per
            month, you would need approximately{" "}

            <span className="font-semibold">
              {suggestedDuration} months
            </span>

            {" "}to reach the target based on your current
            financial position.

          </p>

        </div>
      )}

    </div>
  );
}


export default GoalFeasibility;