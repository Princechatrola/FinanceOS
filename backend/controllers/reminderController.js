// ============================================================
// FINANCEOS - REMINDER CONTROLLER
// ============================================================

const User = require("../models/User");
const SavingGoal = require("../models/SavingGoal");
const Investment = require("../models/Investment");
const Insurance = require("../models/Insurance");
const Liability = require("../models/Liability");
const MonthlyFinance = require("../models/MonthlyFinance");
const Reminder = require("../models/Reminder");

// ============================================================
// DATE HELPERS
// ============================================================

function formatDateToIso(date) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
}

function getNextDateForDay(dayNumber) {
  const now = new Date();
  const day = Math.max(1, Math.min(28, Number(dayNumber) || 1));
  let year = now.getFullYear();
  let month = now.getMonth();

  if (now.getDate() > day) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  const date = new Date(year, month, day, 9, 0, 0);
  return date.toISOString().split("T")[0];
}

function offsetDate(dateStr, offsetDays) {
  if (!dateStr) return dateStr;
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;
  d.setDate(d.getDate() + Number(offsetDays || 0));
  return d.toISOString().split("T")[0];
}

// ============================================================
// GET ALL ADMIN REMINDERS
// GET /api/admin/reminders
// ============================================================

const getAdminReminders = async (req, res) => {
  try {
    const {
      search,
      status,
      channel,
      type,
      category,
    } = req.query;

    const [
      allUsers,
      savingGoals,
      investments,
      insurances,
      liabilities,
      monthlyFinances,
      directReminders,
    ] = await Promise.all([
      User.find({}).lean(),
      SavingGoal.find({
        $or: [
          { "reminder.enabled": true },
          { "reminder.enabled": "true" },
          { reminderEnabled: true },
          { "reminder.contributionDay": { $exists: true } },
        ],
      }).lean(),
      Investment.find({
        $or: [
          { "reminder.enabled": true },
          { "reminder.enabled": "true" },
          { "maturityReminder.enabled": true },
          { "maturityReminder.enabled": "true" },
          { "reminder.contributionDay": { $exists: true } },
        ],
      }).lean(),
      Insurance.find({
        $or: [
          { "reminder.enabled": true },
          { "reminder.enabled": "true" },
          { "reminder.premiumReminders": { $exists: true } },
        ],
      }).lean(),
      Liability.find({
        $or: [
          { "reminder.enabled": true },
          { "reminder.enabled": "true" },
          { "reminder.daysBefore": { $exists: true } },
        ],
      }).lean(),
      MonthlyFinance.find({
        $or: [
          { reminderEnabled: true },
          { reminderEnabled: "true" },
        ],
      }).lean(),
      Reminder.find({}).lean(),
    ]);

    const userMap = new Map();
    for (const u of allUsers) {
      userMap.set(String(u._id), u);
      if (u.userId) userMap.set(String(u.userId), u);
    }

    const resolveUser = (docUser) => {
      if (docUser && typeof docUser === "object" && docUser.name) return docUser;
      const uid = String(docUser?._id || docUser || "");
      return userMap.get(uid) || { _id: uid, userId: uid, name: "FinanceOS User", email: "", phone: "" };
    };

    const allReminders = [];

    // --------------------------------------------------------
    // 1. SAVING GOALS
    // --------------------------------------------------------
    for (const goal of savingGoals) {
      const isEnabled =
        goal.reminder?.enabled === true ||
        goal.reminder?.enabled === "true" ||
        goal.reminderEnabled === true ||
        (goal.reminder && goal.reminder.contributionDay);
      if (!isEnabled) continue;

      const user = resolveUser(goal.user);
      const day = Number(goal.reminder?.contributionDay || 5);
      const dueDate = getNextDateForDay(day);
      const notifyBefore = Array.isArray(goal.reminder?.notifyBefore)
        ? goal.reminder.notifyBefore
        : [0];

      const channels = [];
      if (goal.reminder?.channels?.inApp !== false) channels.push("In-App");
      if (goal.reminder?.channels?.email) channels.push("Email");
      if (channels.length === 0) channels.push("In-App");

      const rules = [];
      const dispatchSchedule = [];
      if (notifyBefore.includes(5)) {
        rules.push("5 days before");
        dispatchSchedule.push({
          label: "5 days before",
          date: offsetDate(dueDate, -5),
          time: "09:00 AM",
        });
      }
      if (notifyBefore.includes(1)) {
        rules.push("1 day before");
        dispatchSchedule.push({
          label: "1 day before",
          date: offsetDate(dueDate, -1),
          time: "09:00 AM",
        });
      }
      if (notifyBefore.includes(0)) {
        rules.push("On contribution date");
        dispatchSchedule.push({
          label: "On contribution date",
          date: dueDate,
          time: "09:00 AM",
        });
      }

      const ruleText =
        rules.length > 0
          ? `Day ${day} of month (${rules.join(", ")})`
          : `Day ${day} of month`;

      const maxOffset = notifyBefore.length > 0 ? Math.max(...notifyBefore) : 0;
      const scheduledDate = offsetDate(dueDate, -maxOffset);

      allReminders.push({
        id: `goal-${goal._id}`,
        rawUserId: user._id,
        userId: user.userId || String(user._id || ""),
        userName: user.name || "FinanceOS User",
        email: user.email || "",
        phone: user.phone || user.mobile || "",
        reminderType: "Goal",
        category: "Saving Goal",
        itemName: goal.goalName,
        dueDate,
        rule: ruleText,
        timings: rules,
        dispatchSchedule: dispatchSchedule.length > 0 ? dispatchSchedule : [{ label: "Scheduled", date: scheduledDate, time: "09:00 AM" }],
        scheduledDate,
        scheduledTime: "09:00",
        channel: channels.join(", "),
        channels,
        status: "Scheduled",
        sentAt: null,
        failureReason: null,
        message: `Hello ${user.name || "User"},\n\nThis is a scheduled reminder for your saving goal "${goal.goalName}".\nPlanned Monthly Contribution: ₹${goal.monthlyContribution || 0}\nDue Date: ${dueDate}\n\nPlease visit your FinanceOS dashboard to record your contribution.`,
        retryCount: 0,
        createdAt: goal.createdAt,
        details: {
          targetAmount: goal.targetAmount,
          alreadySaved: goal.alreadySaved,
          currentAmount: goal.currentAmount,
          monthlyContribution: goal.monthlyContribution,
          fundLocation: goal.fundLocation,
        },
      });
    }

    // --------------------------------------------------------
    // 2. INVESTMENTS (SIP & MATURITY)
    // --------------------------------------------------------
    for (const inv of investments) {
      const user = resolveUser(inv.user);
      if (inv.reminder?.enabled) {
        const day = Number(inv.reminder.contributionDay || 5);
        const dueDate = getNextDateForDay(day);
        const notifyBefore = Array.isArray(inv.reminder.notifyBefore)
          ? inv.reminder.notifyBefore
          : [0];
        const channels = [];
        if (inv.reminder.channels?.inApp !== false) channels.push("In-App");
        if (inv.reminder.channels?.email) channels.push("Email");
        if (inv.reminder.channels?.sms) channels.push("SMS");
        if (channels.length === 0) channels.push("In-App");

        const rules = [];
        const dispatchSchedule = [];
        if (notifyBefore.includes(5)) {
          rules.push("5 days before");
          dispatchSchedule.push({ label: "5 days before", date: offsetDate(dueDate, -5), time: "09:00 AM" });
        }
        if (notifyBefore.includes(1)) {
          rules.push("1 day before");
          dispatchSchedule.push({ label: "1 day before", date: offsetDate(dueDate, -1), time: "09:00 AM" });
        }
        if (notifyBefore.includes(0)) {
          rules.push("On contribution date");
          dispatchSchedule.push({ label: "On contribution date", date: dueDate, time: "09:00 AM" });
        }

        const maxOffset = notifyBefore.length > 0 ? Math.max(...notifyBefore) : 0;
        const scheduledDate = offsetDate(dueDate, -maxOffset);

        allReminders.push({
          id: `inv-sip-${inv._id}`,
          rawUserId: user._id,
          userId: user.userId || String(user._id || ""),
          userName: user.name || "FinanceOS User",
          email: user.email || "",
          phone: user.phone || user.mobile || "",
          reminderType: "Investment",
          category: "Investment",
          itemName: inv.name,
          dueDate,
          rule: rules.length > 0 ? `SIP Day ${day} (${rules.join(", ")})` : `SIP Day ${day} of month`,
          timings: rules,
          dispatchSchedule: dispatchSchedule.length > 0 ? dispatchSchedule : [{ label: "Scheduled", date: scheduledDate, time: "09:00 AM" }],
          scheduledDate,
          scheduledTime: "09:00",
          channel: channels.join(", "),
          channels,
          status: "Scheduled",
          sentAt: null,
          failureReason: null,
          message: `Hello ${user.name || "User"},\n\nYour planned SIP contribution of ₹${inv.monthlyContribution || inv.amount || 0} for investment "${inv.name}" is scheduled for ${dueDate}.`,
          retryCount: 0,
          createdAt: inv.createdAt,
          details: {
            investmentType: inv.investmentType || inv.type,
            monthlyContribution: inv.monthlyContribution,
          },
        });
      }

      if (inv.maturityReminder?.enabled && inv.maturityDate) {
        const dueDate = formatDateToIso(inv.maturityDate);
        const channels = [];
        if (inv.maturityReminder.channels?.inApp !== false) channels.push("In-App");
        if (inv.maturityReminder.channels?.email) channels.push("Email");
        if (inv.maturityReminder.channels?.sms) channels.push("SMS");
        if (channels.length === 0) channels.push("In-App");

        const dispatchSchedule = [];
        const rules = [];
        if (inv.maturityReminder.notifyBeforeMonths?.includes(2)) {
          rules.push("2 months before");
          dispatchSchedule.push({ label: "2 months before", date: offsetDate(dueDate, -60), time: "09:00 AM" });
        }
        if (inv.maturityReminder.notifyBeforeMonths?.includes(1)) {
          rules.push("1 month before");
          dispatchSchedule.push({ label: "1 month before", date: offsetDate(dueDate, -30), time: "09:00 AM" });
        }
        if (inv.maturityReminder.notifyBeforeDays?.includes(7)) {
          rules.push("7 days before");
          dispatchSchedule.push({ label: "7 days before", date: offsetDate(dueDate, -7), time: "09:00 AM" });
        }
        if (inv.maturityReminder.onMaturityDate) {
          rules.push("On maturity date");
          dispatchSchedule.push({ label: "On maturity date", date: dueDate, time: "09:00 AM" });
        }

        allReminders.push({
          id: `inv-mat-${inv._id}`,
          rawUserId: user._id,
          userId: user.userId || String(user._id || ""),
          userName: user.name || "FinanceOS User",
          email: user.email || "",
          phone: user.phone || user.mobile || "",
          reminderType: "Maturity",
          category: "Investment",
          itemName: inv.name,
          dueDate,
          rule: rules.length > 0 ? `Maturity (${rules.join(", ")})` : "Investment Maturity Date",
          timings: rules,
          dispatchSchedule: dispatchSchedule.length > 0 ? dispatchSchedule : [{ label: "Maturity", date: dueDate, time: "09:00 AM" }],
          scheduledDate: dueDate,
          scheduledTime: "09:00",
          channel: channels.join(", "),
          channels,
          status: "Scheduled",
          sentAt: null,
          failureReason: null,
          message: `Hello ${user.name || "User"},\n\nYour investment "${inv.name}" is scheduled to mature on ${dueDate}. Please review your portfolio.`,
          retryCount: 0,
          createdAt: inv.createdAt,
        });
      }
    }

    // --------------------------------------------------------
    // 3. INSURANCE
    // --------------------------------------------------------
    for (const ins of insurances) {
      const user = resolveUser(ins.user);
      const prem = ins.reminder?.premiumReminders;
      if (prem) {
        const channels = [];
        if (prem.channels?.inApp !== false) channels.push("In-App");
        if (prem.channels?.email) channels.push("Email");
        if (prem.channels?.sms) channels.push("SMS");
        if (channels.length === 0) channels.push("In-App");

        const dueDate = ins.nextPremiumDate
          ? formatDateToIso(ins.nextPremiumDate)
          : getNextDateForDay(1);

        const rules = [];
        const dispatchSchedule = [];
        if (prem.fiveDaysBefore) {
          rules.push("5 days before");
          dispatchSchedule.push({ label: "5 days before", date: offsetDate(dueDate, -5), time: "09:00 AM" });
        }
        if (prem.oneDayBefore) {
          rules.push("1 day before");
          dispatchSchedule.push({ label: "1 day before", date: offsetDate(dueDate, -1), time: "09:00 AM" });
        }
        if (prem.onDueDate) {
          rules.push("On due date");
          dispatchSchedule.push({ label: "On due date", date: dueDate, time: "09:00 AM" });
        }

        const scheduledDate = prem.fiveDaysBefore
          ? offsetDate(dueDate, -5)
          : prem.oneDayBefore
          ? offsetDate(dueDate, -1)
          : dueDate;

        allReminders.push({
          id: `ins-prem-${ins._id}`,
          rawUserId: user._id,
          userId: user.userId || String(user._id || ""),
          userName: user.name || "FinanceOS User",
          email: user.email || "",
          phone: user.phone || user.mobile || "",
          reminderType: "Insurance",
          category: "Insurance",
          itemName: ins.name || ins.policyName,
          dueDate,
          rule: rules.length > 0 ? `Premium Due (${rules.join(", ")})` : "Premium Due Date",
          timings: rules,
          dispatchSchedule: dispatchSchedule.length > 0 ? dispatchSchedule : [{ label: "Scheduled", date: scheduledDate, time: "09:00 AM" }],
          scheduledDate,
          scheduledTime: "09:00",
          channel: channels.join(", "),
          channels,
          status: "Scheduled",
          sentAt: null,
          failureReason: null,
          message: `Hello ${user.name || "User"},\n\nYour insurance premium of ₹${ins.premiumAmount || 0} for policy "${ins.name || ins.policyName}" is due on ${dueDate}.`,
          retryCount: 0,
          createdAt: ins.createdAt,
        });
      }
    }

    // --------------------------------------------------------
    // 4. LIABILITIES
    // --------------------------------------------------------
    for (const liab of liabilities) {
      const user = resolveUser(liab.user);
      const channels = [];
      if (liab.reminder?.channels?.inApp !== false) channels.push("In-App");
      if (liab.reminder?.channels?.email) channels.push("Email");
      if (liab.reminder?.channels?.sms) channels.push("SMS");
      if (channels.length === 0) channels.push("In-App");

      const dueDate = liab.dueDate
        ? formatDateToIso(liab.dueDate)
        : liab.nextDueDate
        ? formatDateToIso(liab.nextDueDate)
        : getNextDateForDay(5);
      const daysBefore = Number(liab.reminder?.daysBefore || 3);
      const scheduledDate = offsetDate(dueDate, -daysBefore);

      allReminders.push({
        id: `liab-${liab._id}`,
        rawUserId: user._id,
        userId: user.userId || String(user._id || ""),
        userName: user.name || "FinanceOS User",
        email: user.email || "",
        phone: user.phone || user.mobile || "",
        reminderType: "Payment",
        category: "Liability",
        itemName: liab.name,
        dueDate,
        rule: `${daysBefore} days before payment date`,
        timings: [`${daysBefore} days before`],
        dispatchSchedule: [{ label: `${daysBefore} days before`, date: scheduledDate, time: "09:00 AM" }],
        scheduledDate,
        scheduledTime: "09:00",
        channel: channels.join(", "),
        channels,
        status: "Scheduled",
        sentAt: null,
        failureReason: null,
        message: `Hello ${user.name || "User"},\n\nYour monthly payment / EMI of ₹${liab.monthlyEmi || liab.emiAmount || 0} for liability "${liab.name}" is due on ${dueDate}.`,
        retryCount: 0,
        createdAt: liab.createdAt,
      });
    }

    // --------------------------------------------------------
    // 5. MONTHLY FINANCE
    // --------------------------------------------------------
    for (const mf of monthlyFinances) {
      const user = resolveUser(mf.user);
      const channels = mf.emailNotification ? ["In-App", "Email"] : ["In-App"];
      const dueDate = getNextDateForDay(1);

      allReminders.push({
        id: `mf-${mf._id}`,
        rawUserId: user._id,
        userId: user.userId || String(user._id || ""),
        userName: user.name || "FinanceOS User",
        email: user.email || "",
        phone: user.phone || user.mobile || "",
        reminderType: "General",
        category: "Monthly Finance",
        itemName: "Monthly Finance Position",
        dueDate,
        rule: "Monthly Financial Status Review",
        timings: ["1st of every month"],
        dispatchSchedule: [{ label: "1st of month", date: dueDate, time: "09:00 AM" }],
        scheduledDate: dueDate,
        scheduledTime: "09:00",
        channel: channels.join(", "),
        channels,
        status: "Scheduled",
        sentAt: null,
        failureReason: null,
        message: `Hello ${user.name || "User"},\n\nThis is a reminder to review and update your monthly financial position for this period.`,
        retryCount: 0,
        createdAt: mf.createdAt,
      });
    }

    // --------------------------------------------------------
    // 6. DIRECT REMINDERS (Reminder model)
    // --------------------------------------------------------
    for (const item of directReminders) {
      const user = resolveUser(item.userId);
      allReminders.push({
        id: String(item._id),
        rawUserId: user._id || item.userId,
        userId: item.userCode || user.userId || String(item.userId || ""),
        userName: item.userName || user.name || "FinanceOS User",
        email: item.email || user.email || "",
        phone: item.phone || user.phone || user.mobile || "",
        reminderType: item.reminderType || "General",
        category: item.category || "General",
        itemName: item.itemName,
        dueDate: item.dueDate ? formatDateToIso(item.dueDate) : null,
        rule: item.rule || "Reminder",
        timings: [item.rule || "Direct Reminder"],
        dispatchSchedule: [{ label: "Scheduled", date: item.scheduledDate ? formatDateToIso(item.scheduledDate) : getNextDateForDay(1), time: item.scheduledTime || "09:00 AM" }],
        scheduledDate: item.scheduledDate
          ? formatDateToIso(item.scheduledDate)
          : null,
        scheduledTime: item.scheduledTime || "09:00",
        channel: item.channel,
        channels: [item.channel],
        status: item.status || "Scheduled",
        sentAt: item.sentAt
          ? new Date(item.sentAt).toLocaleString("en-IN")
          : null,
        failureReason: item.failureReason,
        message: item.message,
        retryCount: item.retryCount || 0,
        createdAt: item.createdAt,
      });
    }

    // --------------------------------------------------------
    // FILTERING
    // --------------------------------------------------------
    let filtered = allReminders;

    if (status && status !== "All") {
      filtered = filtered.filter(
        (r) => r.status?.toLowerCase() === status.toLowerCase()
      );
    }

    if (channel && channel !== "All") {
      filtered = filtered.filter(
        (r) =>
          r.channels?.some((c) => c.toLowerCase() === channel.toLowerCase()) ||
          r.channel?.toLowerCase().includes(channel.toLowerCase())
      );
    }

    if (type && type !== "All") {
      filtered = filtered.filter(
        (r) => r.reminderType?.toLowerCase() === type.toLowerCase()
      );
    }

    if (category && category !== "All") {
      filtered = filtered.filter(
        (r) => r.category?.toLowerCase() === category.toLowerCase()
      );
    }

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((r) =>
        [
          r.id,
          r.userId,
          r.userName,
          r.email,
          r.phone,
          r.itemName,
          r.reminderType,
          r.category,
          r.rule,
        ].some((val) => String(val || "").toLowerCase().includes(q))
      );
    }

    // Sort by scheduledDate ascending
    filtered.sort((a, b) => {
      if (!a.scheduledDate) return 1;
      if (!b.scheduledDate) return -1;
      return new Date(a.scheduledDate) - new Date(b.scheduledDate);
    });

    return res.status(200).json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error) {
    console.error("Get admin reminders error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reminders.",
      error: error.message,
    });
  }
};

