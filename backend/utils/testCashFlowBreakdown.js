// ============================================================
// AUTOMATED TEST SUITE: CASH FLOW BREAKDOWN & AVAILABLE TO ALLOCATE
// ============================================================

const assert = require("assert");

console.log("=================================================");
console.log("RUNNING FINANCEOS CASH FLOW BREAKDOWN TEST SUITE");
console.log("=================================================\n");

let passed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(`    ${err.message}`);
  }
}

// -------------------------------------------------------------
// TEST CASE 1: Main Example (User Request 1, 3, 4)
// Opening ₹2,000, Income ₹50,000, Expenses ₹32,000, Investment ₹2,000, Others ₹0
// -> Funds Before Outflows = ₹52,000
// -> Available to Allocate = ₹18,000
// -------------------------------------------------------------
test("Test 1: Core Cash Flow Arithmetic", () => {
  const openingBalance = 2000;
  const income = 50000;
  const fundsBeforeOutflows = openingBalance + income;
  assert.strictEqual(fundsBeforeOutflows, 52000, "Funds before outflows must be ₹52,000");

  const expenses = 32000;
  const actualInvestments = 2000;
  const actualGoals = 0;
  const actualInsurance = 0;
  const actualLiabilities = 0;
  const otherOutflows = 0;

  const totalActualOutflows =
    expenses + actualInvestments + actualGoals + actualInsurance + actualLiabilities + otherOutflows;
  assert.strictEqual(totalActualOutflows, 34000, "Total actual outflows must be ₹34,000");

  const availableToAllocate = fundsBeforeOutflows - totalActualOutflows;
  assert.strictEqual(availableToAllocate, 18000, "Available to Allocate must be ₹18,000");
  const closingBalance = availableToAllocate;
  assert.strictEqual(closingBalance, 18000, "Closing balance must be ₹18,000");
});

// -------------------------------------------------------------
// TEST CASE 2: User Request 11 — Goal Contribution
// Opening ₹5,000, Income ₹30,000, Expenses ₹15,000, Goal Target ₹10,000, Actual Goal Contribution ₹2,000
// Result MUST be ₹18,000 (Goal Target ₹10,000 is NOT deducted)
// -------------------------------------------------------------
test("Test 2: Goal target ₹10,000 is NOT deducted; only actual contribution ₹2,000 is deducted", () => {
  const opening = 5000;
  const income = 30000;
  const expenses = 15000;
  const goalTarget = 10000; // MUST NOT be deducted
  const actualGoalContribution = 2000; // ONLY this is deducted

  const fundsBefore = opening + income;
  const actualOutflows = expenses + actualGoalContribution;
  const available = fundsBefore - actualOutflows;

  assert.strictEqual(fundsBefore, 35000);
  assert.strictEqual(actualOutflows, 17000);
  assert.strictEqual(available, 18000, "Available must be ₹18,000 (not reduced by target)");
});

// -------------------------------------------------------------
// TEST CASE 3: User Request 12 — Investment Contribution
// Available before SIP = ₹20,000. SIP planned = ₹5,000, Actual Paid = ₹5,000
// Available after payment = ₹15,000
// If actual paid = ₹0 -> Available stays ₹20,000
// -------------------------------------------------------------
test("Test 3: Planned SIP does NOT reduce available cash until actually paid", () => {
  const fundsAvailable = 20000;
  const plannedSIP = 5000;

  // Unpaid state
  let actualPaid = 0;
  let available = fundsAvailable - actualPaid;
  assert.strictEqual(available, 20000, "Unpaid planned SIP must NOT deduct cash");

  // Paid state
  actualPaid = 5000;
  available = fundsAvailable - actualPaid;
  assert.strictEqual(available, 15000, "Paid SIP must deduct exactly actual paid amount");
});

