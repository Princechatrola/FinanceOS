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
    // DELIVERY
    // ----------------------------------------------------------

    channel: {
      type: String,
      enum: [
        "Email",
        "SMS",
        "In-App",
      ],
      required: true,
    },

    status: {
      type: String,
      enum: [
        "Scheduled",
        "Sent",
        "Failed",
      ],
      default: "Scheduled",
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
  status: 1,
});

reminderSchema.index({
  scheduledDate: 1,
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