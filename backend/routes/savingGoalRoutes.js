// ============================================================
// FINANCEOS - SAVING GOAL ROUTES
// ============================================================

const express = require("express");

const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");

const {
  addSavingGoal,
  getSavingGoals,
  getSavingGoal,
  updateSavingGoal,
  deleteSavingGoal,
  addGoalContribution,
} = require("../controllers/savingGoalController");

// ============================================================
// ROUTES
// ============================================================

// Create Saving Goal
router.post(
  "/",
  authMiddleware,
  addSavingGoal
);

// Get All Saving Goals
router.get(
  "/",
  authMiddleware,
  getSavingGoals
);

// Get Single Saving Goal
router.get(
  "/:id",
  authMiddleware,
  getSavingGoal
);

// Update Saving Goal
router.put(
  "/:id",
  authMiddleware,
  updateSavingGoal
);

// Record Goal Contribution
router.post(
  "/:id/contribution",
  authMiddleware,
  addGoalContribution
);

// Delete Saving Goal
router.delete(
  "/:id",
  authMiddleware,
  deleteSavingGoal
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;