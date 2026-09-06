// ============================================================
// FINANCEOS - USER REMINDER CONTROLLER
// Complete CRUD, Plan Integration, and Synchronization
// ============================================================

const Reminder = require("../models/Reminder");
const User = require("../models/User");
const {
  formatDateToIso,
  syncPlanRemindersForUser,
  updateSourcePlanReminder,
  disableSourcePlanReminder,
  enableSourcePlanReminder,
  deleteSourcePlanReminder,
} = require("../utils/reminderSync");

// Format a reminder document into a clean, frontend-ready object
function formatReminder(item) {
  const dueDateStr = item.dueDate ? formatDateToIso(item.dueDate) : null;
  const scheduledDateStr = item.scheduledDate ? formatDateToIso(item.scheduledDate) : dueDateStr;

  return {
    id: String(item._id),
    _id: String(item._id),
    userId: String(item.userId),
    title: item.itemName,
    itemName: item.itemName,
    date: dueDateStr,
    dueDate: dueDateStr,
    scheduledDate: scheduledDateStr,
    rule: item.rule || "Scheduled Reminder",
    notifyBefore: Array.isArray(item.notifyBefore) ? item.notifyBefore : [0],
    category: item.category || "General",
    reminderType: item.reminderType || "General",
    sourceType: item.sourceType || "General",
    sourceId: item.sourceId ? String(item.sourceId) : null,
    referenceId: item.referenceId || "",
    amount: Number(item.amount) || 0,
    channels: item.channels || {
      inApp: true,
      email: item.channel === "Email",
      sms: false,
    },
    channel: item.channel || "In-App",
    status: item.status || "Scheduled",
    read: Boolean(item.read),
    readAt: item.readAt || null,
    enabled: item.enabled !== false && item.status !== "Disabled",
    description: item.message || "",
    message: item.message || "",
    type: item.sourceType === "General" ? "user-reminder" : "plan-reminder",
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  };
}

// ============================================================
// GET USER REMINDERS
// GET /api/reminders
// ============================================================
const getUserReminders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sourceType, enabled, sync } = req.query;

    // Trigger plan synchronization if requested or periodically
    if (sync === "true" || sync === true) {
      try {
        await syncPlanRemindersForUser(userId);
      } catch (syncErr) {
        console.warn("Background reminder sync notice:", syncErr.message);
      }
    }

    const mongoose = require("mongoose");
    const userQuery = mongoose.Types.ObjectId.isValid(userId)
      ? { $in: [userId, new mongoose.Types.ObjectId(userId)] }
      : userId;

    const query = { userId: userQuery };
    if (sourceType && sourceType !== "All") {
      query.sourceType = sourceType;
    }
    if (enabled !== undefined) {
      query.enabled = enabled === "true" || enabled === true;
    }

    const reminders = await Reminder.find(query).sort({ scheduledDate: 1, dueDate: 1 }).lean();

    return res.status(200).json({
      success: true,
      count: reminders.length,
      data: reminders.map(formatReminder),
    });
  } catch (error) {
    console.error("Get user reminders error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reminders.",
      error: error.message,
    });
  }
};

// ============================================================
// CREATE USER REMINDER
// POST /api/reminders
// ============================================================
const createUserReminder = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      itemName,
      date,
      dueDate,
      scheduledDate,
      description,
      message,
      sourceType = "General",
      sourceId = null,
      referenceId = "",
      reminderType = "General",
      category = "General",
      amount = 0,
      notifyBefore = [0],
      channels = { inApp: true, email: false, sms: false },
      channel = "In-App",
      rule = "On due date",
    } = req.body;

    const finalTitle = title || itemName;
    const targetDueDate = dueDate || date;

    if (!finalTitle || !targetDueDate) {
      return res.status(400).json({
        success: false,
        message: "Title and due date are required.",
      });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const targetScheduledDate = scheduledDate || targetDueDate;

    const newReminder = await Reminder.create({
      userId,
      userCode: user.userCode || "",
      userName: user.name || "User",
      email: user.email || "",
      phone: user.phone || "",
      sourceType,
      sourceId,
      referenceId,
      reminderType,
      category,
      itemName: finalTitle,
      dueDate: new Date(targetDueDate),
      scheduledDate: new Date(targetScheduledDate),
      rule: rule || "Scheduled Reminder",
      notifyBefore: Array.isArray(notifyBefore) ? notifyBefore : [0],
      amount: Number(amount) || 0,
      channels,
      channel: channels.email ? "Email" : (channel || "In-App"),
      status: "Scheduled",
      enabled: true,
      message: description || message || `Reminder for ${finalTitle}`,
    });

    // If linked to a source plan, also update the source plan's reminder settings
    if (sourceType !== "General" && sourceId) {
      try {
        await updateSourcePlanReminder(userId, sourceType, sourceId, {
          enabled: true,
          notifyBefore,
          channels,
        });
      } catch (err) {
        console.warn("Linked source plan reminder update error:", err.message);
      }
    }

    return res.status(201).json({
      success: true,
      data: formatReminder(newReminder),
      message: "Reminder created successfully.",
    });
  } catch (error) {
    console.error("Create user reminder error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create reminder.",
      error: error.message,
    });
  }
};

