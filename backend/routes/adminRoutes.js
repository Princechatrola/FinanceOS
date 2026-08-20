// ============================================================
// FINANCEOS - ADMIN ROUTES
// ============================================================

const express = require("express");

const router = express.Router();


// ============================================================
// CONTROLLERS
// ============================================================

const {
  getAdminDashboard,
  getAdminUsers,
  getAdminUserById,
  updateUserStatus,
  archiveUser,
  getAdminActivities,
} = require("../controllers/adminController");


const {
  getAllUsers,
  getUserActivity,
  getActivityByUser,
} = require("../controllers/adminUserController");


// ============================================================
// MIDDLEWARE
// ============================================================

const authMiddleware = require("../middleware/authMiddleware");


// ============================================================
// ADMIN AUTHORIZATION
// ============================================================

const adminOnly = (req, res, next) => {

  if (
    !req.user ||
    req.user.role !== "admin"
  ) {
    return res.status(403).json({
      success: false,
      message: "Admin access required.",
    });
  }

  next();
};


// ============================================================
// APPLY AUTH + ADMIN CHECK
// ============================================================

router.use(
  authMiddleware,
  adminOnly
);


// ============================================================
// DASHBOARD
// ============================================================

router.get(
  "/dashboard",
  getAdminDashboard
);


// ============================================================
// USERS
// ============================================================

router.get(
  "/users",
  getAdminUsers
);

router.get(
  "/users/:id",
  getAdminUserById
);

router.patch(
  "/users/:id/status",
  updateUserStatus
);

router.delete(
  "/users/:id",
  archiveUser
);


// ============================================================
// ACTIVITIES
// ============================================================

router.get(
  "/activities",
  getUserActivity
);

router.get(
  "/activities/user/:userId",
  getActivityByUser
);


// ============================================================
// EXPORT
// ============================================================

module.exports = router;