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

        {liabilities.map((liability) => {
          const original = Number(liability.principalAmount || 0);
          const remaining = Number(liability.remainingAmount || 0);
          const monthlyEMI = Number(liability.monthlyEMI || 0);
          const isCC = liability.type === "Credit Card";
          
          const progressVal = original > 0 
            ? (isCC ? (remaining / original) * 100 : ((original - remaining) / original) * 100) 
            : 0;

          const progressColor = isCC ? "bg-amber-600" : "bg-[#315c46]";

          return (
            <div
              key={`liability-${liability.id || liability._id}`}
              className="rounded-2xl border border-[#e2e8dc] bg-white p-5 hover:shadow-md transition duration-200"
            >
              {/* Liability type and status */}
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-[#fff3e8] px-3 py-1 text-[10px] font-semibold text-[#9a642c]">
                  {liability.type || "Liability"}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  liability.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                }`}>
                  {liability.status}
                </span>
              </div>

              {/* Liability name & lender */}
              <div className="mt-4">
                <h3 className="text-base font-bold text-[#18392c]">
                  {liability.name}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">
                  {liability.lender || "Unknown Lender"}
                </p>
              </div>

              {/* Principal and Remaining Grid */}
              <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    {isCC ? "Credit Limit" : "Original Loan"}
                  </p>
                  <p className="font-extrabold text-[#18392c] mt-0.5">
                    ₹{original.toLocaleString("en-IN")}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Outstanding
                  </p>
                  <p className="font-extrabold text-amber-700 mt-0.5">
                    ₹{remaining.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {/* Progress and EMI */}
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                  <span>{isCC ? "Limit Utilization" : "Repayment Progress"}</span>
                  <span className="text-[#18392c]">{progressVal.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-[#e7eee2] overflow-hidden">
                  <div 
                    className={`h-full ${progressColor} transition-all`} 
                    style={{ width: `${Math.min(Math.max(progressVal, 0), 100)}%` }} 
                  />
                </div>
              </div>

              {/* Footer Details */}
              <div className="mt-4 pt-3 border-t border-[#f4f7f1] flex justify-between items-center text-[10px] text-slate-400">
                <div>
                  <span>EMI: </span>
                  <span className="font-bold text-[#18392c]">₹{monthlyEMI.toLocaleString("en-IN")}</span>
                </div>
                {liability.nextDueDate && (
                  <div>
                    <span>Due: </span>
                    <span className="font-bold text-[#315c46]">
                      {new Date(liability.nextDueDate).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short"
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}


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