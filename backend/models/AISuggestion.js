// ============================================================
// FINANCEOS - AI SUGGESTION MODEL
// Single Source of Truth for Gemini AI Recommendations
// ============================================================

const mongoose = require("mongoose");

const numericFactSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true },
    value: { type: mongoose.Schema.Types.Mixed },
    unit: { type: String, default: "" },
    source: { type: String, default: "" },
    asOf: { type: String, default: "" },
    status: { type: String, default: "Current / Verified" },
  },
  { _id: false }
);

const sourceSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true },
    url: { type: String, default: "" },
    sourceType: { type: String, default: "market-data" }, // market-data | web | maps | official
  },
  { _id: false }
);

const recommendationItemSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low", "high", "medium", "low"],
      default: "Medium",
    },
    decision: {
      type: String,
      enum: [
        "INVEST",
        "CONSIDER",
        "WAIT",
        "AVOID_FOR_NOW",
        "SAVE_FIRST",
        "DEBT_FIRST",
        "DIVERSIFY",
        "REVIEW_EXISTING",
        "HOLD_LIQUIDITY",
        "INCREASE_EXISTING",
        "REDUCE_CONCENTRATION",
      ],
      default: "CONSIDER",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      default: "",
      trim: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    suggestedAction: {
      type: String,
      default: "",
      trim: true,
    },
    suggestedAmount: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    relatedModule: {
      type: String,
      default: "General",
    },
    numericFacts: [numericFactSchema],
    sources: [sourceSchema],
  },
  { _id: false }
);

const actionStepSchema = new mongoose.Schema(
  {
    step: {
      type: Number,
      default: 1,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low", "High", "Medium", "Low"],
      default: "medium",
    },
    suggestedAmount: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

const aiSuggestionSchema = new mongoose.Schema(
  {
    // User reference
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Main recommendation headline & summary
    title: {
      type: String,
      required: true,
      trim: true,
    },

    summary: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      default: "Financial Strategy",
      trim: true,
    },

    overallHealth: {
      type: String,
      default: "Good",
      trim: true,
    },

    // Structured Recommendations
    recommendations: [recommendationItemSchema],

    // Comprehensive breakdown & action steps
    detailedAdvice: {
      type: String,
      default: "",
      trim: true,
    },

    keyObservations: [
      {
        type: String,
        trim: true,
      },
    ],

    actionSteps: [actionStepSchema],

    // Financial Position at time of analysis
    financialPosition: {
      availableToAllocate: { type: Number, default: 0 },
      netWorth: { type: Number, default: 0 },
      totalAssets: { type: Number, default: 0 },
      totalLiabilities: { type: Number, default: 0 },
    },

    // Normalized Financial Snapshot at time of generation
    financialSnapshot: {
      income: { type: Number, default: 0 },
      expenses: { type: Number, default: 0 },
      monthlySavings: { type: Number, default: 0 },
      savingsRate: { type: Number, default: 0 },
      totalCommitments: { type: Number, default: 0 },
      monthlyInvestmentCommitment: { type: Number, default: 0 },
      monthlyInsuranceCommitment: { type: Number, default: 0 },
      monthlyLiabilityCommitment: { type: Number, default: 0 },
      availableToAllocate: { type: Number, default: 0 },
      totalInvestments: { type: Number, default: 0 },
      totalLiabilities: { type: Number, default: 0 },
      totalInsurancePremiums: { type: Number, default: 0 },
      totalGoalSaved: { type: Number, default: 0 },
      netWorth: { type: Number, default: 0 },
      emergencyFundMonths: { type: Number, default: 0 },
      activeGoalsCount: { type: Number, default: 0 },
      maturedInvestmentsCount: { type: Number, default: 0 },
      activeSIPsCount: { type: Number, default: 0 },
      activeFDsCount: { type: Number, default: 0 },
    },

    // External real-time context
    externalContext: {
      goldPricePerGram24K: { type: Number, default: 7450 },
      goldPricePerGram22K: { type: Number, default: 6830 },
      rbiRepoRate: { type: String, default: "6.50%" },
      benchmarkFDRate: { type: String, default: "6.80% - 7.60%" },
      inflationRate: { type: String, default: "4.80%" },
      equityHistoricalCAGR: { type: String, default: "12.5%" },
      marketTrend: { type: String, default: "Stable interest rate environment; balanced equity growth" },
      source: { type: String, default: "RBI, NSE & India Bullion Market" },
      fetchedAt: { type: Date, default: Date.now },
      asOfFormatted: { type: String, default: "" },
    },

    // Context metadata
    promptContextType: {
      type: String,
      enum: ["plans_commitments", "dashboard_advisor", "maturity_action", "general"],
      default: "plans_commitments",
    },

    selectedMonth: {
      type: String,
      default: "",
    },

    targetItemName: {
      type: String,
      default: "",
      trim: true,
    },

    modelUsed: {
      type: String,
      default: "gemini-2.5-flash",
    },

    status: {
      type: String,
      enum: ["active", "archived"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

// Fast compound index for user's latest suggestions
aiSuggestionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model("AISuggestion", aiSuggestionSchema);
