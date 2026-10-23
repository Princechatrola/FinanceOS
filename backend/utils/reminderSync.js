// ============================================================
// FINANCEOS - REMINDER SYNC UTILITY
// ============================================================

const mongoose = require("mongoose");
const Reminder = require("../models/Reminder");
const User = require("../models/User");
const Investment = require("../models/Investment");
const Insurance = require("../models/Insurance");
const Liability = require("../models/Liability");
const SavingGoal = require("../models/SavingGoal");

// Helper: Format Date to YYYY-MM-DD
function formatDateToIso(date) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
}

// Helper: Get next valid date for a recurring day of month
function getNextDateForDay(dayNumber, baseDate = new Date()) {
  const day = Math.max(1, Math.min(28, Number(dayNumber) || 1));
  const now = new Date(baseDate);
  let year = now.getFullYear();
  let month = now.getMonth();

  if (now.getDate() > day) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  const d = new Date(year, month, day, 9, 0, 0);
  return d.toISOString().split("T")[0];
}

// Helper: Get date in a specific YYYY-MM for day
function getDateForMonthAndDay(yearMonthStr, dayNumber) {
  if (!yearMonthStr) return getNextDateForDay(dayNumber);
  const [yearStr, monthStr] = yearMonthStr.split("-");
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const day = Math.max(1, Math.min(lastDay, Number(dayNumber) || 1));
  const d = new Date(year, monthIndex, day, 9, 0, 0);
  return d.toISOString().split("T")[0];
}

// Helper: Add or subtract days from YYYY-MM-DD
function offsetDate(dateStr, offsetDays) {
  if (!dateStr) return dateStr;
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() + Number(offsetDays || 0));
  return d.toISOString().split("T")[0];
}

/**
 * Synchronizes all plan reminders for a user into the Reminder collection.
 * Non-destructive: does not modify plan financials, contributions, or transactions.
 */