// ============================================================
// GET SINGLE REMINDER
// GET /api/admin/reminders/:id
// ============================================================

const getReminderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (id.startsWith("goal-")) {
      const goalId = id.replace("goal-", "");
      const goal = await SavingGoal.findById(goalId).populate("user").lean();
      if (!goal) return res.status(404).json({ success: false, message: "Reminder not found." });
      return res.status(200).json({ success: true, data: goal });
    }

    if (id.startsWith("inv-")) {
      const invId = id.replace("inv-sip-", "").replace("inv-mat-", "");
      const inv = await Investment.findById(invId).populate("user").lean();
      if (!inv) return res.status(404).json({ success: false, message: "Reminder not found." });
      return res.status(200).json({ success: true, data: inv });
    }

    if (id.startsWith("ins-")) {
      const insId = id.replace("ins-prem-", "");
      const ins = await Insurance.findById(insId).populate("user").lean();
      if (!ins) return res.status(404).json({ success: false, message: "Reminder not found." });
      return res.status(200).json({ success: true, data: ins });
    }

    if (id.startsWith("liab-")) {
      const liabId = id.replace("liab-", "");
      const liab = await Liability.findById(liabId).populate("user").lean();
      if (!liab) return res.status(404).json({ success: false, message: "Reminder not found." });
      return res.status(200).json({ success: true, data: liab });
    }

    const reminder = await Reminder.findById(id).lean();
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: reminder,
    });
  } catch (error) {
    console.error("Get reminder error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reminder.",
      error: error.message,
    });
  }
};

