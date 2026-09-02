// ============================================================
// FINANCEOS - SAVING GOAL MODEL
// ============================================================

const mongoose = require("mongoose");

// ============================================================
// CONTRIBUTION SUB-SCHEMA
// ============================================================

const contributionSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      default: "Monthly Savings",
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
    paymentDetails: {
      paymentMethod: { type: String, default: "" },
      upiApp: { type: String, default: "" },
      upiId: { type: String, default: "" },
      bankName: { type: String, default: "" },
      lastFour: { type: String, default: "" },
    },
    fundLocation: {
      type: { type: String, default: "" },
      institution: { type: String, default: "" },
      label: { type: String, default: "" },
      lastFour: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// WITHDRAWAL SUB-SCHEMA
// ============================================================

const withdrawalSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    purpose: {
      type: String,
      default: "",
      trim: true,
    },
    note: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// MAIN SAVING GOAL SCHEMA
// ============================================================

const savingGoalSchema = new mongoose.Schema(
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
    // GOAL DETAILS
    // ========================================================

    goalName: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      required: true,
      enum: [
        "Emergency Fund",
        "Mobile",
        "Laptop",
        "Vehicle",
        "Home",
        "Education",
        "Travel",
        "Wedding",
        "Investment",
        "Other",
      ],
      default: "Other",
    },

    targetAmount: {
      type: Number,
      required: true,
      min: 1,
    },

    alreadySaved: {
      type: Number,
      default: 0,
      min: 0,
    },

    currentAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    monthlyContribution: {
      type: Number,
      default: 0,
      min: 0,
    },

    // --------------------------------------------------------
    // RECURRING CONTRIBUTION DAY (1-31)
    // The day of the month when goal contributions are due.
    // Configured once when the goal is created.
    // --------------------------------------------------------
    contributionDay: {
      type: Number,
      min: 1,
      max: 31,
      default: null,
    },

    // --------------------------------------------------------
    // CONTRIBUTION FREQUENCY
    // --------------------------------------------------------
    contributionFrequency: {
      type: String,
      enum: ["Monthly", "Quarterly", "Half-Yearly", "Yearly"],
      default: "Monthly",
    },

    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },

    targetDate: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: [
        "Active",
        "Paused",
        "Completed",
        "Closed",
        "Cancelled",
      ],
      default: "Active",
    },

    notes: {
      type: String,
      default: "",
      trim: true,
    },

    fundLocation: {
      type: { type: String, default: "" },
      institution: { type: String, default: "" },
      label: { type: String, default: "" },
      lastFour: { type: String, default: "" },
    },

    initialContributionDate: {
      type: Date,
    },

    initialContributionSource: {
      type: String,
      default: "Existing Savings",
    },

    contributions: [contributionSchema],

    withdrawals: [withdrawalSchema],

    reminder: {
      enabled: {
        type: Boolean,
        default: false,
      },
      contributionDay: {
        type: Number,
        default: 5,
      },
      notifyBefore: [
        {
          type: Number,
        },
      ],
      channels: {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
      },
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================
// VIRTUALS
// ============================================================

savingGoalSchema.virtual("totalContributed").get(function () {
  if (Array.isArray(this.contributions) && this.contributions.length > 0) {
    return this.contributions.reduce((sum, c) => sum + (c.amount || 0), 0);
  }
  return this.currentAmount || this.alreadySaved || 0;
});

savingGoalSchema.virtual("totalWithdrawn").get(function () {
  if (Array.isArray(this.withdrawals) && this.withdrawals.length > 0) {
    return this.withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
  }
  return 0;
});

savingGoalSchema.virtual("availableGoalFund").get(function () {
  const contributed = this.totalContributed || this.currentAmount || 0;
  const withdrawn = this.totalWithdrawn || 0;
  return Math.max(0, contributed - withdrawn);
});

savingGoalSchema.virtual("remainingAmount").get(function () {
  const contributed = this.totalContributed || this.currentAmount || 0;
  return Math.max(0, (this.targetAmount || 0) - contributed);
});

savingGoalSchema.virtual("progressPercentage").get(function () {
  if (!this.targetAmount || this.targetAmount <= 0) return 0;
  const contributed = this.totalContributed || this.currentAmount || 0;
  return Math.min(100, Math.round((contributed / this.targetAmount) * 100));
});

// Format transactions for frontend backward compatibility
savingGoalSchema.virtual("transactions").get(function () {
  const txs = [];
  if (Array.isArray(this.contributions)) {
    this.contributions.forEach((c) => {
      txs.push({
        id: c._id ? String(c._id) : undefined,
        _id: c._id,
        type: "contribution",
        amount: c.amount,
        date: c.date ? c.date.toISOString().slice(0, 10) : "",
        source: c.source || "Monthly Savings",
        note: c.note || "",
        paymentDetails: c.paymentDetails,
        fundLocation: c.fundLocation,
        createdAt: c.createdAt,
      });
    });
  }
  if (Array.isArray(this.withdrawals)) {
    this.withdrawals.forEach((w) => {
      txs.push({
        id: w._id ? String(w._id) : undefined,
        _id: w._id,
        type: "withdrawal",
        amount: w.amount,
        date: w.date ? w.date.toISOString().slice(0, 10) : "",
        purpose: w.purpose || "",
        note: w.note || "",
        createdAt: w.createdAt,
      });
    });
  }
  return txs.sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
});

savingGoalSchema.set("toJSON", {
  virtuals: true,
});

savingGoalSchema.set("toObject", {
  virtuals: true,
});

module.exports = mongoose.model("SavingGoal", savingGoalSchema);