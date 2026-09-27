// ============================================================
// FINANCEOS - REPORT ROUTES
// ============================================================

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getFinancialReport, getSavedMonths } = require("../controllers/reportController");

// GET /api/reports?duration=monthly&year=2026&month=9
router.get("/", authMiddleware, getFinancialReport);

// GET /api/reports/saved-months
router.get("/saved-months", authMiddleware, getSavedMonths);

module.exports = router;
