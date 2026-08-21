// ============================================================
// FINANCEOS - ADMIN CONTROLLER
// ============================================================

const mongoose = require("mongoose");

const User = require("../models/User");
const Activity = require("../models/Activity");
const MonthlyFinance = require("../models/MonthlyFinance");

const { logActivity } = require("../utils/activityLogger");
const Message = require("../models/Message");

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

async function generateUserId() {
  const lastUser = await User.findOne({
    userId: /^FOS-U-/,
  }).sort({
    createdAt: -1,
  });

  let nextNumber = 1;

  if (lastUser?.userId) {
    const currentNumber = Number(
      lastUser.userId.replace("FOS-U-", "")
    );

    if (!Number.isNaN(currentNumber)) {
      nextNumber = currentNumber + 1;
    }
  }

  return `FOS-U-${String(nextNumber).padStart(6, "0")}`;
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
// CREATE USER (ADMIN)
// POST /api/admin/users
// ============================================================

const createAdminUser = async (req, res) => {
  try {
    const {
      fullName,
      dateOfBirth,
      gender,
      mobile,
      city,
      state,
      email,
      status,
    } = req.body;

    // Required fields
    if (
      !fullName ||
      !dateOfBirth ||
      !gender ||
      !mobile ||
      !city ||
      !state ||
      !email
    ) {
      return res.status(400).json({
        success: false,
        message: "All registration fields are required.",
      });
    }

    // Normalize inputs
    const normalizedName = String(fullName).trim();
    const normalizedMobile = String(mobile).trim();
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedCity = String(city).trim();
    const normalizedState = String(state).trim();

    // Validations
    if (!normalizedName) return res.status(400).json({ success: false, message: "Full name cannot be empty." });
    if (!/^[0-9]{10}$/.test(normalizedMobile)) return res.status(400).json({ success: false, message: "Enter a valid 10-digit mobile number." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({ success: false, message: "Enter a valid email address." });

    const allowedGenders = ["Male", "Female", "Other", "male", "female", "other", "prefer-not-to-say"];
    if (!allowedGenders.includes(String(gender).trim())) return res.status(400).json({ success: false, message: "Invalid gender selected." });

    const dob = new Date(`${dateOfBirth}T00:00:00`);
    if (Number.isNaN(dob.getTime())) return res.status(400).json({ success: false, message: "Enter a valid date of birth." });
    if (dob > new Date()) return res.status(400).json({ success: false, message: "Date of birth cannot be in the future." });

    // Check existing email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    // Generate User ID
    const userId = await generateUserId();

    // Create user
    const user = await User.create({
      userId,
      name: normalizedName,
      dateOfBirth: dob,
      gender: String(gender).trim(),
      phone: normalizedMobile,
      city: normalizedCity,
      state: normalizedState,
      email: normalizedEmail,
      role: "user",
      status: normalizeStatus(status) || "Active",
      otp: null,
      otpExpiresAt: null,
    });

    await logActivity({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      type: "Registration",
      description: "Admin created a new FinanceOS account",
    });

    return res.status(201).json({
      success: true,
      message: "FinanceOS account created successfully.",
      user: {
        _id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        status: user.status,
      },
    });

  } catch (error) {
    console.error("Create User Error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "An account with this information already exists." });
    }
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: "Please provide valid registration information." });
    }
    return res.status(500).json({ success: false, message: "Failed to create user.", error: error.message });
  }
};

// ============================================================
// UPDATE USER (ADMIN)
// PUT /api/admin/users/:id
// ============================================================

const updateAdminUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      dateOfBirth,
      gender,
      mobile,
      city,
      state,
      email,
      status,
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    const user = await User.findOne({
      _id: id,
      role: { $nin: ["admin", "administrator"] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Update fields if provided
    if (fullName !== undefined) {
      const normalizedName = String(fullName).trim();
      if (!normalizedName) return res.status(400).json({ success: false, message: "Full name cannot be empty." });
      user.name = normalizedName;
    }

    if (dateOfBirth !== undefined) {
      const dob = new Date(`${dateOfBirth}T00:00:00`);
      if (Number.isNaN(dob.getTime())) return res.status(400).json({ success: false, message: "Enter a valid date of birth." });
      user.dateOfBirth = dob;
    }

    if (gender !== undefined) {
      user.gender = String(gender).trim();
    }

    if (mobile !== undefined) {
      const normalizedMobile = String(mobile).trim();
      if (!/^[0-9]{10}$/.test(normalizedMobile)) return res.status(400).json({ success: false, message: "Enter a valid 10-digit mobile number." });
      user.phone = normalizedMobile;
    }

    if (city !== undefined) {
      user.city = String(city).trim();
    }

    if (state !== undefined) {
      user.state = String(state).trim();
    }

    if (email !== undefined) {
      const normalizedEmail = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) return res.status(400).json({ success: false, message: "Enter a valid email address." });

      // Check for duplicate email (excluding this user)
      const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: id } });
      if (existingUser) return res.status(409).json({ success: false, message: "An account with this email already exists." });

      user.email = normalizedEmail;
    }

    if (status !== undefined) {
      const validStatus = normalizeStatus(status);
      if (validStatus) user.status = validStatus;
    }

    await user.save();

    await logActivity({
      userId: user._id,
      userName: user.name || "User",
      userEmail: user.email,
      type: "Account",
      description: "Admin updated user profile",
    });

    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      user: {
        _id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        city: user.city,
        state: user.state,
        status: user.status,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("Update User Error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "An account with this information already exists." });
    }
    return res.status(500).json({ success: false, message: "Failed to update user.", error: error.message });
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
// ADMIN MESSAGES CONTROLLERS
// ============================================================

const getAdminMessages = async (req, res) => {
  try {
    const messages = await Message.find({}).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ success: true, data: messages });
  } catch (error) {
    console.error("Get Messages Error:", error);
    return res.status(500).json({ success: false, message: "Failed to load messages", error: error.message });
  }
};

const createAdminMessage = async (req, res) => {
  try {
    const newMessage = new Message(req.body);
    await newMessage.save();
    return res.status(201).json({ success: true, message: "Message created", data: newMessage });
  } catch (error) {
    console.error("Create Message Error:", error);
    return res.status(500).json({ success: false, message: "Failed to create message", error: error.message });
  }
};

const updateAdminMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedMessage = await Message.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedMessage) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }
    return res.status(200).json({ success: true, message: "Message updated", data: updatedMessage });
  } catch (error) {
    console.error("Update Message Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update message", error: error.message });
  }
};

const deleteAdminMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedMessage = await Message.findByIdAndDelete(id);
    if (!deletedMessage) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }
    return res.status(200).json({ success: true, message: "Message deleted" });
  } catch (error) {
    console.error("Delete Message Error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete message", error: error.message });
  }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  getAdminDashboard,
  getAdminUsers,
  getAdminUserById,
  createAdminUser,
  updateUserStatus,
  archiveUser,
  getAdminActivities,
  getAdminReportUsers,
  getAdminMessages,
  createAdminMessage,
  updateAdminMessage,
  deleteAdminMessage,
};
