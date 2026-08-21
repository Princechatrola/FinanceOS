// ============================================================
// FINANCEOS - INVESTMENT MODEL
// ============================================================

const mongoose = require("mongoose");

// ============================================================
// INTEREST TRANSACTION SCHEMA
// ============================================================

const interestTransactionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    referenceId: {
      type: String,
      default: "",
    },
    note: {
      type: String,
      default: "",
    },
  },
  {
    _id: false,
  }
);

// ============================================================
// SIP CONTRIBUTION SCHEMA
// ============================================================

const sipContributionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    paidDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ["Paid", "Not Paid", "Skipped"],
      default: "Not Paid",
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: true,
  }
);

// ============================================================
// INVESTMENT SCHEMA
// ============================================================

const investmentSchema = new mongoose.Schema(
  {
    // --------------------------------------------------------
    // USER
    // --------------------------------------------------------
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // --------------------------------------------------------
    // BASIC DETAILS
    // --------------------------------------------------------
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: [
        "SIP",
        "Mutual Fund",
        "Fixed Deposit",
        "Recurring Deposit",
        "Gold",
        "Stocks",
        "Other",
      ],
    },
    amount: {
      type: Number,
      required: true,
    },
    contributionType: {
      type: String,
      enum: ["Recurring", "One Time"],
      default: "Recurring",
    },
    frequency: {
      type: String,
      default: null,
    },
    monthlyContribution: {
      type: Number,
      default: 0,
    },

    // --------------------------------------------------------
    // PAYMENT SOURCE
    // --------------------------------------------------------
    paymentSource: {
      type: String,
      enum: [
        "Bank Account",
        "UPI",
        "Cash",
        "Other",
      ],
      default: undefined,
    },
    paymentSourceDetails: {
      bankName: {
        type: String,
        default: "",
        trim: true,
      },
      accountLast4: {
        type: String,
        default: "",
        maxlength: 4,
      },
      upiId: {
        type: String,
        default: "",
        trim: true,
      },
      otherDetails: {
        type: String,
        default: "",
        trim: true,
      },
    },

    // --------------------------------------------------------
    // SIP AUTOPAY
    // --------------------------------------------------------
    autoPay: {
      enabled: {
        type: Boolean,
        default: false,
      },
      status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Inactive",
      },
      paymentMethod: {
        type: String,
        enum: ["Bank Account", "UPI"],
        default: null,
      },
      bankName: {
        type: String,
        default: "",
        trim: true,
      },
      accountLast4: {
        type: String,
        default: "",
        maxlength: 4,
      },
      upiApp: {
        type: String,
        default: "",
        trim: true,
      },
      upiId: {
        type: String,
        default: "",
        trim: true,
      },
    },

    // --------------------------------------------------------
    // SIP CONTRIBUTION HISTORY
    // --------------------------------------------------------
    sipContributions: {
      type: [sipContributionSchema],
      default: [],
    },

    startDate: Date,
    nextContributionDate: Date,
    maturityDate: Date,
    status: {
      type: String,
      default: "Active",
    },

    // --------------------------------------------------------
    // CURRENT VALUE
    // --------------------------------------------------------
    currentValue: {
      type: Number,
      default: 0,
    },

    // --------------------------------------------------------
    // MATURITY / ACTUAL RETURN
    // --------------------------------------------------------
    totalContributions: {
      type: Number,
      default: 0,
    },
    actualMaturityValue: {
      type: Number,
      default: 0,
    },
    maturityGain: {
      type: Number,
      default: 0,
    },
    maturityRecordedAt: {
      type: Date,
      default: null,
    },

    // --------------------------------------------------------
    // FIXED DEPOSIT
    // --------------------------------------------------------
    institution: {
      type: String,
      default: "",
    },
    principalAmount: {
      type: Number,
      default: 0,
    },
    interestRate: {
      type: Number,
      default: 0,
    },
    interestMethod: {
      type: String,
      enum: ["Payout", "Cumulative"],
      default: undefined,
    },
    interestPayoutFrequency: {
      type: String,
      default: null,
    },
    compoundingFrequency: {
      type: String,
      default: null,
    },
    estimatedInterest: {
      type: Number,
      default: 0,
    },
    estimatedAnnualInterest: {
      type: Number,
      default: 0,
    },
    estimatedInterestPerPayout: {
      type: Number,
      default: 0,
    },
    estimatedMaturityAmount: {
      type: Number,
      default: 0,
    },
    totalInterestReceived: {
      type: Number,
      default: 0,
    },
    interestTransactions: [interestTransactionSchema],

    // --------------------------------------------------------
    // RENEWAL RELATIONSHIP
    // --------------------------------------------------------
    renewedFromId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Investment",
      default: null,
    },
    renewedToId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Investment",
      default: null,
    },

    // --------------------------------------------------------
    // RENEWAL INFORMATION
    // --------------------------------------------------------
    renewalCount: {
      type: Number,
      default: 0,
    },
    renewedAt: {
      type: Date,
      default: null,
    },
    maturedAt: {
      type: Date,
      default: null,
    },
    closedAt: {
      type: Date,
      default: null,
    },

    // --------------------------------------------------------
    // REMINDERS
    // --------------------------------------------------------
    reminder: {
      enabled: Boolean,
      contributionDay: Number,
      notifyBefore: [Number],
      channels: {
        inApp: Boolean,
        email: Boolean,
        sms: Boolean,
      },
    },
    maturityReminder: {
      enabled: Boolean,
      notifyBeforeMonths: [Number],
      notifyBeforeDays: [Number],
      onMaturityDate: Boolean,
      channels: {
        inApp: Boolean,
        email: Boolean,
        sms: Boolean,
      },
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// EXPORT MODEL
// ============================================================

module.exports = mongoose.model("Investment", investmentSchema);