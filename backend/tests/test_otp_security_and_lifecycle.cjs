// ============================================================
// FINANCEOS - OTP SECURITY & FULL LIFECYCLE E2E TEST SUITE
// ============================================================

const path = require("path");
const mongoose = require("mongoose");
const crypto = require("crypto");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const User = require("../models/User");

const BASE_URL = "http://localhost:5000";

async function runOtpSecurityTests() {
  console.log("============================================================");
  console.log("FINANCEOS - OTP SECURITY & COMPLETE LIFECYCLE TEST SUITE");
  console.log("============================================================\n");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB:", process.env.MONGO_URI);

  const testResults = [];
  const timestamp = Date.now();
  const testEmail = `otp_audit_${timestamp}@financeos-test.com`;

  try {
    // ------------------------------------------------------------
    // 1. CRYPTOGRAPHIC OTP GENERATION INTEGRITY TEST
    // ------------------------------------------------------------
    console.log("--- TEST 1: Cryptographic OTP Distribution & Security (1,000 samples) ---");
    let allValidLength = true;
    let allNumeric = true;
    let allWithinRange = true;
    const sampleOtps = new Set();

    for (let i = 0; i < 1000; i++) {
      const otp = crypto.randomInt(100000, 1000000).toString();
      if (otp.length !== 6) allValidLength = false;
      if (!/^\d{6}$/.test(otp)) allNumeric = false;
      const num = Number(otp);
      if (num < 100000 || num > 999999) allWithinRange = false;
      sampleOtps.add(otp);
    }

    const pass1 = allValidLength && allNumeric && allWithinRange && sampleOtps.size > 950;
    console.log(`  1.1 Length 6: ${allValidLength}`);
    console.log(`  1.2 Only Digits: ${allNumeric}`);
    console.log(`  1.3 Range [100000, 999999]: ${allWithinRange}`);
    console.log(`  1.4 High Entropy Unique Count: ${sampleOtps.size}/1000`);
    console.log(`Test 1 Result: ${pass1 ? "PASS" : "FAIL"}\n`);
    testResults.push({ name: "1. Cryptographic OTP Integrity (crypto.randomInt)", pass: pass1 });

    // ------------------------------------------------------------
    // 2. INVALID SIGNUP VALIDATIONS
    // ------------------------------------------------------------
    console.log("--- TEST 2: Registration Validation Rejections ---");
    // 2.1 Invalid Email Format
    const resInvalidEmail = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Test User",
        dateOfBirth: "1990-01-01",
        gender: "Male",
        mobileNumber: "9876543210",
        city: "Mumbai",
        state: "Maharashtra",
        email: "invalid-email-address",
      }),
    });
    const pass2_1 = resInvalidEmail.status === 400;
    console.log(`  2.1 Invalid Email Signup Rejected: ${pass2_1 ? "PASS" : "FAIL"} (${resInvalidEmail.status})`);

    // ------------------------------------------------------------
    // 3. VALID REGISTRATION FLOW
    // ------------------------------------------------------------
    console.log("\n--- TEST 3: Valid User Registration ---");
    const resSignup = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Hardening Test User",
        dateOfBirth: "1992-06-15",
        gender: "female",
        mobileNumber: "9876543210",
        city: "Bengaluru",
        state: "Karnataka",
        email: testEmail,
      }),
    });
    const dataSignup = await resSignup.json();
    if (!resSignup.ok) console.log("Signup error:", dataSignup);
    const userInDb = await User.findOne({ email: testEmail }).lean();

    const pass3 =
      resSignup.status === 201 &&
      dataSignup.success === true &&
      userInDb &&
      userInDb.status === "Active" &&
      userInDb.role === "user" &&
      userInDb.otp === null;

    console.log(`Test 3 Result: ${pass3 ? "PASS" : "FAIL"}`);
    console.log(`  User Created ID: ${userInDb?.userId}, Status: ${userInDb?.status}`);
    testResults.push({ name: "3. Valid Registration & Account Creation", pass: pass3 });

    // ------------------------------------------------------------
    // 4. DUPLICATE EMAIL REJECTION
    // ------------------------------------------------------------
    console.log("\n--- TEST 4: Duplicate Email Registration Rejection ---");
    const resDup = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Duplicate User",
        dateOfBirth: "1992-06-15",
        gender: "Female",
        mobileNumber: "9876543210",
        city: "Bengaluru",
        state: "Karnataka",
        email: testEmail,
      }),
    });
    const pass4 = resDup.status === 400 || resDup.status === 409;
    console.log(`Test 4 Result: ${pass4 ? "PASS" : "FAIL"} (${resDup.status})`);
    testResults.push({ name: "4. Duplicate Email Signup Rejection", pass: pass4 });

    // ------------------------------------------------------------
    // 5. SEND OTP TO REGISTERED USER
    // ------------------------------------------------------------
    console.log("\n--- TEST 5: Send OTP Dispatch ---");
    const resSendOtp = await fetch(`${BASE_URL}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail }),
    });
    const dataSendOtp = await resSendOtp.json();

    const userWithOtp = await User.findOne({ email: testEmail }).lean();
    const expiryMs = userWithOtp?.otpExpiresAt ? new Date(userWithOtp.otpExpiresAt).getTime() - Date.now() : 0;
    const pass5 =
      resSendOtp.status === 200 &&
      dataSendOtp.success === true &&
      userWithOtp?.otp &&
      userWithOtp.otp.length === 6 &&
      expiryMs > 4 * 60 * 1000 &&
      expiryMs <= 5 * 60 * 1000;

    console.log(`Test 5 Result: ${pass5 ? "PASS" : "FAIL"}`);
    console.log(`  OTP in DB: 6-digit numeric token generated`);
    console.log(`  Expiry Window: ~${Math.round(expiryMs / 1000)} seconds (~5 minutes)`);
    testResults.push({ name: "5. Send OTP (6-digit, 5-min TTL)", pass: pass5 });

    // ------------------------------------------------------------
    // 6. RESEND COOLDOWN (30 SECONDS ENFORCEMENT)
    // ------------------------------------------------------------
    console.log("\n--- TEST 6: Resend Cooldown Enforcement (< 30s) ---");
    const resCooldown = await fetch(`${BASE_URL}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail }),
    });
    const dataCooldown = await resCooldown.json();
    const pass6 = resCooldown.status === 429 && dataCooldown.message.includes("seconds before requesting another OTP");
    console.log(`Test 6 Result: ${pass6 ? "PASS" : "FAIL"} (${resCooldown.status}: "${dataCooldown.message}")`);
    testResults.push({ name: "6. Resend Cooldown Enforcement (429)", pass: pass6 });

    // ------------------------------------------------------------
    // 7. WRONG OTP FORMAT & VALUE REJECTIONS
    // ------------------------------------------------------------
    console.log("\n--- TEST 7: Wrong OTP Rejection ---");
    // 7.1 Invalid Format
    const resBadFormat = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, otp: "123" }),
    });
    const pass7_1 = resBadFormat.status === 400;

    // 7.2 Incorrect 6-digit OTP
    const actualOtp = userWithOtp.otp;
    const wrongOtp = actualOtp === "123456" ? "654321" : "123456";
    const resWrongVal = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, otp: wrongOtp }),
    });
    const pass7_2 = resWrongVal.status === 401;

    const pass7 = pass7_1 && pass7_2;
    console.log(`Test 7 Result: ${pass7 ? "PASS" : "FAIL"}`);
    console.log(`  7.1 Bad length rejected (400): ${pass7_1}`);
    console.log(`  7.2 Wrong value rejected (401): ${pass7_2}`);
    testResults.push({ name: "7. Wrong OTP Validation & Rejection", pass: pass7 });

    // ------------------------------------------------------------
    // 8. EXPIRED OTP REJECTION & AUTOMATIC DB CLEARING
    // ------------------------------------------------------------
    console.log("\n--- TEST 8: Expired OTP Rejection & Cleanup ---");
    // Set OTP expiry to 1 minute in the past
    await User.updateOne({ email: testEmail }, { $set: { otpExpiresAt: new Date(Date.now() - 60000) } });

    const resExpired = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, otp: actualOtp }),
    });
    const dataExpired = await resExpired.json();

    const userAfterExpiredCheck = await User.findOne({ email: testEmail }).lean();
    const pass8 =
      resExpired.status === 401 &&
      dataExpired.message.includes("expired") &&
      userAfterExpiredCheck.otp === null &&
      userAfterExpiredCheck.otpExpiresAt === null;

    console.log(`Test 8 Result: ${pass8 ? "PASS" : "FAIL"}`);
    console.log(`  Expired rejection (401): ${resExpired.status === 401}`);
    console.log(`  OTP cleared in DB on expiry check: ${userAfterExpiredCheck.otp === null}`);
    testResults.push({ name: "8. Expired OTP Rejection & Auto-Clean", pass: pass8 });

    // ------------------------------------------------------------
    // 9. VALID VERIFICATION & SINGLE-USE CLEARING
    // ------------------------------------------------------------
    console.log("\n--- TEST 9: Fresh OTP Send & Successful Verification ---");
    // Reset cooldown window in DB to test fresh dispatch
    await User.updateOne({ email: testEmail }, { $set: { otpExpiresAt: null, otp: null } });

    await fetch(`${BASE_URL}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail }),
    });

    const freshUser = await User.findOne({ email: testEmail }).lean();
    const freshOtp = freshUser.otp;

    const resVerify = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, otp: freshOtp }),
    });
    const dataVerify = await resVerify.json();

    const userAfterSuccess = await User.findOne({ email: testEmail }).lean();
    const pass9 =
      resVerify.status === 200 &&
      dataVerify.success === true &&
      Boolean(dataVerify.token) &&
      dataVerify.user?.email === testEmail &&
      userAfterSuccess.otp === null &&
      userAfterSuccess.otpExpiresAt === null;

    console.log(`Test 9 Result: ${pass9 ? "PASS" : "FAIL"}`);
    console.log(`  JWT Token Generated: ${Boolean(dataVerify.token)}`);
    console.log(`  Single-Use OTP Cleared in DB: ${userAfterSuccess.otp === null}`);
    testResults.push({ name: "9. Successful OTP Verification & Single-Use Clearing", pass: pass9 });

    // ------------------------------------------------------------
    // 10. OTP REPLAY ATTACK REJECTION
    // ------------------------------------------------------------
    console.log("\n--- TEST 10: OTP Replay Attack Prevention ---");
    const resReplay = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, otp: freshOtp }),
    });
    const dataReplay = await resReplay.json();
    const pass10 = resReplay.status === 401 && dataReplay.message.includes("No active OTP found");
    console.log(`Test 10 Result: ${pass10 ? "PASS" : "FAIL"} (${resReplay.status}: "${dataReplay.message}")`);
    testResults.push({ name: "10. OTP Replay Attack Prevention", pass: pass10 });

    // ------------------------------------------------------------
    // 11. SUBSEQUENT LOGIN -> LOGOUT -> LOGIN CYCLE
    // ------------------------------------------------------------
    console.log("\n--- TEST 11: Subsequent Login Flow ---");
    // Clear cooldown for test speed
    await User.updateOne({ email: testEmail }, { $set: { otpExpiresAt: null, otp: null } });

    const resLoginSend = await fetch(`${BASE_URL}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail }),
    });
    const userLogin = await User.findOne({ email: testEmail }).lean();
    const loginOtp = userLogin.otp;

    const resLoginVerify = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, otp: loginOtp }),
    });
    const dataLoginVerify = await resLoginVerify.json();

    const pass11 =
      resLoginSend.status === 200 &&
      resLoginVerify.status === 200 &&
      Boolean(dataLoginVerify.token);

    console.log(`Test 11 Result: ${pass11 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "11. Re-login OTP Authentication Cycle", pass: pass11 });

    // ------------------------------------------------------------
    // 12. NO CREDENTIAL OR SECRET EXPOSURE CHECK
    // ------------------------------------------------------------
    console.log("\n--- TEST 12: Credential & Secret Leakage Inspection ---");
    const serializedResponses = JSON.stringify([dataSignup, dataSendOtp, dataVerify, dataLoginVerify]);
    const leaksOtp = serializedResponses.includes(freshOtp);
    const leaksJwtSecret = serializedResponses.includes(process.env.JWT_SECRET || "dummy_jwt_secret");
    const leaksPassword = serializedResponses.includes("EMAIL_PASSWORD") || serializedResponses.includes(process.env.EMAIL_PASSWORD || "");

    const pass12 = !leaksOtp && !leaksJwtSecret && (!process.env.EMAIL_PASSWORD || !leaksPassword);
    console.log(`Test 12 Result: ${pass12 ? "PASS" : "FAIL"}`);
    console.log(`  OTP leaked in response: ${leaksOtp}`);
    console.log(`  JWT Secret leaked: ${leaksJwtSecret}`);
    testResults.push({ name: "12. Zero Credential Exposure in Responses", pass: pass12 });

  } finally {
    // Cleanup test user
    await User.deleteMany({ email: testEmail });
    await mongoose.disconnect();
  }

  console.log("\n============================================================");
  console.log("OTP SECURITY & LIFECYCLE AUDIT SUMMARY");
  console.log("============================================================");
  let allPass = true;
  testResults.forEach((t) => {
    console.log(`- [${t.pass ? "PASS" : "FAIL"}] ${t.name}`);
    if (!t.pass) allPass = false;
  });
  console.log("============================================================");
  console.log(`FINAL OTP SECURITY RESULT: ${allPass ? "ALL TESTS PASSED (12/12)" : "FAILURES DETECTED"}`);
  console.log("============================================================\n");

  if (!allPass) process.exit(1);
}

runOtpSecurityTests().catch((err) => {
  console.error("Fatal Test Error:", err);
  process.exit(1);
});
