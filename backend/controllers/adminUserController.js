// ============================================================
// FINANCEOS - ADMIN USER CONTROLLER
// ============================================================

const User = require("../models/User");
const Activity = require("../models/Activity");

// ============================================================
// GET ALL USERS
// GET /api/admin/users
// ============================================================

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({
      role: {
        $nin: ["admin", "administrator"],
      },
    })
      .select("-password")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("GET USERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
      error: error.message,
    });
  }
};

// ============================================================
// GET ALL USER ACTIVITY
// GET /api/admin/activities
// ============================================================

const getUserActivity = async (req, res) => {
  try {
    const activities = await Activity.find({})
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error("GET ACTIVITY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch activity.",
      error: error.message,
    });
  }
};

// ============================================================
// GET ACTIVITY BY USER
// GET /api/admin/activities/user/:userId
// ============================================================

const getActivityByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const activities = await Activity.find({
      userId,
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: activities.length,
      activities,
    });
  } catch (error) {
    console.error("GET USER ACTIVITY ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user activity.",
      error: error.message,
    });
  }
};

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  getAllUsers,
  getUserActivity,
  getActivityByUser,
};