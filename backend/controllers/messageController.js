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
    const userId = req.user.id;
    
    const messages = await Message.find({
      $or: [
        { type: "Bulk" },
        { type: "Personal", userId: userId },
        { type: "Personal", userId: req.user._id }
      ],
      status: { $nin: ["Cancelled"] }
    }).sort({ createdAt: -1 }).lean();

    const formattedMessages = messages.map((message) => {
      const scheduledAt = message.scheduledDate && message.scheduledTime
        ? `${message.scheduledDate}T${message.scheduledTime}`
        : null;

      return {
        id: message._id,
        title: message.title,
        message: message.message,
        type: "in-app-message",
        source: "FinanceOS Admin",
        createdAt: message.createdAt,
        scheduledAt,
        read: false // You might want to track read status per user in the future
      };
    });

    return res.status(200).json({ 
      success: true, 
      data: formattedMessages 
    });

  } catch (error) {
    console.error("Get user messages error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to fetch messages.",
      error: error.message
    });
  }
};

module.exports = {
  getUserMessages
};
