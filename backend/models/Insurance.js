const mongoose = require("mongoose");

const premiumPaymentSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    dueDate: {
      type: Date,
    },
    paidDate: {
      type: Date,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["Paid", "Not Paid", "Skipped"],
      default: "Paid",
    },
    paymentSource: {
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
      enum: ["Life Insurance", "Health Insurance", "Vehicle Insurance", "Home Insurance", "Other Insurance"],
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
    endDate: {
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
      enum: ["Active", "Expired", "Matured", "Closed", "Cancelled", "Lapsed"],
      default: "Active",
    },
    notes: {
      type: String,
      default: "",
    },
    paymentSource: {
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

    // LIFE INSURANCE / LIC FIELDS
    nominee: {
      type: String,
      default: ""
    },
    maturityDetails: {
      hasMaturity: { type: Boolean, default: false },
      sumAssured: { type: Number, default: 0 },
      expectedMaturityAmount: { type: Number, default: 0 },
      actualMaturityAmount: { type: Number, default: 0 },
      actualMaturityDate: { type: Date },
      difference: { type: Number, default: 0 },
      receivedDestination: { type: String, default: "" },
      payoutAction: { type: String, default: "" },
      payoutActionReferenceId: { type: String, default: "" },
      note: { type: String, default: "" }
    },

    // HEALTH INSURANCE FIELDS
    healthDetails: {
      insuredMembers: [{ type: String }], // e.g. ["Self", "Spouse"]
      coverageCategory: [{ type: String }], // e.g. ["Hospitalization", "Accident"]
      hospitalCoverage: {
        government: { type: Boolean, default: false },
        private: { type: Boolean, default: false },
        network: { type: Boolean, default: false },
        cashless: { type: Boolean, default: false },
        reimbursement: { type: Boolean, default: false },
        details: { type: String, default: "" }
      },
      waitingPeriod: { type: Number, default: 0 } // in months
    },

    // VEHICLE INSURANCE FIELDS
    vehicleDetails: {
      vehicleType: { type: String, default: "" }, // Car, Bike, etc.
      registrationNumber: { type: String, default: "" },
      make: { type: String, default: "" },
      model: { type: String, default: "" },
      variant: { type: String, default: "" },
      purchaseDate: { type: Date },
      idv: { type: Number, default: 0 },
      coverageType: { type: String, default: "" }, // Comprehensive, Third-Party, etc.
      addons: [{ type: String }]
    },

    // HOME INSURANCE FIELDS
    homeDetails: {
      propertyType: { type: String, default: "" }, // House, Apartment, Flat, etc.
      propertyAddress: { type: String, default: "" },
      insuredPropertyValue: { type: Number, default: 0 },
      coveredItems: [{ type: String }], // Structure, Household Contents, Electronics, etc.
      electronicsItems: [
        {
          itemName: { type: String, default: "" },
          brand: { type: String, default: "" },
          model: { type: String, default: "" },
          purchaseDate: { type: Date },
          approxValue: { type: Number, default: 0 },
          coverageValue: { type: Number, default: 0 },
          note: { type: String, default: "" }
        }
      ]
    },

    // RELATIONSHIPS FOR RENEWAL
    renewedFromId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Insurance",
      default: null
    },
    renewedToId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Insurance",
      default: null
    },

    // FLEXIBLE METADATA AS BACKUP
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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
      premiumReminders: {
        fiveDaysBefore: { type: Boolean, default: false },
        oneDayBefore: { type: Boolean, default: true },
        onDueDate: { type: Boolean, default: true },
        channels: {
          inApp: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
          sms: { type: Boolean, default: false },
        }
      },
      expiryReminders: {
        twoMonthsBefore: { type: Boolean, default: false },
        oneMonthBefore: { type: Boolean, default: true },
        sevenDaysBefore: { type: Boolean, default: true },
        onExpiryDate: { type: Boolean, default: true },
        channels: {
          inApp: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
          sms: { type: Boolean, default: false },
        }
      },
      maturityReminders: {
        enabled: { type: Boolean, default: false },
        twoMonthsBefore: { type: Boolean, default: false },
        oneMonthBefore: { type: Boolean, default: true },
        onMaturityDate: { type: Boolean, default: true },
        channels: {
          inApp: { type: Boolean, default: true },
          email: { type: Boolean, default: true },
          sms: { type: Boolean, default: false },
        }
      }
    },
  },
  {
    timestamps: true,
  }
);

const Insurance = mongoose.model("Insurance", insuranceSchema);
module.exports = Insurance;