// ============================================================
// UPDATE USER REMINDER
// PUT /api/reminders/:id
// ============================================================
// UPDATE USER REMINDER
// PUT /api/reminders/:id
// ============================================================
const updateUserReminder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const rawId = String(id || "").replace(/^reminder-due-|^reminder-/, "");
    const {
      title,
      itemName,
      date,
      dueDate,
      scheduledDate,
      description,
      message,
      rule,
      notifyBefore,
      channels,
      channel,
      amount,
      enabled,
      status,
    } = req.body;

    const existing = await Reminder.findOne({ _id: rawId, userId });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found.",
      });
    }

    if (title || itemName) existing.itemName = title || itemName;
    if (dueDate || date) existing.dueDate = new Date(dueDate || date);
    if (scheduledDate) existing.scheduledDate = new Date(scheduledDate);
    if (description !== undefined || message !== undefined) {
      existing.message = description !== undefined ? description : message;
    }
    if (rule) existing.rule = rule;
    if (Array.isArray(notifyBefore)) existing.notifyBefore = notifyBefore;
    if (channels) {
      existing.channels = channels;
      existing.channel = channels.email ? "Email" : (channel || existing.channel || "In-App");
    }
    if (channel) existing.channel = channel;
    if (amount !== undefined) existing.amount = Number(amount);
    if (enabled !== undefined) {
      existing.enabled = Boolean(enabled);
      existing.status = existing.enabled ? (status || "Scheduled") : "Disabled";
    }
    if (status) existing.status = status;

    await existing.save();

    // If linked to a source plan, synchronize the source plan's reminder settings
    if (existing.sourceType && existing.sourceType !== "General" && existing.sourceId) {
      try {
        await updateSourcePlanReminder(userId, existing.sourceType, existing.sourceId, {
          enabled: existing.enabled,
          notifyBefore: existing.notifyBefore,
          channels: existing.channels,
        });
      } catch (err) {
        console.warn("Linked source plan update error:", err.message);
      }
    }

    return res.status(200).json({
      success: true,
      data: formatReminder(existing),
      message: "Reminder updated successfully.",
    });
  } catch (error) {
    console.error("Update user reminder error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update reminder.",
      error: error.message,
    });
  }
};

// ============================================================
// TOGGLE / DISABLE / ENABLE REMINDER
// PATCH /api/reminders/:id/status
// ============================================================
const toggleReminderStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const rawId = String(id || "").replace(/^reminder-due-|^reminder-/, "");
    const { enabled } = req.body;

    const reminder = await Reminder.findOne({ _id: rawId, userId });
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found.",
      });
    }

    const nextEnabled = enabled !== undefined ? Boolean(enabled) : !reminder.enabled;
    reminder.enabled = nextEnabled;
    reminder.status = nextEnabled ? "Scheduled" : "Disabled";
    await reminder.save();

    // Sync with source plan if linked
    if (reminder.sourceType && reminder.sourceType !== "General" && reminder.sourceId) {
      try {
        if (nextEnabled) {
          await enableSourcePlanReminder(userId, reminder.sourceType, reminder.sourceId);
        } else {
          await disableSourcePlanReminder(userId, reminder.sourceType, reminder.sourceId);
        }
      } catch (err) {
        console.warn("Linked source plan toggle error:", err.message);
      }
    }

    return res.status(200).json({
      success: true,
      data: formatReminder(reminder),
      message: `Reminder ${nextEnabled ? "enabled" : "disabled"} successfully.`,
    });
  } catch (error) {
    console.error("Toggle reminder status error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update reminder status.",
      error: error.message,
    });
  }
};

// ============================================================
// DELETE USER REMINDER
// DELETE /api/reminders/:id
// Note: Only removes the reminder; underlying financial plan is safe!
// ============================================================
const deleteUserReminder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const rawId = String(id || "").replace(/^reminder-due-|^reminder-/, "");

    const reminder = await Reminder.findOne({ _id: rawId, userId });
    if (!reminder) {
      return res.status(404).json({
        success: false,
        message: "Reminder not found.",
      });
    }

    // If linked to source plan, safely disable on source plan and delete reminder
    if (reminder.sourceType && reminder.sourceType !== "General" && reminder.sourceId) {
      await deleteSourcePlanReminder(userId, reminder.sourceType, reminder.sourceId);
    } else {
      await Reminder.deleteOne({ _id: rawId, userId });
    }

    return res.status(200).json({
      success: true,
      message: "Reminder deleted successfully. Financial plan remains completely intact.",
    });
  } catch (error) {
    console.error("Delete user reminder error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete reminder.",
      error: error.message,
    });
  }
};

