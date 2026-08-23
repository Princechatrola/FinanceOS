const mongoose = require("mongoose");

const premiumPaymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["Paid", "Not Paid", "Skipped"],
      default: "Paid",
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const insuranceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["Life Insurance", "Health Insurance", "Vehicle Insurance", "Other Insurance"],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    policyNumber: {
      type: String,
      trim: true,
      default: "",
    },
    provider: {
      type: String,
      trim: true,
      default: "",
    },
    coverageAmount: {
      type: Number,
      default: 0,
    },
    premiumAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    premiumFrequency: {
      type: String,
      enum: ["Monthly", "Quarterly", "Half-Yearly", "Yearly", "One Time"],
      default: "Yearly",
    },
    startDate: {
      type: Date,
    },
    renewalDate: {
      type: Date,
    },
    maturityDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Active", "Matured", "Closed", "Lapsed"],
      default: "Active",
    },
    payments: {
      type: [premiumPaymentSchema],
      default: [],
    },
    reminder: {
      enabled: {
        type: Boolean,
        default: false,
      },
      daysBefore: {
        type: Number,
        default: 7,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Insurance = mongoose.model("Insurance", insuranceSchema);
module.exports = Insurance;
