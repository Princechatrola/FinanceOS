// ============================================================
// FINANCEOS - SAFE LEGACY SMS CLEANUP UTILITY
// Safely removes obsolete SMS preferences and fields from
// existing MongoDB documents without altering any financial records.
// ============================================================

const Reminder = require("../models/Reminder");
const Investment = require("../models/Investment");
const Insurance = require("../models/Insurance");
const Liability = require("../models/Liability");
const Message = require("../models/Message");

async function cleanupLegacySmsPreferences() {
  try {
    // 1. Reminders collection: unset channels.sms and convert any channel='SMS' to 'In-App'
    await Reminder.updateMany(
      { "channels.sms": { $exists: true } },
      { $unset: { "channels.sms": 1 } }
    );

    await Reminder.updateMany(
      { channel: { $in: ["SMS", "sms", "Sms"] } },
      { $set: { channel: "In-App" } }
    );

    // 2. Investments collection: unset reminder.channels.sms & maturityReminder.channels.sms
    await Investment.updateMany(
      {
        $or: [
          { "reminder.channels.sms": { $exists: true } },
          { "maturityReminder.channels.sms": { $exists: true } },
        ],
      },
      {
        $unset: {
          "reminder.channels.sms": 1,
          "maturityReminder.channels.sms": 1,
        },
      }
    );

    // 3. Insurances collection: unset channels.sms from premium, expiry, maturity reminders
    await Insurance.updateMany(
      {
        $or: [
          { "reminder.premiumReminders.channels.sms": { $exists: true } },
          { "reminder.expiryReminders.channels.sms": { $exists: true } },
          { "reminder.maturityReminders.channels.sms": { $exists: true } },
        ],
      },
      {
        $unset: {
          "reminder.premiumReminders.channels.sms": 1,
          "reminder.expiryReminders.channels.sms": 1,
          "reminder.maturityReminders.channels.sms": 1,
        },
      }
    );

    // 4. Liabilities collection: unset reminder.channels.sms
    await Liability.updateMany(
      { "reminder.channels.sms": { $exists: true } },
      { $unset: { "reminder.channels.sms": 1 } }
    );

    // 5. Messages collection: remove "SMS" from channels array
    await Message.updateMany(
      { channels: { $in: ["SMS", "sms", "Sms"] } },
      { $pull: { channels: { $in: ["SMS", "sms", "Sms"] } } }
    );

    // Ensure any message with empty channels gets ["In-App"]
    await Message.updateMany(
      { channels: { $size: 0 } },
      { $set: { channels: ["In-App"] } }
    );

    console.log("[Cleanup] Successfully sanitized legacy SMS preferences across all collections.");
  } catch (error) {
    console.warn("[Cleanup] Notice during legacy SMS cleanup:", error.message);
  }
}

module.exports = {
  cleanupLegacySmsPreferences,
};
