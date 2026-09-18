// ============================================================
// FINANCEOS - CENTRALIZED SCHEDULER SERVICE
// Robust, Restart-Safe Background Worker for Scheduled Messages & Reminders
// Implements Atomic Locking (Idempotency) to Prevent Duplicate Processing
// ============================================================

const mongoose = require("mongoose");
const Message = require("../models/Message");
const Reminder = require("../models/Reminder");
const User = require("../models/User");
const {
  sendAdminMessageEmail,
  sendReminderEmail,
  isDeliverableEmail,
  maskEmail,
} = require("./emailService");

/**
 * Parse date and time strings into a UTC-reliable Date object
 */
function parseScheduledDateTime(dateStr, timeStr) {
  if (!dateStr) return null;

  if (!timeStr && typeof dateStr === "string" && dateStr.includes("T")) {
    const directDate = new Date(dateStr);
    if (!isNaN(directDate.getTime())) return directDate;
  }

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
    return new Date(
      dateParts[0],
      dateParts[1] - 1,
      dateParts[2],
      hours,
      minutes,
      0,
      0
    );
  }

  const d = new Date(
    `${dateClean}T${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:00`
  );
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Calculate next recurrence date based on frequency
 */
function calculateNextOccurrence(baseDate, frequency) {
  const next = new Date(baseDate instanceof Date ? baseDate.getTime() : Date.now());
  const freq = String(frequency || "").trim().toLowerCase();

  switch (freq) {
    case "daily":
      next.setDate(next.getDate() + 1);
      return next;
    case "weekly":
      next.setDate(next.getDate() + 7);
      return next;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      return next;
    case "quarterly":
      next.setMonth(next.getMonth() + 3);
      return next;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      return next;
    default:
      return null; // One-time ("Once")
  }
}

/**
 * On server startup: safely recover any tasks left in "Processing" state
 * from an unexpected shutdown or restart.
 */
async function recoverInterruptedTasks() {
  try {
    const recoveredMsgs = await Message.updateMany(
      { status: "Processing" },
      { $set: { status: "Scheduled" } }
    );

    const recoveredReminders = await Reminder.updateMany(
      { status: "Processing" },
      { $set: { status: "Scheduled" } }
    );

    if (recoveredMsgs.modifiedCount > 0 || recoveredReminders.modifiedCount > 0) {
      console.log(
        `[Scheduler] Startup recovery: Reset ${recoveredMsgs.modifiedCount} message(s) and ${recoveredReminders.modifiedCount} reminder(s) to Scheduled status.`
      );
    }
  } catch (err) {
    console.error("[Scheduler] Recovery error on startup:", err.message);
  }
}

/**
 * Process all scheduled Admin messages that are due.
 * Uses atomic findOneAndUpdate claiming to ensure exactly-once execution.
 */
