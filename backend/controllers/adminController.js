// ============================================================
// FINANCEOS - ADMIN CONTROLLER
// ============================================================

const mongoose = require("mongoose");

const User = require("../models/User");
const Activity = require("../models/Activity");
const MonthlyFinance = require("../models/MonthlyFinance");

const { logActivity } = require("../utils/activityLogger");

// ============================================================
// HELPERS
// ============================================================

function normalizeStatus(status) {
  const allowedStatuses = [
    "Active",
    "Inactive",
    "Suspended",
  ];

  return allowedStatuses.includes(status)
    ? status
    : null;
}

function startOfCurrentMonth() {
  const now = new Date();

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
    0,
    0,
    0,
    0
  );
}

// ============================================================
// GET ADMIN DASHBOARD
// GET /api/admin/dashboard
// ============================================================

const getAdminDashboard = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({
      role: { $nin: ["admin", "administrator"] },
    });

    const activeUsers = await User.countDocuments({
      role: { $nin: ["admin", "administrator"] },
      status: "Active",
    });

    const inactiveUsers = await User.countDocuments({
      role: { $nin: ["admin", "administrator"] },
      status: "Inactive",
    });

    const suspendedUsers = await User.countDocuments({
      role: { $nin: ["admin", "administrator"] },
      status: "Suspended",
    });

    const totalAdmins = await User.countDocuments({
      $or: [
        { role: "admin" },
        { role: "administrator" },
      ],
    });

    const newThisMonth = await User.countDocuments({
      role: { $nin: ["admin", "administrator"] },
      createdAt: {
        $gte: startOfCurrentMonth(),
      },
    });

    // --------------------------------------------------------
    // RECENT REGISTRATIONS
    // --------------------------------------------------------

    const registrations = await User.find({
      role: { $nin: ["admin", "administrator"] },
    })
      .sort({ createdAt: -1 })
      .limit(8)
      .select(
        "name userId email mobile phone city state status createdAt"
      )
      .lean();

    // --------------------------------------------------------
    // USER GROWTH - LAST 6 MONTHS
    // --------------------------------------------------------

    const growth = [];

    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const start = new Date(
        now.getFullYear(),
        now.getMonth() - i,
        1,
        0,
        0,
        0,
        0
      );

      const end = new Date(
        now.getFullYear(),
        now.getMonth() - i + 1,
        1,
        0,
        0,
        0,
        0
      );

      const count = await User.countDocuments({
        role: {
          $nin: ["admin", "administrator"],
        },

        createdAt: {
          $gte: start,
          $lt: end,
        },
      });

      growth.push({
        month: start.toLocaleDateString(
          "en-IN",
          {
            month: "short",
          }
        ),

        value: count,
      });
    }

    return res.status(200).json({
      success: true,

      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        suspendedUsers,
        newThisMonth,
        totalAdmins,
      },

      registrations,

      growth,
    });

  } catch (error) {
    console.error(
      "Admin Dashboard Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard.",
      error: error.message,
    });
  }
};

// ============================================================
// GET ALL USERS
// GET /api/admin/users
// ============================================================

const getAdminUsers = async (req, res) => {
  try {
    const users = await User.find({
      role: {
        $nin: ["admin", "administrator"],
      },
    })
      .sort({ createdAt: -1 })
      .select(
        "name userId email mobile phone city state gender dateOfBirth status createdAt role"
      )
      .lean();

    const totalUsers = users.length;

    const activeUsers = users.filter(
      (user) => user.status === "Active"
    ).length;

    const inactiveUsers = users.filter(
      (user) => user.status === "Inactive"
    ).length;

    const suspendedUsers = users.filter(
      (user) => user.status === "Suspended"
    ).length;

    const monthStart = startOfCurrentMonth();

    const newThisMonth = users.filter(
      (user) =>
        user.createdAt &&
        new Date(user.createdAt) >= monthStart
    ).length;

    return res.status(200).json({
      success: true,

      users,

      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers,
        suspendedUsers,
        newThisMonth,
      },
    });

  } catch (error) {
    console.error(
      "Get Admin Users Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load users.",
      error: error.message,
    });
  }
};

// ============================================================
// GET SINGLE USER
// GET /api/admin/users/:id
// ============================================================

const getAdminUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const user = await User.findOne({
      _id: id,
      role: {
        $nin: ["admin", "administrator"],
      },
    })
      .select(
        "name userId email mobile phone city state gender dateOfBirth status createdAt role"
      )
      .lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });

  } catch (error) {
    console.error(
      "Get User Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load user.",
      error: error.message,
    });
  }
};

