// ============================================================
// FINANCEOS - REMINDER SYSTEM TEST
// ============================================================

const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const Reminder = require("../models/Reminder");
const Investment = require("../models/Investment");
const User = require("../models/User");
const {
  syncPlanRemindersForUser,
  updateSourcePlanReminder,
  disableSourcePlanReminder,
  enableSourcePlanReminder,
  deleteSourcePlanReminder,
} = require("../utils/reminderSync");

async function runTest() {
  console.log("--- Starting Reminder Backend Test ---");
  await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/financeos");
  console.log("Connected to MongoDB");

  // 1. Find a test user
  const user = await User.findOne({ email: "dip@test.com" }) || await User.findOne({});
  if (!user) {
    console.error("No user found in database!");
    process.exit(1);
  }
  console.log(`Found test user: ${user.name} (${user.email}, id: ${user._id})`);

  // 2. Test Sync
  const synced = await syncPlanRemindersForUser(user._id);
  console.log(`Synced ${synced.length} reminders from plans.`);

  // 3. Create a test investment with reminder
  const testInv = await Investment.create({
    user: user._id,
    name: "Test Mutual Fund Reminder",
    type: "Mutual Fund",
    amount: 5000,
    monthlyContribution: 5000,
    dueDay: 10,
    reminder: {
      enabled: true,
      contributionDay: 10,
      notifyBefore: [5, 1],
      channels: { inApp: true, email: true, sms: false },
    },
  });
  console.log(`Created test investment: ${testInv._id}`);

  // 4. Sync reminders for user
  await syncPlanRemindersForUser(user._id);
  const foundReminder = await Reminder.findOne({
    userId: user._id,
    sourceType: "Investment",
    sourceId: testInv._id,
  });
  if (!foundReminder) {
    throw new Error("Reminder was not created in Reminder collection during sync!");
  }
  console.log(`Verified Reminder created: ${foundReminder.itemName}, rule: ${foundReminder.rule}, amount: ₹${foundReminder.amount}`);

  // 5. Disable reminder
  await disableSourcePlanReminder(user._id, "Investment", testInv._id);
  const disabledReminder = await Reminder.findOne({ _id: foundReminder._id });
  const updatedInv = await Investment.findById(testInv._id);
  if (disabledReminder.enabled !== false || updatedInv.reminder.enabled !== false) {
    throw new Error("Disable failed!");
  }
  console.log("Verified Disable: reminder disabled on both plan and Reminder collection.");

  // 6. Re-enable reminder
  await enableSourcePlanReminder(user._id, "Investment", testInv._id);
  const reEnabledReminder = await Reminder.findOne({ _id: foundReminder._id });
  if (reEnabledReminder.enabled !== true) {
    throw new Error("Enable failed!");
  }
  console.log("Verified Enable: reminder re-enabled successfully.");

  // 7. Delete reminder — CRITICAL TEST: MUST NOT DELETE INVESTMENT
  await deleteSourcePlanReminder(user._id, "Investment", testInv._id);
  const deletedReminder = await Reminder.findOne({ _id: foundReminder._id });
  const preservedInv = await Investment.findById(testInv._id);

  if (deletedReminder) {
    throw new Error("Reminder document was not deleted!");
  }
  if (!preservedInv) {
    throw new Error("CRITICAL FAILURE: Investment was deleted when deleting reminder!");
  }
  if (preservedInv.amount !== 5000 || preservedInv.reminder.enabled !== false) {
    throw new Error("Investment data was corrupted during reminder deletion!");
  }
  console.log("Verified Deletion Safety: Reminder removed, Investment preserved intact!");

  // Clean up test investment
  await Investment.deleteOne({ _id: testInv._id });
  console.log("Test investment cleaned up.");

  console.log("--- ALL BACKEND REMINDER TESTS PASSED SUCCESSFULLY ---");
  await mongoose.disconnect();
}

runTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
