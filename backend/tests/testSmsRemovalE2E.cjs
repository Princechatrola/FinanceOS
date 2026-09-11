// ============================================================
// FINANCEOS - SMS REMOVAL E2E VALIDATION TEST
// Verifies that SMS has been completely eliminated from
// FinanceOS and that attempts to submit SMS are rejected.
// ============================================================

const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const User = require("../models/User");
const Reminder = require("../models/Reminder");
const Investment = require("../models/Investment");
const Insurance = require("../models/Insurance");
const Liability = require("../models/Liability");
const Message = require("../models/Message");
const { cleanupLegacySmsPreferences } = require("../utils/cleanupLegacySms");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/financeos";

async function runTests() {
  console.log("==================================================");
  console.log("FINANCEOS - SMS REMOVAL E2E VERIFICATION TEST SUITE");
  console.log("==================================================");

  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB at:", MONGO_URI);

  try {
    // 1. Setup a test user
    const testEmail = `sms_audit_test_${Date.now()}@example.com`;
    let user = await User.create({
      name: "SMS Removal Test User",
      email: testEmail,
      userId: `USR-SMS-${Date.now()}`,
      password: "HashedPassword123",
      status: "Active",
    });
    console.log(`Created test user: ${user.name} (${user._id})`);

    // ------------------------------------------------------------
    // TEST 1: Valid In-App and Email Reminders
    // ------------------------------------------------------------
    console.log("\n--- TEST 1: Valid In-App and Email Reminders ---");
    const validInApp = await Reminder.create({
      userId: user._id,
      userName: user.name,
      reminderType: "General",
      category: "General",
      itemName: "Valid In-App Reminder",
      dueDate: new Date("2026-10-01"),
      scheduledDate: new Date("2026-10-01"),
      rule: "On due date",
      channel: "In-App",
      channels: { inApp: true, email: false },
    });
    console.log("✓ In-App reminder created successfully:", validInApp._id);

    const validEmail = await Reminder.create({
      userId: user._id,
      userName: user.name,
      email: user.email,
      reminderType: "General",
      category: "General",
      itemName: "Valid Email Reminder",
      dueDate: new Date("2026-10-01"),
      scheduledDate: new Date("2026-10-01"),
      rule: "On due date",
      channel: "Email",
      channels: { inApp: false, email: true },
    });
    console.log("✓ Email reminder created successfully:", validEmail._id);

    // ------------------------------------------------------------
    // TEST 2: Schema Validation Rejects channel='SMS' in Reminder
    // ------------------------------------------------------------
    console.log("\n--- TEST 2: Schema rejects channel='SMS' in Reminder ---");
    let rejectedSmsChannel = false;
    try {
      await Reminder.create({
        userId: user._id,
        userName: user.name,
        reminderType: "General",
        category: "General",
        itemName: "Invalid SMS Channel Reminder",
        dueDate: new Date("2026-10-01"),
        scheduledDate: new Date("2026-10-01"),
        rule: "On due date",
        channel: "SMS",
        channels: { inApp: false, email: false },
      });
    } catch (err) {
      rejectedSmsChannel = true;
      console.log("✓ Schema rejected channel='SMS' as expected:", err.message);
    }
    if (!rejectedSmsChannel) {
      throw new Error("SECURITY FAILURE: Reminder schema allowed channel='SMS'!");
    }

    // ------------------------------------------------------------
    // TEST 3: Schema Validation Rejects channels=['SMS'] in Message
    // ------------------------------------------------------------
    console.log("\n--- TEST 3: Schema rejects channels=['SMS'] in Message ---");
    let rejectedSmsMessage = false;
    try {
      await Message.create({
        recipientUser: user._id,
        userId: user.userId,
        recipient: user.name,
        title: "Test SMS Message",
        message: "This should fail",
        channels: ["SMS"],
      });
    } catch (err) {
      rejectedSmsMessage = true;
      console.log("✓ Schema rejected channels=['SMS'] as expected:", err.message);
    }
    if (!rejectedSmsMessage) {
      throw new Error("SECURITY FAILURE: Message schema allowed channels=['SMS']!");
    }

    // ------------------------------------------------------------
    // TEST 4: Controller Security Validation Checks
    // ------------------------------------------------------------
    console.log("\n--- TEST 4: Controller Validation for User Reminders ---");
    const userReminderController = require("../controllers/userReminderController");

    let fakeResStatus = 0;
    let fakeResJson = null;
    const mockRes = {
      status(code) {
        fakeResStatus = code;
        return this;
      },
      json(data) {
        fakeResJson = data;
        return this;
      },
    };

    // Test createUserReminder with channel="sms"
    fakeResStatus = 0;
    await userReminderController.createUserReminder(
      {
        user: { id: user._id },
        body: {
          title: "Bypass Test",
          dueDate: "2026-10-01",
          channel: "sms",
        },
      },
      mockRes
    );
    if (fakeResStatus === 400) {
      console.log("✓ Controller rejected { channel: 'sms' } with HTTP 400:", fakeResJson?.message);
    } else {
      throw new Error(`SECURITY FAILURE: Controller did not reject channel='sms', got status ${fakeResStatus}`);
    }

    // Test createUserReminder with channels.sms=true
    fakeResStatus = 0;
    await userReminderController.createUserReminder(
      {
        user: { id: user._id },
        body: {
          title: "Bypass Test Channels",
          dueDate: "2026-10-01",
          channels: { sms: true },
        },
      },
      mockRes
    );
    if (fakeResStatus === 400) {
      console.log("✓ Controller rejected { channels: { sms: true } } with HTTP 400:", fakeResJson?.message);
    } else {
      throw new Error(`SECURITY FAILURE: Controller did not reject channels.sms=true, got status ${fakeResStatus}`);
    }

    // ------------------------------------------------------------
    // TEST 5: Controller Validation for Admin Message
    // ------------------------------------------------------------
    console.log("\n--- TEST 5: Controller Validation for Admin Messages ---");
    const adminController = require("../controllers/adminController");
    fakeResStatus = 0;
    await adminController.createAdminMessage(
      {
        body: {
          userId: user.userId,
          title: "Admin SMS Bypass Test",
          message: "Testing admin bypass",
          channels: ["In-App", "SMS"],
        },
      },
      mockRes
    );
    if (fakeResStatus === 400) {
      console.log("✓ Admin controller rejected channels: ['In-App', 'SMS'] with HTTP 400:", fakeResJson?.message);
    } else {
      throw new Error(`SECURITY FAILURE: Admin controller did not reject SMS, got status ${fakeResStatus}`);
    }

    // ------------------------------------------------------------
    // TEST 6: Investment Controller SMS Rejection
    // ------------------------------------------------------------
    console.log("\n--- TEST 6: Investment Controller SMS Rejection ---");
    const investmentController = require("../controllers/investmentController");
    fakeResStatus = 0;
    await investmentController.addInvestment(
      {
        user: { id: user._id },
        body: {
          name: "Test Investment SMS",
          type: "SIP",
          amount: 5000,
          reminder: {
            enabled: true,
            channels: { inApp: true, email: true, sms: true },
          },
        },
      },
      mockRes
    );
    if (fakeResStatus === 400) {
      console.log("✓ Investment controller rejected reminder.channels.sms=true with HTTP 400:", fakeResJson?.message);
    } else {
      throw new Error(`SECURITY FAILURE: Investment controller did not reject SMS, got status ${fakeResStatus}`);
    }

    // ------------------------------------------------------------
    // TEST 7: Liability Controller SMS Rejection
    // ------------------------------------------------------------
    console.log("\n--- TEST 7: Liability Controller SMS Rejection ---");
    const liabilityController = require("../controllers/liabilityController");
    fakeResStatus = 0;
    await liabilityController.createLiability(
      {
        user: { id: user._id },
        body: {
          name: "Test Liability SMS",
          type: "Personal Loan",
          principalAmount: 50000,
          reminder: {
            enabled: true,
            channels: { inApp: true, email: true, sms: true },
          },
        },
      },
      mockRes
    );
    if (fakeResStatus === 400) {
      console.log("✓ Liability controller rejected reminder.channels.sms=true with HTTP 400:", fakeResJson?.message);
    } else {
      throw new Error(`SECURITY FAILURE: Liability controller did not reject SMS, got status ${fakeResStatus}`);
    }

    // ------------------------------------------------------------
    // TEST 8: Insurance Controller SMS Rejection
    // ------------------------------------------------------------
    console.log("\n--- TEST 8: Insurance Controller SMS Rejection ---");
    const insuranceController = require("../controllers/insuranceController");
    fakeResStatus = 0;
    await insuranceController.createInsurance(
      {
        user: { id: user._id },
        body: {
          name: "Test Insurance SMS",
          policyName: "Test Policy",
          premiumAmount: 5000,
          startDate: new Date(),
          reminder: {
            enabled: true,
            premiumReminders: {
              channels: { inApp: true, email: true, sms: true },
            },
          },
        },
      },
      mockRes
    );
    if (fakeResStatus === 400) {
      console.log("✓ Insurance controller rejected premiumReminders.channels.sms=true with HTTP 400:", fakeResJson?.message);
    } else {
      throw new Error(`SECURITY FAILURE: Insurance controller did not reject SMS, got status ${fakeResStatus}`);
    }

    // ------------------------------------------------------------
    // TEST 9: Legacy SMS Cleanup Migration
    // ------------------------------------------------------------
    console.log("\n--- TEST 9: Legacy SMS Cleanup Migration ---");
    // Manually insert legacy SMS documents into collections to test migration
    await Reminder.collection.insertOne({
      userId: user._id,
      userName: user.name,
      reminderType: "General",
      category: "General",
      itemName: "Legacy SMS Reminder",
      dueDate: new Date("2026-10-01"),
      scheduledDate: new Date("2026-10-01"),
      rule: "On due date",
      channel: "SMS",
      channels: { inApp: true, email: true, sms: true },
    });

    await cleanupLegacySmsPreferences();

    const sanitizedReminder = await Reminder.findOne({ itemName: "Legacy SMS Reminder" });
    if (!sanitizedReminder) throw new Error("Sanitized reminder not found!");
    if (sanitizedReminder.channel !== "In-App") {
      throw new Error(`Expected legacy channel='SMS' to be converted to 'In-App', got ${sanitizedReminder.channel}`);
    }
    if (sanitizedReminder.channels?.sms !== undefined) {
      throw new Error("Expected channels.sms to be unset!");
    }
    console.log("✓ Legacy SMS reminder safely converted to channel='In-App' and channels.sms unset!");

    // Clean up test records
    await Reminder.deleteMany({ userId: user._id });
    await User.findByIdAndDelete(user._id);

    console.log("\n==================================================");
    console.log("ALL SMS REMOVAL E2E TESTS PASSED SUCCESSFULLY! ✓");
    console.log("==================================================");
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

runTests().catch((err) => {
  console.error("TEST FAILED:", err);
  process.exit(1);
});
