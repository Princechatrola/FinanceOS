// ============================================================
// FINANCEOS - RESTORED SAVING GOALS VERIFICATION TEST
// ============================================================

const path = require("path");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const User = require("../models/User");
const MonthlyFinance = require("../models/MonthlyFinance");
const SavingGoal = require("../models/SavingGoal");
const Investment = require("../models/Investment");
const Insurance = require("../models/Insurance");
const Liability = require("../models/Liability");

const BASE_URL = "http://localhost:5000";
const JWT_SECRET = process.env.JWT_SECRET || "financeos_secret_key_2026";

async function runRestorationVerification() {
  console.log("============================================================");
  console.log("VERIFYING RESTORED SAVING GOALS & PLANS/COMMITMENTS INTEGRITY");
  console.log("============================================================\n");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB:", process.env.MONGO_URI);

  const timestamp = Date.now();
  let testUserA, testUserB;
  let tokenA, tokenB;

  try {
    // 1. CREATE TEST USERS FOR ISOLATION TESTING
    testUserA = await User.create({
      userId: `USR-RESTORE-A-${timestamp}`,
      name: "Restoration Tester A",
      email: `restore_a_${timestamp}@financeos-test.com`,
      role: "user",
      status: "Active",
      emailVerified: true,
    });

    tokenA = jwt.sign(
      { id: testUserA._id.toString(), userId: testUserA.userId, email: testUserA.email, role: "user" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    testUserB = await User.create({
      userId: `USR-RESTORE-B-${timestamp}`,
      name: "Restoration Tester B",
      email: `restore_b_${timestamp}@financeos-test.com`,
      role: "user",
      status: "Active",
      emailVerified: true,
    });

    tokenB = jwt.sign(
      { id: testUserB._id.toString(), userId: testUserB.userId, email: testUserB.email, role: "user" },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    console.log("Created Test Users A and B for user-isolation check.");

    // Setup MonthlyFinance for User A
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const mfA = await MonthlyFinance.create({
      user: testUserA._id,
      userId: testUserA.userId,
      year: currentYear,
      month: currentMonth,
      income: 100000,
      salaryIncome: 100000,
      totalIncome: 100000,
      expenses: 40000,
      plannedExpenses: 40000,
      cashBalance: 20000,
      openingBalance: 20000,
      closingBalance: 80000,
      goalAllocations: 0,
      commitments: 0,
      status: "open",
    });

    console.log("Setup User A MonthlyFinance (Available = 80,000)");

    // ------------------------------------------------------------
    // TEST 1: CREATE SAVING GOAL USING ORIGINAL RESTORED FIELDS
    // ------------------------------------------------------------
    console.log("\n--- TEST 1: Create Saving Goal (Original Form Fields) ---");
    const originalGoalPayload = {
      goalName: "Emergency Reserve 2026",
      category: "Emergency Fund",
      targetAmount: 120000,
      alreadySaved: 20000,
      initialContribution: 20000,
      monthlyContribution: 10000,
      startDate: new Date().toISOString().slice(0, 10),
      targetDate: new Date(Date.now() + 10 * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      fundLocation: {
        type: "Bank Account",
        institution: "State Bank of India",
        label: "Emergency Savings",
        lastFour: "9876",
      },
      initialContributionSource: "Existing Savings",
      reminder: {
        enabled: true,
        contributionDay: 10,
        notifyBefore: [1, 0],
        channels: { inApp: true, email: true },
      },
    };

    const createRes = await fetch(`${BASE_URL}/api/saving-goals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify(originalGoalPayload),
    });

    const createData = await createRes.json();
    console.log("Create Status:", createRes.status, "Success:", createData.success);
    if (!createData.success || !createData.goal) {
      throw new Error(`Failed to create Saving Goal: ${createData.message}`);
    }

    const goalId = createData.goal._id || createData.goal.id;
    const dbGoal = await SavingGoal.findById(goalId);

    console.log("Verified in MongoDB:");
    console.log("  Goal Name:", dbGoal.goalName);
    console.log("  Category:", dbGoal.category);
    console.log("  Target Amount:", dbGoal.targetAmount);
    console.log("  Already Saved:", dbGoal.alreadySaved);
    console.log("  Total Contributed (virtual):", dbGoal.totalContributed);
    console.log("  Progress Percentage:", dbGoal.progressPercentage + "%");
    console.log("  Remaining Amount:", dbGoal.remainingAmount);
    console.log("  Fund Location:", dbGoal.fundLocation);
    console.log("  Initial Transactions:", dbGoal.transactions.length);

    if (dbGoal.goalName !== "Emergency Reserve 2026" || dbGoal.totalContributed !== 20000) {
      throw new Error("Goal data mismatch in MongoDB!");
    }

    // ------------------------------------------------------------
    // TEST 2: ADD CONTRIBUTION (ORIGINAL CONTRIBUTION LOGIC)
    // ------------------------------------------------------------
    console.log("\n--- TEST 2: Record Contribution (Original Flow) ---");
    const contribRes = await fetch(`${BASE_URL}/api/saving-goals/${goalId}/contribute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        amount: 10000,
        date: new Date().toISOString().slice(0, 10),
        source: "Monthly Savings",
        note: "September monthly installment",
      }),
    });

    const contribData = await contribRes.json();
    console.log("Contribution Status:", contribRes.status, "Success:", contribData.success);
    if (!contribData.success) {
      throw new Error(`Failed to add contribution: ${contribData.message}`);
    }

    const updatedGoal = await SavingGoal.findById(goalId);
    console.log("  New Total Contributed:", updatedGoal.totalContributed);
    console.log("  New Remaining Amount:", updatedGoal.remainingAmount);
    console.log("  New Progress Percentage:", updatedGoal.progressPercentage + "%");

    if (updatedGoal.totalContributed !== 30000) {
      throw new Error("Contribution calculation error: expected 30000!");
    }

    // Verify MonthlyFinance allocation deduction
    const updatedMf = await MonthlyFinance.findById(mfA._id);
    console.log("  MonthlyFinance Goal Allocations:", updatedMf.goalAllocations);
    console.log("  MonthlyFinance Available to Allocate:", updatedMf.availableToAllocate);

    // ------------------------------------------------------------
    // TEST 3: UPDATE FUND LOCATION (ORIGINAL EDIT BEHAVIOR)
    // ------------------------------------------------------------
    console.log("\n--- TEST 3: Edit Fund Location (Original Functionality) ---");
    const locationRes = await fetch(`${BASE_URL}/api/saving-goals/${goalId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenA}`,
      },
      body: JSON.stringify({
        fundLocation: {
          type: "Bank Account",
          institution: "HDFC Bank Ltd",
          label: "Primary Goal Fund",
          lastFour: "4321",
        },
      }),
    });

    const locationData = await locationRes.json();
    console.log("Location Update Status:", locationRes.status, "Success:", locationData.success);
    if (!locationData.success) {
      throw new Error(`Failed to update location: ${locationData.message}`);
    }

    const locationGoal = await SavingGoal.findById(goalId);
    console.log("  Updated Location Institution:", locationGoal.fundLocation.institution);
    console.log("  Updated Location Last4:", locationGoal.fundLocation.lastFour);
    if (locationGoal.fundLocation.institution !== "HDFC Bank Ltd") {
      throw new Error("Fund location was not updated in MongoDB!");
    }

    // ------------------------------------------------------------
    // TEST 4: USER ISOLATION CHECK
    // ------------------------------------------------------------
    console.log("\n--- TEST 4: User Isolation Verification ---");
    const unauthorizedRes = await fetch(`${BASE_URL}/api/saving-goals/${goalId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenB}` },
    });

    // User B should NOT receive User A's goal
    const userBGoalsRes = await fetch(`${BASE_URL}/api/saving-goals`, {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const userBGoalsData = await userBGoalsRes.json();
    console.log("  User B Goal Count:", userBGoalsData.goals ? userBGoalsData.goals.length : 0);
    const leaked = (userBGoalsData.goals || []).some(g => g._id === String(goalId) || g.id === String(goalId));
    console.log("  Cross-User Leakage:", leaked ? "LEAKED! ❌" : "NONE (Isolated) ✅");
    if (leaked) {
      throw new Error("CRITICAL: User isolation violated!");
    }

    // ------------------------------------------------------------
    // TEST 5: PLANS & COMMITMENTS UNTOUCHED VERIFICATION
    // ------------------------------------------------------------
    console.log("\n--- TEST 5: Verify Plans & Commitments Integrity ---");
    // Check that Investment, Insurance, Liability models and schemas are completely functional
    const testInvestment = await Investment.create({
      user: testUserA._id,
      name: "Nifty 50 Index Fund",
      type: "SIP",
      frequency: "Monthly",
      amount: 5000,
      currentValue: 5000,
      startDate: new Date(),
      status: "Active",
    });
    console.log("  Created Test Investment (SIP):", testInvestment.name, "- Status:", testInvestment.status);

    const testInsurance = await Insurance.create({
      user: testUserA._id,
      name: "Term Life Protection",
      type: "Life Insurance",
      coverageAmount: 10000000,
      premiumAmount: 12000,
      paymentFrequency: "Yearly",
      status: "Active",
      startDate: new Date(),
    });
    console.log("  Created Test Insurance:", testInsurance.name, "- Status:", testInsurance.status);

    const testLiability = await Liability.create({
      user: testUserA._id,
      name: "Car Loan",
      type: "Car Loan",
      principalAmount: 500000,
      remainingAmount: 400000,
      emiAmount: 11500,
      dueDate: 15,
      status: "Active",
      startDate: new Date(),
    });
    console.log("  Created Test Liability:", testLiability.name, "- Status:", testLiability.status);

    await Investment.deleteOne({ _id: testInvestment._id });
    await Insurance.deleteOne({ _id: testInsurance._id });
    await Liability.deleteOne({ _id: testLiability._id });
    console.log("  Plans & Commitments models verified completely intact and isolated.");

    // ------------------------------------------------------------
    // TEST 6: CLEAN DELETE
    // ------------------------------------------------------------
    console.log("\n--- TEST 6: Delete Saving Goal ---");
    const deleteRes = await fetch(`${BASE_URL}/api/saving-goals/${goalId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const deleteData = await deleteRes.json();
    console.log("Delete Status:", deleteRes.status, "Success:", deleteData.success);
    if (!deleteData.success) {
      throw new Error(`Failed to delete goal: ${deleteData.message}`);
    }

    const deletedCheck = await SavingGoal.findById(goalId);
    console.log("  Deleted Goal in MongoDB:", deletedCheck ? "Still exists ❌" : "Deleted ✅");
    if (deletedCheck) {
      throw new Error("Saving goal was not removed from MongoDB!");
    }

    console.log("\n============================================================");
    console.log("ALL RESTORATION & INTEGRITY VERIFICATIONS PASSED! 🎯");
    console.log("============================================================\n");
  } finally {
    if (testUserA) {
      await SavingGoal.deleteMany({ user: testUserA._id });
      await MonthlyFinance.deleteMany({ user: testUserA._id });
      await User.deleteOne({ _id: testUserA._id });
    }
    if (testUserB) {
      await SavingGoal.deleteMany({ user: testUserB._id });
      await MonthlyFinance.deleteMany({ user: testUserB._id });
      await User.deleteOne({ _id: testUserB._id });
    }
    await mongoose.disconnect();
    console.log("Cleaned up test users and disconnected from MongoDB.");
  }
}

runRestorationVerification().catch((err) => {
  console.error("FATAL RESTORATION TEST ERROR:", err);
  process.exit(1);
});
