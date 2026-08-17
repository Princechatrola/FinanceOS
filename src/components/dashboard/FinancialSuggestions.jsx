// ============================================================
// FINANCEOS - FINANCIAL SUGGESTIONS
// PART 1 OF 2
// ============================================================
//
// Smart financial guidance + lifecycle actions.
//
// Completed Goal:
// - Use Goal Money
// - Keep Saved
//
// Matured Investment:
// - Choose Action
//      -> Add to Cash & Savings
//      -> Allocate to Saving Goal
//      -> Reinvest
//
// Matured Insurance:
// - Choose Action
//      -> Add to Cash & Savings
//      -> Allocate to Saving Goal
//
// Completed Liability:
// - Mark Closed
//
// ============================================================

import {
  useState,
} from "react";


import {
  FiAlertTriangle,
  FiCheckCircle,
  FiDollarSign,
  FiTarget,
  FiTrendingUp,
  FiInfo,
  FiArchive,
  FiSliders,
} from "react-icons/fi";


import useFinance
  from "../../context/useFinance.js";


import MaturityActionModal
  from "./MaturityActionModal.jsx";


// ============================================================
// SAFE NUMBER
// ============================================================

function safeNumber(value) {

  const number =
    Number(value);


  return Number.isFinite(number)
    ? number
    : 0;
}


// ============================================================
// FORMAT MONEY
// ============================================================

function formatMoney(value) {

  return safeNumber(value)
    .toLocaleString(
      "en-US",
      {
        maximumFractionDigits: 0,
      }
    );
}


// ============================================================
// NORMALIZE STATUS
// ============================================================

function normalizeStatus(status) {

  return String(status || "")
    .trim()
    .toLowerCase();
}


// ============================================================
// FINANCIAL SUGGESTIONS
// ============================================================

