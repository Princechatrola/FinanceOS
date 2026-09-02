// ============================================================
// FINANCEOS - REPORT ROUTES
// ============================================================

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getFinancialReport } = require("../controllers/reportController");

// GET /api/reports?duration=monthly&year=2026&month=9
router.get("/", authMiddleware, getFinancialReport);

module.exports = router;
