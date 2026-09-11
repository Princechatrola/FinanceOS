// ============================================================
// FINANCEOS - ADMIN USER REPORTS & STRICT USER ISOLATION TEST
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

async function runAdminReportsIsolationTests() {
  console.log("============================================================");
  console.log("FINANCEOS - ADMIN USER REPORTS & STRICT ISOLATION AUDIT");
  console.log("============================================================\n");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB:", process.env.MONGO_URI);

  const testResults = [];
  const timestamp = Date.now();

  let adminUser, userA, userB;
  let adminToken, userAToken;

  try {
    // 1. SETUP TEST USERS & ADMIN
    adminUser = await User.create({
      userId: `ADM-${timestamp}`,
      name: "Super Admin",
      email: `admin_${timestamp}@financeos.com`,
      role: "admin",
      status: "Active",
      emailVerified: true,
      city: "Mumbai",
      state: "Maharashtra",
    });

    userA = await User.create({
      userId: `USR-A-${timestamp}`,
      name: "Alpha User",
      email: `alpha_${timestamp}@test.com`,
      role: "user",
      status: "Active",
      emailVerified: true,
      city: "Pune",
      state: "Maharashtra",
    });

    userB = await User.create({
      userId: `USR-B-${timestamp}`,
      name: "Beta User",
      email: `beta_${timestamp}@test.com`,
      role: "user",
      status: "Active",
      emailVerified: true,
      city: "Bengaluru",
      state: "Karnataka",
    });

    adminToken = jwt.sign(
      { id: adminUser._id.toString(), userId: adminUser.userId, email: adminUser.email, role: "admin" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    userAToken = jwt.sign(
      { id: userA._id.toString(), userId: userA.userId, email: userA.email, role: "user" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 2. SEED DISTINCT FINANCIAL DATA
    // User A: Monthly Income 120,000, Expenses 45,000, SIP 15,000
    await MonthlyFinance.create({
      user: userA._id,
      year: 2026,
      month: 9,
      income: 120000,
      expenses: 45000,
      openingBalance: 60000,
      cashBalance: 60000,
      closingBalance: 120000,
      availableToAllocate: 75000,
    });

    await Investment.create({
      user: userA._id,
      name: "Alpha Mutual Fund",
      type: "SIP",
      amount: 15000,
      monthlyContribution: 15000,
      status: "Active",
      sipContributions: [{ dueDate: "2026-09-05", amount: 15000, status: "Paid" }],
    });

    await SavingGoal.create({
      user: userA._id,
      goalName: "Alpha Emergency Goal",
      category: "Emergency Fund",
      targetAmount: 300000,
      targetDate: new Date("2028-12-31"),
      savedAmount: 50000,
      monthlyContribution: 10000,
      status: "Active",
      contributions: [{ date: "2026-09-10", amount: 10000 }],
    });

    // User B: Monthly Income 70,000, Expenses 25,000, Car Loan EMI 12,000
    await MonthlyFinance.create({
      user: userB._id,
      year: 2026,
      month: 9,
      income: 70000,
      expenses: 25000,
      openingBalance: 30000,
      cashBalance: 30000,
      closingBalance: 63000,
      availableToAllocate: 45000,
    });

    await Liability.create({
      user: userB._id,
      name: "Beta Car Loan",
      type: "Car Loan",
      principalAmount: 500000,
      remainingAmount: 420000,
      monthlyEMI: 12000,
      status: "Active",
      payments: [{ paidDate: "2026-09-08", amount: 12000, status: "Paid" }],
    });

    await Insurance.create({
      user: userB._id,
      name: "Beta Health Policy",
      type: "Health Insurance",
      premiumAmount: 18000,
      monthlyEquivalent: 1500,
      status: "Active",
      payments: [{ paidDate: "2026-09-12", amount: 18000, status: "Paid" }],
    });

    // ------------------------------------------------------------
    // TEST 1: Check GET /api/admin/users/:id/reports endpoint exists
    // ------------------------------------------------------------
    console.log("--- TEST 1: Endpoint Existence & Schema Validation ---");
    const resA = await fetch(`${BASE_URL}/api/admin/users/${userA._id}/reports?duration=monthly&year=2026&month=9`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataA = await resA.json();

    const pass1 = resA.status === 200 && dataA.success === true && Boolean(dataA.report);
    console.log(`Test 1 Result: ${pass1 ? "PASS" : "FAIL"}`);
    console.log(`  Status: ${resA.status}`);
    console.log(`  Report Returned: ${Boolean(dataA.report)}`);
    testResults.push({ name: "1. GET /api/admin/users/:id/reports Endpoint Verification", pass: pass1 });

    // ------------------------------------------------------------
    // TEST 2: User A Report Isolation & Accuracy
    // ------------------------------------------------------------
    console.log("\n--- TEST 2: User A Report Accuracy & Isolation ---");
    const rA = dataA.report;
    const userAIncome = rA.financialSummary?.totalIncome;
    const userAExpenses = rA.financialSummary?.totalExpenses;
    const hasAlphaFund = (rA.plans?.investments || []).some((i) => i.name === "Alpha Mutual Fund");
    const leaksBetaLoan = (rA.plans?.liabilities || []).some((l) => l.name === "Beta Car Loan");
    const leaksBetaInsurance = (rA.plans?.insurance || []).some((i) => i.name === "Beta Health Policy");

    const pass2 =
      dataA.user?.email === userA.email &&
      userAIncome === 120000 &&
      userAExpenses === 45000 &&
      hasAlphaFund &&
      !leaksBetaLoan &&
      !leaksBetaInsurance;

    console.log(`Test 2 Result: ${pass2 ? "PASS" : "FAIL"}`);
    console.log(`  User A Income: ₹${userAIncome} (Expected: 120000)`);
    console.log(`  User A Expenses: ₹${userAExpenses} (Expected: 45000)`);
    console.log(`  Contains Alpha SIP: ${hasAlphaFund}`);
    console.log(`  Zero Beta Car Loan Leakage: ${!leaksBetaLoan}`);
    console.log(`  Zero Beta Insurance Leakage: ${!leaksBetaInsurance}`);
    testResults.push({ name: "2. User A Report Isolation (Zero User B Leakage)", pass: pass2 });

    // ------------------------------------------------------------
    // TEST 3: User B Report Isolation & Accuracy
    // ------------------------------------------------------------
    console.log("\n--- TEST 3: User B Report Accuracy & Isolation ---");
    const resB = await fetch(`${BASE_URL}/api/admin/users/${userB._id}/reports?duration=monthly&year=2026&month=9`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataB = await resB.json();
    const rB = dataB.report;

    const userBIncome = rB.financialSummary?.totalIncome;
    const userBExpenses = rB.financialSummary?.totalExpenses;
    const hasBetaLoan = (rB.plans?.liabilities || []).some((l) => l.name === "Beta Car Loan");
    const hasBetaInsurance = (rB.plans?.insurance || []).some((i) => i.name === "Beta Health Policy");
    const leaksAlphaFund = (rB.plans?.investments || []).some((i) => i.name === "Alpha Mutual Fund");
    const leaksAlphaGoal = (rB.plans?.savingGoals || []).some((g) => g.name === "Alpha Emergency Goal");

    const pass3 =
      dataB.user?.email === userB.email &&
      userBIncome === 70000 &&
      userBExpenses === 25000 &&
      hasBetaLoan &&
      hasBetaInsurance &&
      !leaksAlphaFund &&
      !leaksAlphaGoal;

    console.log(`Test 3 Result: ${pass3 ? "PASS" : "FAIL"}`);
    console.log(`  User B Income: ₹${userBIncome} (Expected: 70000)`);
    console.log(`  User B Expenses: ₹${userBExpenses} (Expected: 25000)`);
    console.log(`  Contains Beta Loan: ${hasBetaLoan}`);
    console.log(`  Contains Beta Insurance: ${hasBetaInsurance}`);
    console.log(`  Zero Alpha Mutual Fund Leakage: ${!leaksAlphaFund}`);
    console.log(`  Zero Alpha Goal Leakage: ${!leaksAlphaGoal}`);
    testResults.push({ name: "3. User B Report Isolation (Zero User A Leakage)", pass: pass3 });

    // ------------------------------------------------------------
    // TEST 4: Query Parameters (Quarterly & Yearly Views)
    // ------------------------------------------------------------
    console.log("\n--- TEST 4: Query Parameters (Quarterly & Yearly) ---");
    const resQuarterly = await fetch(`${BASE_URL}/api/admin/users/${userA._id}/reports?duration=quarterly&year=2026&quarter=3`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataQuarterly = await resQuarterly.json();
    const pass4_1 = resQuarterly.status === 200 && dataQuarterly.report.header?.duration === "quarterly";

    const resYearly = await fetch(`${BASE_URL}/api/admin/users/${userA._id}/reports?duration=yearly&year=2026`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const dataYearly = await resYearly.json();
    const pass4_2 = resYearly.status === 200 && dataYearly.report.header?.duration === "yearly";

    const pass4 = pass4_1 && pass4_2;
    console.log(`Test 4 Result: ${pass4 ? "PASS" : "FAIL"}`);
    console.log(`  Quarterly Duration: ${pass4_1}`);
    console.log(`  Yearly Duration: ${pass4_2}`);
    testResults.push({ name: "4. Multi-Duration Report Aggregation", pass: pass4 });

    // ------------------------------------------------------------
    // TEST 5: Security & Authorization Boundary Checks
    // ------------------------------------------------------------
    console.log("\n--- TEST 5: Security & Role Boundaries ---");
    // 5.1 Non-Admin token access rejected (403)
    const resNonAdmin = await fetch(`${BASE_URL}/api/admin/users/${userB._id}/reports`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const pass5_1 = resNonAdmin.status === 403;

    // 5.2 Unauthenticated access rejected (401)
    const resUnauth = await fetch(`${BASE_URL}/api/admin/users/${userB._id}/reports`);
    const pass5_2 = resUnauth.status === 401;

    // 5.3 Invalid ObjectId rejected (400)
    const resInvalidId = await fetch(`${BASE_URL}/api/admin/users/invalid-id-123/reports`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const pass5_3 = resInvalidId.status === 400;

    // 5.4 Non-existent user rejected (404)
    const randomObjectId = new mongoose.Types.ObjectId();
    const resNotFound = await fetch(`${BASE_URL}/api/admin/users/${randomObjectId}/reports`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const pass5_4 = resNotFound.status === 404;

    const pass5 = pass5_1 && pass5_2 && pass5_3 && pass5_4;
    console.log(`Test 5 Result: ${pass5 ? "PASS" : "FAIL"}`);
    console.log(`  5.1 Non-Admin access rejected (403): ${pass5_1}`);
    console.log(`  5.2 Unauthenticated access rejected (401): ${pass5_2}`);
    console.log(`  5.3 Invalid user ID rejected (400): ${pass5_3}`);
    console.log(`  5.4 Non-existent user rejected (404): ${pass5_4}`);
    testResults.push({ name: "5. Security, Authorization & Error Handling", pass: pass5 });

  } finally {
    // Cleanup
    if (adminUser) await User.deleteOne({ _id: adminUser._id });
    if (userA) {
      await User.deleteOne({ _id: userA._id });
      await MonthlyFinance.deleteMany({ user: userA._id });
      await Investment.deleteMany({ user: userA._id });
      await SavingGoal.deleteMany({ user: userA._id });
    }
    if (userB) {
      await User.deleteOne({ _id: userB._id });
      await MonthlyFinance.deleteMany({ user: userB._id });
      await Liability.deleteMany({ user: userB._id });
      await Insurance.deleteMany({ user: userB._id });
    }
    await mongoose.disconnect();
  }

  console.log("\n============================================================");
  console.log("ADMIN REPORTS ISOLATION AUDIT SUMMARY");
  console.log("============================================================");
  let allPass = true;
  testResults.forEach((t) => {
    console.log(`- [${t.pass ? "PASS" : "FAIL"}] ${t.name}`);
    if (!t.pass) allPass = false;
  });
  console.log("============================================================");
  console.log(`FINAL ADMIN REPORTS RESULT: ${allPass ? "ALL TESTS PASSED (5/5)" : "FAILURES DETECTED"}`);
  console.log("============================================================\n");

  if (!allPass) process.exit(1);
}

runAdminReportsIsolationTests().catch((err) => {
  console.error("Fatal Test Error:", err);
  process.exit(1);
});
