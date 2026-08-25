// ============================================================
// FINANCEOS - USER REMINDER ROUTES
// ============================================================

const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getUserReminders,
  createUserReminder,
  deleteUserReminder,
} = require("../controllers/userReminderController");


// ============================================================
// AUTH REQUIREMENT
// ============================================================

router.use(authMiddleware);


// ============================================================
// ROUTES
// ============================================================

router.get("/", getUserReminders);
router.post("/", createUserReminder);
router.delete("/:id", deleteUserReminder);


module.exports = router;
