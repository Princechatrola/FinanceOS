const Liability = require("../models/Liability");
const Activity = require("../models/Activity");
const Reminder = require("../models/Reminder");

const createLiability = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const liabilityData = { ...req.body, user: userId };
    
    // Set initial remaining amount if not provided
    if (liabilityData.remainingAmount === undefined) {
      liabilityData.remainingAmount = liabilityData.principalAmount;
    }

    const liability = await Liability.create(liabilityData);

    await Activity.create({
      user: userId,
      type: "Liability Created",
      description: `Added a new liability: ${liability.name}`,
    });

    res.status(201).json({
      success: true,
      message: "Liability created successfully.",
      liability,
    });
  } catch (error) {
    console.error("Create Liability:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

const getLiabilities = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const liabilities = await Liability.find({ user: userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      liabilities,
    });
  } catch (error) {
    console.error("Get Liabilities:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

const updateLiability = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const liability = await Liability.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!liability) {
      return res.status(404).json({ success: false, message: "Liability not found." });
    }

    await Activity.create({
      user: userId,
      type: "Liability Updated",
      description: `Updated liability: ${liability.name}`,
    });

    res.status(200).json({
      success: true,
      message: "Liability updated successfully.",
      liability,
    });
  } catch (error) {
    console.error("Update Liability:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

const deleteLiability = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const liability = await Liability.findOneAndDelete({ _id: req.params.id, user: userId });

    if (!liability) {
      return res.status(404).json({ success: false, message: "Liability not found." });
    }

    await Reminder.deleteMany({ referenceId: req.params.id });

    await Activity.create({
      user: userId,
      type: "Liability Deleted",
      description: `Deleted liability: ${liability.name}`,
    });

    res.status(200).json({
      success: true,
      message: "Liability deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Liability:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

const addLiabilityPayment = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const liability = await Liability.findOne({ _id: req.params.id, user: userId });

    if (!liability) {
      return res.status(404).json({ success: false, message: "Liability not found." });
    }

    const { amount, date, status, note } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Valid payment amount is required." });
    }

    const payment = {
      amount,
      date: date ? new Date(date) : new Date(),
      status: status || "Paid",
      note: note || "",
    };

    liability.payments.push(payment);

    if (payment.status === "Paid") {
      liability.remainingAmount = Math.max(0, (liability.remainingAmount || 0) - amount);
      if (liability.remainingAmount === 0) {
        liability.status = "Closed";
      }
    }

    await liability.save();

    res.status(201).json({
      success: true,
      message: "Payment recorded successfully.",
      liability,
      payment,
    });
  } catch (error) {
    console.error("Add Liability Payment:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

module.exports = {
  createLiability,
  getLiabilities,
  updateLiability,
  deleteLiability,
  addLiabilityPayment,
};
