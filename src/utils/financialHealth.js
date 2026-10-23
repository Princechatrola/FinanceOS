// ============================================================
// FINANCEOS - FINANCIAL HEALTH SCORE
// ============================================================
//
// PURPOSE:
//
// Calculate a user's Financial Health Score from 0 to 100.
//
// The score is based on:
//
// 1. Savings Health          = 30 points
// 2. Expense Control        = 25 points
// 3. Commitment Load        = 25 points
// 4. Allocation Capacity    = 20 points
//
// TOTAL                     = 100 points
//
// IMPORTANT:
//
// The score uses financial ratios rather than absolute income.
//
// Example:
//
// A user earning ₹30,000 should not automatically receive a
// worse score than someone earning ₹1,00,000.
//
// What matters is how income is being used.
//
// ============================================================


// ============================================================
// HELPER - LIMIT VALUE
// ============================================================

function clamp(
  value,
  minimum,
  maximum
) {

  return Math.min(
    Math.max(
      value,
      minimum
    ),
    maximum
  );

}


// ============================================================
// HELPER - SAFE NUMBER
// ============================================================

function safeNumber(
  value
) {

  const number =
    Number(
      value
    );


  if (
    !Number.isFinite(
      number
    )
  ) {

    return 0;

  }


  return number;

}


// ============================================================
// 1. SAVINGS HEALTH SCORE
// ============================================================
//
// Maximum = 30
//
// Savings Rate:
//
// savings / income × 100
//
// Scoring:
//
// 30%+       = 30
// 25–29.99%  = 27
// 20–24.99%  = 24
// 15–19.99%  = 20
// 10–14.99%  = 15
// 5–9.99%    = 8
// 0–4.99%    = 3
// Negative    = 0
//
// ============================================================

function calculateSavingsScore(
  savingsRate
) {

  if (
    savingsRate >= 30
  ) {

    return 30;

  }


  if (
    savingsRate >= 25
  ) {

    return 27;

  }


  if (
    savingsRate >= 20
  ) {

    return 24;

  }


  if (
    savingsRate >= 15
  ) {

    return 20;

  }


  if (
    savingsRate >= 10
  ) {

    return 15;

  }


  if (
    savingsRate >= 5
  ) {

    return 8;

  }


  if (
    savingsRate >= 0
  ) {

    return 3;

  }


  return 0;

}


// ============================================================
// 2. EXPENSE CONTROL SCORE
// ============================================================
//
// Maximum = 25
//
// Expense Ratio:
//
// expenses / income × 100
//
// Lower expense ratio receives a higher score.
//
// Scoring:
//
// <= 50%       = 25
// 50.01–60%    = 22
// 60.01–70%    = 18
// 70.01–80%    = 13
// 80.01–90%    = 7
// 90.01–100%   = 3
// > 100%       = 0
//
// ============================================================

function calculateExpenseScore(
  expenseRatio
) {

  if (
    expenseRatio <= 50
  ) {

    return 25;

  }


  if (
    expenseRatio <= 60
  ) {

    return 22;

  }


  if (
    expenseRatio <= 70
  ) {

    return 18;

  }


  if (
    expenseRatio <= 80
  ) {

    return 13;

  }


  if (
    expenseRatio <= 90
  ) {

    return 7;

  }


  if (
    expenseRatio <= 100
  ) {

    return 3;

  }


  return 0;

}


// ============================================================
// 3. COMMITMENT LOAD SCORE
// ============================================================
//
// Maximum = 25
//
// Commitment Ratio:
//
// monthly commitments / income × 100
//
// Commitments include:
//
// - Goal allocations
// - Loan / liability payments
// - Recurring investments
// - Insurance monthly equivalent
//
// Lower commitment pressure generally means greater
// financial flexibility.
//
// Scoring:
//
// <= 20%       = 25
// 20.01–30%    = 22
// 30.01–40%    = 18
// 40.01–50%    = 13
// 50.01–60%    = 7
// 60.01–75%    = 3
// > 75%        = 0
//
// ============================================================

function calculateCommitmentScore(
  commitmentRatio
) {

  if (
    commitmentRatio <= 20
  ) {

    return 25;

  }


  if (
    commitmentRatio <= 30
  ) {

    return 22;

  }


  if (
    commitmentRatio <= 40
  ) {

    return 18;

  }


  if (
    commitmentRatio <= 50
  ) {

    return 13;

  }


  if (
    commitmentRatio <= 60
  ) {

    return 7;

  }


  if (
    commitmentRatio <= 75
  ) {

    return 3;

  }


  return 0;

}


// ============================================================
// 4. ALLOCATION CAPACITY SCORE
// ============================================================
//
// Maximum = 20
//
// Allocation Ratio:
//
// availableToAllocate / income × 100
//
// This measures how much monthly income remains flexible
// AFTER:
//
// Expenses
// +
// Existing Commitments
//
// Scoring:
//
// >= 20%       = 20
// 15–19.99%    = 17
// 10–14.99%    = 14
// 5–9.99%      = 10
// 0–4.99%      = 5
// Negative      = 0
//
// ============================================================

