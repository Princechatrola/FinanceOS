const Liability = require("../models/Liability");
const Activity = require("../models/Activity");
const Reminder = require("../models/Reminder");
const User = require("../models/User");

// Helper to log user activities safely under the strict Activity schema
const logActivity = async (userId, description) => {
  try {
    const user = await User.findById(userId);
    await Activity.create({
      userId,
      userName: user ? user.name : "System User",
      userEmail: user ? user.email : "unknown@domain.com",
      type: "Other",
      description,
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
};

const createLiability = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const liabilityData = { ...req.body, user: userId };
    
    // Set initial remaining amount if not provided
    if (liabilityData.remainingAmount === undefined) {
      liabilityData.remainingAmount = liabilityData.principalAmount;
    }

    const liability = await Liability.create(liabilityData);

    await logActivity(userId, `Added a new liability: ${liability.name}`);

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

    await logActivity(userId, `Updated liability: ${liability.name}`);

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

    await logActivity(userId, `Deleted liability: ${liability.name}`);

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

    const {
      amount,
      dueDate,
      paidDate,
      status,
      type, // EMI, Prepayment, Closure
      principalComponent,
      interestComponent,
      paymentSource,
      note,
      closureDetails,
    } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Valid payment amount is required." });
    }

    const payment = {
      amount,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      paidDate: paidDate ? new Date(paidDate) : undefined,
      date: paidDate ? new Date(paidDate) : new Date(),
      status: status || "Paid",
      type: type || "EMI",
      principalComponent: principalComponent || 0,
      interestComponent: interestComponent || 0,
      paymentSource: paymentSource || { method: "Cash" },
      note: note || "",
    };

    liability.payments.push(payment);

    // Apply financial adjustments based on transaction type
    if (payment.type === "Closure") {
      liability.remainingAmount = 0;
      liability.status = "Closed";
      if (closureDetails) {
        liability.closureDetails = {
          closureDate: closureDetails.closureDate ? new Date(closureDetails.closureDate) : new Date(),
          amountPaid: Number(closureDetails.amountPaid) || amount,
          outstandingAtClosure: Number(closureDetails.outstandingAtClosure) || 0,
          penaltyCharges: Number(closureDetails.penaltyCharges) || 0,
          note: closureDetails.note || note || ""
        };
      }
    } else {
      // EMI or Prepayment
      const deduction = payment.type === "Prepayment" 
        ? amount 
        : (payment.principalComponent > 0 ? payment.principalComponent : amount);

      liability.remainingAmount = Math.max(0, (liability.remainingAmount || 0) - deduction);
      
      if (liability.remainingAmount <= 0) {
        liability.status = "Completed";
      }
    }

    await liability.save();

    await logActivity(
      userId,
      `Recorded ${payment.type} of ₹${amount} for liability: ${liability.name}. New Outstanding: ₹${liability.remainingAmount}`
    );

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
