// ============================================================
// FINANCEOS - USER REMINDER CONTROLLER
// ============================================================

const Reminder = require("../models/Reminder");
const User = require("../models/User");

// ============================================================
// GET USER REMINDERS
// GET /api/reminders
// ============================================================
const getUserReminders = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const reminders = await Reminder.find({ 
      userId, 
      reminderType: "General",
      category: "General" 
    }).sort({ dueDate: 1 }).lean();

    const formattedReminders = reminders.map((item) => ({
      id: item._id,
      title: item.itemName,
      date: item.dueDate ? item.dueDate.toISOString().split("T")[0] : null,
      description: item.message || "",
      type: "user-reminder"
    }));

    return res.status(200).json({ 
      success: true, 
      data: formattedReminders 
    });

  } catch (error) {
    console.error("Get user reminders error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to fetch reminders.",
      error: error.message
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
    const { title, date, description } = req.body;

    if (!title || !date) {
      return res.status(400).json({ 
        success: false, 
        message: "Title and date are required." 
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found." 
      });
    }

    const reminder = await Reminder.create({
      userId,
      userCode: user.userCode || "",
      userName: user.name || "User",
      email: user.email || "",
      phone: user.phone || "",
      reminderType: "General",
      category: "General",
      itemName: title,
      dueDate: date,
      rule: "On due date",
      scheduledDate: date,
      channel: "In-App",
      status: "Scheduled",
      message: description || "",
    });

    const formattedReminder = {
      id: reminder._id,
      title: reminder.itemName,
      date: reminder.dueDate ? reminder.dueDate.toISOString().split("T")[0] : null,
      description: reminder.message || "",
      type: "user-reminder"
    };

    return res.status(201).json({ 
      success: true, 
      data: formattedReminder, 
      message: "Reminder created successfully." 
    });

  } catch (error) {
    console.error("Create user reminder error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to create reminder.",
      error: error.message
    });
  }
};

// ============================================================
// DELETE USER REMINDER
// DELETE /api/reminders/:id
// ============================================================
const deleteUserReminder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const reminder = await Reminder.findOneAndDelete({ _id: id, userId });

    if (!reminder) {
      return res.status(404).json({ 
        success: false, 
        message: "Reminder not found." 
      });
    }

    return res.status(200).json({ 
      success: true, 
      message: "Reminder deleted successfully." 
    });

  } catch (error) {
    console.error("Delete user reminder error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to delete reminder.",
      error: error.message
    });
  }
};

module.exports = {
  getUserReminders,
  createUserReminder,
  deleteUserReminder
};
