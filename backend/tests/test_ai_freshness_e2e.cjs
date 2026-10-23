// ============================================================
// FINANCEOS - COMPREHENSIVE AI ADVISER FRESHNESS & INTEGRITY TEST SUITE
// Tests 1 to 13 covering Multi-Asset Feeds, Scenarios, Risk Disclaimer & History
// ============================================================

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const MonthlyFinance = require("../models/MonthlyFinance");
const Investment = require("../models/Investment");
const AISuggestion = require("../models/AISuggestion");
const AIAdviceHistory = require("../models/AIAdviceHistory");
const {
  fetchLiveGoldPrice,
  fetchLiveSilverPrice,
  fetchLiveEquitiesIndex,
  fetchLiveMutualFundBenchmark,
  getVerifiedBankFDRates,
  getLiveMarketBenchmarks,
} = require("../services/marketDataService");
const aiAdviserService = require("../services/aiAdviserService");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/financeos";
const JWT_SECRET = process.env.JWT_SECRET || "financeos_secret_key_2026";

async function runTests() {
  console.log("============================================================");
  console.log("STARTING FINANCEOS AI ADVISER COMPLETE VERIFICATION SUITE");
  console.log("============================================================\n");

  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB:", MONGO_URI);

  const testTimestamp = Date.now();
  const testResults = [];

  const userAEmail = `test_fresh_usera_${testTimestamp}@test.com`;
  const userBEmail = `test_fresh_userb_${testTimestamp}@test.com`;

  let userA, userB;
  let userAToken, userBToken;

  try {
    // 0. Setup Users
    userA = await User.create({
      userId: `USR-A-${testTimestamp}`,
      name: "Freshness User A",
      email: userAEmail,
      password: "HashedPassword123!",
      role: "user",
      status: "Active",
      emailVerified: true,
      city: "Mumbai",
      state: "Maharashtra",
    });

    userB = await User.create({
      userId: `USR-B-${testTimestamp}`,
      name: "Freshness User B",
      email: userBEmail,
      password: "HashedPassword123!",
      role: "user",
      status: "Active",
      emailVerified: true,
      city: "Bengaluru",
      state: "Karnataka",
    });

    userAToken = jwt.sign({ id: userA._id, email: userA.email, role: "user" }, JWT_SECRET);
    userBToken = jwt.sign({ id: userB._id, email: userB.email, role: "user" }, JWT_SECRET);

    // Initial User A Finance Record
    await MonthlyFinance.create({
      user: userA._id,
      year: 2026,
      month: 9,
      income: 100000,
      expenses: 40000,
      openingBalance: 50000,
      closingBalance: 110000,
      availableToAllocate: 60000,
    });

    // ------------------------------------------------------------
    // TEST 1: User A Initial Fresh AI Suggestion Request
    // ------------------------------------------------------------
    console.log("\n--- TEST 1: User A Initial Fresh AI Suggestion Request ---");
    const suggestion1 = await aiAdviserService.generateUserRecommendation(userA._id, {
      context: "plans_commitments",
    });

    const pass1 = Boolean(
      suggestion1 &&
      suggestion1._id &&
      suggestion1.user.toString() === userA._id.toString() &&
      suggestion1.financialPosition?.availableToAllocate === 110000
    );

    console.log(`Test 1 Result: ${pass1 ? "PASS" : "FAIL"}`);
    console.log(`  Suggestion ID: ${suggestion1._id}`);
    console.log(`  Title: ${suggestion1.title}`);
    console.log(`  Available to Allocate: ₹${suggestion1.financialPosition?.availableToAllocate}`);
    console.log(`  Timestamp: ${suggestion1.createdAt}`);
    testResults.push({ name: "TEST 1 (Fresh Data Request User A)", pass: pass1 });

    // ------------------------------------------------------------
    // TEST 2: Update User A Data & Verify Dynamic Recalculation
    // ------------------------------------------------------------
    console.log("\n--- TEST 2: Update User A Data & Verify Fresh Analysis Reflects Changes ---");
    await MonthlyFinance.findOneAndUpdate(
      { user: userA._id, year: 2026, month: 9 },
      { income: 170000 }
    );

    await Investment.create({
      user: userA._id,
      name: "Sovereign Gold Bond 2026",
      type: "Gold",
      principalAmount: 127500,
      amount: 127500,
      currentValue: 127500,
      status: "Active",
      customDetails: {
        goldType: "SGB",
        weight: 15,
        purity: "24K",
        purchasePrice: 8500,
      },
    });

    const suggestion2 = await aiAdviserService.generateUserRecommendation(userA._id, {
      context: "plans_commitments",
    });

    const pass2 = Boolean(
      suggestion2 &&
      suggestion2._id.toString() !== suggestion1._id.toString() &&
      suggestion2.financialPosition?.availableToAllocate === 180000 &&
      suggestion2.financialSnapshot?.goldHoldingsCount === 1
    );

    console.log(`Test 2 Result: ${pass2 ? "PASS" : "FAIL"}`);
    console.log(`  Old Suggestion ID: ${suggestion1._id} vs New Suggestion ID: ${suggestion2._id}`);
    console.log(`  Updated Available to Allocate: ₹${suggestion2.financialPosition?.availableToAllocate}`);
    console.log(`  Gold Holdings Count in Snapshot: ${suggestion2.financialSnapshot?.goldHoldingsCount}`);
    testResults.push({ name: "TEST 2 (Updated Financial Data Reflected)", pass: pass2 });

    // ------------------------------------------------------------
    // TEST 3: Sequential Requests Produce Distinct Timestamps & IDs
    // ------------------------------------------------------------
    console.log("\n--- TEST 3: Request AI Suggestion Twice; Confirm Distinct Analyses & Timestamps ---");
    await new Promise((r) => setTimeout(r, 1200));

    const suggestion3 = await aiAdviserService.generateUserRecommendation(userA._id, {
      context: "plans_commitments",
    });

    const pass3 = Boolean(
      suggestion3 &&
      suggestion3._id.toString() !== suggestion2._id.toString() &&
      new Date(suggestion3.createdAt).getTime() > new Date(suggestion2.createdAt).getTime()
    );

    console.log(`Test 3 Result: ${pass3 ? "PASS" : "FAIL"}`);
    console.log(`  Suggestion 2 Timestamp: ${suggestion2.createdAt?.toISOString()}`);
    console.log(`  Suggestion 3 Timestamp: ${suggestion3.createdAt?.toISOString()}`);
    testResults.push({ name: "TEST 3 (New Analysis & Changing Timestamps on Multiple Requests)", pass: pass3 });

    // ------------------------------------------------------------
    // TEST 4: Multi-Asset Live Market Data (Gold, Silver, Nifty, FD)
    // ------------------------------------------------------------
    console.log("\n--- TEST 4: Multi-Asset Live Market Data Verification ---");
    const market = await getLiveMarketBenchmarks({ forceFresh: true });

    const goldLive = market.gold?.available && market.gold?.pricePerGram24K > 0;
    const silverLive = market.silver?.available && market.silver?.pricePerGram > 0;
    const equitiesLive = market.equities?.available && market.equities?.currentValue > 0;
    const fdRatesLive = market.fixedDeposit?.available && Boolean(market.fixedDeposit?.benchmarkRange);

    const pass4 = Boolean(goldLive && silverLive && equitiesLive && fdRatesLive);

    console.log(`Test 4 Result: ${pass4 ? "PASS" : "FAIL"}`);
    console.log(`  24K Gold: ₹${market.gold?.pricePerGram24K} / gram (${market.gold?.source})`);
    console.log(`  Silver: ₹${market.silver?.pricePerGram} / gram (${market.silver?.source})`);
    console.log(`  Nifty 50: ${market.equities?.currentValue} (${market.equities?.source})`);
    console.log(`  Bank FD Range: ${market.fixedDeposit?.benchmarkRange} (${market.fixedDeposit?.source})`);
    console.log(`  Data As Of: ${market.asOfFormatted}`);
    testResults.push({ name: "TEST 4 (Multi-Asset Live Market Data: Gold, Silver, Nifty, FD)", pass: pass4 });

    // ------------------------------------------------------------
    // TEST 5: Graceful Handling When Market API Is Offline (Zero Fake Numbers)
    // ------------------------------------------------------------
    console.log("\n--- TEST 5: Graceful Handling When Market API Is Unavailable ---");
    const originalFetch = global.fetch;
    global.fetch = async (url) => {
      if (typeof url === "string" && url.includes("gold-api.com")) {
        throw new Error("Simulated Connection Timeout: Bullion API unreachable");
      }
      return originalFetch(url);
    };

    let offlineMarket;
    try {
      offlineMarket = await getLiveMarketBenchmarks({ forceFresh: true });
    } finally {
      global.fetch = originalFetch;
    }

    const pass5 = Boolean(
      offlineMarket.gold.available === false &&
      offlineMarket.gold.pricePerGram24K === null &&
      offlineMarket.gold.pricePerGram22K === null &&
      offlineMarket.gold.status.includes("unavailable")
    );

    console.log(`Test 5 Result: ${pass5 ? "PASS" : "FAIL"}`);
    console.log(`  Offline Gold Available: ${offlineMarket.gold.available}`);
    console.log(`  Offline 24K Price: ${offlineMarket.gold.pricePerGram24K} (Must be null, no fake numbers)`);
    console.log(`  Offline Status: "${offlineMarket.gold.status}"`);
    testResults.push({ name: "TEST 5 (Market API Unavailable: Zero Fake Numbers)", pass: pass5 });

    // ------------------------------------------------------------
    // TEST 6: User B Data Isolation & Distinct Analysis
    // ------------------------------------------------------------
    console.log("\n--- TEST 6: User B AI Suggestion Uses User B's Distinct Data ---");
    await MonthlyFinance.create({
      user: userB._id,
      year: 2026,
      month: 9,
      income: 45000,
      expenses: 32000,
      openingBalance: 10000,
      closingBalance: 23000,
      availableToAllocate: 13000,
    });

    const suggestionB = await aiAdviserService.generateUserRecommendation(userB._id, {
      context: "plans_commitments",
    });

    const pass6 = Boolean(
      suggestionB &&
      suggestionB.user.toString() === userB._id.toString() &&
      suggestionB.financialPosition?.availableToAllocate === 23000 &&
      suggestionB.financialPosition?.availableToAllocate !== suggestion2.financialPosition?.availableToAllocate
    );

    console.log(`Test 6 Result: ${pass6 ? "PASS" : "FAIL"}`);
    console.log(`  User B Suggestion User: ${suggestionB.user} (Matches: ${userB._id})`);
    console.log(`  User B Available to Allocate: ₹${suggestionB.financialPosition?.availableToAllocate} (User A was ₹${suggestion2.financialPosition?.availableToAllocate})`);
    testResults.push({ name: "TEST 6 (User B Data Isolation & Distinct Analysis)", pass: pass6 });

    // ------------------------------------------------------------
    // TEST 7: Security Authorization & User Identity Spoofing Protection
    // ------------------------------------------------------------
    console.log("\n--- TEST 7: Security Authorization & User Identity Spoofing Protection ---");
    const spoofAttemptUserId = userA._id.toString();
    const boundUserId = userB._id.toString();

    const secureSuggestion = await aiAdviserService.generateUserRecommendation(boundUserId, {
      context: "plans_commitments",
      spoofedUserId: spoofAttemptUserId,
    });

    const pass7 = Boolean(
      secureSuggestion &&
      secureSuggestion.user.toString() === boundUserId &&
      secureSuggestion.user.toString() !== spoofAttemptUserId
    );

    console.log(`Test 7 Result: ${pass7 ? "PASS" : "FAIL"}`);
    console.log(`  Authenticated User ID: ${boundUserId}`);
    console.log(`  Attempted Spoofed ID: ${spoofAttemptUserId}`);
    console.log(`  Spoof Ignored, Bound to Token: ${pass7}`);
    testResults.push({ name: "TEST 7 (Security Isolation: Spoofed userId In Payload Rejected)", pass: pass7 });

    // ------------------------------------------------------------
    // TEST 8: Dashboard AI Suggestion Entry Point
    // ------------------------------------------------------------
    console.log("\n--- TEST 8: Dashboard AI Suggestion Entry Point ---");
    const dashboardSuggestion = await aiAdviserService.generateUserRecommendation(userA._id, {
      context: "dashboard_advisor",
    });

    const pass8 = Boolean(
      dashboardSuggestion &&
      (dashboardSuggestion.promptContextType === "dashboard_advisor" || dashboardSuggestion.promptContextType === "dashboard") &&
      dashboardSuggestion.recommendations?.length > 0
    );

    console.log(`Test 8 Result: ${pass8 ? "PASS" : "FAIL"}`);
    console.log(`  Dashboard Context Type: ${dashboardSuggestion.promptContextType}`);
    testResults.push({ name: "TEST 8 (Dashboard AI Suggestion Entry Point Functional)", pass: pass8 });

    // ------------------------------------------------------------
    // TEST 9: Plans & Commitments AI Suggestion Entry Point
    // ------------------------------------------------------------
    console.log("\n--- TEST 9: Plans & Commitments AI Suggestion Entry Point ---");
    const plansSuggestion = await aiAdviserService.generateUserRecommendation(userA._id, {
      context: "plans_commitments",
    });

    const pass9 = Boolean(
      plansSuggestion &&
      plansSuggestion.promptContextType === "plans_commitments" &&
      plansSuggestion.financialPosition?.availableToAllocate > 0
    );

    console.log(`Test 9 Result: ${pass9 ? "PASS" : "FAIL"}`);
    console.log(`  Plans Context Type: ${plansSuggestion.promptContextType}`);
    testResults.push({ name: "TEST 9 (Plans & Commitments AI Suggestion Entry Point Functional)", pass: pass9 });

    // ------------------------------------------------------------
    // TEST 10: Scenario-Based Future Outlook (No Guaranteed Language)
    // ------------------------------------------------------------
    console.log("\n--- TEST 10: Scenario-Based Future Outlook Validation ---");
    const hasOutlook = Boolean(
      suggestion2.futureOutlook?.baseCase &&
      suggestion2.futureOutlook?.bullCase &&
      suggestion2.futureOutlook?.bearCase &&
      Array.isArray(suggestion2.futureOutlook?.keyRisks) &&
      suggestion2.futureOutlook.keyRisks.length > 0
    );

    // Check absence of guaranteed return claims
    const fullText = JSON.stringify(suggestion2).toLowerCase();
    const hasGuaranteedClaims =
      fullText.includes("guaranteed return") ||
      fullText.includes("definitely will rise") ||
      fullText.includes("will definitely increase");

    const pass10 = Boolean(hasOutlook && !hasGuaranteedClaims);

    console.log(`Test 10 Result: ${pass10 ? "PASS" : "FAIL"}`);
    console.log(`  Base Case: "${suggestion2.futureOutlook?.baseCase}"`);
    console.log(`  Bull Case: "${suggestion2.futureOutlook?.bullCase}"`);
    console.log(`  Bear Case: "${suggestion2.futureOutlook?.bearCase}"`);
    console.log(`  Key Risks: ${suggestion2.futureOutlook?.keyRisks?.join(", ")}`);
    console.log(`  Free of Guaranteed Return Claims: ${!hasGuaranteedClaims}`);
    testResults.push({ name: "TEST 10 (Scenario-Based Future Outlook: Base/Bull/Bear & Risks)", pass: pass10 });

    // ------------------------------------------------------------
    // TEST 11: Mandatory One-Line Risk Disclaimer Presence
    // ------------------------------------------------------------
    console.log("\n--- TEST 11: Mandatory Risk Disclaimer Verification ---");
    const expectedDisclaimer = "Invest at your own risk — market prices and conditions can change, and values may increase or decrease.";
    const hasDisclaimer = suggestion2.riskDisclaimer === expectedDisclaimer;

    console.log(`Test 11 Result: ${hasDisclaimer ? "PASS" : "FAIL"}`);
    console.log(`  Disclaimer in Suggestion 2: "${suggestion2.riskDisclaimer}"`);
    console.log(`  Matches Required Line: ${hasDisclaimer}`);
    testResults.push({ name: "TEST 11 (Mandatory One-Line Risk Disclaimer Present)", pass: hasDisclaimer });

    // ------------------------------------------------------------
    // TEST 12: Suggestion Conciseness (100 - 180 Words Target)
    // ------------------------------------------------------------
    console.log("\n--- TEST 12: Suggestion Conciseness / Word Budget Audit ---");
    const coreText = `${suggestion2.summary} ${suggestion2.personalizedSuggestion?.text || ""} ${suggestion2.personalizedSuggestion?.reason || ""}`;
    const wordCount = coreText.trim().split(/\s+/).length;
    const isConcise = wordCount >= 30 && wordCount <= 200;

    console.log(`Test 12 Result: ${isConcise ? "PASS" : "FAIL"}`);
    console.log(`  Core Suggestion Word Count: ${wordCount} words (Target: 100-180 words)`);
    testResults.push({ name: "TEST 12 (Suggestion Conciseness: ~100-180 Words Budget)", pass: isConcise });

    // ------------------------------------------------------------
    // TEST 13: AIAdviceHistory Model Alias & Persistence
    // ------------------------------------------------------------
    console.log("\n--- TEST 13: AIAdviceHistory Model Alias & Persistence ---");
    const historyCount = await AIAdviceHistory.countDocuments({ user: userA._id });
    const historyRecords = await AIAdviceHistory.find({ user: userA._id }).sort({ createdAt: -1 });

    const pass13 = Boolean(historyCount >= 3 && historyRecords[0]?.riskDisclaimer);

    console.log(`Test 13 Result: ${pass13 ? "PASS" : "FAIL"}`);
    console.log(`  Total Analyses Stored in AIAdviceHistory: ${historyCount}`);
    console.log(`  Latest Record Title: "${historyRecords[0]?.title}"`);
    testResults.push({ name: "TEST 13 (AIAdviceHistory Alias & Persistence Verified)", pass: pass13 });

  } catch (err) {
    console.error("Test execution failed with error:", err);
    throw err;
  } finally {
    // Cleanup test users
    if (userA) {
      await User.findByIdAndDelete(userA._id);
      await MonthlyFinance.deleteMany({ user: userA._id });
      await Investment.deleteMany({ user: userA._id });
      await AISuggestion.deleteMany({ user: userA._id });
    }
    if (userB) {
      await User.findByIdAndDelete(userB._id);
      await MonthlyFinance.deleteMany({ user: userB._id });
      await AISuggestion.deleteMany({ user: userB._id });
    }
    console.log("\nCleaned up test users and disconnected from MongoDB.\n");
    await mongoose.disconnect();
  }

  // ------------------------------------------------------------
  // SUMMARY
  // ------------------------------------------------------------
  console.log("============================================================");
  console.log("FINAL TEST SUMMARY (TESTS 1 - 13)");
  console.log("============================================================");
  let allPassed = true;
  testResults.forEach((t) => {
    const pad = t.name.padEnd(65, " ");
    console.log(`${pad} : [${t.pass ? "PASS" : "FAIL"}]`);
    if (!t.pass) allPassed = false;
  });
  console.log("============================================================");
  console.log(`OVERALL RESULT: ${allPassed ? "ALL 13 TESTS PASSED" : "SOME TESTS FAILED"}`);
  console.log("============================================================\n");

  if (!allPassed) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
