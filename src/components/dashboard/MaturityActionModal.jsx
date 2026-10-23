// ============================================================
// FINANCEOS - MATURITY ACTION MODAL
// ============================================================
//
// Used when an investment or insurance plan matures.
//
// INVESTMENT:
//
// 1. Add maturity amount to Cash & Savings
// 2. Allocate maturity amount to an active Saving Goal
// 3. Reinvest maturity amount
//
// INSURANCE:
//
// 1. Add maturity amount to Cash & Savings
// 2. Allocate maturity amount to an active Saving Goal
//
// IMPORTANT:
//
// This component only collects the user's decision.
// Actual financial changes are handled by FinanceProvider.
//
// ============================================================

import {
  FiX,
  FiDollarSign,
  FiTarget,
  FiTrendingUp,
  FiCheckCircle,
} from "react-icons/fi";


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

function formatMoney(value) {

  return safeNumber(value).toLocaleString(
    "en-US",
    {
      maximumFractionDigits: 0,
    }
  );
}


// ============================================================
// MATURITY ACTION MODAL
// ============================================================

function MaturityActionModal({

  isOpen,

  item,

  itemType = "investment",

  savingGoals = [],

  onClose,

  onAddToSavings,

  onAllocateToGoal,

  onReinvest,

}) {


  // ==========================================================
  // DO NOT RENDER WHEN MODAL IS CLOSED
  // ==========================================================

  if (
    !isOpen ||
    !item
  ) {

    return null;

  }


  // ==========================================================
  // ITEM TYPE
  // ==========================================================

  const isInvestment =
    itemType === "investment";


  const isInsurance =
    itemType === "insurance";


  // ==========================================================
  // ITEM NAME
  // ==========================================================

  const itemName =
    item.name ||
    item.policyName ||
    item.investmentName ||
    item.type ||
    (
      isInsurance
        ? "Insurance Policy"
        : "Investment"
    );


  // ==========================================================
  // MATURITY AMOUNT
  // ==========================================================

  const maturityAmount =
    safeNumber(

      item.maturityAmount ??

      item.currentValue ??

      item.amount ??

      0

    );


  // ==========================================================
  // ACTIVE SAVING GOALS
  // ==========================================================
  //
  // Do not show:
  //
  // - Completed goals
  // - Settled goals
  // - Closed goals
  // - Paused goals
  // - Goals that already reached target
  //
  // ==========================================================

  const activeGoals =
    Array.isArray(
      savingGoals
    )

      ? savingGoals.filter(
          (goal) => {

            const status =
              String(
                goal?.status ||
                ""
              )
                .trim()
                .toLowerCase();


            const target =
              safeNumber(
                goal?.targetAmount
              );


            const saved =
              safeNumber(

                goal?.totalContributed ??

                goal?.savedAmount ??

                goal?.alreadySaved ??

                0

              );


            return (

              status !== "completed" &&

              status !== "settled" &&

              status !== "closed" &&

              status !== "paused" &&

              target > 0 &&

              saved < target

            );

          }
        )

      : [];


  // ==========================================================
  // ADD TO SAVINGS
  // ==========================================================

  const handleAddToSavings =
    () => {

      if (
        typeof onAddToSavings !==
        "function"
      ) {

        return;

      }


      onAddToSavings(
        item
      );

    };


  // ==========================================================
  // ALLOCATE TO GOAL
  // ==========================================================

  const handleAllocateToGoal =
    (goal) => {

      if (
        typeof onAllocateToGoal !==
        "function"
      ) {

        return;

      }


      onAllocateToGoal(
        item,
        goal
      );

    };


  // ==========================================================
  // REINVEST
  // ==========================================================

  const handleReinvest =
    () => {

      // Insurance does not use the investment
      // reinvest operation.

      if (
        !isInvestment
      ) {

        return;

      }


      if (
        typeof onReinvest !==
        "function"
      ) {

        return;

      }


      onReinvest(
        item
      );

    };


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div
      className="
        fixed
        inset-0
        z-[100]
        flex
        items-center
        justify-center
        bg-black/40
        px-4
        py-6
      "
    >


      {/* ======================================================
          MODAL
         ====================================================== */}

      <div
        className="
          max-h-[90vh]
          w-full
          max-w-lg
          overflow-y-auto
          rounded-2xl
          border
          border-[#e2e8dc]
          bg-white
          shadow-xl
        "
      >


        {/* ====================================================
            HEADER
           ==================================================== */}

        <div
          className="
            sticky
            top-0
            z-10
            flex
            items-start
            justify-between
            border-b
            border-[#edf0e9]
            bg-white
            px-6
            py-5
          "
        >


          <div className="pr-4">


            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.14em]
                text-[#6c8b72]
              "
            >

              Maturity Action

            </p>


            <h2
              className="
                mt-1
                text-lg
                font-semibold
                text-[#18392c]
              "
            >

              {itemName}

            </h2>


            <p
              className="
                mt-1
                text-xs
                leading-5
                text-slate-400
              "
            >

              Choose what you want to do with the matured money.

            </p>


          </div>


          {/* CLOSE BUTTON */}

          <button

            type="button"

            onClick={
              onClose
            }

            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-[#e5eadf]
              text-slate-400
              transition
              hover:bg-[#f7f9f4]
              hover:text-[#18392c]
            "

            aria-label="Close maturity action modal"

          >

            <FiX
              size={17}
            />

          </button>


        </div>


        {/* ====================================================
            BODY
           ==================================================== */}

        <div className="p-6">


          {/* ==================================================
              MATURITY AMOUNT
             ================================================== */}

          <div
            className="
              rounded-xl
              border
              border-[#dcebd4]
              bg-[#f7fbf4]
              p-4
            "
          >


            <p
              className="
                text-xs
                font-medium
                text-[#5f7568]
              "
            >

              Maturity Amount

            </p>


            <p
              className="
                mt-1
                text-2xl
                font-bold
                text-[#315c46]
              "
            >

              ₹{formatMoney(
                maturityAmount
              )}

            </p>


            <p
              className="
                mt-1
                text-[11px]
                leading-5
                text-slate-400
              "
            >

              FinanceOS will record where this money goes so the
              same maturity proceeds are not counted twice.

            </p>


          </div>


          {/* ==================================================
              ACTION 1
              ADD TO CASH & SAVINGS
             ================================================== */}

          <button

            type="button"

            onClick={
              handleAddToSavings
            }

            className="
              mt-4
              flex
              w-full
              items-center
              gap-4
              rounded-xl
              border
              border-[#dcebd4]
              p-4
              text-left
              transition
              hover:bg-[#f7fbf4]
            "
          >


            <div
              className="
                flex
                h-10
                w-10
                shrink-0
                items-center
                justify-center
                rounded-xl
                bg-[#edf6e8]
                text-[#315c46]
              "
            >

              <FiDollarSign
                size={18}
              />

            </div>


            <div
              className="
                min-w-0
                flex-1
              "
            >


              <p
                className="
                  text-sm
                  font-semibold
                  text-[#18392c]
                "
              >

                Add to Cash & Savings

              </p>


              <p
                className="
                  mt-1
                  text-xs
                  leading-5
                  text-slate-400
                "
              >

                Move ₹{formatMoney(
                  maturityAmount
                )} into your recorded cash and savings balance.

              </p>


            </div>


            <FiCheckCircle
              className="
                shrink-0
                text-[#6c8b72]
              "
              size={17}
            />


          </button>


          {/* ==================================================
              ACTION 2
              ALLOCATE TO SAVING GOAL
             ================================================== */}

          <div
            className="
              mt-3
              rounded-xl
              border
              border-[#e5eadf]
              p-4
            "
          >


            <div
              className="
                flex
                items-start
                gap-4
              "
            >


              <div
                className="
                  flex
                  h-10
                  w-10
                  shrink-0
                  items-center
                  justify-center
                  rounded-xl
                  bg-[#f7f9f3]
                  text-[#315c46]
                "
              >

                <FiTarget
                  size={18}
                />

              </div>


              <div
                className="
                  min-w-0
                  flex-1
                "
              >


                <p
                  className="
                    text-sm
                    font-semibold
                    text-[#18392c]
                  "
                >

                  Allocate to Saving Goal

                </p>


                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                    text-slate-400
                  "
                >

                  Assign the maturity proceeds toward one of
                  your active saving goals.

                </p>


              </div>


            </div>


            {/* =================================================
                ACTIVE GOALS
               ================================================= */}

            {

              activeGoals.length > 0

                ? (

                  <div
                    className="
                      mt-4
                      space-y-2
                    "
                  >


                    {

                      activeGoals.map(
                        (goal) => {


                          const target =
                            safeNumber(
                              goal.targetAmount
                            );


                          const saved =
                            safeNumber(

                              goal.totalContributed ??

                              goal.savedAmount ??

                              goal.alreadySaved ??

                              0

                            );


                          const remaining =
                            Math.max(
                              target -
                              saved,
                              0
                            );


                          return (

                            <button

                              key={
                                goal.id
                              }

                              type="button"

                              onClick={
                                () =>
                                  handleAllocateToGoal(
                                    goal
                                  )
                              }

                              className="
                                flex
                                w-full
                                items-center
                                justify-between
                                gap-4
                                rounded-lg
                                bg-[#f8faf7]
                                px-3
                                py-3
                                text-left
                                transition
                                hover:bg-[#edf6e8]
                              "
                            >


                              {/* GOAL INFO */}

                              <div
                                className="
                                  min-w-0
                                  flex-1
                                "
                              >


                                <p
                                  className="
                                    truncate
                                    text-xs
                                    font-semibold
                                    text-[#18392c]
                                  "
                                >

                                  {
                                    goal.name ||
                                    "Saving Goal"
                                  }

                                </p>


                                <p
                                  className="
                                    mt-1
                                    text-[10px]
                                    text-slate-400
                                  "
                                >

                                  ₹{formatMoney(
                                    saved
                                  )}

                                  {" / "}

                                  ₹{formatMoney(
                                    target
                                  )}

                                </p>


                              </div>


                              {/* REMAINING */}

                              <div
                                className="
                                  shrink-0
                                  text-right
                                "
                              >


                                <p
                                  className="
                                    text-[10px]
                                    text-slate-400
                                  "
                                >

                                  Remaining

                                </p>


                                <p
                                  className="
                                    mt-1
                                    text-xs
                                    font-semibold
                                    text-[#315c46]
                                  "
                                >

                                  ₹{formatMoney(
                                    remaining
                                  )}

                                </p>


                              </div>


                            </button>

                          );

                        }
                      )

                    }


                  </div>

                )

                : (

                  <div
                    className="
                      mt-4
                      rounded-lg
                      bg-[#f8faf7]
                      px-3
                      py-3
                    "
                  >


                    <p
                      className="
                        text-xs
                        leading-5
                        text-slate-400
                      "
                    >

                      You currently have no active saving goal
                      that can receive this money.

                    </p>


                  </div>

                )

            }


          </div>


          {/* ==================================================
              ACTION 3
              REINVEST

              IMPORTANT:
              Only matured investments show this action.

              Matured insurance policies do NOT use
              reinvestMaturedInvestment().
             ================================================== */}

          {

            isInvestment && (

              <button

                type="button"

                onClick={
                  handleReinvest
                }

                className="
                  mt-3
                  flex
                  w-full
                  items-center
                  gap-4
                  rounded-xl
                  border
                  border-[#e5eadf]
                  p-4
                  text-left
                  transition
                  hover:bg-[#f7f9f4]
                "
              >


                <div
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    bg-[#f7f9f3]
                    text-[#315c46]
                  "
                >

                  <FiTrendingUp
                    size={18}
                  />

                </div>


                <div
                  className="
                    min-w-0
                    flex-1
                  "
                >


                  <p
                    className="
                      text-sm
                      font-semibold
                      text-[#18392c]
                    "
                  >

                    Reinvest

                  </p>


                  <p
                    className="
                      mt-1
                      text-xs
                      leading-5
                      text-slate-400
                    "
                  >

                    Use ₹{formatMoney(
                      maturityAmount
                    )} as the starting amount for a new
                    investment.

                  </p>


                </div>


              </button>

            )

          }


          {/* ==================================================
              INSURANCE INFORMATION
             ================================================== */}

          {

            isInsurance && (

              <div
                className="
                  mt-3
                  rounded-xl
                  bg-[#f8faf7]
                  px-4
                  py-3
                "
              >

                <p
                  className="
                    text-[11px]
                    leading-5
                    text-[#5f7568]
                  "
                >

                  Insurance maturity proceeds can be moved to
                  Cash & Savings or allocated toward an active
                  saving goal.

                </p>

              </div>

            )

          }


        </div>


        {/* ====================================================
            FOOTER
           ==================================================== */}

        <div
          className="
            sticky
            bottom-0
            flex
            justify-end
            border-t
            border-[#edf0e9]
            bg-white
            px-6
            py-4
          "
        >


          <button

            type="button"

            onClick={
              onClose
            }

            className="
              rounded-lg
              border
              border-[#dfe5da]
              bg-white
              px-4
              py-2
              text-xs
              font-semibold
              text-[#52665b]
              transition
              hover:bg-[#f7f9f4]
            "
          >

            Cancel

          </button>


        </div>


      </div>


    </div>

  );

}


// ============================================================
// EXPORT
// ============================================================

export default MaturityActionModal;