const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
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

const liabilitySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "Personal Loan",
        "Home Loan",
        "Vehicle Loan",
        "Credit Card",
        "Other Liability",
      ],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    principalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    remainingAmount: {
      type: Number,
      default: 0,
    },
    monthlyEMI: {
      type: Number,
      default: 0,
    },
    interestRate: {
      type: Number,
      default: 0,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    nextDueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["Active", "Closed"],
      default: "Active",
    },
    payments: {
      type: [paymentSchema],
      default: [],
    },
    lender: {
      type: String,
      trim: true,
    },
    accountLast4: {
      type: String,
      trim: true,
      maxLength: 4,
    },
    reminder: {
      enabled: {
        type: Boolean,
        default: false,
      },
      daysBefore: {
        type: Number,
        default: 3,
      },
    },
  },
  {
    timestamps: true,
  }
);

const Liability = mongoose.model("Liability", liabilitySchema);
module.exports = Liability;
