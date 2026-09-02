// ============================================================
// AUTOMATED TEST SUITE: RECURRING DUE DATE SCHEDULE SYSTEM
// ============================================================

const assert = require("assert");
const {
  calculateDueDateForMonth,
  formatDateISO,
  isDueInMonth,
  isPlanActiveForDueDate,
  deriveDueDateForMonth,
  deriveContributionStatus,
} = require("./dueDateSchedule");

console.log("=================================================");
console.log("RUNNING FINANCEOS RECURRING DUE DATE TEST SUITE");
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
// TEST CASE 1: SIP - Monthly Recurring (User Test Case 31)
// -------------------------------------------------------------
test("Test 1: Monthly SIP (dueDay=10) generates 10th for Jan, Feb, Mar, Apr", () => {
  const janDue = calculateDueDateForMonth(10, 2026, 1);
  const febDue = calculateDueDateForMonth(10, 2026, 2);
  const marDue = calculateDueDateForMonth(10, 2026, 3);
  const aprDue = calculateDueDateForMonth(10, 2026, 4);

  assert.strictEqual(formatDateISO(janDue), "2026-01-10");
  assert.strictEqual(formatDateISO(febDue), "2026-02-10");
  assert.strictEqual(formatDateISO(marDue), "2026-03-10");
  assert.strictEqual(formatDateISO(aprDue), "2026-04-10");
});

// -------------------------------------------------------------
// TEST CASE 2: Quarterly Plan (User Test Case 32)
// -------------------------------------------------------------
test("Test 2: Quarterly Plan (Start Jan 2026, dueDay=15): Jan due, Mar NOT due, Apr due, Jul due", () => {
  const startDate = "2026-01-10";

  assert.strictEqual(isDueInMonth("Quarterly", startDate, 2026, 1), true, "Jan should be due");
  assert.strictEqual(isDueInMonth("Quarterly", startDate, 2026, 2), false, "Feb should NOT be due");
  assert.strictEqual(isDueInMonth("Quarterly", startDate, 2026, 3), false, "Mar should NOT be due");
  assert.strictEqual(isDueInMonth("Quarterly", startDate, 2026, 4), true, "Apr should be due");
  assert.strictEqual(isDueInMonth("Quarterly", startDate, 2026, 5), false, "May should NOT be due");
  assert.strictEqual(isDueInMonth("Quarterly", startDate, 2026, 6), false, "Jun should NOT be due");
  assert.strictEqual(isDueInMonth("Quarterly", startDate, 2026, 7), true, "Jul should be due");

  const aprDate = calculateDueDateForMonth(15, 2026, 4);
  assert.strictEqual(formatDateISO(aprDate), "2026-04-15");
});

// -------------------------------------------------------------
// TEST CASE 3: Insurance (User Test Case 33)
// -------------------------------------------------------------
test("Test 3: Insurance Monthly (premiumDueDay=20): Mar -> 20 Mar, Apr -> 20 Apr", () => {
  const marDue = calculateDueDateForMonth(20, 2026, 3);
  const aprDue = calculateDueDateForMonth(20, 2026, 4);

  assert.strictEqual(formatDateISO(marDue), "2026-03-20");
  assert.strictEqual(formatDateISO(aprDue), "2026-04-20");
});

// -------------------------------------------------------------
// TEST CASE 4: Loan EMI (User Test Case 34)
// -------------------------------------------------------------
test("Test 4: Loan EMI (dueDay=5): March -> 5 March", () => {
  const marDue = calculateDueDateForMonth(5, 2026, 3);
  assert.strictEqual(formatDateISO(marDue), "2026-03-05");
});

// -------------------------------------------------------------
// TEST CASE 5: Day Overflow Clamping (Rule 17)
// -------------------------------------------------------------
test("Test 5: Due Day 31 clamps to 28 in Feb 2026, 30 in Apr, 31 in Jan", () => {
  const febDue = calculateDueDateForMonth(31, 2026, 2);
  const aprDue = calculateDueDateForMonth(31, 2026, 4);
  const janDue = calculateDueDateForMonth(31, 2026, 1);

  assert.strictEqual(formatDateISO(febDue), "2026-02-28");
  assert.strictEqual(formatDateISO(aprDue), "2026-04-30");
  assert.strictEqual(formatDateISO(janDue), "2026-01-31");
});

test("Test 5b: Leap year Feb (e.g. 2028) clamps day 31 to 29", () => {
  const feb2028 = calculateDueDateForMonth(31, 2028, 2);
  assert.strictEqual(formatDateISO(feb2028), "2028-02-29");
});

// -------------------------------------------------------------
// TEST CASE 6: Start Date Lifecycle (Rule 10)
// -------------------------------------------------------------
test("Test 6: Plan starting 15 May 2026 is NOT active in April 2026", () => {
  const plan = {
    startDate: new Date("2026-05-15"),
    status: "Active",
  };

  const aprDue = calculateDueDateForMonth(20, 2026, 4);
  const mayDue = calculateDueDateForMonth(20, 2026, 5);

  assert.strictEqual(isPlanActiveForDueDate(plan, aprDue), false, "April should be inactive");
  assert.strictEqual(isPlanActiveForDueDate(plan, mayDue), true, "May should be active");
});

// -------------------------------------------------------------
// TEST CASE 7: End Date / Maturity Lifecycle (Rule 11)
// -------------------------------------------------------------
test("Test 7: SIP ending 15 August 2026 is NOT active for September 2026", () => {
  const plan = {
    startDate: new Date("2026-01-01"),
    endDate: new Date("2026-08-15"),
    status: "Active",
  };

  const augDue = calculateDueDateForMonth(10, 2026, 8);
  const sepDue = calculateDueDateForMonth(10, 2026, 9);

  assert.strictEqual(isPlanActiveForDueDate(plan, augDue), true, "August should be active");
  assert.strictEqual(isPlanActiveForDueDate(plan, sepDue), false, "September should be inactive");
});

// -------------------------------------------------------------
// TEST CASE 8: Status Derivation (Rule 18)
// -------------------------------------------------------------
test("Test 8: Contribution status derivation handles Paid, Skipped, Overdue, Upcoming", () => {
  assert.strictEqual(deriveContributionStatus("2026-03-10", "2026-03-12", "Paid"), "Paid");
  assert.strictEqual(deriveContributionStatus("2026-03-10", null, "Skipped"), "Skipped");

  // Future date
  assert.strictEqual(deriveContributionStatus("2099-01-01", null, "Not Paid"), "Upcoming");

  // Past date
  assert.strictEqual(deriveContributionStatus("2020-01-01", null, "Not Paid"), "Overdue");
});

// -------------------------------------------------------------
// TEST CASE 9: Full Schedule Derivation
// -------------------------------------------------------------
test("Test 9: deriveDueDateForMonth returns valid date object and ISO string", () => {
  const plan = {
    startDate: "2026-01-01",
    status: "Active",
  };

  const result = deriveDueDateForMonth({
    dueDay: 10,
    frequency: "Monthly",
    startDate: plan.startDate,
    plan,
    year: 2026,
    month: 3,
  });

  assert(result !== null);
  assert.strictEqual(result.dueDateISO, "2026-03-10");
});

console.log("\n=================================================");
console.log(`TEST RESULTS: ${passed}/${total} PASSED`);
console.log("=================================================");

if (passed === total) {
  process.exit(0);
} else {
  process.exit(1);
}
