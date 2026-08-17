// ============================================================
// FINANCEOS - SAVING GOALS PAGE
// ============================================================
//
// Purpose:
//
// - View all saving goals
// - Create new saving goals
// - Separate goals by lifecycle status
// - Show goal summary
//
// Goal lifecycle:
//
// Active
//   ↓
// Paused / Active
//   ↓
// Completed (Target Achieved)
//   ↓
// Closed (Goal funds fully used)
//
// ============================================================


// ============================================================
// 1. IMPORTS
// ============================================================

import {
  useState,
} from "react";


import {
  FiPlus,
  FiTarget,
  FiActivity,
  FiCheckCircle,
  FiArchive,
} from "react-icons/fi";


import Sidebar
  from "../components/layout/Sidebar.jsx";


import Topbar
  from "../components/layout/Topbar.jsx";


import SavingGoalForm
  from "../components/savingGoals/SavingGoalForm.jsx";


import SavingGoalCard
  from "../components/savingGoals/SavingGoalCard.jsx";


import useFinance
  from "../context/useFinance.js";


// ============================================================
// 2. SAVING GOALS PAGE
// ============================================================

function SavingGoals() {


  // ==========================================================
  // FINANCE DATA
  // ==========================================================

  const {
    savingGoals,
  } = useFinance();


  // ==========================================================
  // CREATE GOAL MODAL STATE
  // ==========================================================

  const [
    showGoalForm,
    setShowGoalForm,
  ] = useState(false);


  // ==========================================================
  // SAFE GOALS ARRAY
  // ==========================================================

  const goals =
    Array.isArray(
      savingGoals
    )
      ? savingGoals
      : [];


  // ==========================================================
  // ACTIVE GOALS
  // ==========================================================

  const activeGoals =
    goals.filter(
      (goal) =>
        goal?.status ===
        "Active"
    );


  // ==========================================================
  // PAUSED GOALS
  // ==========================================================

  const pausedGoals =
    goals.filter(
      (goal) =>
        goal?.status ===
        "Paused"
    );


  // ==========================================================
  // COMPLETED / ACHIEVED GOALS
  // ==========================================================
  //
  // Completed means:
  //
  // User reached the target amount,
  // but the saved money is still available.
  //
  // Example:
  //
  // Phone Goal
  //
  // Target:
  // ₹100,000
  //
  // Available Goal Fund:
  // ₹100,000
  //
  // Status:
  // Completed
  //
  // ==========================================================

  const completedGoals =
    goals.filter(
      (goal) =>
        goal?.status ===
        "Completed"
    );


  // ==========================================================
  // CLOSED GOALS
  // ==========================================================
  //
  // Closed means:
  //
  // Goal was achieved and all available
  // goal funds were used / withdrawn.
  //
  // ==========================================================

  const closedGoals =
    goals.filter(
      (goal) =>
        goal?.status ===
        "Closed"
    );


  // ==========================================================
  // OTHER / LEGACY GOALS
  // ==========================================================
  //
  // Protects the UI if older records contain
  // an unknown status.
  //
  // ==========================================================

  const otherGoals =
    goals.filter(
      (goal) =>
        ![
          "Active",
          "Paused",
          "Completed",
          "Closed",
        ].includes(
          goal?.status
        )
    );


  // ==========================================================
  // TOTAL CONTRIBUTED
  // ==========================================================

  const totalContributed =
    goals.reduce(
      (
        total,
        goal
      ) => {

        const amount =
          Number(
            goal?.totalContributed ??
            goal?.savedAmount ??
            0
          );


        return (
          total +
          (
            Number.isFinite(amount)
              ? amount
              : 0
          )
        );

      },
      0
    );


  // ==========================================================
  // TOTAL AVAILABLE GOAL FUNDS
  // ==========================================================
  //
  // This is the amount still recorded as being held
  // across all saving goals.
  //
  // ==========================================================

  const totalAvailableFunds =
    goals.reduce(
      (
        total,
        goal
      ) => {

        const contributed =
          Number(
            goal?.totalContributed ??
            goal?.savedAmount ??
            0
          );


        const withdrawn =
          Number(
            goal?.totalWithdrawn ??
            0
          );


        const calculatedAvailable =
          Math.max(
            (
              Number.isFinite(
                contributed
              )
                ? contributed
                : 0
            ) -
            (
              Number.isFinite(
                withdrawn
              )
                ? withdrawn
                : 0
            ),
            0
          );


        const storedAvailable =
          Number(
            goal?.availableGoalFund
          );


        const amount =
          Number.isFinite(
            storedAvailable
          )
            ? Math.max(
                storedAvailable,
                0
              )
            : calculatedAvailable;


        return (
          total +
          amount
        );

      },
      0
    );


  // ==========================================================
  // OPEN FORM
  // ==========================================================

  const handleOpenForm =
    () => {

      setShowGoalForm(
        true
      );

    };


  // ==========================================================
  // CLOSE FORM
  // ==========================================================

  const handleCloseForm =
    () => {

      setShowGoalForm(
        false
      );

    };


  // ==========================================================
  // GOAL CREATED
  // ==========================================================

  const handleGoalCreated =
    () => {

      setShowGoalForm(
        false
      );

    };


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div className="min-h-screen bg-[#f6f8f4]">


      {/* ======================================================
          SIDEBAR
         ====================================================== */}

      <Sidebar />


      {/* ======================================================
          MAIN PAGE
         ====================================================== */}

      <main className="ml-64 min-h-screen">


        {/* ====================================================
            TOPBAR
           ==================================================== */}

        <Topbar />


        {/* ====================================================
            PAGE CONTENT
           ==================================================== */}

        <div className="px-8 py-6">


          {/* ==================================================
              PAGE HEADER
             ================================================== */}

          <div className="flex flex-wrap items-start justify-between gap-4">


            {/* LEFT */}

            <div>


              <p className="text-sm font-medium text-[#5f7568]">
                FinanceOS
              </p>


              <h1 className="mt-1 text-2xl font-bold text-[#18392c]">
                Saving Goals
              </h1>


              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">

                Create financial targets, allocate savings,
                record where your goal money is held and
                track each goal from creation to completion.

              </p>


            </div>


            {/* CREATE GOAL */}

            <button
              type="button"
              onClick={
                handleOpenForm
              }
              className="flex items-center gap-2 rounded-xl bg-[#18392c] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#244c3b]"
            >

              <FiPlus />

              Create Goal

            </button>


          </div>


          {/* ==================================================
              SUMMARY
             ================================================== */}

          {goals.length > 0 && (

            <div className="mt-6 grid grid-cols-2 gap-3 xl:grid-cols-4">


              {/* TOTAL GOALS */}

              <SummaryCard
                icon={
                  <FiTarget />
                }
                label="Total Goals"
                value={
                  goals.length
                }
              />


              {/* ACTIVE */}

              <SummaryCard
                icon={
                  <FiActivity />
                }
                label="Active"
                value={
                  activeGoals.length
                }
                type="active"
              />


              {/* ACHIEVED */}

              <SummaryCard
                icon={
                  <FiCheckCircle />
                }
                label="Achieved"
                value={
                  completedGoals.length
                }
                type="completed"
              />


              {/* CLOSED */}

              <SummaryCard
                icon={
                  <FiArchive />
                }
                label="Closed"
                value={
                  closedGoals.length
                }
                type="closed"
              />


            </div>

          )}


          {/* ==================================================
              SAVING POSITION
             ================================================== */}

          {goals.length > 0 && (

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">


              {/* TOTAL CONTRIBUTED */}

              <MoneySummaryCard
                label="Total Goal Contributions"
                value={
                  totalContributed
                }
                description="Total amount recorded as contributed across your saving goals."
              />


              {/* AVAILABLE GOAL FUNDS */}

              <MoneySummaryCard
                label="Available Goal Funds"
                value={
                  totalAvailableFunds
                }
                description="Amount still recorded as available across your saving goals."
              />


            </div>

          )}


          {/* ==================================================
              EMPTY STATE
             ================================================== */}

          {goals.length === 0 && (

            <div className="mt-6 rounded-2xl border border-dashed border-[#dce5d7] bg-white px-8 py-14 text-center">


              {/* ICON */}

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#edf6e8] text-[#315c46]">

                <FiTarget className="text-2xl" />

              </div>


              {/* TITLE */}

              <h2 className="mt-4 text-base font-semibold text-[#18392c]">
                No saving goals yet
              </h2>


              {/* DESCRIPTION */}

              <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-slate-400">

                Create your first saving goal.

                FinanceOS will calculate the required
                contribution, check affordability and help
                you track the goal until the target is
                achieved.

              </p>


              {/* BUTTON */}

              <button
                type="button"
                onClick={
                  handleOpenForm
                }
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#18392c] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#244c3b]"
              >

                <FiPlus />

                Create First Goal

              </button>


            </div>

          )}


          {/* ==================================================
              ACTIVE GOALS
             ================================================== */}

          {activeGoals.length > 0 && (

            <GoalSection

              title="Active Goals"

              description="Goals currently being funded and included in your active monthly goal allocations."

              goals={
                activeGoals
              }

            />

          )}


          {/* ==================================================
              PAUSED GOALS
             ================================================== */}

          {pausedGoals.length > 0 && (

            <GoalSection

              title="Paused Goals"

              description="Goals temporarily paused and not currently included in active monthly goal allocations."

              goals={
                pausedGoals
              }

            />

          )}


          {/* ==================================================
              ACHIEVED GOALS
             ================================================== */}

          {completedGoals.length > 0 && (

            <GoalSection

              title="Achieved Goals"

              description="Goals that reached their target. Their recorded funds are available to use for the intended purpose."

              goals={
                completedGoals
              }

            />

          )}


          {/* ==================================================
              CLOSED GOALS
             ================================================== */}

          {closedGoals.length > 0 && (

            <GoalSection

              title="Closed Goals"

              description="Goals that were achieved and whose available funds have been fully used."

              goals={
                closedGoals
              }

            />

          )}


          {/* ==================================================
              OTHER / LEGACY GOALS
             ================================================== */}

          {otherGoals.length > 0 && (

            <GoalSection

              title="Goal History"

              description="Older goal records with a status outside the current FinanceOS goal lifecycle."

              goals={
                otherGoals
              }

            />

          )}


        </div>


      </main>


      {/* ======================================================
          CREATE GOAL MODAL
         ======================================================
         
         SavingGoalForm exists only while showGoalForm
         is true.
         
         Closing the modal completely removes the form
         component from the page.
         
         ====================================================== */}

      {showGoalForm && (

        <SavingGoalForm

          onClose={
            handleCloseForm
          }

          onSuccess={
            handleGoalCreated
          }

        />

      )}


    </div>

  );

}


