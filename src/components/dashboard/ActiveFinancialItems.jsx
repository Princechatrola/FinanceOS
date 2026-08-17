/*
  ============================================================
  FINANCEOS - ACTIVE FINANCIAL ITEMS
  ============================================================

  This component displays financial items that currently exist
  for the user.

  The dashboard is dynamic.

  For example:
  - No saving goals -> no goal cards
  - No liabilities -> no loan/liability cards
  - No investments -> no investment cards
  - No insurance -> no insurance cards

  Later these arrays will come from the backend/database.
*/


// Goal feasibility component
import GoalFeasibility from "./GoalFeasibility.jsx";


function ActiveFinancialItems({
  savingGoals = [],
  investments = [],
  insurancePolicies = [],
  liabilities = [],

  /*
    This represents money that is still free after all
    currently recorded commitments.
  */
  availableToAllocate = 0,
}) {


  // ==========================================================
  // CHECK WHETHER ANY FINANCIAL ITEM EXISTS
  // ==========================================================

  const hasFinancialItems =
    savingGoals.length > 0 ||
    investments.length > 0 ||
    insurancePolicies.length > 0 ||
    liabilities.length > 0;


  /*
    If the user has no active financial items, this component
    does not create an empty section.

    Later Quick Actions will help a new user add their first
    goal, investment, policy or liability.
  */
  if (!hasFinancialItems) {
    return null;
  }


  return (
    <section className="mt-5">


      {/* ======================================================
          SECTION HEADING
         ====================================================== */}

      <div className="mb-4">

        <h2 className="text-base font-semibold text-[#18392c]">
          Active Financial Items
        </h2>

        <p className="mt-1 text-xs text-slate-400">
          Track your currently active goals and financial commitments.
        </p>

      </div>


      {/* ======================================================
          FINANCIAL ITEM GRID
         ====================================================== */}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">


        {/* ====================================================
            SAVING GOALS
           ==================================================== */}

        {savingGoals.map((goal) => {

          /*
            Goal progress must be calculated using money that
            has actually been recorded toward the goal.

            We do NOT increase progress simply because time
            has passed.

            Example:

            Target = ₹1,00,000
            Saved  = ₹25,000

            Progress = 25%
          */

          const progress =
            goal.targetAmount > 0
              ? Math.min(
                  ((goal.currentAmount || 0) / (goal.targetAmount || 1)) * 100,
                  100
                )
              : 0;


          /*
            IMPORTANT:

            availableToAllocate already excludes this goal's
            existing monthly allocation.

            Therefore, when checking whether this EXISTING goal
            is feasible, we add its own allocation back.

            Example:

            Available after commitments = ₹5,000
            Phone allocation             = ₹5,000

            Capacity for Phone review     = ₹10,000

            This avoids double-counting the same commitment.
          */

          const goalAvailableCapacity =
            availableToAllocate +
            (goal.monthlyContribution || 0);


          return (
            <div
              key={`goal-${goal._id}`}
              className="rounded-2xl border border-[#e2e8dc] bg-white p-5"
            >


              {/* ==============================================
                  GOAL TYPE AND STATUS
                 ============================================== */}

              <div className="flex items-center justify-between">

                <span className="rounded-full bg-[#edf6e8] px-3 py-1 text-[10px] font-semibold text-[#477a35]">
                  Saving Goal
                </span>

                <span className="text-[10px] font-medium text-[#5f7568]">
                  {goal.status}
                </span>

              </div>


              {/* Goal name */}
              <h3 className="mt-4 text-lg font-semibold text-[#18392c]">
                {goal.goalName}
              </h3>


              {/* ==============================================
                  SAVED AND TARGET AMOUNTS
                 ============================================== */}

              <div className="mt-4 flex items-end justify-between">


                {/* Amount actually saved */}
                <div>

                  <p className="text-[10px] text-slate-400">
                    Saved
                  </p>

                  <p className="mt-1 text-lg font-bold text-[#315c46]">
                   ₹{Number(goal.currentAmount || 0).toLocaleString("en-IN")}
                  </p>

                </div>


                {/* Goal target */}
                <div className="text-right">

                  <p className="text-[10px] text-slate-400">
                    Target
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#18392c]">
                    ₹{Number(goal.targetAmount || 0).toLocaleString("en-IN")}
                  </p>

                </div>

              </div>


              {/* ==============================================
                  GOAL PROGRESS
                 ============================================== */}

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e9f0e5]">

                <div
                  className="h-full rounded-full bg-[#315c46]"
                  style={{
                    width: `${progress}%`,
                  }}
                />

              </div>


              <div className="mt-2 flex justify-between">

                <span className="text-[10px] text-slate-400">
                  Progress
                </span>

                <span className="text-[10px] font-semibold text-[#315c46]">
                  {progress.toFixed(0)}%
                </span>

              </div>


              {/* ==============================================
                  GOAL DETAILS
                 ============================================== */}

              <div className="mt-4 grid grid-cols-2 gap-3">


                {/* Current monthly allocation */}
                <div className="rounded-xl bg-[#f7f9f3] p-3">

                  <p className="text-[10px] text-slate-400">
                    Monthly Allocation
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#18392c]">
                    ₹{Number(goal.monthlyContribution || 0).toLocaleString("en-IN")}
                  </p>

                </div>


                {/* Goal duration */}
                <div className="rounded-xl bg-[#f7f9f3] p-3">

                  <p className="text-[10px] text-slate-400">
                    Duration
                  </p>

                  <p className="mt-1 text-sm font-semibold text-[#18392c]">
                    {Math.max(
  1,
  Math.ceil(
    (new Date(goal.targetDate) - new Date(goal.startDate)) /
      (1000 * 60 * 60 * 24 * 30)
  )
)} months
                  </p>

                </div>

              </div>


              {/* ==============================================
                  GOAL FEASIBILITY CHECK
                 ==============================================

                  GoalFeasibility checks whether the selected
                  target and duration are realistic based on
                  the user's current financial capacity.
              */}

              <GoalFeasibility
                targetAmount={goal.targetAmount}
                currentAmount={goal.currentAmount || 0}
durationMonths={Math.max(
  1,
  Math.ceil(
    (new Date(goal.targetDate) - new Date(goal.startDate)) /
      (1000 * 60 * 60 * 24 * 30)
  )
)}
                availableToAllocate={goalAvailableCapacity}
              />


            </div>
          );
        })}


        {/* ====================================================
            LIABILITIES
           ==================================================== */}

        {liabilities.map((liability) => (

          <div
            key={`liability-${liability.id}`}
            className="rounded-2xl border border-[#e2e8dc] bg-white p-5"
          >


            {/* Liability type and status */}
            <div className="flex items-center justify-between">

              <span className="rounded-full bg-[#fff3e8] px-3 py-1 text-[10px] font-semibold text-[#9a642c]">
                Liability
              </span>

              <span className="text-[10px] font-medium text-[#5f7568]">
                {liability.status}
              </span>

            </div>


            {/* Liability name */}
            <h3 className="mt-4 text-lg font-semibold text-[#18392c]">
              {liability.name}
            </h3>


            {/* Monthly EMI */}
            <div className="mt-5">

              <p className="text-[10px] text-slate-400">
                Monthly EMI
              </p>

              <p className="mt-1 text-xl font-bold text-[#18392c]">
                ₹{liability.monthlyEMI.toLocaleString("en-IN")}
              </p>

            </div>


            {/*
              Later this area will show:

              - Original loan amount
              - Remaining balance
              - EMI number
              - Payment progress
              - Due date
              - Reminder status
              - Recorded / Due / Missed
            */}

            <div className="mt-5 rounded-xl bg-[#f7f9f3] p-3">

              <p className="text-[11px] leading-5 text-slate-500">
                Loan repayment tracking will appear here after
                repayment details are recorded.
              </p>

            </div>


          </div>
        ))}


        {/* ====================================================
            INVESTMENTS
           ==================================================== */}

        {investments.map((investment) => (

          <div
            key={`investment-${investment.id}`}
            className="rounded-2xl border border-[#e2e8dc] bg-white p-5"
          >


            {/* Investment type and status */}
            <div className="flex items-center justify-between">

              <span className="rounded-full bg-[#edf6e8] px-3 py-1 text-[10px] font-semibold text-[#477a35]">
                Investment
              </span>

              <span className="text-[10px] font-medium text-[#5f7568]">
                {investment.status}
              </span>

            </div>


            {/* Investment name */}
            <h3 className="mt-4 text-lg font-semibold text-[#18392c]">
              {investment.name}
            </h3>


            <div className="mt-5 rounded-xl bg-[#f7f9f3] p-3">

              <p className="text-[11px] leading-5 text-slate-500">
                Contribution and investment tracking will appear here.
              </p>

            </div>


          </div>
        ))}


        {/* ====================================================
            INSURANCE POLICIES
           ==================================================== */}

        {insurancePolicies.map((policy) => (

          <div
            key={`insurance-${policy.id}`}
            className="rounded-2xl border border-[#e2e8dc] bg-white p-5"
          >


            {/* Policy type and status */}
            <div className="flex items-center justify-between">

              <span className="rounded-full bg-[#eef4f0] px-3 py-1 text-[10px] font-semibold text-[#315c46]">
                Insurance
              </span>

              <span className="text-[10px] font-medium text-[#5f7568]">
                {policy.status}
              </span>

            </div>


            {/* Policy name */}
            <h3 className="mt-4 text-lg font-semibold text-[#18392c]">
              {policy.name}
            </h3>


            <div className="mt-5 rounded-xl bg-[#f7f9f3] p-3">

              <p className="text-[11px] leading-5 text-slate-500">
                Premium, due date and maturity tracking will appear here.
              </p>

            </div>


          </div>
        ))}


      </div>

    </section>
  );
}


export default ActiveFinancialItems;