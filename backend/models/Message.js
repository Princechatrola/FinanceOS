// ============================================================
// FINANCEOS - MESSAGE MODEL
// ============================================================

const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
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
    recipient: {
      type: String,
      default: "All Users",
    },
    userId: {
      type: String,
      default: null,
    },
    recipientEmail: {
      type: String,
      default: null,
    },
    type: {
      type: String,
      enum: ["Personal", "Bulk"],
      required: true,
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
    cancelledAt: {
      type: Date,
      default: null,
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
