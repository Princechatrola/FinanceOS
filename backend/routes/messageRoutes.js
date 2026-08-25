// ============================================================
// FINANCEOS - MESSAGE ROUTES
// ============================================================

const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  getUserMessages,
} = require("../controllers/messageController");


// ============================================================
// AUTH REQUIREMENT
// ============================================================

router.use(authMiddleware);


// ============================================================
// ROUTES
// ============================================================

router.get("/", getUserMessages);

module.exports = router;
