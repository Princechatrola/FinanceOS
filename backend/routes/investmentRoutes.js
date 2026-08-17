// ============================================================
// FINANCEOS - INVESTMENT ROUTES
// ============================================================

const express = require("express");

const router = express.Router();

const authMiddleware =
  require("../middleware/authMiddleware");

const {
  addInvestment,
  getInvestments,
  getInvestment,
  updateInvestment,
  deleteInvestment,
  recordFDInterest,
  renewInvestment,
} = require("../controllers/investmentController");

// ============================================================
// INVESTMENT ROUTES
// ============================================================

// Add Investment
router.post(
  "/",
  authMiddleware,
  addInvestment
);

// Get All Investments
router.get(
  "/",
  authMiddleware,
  getInvestments
);

// Get Single Investment
router.get(
  "/:id",
  authMiddleware,
  getInvestment
);

// Update Investment
router.put(
  "/:id",
  authMiddleware,
  updateInvestment
);

// Delete Investment
router.delete(
  "/:id",
  authMiddleware,
  deleteInvestment
);

// Record FD Interest
router.post(
  "/:id/interest",
  authMiddleware,
  recordFDInterest
);

// Renew Investment
router.post(
  "/:id/renew",
  authMiddleware,
  renewInvestment
);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;