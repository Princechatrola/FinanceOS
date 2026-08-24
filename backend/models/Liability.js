const mongoose = require("mongoose");

const paymentSourceSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      enum: ["Cash", "UPI", "Bank Account", "Other"],
      default: "Cash"
    },
    bankName: { type: String, default: "" },
    last4Digits: { type: String, default: "" },
    upiApp: { type: String, default: "" },
    upiId: { type: String, default: "" },
    otherDetails: { type: String, default: "" }
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date
    },
    paidDate: {
      type: Date
    },
    date: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ["Paid", "Not Paid", "Partially Paid", "Overdue"],
      default: "Paid",
    },
    type: {
      type: String,
      enum: ["EMI", "Prepayment", "Closure"],
      default: "EMI"
    },
    principalComponent: {
      type: Number,
      default: 0
    },
    interestComponent: {
      type: Number,
      default: 0
    },
    paymentSource: {
      type: paymentSourceSchema,
      default: () => ({ method: "Cash" })
    },
    note: {
      type: String,
      default: "",
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
        "Education Loan",
        "Credit Card",
        "Gold Loan",
        "Business Loan",
        "Other Liability",
      ],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    lender: {
      type: String,
      default: "",
      trim: true,
    },
    referenceNumber: {
      type: String,
      default: "",
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
    interestType: {
      type: String,
      default: "Fixed" // Fixed, Reducing, etc.
    },
    startDate: {
      type: Date,
    },
    tenure: {
      type: Number, // in months
      default: 0
    },
    endDate: {
      type: Date,
    },
    nextDueDate: {
      type: Date,
    },
    paymentFrequency: {
      type: String,
      default: "Monthly"
    },
    paymentSource: {
      type: paymentSourceSchema,
      default: () => ({ method: "Cash" })
    },
    status: {
      type: String,
      enum: ["Active", "Paused", "Overdue", "Completed", "Closed"],
      default: "Active",
    },
    payments: {
      type: [paymentSchema],
      default: [],
    },
    notes: {
      type: String,
      default: "",
    },
    
    // Type-specific sub-schemas
    homeDetails: {
      propertyType: { type: String, default: "" }, // House, Apartment, Flat, Villa, Other
      propertyAddress: { type: String, default: "" },
      downPayment: { type: Number, default: 0 }
    },
    vehicleDetails: {
      vehicleType: { type: String, default: "" }, // Car, Bike, Commercial Vehicle, Other
      make: { type: String, default: "" },
      model: { type: String, default: "" },
      variant: { type: String, default: "" },
      registrationNumber: { type: String, default: "" }
    },
    educationDetails: {
      courseName: { type: String, default: "" },
      educationalInstitution: { type: String, default: "" },
      moratoriumPeriod: { type: Number, default: 0 }, // in months
      repaymentStartDate: { type: Date }
    },
    creditCardDetails: {
      creditLimit: { type: Number, default: 0 },
      minimumDue: { type: Number, default: 0 },
      totalDue: { type: Number, default: 0 },
      statementDate: { type: Date }
    },
    goldDetails: {
      goldDescription: { type: String, default: "" },
      pledgedGoldWeight: { type: Number, default: 0 } // in grams
    },
    businessDetails: {
      businessName: { type: String, default: "" }
    },
    otherDetails: {
      category: { type: String, default: "" },
      description: { type: String, default: "" }
    },

    closureDetails: {
      closureDate: { type: Date },
      amountPaid: { type: Number, default: 0 },
      outstandingAtClosure: { type: Number, default: 0 },
      penaltyCharges: { type: Number, default: 0 },
      note: { type: String, default: "" }
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
      channels: {
        inApp: { type: Boolean, default: true },
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false }
      }
    },
  },
  {
    timestamps: true,
  }
);

const Liability = mongoose.model("Liability", liabilitySchema);
module.exports = Liability;
