// ============================================================
// FINANCEOS - USER MESSAGE ROUTES
// ============================================================

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const {
  getUserMessages,
  getUnreadCount,
  markMessageAsRead,
  markAllMessagesAsRead,
} = require("../controllers/messageController");

// Authentication required for all user message operations
router.use(authMiddleware);

// Get all messages for authenticated user
router.get("/", getUserMessages);

// Get unread count
router.get("/unread-count", getUnreadCount);

// Mark specific message as read
router.put("/:id/read", markMessageAsRead);

// Mark all user messages as read
router.put("/mark-all-read", markAllMessagesAsRead);

module.exports = router;
