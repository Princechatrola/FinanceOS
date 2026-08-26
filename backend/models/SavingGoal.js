// ============================================================
// FINANCEOS - SAVING GOAL MODEL
// ============================================================

const mongoose = require("mongoose");

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
      required: true,
      min: 0,
    },

    startDate: {
      type: Date,
      required: true,
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

    reminder: {
      enabled: {
        type: Boolean,
        default: false,
      },
      contributionDay: {
        type: Number,
        default: 5,
      },
      notifyBefore: [{
        type: Number,
      }],
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
// VIRTUAL
// ============================================================

savingGoalSchema.virtual("remainingAmount").get(function () {
  return this.targetAmount - this.currentAmount;
});

savingGoalSchema.virtual("progressPercentage").get(function () {
  if (this.targetAmount === 0) return 0;

  return Math.min(
    100,
    Math.round((this.currentAmount / this.targetAmount) * 100)
  );
});

savingGoalSchema.set("toJSON", {
  virtuals: true,
});

savingGoalSchema.set("toObject", {
  virtuals: true,
});

module.exports = mongoose.model(
  "SavingGoal",
  savingGoalSchema
);