async function processScheduledMessages() {
  try {
    const now = new Date();

    // Atomic loop: claim one due message at a time
    while (true) {
      const msg = await Message.findOneAndUpdate(
        {
          status: "Scheduled",
          $or: [
            { scheduledAt: { $lte: now } },
            {
              scheduledAt: null,
              scheduledDate: { $ne: null },
            },
          ],
        },
        { $set: { status: "Processing" } },
        { returnDocument: "after" }
      );

      if (!msg) {
        break; // No more due messages
      }

      // If scheduledAt was null, verify date/time before proceeding
      if (!msg.scheduledAt && msg.scheduledDate) {
        const parsed = parseScheduledDateTime(msg.scheduledDate, msg.scheduledTime);
        if (parsed && parsed > now) {
          // Future message! Update scheduledAt and put back to Scheduled
          await Message.updateOne(
            { _id: msg._id },
            { $set: { status: "Scheduled", scheduledAt: parsed } }
          );
          continue;
        }
      }

      console.log(
        `[Scheduler] Claimed scheduled message: "${msg.title}" (${msg._id})`
      );

      const channels = Array.isArray(msg.channels) ? msg.channels : ["In-App"];
      const hasEmail = channels.some((c) => String(c).toLowerCase() === "email");
      const hasInApp = channels.some(
        (c) =>
          String(c).toLowerCase().includes("app") ||
          String(c).toLowerCase() === "in-app"
      );

      const deliveryStatusObj = {
        inApp: {
          status: hasInApp ? "Sent" : "Skipped",
          sentAt: hasInApp ? new Date() : null,
          error: null,
        },
        email: {
          status: hasEmail ? "Pending" : "Skipped",
          sentAt: null,
          error: null,
          messageId: null,
        },
        // Backwards compatibility keys
        "In-App": hasInApp ? "Sent" : "Skipped",
        Email: hasEmail ? "Pending" : "Skipped",
      };

      // 1. IN-APP DELIVERY
      // Since msg is in MongoDB Message collection, it is directly accessible to in-app endpoints.
      if (hasInApp) {
        deliveryStatusObj.inApp = {
          status: "Sent",
          sentAt: new Date(),
          error: null,
        };
        deliveryStatusObj["In-App"] = "Sent";
      }

      // 2. EMAIL DELIVERY
      if (hasEmail) {
        if (msg.type === "Personal") {
          let email = msg.recipientEmail;
          let name = msg.recipient;

          if (!email && (msg.userId || msg.recipientUser)) {
            const user = await User.findOne({
              $or: [
                ...(msg.userId ? [{ userId: msg.userId }] : []),
                ...(msg.recipientUser ? [{ _id: msg.recipientUser }] : []),
                ...(mongoose.Types.ObjectId.isValid(msg.userId)
                  ? [{ _id: msg.userId }]
                  : []),
              ],
            }).lean();

            if (user?.email) {
              email = user.email;
              name = user.name || name;
            }
          }

          if (email && isDeliverableEmail(email)) {
            try {
              const emailResult = await sendAdminMessageEmail({
                to: email,
                recipientName: name || "FinanceOS User",
                subject: msg.title,
                message: msg.message,
                category: msg.category || "Scheduled Communication",
              });

              if (
                emailResult.success &&
                Array.isArray(emailResult.accepted) &&
                emailResult.accepted.length > 0
              ) {
                deliveryStatusObj.email = {
                  status: "Sent",
                  sentAt: new Date(),
                  error: null,
                  messageId: emailResult.messageId || null,
                };
                deliveryStatusObj["Email"] = "Sent";
              } else {
                deliveryStatusObj.email = {
                  status: "Failed",
                  sentAt: new Date(),
                  error: emailResult.error || "Email not accepted by SMTP server",
                  messageId: null,
                };
                deliveryStatusObj["Email"] = "Failed";
              }
            } catch (err) {
              console.error(
                `[Scheduler] Email dispatch error to ${maskEmail(email)}:`,
                err.message
              );
              deliveryStatusObj.email = {
                status: "Failed",
                sentAt: new Date(),
                error: err.message,
                messageId: null,
              };
              deliveryStatusObj["Email"] = "Failed";
            }
          } else {
            deliveryStatusObj.email = {
              status: "Failed",
              sentAt: new Date(),
              error: `Invalid or undeliverable recipient email: ${maskEmail(email)}`,
              messageId: null,
            };
            deliveryStatusObj["Email"] = "Failed";
          }
        } else if (msg.type === "Bulk") {
          const activeUsers = await User.find({
            role: { $nin: ["admin", "administrator"] },
            status: "Active",
            email: { $exists: true, $ne: "" },
          })
            .select("name email")
            .lean();

          let bulkSuccessCount = 0;
          for (const u of activeUsers) {
            if (u.email && isDeliverableEmail(u.email)) {
              try {
                const res = await sendAdminMessageEmail({
                  to: u.email,
                  recipientName: u.name || "FinanceOS User",
                  subject: msg.title,
                  message: msg.message,
                  category: "General Announcement",
                });
                if (res.success && res.accepted?.length > 0) {
                  bulkSuccessCount++;
                }
              } catch (bulkErr) {
                console.error(
                  `[Scheduler] Bulk email error to ${maskEmail(u.email)}:`,
                  bulkErr.message
                );
              }
            }
          }

          const isBulkAccepted = bulkSuccessCount > 0;
          deliveryStatusObj.email = {
            status: isBulkAccepted ? "Sent" : "Failed",
            sentAt: new Date(),
            error: isBulkAccepted
              ? null
              : "No recipients accepted the bulk dispatch",
          };
          deliveryStatusObj["Email"] = isBulkAccepted ? "Sent" : "Failed";
        }
      }

      // Calculate overall status
      let overallStatus = "Sent";
      const inAppFinal = deliveryStatusObj.inApp?.status;
      const emailFinal = deliveryStatusObj.email?.status;

      if (hasInApp && hasEmail) {
        if (inAppFinal === "Sent" && emailFinal === "Sent") {
          overallStatus = "Sent";
        } else if (inAppFinal === "Sent" && emailFinal === "Failed") {
          overallStatus = "Partially Delivered";
        } else if (inAppFinal === "Failed" && emailFinal === "Sent") {
          overallStatus = "Partially Delivered";
        } else {
          overallStatus = "Failed";
        }
      } else if (hasInApp) {
        overallStatus = inAppFinal === "Sent" ? "Sent" : "Failed";
      } else if (hasEmail) {
        overallStatus = emailFinal === "Sent" ? "Sent" : "Failed";
      }

      await Message.updateOne(
        { _id: msg._id },
        {
          $set: {
            deliveryStatus: deliveryStatusObj,
            status: overallStatus,
            sentAt: new Date(),
          },
        }
      );

      console.log(
        `[Scheduler] Message "${msg.title}" completed. Overall status: ${overallStatus}`
      );
    }
  } catch (error) {
    console.error("[Scheduler] Error processing scheduled messages:", error);
  }
}

