const Insurance = require("../models/Insurance");
const Activity = require("../models/Activity");
const Reminder = require("../models/Reminder");

const createInsurance = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const insuranceData = { ...req.body, user: userId };
    
    const insurance = await Insurance.create(insuranceData);

    await Activity.create({
      user: userId,
      type: "Insurance Created",
      description: `Added a new insurance policy: ${insurance.name}`,
    });

    res.status(201).json({
      success: true,
      message: "Insurance created successfully.",
      insurance,
    });
  } catch (error) {
    console.error("Create Insurance:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

const getInsurances = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const insurances = await Insurance.find({ user: userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      insurances,
    });
  } catch (error) {
    console.error("Get Insurances:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

const updateInsurance = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const insurance = await Insurance.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!insurance) {
      return res.status(404).json({ success: false, message: "Insurance not found." });
    }

    await Activity.create({
      user: userId,
      type: "Insurance Updated",
      description: `Updated insurance policy: ${insurance.name}`,
    });

    res.status(200).json({
      success: true,
      message: "Insurance updated successfully.",
      insurance,
    });
  } catch (error) {
    console.error("Update Insurance:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

const deleteInsurance = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const insurance = await Insurance.findOneAndDelete({ _id: req.params.id, user: userId });

    if (!insurance) {
      return res.status(404).json({ success: false, message: "Insurance not found." });
    }

    await Reminder.deleteMany({ referenceId: req.params.id });

    await Activity.create({
      user: userId,
      type: "Insurance Deleted",
      description: `Deleted insurance policy: ${insurance.name}`,
    });

    res.status(200).json({
      success: true,
      message: "Insurance deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Insurance:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

const addInsurancePayment = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const insurance = await Insurance.findOne({ _id: req.params.id, user: userId });

    if (!insurance) {
      return res.status(404).json({ success: false, message: "Insurance not found." });
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

    insurance.payments.push(payment);
    await insurance.save();

    res.status(201).json({
      success: true,
      message: "Premium payment recorded successfully.",
      insurance,
      payment,
    });
  } catch (error) {
    console.error("Add Insurance Payment:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

module.exports = {
  createInsurance,
  getInsurances,
  updateInsurance,
  deleteInsurance,
  addInsurancePayment,
};
