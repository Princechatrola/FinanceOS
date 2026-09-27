// ============================================================
// FINANCEOS - REPORT PERIODS & MODAL UX AUDIT TEST
// Tests Monthly, Quarterly, Half-Yearly, Yearly, Custom Cross-Year,
// No-Data Validation, Zero-Value Rule, User Isolation & Saved Months
// ============================================================

const path = require("path");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const User = require("../models/User");
const MonthlyFinance = require("../models/MonthlyFinance");
const Investment = require("../models/Investment");
const Insurance = require("../models/Insurance");
const Liability = require("../models/Liability");
const SavingGoal = require("../models/SavingGoal");
const AdditionalIncome = require("../models/AdditionalIncome");

const BASE_URL = "http://localhost:5000";
const JWT_SECRET = process.env.JWT_SECRET || "financeos_secret_key_2026";

async function runReportPeriodAndUXAudit() {
  console.log("============================================================");
  console.log("FINANCEOS - REPORT PERIOD & UX AUDIT TEST SUITE");
  console.log("============================================================\n");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB:", process.env.MONGO_URI);

  const results = [];
  const timestamp = Date.now();

  let userA, userB;
  let tokenA, tokenB;

  try {
    // 1. SETUP TEST USERS
    userA = await User.create({
      userId: `USR-A-${timestamp}`,
      name: "Audit User A",
      email: `audit_a_${timestamp}@test.com`,
      role: "user",
      status: "Active",
      emailVerified: true,
      city: "Bangalore",
      state: "Karnataka",
    });

    userB = await User.create({
      userId: `USR-B-${timestamp}`,
      name: "Audit User B",
      email: `audit_b_${timestamp}@test.com`,
      role: "user",
      status: "Active",
      emailVerified: true,
      city: "Hyderabad",
      state: "Telangana",
    });

    tokenA = jwt.sign({ id: userA._id, email: userA.email, role: userA.role }, JWT_SECRET, { expiresIn: "1h" });
    tokenB = jwt.sign({ id: userB._id, email: userB.email, role: userB.role }, JWT_SECRET, { expiresIn: "1h" });

    // 2. SEED TEST DATA FOR USER A:
    // April 2026: Income 75,000, Expenses 45,000, Closing 30,000
    await MonthlyFinance.create({
      user: userA._id,
      year: 2026,
      month: 4,
      income: 75000,
      expenses: 45000,
      openingBalance: 10000,
      closingBalance: 40000,
      availableToAllocate: 40000,
      cashBalance: 40000,
    });

    // December 2026: Income 50,000, Expenses 50,000 (Legitimate savings = 0)
    await MonthlyFinance.create({
      user: userA._id,
      year: 2026,
      month: 12,
      income: 50000,
      expenses: 50000,
      openingBalance: 40000,
      closingBalance: 40000,
      availableToAllocate: 40000,
      cashBalance: 40000,
    });

    // February 2027: An investment transaction for User A
    await Investment.create({
      user: userA._id,
      name: "Index Growth Fund",
      type: "Mutual Fund",
      amount: 10000,
      currentValue: 10500,
      status: "Active",
      transactions: [
        {
          type: "Buy",
          amount: 10000,
          date: new Date("2027-02-15T10:00:00Z"),
          nav: 50,
          units: 200,
        },
      ],
      createdAt: new Date("2027-02-15T10:00:00Z"),
    });

    // Helper for authenticated API calls
    const fetchAPI = async (endpoint, token) => {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      return { status: res.status, data };
    };

    // ------------------------------------------------------------
    // TEST A: MONTHLY
    // ------------------------------------------------------------
    console.log("\n--- TEST GROUP A: MONTHLY ---");

    // A1: Month with saved data (April 2026)
    const resA1 = await fetchAPI("/api/reports?duration=monthly&year=2026&month=4", tokenA);
    const passA1 =
      resA1.status === 200 &&
      resA1.data.success === true &&
      resA1.data.report.header.periodLabel === "April 2026" &&
      resA1.data.report.financialSummary.totalIncome === 75000 &&
      resA1.data.report.financialSummary.totalExpenses === 45000 &&
      resA1.data.report.financialSummary.totalSavings === 30000;
    results.push({ name: "A1. Monthly with saved data (April 2026)", pass: passA1, details: resA1.data.report?.header?.periodLabel });
    console.log("A1:", passA1 ? "PASS" : "FAIL");

    // A2: Month without saved data (May 2026) -> Strict No-Data Validation
    const resA2 = await fetchAPI("/api/reports?duration=monthly&year=2026&month=5", tokenA);
    const expectedA2Msg = "No data saved in May 2026. Please choose a month with saved data.";
    const passA2 =
      resA2.status === 404 &&
      resA2.data.noData === true &&
      resA2.data.message === expectedA2Msg;
    results.push({ name: "A2. Monthly without data returns 404 + exact required message", pass: passA2, details: resA2.data.message });
    console.log("A2:", passA2 ? "PASS" : "FAIL", "-", resA2.data.message);

    // ------------------------------------------------------------
    // TEST B: QUARTERLY
    // ------------------------------------------------------------
    console.log("\n--- TEST GROUP B: QUARTERLY ---");

    // B1: Q2 2026 contains April 2026 data
    const resB1 = await fetchAPI("/api/reports?duration=quarterly&year=2026&quarter=2", tokenA);
    const passB1 =
      resB1.status === 200 &&
      resB1.data.report.header.periodLabel === "Q2 2026" &&
      resB1.data.report.financialSummary.totalIncome === 75000;
    results.push({ name: "B1. Quarterly with saved data (Q2 2026)", pass: passB1, details: resB1.data.report?.header?.periodLabel });
    console.log("B1:", passB1 ? "PASS" : "FAIL");

    // B2: Q1 2026 has no data
    const resB2 = await fetchAPI("/api/reports?duration=quarterly&year=2026&quarter=1", tokenA);
    const passB2 = resB2.status === 404 && resB2.data.noData === true;
    results.push({ name: "B2. Quarterly without data returns 404 noData", pass: passB2, details: resB2.data.message });
    console.log("B2:", passB2 ? "PASS" : "FAIL");

    // ------------------------------------------------------------
    // TEST C: HALF-YEARLY
    // ------------------------------------------------------------
    console.log("\n--- TEST GROUP C: HALF-YEARLY ---");

    // C1: H1 2026 contains April 2026 data
    const resC1 = await fetchAPI("/api/reports?duration=halfYear&year=2026&half=1", tokenA);
    const passC1 =
      resC1.status === 200 &&
      resC1.data.report.header.periodLabel === "H1 2026" &&
      resC1.data.report.financialSummary.totalIncome === 75000;
    results.push({ name: "C1. Half-Yearly with saved data (H1 2026)", pass: passC1, details: resC1.data.report?.header?.periodLabel });
    console.log("C1:", passC1 ? "PASS" : "FAIL");

    // C2: H1 2025 has no data
    const resC2 = await fetchAPI("/api/reports?duration=halfYear&year=2025&half=1", tokenA);
    const passC2 = resC2.status === 404 && resC2.data.noData === true;
    results.push({ name: "C2. Half-Yearly without data returns 404 noData", pass: passC2, details: resC2.data.message });
    console.log("C2:", passC2 ? "PASS" : "FAIL");

    // ------------------------------------------------------------
    // TEST D: YEARLY
    // ------------------------------------------------------------
    console.log("\n--- TEST GROUP D: YEARLY ---");

    // D1: Year 2026 contains data
    const resD1 = await fetchAPI("/api/reports?duration=yearly&year=2026", tokenA);
    const passD1 =
      resD1.status === 200 &&
      resD1.data.report.header.periodLabel === "Year 2026" &&
      resD1.data.report.financialSummary.totalIncome === 125000; // 75000 (Apr) + 50000 (Dec)
    results.push({ name: "D1. Yearly with saved data (Year 2026)", pass: passD1, details: `Total Income: ${resD1.data.report?.financialSummary?.totalIncome}` });
    console.log("D1:", passD1 ? "PASS" : "FAIL");

    // D2: Year 2024 has no data
    const resD2 = await fetchAPI("/api/reports?duration=yearly&year=2024", tokenA);
    const passD2 = resD2.status === 404 && resD2.data.noData === true;
    results.push({ name: "D2. Yearly without data returns 404 noData", pass: passD2, details: resD2.data.message });
    console.log("D2:", passD2 ? "PASS" : "FAIL");

    // ------------------------------------------------------------
    // TEST E: CUSTOM DATE RANGE
    // ------------------------------------------------------------
    console.log("\n--- TEST GROUP E: CUSTOM DATE RANGE ---");

    // E1: January 2026 → May 2026 (Same year, contains April data)
    const resE1 = await fetchAPI("/api/reports?duration=custom&startYear=2026&startMonth=1&endYear=2026&endMonth=5", tokenA);
    const passE1 =
      resE1.status === 200 &&
      resE1.data.report.header.periodLabel === "January 2026 — May 2026" &&
      resE1.data.report.financialSummary.totalIncome === 75000;
    results.push({ name: "E1. Custom Range (January 2026 → May 2026)", pass: passE1, details: resE1.data.report?.header?.periodLabel });
    console.log("E1:", passE1 ? "PASS" : "FAIL");

    // E2: September 2026 → January 2027 (Cross-year boundary, contains Dec 2026)
    const resE2 = await fetchAPI("/api/reports?duration=custom&startYear=2026&startMonth=9&endYear=2027&endMonth=1", tokenA);
    const passE2 =
      resE2.status === 200 &&
      resE2.data.report.header.periodLabel === "September 2026 — January 2027" &&
      resE2.data.report.financialSummary.totalIncome === 50000;
    results.push({ name: "E2. Custom Cross-Year Range (September 2026 → January 2027)", pass: passE2, details: resE2.data.report?.header?.periodLabel });
    console.log("E2:", passE2 ? "PASS" : "FAIL");

    // E3: August 2026 → March 2027 (Cross-year boundary, contains Dec 2026 & Feb 2027 investment)
    const resE3 = await fetchAPI("/api/reports?duration=custom&startYear=2026&startMonth=8&endYear=2027&endMonth=3", tokenA);
    const passE3 =
      resE3.status === 200 &&
      resE3.data.report.header.periodLabel === "August 2026 — March 2027" &&
      resE3.data.report.plans.investments.length > 0;
    results.push({ name: "E3. Custom Cross-Year Range (August 2026 → March 2027)", pass: passE3, details: resE3.data.report?.header?.periodLabel });
    console.log("E3:", passE3 ? "PASS" : "FAIL");

    // E4: Same-month range (April 2026 → April 2026)
    const resE4 = await fetchAPI("/api/reports?duration=custom&startYear=2026&startMonth=4&endYear=2026&endMonth=4", tokenA);
    const passE4 =
      resE4.status === 200 &&
      resE4.data.report.header.periodLabel === "April 2026 — April 2026" &&
      resE4.data.report.financialSummary.totalIncome === 75000;
    results.push({ name: "E4. Same-month Custom Range (April 2026 → April 2026)", pass: passE4, details: resE4.data.report?.header?.periodLabel });
    console.log("E4:", passE4 ? "PASS" : "FAIL");

    // E5: Custom range with NO data anywhere (Jan 2024 → May 2024) -> Centered modal message
    const resE5 = await fetchAPI("/api/reports?duration=custom&startYear=2024&startMonth=1&endYear=2024&endMonth=5", tokenA);
    const expectedE5Msg = "No financial data found for the selected period. Please choose a period containing saved data.";
    const passE5 =
      resE5.status === 404 &&
      resE5.data.noData === true &&
      resE5.data.message === expectedE5Msg;
    results.push({ name: "E5. Custom Range with no data returns 404 + required modal text", pass: passE5, details: resE5.data.message });
    console.log("E5:", passE5 ? "PASS" : "FAIL", "-", resE5.data.message);

    // E6: Period containing some missing months (Jan 2026 → May 2026)
    // Only April has data. Jan, Feb, Mar, May must NOT have false zero values!
    const resE6 = await fetchAPI("/api/reports?duration=custom&startYear=2026&startMonth=1&endYear=2026&endMonth=5", tokenA);
    const monthDetails = resE6.data.report.monthDetails;
    const jan = monthDetails.find((m) => m.month === 1);
    const apr = monthDetails.find((m) => m.month === 4);
    const passE6 =
      jan.hasRecord === false &&
      jan.totalIncome === null &&
      jan.expenses === null &&
      jan.healthStatus === "No Data" &&
      apr.hasRecord === true &&
      apr.totalIncome === 75000 &&
      apr.expenses === 45000;
    results.push({ name: "E6. Missing months distinguish null/No Data from actual data (No False Zeros)", pass: passE6, details: `Jan: hasRecord=${jan.hasRecord}, Apr: hasRecord=${apr.hasRecord}` });
    console.log("E6:", passE6 ? "PASS" : "FAIL");

    // E7: Invalid chronological range within same year (August 2026 → March 2026)
    const resE7 = await fetchAPI("/api/reports?duration=custom&startYear=2026&startMonth=8&endYear=2026&endMonth=3", tokenA);
    const passE7 = resE7.status === 400 && resE7.data.success === false;
    results.push({ name: "E7. Inverted range (Aug 2026 → Mar 2026) rejected with 400", pass: passE7, details: resE7.data.message });
    console.log("E7:", passE7 ? "PASS" : "FAIL", "-", resE7.data.message);

    // ------------------------------------------------------------
    // TEST F: ZERO-VALUE DISTINCTION
    // ------------------------------------------------------------
    console.log("\n--- TEST GROUP F: ZERO-VALUE DISTINCTION ---");

    // December 2026: Income 50,000, Expenses 50,000 -> Legitimate savings is ₹0
    const resF1 = await fetchAPI("/api/reports?duration=monthly&year=2026&month=12", tokenA);
    const passF1 =
      resF1.status === 200 &&
      resF1.data.report.financialSummary.totalIncome === 50000 &&
      resF1.data.report.financialSummary.totalExpenses === 50000 &&
      resF1.data.report.financialSummary.totalSavings === 0 && // Actual calculation produces 0
      resF1.data.report.monthDetails[0].hasRecord === true &&
      resF1.data.report.monthDetails[0].savings === 0;
    results.push({ name: "F1. Legitimate calculated 0 is preserved (Income 50k - Expenses 50k = Savings 0)", pass: passF1, details: `Savings: ${resF1.data.report?.financialSummary?.totalSavings}` });
    console.log("F1:", passF1 ? "PASS" : "FAIL");

    // ------------------------------------------------------------
    // TEST G: USER DATA ISOLATION
    // ------------------------------------------------------------
    console.log("\n--- TEST GROUP G: USER DATA ISOLATION ---");

    // User B has NO financial records. User B requesting April 2026 must get 404 (no data), NOT User A's data!
    const resG1 = await fetchAPI("/api/reports?duration=monthly&year=2026&month=4", tokenB);
    const passG1 = resG1.status === 404 && resG1.data.noData === true;
    results.push({ name: "G1. User Data Isolation: User B cannot access User A's report data", pass: passG1, details: resG1.data.message });
    console.log("G1:", passG1 ? "PASS" : "FAIL");

    // ------------------------------------------------------------
    // TEST H: SAVED MONTHS ENDPOINT
    // ------------------------------------------------------------
    console.log("\n--- TEST GROUP H: SAVED MONTHS ENDPOINT ---");

    const resH1 = await fetchAPI("/api/reports/saved-months", tokenA);
    const savedMonthsA = resH1.data.savedMonths || [];
    const hasApr2026 = savedMonthsA.some((sm) => sm.year === 2026 && sm.month === 4);
    const hasDec2026 = savedMonthsA.some((sm) => sm.year === 2026 && sm.month === 12);
    const hasFeb2027 = savedMonthsA.some((sm) => sm.year === 2027 && sm.month === 2);
    const hasMay2026 = savedMonthsA.some((sm) => sm.year === 2026 && sm.month === 5);
    const passH1 = hasApr2026 && hasDec2026 && hasFeb2027 && !hasMay2026;
    results.push({ name: "H1. Saved months returns all and only months with actual saved data", pass: passH1, details: `Found: ${savedMonthsA.map(m => m.label).join(", ")}` });
    console.log("H1:", passH1 ? "PASS" : "FAIL");

    // User B saved months should be empty
    const resH2 = await fetchAPI("/api/reports/saved-months", tokenB);
    const passH2 = resH2.status === 200 && resH2.data.savedMonths.length === 0;
    results.push({ name: "H2. User B saved months is empty (Isolated)", pass: passH2, details: `Length: ${resH2.data.savedMonths?.length}` });
    console.log("H2:", passH2 ? "PASS" : "FAIL");

  } catch (error) {
    console.error("Test execution encountered an error:", error);
  } finally {
    // CLEANUP TEST USERS AND DATA ONLY
    console.log("\nCleaning up test artifacts...");
    if (userA) {
      await MonthlyFinance.deleteMany({ user: userA._id });
      await Investment.deleteMany({ user: userA._id });
      await Insurance.deleteMany({ user: userA._id });
      await Liability.deleteMany({ user: userA._id });
      await SavingGoal.deleteMany({ user: userA._id });
      await AdditionalIncome.deleteMany({ user: userA._id });
      await User.findByIdAndDelete(userA._id);
    }
    if (userB) {
      await MonthlyFinance.deleteMany({ user: userB._id });
      await Investment.deleteMany({ user: userB._id });
      await Insurance.deleteMany({ user: userB._id });
      await Liability.deleteMany({ user: userB._id });
      await SavingGoal.deleteMany({ user: userB._id });
      await AdditionalIncome.deleteMany({ user: userB._id });
      await User.findByIdAndDelete(userB._id);
    }
    await mongoose.disconnect();
    console.log("MongoDB disconnected.");
  }

  console.log("\n============================================================");
  console.log("FINAL AUDIT SUMMARY");
  console.log("============================================================");
  let passedCount = 0;
  let failedCount = 0;
  results.forEach((r, idx) => {
    const status = r.pass ? "PASS" : "FAIL";
    if (r.pass) passedCount++;
    else failedCount++;
    console.log(`[${status}] ${r.name} - ${r.details || ""}`);
  });
  console.log(`\nTOTAL: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);

  if (failedCount > 0) {
    process.exit(1);
  }
}

runReportPeriodAndUXAudit();