function calculateAllocationScore(
  allocationRatio
) {

  if (
    allocationRatio >= 20
  ) {

    return 20;

  }


  if (
    allocationRatio >= 15
  ) {

    return 17;

  }


  if (
    allocationRatio >= 10
  ) {

    return 14;

  }


  if (
    allocationRatio >= 5
  ) {

    return 10;

  }


  if (
    allocationRatio >= 0
  ) {

    return 5;

  }


  return 0;

}


// ============================================================
// GET HEALTH STATUS
// ============================================================
//
// Score:
//
// 80–100 = Excellent
// 65–79  = Good
// 50–64  = Fair
// 35–49  = Needs Attention
// 0–34   = Critical
//
// ============================================================

function getHealthStatus(
  score
) {

  if (
    score >= 80
  ) {

    return {
      label:
        "Excellent",

      level:
        "excellent",
    };

  }


  if (
    score >= 65
  ) {

    return {
      label:
        "Good",

      level:
        "good",
    };

  }


  if (
    score >= 50
  ) {

    return {
      label:
        "Fair",

      level:
        "fair",
    };

  }


  if (
    score >= 35
  ) {

    return {
      label:
        "Needs Attention",

      level:
        "attention",
    };

  }


  return {
    label:
      "Critical",

    level:
      "critical",
  };

}


// ============================================================
// GENERATE INSIGHTS
// ============================================================
//
// These are rule-based explanations.
//
// Later the AI Advisor can use the calculated health result
// to provide richer personalized guidance.
//
// ============================================================

function generateHealthInsights({

  income,

  savingsRate,

  expenseRatio,

  commitmentRatio,

  allocationRatio,

  availableToAllocate,

}) {

  const insights = [];


  // ==========================================================
  // NO INCOME DATA
  // ==========================================================

  if (
    income <= 0
  ) {

    insights.push(
      "Add your monthly income to calculate a meaningful financial health score."
    );


    return insights;

  }


  // ==========================================================
  // SAVINGS
  // ==========================================================

  if (
    savingsRate >= 20
  ) {

    insights.push(
      "Your current savings rate is strong relative to your monthly income."
    );

  }

  else if (
    savingsRate >= 10
  ) {

    insights.push(
      "You are saving part of your income, but increasing the savings margin could improve financial flexibility."
    );

  }

  else if (
    savingsRate >= 0
  ) {

    insights.push(
      "Your current savings margin is low compared with your monthly income."
    );

  }

  else {

    insights.push(
      "Your monthly expenses currently exceed your monthly income."
    );

  }


  // ==========================================================
  // EXPENSES
  // ==========================================================

  if (
    expenseRatio > 80
  ) {

    insights.push(
      "A large portion of your income is being used for monthly expenses."
    );

  }

  else if (
    expenseRatio <= 60
  ) {

    insights.push(
      "Your current expense level leaves a meaningful portion of income available after expenses."
    );

  }


  // ==========================================================
  // COMMITMENTS
  // ==========================================================

  if (
    commitmentRatio > 60
  ) {

    insights.push(
      "Existing financial commitments are creating high pressure on your monthly income."
    );

  }

  else if (
    commitmentRatio > 40
  ) {

    insights.push(
      "A significant portion of your income is already allocated to financial commitments."
    );

  }

  else if (
    commitmentRatio <= 30
  ) {

    insights.push(
      "Your current commitment load remains relatively manageable compared with your income."
    );

  }


  // ==========================================================
  // AVAILABLE CAPACITY
  // ==========================================================

  if (
    availableToAllocate < 0
  ) {

    insights.push(
      "Your existing commitments exceed the amount currently available from monthly savings."
    );

  }

  else if (
    allocationRatio >= 15
  ) {

    insights.push(
      "You currently retain useful monthly capacity after expenses and existing commitments."
    );

  }

  else if (
    allocationRatio >= 0
  ) {

    insights.push(
      "Your remaining allocation capacity is limited, so additional commitments should be evaluated carefully."
    );

  }


  // ==========================================================
  // LIMIT DASHBOARD INSIGHTS
  // ==========================================================

  return insights.slice(
    0,
    4
  );

}


// ============================================================
// MAIN FINANCIAL HEALTH CALCULATION
// ============================================================
//
// INPUT:
//
// income
// expenses
// totalCommitments
// availableToAllocate
//
// OUTPUT:
//
// {
//    score: 82,
//    status: "Excellent",
//    level: "excellent",
//
//    ratios: {...},
//
//    breakdown: {...},
//
//    insights: [...]
// }
//
// ============================================================

