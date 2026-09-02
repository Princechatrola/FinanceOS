// ============================================================
// FINANCEOS - AI ADVISER CONTROLLER
// Controller handling AI suggestion generation and retrieval
// ============================================================

const aiAdviserService = require("../services/aiAdviserService");
const Activity = require("../models/Activity");
const User = require("../models/User");

// Helper to log user activities safely
const logActivity = async (userId, description) => {
  try {
    const user = await User.findById(userId);
    await Activity.create({
      userId,
      userName: user ? user.name : "User",
      userEmail: user ? user.email : "user@financeos.com",
      type: "Other",
      description,
    });
  } catch (error) {
    console.error("Failed to log activity:", error.message);
  }
};

// ============================================================
// GENERATE AI SUGGESTION
// POST /api/ai/generate
// ============================================================

const generateSuggestion = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
    }

    const { context = "plans_commitments", targetItem = null, selectedMonth = "" } = req.body || {};

    const suggestion = await aiAdviserService.generateUserRecommendation(userId, {
      context,
      targetItem,
      selectedMonth,
    });

    await logActivity(
      userId,
      `Generated AI Financial Recommendation: "${suggestion.title}"`
    );

    return res.status(200).json({
      success: true,
      message: "AI recommendation generated and saved successfully.",
      data: suggestion,
    });
  } catch (error) {
    console.error("Generate AI Suggestion Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate AI recommendation.",
    });
  }
};

// ============================================================
// GET LATEST SAVED AI SUGGESTION
// GET /api/ai/latest
// (Does NOT trigger Gemini API - only reads from MongoDB)
// ============================================================

const getLatestSuggestion = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
    }

    const suggestion = await aiAdviserService.getLatestUserRecommendation(userId);

    return res.status(200).json({
      success: true,
      data: suggestion || null,
    });
  } catch (error) {
    console.error("Get Latest AI Suggestion Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch latest AI recommendation.",
    });
  }
};

// ============================================================
// GET AI SUGGESTION HISTORY
// GET /api/ai/history
// ============================================================

const getSuggestionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required.",
      });
    }

    const limit = Math.min(Number(req.query.limit) || 10, 50);
    const history = await aiAdviserService.getUserRecommendationHistory(userId, limit);

    return res.status(200).json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error("Get AI History Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch recommendation history.",
    });
  }
};

module.exports = {
  generateSuggestion,
  getLatestSuggestion,
  getSuggestionHistory,
};
