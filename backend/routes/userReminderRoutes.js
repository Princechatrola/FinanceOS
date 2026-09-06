// ============================================================
// FINANCEOS - USER REMINDER ROUTES
// ============================================================

const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getUserReminders,
  createUserReminder,
  updateUserReminder,
  toggleReminderStatus,
  deleteUserReminder,
  updateSourceReminder,
  disableSourceReminder,
  enableSourceReminder,
  deleteSourceReminder,
  triggerSync,
  markReminderAsRead,
  markAllRemindersAsRead,
} = require("../controllers/userReminderController");

// ============================================================
// AUTH REQUIREMENT
// ============================================================
router.use(authMiddleware);

// ============================================================
// BASE REMINDER CRUD
// ============================================================
router.get("/", getUserReminders);
router.post("/", createUserReminder);
router.post("/sync", triggerSync);
router.patch("/mark-all-read", markAllRemindersAsRead);
router.patch("/:id/read", markReminderAsRead);
router.put("/:id", updateUserReminder);
router.patch("/:id/status", toggleReminderStatus);
router.delete("/:id", deleteUserReminder);

// ============================================================
// DIRECT SOURCE PLAN REMINDER ACTIONS
// ============================================================
router.put("/source/:sourceType/:sourceId", updateSourceReminder);
router.patch("/source/:sourceType/:sourceId/disable", disableSourceReminder);
router.patch("/source/:sourceType/:sourceId/enable", enableSourceReminder);
router.delete("/source/:sourceType/:sourceId", deleteSourceReminder);

module.exports = router;