// ============================================================
// UPDATE USER STATUS
// PATCH /api/admin/users/:id/status
// ============================================================

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const validStatus =
      normalizeStatus(status);

    if (!validStatus) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid status. Use Active, Inactive or Suspended.",
      });
    }

    const user = await User.findOne({
      _id: id,
      role: {
        $nin: ["admin", "administrator"],
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    user.status = validStatus;

    await user.save();

    await logActivity({
      userId: user._id,
      userName: user.name || "User",
      userEmail: user.email,
      type: "Account",
      description: `Account status changed to ${validStatus}`,
    });

    return res.status(200).json({
      success: true,
      message: `User status changed to ${validStatus}.`,
      user: {
        _id: user._id,
        name: user.name,
        userId: user.userId,
        status: user.status,
      },
    });

  } catch (error) {
    console.error(
      "Update User Status Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update user status.",
      error: error.message,
    });
  }
};

// ============================================================
// ARCHIVE USER
// DELETE /api/admin/users/:id
// ============================================================

const archiveUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const user = await User.findOne({
      _id: id,
      role: {
        $nin: ["admin", "administrator"],
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // --------------------------------------------------------
    // Soft delete / archive
    // --------------------------------------------------------

    user.status = "Inactive";

    // If your User model supports these fields,
    // they will be useful later.

    await user.save();

    await logActivity({
      userId: user._id,
      userName: user.name || "User",
      userEmail: user.email,
      type: "Account",
      description: "Account was archived",
    });

    return res.status(200).json({
      success: true,
      message: "User archived successfully.",
    });

  } catch (error) {
    console.error(
      "Archive User Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to archive user.",
      error: error.message,
    });
  }
};

// ============================================================
// GET ADMIN ACTIVITIES
// GET /api/admin/activities
// ============================================================

const getAdminActivities = async (req, res) => {
  try {
    const activities = await Activity.find({})
      .sort({ createdAt: -1 })
      .lean();

    const normalizedActivities = activities.map((activity) => ({
      _id: activity._id,
      user: activity.userName,
      email: activity.userEmail,
      type: activity.type,
      description: activity.description,
      createdAt: activity.createdAt,
    }));

    const stats = {
      totalActivity: activities.length,
      registrationCount: activities.filter(
        (activity) => activity.type === "Registration"
      ).length,
      signInCount: activities.filter(
        (activity) => activity.type === "Sign In"
      ).length,
      reportCount: activities.filter(
        (activity) => activity.type === "Report"
      ).length,
    };

    return res.status(200).json({
      success: true,
      activities: normalizedActivities,
      stats,
    });
  } catch (error) {
    console.error("Get Admin Activities Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load admin activities.",
      error: error.message,
    });
  }
};

// ============================================================
// GET ADMIN REPORT USERS
// GET /api/admin/reports/users
// ============================================================

const getAdminReportUsers = async (req, res) => {
  try {
    const users = await User.find({
      role: {
        $nin: ["admin", "administrator"],
      },
    })
      .sort({ createdAt: -1 })
      .select(
        "userId name email phone city status createdAt"
      )
      .lean();

    const userIds = users.map((user) => user._id);

    const latestFinances = userIds.length
      ? await MonthlyFinance.aggregate([
          {
            $match: {
              user: { $in: userIds },
            },
          },
          {
            $sort: {
              year: -1,
              month: -1,
            },
          },
          {
            $group: {
              _id: "$user",
              income: { $first: "$income" },
            },
          },
        ])
      : [];

    const incomeByUserId = latestFinances.reduce(
      (accumulator, record) => {
        accumulator[String(record._id)] =
          record.income || 0;

        return accumulator;
      },
      {}
    );

    const reportUsers = users.map((user) => ({
      id: user.userId,
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      city: user.city || "",
      status: user.status || "Active",
      registered: user.createdAt || null,
      income: incomeByUserId[String(user._id)] || 0,
    }));

    return res.status(200).json({
      success: true,
      users: reportUsers,
    });
  } catch (error) {
    console.error(
      "Get Admin Report Users Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to load report users.",
      error: error.message,
    });
  }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  getAdminDashboard,
  getAdminUsers,
  getAdminUserById,
  updateUserStatus,
  archiveUser,
  getAdminActivities,
  getAdminReportUsers,
};
