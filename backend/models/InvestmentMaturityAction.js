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
      type: mongoose.Schema.Types.ObjectId,
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
        "BANK_SAVINGS",
        "KEEP_CASH",
        "PURCHASE",
        "NEW_INVESTMENT",
        "PAY_LIABILITY",
        "OTHER",
        "RENEW_FULL",
        "RENEW_PARTIAL",
      ],
    },

    maturityAmount: {
      type: Number,
      required: true,
    },

    actionAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    remainingAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ============================================================
    // DESTINATION SPECIFIC DETAILS
    // ============================================================

    bankDetails: {
      bankName: { type: String, trim: true, default: "" },
      accountLast4: { type: String, trim: true, default: "" },
    },

    purchaseDetails: {
      itemName: { type: String, trim: true, default: "" },
      category: { type: String, trim: true, default: "" },
    },

    investmentDetails: {
      investmentType: { type: String, trim: true, default: "" },
      investmentName: { type: String, trim: true, default: "" },
      newInvestmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Investment",
        default: null,
      },
    },

    liabilityDetails: {
      liabilityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Liability",
        default: null,
      },
      liabilityName: { type: String, trim: true, default: "" },
      paymentId: { type: mongoose.Schema.Types.ObjectId, default: null },
    },

    cashDetails: {
      additionalIncomeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AdditionalIncome",
        default: null,
      },
    },

    otherDetails: {
      description: { type: String, trim: true, default: "" },
      category: { type: String, trim: true, default: "" },
    },

    note: {
      type: String,
      default: "",
      trim: true,
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