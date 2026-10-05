// ============================================================
// FINANCEOS - E2E ADMIN PERMANENT DELETE USER TEST
// ============================================================

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const MonthlyFinance = require("../models/MonthlyFinance");
const AdditionalIncome = require("../models/AdditionalIncome");
const SavingGoal = require("../models/SavingGoal");
const Investment = require("../models/Investment");
const InvestmentMaturityAction = require("../models/InvestmentMaturityAction");
const Liability = require("../models/Liability");
const Insurance = require("../models/Insurance");
const Reminder = require("../models/Reminder");
const AISuggestion = require("../models/AISuggestion");
const Activity = require("../models/Activity");
const Message = require("../models/Message");

const API_BASE = "http://localhost:5000/api";
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/financeos";
const JWT_SECRET = process.env.JWT_SECRET || "financeos_secret_key_2026";

async function runTest() {
  console.log("==================================================");
  console.log("STARTING ADMIN PERMANENT USER DELETE E2E TEST");
  console.log("==================================================");

  await mongoose.connect(MONGO_URI);
  console.log("MongoDB connected successfully.");

  let userA = null;
  let userB = null;
  let superAdminUser = null;
  let normalUserToken = "";
  let superAdminToken = "";

  try {
    // ----------------------------------------------------
    // 1. SETUP SUPER ADMIN
    // ----------------------------------------------------
    superAdminUser = await User.findOne({ email: "admin@financeos.com" });
    if (!superAdminUser) {
      superAdminUser = await User.create({
        userId: "FOS-U-999901",
        name: "Super Admin",
        email: "admin@financeos.com",
        role: "admin",
        status: "Active",
      });
    }

    superAdminToken = jwt.sign(
      {
        id: superAdminUser._id,
        _id: superAdminUser._id,
        email: superAdminUser.email,
        role: "admin",
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // ----------------------------------------------------
    // 2. SETUP USER A (TARGET FOR PERMANENT DELETE)
    // ----------------------------------------------------
    const timestamp = Date.now();
    const emailA = `delete_target_${timestamp}@example.com`;
    userA = await User.create({
      userId: `FOS-U-A${timestamp.toString().slice(-5)}`,
      name: "Target Delete User",
      email: emailA,
      role: "user",
      status: "Active",
      phone: "9876543210",
      city: "Mumbai",
      state: "Maharashtra",
    });

    normalUserToken = jwt.sign(
      {
        id: userA._id,
        _id: userA._id,
        email: userA.email,
        role: "user",
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Populate userA data across all 11 associated collections
    await MonthlyFinance.create({
      user: userA._id,
      month: 9,
      year: 2026,
      income: 75000,
      expenses: 35000,
      cashBalance: 50000,
    });

    await AdditionalIncome.create({
      user: userA._id,
      title: "Bonus Project",
      category: "Freelancing",
      amount: 15000,
      month: 9,
      year: 2026,
      receivedDate: new Date(),
    });

    await SavingGoal.create({
      user: userA._id,
      goalName: "Emergency Fund",
      category: "Emergency Fund",
      targetAmount: 200000,
      alreadySaved: 40000,
      targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180),
    });

    const investmentDoc = await Investment.create({
      user: userA._id,
      name: "HDFC Flexi Cap Fund",
      type: "SIP",
      amount: 5000,
      currentValuation: 60000,
      frequency: "Monthly",
      startDate: new Date(),
    });

    await InvestmentMaturityAction.create({
      user: userA._id,
      investment: investmentDoc._id,
      actionType: "BANK_SAVINGS",
      maturityAmount: 10000,
      actionAmount: 10000,
      effectiveDate: new Date(),
    });

    await Liability.create({
      user: userA._id,
      name: "Education Loan",
      type: "Education Loan",
      principalAmount: 300000,
      remainingAmount: 150000,
      monthlyEMI: 8000,
      interestRate: 8.5,
      startDate: new Date(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    });

    await Insurance.create({
      user: userA._id,
      name: "Term Life Cover",
      type: "Life Insurance",
      policyNumber: "POL-12345",
      coverageAmount: 10000000,
      premiumAmount: 12000,
      premiumFrequency: "Yearly",
      startDate: new Date(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 3650),
    });

    await Reminder.create({
      userId: userA._id,
      userCode: userA.userId,
      userName: userA.name,
      email: userA.email,
      reminderType: "Payment",
      category: "Liability",
      itemName: "Education Loan EMI",
      title: "Education Loan EMI",
      amount: 8000,
      rule: "5 days before",
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5),
      scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2),
    });

    await AISuggestion.create({
      user: userA._id,
      title: "Increase Emergency Reserve",
      summary: "Build 6 months of expenses reserve.",
      rationale: "Build 6 months of expenses.",
      category: "Savings",
    });

    await Activity.create({
      userId: userA._id,
      userName: userA.name,
      userEmail: userA.email,
      type: "Registration",
      description: "User registered account",
    });

    await Message.create({
      recipientUser: userA._id,
      userId: userA.userId,
      recipientEmail: userA.email,
      title: "Welcome to FinanceOS",
      message: "Your financial dashboard is ready.",
      type: "Personal",
    });

    console.log(`[PASS] Setup User A (${userA.email}) with records across all 11 collections.`);

    // ----------------------------------------------------
    // 3. SETUP USER B (ISOLATION TEST USER)
    // ----------------------------------------------------
    const emailB = `isolated_b_${timestamp}@example.com`;
    userB = await User.create({
      userId: `FOS-U-B${timestamp.toString().slice(-5)}`,
      name: "Isolated User B",
      email: emailB,
      role: "user",
      status: "Active",
      phone: "9123456780",
    });

    await MonthlyFinance.create({
      user: userB._id,
      month: 9,
      year: 2026,
      income: 120000,
      expenses: 45000,
      cashBalance: 90000,
    });

    await SavingGoal.create({
      user: userB._id,
      goalName: "House Down Payment",
      category: "Home",
      targetAmount: 1000000,
      alreadySaved: 300000,
      targetDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
    });

    await Investment.create({
      user: userB._id,
      name: "Nifty 50 Index Fund",
      type: "SIP",
      amount: 10000,
      currentValuation: 150000,
      frequency: "Monthly",
      startDate: new Date(),
    });

    console.log(`[PASS] Setup User B (${userB.email}) for data isolation verification.`);

    // ----------------------------------------------------
    // 4. TEST BACKEND AUTHORIZATION: NORMAL USER CANNOT DELETE
    // ----------------------------------------------------
    console.log("\n--- Testing Backend Authorization ---");
    const normalUserDeleteRes = await fetch(`${API_BASE}/admin/users/${userA._id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${normalUserToken}`,
      },
    });

    if (normalUserDeleteRes.status === 403) {
      console.log("[PASS] Normal user blocked from deleting user (HTTP 403 Admin access required).");
    } else {
      throw new Error(`Expected 403 for normal user delete, got ${normalUserDeleteRes.status}`);
    }

    // ----------------------------------------------------
    // 5. TEST SUPER ADMIN PROTECTION (CANNOT DELETE SELF/ADMIN)
    // ----------------------------------------------------
    console.log("\n--- Testing Super Admin Protection ---");
    const superAdminSelfDeleteRes = await fetch(`${API_BASE}/admin/users/${superAdminUser._id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${superAdminToken}`,
      },
    });

    const superAdminSelfDeleteData = await superAdminSelfDeleteRes.json();
    if (
      superAdminSelfDeleteRes.status === 403 &&
      superAdminSelfDeleteData.message.includes("Protected administrator accounts cannot be deleted")
    ) {
      console.log("[PASS] Super Admin account protected from deletion (HTTP 403 with friendly message).");
    } else {
      throw new Error(`Super Admin protection failed: ${JSON.stringify(superAdminSelfDeleteData)}`);
    }

    // ----------------------------------------------------
    // 6. TEST PERMANENT DELETE ON USER A
    // ----------------------------------------------------
    console.log("\n--- Testing Permanent Delete of User A ---");
    const deleteUserARes = await fetch(`${API_BASE}/admin/users/${userA._id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${superAdminToken}`,
      },
    });

    const deleteUserAData = await deleteUserARes.json();
    if (!deleteUserARes.ok || !deleteUserAData.success) {
      throw new Error(`Delete User A failed: ${JSON.stringify(deleteUserAData)}`);
    }
    console.log("[PASS] Admin delete API returned HTTP 200 success:", deleteUserAData.message);

    // ----------------------------------------------------
    // 7. VERIFY DATABASE PERMANENT REMOVAL ACROSS ALL COLLECTIONS
    // ----------------------------------------------------
    console.log("\n--- Verifying MongoDB Permanent Deletion for User A ---");

    const checkUserA = await User.findById(userA._id);
    if (checkUserA !== null) {
      throw new Error("FAIL: User A document still exists in MongoDB User collection!");
    }
    console.log("[PASS] User A document is permanently deleted from MongoDB (null).");

    const mfCount = await MonthlyFinance.countDocuments({ user: userA._id });
    const aiCount = await AdditionalIncome.countDocuments({ user: userA._id });
    const sgCount = await SavingGoal.countDocuments({ user: userA._id });
    const invCount = await Investment.countDocuments({ user: userA._id });
    const imaCount = await InvestmentMaturityAction.countDocuments({ user: userA._id });
    const liabCount = await Liability.countDocuments({ user: userA._id });
    const insCount = await Insurance.countDocuments({ user: userA._id });
    const remCount = await Reminder.countDocuments({
      $or: [{ userId: userA._id }, { userCode: userA.userId }],
    });
    const sugCount = await AISuggestion.countDocuments({ user: userA._id });
    const actCount = await Activity.countDocuments({ userId: userA._id });
    const msgCount = await Message.countDocuments({
      $or: [
        { recipientUser: userA._id },
        { userId: userA.userId },
        { recipientEmail: userA.email },
      ],
    });

    console.log(`Associated counts for User A after delete:
- MonthlyFinance: ${mfCount}
- AdditionalIncome: ${aiCount}
- SavingGoal: ${sgCount}
- Investment: ${invCount}
- InvestmentMaturityAction: ${imaCount}
- Liability: ${liabCount}
- Insurance: ${insCount}
- Reminder: ${remCount}
- AISuggestion: ${sugCount}
- Activity: ${actCount}
- Message: ${msgCount}`);

    if (
      mfCount === 0 &&
      aiCount === 0 &&
      sgCount === 0 &&
      invCount === 0 &&
      imaCount === 0 &&
      liabCount === 0 &&
      insCount === 0 &&
      remCount === 0 &&
      sugCount === 0 &&
      actCount === 0 &&
      msgCount === 0
    ) {
      console.log("[PASS] All associated user-owned records permanently removed across all collections!");
    } else {
      throw new Error("FAIL: Some associated records for User A were not deleted!");
    }

    // ----------------------------------------------------
    // 8. VERIFY USER ISOLATION (USER B UNAFFECTED)
    // ----------------------------------------------------
    console.log("\n--- Verifying Data Isolation for User B ---");

    const checkUserB = await User.findById(userB._id);
    if (!checkUserB) {
      throw new Error("FAIL: User B was accidentally deleted!");
    }

    const bMfCount = await MonthlyFinance.countDocuments({ user: userB._id });
    const bSgCount = await SavingGoal.countDocuments({ user: userB._id });
    const bInvCount = await Investment.countDocuments({ user: userB._id });

    if (bMfCount === 1 && bSgCount === 1 && bInvCount === 1) {
      console.log("[PASS] User B and all User B records are 100% intact and unaffected.");
    } else {
      throw new Error(`FAIL: User B data count mismatch! MF=${bMfCount}, SG=${bSgCount}, INV=${bInvCount}`);
    }

    // ----------------------------------------------------
    // 9. VERIFY LOGIN ATTEMPTS FOR DELETED ACCOUNT
    // ----------------------------------------------------
    console.log("\n--- Testing Login After Deletion ---");

    const loginAttemptRes = await fetch(`${API_BASE}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailA }),
    });

    const loginAttemptData = await loginAttemptRes.json();
    if (
      loginAttemptRes.status === 404 &&
      loginAttemptData.message.includes("No account found")
    ) {
      console.log("[PASS] Deleted email cannot log in. Returns HTTP 404: No account found.");
    } else {
      throw new Error(`Expected 404 No account found, got: ${JSON.stringify(loginAttemptData)}`);
    }

    // Verify account was NOT auto-created
    const checkUserARecreated = await User.findOne({ email: emailA });
    if (checkUserARecreated !== null) {
      throw new Error("FAIL: User was auto-created during failed login attempt!");
    }
    console.log("[PASS] Deleted email does not auto-create an account on sign-in attempt.");

    // ----------------------------------------------------
    // 10. VERIFY RE-REGISTRATION AS BRAND NEW ACCOUNT
    // ----------------------------------------------------
    console.log("\n--- Testing Re-registration After Deletion ---");

    // Register User A again via register endpoint (or verify-otp registration flow)
    const registerRes = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Target Delete User New",
        email: emailA,
        mobileNumber: "9876543210",
        dateOfBirth: "1995-05-15",
        gender: "female",
        city: "Pune",
        state: "Maharashtra",
      }),
    });

    const registerData = await registerRes.json();
    if (!registerRes.ok || !registerData.success) {
      throw new Error(`Registration failed: ${JSON.stringify(registerData)}`);
    }

    const reRegisteredUser = await User.findOne({ email: emailA });
    if (!reRegisteredUser) {
      throw new Error("FAIL: Re-registered user not found in MongoDB!");
    }

    console.log(`[PASS] Re-registration created new User document:
- Old user ID: ${userA.userId}
- New user ID: ${reRegisteredUser.userId}
- Old Mongo _id: ${userA._id}
- New Mongo _id: ${reRegisteredUser._id}`);

    if (String(reRegisteredUser._id) === String(userA._id)) {
      throw new Error("FAIL: Re-registered user reused the old MongoDB _id!");
    }
    if (reRegisteredUser.userId === userA.userId) {
      throw new Error("FAIL: Re-registered user reused the old FinanceOS user ID!");
    }

    // Verify old financial records remain 0 for this re-registered user
    const newMfCount = await MonthlyFinance.countDocuments({ user: reRegisteredUser._id });
    const newSgCount = await SavingGoal.countDocuments({ user: reRegisteredUser._id });
    const newInvCount = await Investment.countDocuments({ user: reRegisteredUser._id });

    if (newMfCount === 0 && newSgCount === 0 && newInvCount === 0) {
      console.log("[PASS] Brand new account starts completely clean with 0 old financial records!");
    } else {
      throw new Error("FAIL: Old financial data was somehow attached to the new account!");
    }

    // Clean up re-registered user
    await User.deleteOne({ _id: reRegisteredUser._id });

    console.log("\n==================================================");
    console.log("ALL E2E ADMIN PERMANENT DELETE USER TESTS PASSED!");
    console.log("==================================================");

  } finally {
    // Clean up User B
    if (userB) {
      await MonthlyFinance.deleteMany({ user: userB._id });
      await SavingGoal.deleteMany({ user: userB._id });
      await Investment.deleteMany({ user: userB._id });
      await User.deleteOne({ _id: userB._id });
    }
    await mongoose.disconnect();
  }
}

runTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("TEST FAILED:", err);
    process.exit(1);
  });
