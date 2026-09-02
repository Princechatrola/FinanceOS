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
  updateGoalContribution,
  deleteGoalContribution,
  withdrawGoalFunds,
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

// Update Goal Contribution
router.put(
  "/:id/contribution/:contributionId",
  authMiddleware,
  updateGoalContribution
);

// Delete Goal Contribution
router.delete(
  "/:id/contribution/:contributionId",
  authMiddleware,
  deleteGoalContribution
);

// Withdraw Goal Funds
router.post(
  "/:id/withdraw",
  authMiddleware,
  withdrawGoalFunds
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