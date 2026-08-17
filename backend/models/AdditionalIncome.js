// ============================================================
// FINANCEOS - ADDITIONAL INCOME MODEL
// ============================================================

const mongoose = require("mongoose");

const additionalIncomeSchema = new mongoose.Schema(
  {
    // ========================================================
    // USER
    // ========================================================

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ========================================================
    // INCOME DETAILS
    // ========================================================

    title: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Salary Bonus",
        "Freelancing",
        "Business Income",
        "Rental Income",
        "FD Interest",
        "Dividend",
        "Cashback",
        "Gift",
        "Other",
      ],
    },

    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    // ========================================================
    // FINANCIAL PERIOD
    // ========================================================

    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },

    year: {
      type: Number,
      required: true,
      min: 2000,
      max: 2100,
    },

    receivedDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// MODEL
// ============================================================

module.exports = mongoose.model(
  "AdditionalIncome",
  additionalIncomeSchema
);