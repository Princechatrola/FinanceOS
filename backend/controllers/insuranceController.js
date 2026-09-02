const Insurance = require("../models/Insurance");
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

const createInsurance = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const insuranceData = { ...req.body, user: userId };
    
    const insurance = await Insurance.create(insuranceData);

    await logActivity(userId, `Added a new insurance policy: ${insurance.name}`);

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

    await logActivity(userId, `Updated insurance policy: ${insurance.name}`);

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

    await logActivity(userId, `Deleted insurance policy: ${insurance.name}`);

    res.status(200).json({
      success: true,
      message: "Insurance deleted successfully.",
    });
  } catch (error) {
    console.error("Delete Insurance:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

const { isItemActiveInMonth, parseSelectedMonth, isDateInMonth, getMonthName } = require("../utils/monthLifecycle");
const { calculateDueDateForMonth, formatDateISO } = require("../utils/dueDateSchedule");
const MonthlyFinance = require("../models/MonthlyFinance");

const addInsurancePayment = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const insurance = await Insurance.findOne({ _id: req.params.id, user: userId });

    if (!insurance) {
      return res.status(404).json({ success: false, message: "Insurance policy not found." });
    }

    const {
      amount,
      paidDate,
      status,
      paymentSource,
      note,
      selectedMonth: reqSelectedMonth
    } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: "Valid payment amount is required." });
    }

    // Determine target working month context
    const monthCtx = parseSelectedMonth(reqSelectedMonth || (paidDate ? String(paidDate).slice(0, 7) : null));
    const targetYear = monthCtx.year;
    const targetMonth = monthCtx.month;
    const formattedMonth = `${getMonthName(targetMonth)} ${targetYear}`;

    // 1. Lifecycle check: Insurance must have started on or before target month
    if (!isItemActiveInMonth(insurance, targetYear, targetMonth)) {
      const insStart = new Date(insurance.startDate || insurance.createdAt);
      const startMonthName = getMonthName(insStart.getMonth() + 1);
      return res.status(400).json({
        success: false,
        message: `Cannot record payment in ${formattedMonth}. This policy starts in ${startMonthName} ${insStart.getFullYear()}.`,
      });
    }

    // --------------------------------------------------------
    // DERIVE DUE DATE FROM STORED SCHEDULE (server-side only)
    // --------------------------------------------------------
    const storedDueDay = insurance.premiumDueDay
      || (insurance.startDate ? new Date(insurance.startDate).getDate() : null)
      || 1; // fallback

    const effectiveDueDate = calculateDueDateForMonth(storedDueDay, targetYear, targetMonth);

    const effectivePaidDate = status === "Paid" || !status
      ? (paidDate ? new Date(paidDate) : new Date())
      : null;

    // Validate paid date belongs to selected month
    if (reqSelectedMonth && effectivePaidDate) {
      if (!isDateInMonth(effectivePaidDate, targetYear, targetMonth)) {
        return res.status(400).json({
          success: false,
          message: `Payment date must be within the selected month: ${formattedMonth}.`,
        });
      }
    }

    const payment = {
      amount: Number(amount),
      dueDate: effectiveDueDate,
      paidDate: effectivePaidDate,
      date: effectivePaidDate || effectiveDueDate,
      status: status || "Paid",
      paymentSource: paymentSource || { method: "Cash" },
      note: note || "",
    };

    if (!Array.isArray(insurance.payments)) {
      insurance.payments = [];
    }

    insurance.payments.push(payment);
    await insurance.save();

    res.status(201).json({
      success: true,
      message: `Premium payment of ₹${Number(amount).toLocaleString("en-IN")} recorded for ${formattedMonth}.`,
      insurance,
      payment,
      selectedMonth: monthCtx.iso,
      derivedDueDate: formatDateISO(effectiveDueDate),
    });
  } catch (error) {
    console.error("Add Insurance Payment:", error);
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

const renewInsurance = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    // Find old policy
    const oldPolicy = await Insurance.findOne({
      _id: req.params.id,
      user: userId,
    });

    if (!oldPolicy) {
      return res.status(404).json({
        success: false,
        message: "Insurance policy not found.",
      });
    }

    const {
      startDate,
      endDate,
      premiumAmount,
      premiumFrequency,
      paymentSource,
      policyNumber,
      notes,
    } = req.body;

    // Create a new active insurance policy copied from the old one, but with updated values
    const newPolicy = await Insurance.create({
      user: userId,
      type: oldPolicy.type,
      name: oldPolicy.name,
      provider: oldPolicy.provider,
      policyNumber: policyNumber || oldPolicy.policyNumber,
      coverageAmount: oldPolicy.coverageAmount,
      premiumAmount: premiumAmount !== undefined ? premiumAmount : oldPolicy.premiumAmount,
      premiumFrequency: premiumFrequency || oldPolicy.premiumFrequency,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
      status: "Active",
      paymentSource: paymentSource || oldPolicy.paymentSource,
      notes: notes || oldPolicy.notes,
      nominee: oldPolicy.nominee,
      healthDetails: oldPolicy.healthDetails,
      vehicleDetails: oldPolicy.vehicleDetails,
      homeDetails: oldPolicy.homeDetails,
      reminder: oldPolicy.reminder,
      renewedFromId: oldPolicy._id,
    });

    // Mark old policy as Expired (or Closed)
    oldPolicy.status = "Expired";
    oldPolicy.renewedToId = newPolicy._id;
    await oldPolicy.save();

    await logActivity(userId, `Renewed insurance policy: ${oldPolicy.name}. New policy number: ${newPolicy.policyNumber}`);

    return res.status(201).json({
      success: true,
      message: "Insurance policy renewed successfully.",
      insurance: newPolicy,
      oldPolicy,
    });
  } catch (error) {
    console.error("Renew Insurance:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to renew insurance.",
    });
  }
};

const recordInsuranceMaturity = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    const policy = await Insurance.findOne({
      _id: req.params.id,
      user: userId,
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: "Insurance policy not found.",
      });
    }

    const {
      actualMaturityAmount,
      actualMaturityDate,
      receivedDestination,
      payoutAction,
      note,
    } = req.body;

    const expectedAmount = Number(policy.maturityDetails?.expectedMaturityAmount || 0);
    const actualAmount = Number(actualMaturityAmount || 0);
    const difference = actualAmount - expectedAmount;

    policy.status = "Matured";
    policy.maturityDetails = {
      ...policy.maturityDetails,
      actualMaturityAmount: actualAmount,
      actualMaturityDate: actualMaturityDate ? new Date(actualMaturityDate) : new Date(),
      difference,
      receivedDestination: receivedDestination || "Bank Account",
      payoutAction: payoutAction || "Keep in Bank Account",
      note: note || "",
    };

    await policy.save();

    await logActivity(userId, `Recorded maturity for policy: ${policy.name}. Received ₹${actualAmount}`);

    return res.status(200).json({
      success: true,
      message: "Insurance maturity recorded successfully.",
      insurance: policy,
    });
  } catch (error) {
    console.error("Record Insurance Maturity:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to record insurance maturity.",
    });
  }
};

module.exports = {
  createInsurance,
  getInsurances,
  updateInsurance,
  deleteInsurance,
  addInsurancePayment,
  renewInsurance,
  recordInsuranceMaturity,
};
