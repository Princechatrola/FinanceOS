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
  FiZap,
  FiX,
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

  const latestAISuggestion =
    finance?.latestAISuggestion;

  // ==========================================================
  // AI SUGGESTION MODAL STATE
  // ==========================================================

  const [
    isAISuggestionModalOpen,
    setIsAISuggestionModalOpen,
  ] = useState(false);

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
    // AI SUGGESTION MODAL
    // ========================================================

    if (
      suggestion?.isAI ||
      action === "view-ai-suggestion"
    ) {
      setIsAISuggestionModalOpen(true);
      return;
    }

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
  // 0. PERSISTED AI SUGGESTION (FROM MONGODB)
  // ==========================================================

  if (latestAISuggestion) {
    suggestions.push({
      id: `ai-suggestion-${latestAISuggestion._id || latestAISuggestion.id || "latest"}`,
      isAI: true,
      type: "success",
      icon: FiZap,
      title: latestAISuggestion.title || "AI Financial Recommendation",
      description: latestAISuggestion.summary || "",
      category: "ai",
      priority: 200,
      actions: [
        {
          id: "view-ai-suggestion",
          label: "View Suggestion",
          primary: true,
        },
      ],
      rawAI: latestAISuggestion,
    });
  }


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

  const aiSuggestions =
    suggestions.filter(
      (s) => s.isAI
    );

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
        !suggestion.category && !suggestion.isAI
    );


  const visibleSuggestions = [
    ...aiSuggestions,
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

      {/* ======================================================
          AI SUGGESTION DETAILS MODAL
         ====================================================== */}

      <AISuggestionDetailsModal
        isOpen={isAISuggestionModalOpen}
        suggestion={latestAISuggestion}
        onClose={() => setIsAISuggestionModalOpen(false)}
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

          <div className="flex flex-wrap items-center gap-2">
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

            {suggestion?.isAI && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#315c46] px-2 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                <FiZap size={10} />
                AI Suggestion
              </span>
            )}
          </div>


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
// AI SUGGESTION DETAILS MODAL
// ============================================================

