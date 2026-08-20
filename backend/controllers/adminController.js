const User = require("../models/User");

// ============================================================
// ADMIN DASHBOARD
// GET /api/admin/dashboard
// ============================================================

const getAdminDashboard = async (req, res) => {
  try {
    // --------------------------------------------------------
    // 1. TOTAL USERS
    // --------------------------------------------------------

    const totalUsers = await User.countDocuments({
      role: "user",
    });

    // --------------------------------------------------------
    // 2. ACTIVE USERS
    // --------------------------------------------------------

    const activeUsers = await User.countDocuments({
      role: "user",
      status: "Active",
    });

    // --------------------------------------------------------
    // 3. INACTIVE USERS
    // --------------------------------------------------------

    const inactiveUsers = await User.countDocuments({
      role: "user",
      status: "Inactive",
    });

    // --------------------------------------------------------
    // 4. SUSPENDED USERS
    // --------------------------------------------------------
    // Your current User schema doesn't have "Suspended".
    // So currently this will be 0.

    const suspendedUsers = 0;

    // --------------------------------------------------------
    // 5. NEW USERS THIS MONTH
    // --------------------------------------------------------

    const now = new Date();

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1
    );

    const newThisMonth = await User.countDocuments({
      role: "user",
      createdAt: {
        $gte: startOfMonth,
      },
    });

    // --------------------------------------------------------
    // 6. TOTAL ADMINS
    // --------------------------------------------------------

    const totalAdmins = await User.countDocuments({
      role: "admin",
    });

    // --------------------------------------------------------
    // 7. RECENT REGISTRATIONS
    // --------------------------------------------------------

    const registrations = await User.find({
      role: "user",
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select("userId name email status createdAt");

    // --------------------------------------------------------
    // 8. USER GROWTH - LAST 6 MONTHS
    // --------------------------------------------------------

    const sixMonthsAgo = new Date();

    sixMonthsAgo.setMonth(
      sixMonthsAgo.getMonth() - 5
    );

    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const userGrowth = await User.aggregate([
      {
        $match: {
          role: "user",
          createdAt: {
            $gte: sixMonthsAgo,
          },
        },
      },

      {
        $group: {
          _id: {
            year: {
              $year: "$createdAt",
            },

            month: {
              $month: "$createdAt",
            },
          },

          count: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          "_id.year": 1,
          "_id.month": 1,
        },
      },
    ]);

    // --------------------------------------------------------
    // 9. FORMAT USER GROWTH
    // --------------------------------------------------------

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const growth = userGrowth.map((item) => ({
      month:
        monthNames[item._id.month - 1],

      value: item.count,
    }));

    // --------------------------------------------------------
    // 10. SEND RESPONSE
    // --------------------------------------------------------

    res.status(200).json({
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

    res.status(500).json({
      success: false,
      message: "Failed to load admin dashboard",
      error: error.message,
    });
  }
};

module.exports = {
  getAdminDashboard,
};