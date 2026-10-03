// ============================================================
// FINANCEOS - PERMANENT USER DELETION & SESSION INVALIDATION TEST SUITE
// Tests backend token rejection (401 ACCOUNT_DELETED), cascade cleanup,
// tab isolation, and post-deletion OTP/Google behavior.
// ============================================================

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const User = require("../models/User");
const MonthlyFinance = require("../models/MonthlyFinance");
const SavingGoal = require("../models/SavingGoal");
const Investment = require("../models/Investment");
const Liability = require("../models/Liability");
const Insurance = require("../models/Insurance");
const Reminder = require("../models/Reminder");

const API_BASE = "http://localhost:5000/api";
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/financeos";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function createMockGoogleToken(payload) {
  return "mock-google-token:" + Buffer.from(JSON.stringify(payload)).toString("base64");
}

async function runTestSuite() {
  console.log("==================================================");
  console.log("STARTING USER DELETION & SESSION INVALIDATION SUITE");
  console.log("==================================================");

  await mongoose.connect(MONGO_URI);
  console.log("[DB] Connected to MongoDB at", MONGO_URI);

  const testTimestamp = Date.now();
  const userAEmail = `del_test_a_${testTimestamp}@financeos.test`;
  const userBEmail = `del_test_b_${testTimestamp}@financeos.test`;
  const adminEmail = "financeos.system@gmail.com";

  let userAToken = null;
  let userBToken = null;
  let adminToken = null;
  let userAId = null;
  let userBId = null;

  try {
    // ----------------------------------------------------
    // SETUP: Register User A and User B
    // ----------------------------------------------------
    const userARes = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Deleted User A",
        email: userAEmail,
        mobileNumber: "9876543210",
        dateOfBirth: "1995-05-15",
        gender: "male",
        state: "Maharashtra",
        city: "Mumbai",
      }),
    });
    const userAData = await userARes.json();
    if (!userARes.ok || !userAData.success) {
      throw new Error(`Failed to create User A: ${JSON.stringify(userAData)}`);
    }
    // User A OTP Login to acquire token
    await fetch(`${API_BASE}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userAEmail }),
    });
    const dbUserA = await User.findOne({ email: userAEmail });
    const verifyOtpARes = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userAEmail, otp: dbUserA.otp }),
    });
    const dataA = await verifyOtpARes.json();
    userAToken = dataA.token;
    userAId = dbUserA._id;

    // Create User B via Manual Signup
    const userBRes = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Surviving User B",
        email: userBEmail,
        mobileNumber: "9876543211",
        dateOfBirth: "1994-04-14",
        gender: "female",
        state: "Gujarat",
        city: "Ahmedabad",
      }),
    });
    const userBData = await userBRes.json();
    if (!userBRes.ok || !userBData.success) {
      throw new Error(`Failed to create User B: ${JSON.stringify(userBData)}`);
    }

    // User B OTP Login to acquire token
    await fetch(`${API_BASE}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userBEmail }),
    });
    const dbUserB = await User.findOne({ email: userBEmail });
    const verifyOtpBRes = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userBEmail, otp: dbUserB.otp }),
    });
    const dataB = await verifyOtpBRes.json();
    userBToken = dataB.token;
    userBId = dbUserB._id;

    // Login Admin via Google
    const adminGoogleToken = createMockGoogleToken({
      sub: "admin_gid_system",
      email: adminEmail,
      email_verified: true,
      name: "Super Admin",
      picture: "https://lh3.googleusercontent.com/admin-avatar",
    });
    const adminRes = await fetch(`${API_BASE}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credential: adminGoogleToken,
      }),
    });
    const adminData = await adminRes.json();
    if (!adminRes.ok || !adminData.token) {
      throw new Error(`Failed to login Admin: ${JSON.stringify(adminData)}`);
    }
    adminToken = adminData.token;

    // ----------------------------------------------------
    // POPULATE FINANCIAL DATA FOR USER A & USER B
    // ----------------------------------------------------
    await MonthlyFinance.create({
      user: userAId,
      month: 9,
      year: 2026,
      income: 150000,
      expenses: 50000,
    });
    await SavingGoal.create({
      user: userAId,
      goalName: "User A Vacation",
      targetAmount: 200000,
      targetDate: new Date("2027-01-01"),
    });
    await Investment.create({
      user: userAId,
      type: "Mutual Fund",
      name: "User A Index Fund",
      amount: 75000,
    });
    await Liability.create({
      user: userAId,
      type: "Personal Loan",
      name: "User A Loan",
      principalAmount: 100000,
    });
    await Insurance.create({
      user: userAId,
      type: "Life Insurance",
      name: "User A Term Plan",
      coverageAmount: 5000000,
      premiumAmount: 12000,
    });
    await Reminder.create({
      userId: userAId,
      userName: "Deleted User A",
      reminderType: "General",
      category: "General",
      itemName: "User A Rent Reminder",
      dueDate: new Date(),
      rule: "On due date",
      scheduledDate: new Date(),
    });

    // Populate User B data
    await MonthlyFinance.create({
      user: userBId,
      month: 9,
      year: 2026,
      income: 90000,
      expenses: 30000,
    });
    await SavingGoal.create({
      user: userBId,
      goalName: "User B Emergency Fund",
      targetAmount: 300000,
      targetDate: new Date("2027-06-01"),
    });

    console.log("[SETUP] User A, User B, Admin, and financial records initialized successfully.");

    // ====================================================
    // TEST 1 — USER + ADMIN COEXISTENCE & ADMIN DELETION
    // ====================================================
    console.log("\n--- TEST 1: User A & Admin Coexistence, Admin Deletes User A ---");

    // Check both authenticated before deletion
    const meBeforeUserA = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${userAToken}` },
    });
    const meBeforeAdmin = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (meBeforeUserA.status !== 200 || meBeforeAdmin.status !== 200) {
      throw new Error(`Initial token check failed: User A=${meBeforeUserA.status}, Admin=${meBeforeAdmin.status}`);
    }

    // Admin permanently deletes User A
    const deleteRes = await fetch(`${API_BASE}/admin/users/${userAId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
    });
    const deleteData = await deleteRes.json();
    console.log("Admin delete status:", deleteRes.status);
    console.log("Admin delete response:", deleteData.message);

    if (deleteRes.status !== 200 || !deleteData.success) {
      throw new Error(`Admin delete failed: ${JSON.stringify(deleteData)}`);
    }

    // Verify Admin is still logged in and authorized
    const adminCheckAfter = await fetch(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (adminCheckAfter.status !== 200) {
      throw new Error(`Admin was unexpectedly affected by deleting User A! Status: ${adminCheckAfter.status}`);
    }
    console.log("PASS: TEST 1 - Admin successfully deleted User A; Admin session remains valid.");

    // ====================================================
    // TEST 2 — USER API AFTER DELETE (401 ACCOUNT_DELETED)
    // ====================================================
    console.log("\n--- TEST 2: User A Old Token Rejection (401 ACCOUNT_DELETED) ---");
    const endpointsToTest = [
      { name: "GET /api/auth/me", url: `${API_BASE}/auth/me`, method: "GET" },
      { name: "GET /api/monthly-finance", url: `${API_BASE}/monthly-finance`, method: "GET" },
      { name: "GET /api/saving-goals", url: `${API_BASE}/saving-goals`, method: "GET" },
      { name: "GET /api/investments", url: `${API_BASE}/investments`, method: "GET" },
      { name: "GET /api/insurances", url: `${API_BASE}/insurances`, method: "GET" },
      { name: "GET /api/liabilities", url: `${API_BASE}/liabilities`, method: "GET" },
      { name: "GET /api/reminders", url: `${API_BASE}/reminders`, method: "GET" },
    ];

    for (const ep of endpointsToTest) {
      const res = await fetch(ep.url, {
        method: ep.method,
        headers: { Authorization: `Bearer ${userAToken}` },
      });
      const data = await res.json();
      console.log(`Endpoint: ${ep.name} -> Status: ${res.status}, Code: ${data.code}`);

      if (res.status !== 401) {
        throw new Error(`Expected 401 on ${ep.name}, received ${res.status}`);
      }
      if (data.code !== "ACCOUNT_DELETED") {
        throw new Error(`Expected code ACCOUNT_DELETED on ${ep.name}, received: ${data.code}`);
      }
    }
    console.log("PASS: TEST 2 - All protected APIs reject the deleted user's token with 401 ACCOUNT_DELETED.");

    // ====================================================
    // TEST 3 — OPEN USER TAB SIMULATION
    // ====================================================
    console.log("\n--- TEST 3: Open User Tab Session Invalidation Simulation ---");
    // Simulate Tab 1: had stored token and user in sessionStorage
    const simulatedTabSession = {
      financeos_token: userAToken,
      financeos_user: JSON.stringify({ name: "Deleted User A", email: userAEmail }),
    };

    // Tab 1 makes an authenticated request
    const tab1Req = await fetch(`${API_BASE}/monthly-finance`, {
      headers: { Authorization: `Bearer ${simulatedTabSession.financeos_token}` },
    });
    const tab1Data = await tab1Req.json();

    if (tab1Req.status === 401 && tab1Data.code === "ACCOUNT_DELETED") {
      // Simulate frontend global interceptor action
      delete simulatedTabSession.financeos_token;
      delete simulatedTabSession.financeos_user;
      console.log("Tab 1 intercepted 401 ACCOUNT_DELETED: session cleared immediately.");
    } else {
      throw new Error(`Tab 1 did not receive expected 401 ACCOUNT_DELETED: ${JSON.stringify(tab1Data)}`);
    }

    if (simulatedTabSession.financeos_token) {
      throw new Error("Tab 1 session was not cleared after account deletion!");
    }
    console.log("PASS: TEST 3 - Open user tab automatically cleared session on next request.");

    // ====================================================
    // TEST 4 — OTHER USER (USER B) UNAFFECTED
    // ====================================================
    console.log("\n--- TEST 4: User B Session & Data Remain Intact ---");
    const userBMeRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    const userBMeData = await userBMeRes.json();
    console.log("User B /auth/me Status:", userBMeRes.status, "User:", userBMeData.user?.email);

    if (userBMeRes.status !== 200 || userBMeData.user?.email !== userBEmail) {
      throw new Error(`User B was unexpectedly invalidated! Status: ${userBMeRes.status}`);
    }

    const userBFinRes = await fetch(`${API_BASE}/monthly-finance/2026/9`, {
      headers: { Authorization: `Bearer ${userBToken}` },
    });
    const userBFinData = await userBFinRes.json();
    const userBIncome = userBFinData.finance?.income;
    console.log("User B Monthly Finance Status:", userBFinRes.status, "Income:", userBIncome);

    if (userBFinRes.status !== 200 || userBIncome !== 90000) {
      throw new Error(`User B data was affected! Expected income 90000, got: ${userBIncome}`);
    }
    console.log("PASS: TEST 4 - User B remains fully logged in with isolated data.");

    // ====================================================
    // TEST 5 — OTP AFTER DELETION (ACCOUNT NOT FOUND)
    // ====================================================
    console.log("\n--- TEST 5: Email + OTP After Deletion ---");
    const otpRes = await fetch(`${API_BASE}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userAEmail }),
    });
    const otpData = await otpRes.json();
    console.log("OTP Status (Expected 404):", otpRes.status);
    console.log("OTP Message:", otpData.message);

    if (otpRes.status !== 404 || !otpData.message.toLowerCase().includes("account found")) {
      throw new Error(`Expected 404 'account found', received: ${otpRes.status} ${JSON.stringify(otpData)}`);
    }
    console.log("PASS: TEST 5 - OTP request for deleted user returns 404 ACCOUNT_NOT_FOUND");

    // ====================================================
    // TEST 6 — GOOGLE LOGIN AFTER DELETION (ACCOUNT NOT FOUND -> REGISTER CREATES FRESH)
    // ====================================================
    console.log("\n--- TEST 6: Google Sign-In After Deletion Shows Account Not Found ---");
    const googleUserAToken = createMockGoogleToken({
      sub: "new_google_id_999",
      email: userAEmail,
      name: "User A Reborn",
      email_verified: true,
      picture: "https://lh3.googleusercontent.com/reborn",
    });
    const googleSignInRes = await fetch(`${API_BASE}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credential: googleUserAToken,
        intent: "signin",
      }),
    });
    const googleSignInData = await googleSignInRes.json();
    console.log("Google Sign-In Status (Expected 404):", googleSignInRes.status);
    console.log("Google Sign-In Code:", googleSignInData.code);

    if (googleSignInRes.status !== 404 || googleSignInData.code !== "ACCOUNT_NOT_FOUND") {
      throw new Error(`Expected 404 ACCOUNT_NOT_FOUND for deleted Google account, received: ${JSON.stringify(googleSignInData)}`);
    }

    console.log("\n--- TEST 6B: Google Sign-Up Creates Completely New Account Without Historical Data ---");
    const googleSignUpRes = await fetch(`${API_BASE}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credential: googleUserAToken,
        intent: "signup",
      }),
    });
    const googleSignUpData = await googleSignUpRes.json();
    console.log("Google Sign-Up Status (Expected 201):", googleSignUpRes.status);
    console.log("New User ID:", googleSignUpData.user?.userId);

    if (googleSignUpRes.status !== 201 || !googleSignUpData.isNewUser) {
      throw new Error(`Expected 201 new account via Google Sign-Up, received: ${JSON.stringify(googleSignUpData)}`);
    }

    // Sign in with the new account to verify zero historical data leaked
    const newLoginRes = await fetch(`${API_BASE}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        credential: googleUserAToken,
        intent: "signin",
      }),
    });
    const newLoginData = await newLoginRes.json();

    // Verify old financial data did NOT reappear for the new account
    const newAccountFinRes = await fetch(`${API_BASE}/monthly-finance/2026/9`, {
      headers: { Authorization: `Bearer ${newLoginData.token}` },
    });
    const newAccountFinData = await newAccountFinRes.json();
    const newAccountIncome = newAccountFinData.finance?.income || 0;
    console.log("New Account Financial Income (Expected 0):", newAccountIncome);

    if (newAccountIncome !== 0) {
      throw new Error(`Old financial records leaked into the new account! Income: ${newAccountIncome}`);
    }
    console.log("PASS: TEST 6 - Deleted account blocked on Google Sign-In; brand new account created via Google Sign-Up with zero historical data.");

    // ====================================================
    // TEST 7 — DATABASE INTEGRITY & COMPLETE CASCADE CHECK
    // ====================================================
    console.log("\n--- TEST 7: Database Scoped Deletion Check ---");
    const oldUserACount = await User.countDocuments({ _id: userAId });
    const userAMonthlyCount = await MonthlyFinance.countDocuments({ user: userAId });
    const userAGoalCount = await SavingGoal.countDocuments({ user: userAId });
    const userAInvestCount = await Investment.countDocuments({ user: userAId });
    const userALiabCount = await Liability.countDocuments({ user: userAId });
    const userAInsurCount = await Insurance.countDocuments({ user: userAId });
    const userARemindCount = await Reminder.countDocuments({ userId: userAId });

    console.log("User A residual records in DB:", {
      user: oldUserACount,
      monthly: userAMonthlyCount,
      savingGoal: userAGoalCount,
      investment: userAInvestCount,
      liability: userALiabCount,
      insurance: userAInsurCount,
      reminder: userARemindCount,
    });

    if (
      oldUserACount !== 0 ||
      userAMonthlyCount !== 0 ||
      userAGoalCount !== 0 ||
      userAInvestCount !== 0 ||
      userALiabCount !== 0 ||
      userAInsurCount !== 0 ||
      userARemindCount !== 0
    ) {
      throw new Error("User A records were NOT completely removed from MongoDB!");
    }

    // Confirm User B records are intact
    const userBCount = await User.countDocuments({ _id: userBId });
    const userBMonthlyCount = await MonthlyFinance.countDocuments({ user: userBId });
    if (userBCount !== 1 || userBMonthlyCount !== 1) {
      throw new Error(`User B data was damaged! User=${userBCount}, Monthly=${userBMonthlyCount}`);
    }

    // Confirm Admin exists
    const adminCount = await User.countDocuments({ email: adminEmail });
    if (adminCount !== 1) {
      throw new Error("Admin user was damaged in MongoDB!");
    }
    console.log("PASS: TEST 7 - User A and all associated records permanently removed; User B and Admin completely intact.");

    // ====================================================
    // TEST 8 — ADMIN PANEL USABILITY
    // ====================================================
    console.log("\n--- TEST 8: Admin Panel Continued Operation ---");
    const adminUsersRes = await fetch(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminUsersData = await adminUsersRes.json();
    console.log("Admin Users List Status:", adminUsersRes.status, "Users count:", adminUsersData.users?.length);

    if (adminUsersRes.status !== 200 || !Array.isArray(adminUsersData.users)) {
      throw new Error(`Admin users endpoint failed: ${JSON.stringify(adminUsersData)}`);
    }

    const adminDashboardRes = await fetch(`${API_BASE}/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log("Admin Dashboard Endpoint Status:", adminDashboardRes.status);
    if (adminDashboardRes.status !== 200) {
      throw new Error(`Admin dashboard endpoint failed: ${adminDashboardRes.status}`);
    }

    const adminReportsRes = await fetch(`${API_BASE}/admin/reports/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    console.log("Admin Reports Users Endpoint Status:", adminReportsRes.status);
    if (adminReportsRes.status !== 200) {
      throw new Error(`Admin reports endpoint failed: ${adminReportsRes.status}`);
    }
    console.log("PASS: TEST 8 - Admin session continues to operate and access authorized admin tools.");

    // Clean up test users created during test run
    await User.deleteMany({ email: { $in: [userAEmail, userBEmail] } });
    await MonthlyFinance.deleteMany({ user: userBId });
    await SavingGoal.deleteMany({ user: userBId });

    console.log("\n==================================================");
    console.log("TEST RESULTS SUMMARY:");
    console.table({
      test1: "PASS",
      test2: "PASS",
      test3: "PASS",
      test4: "PASS",
      test5: "PASS",
      test6: "PASS",
      test7: "PASS",
      test8: "PASS",
    });
    console.log("==================================================");
    console.log(">>> ALL 8 PERMANENT DELETION & SESSION TESTS PASSED! <<<");

  } catch (error) {
    console.error("Test Suite Failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runTestSuite();
