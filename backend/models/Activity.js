// ============================================================
// FINANCEOS - ACTIVITY MODEL
// ============================================================

const mongoose = require("mongoose");

const activitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    userName: {
      type: String,
      required: true,
    },

    userEmail: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      required: true,
      enum: [
        "Registration",
        "Sign In",
        "Account",
        "Report",
        "Settings",
        "Other",
      ],
    },

    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Activity", activitySchema);