export function calculateFinancialHealth({

  income = 0,

  expenses = 0,

  totalCommitments = 0,

  availableToAllocate = 0,

}) {


  // ==========================================================
  // SAFE VALUES
  // ==========================================================

  const safeIncome =
    Math.max(
      safeNumber(
        income
      ),
      0
    );


  const safeExpenses =
    Math.max(
      safeNumber(
        expenses
      ),
      0
    );


  const safeCommitments =
    Math.max(
      safeNumber(
        totalCommitments
      ),
      0
    );


  const safeAvailable =
    safeNumber(
      availableToAllocate
    );


  // ==========================================================
  // NO INCOME
  // ==========================================================
  //
  // Without income, percentage-based financial health cannot
  // be calculated meaningfully.
  //
  // We return insufficientData instead of showing a fake score.
  //
  // ==========================================================

  if (
    safeIncome <= 0
  ) {

    return {

      score: null,

      status:
        "Not Available",

      level:
        "no-data",

      insufficientData:
        true,


      ratios: {

        savingsRate: 0,

        expenseRatio: 0,

        commitmentRatio: 0,

        allocationRatio: 0,

      },


      breakdown: {

        savings: {
          score: 0,
          max: 30,
        },

        expenses: {
          score: 0,
          max: 25,
        },

        commitments: {
          score: 0,
          max: 25,
        },

        allocation: {
          score: 0,
          max: 20,
        },

      },


      insights: [
        "Add your monthly income to calculate your Financial Health Score.",
      ],

    };

  }


  // ==========================================================
  // MONTHLY SAVINGS
  // ==========================================================

  const monthlySavings =
    safeIncome -
    safeExpenses;


  // ==========================================================
  // SAVINGS RATE
  // ==========================================================

  const savingsRate =
    (
      monthlySavings /
      safeIncome
    ) * 100;


  // ==========================================================
  // EXPENSE RATIO
  // ==========================================================

  const expenseRatio =
    (
      safeExpenses /
      safeIncome
    ) * 100;


  // ==========================================================
  // COMMITMENT RATIO
  // ==========================================================

  const commitmentRatio =
    (
      safeCommitments /
      safeIncome
    ) * 100;


  // ==========================================================
  // ALLOCATION RATIO
  // ==========================================================

  const allocationRatio =
    (
      safeAvailable /
      safeIncome
    ) * 100;


  // ==========================================================
  // INDIVIDUAL SCORES
  // ==========================================================

  const savingsScore =
    calculateSavingsScore(
      savingsRate
    );


  const expenseScore =
    calculateExpenseScore(
      expenseRatio
    );


  const commitmentScore =
    calculateCommitmentScore(
      commitmentRatio
    );


  const allocationScore =
    calculateAllocationScore(
      allocationRatio
    );


  // ==========================================================
  // TOTAL SCORE
  // ==========================================================

  const rawScore =
    savingsScore +
    expenseScore +
    commitmentScore +
    allocationScore;


  const score =
    Math.round(
      clamp(
        rawScore,
        0,
        100
      )
    );


  // ==========================================================
  // STATUS
  // ==========================================================

  const healthStatus =
    getHealthStatus(
      score
    );


  // ==========================================================
  // INSIGHTS
  // ==========================================================

  const insights =
    generateHealthInsights({

      income:
        safeIncome,

      savingsRate,

      expenseRatio,

      commitmentRatio,

      allocationRatio,

      availableToAllocate:
        safeAvailable,

    });


  // ==========================================================
  // RETURN COMPLETE RESULT
  // ==========================================================

  return {

    score,

    status:
      healthStatus.label,

    level:
      healthStatus.level,

    insufficientData:
      false,


    // --------------------------------------------------------
    // FINANCIAL VALUES
    // --------------------------------------------------------

    values: {

      income:
        safeIncome,

      expenses:
        safeExpenses,

      monthlySavings,

      commitments:
        safeCommitments,

      availableToAllocate:
        safeAvailable,

    },


    // --------------------------------------------------------
    // RATIOS
    // --------------------------------------------------------

    ratios: {

      savingsRate:
        Number(
          savingsRate.toFixed(
            1
          )
        ),

      expenseRatio:
        Number(
          expenseRatio.toFixed(
            1
          )
        ),

      commitmentRatio:
        Number(
          commitmentRatio.toFixed(
            1
          )
        ),

      allocationRatio:
        Number(
          allocationRatio.toFixed(
            1
          )
        ),

    },


    // --------------------------------------------------------
    // SCORE BREAKDOWN
    // --------------------------------------------------------

    breakdown: {

      savings: {

        label:
          "Savings Health",

        score:
          savingsScore,

        max:
          30,

      },


      expenses: {

        label:
          "Expense Control",

        score:
          expenseScore,

        max:
          25,

      },


      commitments: {

        label:
          "Commitment Load",

        score:
          commitmentScore,

        max:
          25,

      },


      allocation: {

        label:
          "Allocation Capacity",

        score:
          allocationScore,

        max:
          20,

      },

    },


    // --------------------------------------------------------
    // EXPLANATIONS
    // --------------------------------------------------------

    insights,

  };

}