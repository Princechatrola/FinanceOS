// ============================================================
// FINANCEOS - SCHEDULER SERVICE
// Background Worker for Scheduled Messages and Reminders
// ============================================================

const mongoose = require("mongoose");
const Message = require("../models/Message");
const Reminder = require("../models/Reminder");
const User = require("../models/User");
const { sendAdminMessageEmail } = require("./emailService");

/**
 * Parse date and time into a reliable Date object
 * Supports: "YYYY-MM-DD" + "12:45", "12:45 pm", "11:35 AM", etc.
 */
function parseScheduledDateTime(dateStr, timeStr) {
  if (!dateStr) return null;

  let isoDateStr = "";
  if (dateStr instanceof Date) {
    isoDateStr = dateStr.toISOString();
  } else if (typeof dateStr === "string") {
    isoDateStr = dateStr;
  } else {
    try {
      isoDateStr = new Date(dateStr).toISOString();
    } catch {
      return null;
    }
  }

  let rawTime = (timeStr || "09:00").toString().trim().toLowerCase();
  let hours = 9;
  let minutes = 0;

  const isPm = rawTime.includes("pm");
  const isAm = rawTime.includes("am");
  rawTime = rawTime.replace(/(am|pm)/g, "").trim();

  const parts = rawTime.split(":");
  if (parts.length >= 1) {
    hours = parseInt(parts[0], 10) || 0;
  }
  if (parts.length >= 2) {
    minutes = parseInt(parts[1], 10) || 0;
  }

  if (isPm && hours < 12) {
    hours += 12;
  } else if (isAm && hours === 12) {
    hours = 0;
  }

  const dateClean = isoDateStr.split("T")[0];
  const dateParts = dateClean.split("-").map(Number);
  if (dateParts.length === 3) {
    return new Date(dateParts[0], dateParts[1] - 1, dateParts[2], hours, minutes, 0, 0);
  }

  const d = new Date(`${dateClean}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Process all scheduled messages whose due date and time have arrived
 */
async function processScheduledMessages() {
  try {
    const now = new Date();

    // ----------------------------------------------------------
    // 1. PROCESS SCHEDULED MESSAGES
    // ----------------------------------------------------------
    const scheduledMessages = await Message.find({
      status: "Scheduled",
    });

    for (const msg of scheduledMessages) {
      if (!msg.scheduledDate) continue;

      const scheduledAt = parseScheduledDateTime(msg.scheduledDate, msg.scheduledTime);
      if (!scheduledAt) continue;

      // If scheduled time has arrived or passed
      if (now >= scheduledAt) {
        console.log(`[Scheduler] Dispatching scheduled message: "${msg.title}" (${msg._id})`);

        const channels = Array.isArray(msg.channels) ? msg.channels : [];
        const hasEmail = channels.some((c) => c.toLowerCase() === "email");
        const hasInApp = channels.some((c) => c.toLowerCase().includes("app") || c.toLowerCase() === "in-app");

        const deliveryStatusObj = {};

        // 1. IN-APP DELIVERY
        if (hasInApp) {
          deliveryStatusObj["In-App"] = "Sent";
        }

        // 2. EMAIL DELIVERY
        if (hasEmail) {
          if (msg.type === "Personal") {
            let email = msg.recipientEmail;
            let name = msg.recipient;

            if (!email && msg.userId) {
              const user = await User.findOne({
                $or: [
                  { userId: msg.userId },
                  ...(mongoose.Types.ObjectId.isValid(msg.userId) ? [{ _id: msg.userId }] : []),
                ],
              }).lean();

              if (user?.email) {
                email = user.email;
                name = user.name || name;
              }
            }

            if (email) {
              const emailResult = await sendAdminMessageEmail({
                to: email,
                recipientName: name || "FinanceOS User",
                subject: msg.title,
                message: msg.message,
                category: "Scheduled Communication",
              });

              deliveryStatusObj["Email"] = emailResult.success ? "Sent" : "Failed";
            } else {
              deliveryStatusObj["Email"] = "Failed";
            }
          } else if (msg.type === "Bulk") {
            const activeUsers = await User.find({
              status: "Active",
              email: { $exists: true, $ne: "" },
            }).select("name email").lean();

            for (const u of activeUsers) {
              if (u.email) {
                sendAdminMessageEmail({
                  to: u.email,
                  recipientName: u.name || "FinanceOS User",
                  subject: msg.title,
                  message: msg.message,
                  category: "General Announcement",
                }).catch((err) => console.error("Bulk scheduled email error:", err.message));
              }
            }

            deliveryStatusObj["Email"] = "Sent";
          }
        }

        // Calculate overall status
        const statuses = Object.values(deliveryStatusObj);
        let overallStatus = "Sent";
        if (statuses.length > 0) {
          if (statuses.every((s) => s === "Sent")) {
            overallStatus = "Sent";
          } else if (statuses.every((s) => s === "Failed")) {
            overallStatus = "Failed";
          } else if (statuses.some((s) => s === "Sent")) {
            overallStatus = "Partially Delivered";
          }
        }

        msg.deliveryStatus = deliveryStatusObj;
        msg.status = overallStatus;
        await msg.save();

        console.log(`[Scheduler] Message "${msg.title}" status updated to ${overallStatus}`);
      }
    }

    // ----------------------------------------------------------
    // 2. PROCESS SCHEDULED DIRECT REMINDERS
    // ----------------------------------------------------------
    const scheduledReminders = await Reminder.find({
      status: "Scheduled",
    });

    for (const rem of scheduledReminders) {
      if (!rem.scheduledDate) continue;

      const scheduledAt = parseScheduledDateTime(rem.scheduledDate, rem.scheduledTime);
      if (!scheduledAt) continue;

      if (now >= scheduledAt) {
        console.log(`[Scheduler] Dispatching direct reminder: "${rem.itemName}" (${rem._id})`);

        if (rem.channel === "Email" && rem.email) {
          await sendAdminMessageEmail({
            to: rem.email,
            recipientName: rem.userName || "FinanceOS User",
            subject: `Reminder: ${rem.itemName} (${rem.category})`,
            message: rem.message || `Reminder for ${rem.itemName}. Due Date: ${rem.dueDate || "Upcoming"}.`,
            category: rem.category || "Reminder",
          });
        }

        rem.status = "Sent";
        rem.sentAt = new Date();
        await rem.save();
      }
    }
  } catch (error) {
    console.error("[Scheduler] Error processing scheduled items:", error);
  }
}

let schedulerTimer = null;

function startScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
  }

  // Run immediately on start
  processScheduledMessages();

  // Run every 10 seconds
  schedulerTimer = setInterval(processScheduledMessages, 10000);
  console.log("FinanceOS Background Scheduler started (checking every 10 seconds).");
}

function stopScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
  }
}

module.exports = {
  startScheduler,
  stopScheduler,
  processScheduledMessages,
  parseScheduledDateTime,
};
