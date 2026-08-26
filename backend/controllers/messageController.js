// ============================================================
// FINANCEOS - MESSAGE CONTROLLER
// ============================================================

const Message = require("../models/Message");

// ============================================================
// GET USER MESSAGES
// GET /api/messages
// ============================================================

const getUserMessages = async (req, res) => {
  try {
    const mongoId = String(req.user.id || req.user._id || "");
    const userCode = String(req.user.userId || "");
    const userEmail = String(req.user.email || "").toLowerCase();

    const User = require("../models/User");
    let user = null;
    if (mongoId && mongoId.match(/^[0-9a-fA-F]{24}$/)) {
      user = await User.findById(mongoId).lean();
    }
    if (!user && (userCode || userEmail)) {
      user = await User.findOne({
        $or: [
          ...(userCode ? [{ userId: userCode }] : []),
          ...(userEmail ? [{ email: userEmail }] : []),
        ],
      }).lean();
    }

    const identifiers = new Set();
    if (mongoId) identifiers.add(mongoId);
    if (userCode) identifiers.add(userCode);
    if (userEmail) identifiers.add(userEmail);
    if (user?._id) identifiers.add(String(user._id));
    if (user?.userId) identifiers.add(String(user.userId));
    if (user?.email) identifiers.add(String(user.email).toLowerCase());

    const idList = Array.from(identifiers);
    const emailsList = [userEmail, user?.email ? String(user.email).toLowerCase() : null].filter(Boolean);

    const messages = await Message.find({
      $or: [
        { type: "Bulk" },
        { recipient: "All Users" },
        { userId: { $in: idList } },
        { recipientEmail: { $in: emailsList } },
      ],
      channels: { $in: ["In-App", "in-app", "In-app"] },
      status: { $nin: ["Cancelled", "cancelled"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    const formattedMessages = messages.map((message) => {
      const scheduledAt =
        message.scheduledDate && message.scheduledTime
          ? `${message.scheduledDate}T${message.scheduledTime}`
          : null;

      return {
        id: `msg-${message._id}`,
        rawId: message._id,
        title: message.title,
        message: message.message,
        type: "in-app-message",
        source: "FinanceOS Admin",
        sourceId: message._id,
        createdAt: message.createdAt,
        scheduledAt,
        read: false,
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedMessages,
    });
  } catch (error) {
    console.error("Get user messages error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch messages.",
      error: error.message,
    });
  }
};

module.exports = {
  getUserMessages
};