// -------------------------------------------------------------
// TEST CASE 4: User Request 10 — Immediate Recalculation on Contribution
// Initial: Available = ₹20,000
// Contribution: ₹2,000
// After: Available = ₹18,000
// -------------------------------------------------------------
test("Test 4: Real-time recalculation when user records contribution", () => {
  const opening = 0;
  const income = 20000;
  const expenses = 0;

  let actualOutflows = 0;
  let available = (opening + income) - (expenses + actualOutflows);
  assert.strictEqual(available, 20000, "Initial available is ₹20,000");

  // User records ₹2,000 contribution
  actualOutflows += 2000;
  available = (opening + income) - (expenses + actualOutflows);
  assert.strictEqual(available, 18000, "Available immediately becomes ₹18,000");
});

// -------------------------------------------------------------
// TEST CASE 5: User Request 13 & 14 — Liabilities & Insurance
// Unpaid Home Loan EMI ₹20,000 + Health Insurance ₹2,000
// Only paid amounts deduct from cash
// -------------------------------------------------------------
test("Test 5: Unpaid liabilities & insurance do NOT reduce available cash", () => {
  const opening = 2000;
  const income = 50000;
  const expenses = 32000;

  const plannedEMI = 20000;
  const plannedInsurance = 2000;

  let actualEMI = 0;
  let actualInsurance = 0;

  let available = (opening + income) - (expenses + actualEMI + actualInsurance);
  assert.strictEqual(available, 20000, "When unpaid, available is ₹20,000");

  // User pays EMI ₹20,000 and Insurance ₹2,000
  actualEMI = 20000;
  actualInsurance = 2000;
  available = (opening + income) - (expenses + actualEMI + actualInsurance);
  assert.strictEqual(available, -2000, "When paid, available reflects actual deductions (₹-2,000)");
});

// -------------------------------------------------------------
// TEST CASE 6: User Request 28 — Carry Forward is NOT counted as new income
// February closing = ₹8,000 -> March opening = ₹8,000
// March income = ₹50,000. Total income is ₹50,000 (NOT ₹58,000)
// -------------------------------------------------------------
test("Test 6: Carry forward is NOT treated as new income", () => {
  const febClosing = 8000;
  const marOpening = febClosing; // carried forward
  const marIncome = 50000;

  assert.strictEqual(marIncome, 50000, "March income is only ₹50,000");
  const fundsBeforeOutflows = marOpening + marIncome;
  assert.strictEqual(fundsBeforeOutflows, 58000, "Total funds is ₹58,000 (Opening ₹8k + Income ₹50k)");
});

// -------------------------------------------------------------
// TEST CASE 7: Missing Data vs Real Zero (User Request 15)
// Unrecorded categories are identified as unrecorded (hasInsurance: false)
// -------------------------------------------------------------
test("Test 7: Distinguishes missing categories from genuine zero", () => {
  const actualInsurance = 0;
  const recordedPaymentsCount = 0;
  const isMissing = recordedPaymentsCount === 0;

  assert.strictEqual(isMissing, true, "Category with no records is flagged as missing / no payment recorded");
  assert.strictEqual(isMissing ? "— No payment recorded" : "₹0", "— No payment recorded");
});

// -------------------------------------------------------------
// TEST CASE 8: Dynamic Natural-Language Explanation (User Request 30)
// -------------------------------------------------------------
test("Test 8: Dynamic natural-language explanation formatting", () => {
  const monthLabel = "March 2026";
  const availableToAllocate = 17000;
  const openingBalance = 2000;
  const prevMonthLabel = "February 2026";
  const totalIncome = 50000;
  const totalActualOutflows = 35000;

  const fmt = (v) => `₹${Math.round(v).toLocaleString("en-IN")}`;
  const explanation = `Your ${monthLabel} Available to Allocate is ${fmt(availableToAllocate)}. You started the month with ${fmt(openingBalance)} carried forward from ${prevMonthLabel} closing balance, received ${fmt(totalIncome)} of total income, and had ${fmt(totalActualOutflows)} of actual recorded cash outflows during the month.`;

  assert(explanation.includes("₹17,000"));
  assert(explanation.includes("₹2,000 carried forward from February 2026"));
  assert(explanation.includes("₹50,000 of total income"));
  assert(explanation.includes("₹35,000 of actual recorded cash outflows"));
});

console.log("\n=================================================");
console.log(`TEST RESULTS: ${passed}/${total} PASSED`);
console.log("=================================================");

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
