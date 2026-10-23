// ============================================================
// FINANCEOS - ADDITIONAL INCOME ROUTES
// ============================================================

const express = require("express");

const {
  addAdditionalIncome,
  getAdditionalIncome,
  updateAdditionalIncome,
  deleteAdditionalIncome,
} = require("../controllers/additionalIncomeController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// ============================================================
// ROUTES
// ============================================================

// Add Additional Income
router.post("/", authMiddleware, addAdditionalIncome);

// Get All Additional Income
router.get("/", authMiddleware, getAdditionalIncome);

// Update Additional Income
router.put("/:id", authMiddleware, updateAdditionalIncome);

// Delete Additional Income
router.delete("/:id", authMiddleware, deleteAdditionalIncome);

// ============================================================
// EXPORT
// ============================================================

module.exports = router;