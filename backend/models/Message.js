// ============================================================
// FINANCEOS - MESSAGE MODEL
// ============================================================

const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    recipientUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    userId: {
      type: String,
      default: null,
      index: true,
    },
    recipient: {
      type: String,
      default: "FinanceOS User",
    },
    recipientEmail: {
      type: String,
      default: null,
      index: true,
    },
    senderAdmin: {
      type: String,
      default: "Super Admin",
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    templateTitle: {
      type: String,
      default: "",
    },
    templateMessage: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      enum: [
        "General",
        "Investment",
        "SIP",
        "FD",
        "RD",
        "Mutual Fund",
        "Gold",
        "Stocks",
        "Insurance",
        "Liability",
        "Saving Goal",
        "Bank / Payment",
        "UPI",
        "Reminder",
        "Other",
      ],
      default: "General",
    },
    priority: {
      type: String,
      enum: ["Normal", "Important", "Urgent"],
      default: "Normal",
    },
    type: {
      type: String,
      enum: ["Personal", "Multiple", "Bulk", "Conditional"],
      default: "Personal",
    },
    condition: {
      type: String,
      default: null,
    },
    channels: {
      type: [String],
      required: true,
      default: ["In-App"],
    },
    deliveryStatus: {
      type: Map,
      of: String,
      default: {},
    },
    status: {
      type: String,
      enum: ["Scheduled", "Sent", "Failed", "Partially Delivered", "Cancelled"],
      default: "Sent",
      index: true,
    },
    createdBy: {
      type: String,
      default: "Super Admin",
    },
    scheduledDate: {
      type: String,
      default: null,
    },
    scheduledTime: {
      type: String,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
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
    metadata: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Map _id to id
messageSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Message", messageSchema);
