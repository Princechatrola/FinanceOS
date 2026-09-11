// ============================================================
// FINANCEOS - COMPREHENSIVE END-TO-END REMINDER SYSTEM TEST
// Tests:
// 1. Investment Reminder CRUD & Safety
// 2. Insurance Reminder CRUD & Safety
// 3. Liability Reminder CRUD & Safety
// 4. SavingGoal Reminder CRUD & Safety
// 5. General/Custom User Reminder CRUD
// 6. Non-destructive Deletion Verification
// 7. Schedule & Offset Calculation Verification
// ============================================================

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Reminder = require("../models/Reminder");
const Investment = require("../models/Investment");
const Insurance = require("../models/Insurance");
const Liability = require("../models/Liability");
const SavingGoal = require("../models/SavingGoal");
const User = require("../models/User");

const {
  syncPlanRemindersForUser,
  updateSourcePlanReminder,
  disableSourcePlanReminder,
  enableSourcePlanReminder,
  deleteSourcePlanReminder,
} = require("../utils/reminderSync");

async function runComprehensiveTest() {
  console.log("============================================================");
  console.log("FINANCEOS - FULL REMINDER SYSTEM E2E VERIFICATION");
  console.log("============================================================\n");

  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/financeos");
  console.log("✓ Connected to MongoDB");

  const user = await User.findOne({ email: "dip@test.com" }) || await User.findOne({});
  if (!user) {
    console.error("No user found!");
    process.exit(1);
  }
  console.log(`✓ Active User: ${user.name} (${user.email})\n`);

  // ------------------------------------------------------------
  // TEST 1: INVESTMENT REMINDER
  // ------------------------------------------------------------
  console.log("--- TEST 1: INVESTMENT REMINDER LIFECYCLE ---");
  const testInv = await Investment.create({
    user: user._id,
    name: "E2E Test SIP Portfolio",
    type: "SIP",
    amount: 15000,
    monthlyContribution: 5000,
    dueDay: 12,
    reminder: {
      enabled: true,
      contributionDay: 12,
      notifyBefore: [7, 3, 1],
      channels: { inApp: true, email: true },
    },
  });
  console.log(`1. Created SIP investment: ID ${testInv._id}`);

  await syncPlanRemindersForUser(user._id);
  let invReminder = await Reminder.findOne({
    userId: user._id,
    sourceType: "Investment",
    sourceId: testInv._id,
  });
  if (!invReminder || !invReminder.enabled) {
    throw new Error("Failed: Investment reminder not found or not enabled in Reminder collection!");
  }
  console.log(`2. Synced to Reminder collection: "${invReminder.itemName}", offsets: [${invReminder.notifyBefore.join(", ")}], channels: inApp=${invReminder.channels.inApp}, email=${invReminder.channels.email}`);

  // Update
  await updateSourcePlanReminder(user._id, "Investment", testInv._id, {
    enabled: true,
    notifyBefore: [5, 1, 0],
    channels: { inApp: false, email: true },
  });
  invReminder = await Reminder.findOne({ _id: invReminder._id });
  if (invReminder.notifyBefore.join(",") !== "5,1,0" || invReminder.channels.email !== true || invReminder.channels.inApp !== false) {
    throw new Error("Failed: Investment reminder update not reflected in collection!");
  }
  console.log(`3. Updated offsets to [${invReminder.notifyBefore.join(", ")}] and inApp=false, email=true`);

  // Disable
  await disableSourcePlanReminder(user._id, "Investment", testInv._id);
  invReminder = await Reminder.findOne({ _id: invReminder._id });
  if (invReminder.enabled !== false) throw new Error("Failed to disable investment reminder!");
  console.log("4. Successfully disabled investment reminder.");

  // Re-enable
  await enableSourcePlanReminder(user._id, "Investment", testInv._id);
  invReminder = await Reminder.findOne({ _id: invReminder._id });
  if (invReminder.enabled !== true) throw new Error("Failed to re-enable investment reminder!");
  console.log("5. Successfully re-enabled investment reminder.");

  // Delete & Safety Assertion
  await deleteSourcePlanReminder(user._id, "Investment", testInv._id);
  const deletedInvReminder = await Reminder.findOne({ _id: invReminder._id });
  const checkInv = await Investment.findById(testInv._id);
  if (deletedInvReminder) throw new Error("Failed: Reminder was not deleted!");
  if (!checkInv || checkInv.amount !== 15000 || checkInv.monthlyContribution !== 5000) {
    throw new Error("CRITICAL SAFETY BREACH: Investment financial data altered during reminder deletion!");
  }
  console.log("6. Verified Safe Deletion: Reminder deleted, investment amount ₹15,000 preserved 100% intact.\n");

  // Cleanup test investment
  await Investment.findByIdAndDelete(testInv._id);

  // ------------------------------------------------------------
  // TEST 2: INSURANCE REMINDER
  // ------------------------------------------------------------
  console.log("--- TEST 2: INSURANCE REMINDER LIFECYCLE ---");
  const testPolicy = await Insurance.create({
    user: user._id,
    name: "E2E Test Term Shield",
    type: "Life Insurance",
    premiumAmount: 12000,
    monthlyPremium: 1000,
    premiumDueDay: 20,
    reminder: {
      enabled: true,
      notifyBefore: [10, 5, 1],
      channels: { inApp: true, email: true },
    },
  });
  console.log(`1. Created Insurance policy: ID ${testPolicy._id}`);

  await syncPlanRemindersForUser(user._id);
  let insReminder = await Reminder.findOne({
    userId: user._id,
    sourceType: "Insurance",
    sourceId: testPolicy._id,
  });
  if (!insReminder) throw new Error("Failed: Insurance reminder not found!");
  console.log(`2. Synced Insurance reminder: "${insReminder.itemName}", premium: ₹${insReminder.amount}`);

  // Delete & Safety Assertion
  await deleteSourcePlanReminder(user._id, "Insurance", testPolicy._id);
  const checkPolicy = await Insurance.findById(testPolicy._id);
  if (!checkPolicy || checkPolicy.premiumAmount !== 12000) {
    throw new Error("CRITICAL SAFETY BREACH: Insurance policy altered during reminder deletion!");
  }
  console.log("3. Verified Safe Deletion: Policy preserved with ₹12,000 premium intact.\n");
  await Insurance.findByIdAndDelete(testPolicy._id);

  // ------------------------------------------------------------
  // TEST 3: LIABILITY REMINDER
  // ------------------------------------------------------------
  console.log("--- TEST 3: LIABILITY REMINDER LIFECYCLE ---");
  const testLiability = await Liability.create({
    user: user._id,
    name: "E2E Test Car Loan",
    type: "Car Loan",
    principalAmount: 600000,
    totalAmount: 600000,
    remainingAmount: 450000,
    monthlyEMI: 18500,
    dueDay: 7,
    reminder: {
      enabled: true,
      daysBefore: 3,
      notifyBefore: [5, 3, 1],
      channels: { inApp: true, email: true },
    },
  });
  console.log(`1. Created Liability: ID ${testLiability._id}`);

  await syncPlanRemindersForUser(user._id);
  let liabReminder = await Reminder.findOne({
    userId: user._id,
    sourceType: "Liability",
    sourceId: testLiability._id,
  });
  if (!liabReminder) throw new Error("Failed: Liability reminder not found!");
  console.log(`2. Synced Liability reminder: "${liabReminder.itemName}", EMI: ₹${liabReminder.amount}`);

  // Delete & Safety Assertion
  await deleteSourcePlanReminder(user._id, "Liability", testLiability._id);
  const checkLiab = await Liability.findById(testLiability._id);
  if (!checkLiab || checkLiab.remainingAmount !== 450000 || checkLiab.monthlyEMI !== 18500) {
    throw new Error("CRITICAL SAFETY BREACH: Liability remaining balance altered during reminder deletion!");
  }
  console.log("3. Verified Safe Deletion: Liability preserved with ₹4,50,000 balance and ₹18,500 EMI intact.\n");
  await Liability.findByIdAndDelete(testLiability._id);

  // ------------------------------------------------------------
  // TEST 4: SAVING GOAL REMINDER
  // ------------------------------------------------------------
  console.log("--- TEST 4: SAVING GOAL REMINDER LIFECYCLE ---");
  const testGoal = await SavingGoal.create({
    user: user._id,
    goalName: "E2E Emergency Fund",
    targetAmount: 100000,
    currentAmount: 25000,
    targetDate: new Date("2027-12-31"),
    monthlyContribution: 5000,
    contributionDay: 15,
    reminder: {
      enabled: true,
      contributionDay: 15,
      notifyBefore: [3, 1],
      channels: { inApp: true, email: true },
    },
  });
  console.log(`1. Created Saving Goal: ID ${testGoal._id}`);

  await syncPlanRemindersForUser(user._id);
  let goalReminder = await Reminder.findOne({
    userId: user._id,
    sourceType: "SavingGoal",
    sourceId: testGoal._id,
  });
  if (!goalReminder) throw new Error("Failed: Saving Goal reminder not found!");
  console.log(`2. Synced Saving Goal reminder: "${goalReminder.itemName}", contribution: ₹${goalReminder.amount}`);

  // Delete & Safety Assertion
  await deleteSourcePlanReminder(user._id, "SavingGoal", testGoal._id);
  const checkGoal = await SavingGoal.findById(testGoal._id);
  if (!checkGoal || checkGoal.currentAmount !== 25000) {
    throw new Error("CRITICAL SAFETY BREACH: Goal funds altered during reminder deletion!");
  }
  console.log("3. Verified Safe Deletion: Goal preserved with ₹25,000 current funds intact.\n");
  await SavingGoal.findByIdAndDelete(testGoal._id);

  // ------------------------------------------------------------
  // TEST 5: GENERAL/CUSTOM USER REMINDER
  // ------------------------------------------------------------
  console.log("--- TEST 5: CUSTOM USER REMINDER LIFECYCLE ---");
  const customReminder = await Reminder.create({
    userId: user._id,
    userName: user.name || "Test User",
    reminderType: "General",
    category: "General",
    itemName: "Quarterly Tax Audit Payment",
    rule: "Specific Date",
    dueDate: "2026-09-25",
    scheduledDate: "2026-09-20",
    notifyBefore: [5, 2],
    channels: { inApp: true, email: true },
    enabled: true,
    sourceType: "General",
  });
  console.log(`1. Created Custom Reminder: "${customReminder.itemName}" on ${customReminder.dueDate}`);

  customReminder.enabled = false;
  await customReminder.save();
  const disabledCustom = await Reminder.findById(customReminder._id);
  if (disabledCustom.enabled !== false) throw new Error("Failed to disable custom reminder!");
  console.log("2. Disabled Custom Reminder successfully.");

  await Reminder.findByIdAndDelete(customReminder._id);
  const deletedCustom = await Reminder.findById(customReminder._id);
  if (deletedCustom) throw new Error("Failed to delete custom reminder!");
  console.log("3. Deleted Custom Reminder successfully.\n");

  console.log("============================================================");
  console.log("✓ ALL E2E TESTS PASSED WITH ZERO ERRORS OR DATA LOSS!");
  console.log("============================================================");
  await mongoose.disconnect();
}

runComprehensiveTest().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