function FinancialSuggestions() {


  // ==========================================================
  // FINANCE CONTEXT
  // ==========================================================

  const finance =
    useFinance();


  // ==========================================================
  // MATURITY MODAL STATE
  // ==========================================================

  const [
    maturityModal,
    setMaturityModal,
  ] = useState({

    isOpen: false,

    item: null,

    itemType: null,

  });


  // ==========================================================
  // MONTHLY FINANCE
  // ==========================================================

  const monthlyFinance =
    finance?.monthlyFinance || {};


  const income =
    safeNumber(
      monthlyFinance?.income
    );


  const expenses =
    safeNumber(
      monthlyFinance?.expenses
    );


  // ==========================================================
  // COMMITMENTS
  // ==========================================================

  const goalCommitment =
    safeNumber(
      finance?.goalMonthlyCommitment
    );


  const investmentCommitment =
    safeNumber(
      finance?.investmentMonthlyCommitment
    );


  const insuranceCommitment =
    safeNumber(
      finance?.insuranceMonthlyCommitment
    );


  const liabilityCommitment =
    safeNumber(
      finance?.liabilityMonthlyCommitment
    );


  const totalCommitments =
    goalCommitment +
    investmentCommitment +
    insuranceCommitment +
    liabilityCommitment;


  // ==========================================================
  // MONTHLY SAVINGS
  // ==========================================================

  const monthlySavings =
    income -
    expenses;


  // ==========================================================
  // REMAINING AFTER ALL COMMITMENTS
  // ==========================================================

  const remainingBalance =
    monthlySavings -
    totalCommitments;


  // ==========================================================
  // ARRAYS
  // ==========================================================

  const savingGoals =
    Array.isArray(
      finance?.savingGoals
    )
      ? finance.savingGoals
      : [];


  const investments =
    Array.isArray(
      finance?.investments
    )
      ? finance.investments
      : [];


  const insurancePolicies =
    Array.isArray(
      finance?.insurancePolicies
    )
      ? finance.insurancePolicies
      : [];


  const liabilities =
    Array.isArray(
      finance?.liabilities
    )
      ? finance.liabilities
      : [];


  // ==========================================================
  // CONTEXT ACTION FUNCTIONS
  // ==========================================================

  const settleSavingGoal =
    finance?.settleSavingGoal;


  const withdrawGoalFunds =
    finance?.withdrawGoalFunds;


  const settleInvestment =
    finance?.settleInvestment;


  const allocateMaturedInvestmentToGoal =
    finance?.allocateMaturedInvestmentToGoal;


  const reinvestMaturedInvestment =
    finance?.reinvestMaturedInvestment;


  const settleInsurance =
    finance?.settleInsurance;


  const allocateMaturedInsuranceToGoal =
    finance?.allocateMaturedInsuranceToGoal;


  const closeLiability =
    finance?.closeLiability;


  // ==========================================================
  // OPEN MATURITY MODAL
  // ==========================================================

  function openMaturityModal(
    item,
    itemType
  ) {

    if (!item) {
      return;
    }


    setMaturityModal({

      isOpen: true,

      item,

      itemType,

    });

  }


  // ==========================================================
  // CLOSE MATURITY MODAL
  // ==========================================================

  function closeMaturityModal() {

    setMaturityModal({

      isOpen: false,

      item: null,

      itemType: null,

    });

  }


  // ==========================================================
  // ADD MATURITY PROCEEDS TO SAVINGS
  // ==========================================================

  function handleAddMaturityToSavings(
    item
  ) {

    if (!item) {
      return;
    }


    // --------------------------------------------------------
    // INVESTMENT
    // --------------------------------------------------------

    if (
      maturityModal.itemType ===
      "investment"
    ) {

      if (
        typeof settleInvestment !==
        "function"
      ) {

        window.alert(
          "Investment settlement is not available."
        );

        return;
      }


      const amount =
        safeNumber(

          item.maturityAmount ??

          item.currentValue ??

          item.amount

        );


      const confirmed =
        window.confirm(
          `Add ₹${formatMoney(
            amount
          )} from this matured investment to Cash & Savings?`
        );


      if (!confirmed) {
        return;
      }


      const result =
        settleInvestment(
          item.id,
          "savings"
        );


      if (
        result?.success === false
      ) {

        window.alert(
          result.message ||
          "Unable to settle the investment."
        );

        return;
      }


      closeMaturityModal();

      return;
    }


    // --------------------------------------------------------
    // INSURANCE
    // --------------------------------------------------------

    if (
      maturityModal.itemType ===
      "insurance"
    ) {

      if (
        typeof settleInsurance !==
        "function"
      ) {

        window.alert(
          "Insurance settlement is not available."
        );

        return;
      }


      const amount =
        safeNumber(
          item.maturityAmount
        );


      const confirmed =
        window.confirm(
          `Add ₹${formatMoney(
            amount
          )} from this matured policy to Cash & Savings?`
        );


      if (!confirmed) {
        return;
      }


      const result =
        settleInsurance(
          item.id,
          "savings"
        );


      if (
        result?.success === false
      ) {

        window.alert(
          result.message ||
          "Unable to settle the insurance policy."
        );

        return;
      }


      closeMaturityModal();

    }

  }


  // ==========================================================
  // ALLOCATE MATURITY PROCEEDS TO SAVING GOAL
  // ==========================================================

  function handleAllocateMaturityToGoal(
    item,
    goal
  ) {

    if (
      !item ||
      !goal
    ) {
      return;
    }


    // --------------------------------------------------------
    // INVESTMENT -> GOAL
    // --------------------------------------------------------

    if (
      maturityModal.itemType ===
      "investment"
    ) {

      if (
        typeof allocateMaturedInvestmentToGoal !==
        "function"
      ) {

        window.alert(
          "Investment goal allocation is not available."
        );

        return;
      }


      const confirmed =
        window.confirm(
          `Allocate the matured proceeds from "${item.name || item.type || "Investment"}" toward "${goal.name || "Saving Goal"}"?`
        );


      if (!confirmed) {
        return;
      }


      const result =
        allocateMaturedInvestmentToGoal(
          item.id,
          goal.id
        );


      if (
        result?.success === false
      ) {

        window.alert(
          result.message ||
          "Unable to allocate the matured investment."
        );

        return;
      }


      if (result?.message) {

        window.alert(
          result.message
        );

      }


      closeMaturityModal();

      return;
    }


    // --------------------------------------------------------
    // INSURANCE -> GOAL
    // --------------------------------------------------------

    if (
      maturityModal.itemType ===
      "insurance"
    ) {

      if (
        typeof allocateMaturedInsuranceToGoal !==
        "function"
      ) {

        window.alert(
          "Insurance goal allocation is not available."
        );

        return;
      }


      const confirmed =
        window.confirm(
          `Allocate the maturity proceeds from "${item.name || item.type || "Insurance Policy"}" toward "${goal.name || "Saving Goal"}"?`
        );


      if (!confirmed) {
        return;
      }


      const result =
        allocateMaturedInsuranceToGoal(
          item.id,
          goal.id
        );


      if (
        result?.success === false
      ) {

        window.alert(
          result.message ||
          "Unable to allocate the insurance maturity proceeds."
        );

        return;
      }


      if (result?.message) {

        window.alert(
          result.message
        );

      }


      closeMaturityModal();

    }

  }


  // ==========================================================
  // REINVEST MATURITY PROCEEDS
  // ==========================================================

  function handleReinvestMaturity(
    item
  ) {

    if (!item) {
      return;
    }


    if (
      maturityModal.itemType !==
      "investment"
    ) {

      return;
    }


    if (
      typeof reinvestMaturedInvestment !==
      "function"
    ) {

      window.alert(
        "Investment reinvestment is not available."
      );

      return;
    }


    const maturityAmount =
      safeNumber(

        item.maturityAmount ??

        item.currentValue ??

        item.amount

      );


    const confirmed =
      window.confirm(
        `Reinvest ₹${formatMoney(
          maturityAmount
        )} from "${item.name || item.type || "Investment"}"?`
      );


    if (!confirmed) {
      return;
    }


    // --------------------------------------------------------
    // NEW INVESTMENT DATA
    //
    // For now we automatically create the new investment
    // from the matured investment.
    //
    // Later we can create a dedicated ReinvestmentModal
    // where the user selects:
    //
    // - Investment type
    // - Institution
    // - Duration
    // - Expected return
    // - New maturity date
    //
    // --------------------------------------------------------

    const result =
      reinvestMaturedInvestment(
        item.id,
        {

          name:
            `${item.name || item.type || "Investment"} - Reinvested`,

          type:
            item.type ||
            "Investment",

          monthlyContribution:
            0,

        }
      );


    if (
      result?.success === false
    ) {

      window.alert(
        result.message ||
        "Unable to reinvest the maturity proceeds."
      );

      return;
    }


    if (result?.message) {

      window.alert(
        result.message
      );

    }


    closeMaturityModal();

  }


  // ==========================================================
  // NORMAL SUGGESTION ACTION HANDLER
  // ==========================================================

  function handleAction(
    suggestion,
    action
  ) {


    // ========================================================
    // COMPLETED SAVING GOAL - KEEP SAVED
    // ========================================================

    if (
      suggestion.category ===
        "goal" &&
      action ===
        "keep-saved"
    ) {

      if (
        typeof settleSavingGoal !==
        "function"
      ) {

        window.alert(
          "Goal settlement is not available."
        );

        return;
      }


      const result =
        settleSavingGoal(
          suggestion.itemId
        );


      if (
        result?.success === false
      ) {

        window.alert(
          result.message ||
          "Unable to settle this goal."
        );

      }


      return;
    }


    // ========================================================
    // COMPLETED SAVING GOAL - USE MONEY
    // ========================================================

    if (
      suggestion.category ===
        "goal" &&
      action ===
        "use-money"
    ) {

      if (
        typeof withdrawGoalFunds !==
        "function"
      ) {

        window.alert(
          "Goal withdrawal is not available."
        );

        return;
      }


      const goal =
        savingGoals.find(
          (item) =>
            item.id ===
            suggestion.itemId
        );


      if (!goal) {

        window.alert(
          "Saving goal not found."
        );

        return;
      }


      const availableFund =
        Math.max(
          safeNumber(

            goal.availableGoalFund ??

            (
              safeNumber(
                goal.totalContributed ??
                goal.savedAmount
              ) -

              safeNumber(
                goal.totalWithdrawn
              )
            )

          ),
          0
        );


      if (
        availableFund <= 0
      ) {

        window.alert(
          "No goal funds are available to use."
        );

        return;
      }


      const confirmed =
        window.confirm(
          `Use ₹${formatMoney(
            availableFund
          )} from "${goal.name || "Saving Goal"}"?`
        );


      if (!confirmed) {
        return;
      }


      const result =
        withdrawGoalFunds(
          suggestion.itemId,
          {

            amount:
              availableFund,

            purpose:
              goal.name ||
              "Goal completed",

            note:
              "Goal money used after completion.",

            date:
              new Date()
                .toISOString()
                .slice(0, 10),

          }
        );


      if (
        result?.success === false
      ) {

        window.alert(
          result.message ||
          "Unable to use the goal money."
        );

      }


      return;
    }


    // ========================================================
    // MATURED INVESTMENT - OPEN MODAL
    // ========================================================

    if (
      suggestion.category ===
        "investment" &&
      action ===
        "choose-action"
    ) {

      const investment =
        investments.find(
          (item) =>
            item.id ===
            suggestion.itemId
        );


      if (!investment) {

        window.alert(
          "Investment not found."
        );

        return;
      }


      openMaturityModal(
        investment,
        "investment"
      );


      return;
    }


    // ========================================================
    // MATURED INSURANCE - OPEN MODAL
    // ========================================================

    if (
      suggestion.category ===
        "insurance" &&
      action ===
        "choose-action"
    ) {

      const policy =
        insurancePolicies.find(
          (item) =>
            item.id ===
            suggestion.itemId
        );


      if (!policy) {

        window.alert(
          "Insurance policy not found."
        );

        return;
      }


      openMaturityModal(
        policy,
        "insurance"
      );


      return;
    }


    // ========================================================
    // COMPLETED LIABILITY
    // ========================================================

    if (
      suggestion.category ===
        "liability" &&
      action ===
        "close"
    ) {

      if (
        typeof closeLiability !==
        "function"
      ) {

        window.alert(
          "Liability closing is not available."
        );

        return;
      }


      const result =
        closeLiability(
          suggestion.itemId
        );


      if (
        result?.success === false
      ) {

        window.alert(
          result.message ||
          "Unable to close this liability."
        );

      }


      return;
    }

  }


  // ==========================================================
  // SUGGESTIONS
  // ==========================================================

  const suggestions = [];


  // ==========================================================
  // 1. NO MONTHLY FINANCE DATA
  // ==========================================================

  if (
    income === 0 &&
    expenses === 0
  ) {

    suggestions.push({

      id:
        "setup-monthly-finance",

      type:
        "info",

      icon:
        FiInfo,

      title:
        "Set up your monthly finances",

      description:
        "Add your monthly income and expenses so FinanceOS can calculate your savings, commitments and available balance.",

      priority:
        100,

    });

  }


  // ==========================================================
  // 2. NEGATIVE MONTHLY SAVINGS
  // ==========================================================

  if (
    income > 0 &&
    monthlySavings < 0
  ) {

    suggestions.push({

      id:
        "negative-savings",

      type:
        "danger",

      icon:
        FiAlertTriangle,

      title:
        "Your expenses are higher than your income",

      description:
        `Your monthly expenses exceed your income by ₹${formatMoney(
          Math.abs(
            monthlySavings
          )
        )}. Review expenses before adding new financial commitments.`,

      priority:
        95,

    });

  }


  // ==========================================================
  // 3. COMMITMENTS EXCEED SAVINGS
  // ==========================================================

  if (
    income > 0 &&
    monthlySavings >= 0 &&
    remainingBalance < 0
  ) {

    suggestions.push({

      id:
        "commitment-overload",

      type:
        "danger",

      icon:
        FiAlertTriangle,

      title:
        "Your monthly commitments are too high",

      description:
        `Your current commitments exceed your available monthly savings by ₹${formatMoney(
          Math.abs(
            remainingBalance
          )
        )}. Consider reducing or pausing flexible commitments.`,

      priority:
        90,

    });

  }


  // ==========================================================
  // 4. SMALL POSITIVE BALANCE
  // ==========================================================

  if (
    income > 0 &&
    remainingBalance > 0 &&
    remainingBalance <= 5000
  ) {

    suggestions.push({

      id:
        "small-surplus",

      type:
        "money",

      icon:
        FiDollarSign,

      title:
        `₹${formatMoney(
          remainingBalance
        )} remains this month`,

      description:
        "Your expenses and planned commitments are covered. Consider keeping this amount available as additional cash reserve, or allocate part of it toward an active goal.",

      priority:
        70,

    });

  }


  // ==========================================================
  // 5. HEALTHY POSITIVE BALANCE
  // ==========================================================

  if (
    income > 0 &&
    remainingBalance > 5000
  ) {

    suggestions.push({

      id:
        "healthy-surplus",

      type:
        "success",

      icon:
        FiTrendingUp,

      title:
        `You have ₹${formatMoney(
          remainingBalance
        )} available`,

      description:
        "Your planned monthly expenses and commitments are covered. You may keep part as additional savings and consider allocating the rest toward an active goal or investment.",

      priority:
        65,

    });

  }


  // ==========================================================
  // 6. ACTIVE GOAL NEAR COMPLETION
  // ==========================================================

  savingGoals.forEach(
    (goal, index) => {

      const status =
        normalizeStatus(
          goal?.status
        );


      if (
        status === "completed" ||
        status === "settled" ||
        status === "closed"
      ) {

        return;

      }


      const targetAmount =
        safeNumber(
          goal?.targetAmount
        );


      const savedAmount =
        safeNumber(

          goal?.totalContributed ??

          goal?.savedAmount ??

          goal?.alreadySaved

        );


      if (
        targetAmount <= 0 ||
        savedAmount <= 0
      ) {

        return;

      }


      const progress =
        (
          savedAmount /
          targetAmount
        ) * 100;


      if (
        progress >= 80 &&
        progress < 100
      ) {

        const remaining =
          Math.max(
            targetAmount -
            savedAmount,
            0
          );


        suggestions.push({

          id:
            `goal-near-${goal?.id ?? index}`,

          type:
            "goal",

          icon:
            FiTarget,

          title:
            `${goal?.name || "Saving goal"} is almost complete`,

          description:
            `You have reached ${Math.min(
              progress,
              100
            ).toFixed(
              0
            )}% of this goal. ₹${formatMoney(
              remaining
            )} remains to reach the target.`,

          priority:
            75,

        });

      }

    }
  );


  // ==========================================================
  // PART 2 CONTINUES DIRECTLY BELOW THIS LINE
  // ==========================================================
    // ==========================================================
  // 7. COMPLETED SAVING GOALS
  // ==========================================================

  savingGoals.forEach(
    (goal, index) => {

      const status =
        normalizeStatus(
          goal?.status
        );


      if (
        status !== "completed"
      ) {
        return;
      }


      const totalContributed =
        safeNumber(

          goal?.totalContributed ??

          goal?.savedAmount ??

          0

        );


      const totalWithdrawn =
        safeNumber(
          goal?.totalWithdrawn
        );


      const availableFund =
        Math.max(
          safeNumber(
            goal?.availableGoalFund ??
            (
              totalContributed -
              totalWithdrawn
            )
          ),
          0
        );


      suggestions.push({

        id:
          `completed-goal-${goal?.id ?? index}`,

        category:
          "goal",

        itemId:
          goal?.id,

        type:
          "success",

        icon:
          FiCheckCircle,

        title:
          `${goal?.name || "Saving goal"} is complete`,

        description:
          availableFund > 0

            ? `You have ₹${formatMoney(
                availableFund
              )} available for this completed goal. You can use the money for the goal or keep it saved.`

            : "This saving goal has reached its target.",

        priority:
          88,

        actions:
          availableFund > 0

            ? [

                {
                  id:
                    "use-money",

                  label:
                    "Use Goal Money",

                  primary:
                    true,
                },

                {
                  id:
                    "keep-saved",

                  label:
                    "Keep Saved",

                  primary:
                    false,
                },

              ]

            : [

                {
                  id:
                    "keep-saved",

                  label:
                    "Keep Saved",

                  primary:
                    true,
                },

              ],

      });

    }
  );


  // ==========================================================
  // 8. MATURED INVESTMENTS
  // ==========================================================

  investments.forEach(
    (investment, index) => {

      const status =
        normalizeStatus(
          investment?.status
        );


      if (
        status !== "matured"
      ) {
        return;
      }


      const maturityAmount =
        safeNumber(

          investment?.maturityAmount ??

          investment?.currentValue ??

          investment?.amount ??

          0

        );


      suggestions.push({

        id:
          `matured-investment-${investment?.id ?? index}`,

        category:
          "investment",

        itemId:
          investment?.id,

        type:
          "money",

        icon:
          FiTrendingUp,

        title:
          `${investment?.name || investment?.type || "Investment"} has matured`,

        description:
          maturityAmount > 0

            ? `₹${formatMoney(
                maturityAmount
              )} is now available. Choose whether to move it to Cash & Savings, allocate it to an active saving goal, or reinvest it.`

            : "This investment has matured. Choose what you want to do with the maturity proceeds.",

        priority:
          92,

        actions: [

          {
            id:
              "choose-action",

            label:
              "Choose Action",

            primary:
              true,
          },

        ],

      });

    }
  );


  // ==========================================================
  // 9. MATURED INSURANCE POLICIES
  // ==========================================================

  insurancePolicies.forEach(
    (policy, index) => {

      const status =
        normalizeStatus(
          policy?.status
        );


      if (
        status !== "matured"
      ) {
        return;
      }


      const maturityAmount =
        safeNumber(
          policy?.maturityAmount
        );


      suggestions.push({

        id:
          `matured-insurance-${policy?.id ?? index}`,

        category:
          "insurance",

        itemId:
          policy?.id,

        type:
          "money",

        icon:
          FiArchive,

        title:
          `${policy?.name || policy?.policyName || policy?.type || "Insurance policy"} has matured`,

        description:
          maturityAmount > 0

            ? `₹${formatMoney(
                maturityAmount
              )} in maturity proceeds is available. You can move it to Cash & Savings or allocate it toward an active saving goal.`

            : "This insurance policy has matured. Choose where the maturity proceeds should go.",

        priority:
          91,

        actions: [

          {
            id:
              "choose-action",

            label:
              "Choose Action",

            primary:
              true,
          },

        ],

      });

    }
  );


  // ==========================================================
  // 10. COMPLETED LIABILITIES
  // ==========================================================

  liabilities.forEach(
    (liability, index) => {

      const status =
        normalizeStatus(
          liability?.status
        );


      const remainingAmount =
        Math.max(
          safeNumber(
            liability?.remainingAmount
          ),
          0
        );


      // -------------------------------------------------------
      // Show close action when:
      //
      // 1. Status is Completed
      // OR
      // 2. Balance is zero but it has not been closed yet
      // -------------------------------------------------------

      const canClose =
        status !== "closed" &&
        (
          status === "completed" ||
          remainingAmount <= 0
        );


      if (!canClose) {
        return;
      }


      suggestions.push({

        id:
          `completed-liability-${liability?.id ?? index}`,

        category:
          "liability",

        itemId:
          liability?.id,

        type:
          "success",

        icon:
          FiCheckCircle,

        title:
          `${liability?.name || liability?.type || "Liability"} is fully paid`,

        description:
          "The outstanding balance is zero. Close this liability so it no longer appears as an active financial commitment.",

        priority:
          86,

        actions: [

          {
            id:
              "close",

            label:
              "Mark Closed",

            primary:
              true,
          },

        ],

      });

    }
  );


  // ==========================================================
  // 11. HIGH COMMITMENT RATIO
  // ==========================================================

  if (
    income > 0 &&
    totalCommitments > 0
  ) {

    const commitmentRatio =
      (
        totalCommitments /
        income
      ) * 100;


    if (
      commitmentRatio >= 60 &&
      remainingBalance >= 0
    ) {

      suggestions.push({

        id:
          "high-commitment-ratio",

        type:
          "warning",

        icon:
          FiSliders,

        title:
          "A large part of your income is committed",

        description:
          `${commitmentRatio.toFixed(
            0
          )}% of your monthly income is currently assigned to goals, investments, insurance and liabilities. Keep enough unallocated money available for unexpected expenses.`,

        priority:
          68,

      });

    }

  }


  // ==========================================================
  // 12. NO ACTIVE GOALS
  // ==========================================================

  const activeGoals =
    savingGoals.filter(
      (goal) => {

        const status =
          normalizeStatus(
            goal?.status
          );


        const target =
          safeNumber(
            goal?.targetAmount
          );


        const contributed =
          safeNumber(

            goal?.totalContributed ??

            goal?.savedAmount ??

            0

          );


        return (
          status !== "completed" &&
          status !== "settled" &&
          status !== "closed" &&
          status !== "paused" &&
          target > 0 &&
          contributed < target
        );

      }
    );


  if (
    income > 0 &&
    remainingBalance > 0 &&
    activeGoals.length === 0
  ) {

    suggestions.push({

      id:
        "no-active-goals",

      type:
        "info",

      icon:
        FiTarget,

      title:
        "You have room for a saving goal",

      description:
        `After your current expenses and commitments, ₹${formatMoney(
          remainingBalance
        )} remains available. Consider creating a saving goal if you have a planned future purchase or financial target.`,

      priority:
        45,

    });

  }


  // ==========================================================
  // SORT SUGGESTIONS
  // ==========================================================

  suggestions.sort(
    (first, second) =>
      safeNumber(
        second.priority
      ) -
      safeNumber(
        first.priority
      )
  );


  // ==========================================================
  // LIMIT DASHBOARD SUGGESTIONS
  // ==========================================================
  //
  // Lifecycle suggestions are important, so keep more cards
  // available when a matured/completed item requires action.
  //
  // ==========================================================

  const lifecycleSuggestions =
    suggestions.filter(
      (suggestion) =>
        suggestion.category === "goal" ||
        suggestion.category === "investment" ||
        suggestion.category === "insurance" ||
        suggestion.category === "liability"
    );


  const generalSuggestions =
    suggestions.filter(
      (suggestion) =>
        !suggestion.category
    );


  const visibleSuggestions = [

    ...lifecycleSuggestions,

    ...generalSuggestions,

  ].slice(
    0,
    6
  );


  // ==========================================================
  // EMPTY STATE
  // ==========================================================

  if (
    visibleSuggestions.length === 0
  ) {

    visibleSuggestions.push({

      id:
        "financial-position-ok",

      type:
        "success",

      icon:
        FiCheckCircle,

      title:
        "Your current financial plan looks balanced",

      description:
        "FinanceOS does not detect any immediate action from your current monthly finance, goals, investments, insurance or liabilities.",

      priority:
        1,

    });

  }


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <>

      <section
        className="
          rounded-2xl
          border
          border-[#e2e8dc]
          bg-white
          p-5
        "
      >


        {/* ====================================================
            HEADER
           ==================================================== */}

        <div
          className="
            flex
            items-start
            justify-between
            gap-4
          "
        >


          <div>


            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-[0.14em]
                text-[#6c8b72]
              "
            >

              Smart Guidance

            </p>


            <h2
              className="
                mt-1
                text-base
                font-semibold
                text-[#18392c]
              "
            >

              Financial Suggestions

            </h2>


            <p
              className="
                mt-1
                max-w-2xl
                text-xs
                leading-5
                text-slate-400
              "
            >

              Suggestions are generated from your monthly
              finances, commitments, goals and financial-plan
              lifecycle.

            </p>


          </div>


          {/* ==================================================
              REMAINING BALANCE
             ================================================== */}

          {

            income > 0 && (

              <div
                className="
                  shrink-0
                  rounded-xl
                  bg-[#f7fbf4]
                  px-4
                  py-3
                  text-right
                "
              >


                <p
                  className="
                    text-[9px]
                    font-semibold
                    uppercase
                    tracking-[0.12em]
                    text-[#6c8b72]
                  "
                >

                  After Everything

                </p>


                <p
                  className={`
                    mt-1
                    text-sm
                    font-bold

                    ${
                      remainingBalance >= 0

                        ? "text-[#315c46]"

                        : "text-red-600"
                    }
                  `}
                >

                  {
                    remainingBalance < 0
                      ? "-"
                      : ""
                  }

                  ₹{formatMoney(
                    Math.abs(
                      remainingBalance
                    )
                  )}

                </p>


              </div>

            )

          }


        </div>


        {/* ====================================================
            SUGGESTION CARDS
           ==================================================== */}

        <div
          className="
            mt-5
            space-y-3
          "
        >


          {

            visibleSuggestions.map(
              (suggestion) => (

                <SuggestionCard

                  key={
                    suggestion.id
                  }

                  suggestion={
                    suggestion
                  }

                  onAction={
                    handleAction
                  }

                />

              )
            )

          }


        </div>


        {/* ====================================================
            GUIDANCE NOTE
           ==================================================== */}

        <div
          className="
            mt-4
            rounded-xl
            bg-[#f8faf7]
            px-4
            py-3
          "
        >

          <p
            className="
              text-[10px]
              leading-5
              text-[#6c8b72]
            "
          >

            FinanceOS suggestions are guidance based on the
            financial information recorded in your account.
            They do not automatically move money unless you
            select and confirm a lifecycle action.

          </p>

        </div>


      </section>


      {/* ======================================================
          MATURITY ACTION MODAL
         ====================================================== */}

      <MaturityActionModal

        isOpen={
          maturityModal.isOpen
        }

        item={
          maturityModal.item
        }

        itemType={
          maturityModal.itemType ||
          "investment"
        }

        savingGoals={
          savingGoals
        }

        onClose={
          closeMaturityModal
        }

        onAddToSavings={
          handleAddMaturityToSavings
        }

        onAllocateToGoal={
          handleAllocateMaturityToGoal
        }

        onReinvest={
          handleReinvestMaturity
        }

      />

    </>

  );

}


// ============================================================
// SUGGESTION CARD
// ============================================================

function SuggestionCard({
  suggestion,
  onAction,
}) {


  // ==========================================================
  // ICON
  // ==========================================================

  const Icon =
    suggestion?.icon ||
    FiInfo;


  // ==========================================================
  // TYPE
  // ==========================================================

  const type =
    suggestion?.type ||
    "info";


  // ==========================================================
  // STYLE
  // ==========================================================

  const styles = {

    danger: {
      wrapper:
        "border-red-100 bg-red-50/50",

      icon:
        "bg-red-100 text-red-600",
    },

    warning: {
      wrapper:
        "border-amber-100 bg-amber-50/40",

      icon:
        "bg-amber-100 text-amber-700",
    },

    success: {
      wrapper:
        "border-[#dcebd4] bg-[#f7fbf4]",

      icon:
        "bg-[#e8f4e2] text-[#315c46]",
    },

    money: {
      wrapper:
        "border-[#dcebd4] bg-white",

      icon:
        "bg-[#edf6e8] text-[#315c46]",
    },

    goal: {
      wrapper:
        "border-[#e2e8dc] bg-white",

      icon:
        "bg-[#f2f6ee] text-[#315c46]",
    },

    info: {
      wrapper:
        "border-[#e2e8dc] bg-[#fafbf9]",

      icon:
        "bg-[#f0f3ed] text-[#5f7568]",
    },

  };


  const selectedStyle =
    styles[type] ||
    styles.info;


  // ==========================================================
  // ACTIONS
  // ==========================================================

  const actions =
    Array.isArray(
      suggestion?.actions
    )
      ? suggestion.actions
      : [];


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <div
      className={`
        rounded-xl
        border
        p-4
        ${selectedStyle.wrapper}
      `}
    >


      <div
        className="
          flex
          items-start
          gap-3
        "
      >


        {/* ====================================================
            ICON
           ==================================================== */}

        <div
          className={`
            flex
            h-9
            w-9
            shrink-0
            items-center
            justify-center
            rounded-xl
            ${selectedStyle.icon}
          `}
        >

          <Icon
            size={17}
          />

        </div>


        {/* ====================================================
            CONTENT
           ==================================================== */}

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

            {
              suggestion?.title ||
              "Financial suggestion"
            }

          </p>


          <p
            className="
              mt-1
              text-xs
              leading-5
              text-slate-500
            "
          >

            {
              suggestion?.description ||
              ""
            }

          </p>


          {/* ==================================================
              ACTION BUTTONS
             ================================================== */}

          {

            actions.length > 0 && (

              <div
                className="
                  mt-3
                  flex
                  flex-wrap
                  gap-2
                "
              >


                {

                  actions.map(
                    (action) => (

                      <button

                        key={
                          action.id
                        }

                        type="button"

                        onClick={
                          () =>
                            onAction?.(
                              suggestion,
                              action.id
                            )
                        }

                        className={`
                          rounded-lg
                          px-3
                          py-2
                          text-[11px]
                          font-semibold
                          transition

                          ${
                            action.primary

                              ? `
                                bg-[#315c46]
                                text-white
                                hover:bg-[#274c3a]
                              `

                              : `
                                border
                                border-[#dfe5da]
                                bg-white
                                text-[#52665b]
                                hover:bg-[#f7f9f4]
                              `
                          }
                        `}
                      >

                        {
                          action.label
                        }

                      </button>

                    )
                  )

                }


              </div>

            )

          }


        </div>


      </div>


    </div>

  );

}


// ============================================================
// EXPORT
// ============================================================

export default FinancialSuggestions;