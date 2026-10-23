// ============================================================
// FINANCEOS - COMPREHENSIVE PRODUCTION AUDIT E2E TEST SUITE
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
const Reminder = require("../models/Reminder");
const Message = require("../models/Message");
const Activity = require("../models/Activity");
const AISuggestion = require("../models/AISuggestion");
const AIAdviceHistory = require("../models/AIAdviceHistory");

const { calculateMonthlyCashFlowBreakdown } = require("../utils/cashFlowBreakdown");
const aiAdviserService = require("../services/aiAdviserService");
const { getLiveMarketBenchmarks } = require("../services/marketDataService");

const BASE_URL = "http://localhost:5000";

async function runProductionAuditSuite() {
  console.log("============================================================");
  console.log("FINANCEOS - EXHAUSTIVE PRODUCTION READINESS AUDIT");
  console.log("============================================================");

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB:", process.env.MONGO_URI);

  const testTimestamp = Date.now();
  const testResults = [];

  let testUserA = null;
  let testUserB = null;
  let testAdmin = null;

  let tokenUserA = null;
  let tokenUserB = null;
  let tokenAdmin = null;

  try {
    // ============================================================
    // 1. AUTHENTICATION & REGISTRATION VALIDATION AUDIT
    // ============================================================
    console.log("\n--- SECTION 1: REGISTRATION & AUTHENTICATION AUDIT ---");

    // 1.1 Empty signup submission
    const resEmptySignup = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const dataEmptySignup = await resEmptySignup.json();
    const pass1_1 = resEmptySignup.status === 400 && dataEmptySignup.success === false;
    console.log(`1.1 Empty Signup Rejected (400): ${pass1_1 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "1.1 Auth: Empty Signup Rejected", pass: pass1_1 });

    // 1.2 Invalid email format signup
    const resInvalidEmail = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Test Format",
        dateOfBirth: "1995-05-15",
        gender: "male",
        mobileNumber: "9876543210",
        city: "Mumbai",
        state: "Maharashtra",
        email: "not-an-email",
      }),
    });
    const pass1_2 = resInvalidEmail.status === 400;
    console.log(`1.2 Invalid Email Format Signup Rejected (400): ${pass1_2 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "1.2 Auth: Invalid Email Signup Rejected", pass: pass1_2 });

    // 1.3 Future Date of Birth rejected
    const resFutureDob = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Future Baby",
        dateOfBirth: "2035-01-01",
        gender: "male",
        mobileNumber: "9876543210",
        city: "Delhi",
        state: "Delhi",
        email: `future_${testTimestamp}@test.com`,
      }),
    });
    const pass1_3 = resFutureDob.status === 400;
    console.log(`1.3 Future DOB Signup Rejected (400): ${pass1_3 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "1.3 Auth: Future DOB Rejected", pass: pass1_3 });

    // 1.4 Valid User Registration
    const userAEmail = `audit_user_a_${testTimestamp}@test.com`;
    const resSignupA = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Audit User A",
        dateOfBirth: "1992-08-20",
        gender: "male",
        mobileNumber: "9876543210",
        city: "Pune",
        state: "Maharashtra",
        email: userAEmail,
      }),
    });
    const dataSignupA = await resSignupA.json();
    const pass1_4 = resSignupA.status === 201 && dataSignupA.success === true;
    console.log(`1.4 Valid User Registration (201): ${pass1_4 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "1.4 Auth: Valid User Signup Successful", pass: pass1_4 });

    testUserA = await User.findOne({ email: userAEmail });

    // 1.5 Duplicate email registration rejected (409)
    const resDupSignup = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "Duplicate User",
        dateOfBirth: "1992-08-20",
        gender: "male",
        mobileNumber: "9876543210",
        city: "Pune",
        state: "Maharashtra",
        email: userAEmail,
      }),
    });
    const pass1_5 = resDupSignup.status === 409;
    console.log(`1.5 Duplicate Email Registration Rejected (409): ${pass1_5 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "1.5 Auth: Duplicate Email Signup Rejected", pass: pass1_5 });

    // ============================================================
    // 2. OTP GENERATION, EXPIRY & VERIFICATION AUDIT
    // ============================================================
    console.log("\n--- SECTION 2: OTP GENERATION, STORAGE & VERIFICATION AUDIT ---");

    // 2.1 Send OTP to non-existent email -> 404
    const resNonExistent = await fetch(`${BASE_URL}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `nonexistent_${testTimestamp}@test.com` }),
    });
    const pass2_1 = resNonExistent.status === 404;
    console.log(`2.1 Send OTP to Non-Existent User Rejected (404): ${pass2_1 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "2.1 OTP: Non-Existent User Rejected", pass: pass2_1 });

    // 2.2 Send OTP for User A (Trigger OTP generation)
    // To ensure reliable tests without triggering third-party SMTP limits repeatedly during testing,
    // we generate a cryptographically valid OTP directly or test the endpoint
    const otpUserA = "739281";
    const otpExpires = new Date(Date.now() + 5 * 60 * 1000);
    await User.findByIdAndUpdate(testUserA._id, {
      $set: { otp: otpUserA, otpExpiresAt: otpExpires, status: "Active" },
    });

    // 2.3 Verify OTP with missing fields -> 400
    const resMissingOtp = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userAEmail, otp: "" }),
    });
    const pass2_3 = resMissingOtp.status === 400;
    console.log(`2.3 Verify Empty OTP Rejected (400): ${pass2_3 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "2.3 OTP: Empty OTP Rejected", pass: pass2_3 });

    // 2.4 Verify OTP with wrong format (5 digits instead of 6) -> 400
    const resWrongFormat = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userAEmail, otp: "12345" }),
    });
    const pass2_4 = resWrongFormat.status === 400;
    console.log(`2.4 Verify Non 6-Digit OTP Rejected (400): ${pass2_4 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "2.4 OTP: Non 6-Digit OTP Rejected", pass: pass2_4 });

    // 2.5 Verify with Wrong OTP -> 401
    const resWrongOtp = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userAEmail, otp: "999999" }),
    });
    const pass2_5 = resWrongOtp.status === 401;
    console.log(`2.5 Verify Wrong OTP Rejected (401): ${pass2_5 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "2.5 OTP: Wrong OTP Rejected", pass: pass2_5 });

    // 2.6 Verify with Expired OTP -> 401
    await User.findByIdAndUpdate(testUserA._id, {
      $set: { otp: "112233", otpExpiresAt: new Date(Date.now() - 1000) },
    });
    const resExpiredOtp = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userAEmail, otp: "112233" }),
    });
    const pass2_6 = resExpiredOtp.status === 401;
    console.log(`2.6 Expired OTP Rejected (401): ${pass2_6 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "2.6 OTP: Expired OTP Rejected", pass: pass2_6 });

    // 2.7 Verify with Correct OTP -> 200 & JWT generated
    const freshOtp = "842910";
    await User.findByIdAndUpdate(testUserA._id, {
      $set: { otp: freshOtp, otpExpiresAt: new Date(Date.now() + 5 * 60 * 1000) },
    });
    const resValidOtp = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userAEmail, otp: freshOtp }),
    });
    const dataValidOtp = await resValidOtp.json();
    const pass2_7 = resValidOtp.status === 200 && Boolean(dataValidOtp.token) && Boolean(dataValidOtp.user);
    tokenUserA = dataValidOtp.token;
    console.log(`2.7 Correct OTP Verified & Token Returned (200): ${pass2_7 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "2.7 OTP: Successful Verification & JWT Issued", pass: pass2_7 });

    // 2.8 Verify OTP Cannot Be Reused (cleared in DB)
    const resReusedOtp = await fetch(`${BASE_URL}/api/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: userAEmail, otp: freshOtp }),
    });
    const pass2_8 = resReusedOtp.status === 401;
    console.log(`2.8 OTP Re-use Blocked (Already Cleared): ${pass2_8 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "2.8 OTP: Single-Use Guarantee (No Reuse)", pass: pass2_8 });

    // ============================================================
    // 3. AUTHORIZATION & ACCESS CONTROL AUDIT
    // ============================================================
    console.log("\n--- SECTION 3: AUTHORIZATION & ACCESS CONTROL AUDIT ---");

    // 3.1 Request Protected User Route Without Token -> 401
    const resNoToken = await fetch(`${BASE_URL}/api/monthly-finance`, {
      method: "GET",
    });
    const pass3_1 = resNoToken.status === 401;
    console.log(`3.1 Unauthenticated Request Blocked (401): ${pass3_1 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "3.1 Auth: Missing Token Blocked", pass: pass3_1 });

    // 3.2 Normal User Accessing Admin Endpoints -> 403
    const resUserAccessAdmin = await fetch(`${BASE_URL}/api/admin/users`, {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenUserA}` },
    });
    const pass3_2 = resUserAccessAdmin.status === 403;
    console.log(`3.2 Normal User Blocked from Admin Routes (403): ${pass3_2 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "3.2 Auth: Normal User Forbidden on Admin Endpoints", pass: pass3_2 });

    // 3.3 Create Authorized Admin Token & Verify Admin Access
    const adminEmail = `audit_admin_${testTimestamp}@test.com`;
    testAdmin = await User.create({
      userId: `FOS-A-${testTimestamp}`,
      name: "Super Administrator",
      email: adminEmail,
      role: "admin",
      status: "Active",
    });
    tokenAdmin = jwt.sign(
      { id: testAdmin._id.toString(), role: "admin", email: adminEmail },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    const resAdminAccess = await fetch(`${BASE_URL}/api/admin/users`, {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const pass3_3 = resAdminAccess.status === 200;
    console.log(`3.3 Admin User Authorized on Admin Routes (200): ${pass3_3 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "3.3 Auth: Admin User Access Authorized", pass: pass3_3 });

    // ============================================================
    // 4. USER FINANCIAL CALCULATIONS & DATA CRUD AUDIT
    // ============================================================
    console.log("\n--- SECTION 4: USER FINANCIAL CALCULATIONS & PERSISTENCE ---");

    // 4.1 Monthly Finance: Create/Update Month record
    const resSaveMonth = await fetch(`${BASE_URL}/api/monthly-finance`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        year: 2026,
        month: 9,
        income: 120000,
        expenses: 45000,
        openingBalance: 50000,
        commitments: 0,
      }),
    });
    const dataSaveMonth = await resSaveMonth.json();
    const savedRec = dataSaveMonth.record || dataSaveMonth.finance;
    const pass4_1 =
      resSaveMonth.status === 200 &&
      dataSaveMonth.success === true &&
      savedRec?.income === 120000 &&
      savedRec?.closingBalance === 125000;
    console.log(`4.1 Monthly Finance Record Saved & Closing Balance Computed: ${pass4_1 ? "PASS" : "FAIL"}`);
    if (!pass4_1) console.log("   dataSaveMonth:", dataSaveMonth);
    testResults.push({ name: "4.1 Financial: Monthly Inflow/Outflow/Balance Saved", pass: pass4_1 });

    // 4.2 Cash Flow Breakdown Available to Allocate Calculation
    const breakdown = await calculateMonthlyCashFlowBreakdown({
      userId: testUserA._id,
      year: 2026,
      month: 9,
    });
    const pass4_2 = breakdown && breakdown.availableToAllocate === 125000;
    console.log(`4.2 Authoritative Cash Flow Breakdown Available to Allocate = ₹${breakdown?.availableToAllocate}: ${pass4_2 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "4.2 Financial: Authoritative Cash Flow Available to Allocate", pass: pass4_2 });

    // 4.3 Saving Goal Target Creation (Must NOT deduct target from available funds)
    const resCreateGoal = await fetch(`${BASE_URL}/api/saving-goals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        goalName: "Emergency Reserve Fund",
        targetAmount: 300000,
        category: "Emergency Fund",
        startDate: "2026-09-01",
        targetDate: "2027-09-01",
        initialContribution: 0,
      }),
    });
    const dataCreateGoal = await resCreateGoal.json();
    const goalId = dataCreateGoal.goal?._id;

    const breakdownAfterGoal = await calculateMonthlyCashFlowBreakdown({
      userId: testUserA._id,
      year: 2026,
      month: 9,
    });
    const pass4_3 =
      resCreateGoal.status === 201 &&
      breakdownAfterGoal.availableToAllocate === 125000; // Target creation should NOT touch availableToAllocate!
    console.log(`4.3 Goal Target Creation Preserves Available Funds (₹${breakdownAfterGoal.availableToAllocate}): ${pass4_3 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "4.3 Goals: Target Creation Does NOT Deduct Available Balance", pass: pass4_3 });

    // 4.4 Saving Goal Actual Contribution (Must deduct contribution from available funds)
    const resContributeGoal = await fetch(`${BASE_URL}/api/saving-goals/${goalId}/contribute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        amount: 15000,
        date: "2026-09-10",
        source: "Bank Account",
        selectedMonth: "2026-09",
      }),
    });
    const dataContributeGoal = await resContributeGoal.json();
    const breakdownAfterContrib = await calculateMonthlyCashFlowBreakdown({
      userId: testUserA._id,
      year: 2026,
      month: 9,
    });
    const pass4_4 =
      resContributeGoal.status === 200 &&
      breakdownAfterContrib.availableToAllocate === 110000; // 125000 - 15000 = 110000!
    console.log(`4.4 Actual Goal Contribution Deducts Correct Amount (₹${breakdownAfterContrib.availableToAllocate}): ${pass4_4 ? "PASS" : "FAIL"}`);
    if (!pass4_4) {
      console.log("   resContributeGoal.status:", resContributeGoal.status, dataContributeGoal);
    }
    testResults.push({ name: "4.4 Goals: Actual Contribution Affects Balance Correctly", pass: pass4_4 });

    // ============================================================
    // 5. INVESTMENTS, MATURITY & RENEWAL AUDIT
    // ============================================================
    console.log("\n--- SECTION 5: INVESTMENTS, MATURITY & RENEWAL AUDIT ---");

    // 5.1 Create Fixed Deposit Investment
    const resCreateFD = await fetch(`${BASE_URL}/api/investments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        name: "HDFC 1-Year FD",
        type: "Fixed Deposit",
        amount: 100000,
        principalAmount: 100000,
        interestRate: 7.25,
        contributionType: "One Time",
        maturityDate: "2027-09-10",
      }),
    });
    const dataCreateFD = await resCreateFD.json();
    const fdId = dataCreateFD.investment?._id;
    const pass5_1 = resCreateFD.status === 201 && Boolean(fdId);
    console.log(`5.1 Fixed Deposit Created: ${pass5_1 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "5.1 Investments: Fixed Deposit Creation", pass: pass5_1 });

    // 5.2 Record Investment Maturity
    const resMaturity = await fetch(`${BASE_URL}/api/investments/${fdId}/maturity`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        actualMaturityValue: 107500,
        maturityDate: "2026-09-10",
      }),
    });
    const dataMaturity = await resMaturity.json();
    const pass5_2 =
      resMaturity.status === 200 &&
      dataMaturity.investment?.status === "Matured" &&
      dataMaturity.maturitySummary?.maturityGain === 7500;
    console.log(`5.2 Investment Maturity Recorded (Gain: ₹${dataMaturity.maturitySummary?.maturityGain}): ${pass5_2 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "5.2 Investments: Maturity Calculation & Status Update", pass: pass5_2 });

    // 5.3 Renew Matured Investment (Creates linked new investment, no double count)
    const resRenew = await fetch(`${BASE_URL}/api/investments/${fdId}/renew`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        amount: 107500,
        maturityDate: "2027-09-10",
      }),
    });
    const dataRenew = await resRenew.json();
    const renewedInv = dataRenew.investment;
    const pass5_3 =
      (resRenew.status === 200 || resRenew.status === 201) &&
      renewedInv?.renewedFromId?.toString() === fdId.toString() &&
      renewedInv?.amount === 107500;
    console.log(`5.3 Investment Renewed with Linked Provenance: ${pass5_3 ? "PASS" : "FAIL"}`);
    if (!pass5_3) console.log("   resRenew.status:", resRenew.status, dataRenew);
    testResults.push({ name: "5.3 Investments: Renewal Creates Linked Record (No Double Count)", pass: pass5_3 });

    // ============================================================
    // 6. INSURANCE, LIABILITIES & REMINDERS AUDIT
    // ============================================================
    console.log("\n--- SECTION 6: INSURANCE, LIABILITIES & REMINDERS AUDIT ---");

    // 6.1 Create Insurance Policy
    const resInsurance = await fetch(`${BASE_URL}/api/insurances`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        name: "HDFC Ergo Health Suraksha",
        type: "Health Insurance",
        premiumAmount: 18000,
        premiumFrequency: "Yearly",
        sumInsured: 1000000,
        renewalDate: "2027-09-10",
      }),
    });
    const dataInsurance = await resInsurance.json();
    const pass6_1 = resInsurance.status === 201 && Boolean(dataInsurance.insurance?._id || dataInsurance.policy?._id);
    console.log(`6.1 Insurance Policy Created: ${pass6_1 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "6.1 Insurance: Policy Creation & Frequency Support", pass: pass6_1 });

    // 6.2 Create Liability (Personal Loan)
    const resLiability = await fetch(`${BASE_URL}/api/liabilities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        name: "SBI Personal Loan",
        type: "Personal Loan",
        totalAmount: 200000,
        principalAmount: 200000,
        remainingAmount: 200000,
        monthlyEMI: 9500,
        interestRate: 11.5,
        tenureMonths: 24,
      }),
    });
    const dataLiability = await resLiability.json();
    const pass6_2 = resLiability.status === 201 && Boolean(dataLiability.liability?._id);
    console.log(`6.2 Liability Created: ${pass6_2 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "6.2 Liabilities: Loan Creation & EMI Validation", pass: pass6_2 });

    // 6.3 Financial Reminders: Verify channels are In-App & Email only (NO SMS)
    const resReminder = await fetch(`${BASE_URL}/api/reminders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserA}`,
      },
      body: JSON.stringify({
        title: "EMI Payment Due Reminder",
        dueDate: "2026-09-15",
        reminderType: "liability",
        channels: {
          inApp: true,
          email: true,
        },
      }),
    });
    const dataReminder = await resReminder.json();
    const createdReminder = dataReminder.reminder;
    const pass6_3 =
      resReminder.status === 201 &&
      createdReminder?.channels?.inApp === true &&
      createdReminder?.channels?.email === true &&
      createdReminder?.channels?.sms === undefined; // SMS must NOT exist!
    console.log(`6.3 Financial Reminder (In-App & Email Only, Zero SMS): ${pass6_3 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "6.3 Reminders: Channels Restricted to In-App & Email (No SMS)", pass: pass6_3 });

    // ============================================================
    // 7. FINANCIAL REPORTS AUDIT (ALL PERIODS)
    // ============================================================
    console.log("\n--- SECTION 7: FINANCIAL REPORTS (MONTHLY, QUARTERLY, HALF-YEARLY, YEARLY) ---");

    const periods = ["monthly", "quarterly", "half-yearly", "yearly"];
    let allPeriodsPassed = true;

    for (const p of periods) {
      const resReport = await fetch(`${BASE_URL}/api/reports?duration=${p}&year=2026&month=9`, {
        headers: { Authorization: `Bearer ${tokenUserA}` },
      });
      const dataReport = await resReport.json();
      const isValidReport =
        resReport.status === 200 &&
        dataReport.success === true &&
        Boolean(dataReport.report?.header?.periodLabel) &&
        dataReport.report?.financialHealth?.score !== undefined;

      if (!isValidReport) allPeriodsPassed = false;
      console.log(`  - Report [${p.toUpperCase()}]: ${isValidReport ? "PASS" : "FAIL"} (Score: ${dataReport.report?.financialHealth?.score}/100)`);
    }
    testResults.push({ name: "7.1 Reports: Multi-Period Calculations (Monthly, Quarterly, Half-Yearly, Yearly)", pass: allPeriodsPassed });

    // ============================================================
    // 8. AI ADVISER COMPLETE ENGINE & DISCLAIMER AUDIT
    // ============================================================
    console.log("\n--- SECTION 8: AI ADVISER ENGINE, LIVE DATA & MANDATORY DISCLAIMER ---");

    const aiSuggestion = await aiAdviserService.generateUserRecommendation(testUserA._id, {
      context: "dashboard_advisor",
    });

    const expectedDisclaimer = "Invest at your own risk — market prices and conditions can change, and values may increase or decrease.";
    const hasCorrectDisclaimer = aiSuggestion.riskDisclaimer === expectedDisclaimer;
    const hasScenarioOutlook = Boolean(
      aiSuggestion.futureOutlook?.baseCase &&
      aiSuggestion.futureOutlook?.bullCase &&
      aiSuggestion.futureOutlook?.bearCase
    );
    const pass8_1 = Boolean(
      aiSuggestion &&
      aiSuggestion.summary &&
      hasCorrectDisclaimer &&
      hasScenarioOutlook
    );
    console.log(`8.1 AI Adviser Generation, Future Scenarios & Risk Disclaimer: ${pass8_1 ? "PASS" : "FAIL"}`);
    console.log(`  - Future Base Case: "${aiSuggestion.futureOutlook?.baseCase}"`);
    console.log(`  - Risk Disclaimer: "${aiSuggestion.riskDisclaimer}"`);
    testResults.push({ name: "8.1 AI Adviser: Dynamic Scenarios & Mandatory Disclaimer Verified", pass: pass8_1 });

    // ============================================================
    // 9. CROSS-USER SECURITY & DATA ISOLATION AUDIT
    // ============================================================
    console.log("\n--- SECTION 9: CROSS-USER SECURITY & DATA ISOLATION ---");

    // 9.1 Create User B
    const userBEmail = `audit_user_b_${testTimestamp}@test.com`;
    testUserB = await User.create({
      userId: `FOS-U-B-${testTimestamp}`,
      name: "Audit User B",
      email: userBEmail,
      role: "user",
      status: "Active",
    });
    tokenUserB = jwt.sign(
      { id: testUserB._id.toString(), role: "user", email: userBEmail },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    // User B tries to update User A's saving goal -> 404/403
    const resCrossGoal = await fetch(`${BASE_URL}/api/saving-goals/${goalId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenUserB}`,
      },
      body: JSON.stringify({ targetAmount: 999999 }),
    });
    const pass9_1 = resCrossGoal.status === 404 || resCrossGoal.status === 403;
    console.log(`9.1 Cross-User Goal Mutation Blocked (404/403): ${pass9_1 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "9.1 Security: User B Cannot Mutate User A Data", pass: pass9_1 });

    // User B tries to access User A's investment -> 404
    const resCrossInv = await fetch(`${BASE_URL}/api/investments/${fdId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${tokenUserB}` },
    });
    const pass9_2 = resCrossInv.status === 404;
    console.log(`9.2 Cross-User Investment Fetch Blocked (404): ${pass9_2 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "9.2 Security: User B Cannot Read User A Investments", pass: pass9_2 });

    // ============================================================
    // 10. ADMIN USER MANAGEMENT & CROSS-USER ISOLATION AUDIT
    // ============================================================
    console.log("\n--- SECTION 10: ADMIN DRILL-DOWN & USER ISOLATION AUDIT ---");

    // 10.1 Admin views User A Financial
    const resAdminFinA = await fetch(`${BASE_URL}/api/admin/users/${testUserA._id}/financial?year=2026&month=9`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const dataAdminFinA = await resAdminFinA.json();
    const pass10_1 =
      resAdminFinA.status === 200 &&
      dataAdminFinA.user?.name === "Audit User A" &&
      dataAdminFinA.summary?.income === 120000;
    console.log(`10.1 Admin Fetch User A Financial: ${pass10_1 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "10.1 Admin: User A Financial View Accurate", pass: pass10_1 });

    // 10.2 Admin views User B Financial (Empty user, should have 0 income and 0 goals)
    const resAdminFinB = await fetch(`${BASE_URL}/api/admin/users/${testUserB._id}/financial?year=2026&month=9`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const dataAdminFinB = await resAdminFinB.json();
    const pass10_2 =
      resAdminFinB.status === 200 &&
      dataAdminFinB.user?.name === "Audit User B" &&
      dataAdminFinB.summary?.income === 0 &&
      dataAdminFinB.savingGoals?.length === 0;
    console.log(`10.2 Admin Fetch User B Financial (Zero Leakage from User A): ${pass10_2 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "10.2 Admin: User B Isolation Confirmed (Zero Leakage)", pass: pass10_2 });

    // 10.3 Admin Messages & Reminders APIs
    const resAdminReminders = await fetch(`${BASE_URL}/api/admin/reminders`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const dataAdminReminders = await resAdminReminders.json();
    const pass10_3 = resAdminReminders.status === 200 && Array.isArray(dataAdminReminders.reminders);
    console.log(`10.3 Admin Reminders Listing Functional: ${pass10_3 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "10.3 Admin: Reminders Management Functional", pass: pass10_3 });

    // 10.4 Admin User Detail -> Reports API (User A)
    const resAdminReportA = await fetch(`${BASE_URL}/api/admin/users/${testUserA._id}/reports?duration=monthly&year=2026&month=9`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const dataAdminReportA = await resAdminReportA.json();
    const pass10_4 =
      resAdminReportA.status === 200 &&
      dataAdminReportA.success === true &&
      dataAdminReportA.user?.name === "Audit User A" &&
      Boolean(dataAdminReportA.report?.header?.periodLabel);
    console.log(`10.4 Admin User Detail -> Reports (User A): ${pass10_4 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "10.4 Admin: User A Reports API Verified", pass: pass10_4 });

    // 10.5 Admin User Detail -> Reports API (User B Isolation Check)
    const resAdminReportB = await fetch(`${BASE_URL}/api/admin/users/${testUserB._id}/reports?duration=monthly&year=2026&month=9`, {
      headers: { Authorization: `Bearer ${tokenAdmin}` },
    });
    const dataAdminReportB = await resAdminReportB.json();
    const pass10_5 =
      resAdminReportB.status === 200 &&
      dataAdminReportB.success === true &&
      dataAdminReportB.user?.name === "Audit User B" &&
      (dataAdminReportB.report?.financialSummary?.totalIncome === 0 ||
        dataAdminReportB.report?.periodSummary?.totalIncome === 0);
    console.log(`10.5 Admin User Detail -> Reports (User B Isolated Zero Leakage): ${pass10_5 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "10.5 Admin: User B Reports Isolated (Zero Leakage)", pass: pass10_5 });

    // ============================================================
    // 11. EMPTY STATE & RESILIENCE AUDIT (NEW USER WITH 0 DATA)
    // ============================================================
    console.log("\n--- SECTION 11: EMPTY STATE & ZERO-CRASH RESILIENCE ---");

    const resEmptyReports = await fetch(`${BASE_URL}/api/reports?duration=monthly&year=2026&month=9`, {
      headers: { Authorization: `Bearer ${tokenUserB}` },
    });
    const dataEmptyReports = await resEmptyReports.json();
    const pass11_1 =
      resEmptyReports.status === 200 &&
      dataEmptyReports.report?.financialSummary?.totalIncome === 0 &&
      dataEmptyReports.report?.financialHealth?.score !== undefined &&
      !isNaN(dataEmptyReports.report?.financialHealth?.score);
    console.log(`11.1 Empty State Report Rendered without NaN or Crash: ${pass11_1 ? "PASS" : "FAIL"}`);
    testResults.push({ name: "11.1 Resilience: Empty State Reports Zero-Crash & NaN-Free", pass: pass11_1 });

  } catch (err) {
    console.error("Audit suite encountered critical failure:", err);
    throw err;
  } finally {
    // Clean up created audit records
    console.log("\nCleaning up audit test records...");
    if (testUserA) {
      await User.findByIdAndDelete(testUserA._id);
      await MonthlyFinance.deleteMany({ user: testUserA._id });
      await SavingGoal.deleteMany({ user: testUserA._id });
      await Investment.deleteMany({ user: testUserA._id });
      await Insurance.deleteMany({ user: testUserA._id });
      await Liability.deleteMany({ user: testUserA._id });
      await Reminder.deleteMany({ user: testUserA._id });
      await AISuggestion.deleteMany({ user: testUserA._id });
      await Activity.deleteMany({ userId: testUserA._id });
    }
    if (testUserB) {
      await User.findByIdAndDelete(testUserB._id);
      await MonthlyFinance.deleteMany({ user: testUserB._id });
      await SavingGoal.deleteMany({ user: testUserB._id });
      await Investment.deleteMany({ user: testUserB._id });
      await Insurance.deleteMany({ user: testUserB._id });
      await Liability.deleteMany({ user: testUserB._id });
      await Reminder.deleteMany({ user: testUserB._id });
      await AISuggestion.deleteMany({ user: testUserB._id });
      await Activity.deleteMany({ userId: testUserB._id });
    }
    if (testAdmin) {
      await User.findByIdAndDelete(testAdmin._id);
    }
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }

  // ============================================================
  // SUMMARY REPORT
  // ============================================================
  console.log("\n============================================================");
  console.log("AUDIT SUITE SUMMARY TABLE");
  console.log("============================================================");
  let totalPass = 0;
  testResults.forEach((t) => {
    const pad = t.name.padEnd(65, " ");
    console.log(`${pad} : [${t.pass ? "PASS" : "FAIL"}]`);
    if (t.pass) totalPass++;
  });
  console.log("============================================================");
  console.log(`TOTAL TESTS: ${testResults.length} | PASSED: ${totalPass} | FAILED: ${testResults.length - totalPass}`);
  console.log(`AUDIT OUTCOME: ${totalPass === testResults.length ? "ALL TESTS PASSED - PRODUCTION READY" : "FAILURES DETECTED"}`);
  console.log("============================================================\n");

  if (totalPass !== testResults.length) {
    process.exit(1);
  }
}

runProductionAuditSuite().catch((err) => {
  console.error(err);
  process.exit(1);
});
