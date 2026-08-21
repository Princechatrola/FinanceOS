// ============================================================
// FINANCEOS - REMINDER CONTROLLER
// ============================================================

const Reminder = require("../models/Reminder");


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


    // --------------------------------------------------------
    // FILTER
    // --------------------------------------------------------

    const filter = {};


    if (status && status !== "All") {
      filter.status = status;
    }


    if (channel && channel !== "All") {
      filter.channel = channel;
    }


    if (type && type !== "All") {
      filter.reminderType = type;
    }


    if (category && category !== "All") {
      filter.category = category;
    }


    // --------------------------------------------------------
    // SEARCH
    // --------------------------------------------------------

    if (search && search.trim()) {

      const searchRegex =
        new RegExp(search.trim(), "i");

      filter.$or = [
        {
          userName: searchRegex,
        },
        {
          userCode: searchRegex,
        },
        {
          email: searchRegex,
        },
        {
          phone: searchRegex,
        },
        {
          itemName: searchRegex,
        },
        {
          reminderType: searchRegex,
        },
        {
          category: searchRegex,
        },
      ];
    }


    // --------------------------------------------------------
    // DATABASE
    // --------------------------------------------------------

    const reminders =
      await Reminder.find(filter)
        .sort({
          scheduledDate: 1,
          createdAt: -1,
        })
        .lean();


    // --------------------------------------------------------
    // FORMAT FOR FRONTEND
    // --------------------------------------------------------

    const formattedReminders =
      reminders.map((item) => ({

        id: item._id,

        userId:
          item.userCode ||
          item.userId?.toString(),

        userName:
          item.userName,

        email:
          item.email,

        phone:
          item.phone,

        reminderType:
          item.reminderType,

        category:
          item.category,

        itemName:
          item.itemName,

        dueDate:
          item.dueDate
            ? item.dueDate
                .toISOString()
                .split("T")[0]
            : null,

        rule:
          item.rule,

        scheduledDate:
          item.scheduledDate
            ? item.scheduledDate
                .toISOString()
                .split("T")[0]
            : null,

        scheduledTime:
          item.scheduledTime,

        channel:
          item.channel,

        status:
          item.status,

        sentAt:
          item.sentAt
            ? item.sentAt.toLocaleString(
                "en-IN"
              )
            : null,

        failureReason:
          item.failureReason,

        message:
          item.message,

        retryCount:
          item.retryCount,

      }));


    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.status(200).json({

      success: true,

      count:
        formattedReminders.length,

      data:
        formattedReminders,

    });

  } catch (error) {

    console.error(
      "Get admin reminders error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Failed to fetch reminders.",

      error:
        error.message,

    });
  }
};


// ============================================================
// GET SINGLE REMINDER
// GET /api/admin/reminders/:id
// ============================================================

const getReminderById = async (
  req,
  res
) => {

  try {

    const reminder =
      await Reminder.findById(
        req.params.id
      ).lean();


    if (!reminder) {

      return res.status(404).json({

        success: false,

        message:
          "Reminder not found.",

      });
    }


    return res.status(200).json({

      success: true,

      data: reminder,

    });

  } catch (error) {

    console.error(
      "Get reminder error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Failed to fetch reminder.",

      error:
        error.message,

    });
  }
};


// ============================================================
// GET REMINDER STATISTICS
// GET /api/admin/reminders/stats
// ============================================================

const getReminderStats = async (
  req,
  res
) => {

  try {

    const total =
      await Reminder.countDocuments();


    const scheduled =
      await Reminder.countDocuments({
        status: "Scheduled",
      });


    const sent =
      await Reminder.countDocuments({
        status: "Sent",
      });


    const failed =
      await Reminder.countDocuments({
        status: "Failed",
      });


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

    console.error(
      "Reminder statistics error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Failed to fetch reminder statistics.",

      error:
        error.message,

    });
  }
};


// ============================================================
// RETRY FAILED REMINDER
// POST /api/admin/reminders/:id/retry
// ============================================================

const retryReminder = async (
  req,
  res
) => {

  try {

    const reminder =
      await Reminder.findById(
        req.params.id
      );


    if (!reminder) {

      return res.status(404).json({

        success: false,

        message:
          "Reminder not found.",

      });
    }


    if (
      reminder.status !==
      "Failed"
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Only failed reminders can be retried.",

      });
    }


    // --------------------------------------------------------
    // RESET DELIVERY
    // --------------------------------------------------------

    reminder.status =
      "Scheduled";

    reminder.failureReason =
      null;

    reminder.sentAt =
      null;

    reminder.retryCount += 1;


    await reminder.save();


    return res.status(200).json({

      success: true,

      message:
        "Reminder scheduled for retry.",

      data: {

        id:
          reminder._id,

        status:
          reminder.status,

        retryCount:
          reminder.retryCount,

      },

    });

  } catch (error) {

    console.error(
      "Retry reminder error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Failed to retry reminder.",

      error:
        error.message,

    });
  }
};


// ============================================================
// CREATE REMINDER
// POST /api/admin/reminders
//
// This is useful for testing the backend initially.
// Later the reminder generator will create reminders
// automatically from user financial settings.
// ============================================================

const createReminder = async (
  req,
  res
) => {

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


    // --------------------------------------------------------
    // REQUIRED VALIDATION
    // --------------------------------------------------------

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

        message:
          "Required reminder fields are missing.",

      });
    }


    // --------------------------------------------------------
    // CREATE
    // --------------------------------------------------------

    const reminder =
      await Reminder.create({

        userId,

        userCode:
          userCode || "",

        userName,

        email:
          email || "",

        phone:
          phone || "",

        reminderType,

        category,

        itemName,

        dueDate,

        rule,

        scheduledDate,

        scheduledTime:
          scheduledTime || "09:00",

        channel,

        status:
          "Scheduled",

        message:
          message || "",

      });


    return res.status(201).json({

      success: true,

      message:
        "Reminder created successfully.",

      data:
        reminder,

    });

  } catch (error) {

    console.error(
      "Create reminder error:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        "Failed to create reminder.",

      error:
        error.message,

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