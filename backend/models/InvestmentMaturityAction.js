// ============================================================
// FINANCEOS - INVESTMENT MATURITY ACTION MODEL
// ============================================================

const mongoose = require("mongoose");

const investmentMaturityActionSchema = new mongoose.Schema(
  {
    // ============================================================
    // USER
    // ============================================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ============================================================
    // ORIGINAL INVESTMENT
    // ============================================================

    investment: {
      type: Number,

      ref: "Investment",

      required: true,

      index: true,
    },

    // ============================================================
    // ACTION DETAILS
    // ============================================================

    actionType: {
      type: String,
      required: true,
      enum: [
        "RENEW_FULL",
        "RENEW_PARTIAL",
        "BANK_SAVINGS",
        "PURCHASE",
        "NEW_INVESTMENT",
        "PAY_LIABILITY",
        "KEEP_CASH",
      ],
    },

    maturityAmount: {
      type: Number,
      required: true,
    },

    actionAmount: {
      type: Number,
      required: true,
    },

    remainingAmount: {
      type: Number,
      default: 0,
    },

    // ============================================================
    // NEW INVESTMENT DETAILS
    // ============================================================

    newInvestmentId: {
      type: Number,

      ref: "Investment",

      default: null,
    },

    note: {
      type: String,
      default: "",
    },

    actionDate: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "InvestmentMaturityAction",
  investmentMaturityActionSchema
);