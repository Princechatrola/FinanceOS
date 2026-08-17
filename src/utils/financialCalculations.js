/*
  ============================================================
  FINANCEOS - FINANCIAL CALCULATIONS
  ============================================================

  Purpose:
  This file contains reusable financial calculation functions
  used throughout FinanceOS.

  IMPORTANT:
  Financial calculations are kept outside React components.

  This gives us:

  1. Cleaner React components
  2. Reusable financial logic
  3. Easier testing
  4. Easier backend integration later
  5. One place to maintain financial formulas

  Later, these functions can work with data received from
  MongoDB through the FinanceOS backend API.
*/


// ============================================================
// HELPER - CONVERT VALUE TO SAFE NUMBER
// ============================================================

/*
  Form values sometimes arrive as strings.

  Example:

  "25000"

  We convert them into:

  25000

  Invalid or empty values become 0.
*/

function toNumber(value) {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}


// ============================================================
// 1. CALCULATE MONTHLY SAVINGS
// ============================================================

/*
  Monthly Savings = Income - Regular Expenses

  Example:

  Income                 ₹50,000
  Regular Expenses      -₹30,000
                         --------
  Monthly Savings        ₹20,000

  IMPORTANT:

  Loan EMI, goal allocation, SIP contribution, etc. should
  NOT be deducted here if they are already treated as
  financial commitments.

  Otherwise we could subtract them twice.
*/

export function calculateMonthlySavings(
  income,
  expenses
) {
  const safeIncome = toNumber(income);
  const safeExpenses = toNumber(expenses);

  return safeIncome - safeExpenses;
}


// ============================================================
// 2. CALCULATE AVAILABLE TO ALLOCATE
// ============================================================

/*
  Available to Allocate tells FinanceOS how much of the
  monthly savings remains after existing commitments.

  Formula:

  Available to Allocate
  =
  Monthly Savings - Existing Monthly Commitments


  Example 1:

  Monthly Savings            ₹20,000

  Loan EMI                  -₹10,000
  Goal Allocation            -₹5,000
                              -------
  Available to Allocate       ₹5,000


  Example 2:

  Monthly Savings             ₹7,000

  Goal Allocation            -₹5,000
  Loan EMI                  -₹10,000
                              -------
  Available to Allocate      -₹8,000


  IMPORTANT:

  We intentionally allow a NEGATIVE result.

  Previously we used:

  Math.max(result, 0)

  That hid financial shortfalls.

  FinanceOS needs the real value so that it can warn the user
  when their commitments exceed their monthly savings.
*/

export function calculateAvailableToAllocate(
  monthlySavings,
  totalCommitments
) {
  const safeSavings =
    toNumber(monthlySavings);

  const safeCommitments =
    toNumber(totalCommitments);

  return safeSavings - safeCommitments;
}


// ============================================================
// 3. CALCULATE MONTHLY FINANCIAL SHORTFALL
// ============================================================

/*
  This function determines how much the user's existing
  commitments exceed their monthly savings.

  Example:

  Savings                 ₹7,000
  Commitments            ₹15,000

  Available              -₹8,000

  Shortfall               ₹8,000


  If Available to Allocate is positive:

  Available               ₹5,000

  Shortfall               ₹0
*/

export function calculateMonthlyShortfall(
  availableToAllocate
) {
  const available =
    toNumber(availableToAllocate);

  return available < 0
    ? Math.abs(available)
    : 0;
}


// ============================================================
// 4. CALCULATE GOAL MONTHLY REQUIREMENT
// ============================================================

/*
  Calculates how much must be allocated every month to reach
  a saving goal within the selected duration.

  Example:

  Phone Target           ₹100,000
  Already Saved                ₹0
  Duration                 6 months

  Remaining              ₹100,000

  Required per month:

  ₹100,000 / 6
  =
  ₹16,666.67
*/

export function calculateGoalMonthlyRequirement(
  targetAmount,
  currentAmount,
  durationMonths
) {
  const target =
    toNumber(targetAmount);

  const current =
    toNumber(currentAmount);

  const duration =
    toNumber(durationMonths);


  // Invalid duration cannot produce a monthly requirement.
  if (duration <= 0) {
    return 0;
  }


  // Amount still required to reach the goal.
  const remainingAmount =
    Math.max(
      target - current,
      0
    );


  return remainingAmount / duration;
}


