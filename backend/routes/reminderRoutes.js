// ============================================================
// FINANCEOS - REMINDER ROUTES
// ============================================================

const express = require("express");

const router =
  express.Router();


// ============================================================
// CONTROLLER
// ============================================================

const {

  getAdminReminders,

  getReminderById,

  getReminderStats,

  retryReminder,

  createReminder,

} =
  require("../controllers/reminderController");


// ============================================================
// MIDDLEWARE
// ============================================================

// CHANGE THIS PATH IF YOUR AUTH FILE
// IS LOCATED SOMEWHERE ELSE.

const authMiddleware =
  require("../middleware/authMiddleware");

const adminMiddleware =
  require("../middleware/adminMiddleware");


// ============================================================
// ADMIN REMINDER ROUTES
// ============================================================


// GET ALL REMINDERS

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  getAdminReminders
);


// GET STATISTICS

router.get(
  "/stats",
  authMiddleware,
  adminMiddleware,
  getReminderStats
);


// GET SINGLE REMINDER

router.get(
  "/:id",
  authMiddleware,
  adminMiddleware,
  getReminderById
);


// RETRY FAILED REMINDER

router.post(
  "/:id/retry",
  authMiddleware,
  adminMiddleware,
  retryReminder
);


// CREATE REMINDER
// Mainly useful for backend testing.
// Later automated generation will use this model.

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  createReminder
);


// ============================================================
// EXPORT
// ============================================================

module.exports = router;