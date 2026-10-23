// ============================================================
// FINANCEOS - PLAN TYPE SELECTOR
// ============================================================
//
// Purpose:
//
// Before showing a form, FinanceOS asks the user what kind of
// financial plan or commitment they want to add.
//
// Categories:
//
// 1. Investment
// 2. Insurance
// 3. Liability
//
// The parent component controls the selected type.
//
// Example:
//
// selectedType = "investment"
//
// Later:
//
// investment
//      ↓
// InvestmentForm
//
// insurance
//      ↓
// InsuranceForm
//
// liability
//      ↓
// LiabilityForm
// ============================================================


import {
  FiTrendingUp,
  FiShield,
  FiCreditCard,
  FiX,
} from "react-icons/fi";


// ============================================================
// PLAN TYPE SELECTOR
// ============================================================

function PlanTypeSelector({
  onSelect,
  onClose,
}) {


  // ==========================================================
  // AVAILABLE TYPES
  // ==========================================================

  const planTypes = [

    {
      id: "investment",

      title: "Investment",

      description:
        "Track SIPs, mutual funds, fixed deposits, recurring deposits, gold and other investments.",

      examples:
        "SIP • Mutual Fund • FD • RD • Gold",

      icon:
        FiTrendingUp,
    },


    {
      id: "insurance",

      title: "Insurance",

      description:
        "Track insurance policies, premium schedules and important policy dates.",

      examples:
        "Life Insurance • Health Insurance • Other",

      icon:
        FiShield,
    },


    {
      id: "liability",

      title: "Liability",

      description:
        "Track loans, EMIs, outstanding balances and other financial obligations.",

      examples:
        "Home Loan • Vehicle Loan • Personal Loan • Credit Card",

      icon:
        FiCreditCard,
    },

  ];


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 p-4 pointer-events-auto">


      {/* ======================================================
          MODAL
         ====================================================== */}

      <div className="relative z-[10000] w-full max-w-3xl rounded-2xl border border-[#e2e8dc] bg-white shadow-xl pointer-events-auto">


        {/* ====================================================
            HEADER
           ==================================================== */}

        <div className="flex items-start justify-between border-b border-[#edf0e9] px-6 py-5">


          <div>

            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6c8b72]">
              FinanceOS
            </p>


            <h2 className="mt-1 text-lg font-bold text-[#18392c]">
              Add Plan / Commitment
            </h2>


            <p className="mt-1 text-xs leading-5 text-slate-400">

              Choose the type of financial record you want
              FinanceOS to track.

            </p>

          </div>


          {/* CLOSE */}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-[#f4f7f1] hover:text-[#18392c]"
          >
            <FiX className="text-lg" />
          </button>


        </div>


        {/* ====================================================
            TYPES
           ==================================================== */}

        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3">


          {planTypes.map((type) => {


            const Icon =
              type.icon;


            return (

              <button
                key={type.id}
                type="button"

                onClick={() =>
                  onSelect(type.id)
                }

                className="group rounded-2xl border border-[#e2e8dc] bg-[#fafcf8] p-5 text-left transition hover:-translate-y-0.5 hover:border-[#aac59a] hover:bg-[#f6fbf2] hover:shadow-sm"
              >


                {/* ICON */}

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9f4e2] text-[#315c46] transition group-hover:bg-[#dff0d4]">

                  <Icon className="text-xl" />

                </div>


                {/* TITLE */}

                <h3 className="mt-4 text-sm font-bold text-[#18392c]">
                  {type.title}
                </h3>


                {/* DESCRIPTION */}

                <p className="mt-2 min-h-[60px] text-xs leading-5 text-slate-500">
                  {type.description}
                </p>


                {/* EXAMPLES */}

                <div className="mt-4 border-t border-[#e7ece3] pt-3">

                  <p className="text-[10px] font-medium leading-5 text-[#6c8b72]">
                    {type.examples}
                  </p>

                </div>


                {/* SELECT */}

                <div className="mt-4">

                  <span className="text-xs font-semibold text-[#315c46]">
                    Select {type.title} →
                  </span>

                </div>


              </button>

            );

          })}


        </div>


      </div>


    </div>

  );

}


// ============================================================
// EXPORT
// ============================================================

export default PlanTypeSelector;