// ============================================================
// 5. CHECK WHETHER A NEW GOAL IS AFFORDABLE
// ============================================================

/*
  IMPORTANT:

  This function is intended for a NEW goal that has NOT yet
  been included in existing commitments.

  Example:

  Available before new goal      ₹5,000

  New Phone Goal:
  Required per month             ₹3,000

  ₹3,000 <= ₹5,000

  Affordable = true


  Another example:

  Available before new goal      ₹5,000

  New Phone Goal:
  Required per month             ₹8,000

  ₹8,000 > ₹5,000

  Affordable = false


  If Available to Allocate is already negative, FinanceOS
  should not consider another voluntary goal affordable.
*/

export function checkGoalAffordability({
  targetAmount,
  currentAmount = 0,
  durationMonths,
  availableToAllocate,
}) {

  const available =
    toNumber(availableToAllocate);


  const requiredPerMonth =
    calculateGoalMonthlyRequirement(
      targetAmount,
      currentAmount,
      durationMonths
    );


  const isAffordable =
    available >= 0 &&
    requiredPerMonth <= available;


  // How much extra monthly capacity would be required?
  const monthlyGap =
    Math.max(
      requiredPerMonth - Math.max(available, 0),
      0
    );


  return {
    isAffordable,
    requiredPerMonth,
    availableToAllocate: available,
    monthlyGap,
  };
}


// ============================================================
// 6. CALCULATE MINIMUM GOAL DURATION
// ============================================================

/*
  If a goal cannot be achieved in the selected duration,
  FinanceOS can estimate a realistic minimum duration.

  Example:

  Remaining Goal Amount      ₹100,000

  Available for NEW Goal       ₹5,000/month

  100000 / 5000
  =
  20 months


  IMPORTANT:

  This calculation is meaningful only when money is actually
  available for a new goal.
*/

export function calculateMinimumGoalDuration(
  targetAmount,
  currentAmount,
  availableToAllocate
) {

  const target =
    toNumber(targetAmount);

  const current =
    toNumber(currentAmount);

  const available =
    toNumber(availableToAllocate);


  // No capacity exists for a new goal.
  if (available <= 0) {
    return null;
  }


  const remainingAmount =
    Math.max(
      target - current,
      0
    );


  // Goal is already completed.
  if (remainingAmount === 0) {
    return 0;
  }


  return Math.ceil(
    remainingAmount / available
  );
}


// ============================================================
// 7. CALCULATE GOAL PROGRESS PERCENTAGE
// ============================================================

/*
  Example:

  Target          ₹100,000
  Saved            ₹25,000

  Progress:

  25,000 / 100,000 × 100
  =
  25%

  The value is restricted between 0 and 100.
*/

export function calculateGoalProgress(
  currentAmount,
  targetAmount
) {

  const current =
    toNumber(currentAmount);

  const target =
    toNumber(targetAmount);


  if (target <= 0) {
    return 0;
  }


  const percentage =
    (current / target) * 100;


  return Math.min(
    Math.max(percentage, 0),
    100
  );
}


// ============================================================
// 8. CALCULATE REMAINING GOAL AMOUNT
// ============================================================

/*
  Example:

  Phone Target      ₹100,000
  Saved              ₹25,000

  Remaining          ₹75,000
*/

export function calculateGoalRemainingAmount(
  targetAmount,
  currentAmount
) {

  const target =
    toNumber(targetAmount);

  const current =
    toNumber(currentAmount);


  return Math.max(
    target - current,
    0
  );
}


// ============================================================
// 9. CALCULATE FINANCIAL COMMITMENT RATIO
// ============================================================

/*
  This can later help FinanceOS calculate the Financial
  Health Score.

  Example:

  Monthly Savings       ₹20,000
  Commitments           ₹15,000

  Commitment Ratio:

  15,000 / 20,000 × 100
  =
  75%


  A high ratio means most of the user's monthly surplus is
  already committed.
*/

export function calculateCommitmentRatio(
  monthlySavings,
  totalCommitments
) {

  const savings =
    toNumber(monthlySavings);

  const commitments =
    toNumber(totalCommitments);


  if (savings <= 0) {

    return commitments > 0
      ? 100
      : 0;

  }


  return (
    commitments / savings
  ) * 100;
}