async function syncPlanRemindersForUser(userId) {
  if (!userId) return [];

  const user = await User.findById(userId).lean();
  if (!user) return [];

  const [savingGoals, investments, insurances, liabilities] = await Promise.all([
    SavingGoal.find({ user: userId }).lean(),
    Investment.find({ user: userId }).lean(),
    Insurance.find({ user: userId }).lean(),
    Liability.find({ user: userId }).lean(),
  ]);

  const syncedReminders = [];

  // 1. SAVING GOALS
  for (const goal of savingGoals) {
    const isReminderEnabled = Boolean(
      goal.reminder?.enabled === true ||
      goal.reminder?.enabled === "true" ||
      goal.reminderEnabled === true
    );

    const existing = await Reminder.findOne({
      userId,
      sourceType: "SavingGoal",
      sourceId: goal._id,
    });

    if (!existing && !isReminderEnabled) {
      continue;
    }

    const day = Number(goal.contributionDay || goal.reminder?.contributionDay || 5);
    const dueDate = getNextDateForDay(day);
    const notifyBefore = Array.isArray(goal.reminder?.notifyBefore) && goal.reminder.notifyBefore.length > 0
      ? goal.reminder.notifyBefore
      : [0];
    const maxOffset = Math.max(...notifyBefore);
    const scheduledDate = offsetDate(dueDate, -maxOffset);

    const channels = {
      inApp: goal.reminder?.channels?.inApp !== false,
      email: Boolean(goal.reminder?.channels?.email),
    };
    const channelList = [];
    if (channels.inApp) channelList.push("In-App");
    if (channels.email) channelList.push("Email");
    const channel = channelList[0] || "In-App";

    const rule = `Day ${day} (${notifyBefore.map((n) => (n === 0 ? "On date" : `${n}d before`)).join(", ")})`;

    const reminderPayload = {
      userId,
      userCode: user.userCode || "",
      userName: user.name || "User",
      email: user.email || "",
      phone: user.phone || "",
      sourceType: "SavingGoal",
      sourceId: goal._id,
      referenceId: "goal-contribution",
      reminderType: "Goal",
      category: "Saving Goal",
      itemName: goal.goalName || goal.name || "Saving Goal",
      amount: goal.monthlyContribution || 0,
      dueDate: new Date(dueDate),
      rule,
      notifyBefore,
      scheduledDate: new Date(scheduledDate),
      scheduledTime: "09:00",
      channel,
      channels,
      enabled: isReminderEnabled,
      status: isReminderEnabled ? "Scheduled" : "Disabled",
      message: `Scheduled reminder for saving goal "${goal.goalName || goal.name}". Planned monthly contribution: ₹${goal.monthlyContribution || 0}. Due on ${dueDate}.`,
    };

    if (existing) {
      const updated = await Reminder.findByIdAndUpdate(
        existing._id,
        {
          ...reminderPayload,
          status: isReminderEnabled
            ? (existing.status === "Sent" ? "Sent" : "Scheduled")
            : "Disabled",
        },
        { returnDocument: "after" }
      );
      syncedReminders.push(updated);
    } else if (isReminderEnabled) {
      const created = await Reminder.create(reminderPayload);
      syncedReminders.push(created);
    }
  }

  // 2. INVESTMENTS (SIP & MATURITY)
  for (const inv of investments) {
    // SIP Reminder
    const isSipEnabled = Boolean(inv.reminder?.enabled === true || inv.reminder?.enabled === "true");
    const existingSip = await Reminder.findOne({
      userId,
      sourceType: "Investment",
      sourceId: inv._id,
      referenceId: "sip",
    });

    if (existingSip || isSipEnabled) {
      const day = Number(inv.dueDay || inv.reminder?.contributionDay || 5);
      const dueDate = getNextDateForDay(day);
      const notifyBefore = Array.isArray(inv.reminder?.notifyBefore) && inv.reminder.notifyBefore.length > 0
        ? inv.reminder.notifyBefore
        : [0];
      const maxOffset = Math.max(...notifyBefore);
      const scheduledDate = offsetDate(dueDate, -maxOffset);

      const channels = {
        inApp: inv.reminder?.channels?.inApp !== false,
        email: Boolean(inv.reminder?.channels?.email),
      };
      const channel = channels.email ? "Email" : "In-App";
      const rule = `SIP Day ${day} (${notifyBefore.map((n) => (n === 0 ? "On date" : `${n}d before`)).join(", ")})`;

      const sipPayload = {
        userId,
        userCode: user.userCode || "",
        userName: user.name || "User",
        email: user.email || "",
        phone: user.phone || "",
        sourceType: "Investment",
        sourceId: inv._id,
        referenceId: "sip",
        reminderType: "Investment",
        category: "Investment",
        itemName: inv.name || "SIP Investment",
        amount: inv.monthlyContribution || inv.amount || 0,
        dueDate: new Date(dueDate),
        rule,
        notifyBefore,
        scheduledDate: new Date(scheduledDate),
        scheduledTime: "09:00",
        channel,
        channels,
        enabled: isSipEnabled,
        status: isSipEnabled ? "Scheduled" : "Disabled",
        message: `SIP contribution reminder of ₹${inv.monthlyContribution || inv.amount || 0} for "${inv.name}". Due date: ${dueDate}.`,
      };

      if (existingSip) {
        const updated = await Reminder.findByIdAndUpdate(
          existingSip._id,
          {
            ...sipPayload,
            status: isSipEnabled
              ? (existingSip.status === "Sent" ? "Sent" : "Scheduled")
              : "Disabled",
          },
          { returnDocument: "after" }
        );
        syncedReminders.push(updated);
      } else if (isSipEnabled) {
        const created = await Reminder.create(sipPayload);
        syncedReminders.push(created);
      }
    }

    // Maturity Reminder
    const isMaturityEnabled = Boolean(inv.maturityReminder?.enabled === true || inv.maturityReminder?.enabled === "true");
    const existingMat = await Reminder.findOne({
      userId,
      sourceType: "Investment",
      sourceId: inv._id,
      referenceId: "maturity",
    });

    if (existingMat || (isMaturityEnabled && inv.maturityDate)) {
      const dueDate = formatDateToIso(inv.maturityDate);
      const daysBefore = (inv.maturityReminder?.notifyBeforeDays && inv.maturityReminder.notifyBeforeDays[0]) || 7;
      const scheduledDate = offsetDate(dueDate, -daysBefore);

      const channels = {
        inApp: inv.maturityReminder?.channels?.inApp !== false,
        email: Boolean(inv.maturityReminder?.channels?.email),
      };
      const channel = channels.email ? "Email" : "In-App";

      const matPayload = {
        userId,
        userCode: user.userCode || "",
        userName: user.name || "User",
        email: user.email || "",
        phone: user.phone || "",
        sourceType: "Investment",
        sourceId: inv._id,
        referenceId: "maturity",
        reminderType: "Maturity",
        category: "Investment",
        itemName: `${inv.name} (Maturity)`,
        amount: inv.estimatedMaturityAmount || inv.actualMaturityValue || inv.amount || 0,
        dueDate: new Date(dueDate),
        rule: `Maturity (${daysBefore} days before)`,
        notifyBefore: [daysBefore],
        scheduledDate: new Date(scheduledDate),
        scheduledTime: "09:00",
        channel,
        channels,
        enabled: isMaturityEnabled,
        status: isMaturityEnabled ? "Scheduled" : "Disabled",
        message: `Maturity reminder: Investment "${inv.name}" is scheduled to mature on ${dueDate}.`,
      };

      if (existingMat) {
        const updated = await Reminder.findByIdAndUpdate(
          existingMat._id,
          {
            ...matPayload,
            status: isMaturityEnabled
              ? (existingMat.status === "Sent" ? "Sent" : "Scheduled")
              : "Disabled",
          },
          { returnDocument: "after" }
        );
        syncedReminders.push(updated);
      } else if (isMaturityEnabled) {
        const created = await Reminder.create(matPayload);
        syncedReminders.push(created);
      }
    }
  }

  // 3. INSURANCE
  for (const ins of insurances) {
    const isInsEnabled = Boolean(
      ins.reminder?.enabled === true ||
      ins.reminder?.enabled === "true" ||
      ins.paymentReminder?.enabled === true
    );
    const existingIns = await Reminder.findOne({
      userId,
      sourceType: "Insurance",
      sourceId: ins._id,
      referenceId: "premium",
    });

    if (existingIns || isInsEnabled) {
      const prem = ins.reminder?.premiumReminders;
      const insDay = Number(ins.premiumDueDay || (ins.startDate ? new Date(ins.startDate).getDate() : 1));
      const dueDate = ins.nextPremiumDate
        ? formatDateToIso(ins.nextPremiumDate)
        : getNextDateForDay(insDay);

      const notifyBefore = [];
      if (prem?.fiveDaysBefore) notifyBefore.push(5);
      if (prem?.oneDayBefore) notifyBefore.push(1);
      if (prem?.onDueDate || notifyBefore.length === 0) notifyBefore.push(0);

      const maxOffset = Math.max(...notifyBefore);
      const scheduledDate = offsetDate(dueDate, -maxOffset);

      const channels = {
        inApp: prem?.channels?.inApp !== false,
        email: Boolean(prem?.channels?.email),
      };
      const channel = channels.email ? "Email" : "In-App";
      const rule = `Premium Due (${notifyBefore.map((n) => (n === 0 ? "On date" : `${n}d before`)).join(", ")})`;

      const insPayload = {
        userId,
        userCode: user.userCode || "",
        userName: user.name || "User",
        email: user.email || "",
        phone: user.phone || "",
        sourceType: "Insurance",
        sourceId: ins._id,
        referenceId: "premium",
        reminderType: "Insurance",
        category: "Insurance",
        itemName: ins.policyName || ins.name || "Insurance Policy",
        amount: ins.premiumAmount || 0,
        dueDate: new Date(dueDate),
        rule,
        notifyBefore,
        scheduledDate: new Date(scheduledDate),
        scheduledTime: "09:00",
        channel,
        channels,
        enabled: isInsEnabled,
        status: isInsEnabled ? "Scheduled" : "Disabled",
        message: `Premium reminder for policy "${ins.policyName || ins.name}". Amount: ₹${ins.premiumAmount || 0}. Due on ${dueDate}.`,
      };

      if (existingIns) {
        const updated = await Reminder.findByIdAndUpdate(
          existingIns._id,
          {
            ...insPayload,
            status: isInsEnabled
              ? (existingIns.status === "Sent" ? "Sent" : "Scheduled")
              : "Disabled",
          },
          { returnDocument: "after" }
        );
        syncedReminders.push(updated);
      } else if (isInsEnabled) {
        const created = await Reminder.create(insPayload);
        syncedReminders.push(created);
      }
    }
  }

  // 4. LIABILITIES
  for (const liab of liabilities) {
    const isLiabEnabled = Boolean(
      liab.reminder?.enabled === true ||
      liab.reminder?.enabled === "true"
    );
    const existingLiab = await Reminder.findOne({
      userId,
      sourceType: "Liability",
      sourceId: liab._id,
      referenceId: "emi",
    });

    if (existingLiab || isLiabEnabled) {
      const liabDay = Number(liab.dueDay || (liab.nextDueDate ? new Date(liab.nextDueDate).getDate() : 5));
      const dueDate = liab.nextDueDate
        ? formatDateToIso(liab.nextDueDate)
        : liab.dueDate
        ? formatDateToIso(liab.dueDate)
        : getNextDateForDay(liabDay);

      const daysBefore = Number(liab.reminder?.daysBefore || 3);
      const scheduledDate = offsetDate(dueDate, -daysBefore);

      const channels = {
        inApp: liab.reminder?.channels?.inApp !== false,
        email: Boolean(liab.reminder?.channels?.email),
      };
      const channel = channels.email ? "Email" : "In-App";

      const liabPayload = {
        userId,
        userCode: user.userCode || "",
        userName: user.name || "User",
        email: user.email || "",
        phone: user.phone || "",
        sourceType: "Liability",
        sourceId: liab._id,
        referenceId: "emi",
        reminderType: "Payment",
        category: "Liability",
        itemName: liab.name || "Loan / EMI",
        amount: liab.monthlyEMI || liab.emiAmount || 0,
        dueDate: new Date(dueDate),
        rule: `${daysBefore} days before payment`,
        notifyBefore: [daysBefore],
        scheduledDate: new Date(scheduledDate),
        scheduledTime: "09:00",
        channel,
        channels,
        enabled: isLiabEnabled,
        status: isLiabEnabled ? "Scheduled" : "Disabled",
        message: `EMI / Loan payment reminder of ₹${liab.monthlyEMI || 0} for "${liab.name}". Due on ${dueDate}.`,
      };

      if (existingLiab) {
        const updated = await Reminder.findByIdAndUpdate(
          existingLiab._id,
          {
            ...liabPayload,
            status: isLiabEnabled
              ? (existingLiab.status === "Sent" ? "Sent" : "Scheduled")
              : "Disabled",
          },
          { returnDocument: "after" }
        );
        syncedReminders.push(updated);
      } else if (isLiabEnabled) {
        const created = await Reminder.create(liabPayload);
        syncedReminders.push(created);
      }
    }
  }

  return syncedReminders;
}