export function AISuggestionDetailsModal({ isOpen, suggestion, onClose }) {
  if (!isOpen || !suggestion) return null;

  const snapshot = suggestion.financialSnapshot || {};
  const external = suggestion.externalContext || {};
  const recommendations = Array.isArray(suggestion.recommendations) ? suggestion.recommendations : [];

  const getDecisionBadge = (decision = "CONSIDER") => {
    const d = String(decision).toUpperCase();
    if (d === "INVEST") {
      return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
    if (d === "DEBT_FIRST" || d === "AVOID_FOR_NOW") {
      return "bg-rose-100 text-rose-800 border-rose-200";
    }
    if (d === "SAVE_FIRST" || d === "HOLD_LIQUIDITY") {
      return "bg-amber-100 text-amber-800 border-amber-200";
    }
    if (d === "DIVERSIFY" || d === "INCREASE_EXISTING") {
      return "bg-teal-100 text-teal-800 border-teal-200";
    }
    return "bg-sky-100 text-sky-800 border-sky-200";
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#10251d]/60 p-4 sm:p-6 backdrop-blur-xs"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-[#dfe8dc] bg-[#f8faf7] shadow-[0_25px_70px_rgba(24,57,44,0.25)]"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#dfe8dc] bg-gradient-to-r from-[#18392c] via-[#315c46] to-[#426d55] px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white ring-1 ring-white/20">
              <FiZap size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#dceadd]">
                  {suggestion.category || "AI Strategy"}
                </span>
                {suggestion.overallHealth && (
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-semibold text-white">
                    Health: {suggestion.overallHealth}
                  </span>
                )}
                {suggestion.selectedMonth && (
                  <span className="rounded-full bg-emerald-500/30 px-2 py-0.5 text-[9px] font-semibold text-[#e2f4de]">
                    {suggestion.selectedMonth} Context
                  </span>
                )}
              </div>
              <h2 className="mt-0.5 text-lg font-bold text-white leading-snug">
                {suggestion.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-white/80 transition hover:bg-white/10 hover:text-white cursor-pointer"
          >
            <FiX size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Executive Summary */}
          <div className="rounded-2xl border border-[#dcebd4] bg-[#f4faef] p-4.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#6c8b72] mb-1">
              Executive Summary
            </p>
            <p className="text-xs sm:text-sm leading-6 font-medium text-[#18392c]">
              {suggestion.summary}
            </p>
          </div>

          {/* Structured Recommendations */}
          {recommendations.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-[#18392c]">
                  Personalized Allocation Decisions & Advice
                </p>
                <span className="text-[11px] text-slate-500">
                  {recommendations.length} strategy item{recommendations.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="space-y-3.5">
                {recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="rounded-2xl border border-[#e2e8dc] bg-white p-4 shadow-xs space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#18392c]">
                          {rec.title}
                        </span>
                        <span className="rounded-full bg-[#f0f4ee] px-2 py-0.5 text-[10px] font-semibold text-[#426150]">
                          {rec.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${getDecisionBadge(
                            rec.decision
                          )}`}
                        >
                          {rec.decision || "CONSIDER"}
                        </span>
                        {rec.priority && (
                          <span className="text-[10px] font-medium text-slate-400">
                            • {rec.priority} Priority
                          </span>
                        )}
                      </div>
                    </div>

                    {rec.message && (
                      <p className="text-xs leading-5 text-slate-700 font-medium">
                        {rec.message}
                      </p>
                    )}

                    <div className="rounded-xl bg-[#f8faf7] p-3 text-xs leading-5 text-slate-600 border border-[#edf1ea]">
                      <span className="font-bold text-[#18392c]">Why: </span>
                      {rec.reason}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#f0f4ed] text-xs">
                      {rec.suggestedAction && (
                        <div className="text-[11px] text-slate-500">
                          <span className="font-semibold text-[#315c46]">Action:</span> {rec.suggestedAction}
                        </div>
                      )}
                      {rec.suggestedAmount > 0 && (
                        <div className="text-[11px] font-bold text-[#18392c] bg-[#edf6e8] px-2.5 py-1 rounded-lg">
                          Suggested Allocation: ₹{rec.suggestedAmount.toLocaleString("en-IN")}
                        </div>
                      )}
                    </div>

                    {/* Numeric Facts with Verified Sources & Timestamps */}
                    {Array.isArray(rec.numericFacts) && rec.numericFacts.length > 0 && (
                      <div className="pt-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                          Verified External Benchmarks & Facts
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {rec.numericFacts.map((fact, fIdx) => (
                            <div
                              key={fIdx}
                              className="rounded-xl border border-[#e5ebe2] bg-[#fbfdfa] p-2.5 text-[11px]"
                            >
                              <div className="flex items-center justify-between text-slate-500">
                                <span>{fact.label}</span>
                                <span className="font-bold text-[#18392c]">
                                  {typeof fact.value === "number" ? `₹${fact.value.toLocaleString("en-IN")}` : fact.value} {fact.unit || ""}
                                </span>
                              </div>
                              <div className="mt-1 flex items-center justify-between text-[9px] text-slate-400">
                                <span>Source: {fact.source || "Official"}</span>
                                <span>As of: {fact.asOf || "Live"}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Key Observations */}
          {Array.isArray(suggestion.keyObservations) && suggestion.keyObservations.length > 0 && (
            <div>
              <p className="text-xs font-bold text-[#18392c] mb-2 uppercase tracking-wider">
                Key Observations Analyzed
              </p>
              <div className="space-y-2">
                {suggestion.keyObservations.map((obs, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 rounded-xl border border-[#e2e8dc] bg-white p-3 text-xs text-[#2e473a]"
                  >
                    <FiCheckCircle size={15} className="shrink-0 text-[#315c46] mt-0.5" />
                    <span>{obs}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Action Steps */}
          {Array.isArray(suggestion.actionSteps) && suggestion.actionSteps.length > 0 && (
            <div>
              <p className="text-xs font-bold text-[#18392c] mb-2 uppercase tracking-wider">
                Recommended Execution Steps
              </p>
              <div className="space-y-2">
                {suggestion.actionSteps.map((action, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-xl border border-[#dfe6da] bg-white p-3.5 shadow-xs"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#edf6e8] text-xs font-bold text-[#315c46]">
                      {action.step || idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-bold text-[#18392c]">
                          {action.title}
                        </p>
                        {action.priority && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                              String(action.priority).toLowerCase() === "high"
                                ? "bg-red-50 text-red-600 border border-red-100"
                                : String(action.priority).toLowerCase() === "medium"
                                ? "bg-amber-50 text-amber-700 border border-amber-100"
                                : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                            }`}
                          >
                            {action.priority}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {action.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Advice */}
          {suggestion.detailedAdvice && (
            <div className="rounded-2xl border border-[#e2e8dc] bg-white p-4.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#6c8b72] mb-1.5">
                Comprehensive Strategic Guidance
              </p>
              <p className="text-xs sm:text-sm leading-6 text-slate-600">
                {suggestion.detailedAdvice}
              </p>
            </div>
          )}

          {/* Financial Snapshot Summary */}
          {snapshot.income !== undefined && (
            <div className="rounded-2xl border border-[#dfe8dc] bg-[#f8faf7] p-4.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#6c8b72] mb-3">
                Analyzed User Financial Snapshot ({snapshot.targetPeriod || "Current"})
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="rounded-xl border border-[#e8ece5] bg-white p-2.5 text-center">
                  <p className="text-[10px] text-slate-400">Monthly Income</p>
                  <p className="mt-0.5 text-xs font-bold text-[#18392c]">
                    ₹{(snapshot.income || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e8ece5] bg-white p-2.5 text-center">
                  <p className="text-[10px] text-slate-400">Savings Rate</p>
                  <p className="mt-0.5 text-xs font-bold text-[#315c46]">
                    {snapshot.savingsRate || 0}%
                  </p>
                </div>
                <div className="rounded-xl border border-[#e8ece5] bg-white p-2.5 text-center">
                  <p className="text-[10px] text-slate-400">Available to Allocate</p>
                  <p className="mt-0.5 text-xs font-bold text-[#18392c]">
                    ₹{(snapshot.availableToAllocate || 0).toLocaleString("en-IN")}
                  </p>
                </div>
                <div className="rounded-xl border border-[#e8ece5] bg-white p-2.5 text-center">
                  <p className="text-[10px] text-slate-400">Current Net Worth</p>
                  <p className="mt-0.5 text-xs font-bold text-[#18392c]">
                    ₹{(snapshot.netWorth || 0).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* External Verified Benchmarks Info */}
          {external.rbiRepoRate && (
            <div className="rounded-2xl border border-[#e2ebd8] bg-[#fafcf9] p-4 text-[11px] text-slate-500 space-y-1.5">
              <p className="font-bold text-[#18392c] text-xs">Verified Reference Benchmarks</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-600">
                <div>24K Gold: <strong className="text-[#18392c]">₹{external.goldPricePerGram24K || 7450}/g</strong></div>
                <div>RBI Repo Rate: <strong className="text-[#18392c]">{external.rbiRepoRate}</strong></div>
                <div>Bank FD Range: <strong className="text-[#18392c]">{external.benchmarkFDRate}</strong></div>
                <div>CPI Inflation: <strong className="text-[#18392c]">{external.inflationRate}</strong></div>
              </div>
              <p className="text-[9px] text-slate-400 pt-1">
                Source: {external.source || "Official Reserve Bank of India & Bullion Market Feeds"}
              </p>
            </div>
          )}

          {/* Metadata Footer */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e6ebe5] pt-3 text-[10px] text-slate-400">
            <span>
              Generated on: {new Date(suggestion.createdAt || Date.now()).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
            <span>
              Engine: {suggestion.modelUsed ? `Gemini (${suggestion.modelUsed})` : "FinanceOS AI Adviser"}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 justify-end border-t border-[#dfe8dc] bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#d7e1d5] bg-white px-5 py-2.5 text-xs font-semibold text-[#52665b] transition hover:bg-[#f4f7f1] cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// EXPORT
// ============================================================

export default FinancialSuggestions;