// ============================================================
// GET REMINDER STATISTICS
// GET /api/admin/reminders/stats
// ============================================================

const getReminderStats = async (req, res) => {
  try {
    const [
      goalsCount,
      invCount,
      insCount,
      liabCount,
      mfCount,
      directTotal,
      directSent,
      directFailed,
    ] = await Promise.all([
      SavingGoal.countDocuments({ "reminder.enabled": true, status: "Active" }),
      Investment.countDocuments({
        status: "Active",
        $or: [
          { "reminder.enabled": true },
          { "maturityReminder.enabled": true },
        ],
      }),
      Insurance.countDocuments({ status: "Active", "reminder.enabled": true }),
      Liability.countDocuments({ status: "Active", "reminder.enabled": true }),
      MonthlyFinance.countDocuments({ reminderEnabled: true }),
      Reminder.countDocuments(),
      Reminder.countDocuments({ status: "Sent" }),
      Reminder.countDocuments({ status: "Failed" }),
    ]);

    const activeAutomated =
      goalsCount + invCount + insCount + liabCount + mfCount;
    const total = activeAutomated + directTotal;
    const scheduled =
      activeAutomated + (directTotal - directSent - directFailed);
    const sent = directSent;
    const failed = directFailed;

    return res.status(200).json({
      success: true,
      data: {
        total,
        scheduled,
        sent,
        failed,
      },
    });
  } catch (error) {
    console.error("Reminder statistics error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reminder statistics.",
      error: error.message,
    });
  }
};