/**
 * Process all scheduled & recurring User Financial Reminders that are due.
 * Uses atomic findOneAndUpdate claiming to prevent duplicate notifications.
 */
async function processScheduledReminders() {
  try {
    const now = new Date();

    // Atomic loop: claim one due reminder at a time
    while (true) {
      const rem = await Reminder.findOneAndUpdate(
        {
          enabled: { $ne: false },
          status: { $in: ["Scheduled", "Active"] },
          $or: [
            { nextRunAt: { $lte: now } },
            { scheduledAt: { $lte: now } },
            {
              scheduledAt: null,
              nextRunAt: null,
              scheduledDate: { $lte: now },
            },
          ],
        },
        { $set: { status: "Processing" } },
        { returnDocument: "after" }
      );

      if (!rem) {
        break; // No more due reminders
      }

      console.log(
        `[Scheduler] Claimed due reminder: "${rem.itemName}" (${rem._id})`
      );

      // Resolve owner user from authoritative MongoDB User collection
      let user = null;
      if (rem.userId) {
        user = await User.findById(rem.userId).lean();
      }
      if (!user && rem.userCode) {
        user = await User.findOne({ userId: rem.userCode }).lean();
      }

      const userName = user?.name || rem.userName || "FinanceOS User";
      const userEmail = user?.email || rem.email || null;

      // Determine delivery channels
      const hasEmail = Boolean(
        rem.channels?.email ||
          String(rem.channel || "").toLowerCase() === "email"
      );
      const hasInApp =
        rem.channels?.inApp !== false ||
        String(rem.channel || "").toLowerCase() === "in-app";

      const deliveryStatusObj = {
        inApp: {
          status: hasInApp ? "Pending" : "Skipped",
          sentAt: null,
          error: null,
        },
        email: {
          status: hasEmail ? "Pending" : "Skipped",
          sentAt: null,
          error: null,
          messageId: null,
        },
      };

      // 1. IN-APP NOTIFICATION: Create persistent MongoDB Message document
      if (hasInApp && user) {
        try {
          const reminderDueDateStr = rem.dueDate
            ? new Date(rem.dueDate).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "Upcoming";

          const notifTitle = `Reminder: ${rem.itemName}`;
          const notifBody =
            rem.message ||
            `Reminder for ${rem.itemName} (${rem.category}). Due Date: ${reminderDueDateStr}. Amount: ₹${Number(rem.amount || 0).toLocaleString("en-IN")}.`;

          await Message.create({
            recipientUser: user._id,
            userId: user.userId || String(user._id),
            recipient: userName,
            recipientEmail: userEmail,
            senderAdmin: "FinanceOS System",
            title: notifTitle,
            message: notifBody,
            category: "Reminder",
            priority: "Normal",
            type: "Personal",
            channels: ["In-App"],
            deliveryStatus: {
              inApp: { status: "Sent", sentAt: new Date(), error: null },
              "In-App": "Sent",
            },
            status: "Sent",
            sentAt: new Date(),
            read: false,
            metadata: {
              reminderId: String(rem._id),
              sourceType: rem.sourceType || "General",
              sourceId: rem.sourceId || null,
              amount: rem.amount || 0,
              dueDate: rem.dueDate || null,
            },
          });

          deliveryStatusObj.inApp = {
            status: "Sent",
            sentAt: new Date(),
            error: null,
          };
        } catch (inAppErr) {
          console.error(
            `[Scheduler] In-App message creation error for reminder ${rem._id}:`,
            inAppErr.message
          );
          deliveryStatusObj.inApp = {
            status: "Failed",
            sentAt: new Date(),
            error: inAppErr.message,
          };
        }
      }

      // 2. EMAIL NOTIFICATION: Send via centralized email service
      if (hasEmail) {
        if (userEmail && isDeliverableEmail(userEmail)) {
          try {
            const emailResult = await sendReminderEmail({
              to: userEmail,
              recipientName: userName,
              reminderTitle: rem.itemName,
              description:
                rem.message ||
                `Scheduled payment/contribution for ${rem.itemName}`,
              dueDate: rem.dueDate || now,
              linkedItem: rem.itemName,
              category: rem.category || "Reminder",
              amount: rem.amount || 0,
            });

            if (
              emailResult.success &&
              Array.isArray(emailResult.accepted) &&
              emailResult.accepted.length > 0
            ) {
              deliveryStatusObj.email = {
                status: "Sent",
                sentAt: new Date(),
                error: null,
                messageId: emailResult.messageId || null,
              };
            } else {
              deliveryStatusObj.email = {
                status: "Failed",
                sentAt: new Date(),
                error: emailResult.error || "Email not accepted by SMTP server",
                messageId: null,
              };
            }
          } catch (emailErr) {
            console.error(
              `[Scheduler] Reminder email error to ${maskEmail(userEmail)}:`,
              emailErr.message
            );
            deliveryStatusObj.email = {
              status: "Failed",
              sentAt: new Date(),
              error: emailErr.message,
              messageId: null,
            };
          }
        } else {
          deliveryStatusObj.email = {
            status: "Failed",
            sentAt: new Date(),
            error: `Recipient email is invalid or undeliverable: ${maskEmail(userEmail)}`,
            messageId: null,
          };
        }
      }

      // 3. RECURRENCE & STATE UPDATE
      const frequency = rem.frequency || "Monthly";
      const nextDate = calculateNextOccurrence(
        rem.dueDate || rem.scheduledDate || now,
        frequency
      );

      const isRecurring =
        Boolean(nextDate) &&
        String(frequency).toLowerCase() !== "once" &&
        rem.frequency !== "Once";

      const updateFields = {
        deliveryStatus: deliveryStatusObj,
        lastProcessedAt: now,
        sentAt: now,
      };

      if (isRecurring && nextDate) {
        // Recurring reminder: schedule next occurrence
        updateFields.status = "Scheduled";
        updateFields.scheduledDate = nextDate;
        updateFields.scheduledAt = nextDate;
        updateFields.nextRunAt = nextDate;
        updateFields.dueDate = nextDate;

        console.log(
          `[Scheduler] Recurring reminder "${rem.itemName}" next occurrence scheduled for: ${nextDate.toISOString()}`
        );
      } else {
        // One-time reminder: mark completed / sent
        const inAppStatus = deliveryStatusObj.inApp.status;
        const emailStatus = deliveryStatusObj.email.status;

        let finalStatus = "Sent";
        if (hasEmail && emailStatus === "Failed" && inAppStatus !== "Sent") {
          finalStatus = "Failed";
        }
        updateFields.status = finalStatus;
      }

      await Reminder.updateOne({ _id: rem._id }, { $set: updateFields });
    }
  } catch (error) {
    console.error("[Scheduler] Error processing reminders:", error);
  }
}

let schedulerTimer = null;

function startScheduler() {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
  }

  // Recover interrupted tasks on startup
  recoverInterruptedTasks().then(() => {
    // Run immediately on start
    processScheduledMessages();
    processScheduledReminders();
  });

  // Run every 10 seconds
  schedulerTimer = setInterval(async () => {
    try {
      await processScheduledMessages();
    } catch (err) {
      console.error("[Scheduler] Tick error (messages):", err.message);
    }
    try {
      await processScheduledReminders();
    } catch (err) {
      console.error("[Scheduler] Tick error (reminders):", err.message);
    }
  }, 10000);

  console.log(
    "FinanceOS Background Scheduler started (checking every 10 seconds)."
  );
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
  processScheduledReminders,
  parseScheduledDateTime,
  calculateNextOccurrence,
  recoverInterruptedTasks,
};
