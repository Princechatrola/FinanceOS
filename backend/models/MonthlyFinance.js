// ============================================================
// FINANCEOS - MONTHLY FINANCE MODEL
// ============================================================

const mongoose = require("mongoose");

const monthlyFinanceSchema = new mongoose.Schema(
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

    // ========================================================
    // MONTHLY POSITION
    // ========================================================
    income: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    expenses: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    // ========================================================
    // GOAL ALLOCATIONS
    // ========================================================
    goalAllocations: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ========================================================
    // EXISTING CASH & SAVINGS
    // ========================================================
    cashBalance: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    // ========================================================
    // MONTHLY UPDATE
    // ========================================================
    updateDay: {
      type: Number,
      required: true,
      min: 1,
      max: 31,
      default: 1,
    },

    // ========================================================
    // REMINDER
    // ========================================================
    reminderEnabled: {
      type: Boolean,
      default: false,
    },

    // ========================================================
    // NOTIFICATION CHANNELS
    // ========================================================
    emailNotification: {
      type: Boolean,
      default: false,
    },

    smsNotification: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// ONE MONTHLY RECORD PER USER PER MONTH
// ============================================================
monthlyFinanceSchema.index(
  {
    user: 1,
    year: 1,
    month: 1,
  },
  {
    unique: true,
  }
);

// ============================================================
// MONTHLY SAVINGS
//
// Income - Expenses
// ============================================================
monthlyFinanceSchema.virtual("monthlySavings").get(function () {
  return Math.max(0, this.income - this.expenses);
});

// ============================================================
// AVAILABLE TO ALLOCATE
//
// Monthly Savings - Goal Allocations
// ============================================================
monthlyFinanceSchema.virtual("availableToAllocate").get(function () {
  return Math.max(0, this.monthlySavings - this.goalAllocations);
});

// ============================================================
// INCLUDE VIRTUAL FIELDS
// ============================================================
monthlyFinanceSchema.set("toJSON", { virtuals: true });
monthlyFinanceSchema.set("toObject", { virtuals: true });

// ============================================================
// MODEL
// ============================================================
const MonthlyFinance = mongoose.model("MonthlyFinance", monthlyFinanceSchema);

module.exports = MonthlyFinance;