// ============================================================
// RETRY FAILED REMINDER
// POST /api/admin/reminders/:id/retry
// ============================================================

const retryReminder = async (req, res) => {
  try {
    const reminder = await Reminder.findById(req.params.id);

    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found.",
      });
    }

    if (reminder.status !== "Failed") {
      return res.status(400).json({
        success: false,
        message: "Only failed reminders can be retried.",
      });
    }

    reminder.status = "Scheduled";
    reminder.failureReason = null;
    reminder.sentAt = null;
    reminder.retryCount += 1;

    await reminder.save();

    return res.status(200).json({
      success: true,
      message: "Reminder scheduled for retry.",
      data: {
        id: reminder._id,
        status: reminder.status,
        retryCount: reminder.retryCount,
      },
    });
  } catch (error) {
    console.error("Retry reminder error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retry reminder.",
      error: error.message,
    });
  }
};

// ============================================================
// CREATE REMINDER
// POST /api/admin/reminders
// ============================================================

const createReminder = async (req, res) => {
  try {
    const {
      userId,
      userCode,
      userName,
      email,
      phone,
      reminderType,
      category,
      itemName,
      dueDate,
      rule,
      scheduledDate,
      scheduledTime,
      channel,
      message,
    } = req.body;

    if (
      !userId ||
      !userName ||
      !reminderType ||
      !category ||
      !itemName ||
      !dueDate ||
      !rule ||
      !scheduledDate ||
      !channel
    ) {
      return res.status(400).json({
        success: false,
        message: "Required reminder fields are missing.",
      });
    }

    const reminder = await Reminder.create({
      userId,
      userCode: userCode || "",
      userName,
      email: email || "",
      phone: phone || "",
      reminderType,
      category,
      itemName,
      dueDate,
      rule,
      scheduledDate,
      scheduledTime: scheduledTime || "09:00",
      channel,
      status: "Scheduled",
      message: message || "",
    });

    return res.status(201).json({
      success: true,
      message: "Reminder created successfully.",
      data: reminder,
    });
  } catch (error) {
    console.error("Create reminder error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create reminder.",
      error: error.message,
    });
  }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  getAdminReminders,
  getReminderById,
  getReminderStats,
  retryReminder,
  createReminder,
};