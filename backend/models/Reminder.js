// ============================================================
// FINANCEOS - REMINDER MODEL
// ============================================================

const mongoose = require("mongoose");

const reminderSchema = new mongoose.Schema(
  {
    // ----------------------------------------------------------
    // USER
    // ----------------------------------------------------------

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    userCode: {
      type: String,
      default: "",
    },

    userName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    // ----------------------------------------------------------
    // REMINDER
    // ----------------------------------------------------------

    reminderType: {
      type: String,
      enum: [
        "Payment",
        "Investment",
        "Maturity",
        "Goal",
        "Insurance",
        "General",
      ],
      required: true,
    },

    category: {
      type: String,
      enum: [
        "Liability",
        "Investment",
        "Insurance",
        "Saving Goal",
        "General",
      ],
      required: true,
    },

    itemName: {
      type: String,
      required: true,
    },

    // ----------------------------------------------------------
    // DUE DATE
    // ----------------------------------------------------------

    dueDate: {
      type: Date,
      required: true,
    },

    // Example:
    // 5 days before
    // 1 day before
    // On due date
    // 1 month before

    rule: {
      type: String,
      required: true,
    },

    scheduledDate: {
      type: Date,
      required: true,
    },

    scheduledTime: {
      type: String,
      default: "09:00",
    },

    // ----------------------------------------------------------
    // LINK TO FINANCIAL SOURCE / PLAN
    // ----------------------------------------------------------

    sourceType: {
      type: String,
      enum: [
        "Investment",
        "Insurance",
        "Liability",
        "SavingGoal",
        "General",
        "MonthlyFinance",
      ],
      default: "General",
      index: true,
    },

    sourceId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true,
    },

    referenceId: {
      type: String,
      default: "",
    },

    amount: {
      type: Number,
      default: 0,
    },

    enabled: {
      type: Boolean,
      default: true,
      index: true,
    },

    frequency: {
      type: String,
      enum: ["Once", "Daily", "Weekly", "Monthly", "Quarterly", "Yearly"],
      default: "Monthly",
    },

    notifyBefore: {
      type: [Number],
      default: [0],
    },

    // ----------------------------------------------------------
    // DELIVERY
    // ----------------------------------------------------------

    channel: {
      type: String,
      default: "In-App",
    },

    channels: {
      inApp: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: true,
      },
      sms: {
        type: Boolean,
        default: false,
      },
    },

    status: {
      type: String,
      enum: [
        "Scheduled",
        "Sent",
        "Failed",
        "Completed",
        "Disabled",
        "Active",
      ],
      default: "Scheduled",
    },

    read: {
      type: Boolean,
      default: false,
      index: true,
    },

    readAt: {
      type: Date,
      default: null,
    },

    sentAt: {
      type: Date,
      default: null,
    },

    failureReason: {
      type: String,
      default: null,
    },

    // ----------------------------------------------------------
    // MESSAGE
    // ----------------------------------------------------------

    message: {
      type: String,
      default: "",
    },

    // ----------------------------------------------------------
    // RETRY
    // ----------------------------------------------------------

    retryCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);


// ============================================================
// INDEXES
// ============================================================

reminderSchema.index({
  userId: 1,
});

reminderSchema.index({
  userId: 1,
  sourceType: 1,
  sourceId: 1,
});

reminderSchema.index({
  status: 1,
});

reminderSchema.index({
  scheduledDate: 1,
});

reminderSchema.index({
  userId: 1,
  scheduledDate: 1,
});

reminderSchema.index({
  userId: 1,
  enabled: 1,
});

reminderSchema.index({
  channel: 1,
});

reminderSchema.index({
  reminderType: 1,
});


// ============================================================
// EXPORT
// ============================================================

module.exports = mongoose.model(
  "Reminder",
  reminderSchema
);