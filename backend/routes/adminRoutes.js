// ============================================================
// FINANCEOS - ADMIN ROUTES
// ============================================================

const express = require("express");

const router = express.Router();

// ============================================================
// ADMIN CONTROLLER
// ============================================================

const {
  getAdminReminders,
  getReminderById,
  getReminderStats,
  retryReminder,
  createReminder,
} = require("../controllers/reminderController");

const {
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
} = require("../controllers/adminController");

// ============================================================
// AUTH MIDDLEWARE
// ============================================================

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");

// ============================================================
// AUTHENTICATION
// ============================================================

router.use(authMiddleware);
router.use(adminMiddleware);

// ============================================================
// ADMIN DASHBOARD
// ============================================================

router.get(
  "/dashboard",
  getAdminDashboard
);

// ============================================================
// ADMIN USERS
// ============================================================

router.get(
  "/users",
  getAdminUsers
);

router.post(
  "/users",
  createAdminUser
);

router.get(
  "/users/:id",
  getAdminUserById
);

router.get(
  "/users/:id/reminders",
  getUserRemindersAdmin
);

router.put(
  "/users/:id",
  updateAdminUser
);

router.put(
  "/users/:id/access",
  updateUserAccess
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
// ADMIN ACTIVITIES
// ============================================================

router.get(
  "/activities",
  getAdminActivities
);

// ============================================================
// ADMIN REPORTS
// ============================================================

router.get(
  "/reports/users",
  getAdminReportUsers
);

// ============================================================
// ADMIN MESSAGES
// ============================================================

router.get("/messages/variables", getPersonalizationVariables);
router.post("/messages/preview", previewPersonalizedMessage);
router.get("/messages", getAdminMessages);
router.post("/messages", createAdminMessage);
router.put("/messages/:id", updateAdminMessage);
router.delete("/messages/:id", deleteAdminMessage);

// ============================================================
// ADMIN - REMINDERS
// ============================================================

router.get(
  "/reminders",
  getAdminReminders
);

router.get(
  "/reminders/stats",
  getReminderStats
);

router.get(
  "/reminders/:id",
  getReminderById
);

router.post(
  "/reminders/:id/retry",
  retryReminder
);

router.post(
  "/reminders",
  createReminder
);
// ============================================================
// EXPORT
// ============================================================

module.exports = router;