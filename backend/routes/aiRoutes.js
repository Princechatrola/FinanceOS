// ============================================================
// FINANCEOS - AI ADVISER ROUTES
// ============================================================

const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const aiAdviserController = require("../controllers/aiAdviserController");

// Generate new recommendation using Gemini + live MongoDB financial data
router.post("/generate", authMiddleware, aiAdviserController.generateSuggestion);

// Get latest persisted recommendation from MongoDB (fast, no Gemini API call)
router.get("/latest", authMiddleware, aiAdviserController.getLatestSuggestion);

// Get past recommendation history
router.get("/history", authMiddleware, aiAdviserController.getSuggestionHistory);

module.exports = router;