/**
 * Updates a source plan's reminder configuration and synchronizes the Reminder collection.
 * Financial amounts, history, and status of the underlying plan are NEVER altered.
 */
async function updateSourcePlanReminder(userId, sourceType, sourceId, config) {
  if (!userId || !sourceType || !sourceId) {
    throw new Error("userId, sourceType, and sourceId are required.");
  }

  const enabled = config.enabled !== false;
  const channels = {
    inApp: config.channels?.inApp !== false,
    email: Boolean(config.channels?.email),
  };
  const notifyBefore = Array.isArray(config.notifyBefore)
    ? config.notifyBefore
    : [Number(config.daysBefore || config.notifyBefore || 0)];

  let updatedSourceDoc = null;

  if (sourceType === "SavingGoal") {
    updatedSourceDoc = await SavingGoal.findOneAndUpdate(
      { _id: sourceId, user: userId },
      {
        $set: {
          "reminder.enabled": enabled,
          "reminder.notifyBefore": notifyBefore,
          "reminder.channels": channels,
          ...(config.contributionDay ? { "reminder.contributionDay": Number(config.contributionDay) } : {}),
        },
      },
      { returnDocument: "after" }
    );
  } else if (sourceType === "Investment") {
    if (config.isMaturity) {
      updatedSourceDoc = await Investment.findOneAndUpdate(
        { _id: sourceId, user: userId },
        {
          $set: {
            "maturityReminder.enabled": enabled,
            "maturityReminder.notifyBeforeDays": notifyBefore,
            "maturityReminder.channels": channels,
          },
        },
        { returnDocument: "after" }
      );
    } else {
      updatedSourceDoc = await Investment.findOneAndUpdate(
        { _id: sourceId, user: userId },
        {
          $set: {
            "reminder.enabled": enabled,
            "reminder.notifyBefore": notifyBefore,
            "reminder.channels": channels,
            ...(config.contributionDay ? { "reminder.contributionDay": Number(config.contributionDay) } : {}),
          },
        },
        { returnDocument: "after" }
      );
    }
  } else if (sourceType === "Insurance") {
    const fiveDaysBefore = notifyBefore.includes(5);
    const oneDayBefore = notifyBefore.includes(1);
    const onDueDate = notifyBefore.includes(0);

    updatedSourceDoc = await Insurance.findOneAndUpdate(
      { _id: sourceId, user: userId },
      {
        $set: {
          "reminder.enabled": enabled,
          "reminder.premiumReminders.fiveDaysBefore": fiveDaysBefore,
          "reminder.premiumReminders.oneDayBefore": oneDayBefore,
          "reminder.premiumReminders.onDueDate": onDueDate,
          "reminder.premiumReminders.channels": channels,
        },
      },
      { returnDocument: "after" }
    );
  } else if (sourceType === "Liability") {
    const daysBefore = notifyBefore[0] !== undefined ? notifyBefore[0] : 3;
    updatedSourceDoc = await Liability.findOneAndUpdate(
      { _id: sourceId, user: userId },
      {
        $set: {
          "reminder.enabled": enabled,
          "reminder.daysBefore": daysBefore,
          "reminder.channels": channels,
        },
      },
      { returnDocument: "after" }
    );
  }

  // Update or sync Reminder documents
  await syncPlanRemindersForUser(userId);

  return { success: true, updatedSourceDoc };
}

