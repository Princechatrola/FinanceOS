// ============================================================
// FINANCEOS - ADMIN CONTROLLER
// ============================================================

const mongoose = require("mongoose");

const User = require("../models/User");
const Activity = require("../models/Activity");
const MonthlyFinance = require("../models/MonthlyFinance");
const SavingGoal = require("../models/SavingGoal");
const Investment = require("../models/Investment");
const Insurance = require("../models/Insurance");
const Liability = require("../models/Liability");
const Message = require("../models/Message");

const { logActivity } = require("../utils/activityLogger");
const { sendAdminMessageEmail } = require("../utils/emailService");
const {
  APPROVED_VARIABLES,
  SUPPORTED_CONDITIONS,
  fetchUserFinancialContext,
  resolveTemplate,
  cleanResolvedText,
  evaluateAudienceCondition,
} = require("../services/personalizationService");

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
    const users = await User.find({})
      .sort({ createdAt: -1 })
      .select(
        "name userId email mobile phone city state gender dateOfBirth status createdAt role"
      )
      .lean();

    // Query active saving goals and other reminder settings to enrich users
    const [goals, investments, insurances, liabilities, monthlyFinances] =
      await Promise.all([
        SavingGoal.find({ "reminder.enabled": true, status: "Active" })
          .select("user reminder")
          .lean(),
        Investment.find({
          status: "Active",
          $or: [
            { "reminder.enabled": true },
            { "maturityReminder.enabled": true },
          ],
        })
          .select("user reminder maturityReminder")
          .lean(),
        Insurance.find({ status: "Active", "reminder.enabled": true })
          .select("user reminder")
          .lean(),
        Liability.find({ status: "Active", "reminder.enabled": true })
          .select("user reminder")
          .lean(),
        MonthlyFinance.find({ reminderEnabled: true })
          .select("user reminderEnabled emailNotification")
          .lean(),
      ]);

    const userRemindersMap = {};
    const registerUserReminder = (userIdStr, channel) => {
      if (!userIdStr) return;
      if (!userRemindersMap[userIdStr]) {
        userRemindersMap[userIdStr] = { count: 0, channels: new Set() };
      }
      userRemindersMap[userIdStr].count += 1;
      if (channel) userRemindersMap[userIdStr].channels.add(channel);
    };

    goals.forEach((g) => {
      const uid = String(g.user);
      if (g.reminder?.channels?.inApp !== false) registerUserReminder(uid, "In-App");
      if (g.reminder?.channels?.email) registerUserReminder(uid, "Email");
    });

    investments.forEach((inv) => {
      const uid = String(inv.user);
      if (inv.reminder?.channels?.inApp !== false) registerUserReminder(uid, "In-App");
      if (inv.reminder?.channels?.email) registerUserReminder(uid, "Email");
      if (inv.reminder?.channels?.sms) registerUserReminder(uid, "SMS");
    });

    insurances.forEach((ins) => {
      const uid = String(ins.user);
      if (ins.reminder?.premiumReminders?.channels?.inApp !== false) registerUserReminder(uid, "In-App");
      if (ins.reminder?.premiumReminders?.channels?.email) registerUserReminder(uid, "Email");
      if (ins.reminder?.premiumReminders?.channels?.sms) registerUserReminder(uid, "SMS");
    });

    liabilities.forEach((l) => {
      const uid = String(l.user);
      if (l.reminder?.channels?.inApp !== false) registerUserReminder(uid, "In-App");
      if (l.reminder?.channels?.email) registerUserReminder(uid, "Email");
      if (l.reminder?.channels?.sms) registerUserReminder(uid, "SMS");
    });

    monthlyFinances.forEach((mf) => {
      const uid = String(mf.user);
      registerUserReminder(uid, "In-App");
      if (mf.emailNotification) registerUserReminder(uid, "Email");
    });

    const enrichedUsers = users.map((u) => {
      const uid = String(u._id);
      const rem = userRemindersMap[uid];
      const channels = rem && rem.channels.size > 0 ? Array.from(rem.channels) : ["In-App"];
      return {
        ...u,
        id: u.userId || String(u._id),
        phone: u.phone || u.mobile || "",
        enabledChannels: channels,
        activeRemindersCount: rem ? rem.count : 0,
      };
    });

    const totalUsers = enrichedUsers.length;

    const activeUsers = enrichedUsers.filter(
      (user) => user.status === "Active"
    ).length;

    const inactiveUsers = enrichedUsers.filter(
      (user) => user.status === "Inactive"
    ).length;

    const suspendedUsers = enrichedUsers.filter(
      (user) => user.status === "Suspended"
    ).length;

    const monthStart = startOfCurrentMonth();

    const newThisMonth = enrichedUsers.filter(
      (user) =>
        user.createdAt &&
        new Date(user.createdAt) >= monthStart
    ).length;

    return res.status(200).json({
      success: true,
      users: enrichedUsers,
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
        "name userId email mobile phone city state gender dateOfBirth status createdAt role permissions"
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
// UPDATE USER ACCESS (PERMISSIONS)
// PUT /api/admin/users/:id/access
// ============================================================

const updateUserAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (!permissions) {
      return res.status(400).json({
        success: false,
        message: "Permissions object is required.",
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

    // Update permissions
    user.permissions = {
      dashboard: permissions.dashboard !== undefined ? permissions.dashboard : user.permissions.dashboard,
      monthlyFinance: permissions.monthlyFinance !== undefined ? permissions.monthlyFinance : user.permissions.monthlyFinance,
      savingGoals: permissions.savingGoals !== undefined ? permissions.savingGoals : user.permissions.savingGoals,
      plansCommitments: permissions.plansCommitments !== undefined ? permissions.plansCommitments : user.permissions.plansCommitments,
      financialCalendar: permissions.financialCalendar !== undefined ? permissions.financialCalendar : user.permissions.financialCalendar,
      reports: permissions.reports !== undefined ? permissions.reports : user.permissions.reports,
      aiAdvisor: permissions.aiAdvisor !== undefined ? permissions.aiAdvisor : user.permissions.aiAdvisor,
    };

    await user.save();

    await logActivity({
      userId: user._id,
      userName: user.name || "User",
      userEmail: user.email,
      type: "Account",
      description: "Admin updated user access permissions",
    });

    return res.status(200).json({
      success: true,
      message: "User access permissions updated successfully.",
      permissions: user.permissions,
    });

  } catch (error) {
    console.error("Update User Access Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update user access.",
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
// ADMIN MESSAGES CONTROLLERS
// ============================================================

const { processScheduledMessages } = require("../utils/schedulerService");

const getPersonalizationVariables = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      variables: APPROVED_VARIABLES,
      conditions: SUPPORTED_CONDITIONS,
    });
  } catch (error) {
    console.error("Get Variables Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const previewPersonalizedMessage = async (req, res) => {
  try {
    const {
      userId,
      audienceType = "Personal",
      condition = null,
      category = "General",
      templateTitle = "",
      templateMessage = "",
      selectedUserIds = [],
    } = req.body;

    let targetUser = null;
    let totalMatched = 1;
    let sampleUsers = [];

    if (audienceType === "Personal") {
      if (userId) {
        targetUser = await User.findOne({
          $or: [
            { userId: String(userId) },
            ...(mongoose.Types.ObjectId.isValid(userId) ? [{ _id: userId }] : []),
          ],
        }).lean();
      }
    } else if (audienceType === "Conditional") {
      const matched = await evaluateAudienceCondition(condition);
      totalMatched = matched.length;
      sampleUsers = matched.slice(0, 5).map((u) => ({ id: u.userId, _id: u._id, name: u.name, email: u.email }));
      if (userId) {
        targetUser = matched.find((u) => String(u._id) === String(userId) || u.userId === String(userId));
      }
      if (!targetUser && matched.length > 0) {
        targetUser = matched[0];
      }
    } else if (audienceType === "Multiple") {
      const ids = Array.isArray(selectedUserIds) ? selectedUserIds : [];
      const matched = await User.find({
        $or: [
          { userId: { $in: ids } },
          { _id: { $in: ids.filter((id) => mongoose.Types.ObjectId.isValid(id)) } },
        ],
      }).lean();
      totalMatched = matched.length;
      sampleUsers = matched.slice(0, 5).map((u) => ({ id: u.userId, _id: u._id, name: u.name, email: u.email }));
      if (userId) {
        targetUser = matched.find((u) => String(u._id) === String(userId) || u.userId === String(userId));
      }
      if (!targetUser && matched.length > 0) {
        targetUser = matched[0];
      }
    } else if (audienceType === "Bulk") {
      const all = await User.find({ role: { $nin: ["admin", "administrator"] }, status: "Active" }).lean();
      totalMatched = all.length;
      sampleUsers = all.slice(0, 5).map((u) => ({ id: u.userId, _id: u._id, name: u.name, email: u.email }));
      if (userId) {
        targetUser = all.find((u) => String(u._id) === String(userId) || u.userId === String(userId));
      }
      if (!targetUser && all.length > 0) {
        targetUser = all[0];
      }
    }

    if (!targetUser) {
      targetUser = await User.findOne({ role: { $nin: ["admin", "administrator"] } }).lean();
    }

    const context = targetUser
      ? await fetchUserFinancialContext(targetUser, category)
      : { userName: "User", userEmail: "", userId: "", userPhone: "" };

    const resolvedTitle = cleanResolvedText(resolveTemplate(templateTitle, context)) || "FinanceOS Communication";
    const resolvedMessage = cleanResolvedText(resolveTemplate(templateMessage, context)) || "";

    return res.status(200).json({
      success: true,
      totalMatched,
      sampleUsers,
      selectedUser: targetUser ? { id: targetUser.userId || String(targetUser._id), name: targetUser.name, email: targetUser.email } : null,
      context,
      preview: {
        title: resolvedTitle,
        message: resolvedMessage,
      },
    });
  } catch (error) {
    console.error("Preview Message Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAdminMessages = async (req, res) => {
  try {
    await processScheduledMessages();
    const messages = await Message.find({}).sort({ createdAt: -1 }).lean();

    const stats = {
      total: messages.length,
      scheduled: messages.filter((m) => m.status === "Scheduled").length,
      sent: messages.filter((m) => m.status === "Sent").length,
      failed: messages.filter((m) => m.status === "Failed").length,
      partial: messages.filter((m) => m.status === "Partially Delivered").length,
      cancelled: messages.filter((m) => m.status === "Cancelled").length,
      readCount: messages.filter((m) => m.read === true).length,
    };

    return res.status(200).json({
      success: true,
      stats,
      data: messages,
    });
  } catch (error) {
    console.error("Get Messages Error:", error);
    return res.status(500).json({ success: false, message: "Failed to load messages", error: error.message });
  }
};

const createAdminMessage = async (req, res) => {
  try {
    const {
      audienceType = "Personal",
      selectedUserIds = [],
      userId = null,
      condition = null,
      category = "General",
      priority = "Normal",
      channels = ["In-App"],
      delivery = "Now",
      scheduleDate = null,
      scheduleTime = null,
      subject = "",
      message = "",
      templateTitle = "",
      templateMessage = "",
    } = req.body;

    const titleTemplate = templateTitle || subject || "FinanceOS Communication";
    const bodyTemplate = templateMessage || message || "";

    const isScheduled = delivery === "Schedule";
    const hasEmail = channels.some((c) => c.toLowerCase() === "email");
    const hasInApp = channels.some((c) => c.toLowerCase().includes("app") || c.toLowerCase() === "in-app");

    // Resolve audience users from authoritative MongoDB data
    let targetUsers = [];

    if (audienceType === "Personal") {
      const targetId = userId || (selectedUserIds.length > 0 ? selectedUserIds[0] : null);
      if (!targetId) {
        return res.status(400).json({ success: false, message: "Please select a recipient user." });
      }
      const user = await User.findOne({
        $or: [
          { userId: String(targetId) },
          ...(mongoose.Types.ObjectId.isValid(targetId) ? [{ _id: targetId }] : []),
        ],
      }).lean();
      if (!user) {
        return res.status(404).json({ success: false, message: "Recipient user not found." });
      }
      targetUsers = [user];
    } else if (audienceType === "Multiple") {
      if (!Array.isArray(selectedUserIds) || selectedUserIds.length === 0) {
        return res.status(400).json({ success: false, message: "Please select at least one recipient user." });
      }
      targetUsers = await User.find({
        $or: [
          { userId: { $in: selectedUserIds } },
          { _id: { $in: selectedUserIds.filter((id) => mongoose.Types.ObjectId.isValid(id)) } },
        ],
        status: "Active",
      }).lean();
    } else if (audienceType === "Conditional") {
      targetUsers = await evaluateAudienceCondition(condition);
    } else if (audienceType === "Bulk") {
      targetUsers = await User.find({
        role: { $nin: ["admin", "administrator"] },
        status: "Active",
      }).lean();
    }

    if (targetUsers.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No active users found matching the selected audience criteria.",
      });
    }

    const createdMessages = [];

    // For EACH target user, generate personalized message using THEIR MongoDB data
    for (const user of targetUsers) {
      const context = await fetchUserFinancialContext(user, category);
      const personalizedTitle = cleanResolvedText(resolveTemplate(titleTemplate, context)) || "FinanceOS Communication";
      const personalizedBody = cleanResolvedText(resolveTemplate(bodyTemplate, context)) || "";

      const deliveryStatusMap = {};
      if (hasInApp) {
        deliveryStatusMap["In-App"] = isScheduled ? "Scheduled" : "Sent";
      }
      if (hasEmail) {
        deliveryStatusMap["Email"] = isScheduled ? "Scheduled" : "Sent";
      }

      // If sending immediately and email channel is enabled, dispatch email
      let emailFailed = false;
      if (!isScheduled && hasEmail && user.email) {
        const emailResult = await sendAdminMessageEmail({
          to: user.email,
          recipientName: user.name || "FinanceOS User",
          subject: personalizedTitle,
          message: personalizedBody,
          category: category || "Important Communication",
        });

        if (!emailResult.success) {
          deliveryStatusMap["Email"] = "Failed";
          emailFailed = true;
        }
      }

      const overallStatus = isScheduled
        ? "Scheduled"
        : emailFailed
        ? "Partially Delivered"
        : "Sent";

      const newMsg = new Message({
        recipientUser: user._id,
        userId: user.userId || String(user._id),
        recipient: user.name || "FinanceOS User",
        recipientEmail: user.email || "",
        senderAdmin: "Super Admin",
        title: personalizedTitle,
        message: personalizedBody,
        templateTitle: titleTemplate,
        templateMessage: bodyTemplate,
        category,
        priority,
        type: audienceType,
        condition: audienceType === "Conditional" ? condition : null,
        channels: [...channels],
        deliveryStatus: deliveryStatusMap,
        status: overallStatus,
        scheduledDate: isScheduled ? scheduleDate : null,
        scheduledTime: isScheduled ? scheduleTime : null,
        sentAt: isScheduled ? null : new Date(),
        read: false,
        metadata: context,
      });

      await newMsg.save();
      createdMessages.push(newMsg);
    }

    return res.status(201).json({
      success: true,
      message: `Successfully created ${createdMessages.length} personalized message(s).`,
      count: createdMessages.length,
      data: createdMessages[0],
    });
  } catch (error) {
    console.error("Create Admin Message Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create message.",
      error: error.message,
    });
  }
};

const updateAdminMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedMessage = await Message.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedMessage) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    // Check if retry was requested for email
    const deliveryStatus = req.body.deliveryStatus || {};
    if (deliveryStatus.Email === "Sent" && updatedMessage.recipientEmail) {
      sendAdminMessageEmail({
        to: updatedMessage.recipientEmail,
        recipientName: updatedMessage.recipient || "FinanceOS User",
        subject: updatedMessage.title,
        message: updatedMessage.message,
        category: updatedMessage.category || "Admin Communication",
      }).catch((err) => console.error("Retry email error:", err.message));
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

const getUserRemindersAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    let userQuery = { _id: id };
    if (!mongoose.Types.ObjectId.isValid(id)) {
      userQuery = { userId: id };
    }

    const user = await User.findOne(userQuery).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const [goals, investments, insurances, liabilities, monthlyFinances] =
      await Promise.all([
        SavingGoal.find({ user: user._id, "reminder.enabled": true, status: "Active" }).lean(),
        Investment.find({
          user: user._id,
          status: "Active",
          $or: [
            { "reminder.enabled": true },
            { "maturityReminder.enabled": true },
          ],
        }).lean(),
        Insurance.find({ user: user._id, status: "Active", "reminder.enabled": true }).lean(),
        Liability.find({ user: user._id, status: "Active", "reminder.enabled": true }).lean(),
        MonthlyFinance.find({ user: user._id, reminderEnabled: true }).sort({ year: -1, month: -1 }).limit(1).lean(),
      ]);

    const context = await fetchUserFinancialContext(user);

    // Saving goals
    for (const g of goals) {
      const chs = [];
      if (g.reminder?.channels?.inApp !== false) {
        chs.push("In-App");
        enabledChannelsSet.add("In-App");
      }
      if (g.reminder?.channels?.email) {
        chs.push("Email");
        enabledChannelsSet.add("Email");
      }
      if (chs.length === 0) {
        chs.push("In-App");
        enabledChannelsSet.add("In-App");
      }

      const notifyBefore = Array.isArray(g.reminder?.notifyBefore) ? g.reminder.notifyBefore : [];
      const rules = [];
      if (notifyBefore.includes(5)) rules.push("5 days before");
      if (notifyBefore.includes(1)) rules.push("1 day before");
      if (notifyBefore.includes(0)) rules.push("On contribution date");

      const gAmt = (g.monthlyContribution ? Number(g.monthlyContribution).toLocaleString("en-IN") : context.amount) || "1,960";
      const gSaved = (g.alreadySaved || g.currentAmount ? Number(g.alreadySaved || g.currentAmount).toLocaleString("en-IN") : context.savedAmount) || "1,000";
      const gTarget = (g.targetAmount ? Number(g.targetAmount).toLocaleString("en-IN") : context.goalAmount) || "50,000";

      items.push({
        id: `goal-${g._id}`,
        category: "Saving Goal",
        name: g.goalName,
        rule: `Day ${g.reminder?.contributionDay || 5} of month${rules.length ? ` (${rules.join(", ")})` : ""}`,
        channels: chs,
        monthlyContribution: g.monthlyContribution,
        targetAmount: g.targetAmount,
        alreadySaved: g.alreadySaved || g.currentAmount || 0,
        resolvedSubject: `Reminder: ${g.goalName} (Saving Goal)`,
        resolvedMessage: `Hello ${user.name},\n\nYour monthly contribution of ₹${gAmt} for saving goal "${g.goalName}" is scheduled for ${context.dueDate}.\nCurrent Saved: ₹${gSaved} of target ₹${gTarget}.\n\nPayment source: ${context.upiApp} linked with ${context.bankName} (ending ${context.accountLast4}).\n\nPlease check your FinanceOS dashboard.`,
      });
    }

    // Investments
    for (const inv of investments) {
      if (inv.reminder?.enabled || inv.type === "SIP" || inv.monthlyContribution > 0) {
        const chs = [];
        if (inv.reminder?.channels?.inApp !== false) { chs.push("In-App"); enabledChannelsSet.add("In-App"); }
        if (inv.reminder?.channels?.email) { chs.push("Email"); enabledChannelsSet.add("Email"); }
        if (inv.reminder?.channels?.sms) { chs.push("SMS"); enabledChannelsSet.add("SMS"); }
        if (chs.length === 0) chs.push("In-App");

        const invAmt = (inv.monthlyContribution ? Number(inv.monthlyContribution).toLocaleString("en-IN") : context.amount) || "2,000";

        items.push({
          id: `inv-sip-${inv._id}`,
          category: inv.type || "Investment (SIP)",
          name: inv.name,
          rule: `SIP Day ${inv.reminder?.contributionDay || 5} of month`,
          channels: chs,
          monthlyContribution: inv.monthlyContribution,
          resolvedSubject: `Reminder: ${inv.name} (${inv.type || "SIP"})`,
          resolvedMessage: `Hello ${user.name},\n\nYour monthly ${inv.name} contribution of ₹${invAmt} is scheduled for ${context.dueDate}.\n\nConfigured Payment Source: ${context.upiApp} linked with ${context.bankName} (ending ${context.accountLast4}).\n\nPlease ensure your account has sufficient balance.`,
        });
      }
    }

    // Insurances
    for (const ins of insurances) {
      const chs = [];
      if (ins.reminder?.premiumReminders?.channels?.inApp !== false) { chs.push("In-App"); enabledChannelsSet.add("In-App"); }
      if (ins.reminder?.premiumReminders?.channels?.email) { chs.push("Email"); enabledChannelsSet.add("Email"); }
      if (ins.reminder?.premiumReminders?.channels?.sms) { chs.push("SMS"); enabledChannelsSet.add("SMS"); }
      if (chs.length === 0) chs.push("In-App");

      const insAmt = (ins.premiumAmount ? Number(ins.premiumAmount).toLocaleString("en-IN") : context.premiumAmount) || "1,000";

      items.push({
        id: `ins-prem-${ins._id}`,
        category: "Insurance",
        name: ins.name || ins.policyName,
        rule: "Premium Due Date",
        channels: chs,
        premiumAmount: ins.premiumAmount,
        resolvedSubject: `Insurance Premium Due: ${ins.name || ins.policyName}`,
        resolvedMessage: `Hello ${user.name},\n\nYour insurance premium of ₹${insAmt} for ${ins.name || ins.policyName} is due on ${context.premiumDueDate || context.dueDate}.\n\nPayment source: ${context.bankName} (ending ${context.accountLast4}).\n\nPlease keep your policy active to maintain continuous protection.`,
      });
    }

    // Liabilities
    for (const l of liabilities) {
      const chs = [];
      if (l.reminder?.channels?.inApp !== false) { chs.push("In-App"); enabledChannelsSet.add("In-App"); }
      if (l.reminder?.channels?.email) { chs.push("Email"); enabledChannelsSet.add("Email"); }
      if (l.reminder?.channels?.sms) { chs.push("SMS"); enabledChannelsSet.add("SMS"); }
      if (chs.length === 0) chs.push("In-App");

      const emiAmt = (l.monthlyEMI ? Number(l.monthlyEMI).toLocaleString("en-IN") : context.emiAmount) || "3,260";
      const remAmt = (l.remainingAmount ? Number(l.remainingAmount).toLocaleString("en-IN") : context.liabilityOutstanding) || "13,740";

      items.push({
        id: `liab-${l._id}`,
        category: "Liability",
        name: l.name,
        rule: `${l.reminder?.daysBefore || 3} days before due date`,
        channels: chs,
        resolvedSubject: `Reminder: ${l.name} (Liability)`,
        resolvedMessage: `Hello ${user.name},\n\nYour monthly payment / EMI of ₹${emiAmt} for ${l.name} is due on ${context.dueDate}.\nOutstanding Balance: ₹${remAmt}.\n\nConfigured Payment Source: ${context.upiApp} linked with ${context.bankName} (ending ${context.accountLast4}).\n\nPlease ensure sufficient funds are available.`,
      });
    }

    // Monthly Finance
    for (const mf of monthlyFinances) {
      const chs = mf.emailNotification ? ["In-App", "Email"] : ["In-App"];
      chs.forEach((c) => enabledChannelsSet.add(c));
      items.push({
        id: `mf-${mf._id}`,
        category: "Monthly Finance",
        name: "Monthly Financial Status",
        rule: "Monthly review",
        channels: chs,
        resolvedSubject: `Monthly Financial Status for ${user.name}`,
        resolvedMessage: `Hello ${user.name},\n\nYour monthly financial summary has been updated for this month.\n\nPlease check your FinanceOS dashboard to review your income, expenses, and net worth progress.`,
      });
    }

    const enabledChannels = Array.from(enabledChannelsSet);
    if (enabledChannels.length === 0) {
      enabledChannels.push("In-App");
    }

    const defaultPersonalizedSubject = items.length > 0 ? items[0].resolvedSubject : `Important Financial Notice for ${user.name}`;
    const defaultPersonalizedMessage = items.length > 0 ? items[0].resolvedMessage : `Hello ${user.name},\n\nYour monthly contribution of ₹${context.amount} is scheduled for ${context.dueDate}.\n\nConfigured Payment Source: ${context.upiApp} linked with ${context.bankName} (ending ${context.accountLast4}).\n\nPlease check your FinanceOS dashboard for details.`;

    return res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        phone: user.phone || user.mobile || "",
      },
      context,
      defaultSubject: defaultPersonalizedSubject,
      defaultMessage: defaultPersonalizedMessage,
      enabledChannels,
      activeReminders: items,
    });
  } catch (error) {
    console.error("Get user reminders admin error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch user reminder settings",
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
  createAdminUser,
  updateAdminUser,
  updateUserAccess,
  updateUserStatus,
  archiveUser,
  getAdminActivities,
  getAdminReportUsers,
  getAdminMessages,
  createAdminMessage,
  updateAdminMessage,
  deleteAdminMessage,
  getUserRemindersAdmin,
  getPersonalizationVariables,
  previewPersonalizedMessage,
};
