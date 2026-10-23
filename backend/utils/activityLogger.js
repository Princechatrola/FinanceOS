const mongoose = require("mongoose");
const Activity = require("../models/Activity");
const User = require("../models/User");

// ============================================================
// LOG ACTIVITY (Polymorphic: supports both object & positional args)
// ============================================================

const logActivity = async (param1, param2) => {
  try {
    let userId, userName, userEmail, type, description;

    if (param1 && typeof param1 === "object" && !param1._bsontype && !mongoose.Types.ObjectId.isValid(param1)) {
      ({ userId, userName, userEmail, type = "Other", description = "" } = param1);
    } else {
      userId = param1;
      description = typeof param2 === "string" ? param2 : "";
      type = "Other";
    }

    if (!userId) return null;

    if (!userName || !userEmail) {
      try {
        const u = await User.findById(userId).select("name email").lean();
        if (u) {
          userName = userName || u.name || "User";
          userEmail = userEmail || u.email || "";
        } else {
          userName = userName || "System User";
          userEmail = userEmail || "system@financeos.com";
        }
      } catch (_) {
        userName = userName || "User";
        userEmail = userEmail || "";
      }
    }

    const activity = await Activity.create({
      userId,
      userName: userName || "User",
      userEmail: userEmail || "user@financeos.com",
      type: type || "Other",
      description: description || "User action",
    });

    console.log("Activity logged:", {
      type: activity.type,
      userEmail: activity.userEmail,
      description: activity.description,
    });

    return activity;
  } catch (error) {
    console.error("Activity Logger Error:", error.message);
    return null;
  }
};

module.exports = {
  logActivity,
};