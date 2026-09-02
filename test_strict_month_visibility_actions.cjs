// ============================================================
// FINANCEOS - STRICT MONTH-BASED VISIBILITY & ACTIONS TEST SUITE
// ============================================================

const mongoose = require("mongoose");
const http = require("http");

const {
  isItemActiveInMonth,
  parseSelectedMonth,
  isDateInMonth,
  getMonthName,
} = require("./backend/utils/monthLifecycle");

const User = require("./backend/models/User");
const SavingGoal = require("./backend/models/SavingGoal");
const Investment = require("./backend/models/Investment");
const Insurance = require("./backend/models/Insurance");
const Liability = require("./backend/models/Liability");
const MonthlyFinance = require("./backend/models/MonthlyFinance");

const JWT_SECRET = process.env.JWT_SECRET || "financeos_secret_key_2026";
const jwt = require("jsonwebtoken");

async function runTests() {
  console.log("============================================================");
  console.log("STARTING STRICT MONTH VISIBILITY & ACTIONS TESTS");
  console.log("============================================================\n");

  // 1. Unit Tests for Month Lifecycle Utility
  console.log("--- 1. Testing Month Lifecycle & Boundary Utility ---");

  const mayGoal = {
    name: "May Vacation Goal",
    startDate: "2026-05-10T00:00:00.000Z",
    status: "Active",
  };

  if (isItemActiveInMonth(mayGoal, 2026, 1) !== false) throw new Error("May goal should not be active in Jan 2026");
  if (isItemActiveInMonth(mayGoal, 2026, 2) !== false) throw new Error("May goal should not be active in Feb 2026");
  if (isItemActiveInMonth(mayGoal, 2026, 3) !== false) throw new Error("May goal should not be active in Mar 2026");
  if (isItemActiveInMonth(mayGoal, 2026, 4) !== false) throw new Error("May goal should not be active in Apr 2026");
  if (isItemActiveInMonth(mayGoal, 2026, 5) !== true) throw new Error("May goal SHOULD be active in May 2026");
  if (isItemActiveInMonth(mayGoal, 2026, 6) !== true) throw new Error("May goal SHOULD be active in June 2026");
  console.log("  ✓ Start-date lifecycle visibility correctly isolates pre-creation months");

  const closedGoal = {
    name: "Completed Car Loan",
    startDate: "2026-01-01T00:00:00.000Z",
    closedDate: "2026-06-15T00:00:00.000Z",
    status: "Closed",
  };

  if (isItemActiveInMonth(closedGoal, 2026, 5) !== true) throw new Error("Closed goal should be active in May 2026");
  if (isItemActiveInMonth(closedGoal, 2026, 6) !== true) throw new Error("Closed goal should be active in June 2026");
  if (isItemActiveInMonth(closedGoal, 2026, 7) !== false) throw new Error("Closed goal should NOT be active in July 2026");
  console.log("  ✓ End-date & closure lifecycle correctly de-activates post-closure months");

  const marParsed = parseSelectedMonth("2026-03");
  if (marParsed.year !== 2026 || marParsed.month !== 3) throw new Error("parseSelectedMonth error");
  if (marParsed.minDate !== "2026-03-01" || marParsed.maxDate !== "2026-03-31") throw new Error("parseSelectedMonth bounds error");
  if (!isDateInMonth(new Date("2026-03-15"), 2026, 3)) throw new Error("isDateInMonth valid date error");
  if (isDateInMonth(new Date("2026-04-01"), 2026, 3)) throw new Error("isDateInMonth cross-month date error");
  console.log("  ✓ parseSelectedMonth and isDateInMonth validate exact boundaries");

  // 2. Integration API Tests with Live Backend
  console.log("\n--- 2. Testing Live Controller Endpoints via HTTP ---");

  // Connect to DB for test user setup
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/financeos");
  console.log("  ✓ Connected to MongoDB");

  let testUser = await User.findOne({ email: "monthtest@financeos.com" });
  if (!testUser) {
    testUser = await User.create({
      fullName: "Month Test User",
      email: "monthtest@financeos.com",
      password: "hashedpassword123",
      isVerified: true,
    });
  }

  const token = jwt.sign({ id: testUser._id, email: testUser.email }, JWT_SECRET, { expiresIn: "1h" });

  // Clean up previous test artifacts for this user
  await SavingGoal.deleteMany({ user: testUser._id });
  await Investment.deleteMany({ user: testUser._id });
  await Insurance.deleteMany({ user: testUser._id });
  await Liability.deleteMany({ user: testUser._id });
  await MonthlyFinance.deleteMany({ user: testUser._id });

  // Create March 2026 and May 2026 goals
  const marGoal = await SavingGoal.create({
    user: testUser._id,
    goalName: "March Emergency Fund",
    targetAmount: 50000,
    currentAmount: 0,
    monthlyContribution: 5000,
    startDate: new Date("2026-03-01T00:00:00.000Z"),
    status: "Active",
  });

  const mayFutureGoal = await SavingGoal.create({
    user: testUser._id,
    goalName: "May Laptop Goal",
    targetAmount: 80000,
    currentAmount: 0,
    monthlyContribution: 8000,
    startDate: new Date("2026-05-01T00:00:00.000Z"),
    status: "Active",
  });

  // Setup March MonthlyFinance
  await MonthlyFinance.create({
    user: testUser._id,
    month: 3,
    year: 2026,
    income: 80000,
    expenses: 40000,
    openingBalance: 20000,
    cashBalance: 20000,
    monthlySavings: 40000,
    closingBalance: 60000,
    goalAllocations: 0,
    commitments: 0,
  });

  // Helper HTTP request function
  function makeRequest(options, postData) {
    return new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({ statusCode: res.statusCode, data: JSON.parse(data) });
          } catch (e) {
            resolve({ statusCode: res.statusCode, data });
          }
        });
      });
      req.on("error", reject);
      if (postData) {
        req.write(typeof postData === "string" ? postData : JSON.stringify(postData));
      }
      req.end();
    });
  }

  // TEST 2A: Reject contribution to May goal in March
  console.log("\n  [Test 2A] Contribution in March 2026 to Goal created in May 2026");
  const res2A = await makeRequest(
    {
      hostname: "localhost",
      port: 5000,
      path: `/api/saving-goals/${mayFutureGoal._id}/contribution`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
    {
      amount: 3000,
      selectedMonth: "2026-03",
      date: "2026-03-15",
    }
  );

  if (res2A.statusCode !== 400) {
    throw new Error(`Expected 400 for pre-creation contribution, got ${res2A.statusCode}: ${JSON.stringify(res2A.data)}`);
  }
  console.log(`  ✓ Correctly rejected: "${res2A.data.message}"`);

  // TEST 2B: Reject contribution with date mismatching selectedMonth (e.g. 2026-04-15 in March context)
  console.log("\n  [Test 2B] Contribution date (April 15) outside selectedMonth (March 2026)");
  const res2B = await makeRequest(
    {
      hostname: "localhost",
      port: 5000,
      path: `/api/saving-goals/${marGoal._id}/contribution`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
    {
      amount: 2500,
      selectedMonth: "2026-03",
      date: "2026-04-15",
    }
  );

  if (res2B.statusCode !== 400) {
    throw new Error(`Expected 400 for date mismatch, got ${res2B.statusCode}: ${JSON.stringify(res2B.data)}`);
  }
  console.log(`  ✓ Correctly rejected: "${res2B.data.message}"`);

  // TEST 2C: Successful contribution within March 2026
  console.log("\n  [Test 2C] Valid contribution in March 2026 (date: 2026-03-15)");
  const res2C = await makeRequest(
    {
      hostname: "localhost",
      port: 5000,
      path: `/api/saving-goals/${marGoal._id}/contribution`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
    {
      amount: 4000,
      selectedMonth: "2026-03",
      date: "2026-03-15",
      note: "March savings allocation",
    }
  );

  if (res2C.statusCode !== 200 || !res2C.data.success) {
    throw new Error(`Expected 200 for valid contribution, got ${res2C.statusCode}: ${JSON.stringify(res2C.data)}`);
  }
  console.log(`  ✓ Contribution saved: ₹${res2C.data.goal.currentAmount} total in goal`);

  // Verify that March MonthlyFinance was updated
  const updatedMarFinance = await MonthlyFinance.findOne({ user: testUser._id, month: 3, year: 2026 });
  if (updatedMarFinance.goalAllocations !== 4000) {
    throw new Error(`Expected March goalAllocations = 4000, got ${updatedMarFinance.goalAllocations}`);
  }
  console.log(`  ✓ March 2026 MonthlyFinance.goalAllocations updated to ₹${updatedMarFinance.goalAllocations}`);

  // TEST 2D: SIP Contribution Month Enforcement
  console.log("\n  [Test 2D] SIP Contribution Month Enforcement on Investment");
  const testSIP = await Investment.create({
    user: testUser._id,
    name: "Nifty 50 Index Fund SIP",
    type: "SIP",
    monthlyContribution: 5000,
    amount: 10000,
    startDate: new Date("2026-03-01T00:00:00.000Z"),
    status: "Active",
  });

  // Mismatched date in SIP contribution
  const resSIPMismatch = await makeRequest(
    {
      hostname: "localhost",
      port: 5000,
      path: `/api/investments/${testSIP._id}/contributions`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
    {
      amount: 5000,
      selectedMonth: "2026-03",
      paidDate: "2026-05-10",
      status: "Paid",
    }
  );

  if (resSIPMismatch.statusCode !== 400) {
    throw new Error(`Expected 400 for SIP date mismatch, got ${resSIPMismatch.statusCode}`);
  }
  console.log(`  ✓ SIP Date Mismatch correctly rejected: "${resSIPMismatch.data.message}"`);

  // Valid SIP contribution
  const resSIPValid = await makeRequest(
    {
      hostname: "localhost",
      port: 5000,
      path: `/api/investments/${testSIP._id}/contributions`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
    {
      amount: 5000,
      selectedMonth: "2026-03",
      paidDate: "2026-03-10",
      dueDate: "2026-03-10",
      status: "Paid",
    }
  );

  if (resSIPValid.statusCode !== 201 || !resSIPValid.data.success) {
    throw new Error(`Expected 201 for valid SIP, got ${resSIPValid.statusCode}: ${JSON.stringify(resSIPValid.data)}`);
  }
  console.log(`  ✓ Valid SIP Contribution recorded: ₹${resSIPValid.data.contribution.amount}`);

  // TEST 2E: Insurance Payment Month Enforcement
  console.log("\n  [Test 2E] Insurance Payment Month Enforcement");
  const testIns = await Insurance.create({
    user: testUser._id,
    name: "Health Protect Plus",
    type: "Health Insurance",
    premiumAmount: 12000,
    premiumFrequency: "Yearly",
    startDate: new Date("2026-03-01T00:00:00.000Z"),
    status: "Active",
  });

  const resInsValid = await makeRequest(
    {
      hostname: "localhost",
      port: 5000,
      path: `/api/insurances/${testIns._id}/payment`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
    {
      amount: 12000,
      selectedMonth: "2026-03",
      paidDate: "2026-03-05",
      status: "Paid",
    }
  );

  if (resInsValid.statusCode !== 201 || !resInsValid.data.success) {
    throw new Error(`Expected 201 for valid Insurance payment, got ${resInsValid.statusCode}`);
  }
  console.log(`  ✓ Insurance Payment recorded: ₹${resInsValid.data.payment.amount}`);

  // TEST 2F: Liability Payment Month Enforcement
  console.log("\n  [Test 2F] Liability Payment Month Enforcement");
  const testLiab = await Liability.create({
    user: testUser._id,
    name: "Home Renovation Loan",
    type: "Personal Loan",
    principalAmount: 200000,
    remainingAmount: 200000,
    monthlyEMI: 15000,
    startDate: new Date("2026-03-01T00:00:00.000Z"),
    status: "Active",
  });

  const resLiabValid = await makeRequest(
    {
      hostname: "localhost",
      port: 5000,
      path: `/api/liabilities/${testLiab._id}/payment`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    },
    {
      amount: 15000,
      selectedMonth: "2026-03",
      paidDate: "2026-03-05",
      status: "Paid",
      type: "EMI",
    }
  );

  if (resLiabValid.statusCode !== 200 || !resLiabValid.data.success) {
    throw new Error(`Expected 200 for valid Liability payment, got ${resLiabValid.statusCode}`);
  }
  console.log(`  ✓ Liability Payment recorded: ₹${resLiabValid.data.payment.amount}`);

  console.log("\n============================================================");
  console.log("ALL STRICT MONTH VISIBILITY & ACTION TESTS PASSED (100%)");
  console.log("============================================================");

  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