// ============================================================
// DIRECT SOURCE ACTIONS (For Cards & Details Modals)
// PUT /api/reminders/source/:sourceType/:sourceId
// ============================================================
const updateSourceReminder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sourceType, sourceId } = req.params;
    const config = req.body;

    const result = await updateSourcePlanReminder(userId, sourceType, sourceId, config);

    // Fetch synced reminder
    const updatedReminder = await Reminder.findOne({
      userId,
      sourceType,
      sourceId,
    }).lean();

    return res.status(200).json({
      success: true,
      data: updatedReminder ? formatReminder(updatedReminder) : null,
      message: "Plan reminder configuration updated successfully.",
    });
  } catch (error) {
    console.error("Update source reminder error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update plan reminder.",
      error: error.message,
    });
  }
};

// PATCH /api/reminders/source/:sourceType/:sourceId/disable
const disableSourceReminder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sourceType, sourceId } = req.params;

    await disableSourcePlanReminder(userId, sourceType, sourceId);

    return res.status(200).json({
      success: true,
      message: "Plan reminder disabled successfully.",
    });
  } catch (error) {
    console.error("Disable source reminder error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to disable plan reminder.",
      error: error.message,
    });
  }
};

// PATCH /api/reminders/source/:sourceType/:sourceId/enable
const enableSourceReminder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sourceType, sourceId } = req.params;

    await enableSourcePlanReminder(userId, sourceType, sourceId);

    return res.status(200).json({
      success: true,
      message: "Plan reminder enabled successfully.",
    });
  } catch (error) {
    console.error("Enable source reminder error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to enable plan reminder.",
      error: error.message,
    });
  }
};

// DELETE /api/reminders/source/:sourceType/:sourceId
const deleteSourceReminder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { sourceType, sourceId } = req.params;

    await deleteSourcePlanReminder(userId, sourceType, sourceId);

    return res.status(200).json({
      success: true,
      message: "Plan reminder removed successfully without affecting the financial plan.",
    });
  } catch (error) {
    console.error("Delete source reminder error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete plan reminder.",
      error: error.message,
    });
  }
};

// POST /api/reminders/sync
const triggerSync = async (req, res) => {
  try {
    const userId = req.user.id;
    const synced = await syncPlanRemindersForUser(userId);

    return res.status(200).json({
      success: true,
      count: synced.length,
      data: synced.map(formatReminder),
      message: "Plan reminders synchronized successfully.",
    });
  } catch (error) {
    console.error("Sync plan reminders error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to sync plan reminders.",
      error: error.message,
    });
  }
};

// ============================================================
// MARK SINGLE REMINDER AS READ
// PATCH /api/reminders/:id/read
// ============================================================
const markReminderAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const reminderId = req.params.id;
    const mongoose = require("mongoose");

    const userQuery = mongoose.Types.ObjectId.isValid(userId)
      ? { $in: [userId, new mongoose.Types.ObjectId(userId)] }
      : userId;

    let reminder = null;
    if (mongoose.Types.ObjectId.isValid(reminderId)) {
      reminder = await Reminder.findOne({ _id: reminderId, userId: userQuery });
    }
    if (!reminder) {
      reminder = await Reminder.findOne({ sourceId: reminderId, userId: userQuery });
    }

    if (!reminder) {
      return res.status(404).json({ success: false, message: "Reminder not found." });
    }

    reminder.read = true;
    reminder.readAt = new Date();
    await reminder.save();

    return res.status(200).json({
      success: true,
      message: "Reminder marked as read.",
      data: formatReminder(reminder),
    });
  } catch (error) {
    console.error("Mark reminder read error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark reminder as read.",
      error: error.message,
    });
  }
};

// ============================================================
// MARK ALL USER REMINDERS AS READ
// PATCH /api/reminders/mark-all-read
// ============================================================
const markAllRemindersAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const mongoose = require("mongoose");

    const userQuery = mongoose.Types.ObjectId.isValid(userId)
      ? { $in: [userId, new mongoose.Types.ObjectId(userId)] }
      : userId;

    const result = await Reminder.updateMany(
      { userId: userQuery, read: { $ne: true } },
      { $set: { read: true, readAt: new Date() } }
    );

    return res.status(200).json({
      success: true,
      message: "All reminders marked as read.",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Mark all reminders read error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark all reminders as read.",
      error: error.message,
    });
  }
};

module.exports = {
  getUserReminders,
  createUserReminder,
  updateUserReminder,
  toggleReminderStatus,
  deleteUserReminder,
  updateSourceReminder,
  disableSourceReminder,
  enableSourceReminder,
  deleteSourceReminder,
  triggerSync,
  markReminderAsRead,
  markAllRemindersAsRead,
};
