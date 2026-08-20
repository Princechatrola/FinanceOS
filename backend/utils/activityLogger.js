// ============================================================
// FINANCEOS - ACTIVITY LOGGER
// ============================================================

const Activity = require("../models/Activity");


// ============================================================
// LOG ACTIVITY
// ============================================================

const logActivity = async ({
  userId,
  userName,
  userEmail,
  type,
  description,
}) => {
  try {

    const activity = await Activity.create({
      userId,
      userName,
      userEmail,
      type,
      description,
    });

    console.log("Activity logged:", {
      type,
      userEmail,
      description,
    });

    return activity;

  } catch (error) {

    console.error(
      "Activity Logger Error:",
      error.message
    );

    // Don't break login/user operations
    // if activity logging fails.
    return null;
  }
};


module.exports = {
  logActivity,
};