// ============================================================
// 3. GOAL SECTION
// ============================================================

function GoalSection({
  title,
  description,
  goals,
}) {

  return (

    <section className="mt-8">


      {/* ======================================================
          SECTION HEADER
         ====================================================== */}

      <div className="mb-4 flex items-end justify-between gap-4">


        <div>


          <h2 className="text-base font-semibold text-[#18392c]">
            {title}
          </h2>


          <p className="mt-1 text-xs leading-5 text-slate-400">
            {description}
          </p>


        </div>


        {/* COUNT */}

        <span className="shrink-0 rounded-full border border-[#e2e8dc] bg-white px-3 py-1 text-[10px] font-semibold text-[#5f7568]">

          {goals.length}{" "}

          {goals.length === 1
            ? "Goal"
            : "Goals"}

        </span>


      </div>


      {/* ======================================================
          GOAL CARDS
         ====================================================== */}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">


        {goals.map(
          (
            goal,
            index
          ) => (

            <SavingGoalCard

              key={
                goal?.id ||
                `goal-${index}`
              }

              goal={
                goal
              }

            />

          )
        )}


      </div>


    </section>

  );

}


// ============================================================
// 4. SUMMARY CARD
// ============================================================

function SummaryCard({
  icon,
  label,
  value,
  type = "default",
}) {


  // ==========================================================
  // DEFAULT
  // ==========================================================

  let cardClass =
    "border-[#e2e8dc] bg-white";


  let iconClass =
    "bg-[#f4f7f1] text-[#52665b]";


  let labelClass =
    "text-slate-400";


  let valueClass =
    "text-[#18392c]";


  // ==========================================================
  // ACTIVE
  // ==========================================================

  if (
    type === "active"
  ) {

    cardClass =
      "border-[#dcebd4] bg-[#f7fbf4]";


    iconClass =
      "bg-[#eaf4e5] text-[#315c46]";


    labelClass =
      "text-[#6c8b72]";


    valueClass =
      "text-[#315c46]";

  }


  // ==========================================================
  // COMPLETED
  // ==========================================================

  if (
    type === "completed"
  ) {

    cardClass =
      "border-[#dcebd4] bg-white";


    iconClass =
      "bg-[#edf6e8] text-[#315c46]";


    labelClass =
      "text-[#6c8b72]";


    valueClass =
      "text-[#315c46]";

  }


  // ==========================================================
  // CLOSED
  // ==========================================================

  if (
    type === "closed"
  ) {

    cardClass =
      "border-slate-200 bg-slate-50";


    iconClass =
      "bg-white text-slate-500";


    labelClass =
      "text-slate-400";


    valueClass =
      "text-slate-600";

  }


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div
      className={`rounded-xl border p-4 ${cardClass}`}
    >


      <div className="flex items-center justify-between gap-3">


        {/* TEXT */}

        <div>


          <p
            className={`text-[11px] ${labelClass}`}
          >

            {label}

          </p>


          <p
            className={`mt-1 text-xl font-bold ${valueClass}`}
          >

            {value}

          </p>


        </div>


        {/* ICON */}

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl ${iconClass}`}
        >

          {icon}

        </div>


      </div>


    </div>

  );

}


// ============================================================
// 5. MONEY SUMMARY CARD
// ============================================================

function MoneySummaryCard({
  label,
  value,
  description,
}) {

  return (

    <div className="rounded-xl border border-[#e2e8dc] bg-white p-4">


      <p className="text-[11px] font-medium text-slate-400">

        {label}

      </p>


      <p className="mt-2 text-xl font-bold text-[#18392c]">

        ₹{formatMoney(
          value
        )}

      </p>


      <p className="mt-1 text-[10px] leading-4 text-slate-400">

        {description}

      </p>


    </div>

  );

}


// ============================================================
// 6. FORMAT MONEY
// ============================================================

function formatMoney(value) {

  const number =
    Number(
      value || 0
    );


  if (
    !Number.isFinite(number)
  ) {

    return "0";

  }


  return number.toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  );

}


// ============================================================
// 7. EXPORT
// ============================================================

export default SavingGoals;