/**
 * Disables a source plan reminder and updates the Reminder records.
 * Leaves the financial plan completely intact.
 */
async function disableSourcePlanReminder(userId, sourceType, sourceId) {
  return updateSourcePlanReminder(userId, sourceType, sourceId, { enabled: false });
}

/**
 * Enables a source plan reminder and updates the Reminder records.
 * Leaves the financial plan completely intact.
 */
async function enableSourcePlanReminder(userId, sourceType, sourceId) {
  return updateSourcePlanReminder(userId, sourceType, sourceId, { enabled: true });
}

/**
 * Deletes a reminder for a source plan.
 * Turns off reminder on the plan and deletes matching documents from the Reminder collection.
 * The underlying financial plan is NEVER deleted.
 */
async function deleteSourcePlanReminder(userId, sourceType, sourceId) {
  if (!userId || !sourceType || !sourceId) {
    throw new Error("userId, sourceType, and sourceId are required.");
  }

  // 1. Disable reminder config on source document
  if (sourceType === "SavingGoal") {
    await SavingGoal.findOneAndUpdate(
      { _id: sourceId, user: userId },
      { $set: { "reminder.enabled": false } }
    );
  } else if (sourceType === "Investment") {
    await Investment.findOneAndUpdate(
      { _id: sourceId, user: userId },
      { $set: { "reminder.enabled": false, "maturityReminder.enabled": false } }
    );
  } else if (sourceType === "Insurance") {
    await Insurance.findOneAndUpdate(
      { _id: sourceId, user: userId },
      { $set: { "reminder.enabled": false } }
    );
  } else if (sourceType === "Liability") {
    await Liability.findOneAndUpdate(
      { _id: sourceId, user: userId },
      { $set: { "reminder.enabled": false } }
    );
  }

  // 2. Remove reminder document from Reminder collection
  await Reminder.deleteMany({
    userId,
    sourceType,
    sourceId,
  });

  return { success: true, message: "Reminder removed successfully without affecting the financial plan." };
}

module.exports = {
  formatDateToIso,
  getNextDateForDay,
  getDateForMonthAndDay,
  offsetDate,
  syncPlanRemindersForUser,
  updateSourcePlanReminder,
  disableSourcePlanReminder,
  enableSourcePlanReminder,
  deleteSourcePlanReminder,
};
