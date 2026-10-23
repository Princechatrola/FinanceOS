// ============================================================
// FINANCEOS - COMPREHENSIVE AUTHENTICATION TEST SUITE
// Tests all scenarios per the updated Google + Manual requirements
// ============================================================

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const User = require("../models/User");
const MonthlyFinance = require("../models/MonthlyFinance");

const API_BASE = "http://localhost:5000/api/auth";

function createMockGoogleToken(payload) {
  return "mock-google-token:" + Buffer.from(JSON.stringify(payload)).toString("base64");
}

async function runTestSuite() {
  console.log("==================================================");
  console.log("STARTING FINANCEOS UPDATED AUTH TEST SUITE");
  console.log("==================================================");

  let results = {};
  let cleanupEmails = [];

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("[DB] Connected to MongoDB at", process.env.MONGO_URI);

    const testGoogleEmail1 = `google_direct_${Date.now()}@gmail.com`;
    const testGoogleSub1 = `sub_google_${Date.now()}`;
    const testGoogleName1 = "Google Direct User";
    const googleToken1 = createMockGoogleToken({
      sub: testGoogleSub1,
      email: testGoogleEmail1,
      email_verified: true,
      name: testGoogleName1,
      picture: "https://lh3.googleusercontent.com/a/test-avatar-direct",
    });

    const testManualEmail = `manual_user_${Date.now()}@financeos.test`;
    const manualGoogleToken = createMockGoogleToken({
      sub: `sub_manual_linked_${Date.now()}`,
      email: testManualEmail,
      email_verified: true,
      name: "Manual User Linked",
      picture: "https://lh3.googleusercontent.com/a/manual-pic",
    });

    cleanupEmails.push(testGoogleEmail1, testManualEmail);

    // ----------------------------------------------------
    // TEST 1: New Google User -> Account created immediately, logged in, no manual form
    // ----------------------------------------------------
    console.log("\n--- TEST 1: New Google User Immediate Registration & Login ---");
    const newGoogleRes = await fetch(`${API_BASE}/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: googleToken1 }),
    });
    const newGoogleData = await newGoogleRes.json();
    console.log("New Google Status:", newGoogleRes.status);
    console.log("New Google Response:", {
      success: newGoogleData.success,
      userExists: newGoogleData.userExists,
      isNewUser: newGoogleData.isNewUser,
      hasToken: Boolean(newGoogleData.token),
      userId: newGoogleData.user?.userId,
      role: newGoogleData.user?.role,
    });

    const userCountGoogle1 = await User.countDocuments({ email: testGoogleEmail1 });
    const dbGoogleUser1 = await User.findOne({ email: testGoogleEmail1 });

    if (
      newGoogleRes.status === 200 &&
      newGoogleData.success === true &&
      newGoogleData.userExists === true &&
      newGoogleData.token &&
      userCountGoogle1 === 1 &&
      dbGoogleUser1 &&
      dbGoogleUser1.authProvider === "google" &&
      dbGoogleUser1.googleId === testGoogleSub1 &&
      dbGoogleUser1.role === "user"
    ) {
      console.log("PASS: TEST 1 - New Google user registered immediately in MongoDB without manual form.");
      results.test1 = "PASS";
    } else {
      console.error("FAIL: TEST 1", newGoogleData);
      results.test1 = "FAIL";
    }

    // ----------------------------------------------------
    // TEST 2: New Manual User -> Full form validation, Save & Continue creates account
    // ----------------------------------------------------
    console.log("\n--- TEST 2: Manual Registration Flow ---");
    // 2a: Test missing field validation
    const invalidSignupRes = await fetch(`${API_BASE}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Incomplete User",
        email: testManualEmail,
      }),
    });
    const invalidSignupData = await invalidSignupRes.json();
    console.log("Invalid Signup Status (Expected 400):", invalidSignupRes.status);

    // 2b: Test complete manual signup
    const manualSignupRes = await fetch(`${API_BASE}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Manual Complete User",
        dateOfBirth: "1995-05-15",
        gender: "male",
        mobileNumber: "9876543210",
        state: "Maharashtra",
        city: "Mumbai",
        email: testManualEmail,
      }),
    });
    const manualSignupData = await manualSignupRes.json();
    console.log("Manual Signup Status (Expected 201):", manualSignupRes.status);

    const userCountManual = await User.countDocuments({ email: testManualEmail });
    const dbManualUser = await User.findOne({ email: testManualEmail });

    if (
      invalidSignupRes.status === 400 &&
      manualSignupRes.status === 201 &&
      manualSignupData.success === true &&
      userCountManual === 1 &&
      dbManualUser &&
      dbManualUser.authProvider === "email" &&
      dbManualUser.phone === "9876543210"
    ) {
      console.log("PASS: TEST 2 - Manual registration validated all required fields and created MongoDB user.");
      results.test2 = "PASS";
    } else {
      console.error("FAIL: TEST 2", manualSignupData);
      results.test2 = "FAIL";
    }

    // ----------------------------------------------------
    // TEST 3: Existing Google User -> Continue with Google
    // ----------------------------------------------------
    console.log("\n--- TEST 3: Existing Google User Login ---");
    const existingGoogleRes = await fetch(`${API_BASE}/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: googleToken1 }),
    });
    const existingGoogleData = await existingGoogleRes.json();
    console.log("Existing Google Status:", existingGoogleRes.status);

    const userCountExistingGoogle = await User.countDocuments({ email: testGoogleEmail1 });

    if (
      existingGoogleRes.status === 200 &&
      existingGoogleData.success === true &&
      existingGoogleData.token &&
      existingGoogleData.user?.userId === dbGoogleUser1.userId &&
      userCountExistingGoogle === 1
    ) {
      console.log("PASS: TEST 3 - Existing Google user logged in directly, 0 duplicate accounts.");
      results.test3 = "PASS";
    } else {
      console.error("FAIL: TEST 3", existingGoogleData);
      results.test3 = "FAIL";
    }

    // ----------------------------------------------------
    // TEST 4: Google-Created User Uses Email + OTP
    // ----------------------------------------------------
    console.log("\n--- TEST 4: Google User Logs In Via Email + OTP ---");
    const sendOtpRes = await fetch(`${API_BASE}/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testGoogleEmail1 }),
    });
    const sendOtpData = await sendOtpRes.json();
    console.log("Send OTP Status:", sendOtpRes.status, sendOtpData.message);

    const userWithOtp = await User.findOne({ email: testGoogleEmail1 });
    const receivedOtp = userWithOtp?.otp;
    console.log("Retrieved OTP from DB:", receivedOtp);

    const verifyOtpRes = await fetch(`${API_BASE}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testGoogleEmail1, otp: receivedOtp }),
    });
    const verifyOtpData = await verifyOtpRes.json();
    console.log("Verify OTP Status:", verifyOtpRes.status);

    const userCountAfterOtp = await User.countDocuments({ email: testGoogleEmail1 });

    if (
      sendOtpRes.status === 200 &&
      verifyOtpRes.status === 200 &&
      verifyOtpData.success === true &&
      verifyOtpData.user?.userId === dbGoogleUser1.userId &&
      userCountAfterOtp === 1
    ) {
      console.log("PASS: TEST 4 - Google user logged in via OTP using SAME MongoDB user.");
      results.test4 = "PASS";
    } else {
      console.error("FAIL: TEST 4", verifyOtpData);
      results.test4 = "FAIL";
    }

    // ----------------------------------------------------
    // TEST 5: Existing Manual User Uses Google With Same Verified Email
    // ----------------------------------------------------
    console.log("\n--- TEST 5: Manual User Links Google (Same Email) ---");
    const linkGoogleRes = await fetch(`${API_BASE}/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: manualGoogleToken }),
    });
    const linkGoogleData = await linkGoogleRes.json();
    console.log("Link Google Status:", linkGoogleRes.status);

    const userCountLinked = await User.countDocuments({ email: testManualEmail });
    const dbLinkedUser = await User.findOne({ email: testManualEmail });

    if (
      linkGoogleRes.status === 200 &&
      linkGoogleData.success === true &&
      linkGoogleData.user?.userId === dbManualUser.userId &&
      userCountLinked === 1 &&
      dbLinkedUser.googleId
    ) {
      console.log("PASS: TEST 5 - Existing manual user logged in via Google, account linked, same user preserved.");
      results.test5 = "PASS";
    } else {
      console.error("FAIL: TEST 5", linkGoogleData);
      results.test5 = "FAIL";
    }

    // ----------------------------------------------------
    // TEST 6: Unknown Email Uses OTP
    // ----------------------------------------------------
    console.log("\n--- TEST 6: Unknown Email On OTP Login ---");
    const unknownEmail = `unknown_ghost_${Date.now()}@example.com`;
    const unknownOtpRes = await fetch(`${API_BASE}/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: unknownEmail }),
    });
    const unknownOtpData = await unknownOtpRes.json();
    console.log("Unknown OTP Status (Expected 404):", unknownOtpRes.status);
    console.log("Unknown OTP Message:", unknownOtpData.message);

    const unknownUserCount = await User.countDocuments({ email: unknownEmail });

    if (
      unknownOtpRes.status === 404 &&
      unknownOtpData.success === false &&
      unknownOtpData.message === "Account not found. Please create an account first." &&
      unknownUserCount === 0
    ) {
      console.log("PASS: TEST 6 - Returned 404 'Account not found. Please create an account first.', no user created.");
      results.test6 = "PASS";
    } else {
      console.error("FAIL: TEST 6", unknownOtpData);
      results.test6 = "FAIL";
    }

    // ----------------------------------------------------
    // TEST 7: Unknown Google Email -> New Account Created Immediately
    // ----------------------------------------------------
    console.log("\n--- TEST 7: Unknown Google Email Immediate Creation ---");
    const testGoogleEmail2 = `google_second_${Date.now()}@gmail.com`;
    cleanupEmails.push(testGoogleEmail2);
    const googleToken2 = createMockGoogleToken({
      sub: `sub_google2_${Date.now()}`,
      email: testGoogleEmail2,
      email_verified: true,
      name: "Second Google User",
      picture: "https://lh3.googleusercontent.com/a/test-avatar-2",
    });

    const google2Res = await fetch(`${API_BASE}/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: googleToken2 }),
    });
    const google2Data = await google2Res.json();
    console.log("Google 2 Status:", google2Res.status);

    const userCountGoogle2 = await User.countDocuments({ email: testGoogleEmail2 });

    if (
      google2Res.status === 200 &&
      google2Data.success === true &&
      google2Data.token &&
      userCountGoogle2 === 1
    ) {
      console.log("PASS: TEST 7 - Unknown Google email creates new FinanceOS user immediately.");
      results.test7 = "PASS";
    } else {
      console.error("FAIL: TEST 7", google2Data);
      results.test7 = "FAIL";
    }

    // ----------------------------------------------------
    // TEST 8: Double-click Google Button (Concurrent Protection)
    // ----------------------------------------------------
    console.log("\n--- TEST 8: Concurrent Google Login Protection ---");
    const doubleGoogleEmail = `concurrent_google_${Date.now()}@gmail.com`;
    cleanupEmails.push(doubleGoogleEmail);
    const concurrentToken = createMockGoogleToken({
      sub: `sub_concurrent_${Date.now()}`,
      email: doubleGoogleEmail,
      email_verified: true,
      name: "Concurrent Google User",
    });

    const [resA, resB] = await Promise.all([
      fetch(`${API_BASE}/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: concurrentToken }),
      }),
      fetch(`${API_BASE}/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: concurrentToken }),
      }),
    ]);

    console.log("Concurrent Google Statuses:", resA.status, resB.status);
    const doubleGoogleCount = await User.countDocuments({ email: doubleGoogleEmail });
    console.log("MongoDB count for concurrent email:", doubleGoogleCount);

    if (doubleGoogleCount === 1 && (resA.status === 200 || resB.status === 200)) {
      console.log("PASS: TEST 8 - Concurrent Google requests resulted in exactly ONE MongoDB user.");
      results.test8 = "PASS";
    } else {
      console.error("FAIL: TEST 8", { statusA: resA.status, statusB: resB.status, count: doubleGoogleCount });
      results.test8 = "FAIL";
    }

    // ----------------------------------------------------
    // TEST 9: Refresh / Navigate After Google Login (GET /api/auth/me)
    // ----------------------------------------------------
    console.log("\n--- TEST 9: Auth Persistence Via /api/auth/me ---");
    const meRes = await fetch(`${API_BASE}/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${newGoogleData.token}`,
      },
    });
    const meData = await meRes.json();
    console.log("GET /me Status:", meRes.status);
    console.log("GET /me User:", meData.user?.email, meData.user?.userId);

    if (
      meRes.status === 200 &&
      meData.success === true &&
      meData.user?.email === testGoogleEmail1 &&
      meData.user?.userId === dbGoogleUser1.userId
    ) {
      console.log("PASS: TEST 9 - Auth session verified via JWT /me endpoint.");
      results.test9 = "PASS";
    } else {
      console.error("FAIL: TEST 9", meData);
      results.test9 = "FAIL";
    }

    // ----------------------------------------------------
    // TEST 10: Inspect MongoDB Directly (Duplicate & Financial Integrity)
    // ----------------------------------------------------
    console.log("\n--- TEST 10: MongoDB Duplicate & Financial Integrity Check ---");
    const allUsers = await User.find({
      email: { $in: [testGoogleEmail1, testManualEmail, testGoogleEmail2, doubleGoogleEmail] },
    });
    const counts = {};
    for (const u of allUsers) {
      counts[u.email] = (counts[u.email] || 0) + 1;
    }
    console.log("Email counts in MongoDB:", counts);

    const duplicates = Object.values(counts).filter((c) => c > 1);

    // Verify financial data integrity
    const existingMonthly = await MonthlyFinance.findOne({ user: dbManualUser._id });
    if (!existingMonthly) {
      await MonthlyFinance.create({
        user: dbManualUser._id,
        year: 2026,
        month: 9,
        income: 75000,
        expenses: 25000,
      });
    }

    const countMonthlyBefore = await MonthlyFinance.countDocuments({ user: dbManualUser._id });

    // Trigger existing user Google login
    await fetch(`${API_BASE}/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: manualGoogleToken }),
    });

    const countMonthlyAfter = await MonthlyFinance.countDocuments({ user: dbManualUser._id });
    console.log("Financial records before and after login:", countMonthlyBefore, countMonthlyAfter);

    if (duplicates.length === 0 && countMonthlyBefore === countMonthlyAfter && countMonthlyAfter > 0) {
      console.log("PASS: TEST 10 - Exactly one user per account in MongoDB, financial data 100% intact.");
      results.test10 = "PASS";
    } else {
      console.error("FAIL: TEST 10", { duplicates, countMonthlyBefore, countMonthlyAfter });
      results.test10 = "FAIL";
    }

    // Cleanup ONLY the test users created in this run
    console.log("\nCleaning up test users created during test run...");
    await MonthlyFinance.deleteMany({ user: dbManualUser._id });
    await User.deleteMany({ email: { $in: cleanupEmails } });
    console.log("Cleanup complete. Existing pre-run database records were NOT touched.");

    console.log("\n==================================================");
    console.log("TEST RESULTS SUMMARY:");
    console.table(results);
    console.log("==================================================");

    const allPassed = Object.values(results).every((r) => r === "PASS");
    if (allPassed) {
      console.log(">>> ALL 10 TESTS PASSED! <<<");
      process.exit(0);
    } else {
      console.error(">>> SOME TESTS FAILED <<<");
      process.exit(1);
    }
  } catch (err) {
    console.error("Unexpected Test Suite Error:", err);
    process.exit(1);
  }
}

runTestSuite();
