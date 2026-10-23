// ============================================================
// FINANCEOS - USER MESSAGE CONTROLLER
// Personalized In-App Message Center for Authenticated Users
// ============================================================

const mongoose = require("mongoose");
const Message = require("../models/Message");
const User = require("../models/User");
const { processScheduledMessages, parseScheduledDateTime } = require("../utils/schedulerService");

// Helper to resolve user identifiers
async function getUserIdentifiers(reqUser) {
  const mongoId = String(reqUser.id || reqUser._id || "");
  const userCode = String(reqUser.userId || "");
  const userEmail = String(reqUser.email || "").toLowerCase();

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

  const idSet = new Set();
  const objIdSet = [];

  if (mongoId) {
    idSet.add(mongoId);
    if (mongoose.Types.ObjectId.isValid(mongoId)) {
      objIdSet.push(new mongoose.Types.ObjectId(mongoId));
    }
  }
  if (userCode) idSet.add(userCode);
  if (userEmail) idSet.add(userEmail);

  if (user) {
    if (user._id) {
      idSet.add(String(user._id));
      objIdSet.push(user._id);
    }
    if (user.userId) idSet.add(String(user.userId));
    if (user.email) idSet.add(String(user.email).toLowerCase());
  }

  const emailsList = [userEmail, user?.email ? String(user.email).toLowerCase() : null].filter(Boolean);

  return {
    user,
    idList: Array.from(idSet),
    objIdList: objIdSet,
    emailsList,
  };
}

// Helper to build query for user messages
function buildUserMessageQuery(userTokens) {
  return {
    $or: [
      { type: "Bulk" },
      { recipient: "All Users" },
      { recipientUser: { $in: userTokens.objIdList } },
      { userId: { $in: userTokens.idList } },
      { recipientEmail: { $in: userTokens.emailsList } },
    ],
    channels: { $in: ["In-App", "in-app", "In-app"] },
    status: { $nin: ["Cancelled", "cancelled"] },
  };
}

// ============================================================
// GET USER MESSAGES
// GET /api/messages
// ============================================================

const getUserMessages = async (req, res) => {
  try {
    const userTokens = await getUserIdentifiers(req.user);

    // Process any scheduled messages that have reached their due time
    await processScheduledMessages();

    const query = buildUserMessageQuery(userTokens);
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .lean();

    const now = new Date();

    // Filter out messages scheduled for the future
    const activeMessages = messages.filter((msg) => {
      if (msg.status === "Scheduled" && msg.scheduledDate) {
        const scheduledTime = parseScheduledDateTime(msg.scheduledDate, msg.scheduledTime);
        if (scheduledTime && now < scheduledTime) {
          return false;
        }
      }
      return true;
    });

    const formattedMessages = activeMessages.map((message) => {
      const scheduledAt =
        message.scheduledDate && message.scheduledTime
          ? `${message.scheduledDate}T${message.scheduledTime}`
          : null;

      return {
        id: `msg-${message._id}`,
        rawId: String(message._id),
        title: message.title,
        message: message.message,
        category: message.category || "General",
        priority: message.priority || "Normal",
        type: "in-app-message",
        source: message.senderAdmin || "FinanceOS Admin",
        sourceId: String(message._id),
        createdAt: message.createdAt,
        scheduledAt,
        read: Boolean(message.read),
        readAt: message.readAt || null,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedMessages.length,
      unreadCount: formattedMessages.filter((m) => !m.read).length,
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

// ============================================================
// GET UNREAD COUNT
// GET /api/messages/unread-count
// ============================================================

const getUnreadCount = async (req, res) => {
  try {
    const userTokens = await getUserIdentifiers(req.user);
    const query = {
      ...buildUserMessageQuery(userTokens),
      read: { $ne: true },
    };

    const messages = await Message.find(query).lean();
    const now = new Date();
    const activeUnread = messages.filter((msg) => {
      if (msg.status === "Scheduled" && msg.scheduledDate) {
        const scheduledTime = parseScheduledDateTime(msg.scheduledDate, msg.scheduledTime);
        if (scheduledTime && now < scheduledTime) return false;
      }
      return true;
    });

    return res.status(200).json({
      success: true,
      unreadCount: activeUnread.length,
    });
  } catch (error) {
    console.error("Get unread count error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get unread count.",
      error: error.message,
    });
  }
};

// ============================================================
// MARK MESSAGE AS READ
// PUT /api/messages/:id/read
// ============================================================

const markMessageAsRead = async (req, res) => {
  try {
    const rawId = req.params.id.replace(/^msg-/, "");
    const userTokens = await getUserIdentifiers(req.user);

    if (!mongoose.Types.ObjectId.isValid(rawId)) {
      return res.status(400).json({ success: false, message: "Invalid message ID format." });
    }

    const message = await Message.findById(rawId);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found." });
    }

    // Verify ownership
    const isOwner =
      message.type === "Bulk" ||
      message.recipient === "All Users" ||
      (message.recipientUser && userTokens.objIdList.some((id) => id.equals(message.recipientUser))) ||
      (message.userId && userTokens.idList.includes(message.userId)) ||
      (message.recipientEmail && userTokens.emailsList.includes(message.recipientEmail.toLowerCase()));

    if (!isOwner) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    message.read = true;
    message.readAt = new Date();
    await message.save();

    return res.status(200).json({
      success: true,
      message: "Message marked as read.",
      data: {
        id: `msg-${message._id}`,
        read: true,
        readAt: message.readAt,
      },
    });
  } catch (error) {
    console.error("Mark message read error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark message as read.",
      error: error.message,
    });
  }
};

// ============================================================
// MARK ALL AS READ
// PUT /api/messages/mark-all-read
// ============================================================

const markAllMessagesAsRead = async (req, res) => {
  try {
    const userTokens = await getUserIdentifiers(req.user);
    const query = {
      ...buildUserMessageQuery(userTokens),
      read: { $ne: true },
    };

    const updateResult = await Message.updateMany(query, {
      $set: {
        read: true,
        readAt: new Date(),
      },
    });

    return res.status(200).json({
      success: true,
      message: "All messages marked as read.",
      modifiedCount: updateResult.modifiedCount,
    });
  } catch (error) {
    console.error("Mark all messages read error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to mark all messages as read.",
      error: error.message,
    });
  }
};

module.exports = {
  getUserMessages,
  getUnreadCount,
  markMessageAsRead,
  markAllMessagesAsRead,
};
