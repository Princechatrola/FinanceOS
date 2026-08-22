// ============================================================
// FINANCEOS - INVESTMENT CONTROLLER
// ============================================================

const Investment = require("../models/Investment");

// --------------------------------------------------------
// Validate investment payload based on type and required custom fields
// --------------------------------------------------------
function validateInvestmentPayload(payload) {
  const { type, customDetails = {} } = payload;
  const errors = [];
  switch (type) {
    case "Mutual Fund":
      if (!customDetails.fundName) errors.push("fundName is required for Mutual Fund");
      if (!customDetails.units) errors.push("units is required for Mutual Fund");
      break;
    case "Gold":
      if (!customDetails.weight) errors.push("weight is required for Gold");
      if (!customDetails.purity) errors.push("purity is required for Gold");
      break;
    case "Stocks":
      if (!customDetails.ticker) errors.push("ticker is required for Stocks");
      if (!customDetails.quantity) errors.push("quantity is required for Stocks");
      if (!customDetails.purchasePrice) errors.push("purchasePrice is required for Stocks");
      break;
    case "Recurring Deposit":
      // RD uses same fields as FD; no extra customDetails required
      break;
    case "Other":
      // No mandatory fields
      break;
    default:
      // No extra validation for SIP, FD, etc.
      break;
  }
  return { valid: errors.length === 0, errors };
}

// ============================================================
// ADD INVESTMENT
// ============================================================

const addInvestment = async (req, res) => {
  try {
    console.log("REQ.USER:", req.user);
    console.log("REQ.USER.ID:", req.user?.id);
    console.log("REQ.USER._ID:", req.user?._id);

    const investmentData = {
      ...req.body,
      user: req.user?.id || req.user?._id,
      paymentSource: req.body.paymentSource || undefined,
    };

    // --------------------------------------------------------
    // Run validation before persisting
    // --------------------------------------------------------
    const { valid, errors } = validateInvestmentPayload(investmentData);
    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Investment validation failed.",
        errors,
      });
    }

    console.log("INVESTMENT USER:", investmentData.user);

    const investment = await Investment.create(investmentData);

    res.status(201).json({
      success: true,
      message: "Investment added successfully.",
      investment,
    });
  } catch (error) {
    console.error("Add Investment:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to add investment.",
    });
  }
};

// ============================================================
// GET ALL INVESTMENTS
// ============================================================

const getInvestments = async (req, res) => {
  try {
    const investments = await Investment.find({
      user: req.user?.id || req.user?._id,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: investments.length,
      investments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// GET SINGLE INVESTMENT
// ============================================================

const getInvestment = async (req, res) => {
  try {
    const investment = await Investment.findOne({
      _id: req.params.id,
      user: req.user?.id || req.user?._id,
    });

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: "Investment not found.",
      });
    }

    res.status(200).json({
      success: true,
      investment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// UPDATE INVESTMENT
// ============================================================

const updateInvestment = async (req, res) => {
  try {
    const investment = await Investment.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user?.id || req.user?._id,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: "Investment not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Investment updated successfully.",
      investment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// DELETE INVESTMENT
// ============================================================

const deleteInvestment = async (req, res) => {
  try {
    const investment = await Investment.findOne({
      _id: req.params.id,
      user: req.user?.id || req.user?._id,
    });

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: "Investment not found.",
      });
    }

    await investment.deleteOne();

    res.status(200).json({
      success: true,
      message: "Investment deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// RECORD FD INTEREST
// ============================================================

const recordFDInterest = async (req, res) => {
  try {
    const investment = await Investment.findOne({
      _id: req.params.id,
      user: req.user?.id || req.user?._id,
    });

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: "Investment not found.",
      });
    }

    investment.interestTransactions.push(req.body);
    investment.totalInterestReceived += Number(req.body.amount);

    await investment.save();

    res.status(200).json({
      success: true,
      message: "FD interest recorded successfully.",
      investment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// GET SIP CONTRIBUTIONS
// ============================================================

const getSIPContributions = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const investment = await Investment.findOne({
      _id: req.params.id,
      user: userId,
    });

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: "Investment not found.",
      });
    }

    return res.status(200).json({
      success: true,
      count: (investment.sipContributions || []).length,
      contributions: investment.sipContributions || [],
    });
  } catch (error) {
    console.error("Get SIP Contributions:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch SIP contributions.",
    });
  }
};

// ============================================================
// ADD SIP CONTRIBUTION
// ============================================================

const addSIPContribution = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const investment = await Investment.findOne({
      _id: req.params.id,
      user: userId,
    });

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: "Investment not found.",
      });
    }

    const { amount, dueDate, paidDate, status, note } = req.body;

    const contributionAmount = Number(amount ?? investment.monthlyContribution ?? investment.amount ?? 0);
    if (!Number.isFinite(contributionAmount) || contributionAmount < 0) {
      return res.status(400).json({
        success: false,
        message: "Contribution amount must be a valid non-negative number.",
      });
    }

    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: "Due date is required.",
      });
    }

    const contributionStatus = status || "Not Paid";
    const allowedStatuses = ["Paid", "Not Paid", "Skipped"];
    if (!allowedStatuses.includes(contributionStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contribution status.",
      });
    }

    const contribution = {
      amount: contributionAmount,
      dueDate: new Date(dueDate),
      paidDate: contributionStatus === "Paid" ? (paidDate ? new Date(paidDate) : new Date()) : null,
      status: contributionStatus,
      note: note || "",
    };

    if (!Array.isArray(investment.sipContributions)) {
      investment.sipContributions = [];
    }

    investment.sipContributions.push(contribution);
    await investment.save();

    const createdContribution = investment.sipContributions[investment.sipContributions.length - 1];

    return res.status(201).json({
      success: true,
      message: "SIP contribution added successfully.",
      contribution: createdContribution,
      investment,
    });
  } catch (error) {
    console.error("Add SIP Contribution:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add SIP contribution.",
    });
  }
};

// ============================================================
// UPDATE SIP CONTRIBUTION
// ============================================================

const updateSIPContribution = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const investment = await Investment.findOne({
      _id: req.params.id,
      user: userId,
    });

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: "Investment not found.",
      });
    }

    const contribution = investment.sipContributions.id(req.params.contributionId);
    if (!contribution) {
      return res.status(404).json({
        success: false,
        message: "SIP contribution not found.",
      });
    }

    const { amount, dueDate, paidDate, status, note } = req.body;

    // --------------------------------------------------------
    // UPDATE AMOUNT
    // --------------------------------------------------------

    if (amount !== undefined) {
      const newAmount = Number(amount);
      if (!Number.isFinite(newAmount) || newAmount < 0) {
        return res.status(400).json({
          success: false,
          message: "Contribution amount must be a valid number.",
        });
      }
      contribution.amount = newAmount;
    }

    // --------------------------------------------------------
    // UPDATE DUE DATE
    // --------------------------------------------------------

    if (dueDate !== undefined) {
      contribution.dueDate = new Date(dueDate);
    }

    // --------------------------------------------------------
    // UPDATE STATUS
    // --------------------------------------------------------

    if (status !== undefined) {
      const allowedStatuses = ["Paid", "Not Paid", "Skipped"];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Invalid contribution status.",
        });
      }

      contribution.status = status;

      if (status === "Paid") {
        contribution.paidDate = paidDate ? new Date(paidDate) : contribution.paidDate || new Date();
      } else {
        contribution.paidDate = null;
      }
    } else if (paidDate !== undefined) {
      contribution.paidDate = paidDate ? new Date(paidDate) : null;
    }

    // --------------------------------------------------------
    // UPDATE NOTE
    // --------------------------------------------------------

    if (note !== undefined) {
      contribution.note = note;
    }

    await investment.save();

    return res.status(200).json({
      success: true,
      message: "SIP contribution updated successfully.",
      contribution,
      investment,
    });
  } catch (error) {
    console.error("Update SIP Contribution:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update SIP contribution.",
    });
  }
};

// ============================================================
// RECORD INVESTMENT MATURITY
// ============================================================

const recordInvestmentMaturity = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    const investment = await Investment.findOne({
      _id: req.params.id,
      user: userId,
    });

    if (!investment) {
      return res.status(404).json({
        success: false,
        message: "Investment not found.",
      });
    }

    const {
      actualMaturityValue: reqMaturityValue,
    } = req.body;

    // --------------------------------------------------------
    // CALCULATE TOTAL CONTRIBUTIONS
    // --------------------------------------------------------

    let totalContributions = 0;

    if (investment.type === "SIP") {
      totalContributions = (investment.sipContributions || [])
        .filter((contribution) => contribution.status === "Paid")
        .reduce((total, contribution) => total + Number(contribution.amount || 0), 0);
    } else {
      totalContributions = Number(
        investment.totalContributions ||
          investment.principalAmount ||
          investment.amount ||
          0
      );
    }

    const actualMaturityValue = Number(
      reqMaturityValue !== undefined ? reqMaturityValue : investment.currentValue || 0
    );

    // --------------------------------------------------------
    // CALCULATE GAIN / RETURN
    // --------------------------------------------------------

    const maturityGain = actualMaturityValue - totalContributions;

    // --------------------------------------------------------
    // SAVE MATURITY DATA
    // --------------------------------------------------------

    investment.totalContributions = totalContributions;
    investment.actualMaturityValue = actualMaturityValue;
    investment.maturityGain = maturityGain;
    investment.maturityRecordedAt = new Date();
    investment.currentValue = actualMaturityValue;
    investment.status = "Matured";
    investment.monthlyContribution = 0;
    investment.maturedAt = new Date();

    await investment.save();

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Investment maturity recorded successfully.",
      investment,
      maturitySummary: {
        totalContributions,
        actualMaturityValue,
        maturityGain,
      },
    });
  } catch (error) {
    console.error("Record Investment Maturity:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to record investment maturity.",
    });
  }
};

// ============================================================
// RENEW INVESTMENT
// ============================================================

const renewInvestment = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    // --------------------------------------------------------
    // FIND OLD INVESTMENT
    // --------------------------------------------------------

    const oldInvestment = await Investment.findOne({
      _id: req.params.id,
      user: userId,
    });

    if (!oldInvestment) {
      return res.status(404).json({
        success: false,
        message: "Investment not found.",
      });
    }

    // --------------------------------------------------------
    // ONLY MATURED INVESTMENT CAN BE RENEWED
    // --------------------------------------------------------

    if (String(oldInvestment.status).toLowerCase() !== "matured") {
      return res.status(400).json({
        success: false,
        message: "Only a matured investment can be renewed.",
      });
    }

    // --------------------------------------------------------
    // REQUEST DATA
    // --------------------------------------------------------

    const {
      amount,
      principalAmount,
      contributionType,
      frequency,
      maturityDate,
    } = req.body;

    // --------------------------------------------------------
    // MATURITY AMOUNT
    // --------------------------------------------------------

    const maturityAmount = Number(
      oldInvestment.actualMaturityValue ||
      oldInvestment.estimatedMaturityAmount ||
      oldInvestment.principalAmount ||
      oldInvestment.amount ||
      0
    );

    // --------------------------------------------------------
    // RENEWAL AMOUNT
    // --------------------------------------------------------

    const renewedAmount = Number(
      amount ??
      principalAmount ??
      maturityAmount
    );

    if (!Number.isFinite(renewedAmount) || renewedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Renewal amount must be greater than 0.",
      });
    }

    if (renewedAmount > maturityAmount) {
      return res.status(400).json({
        success: false,
        message: "Renewal amount cannot exceed the maturity amount.",
      });
    }

    // --------------------------------------------------------
    // CREATE NEW INVESTMENT
    // --------------------------------------------------------

    const newInvestment = await Investment.create({
      user: userId,
      name: oldInvestment.name,
      type: oldInvestment.type,
      amount: renewedAmount,
      contributionType: contributionType ?? oldInvestment.contributionType,
      frequency: frequency ?? oldInvestment.frequency,
      monthlyContribution: oldInvestment.monthlyContribution || 0,
      startDate: new Date(),
      nextContributionDate: oldInvestment.nextContributionDate,
      maturityDate: maturityDate ?? oldInvestment.maturityDate,
      status: "Active",
      currentValue: renewedAmount,
      institution: oldInvestment.institution,
      principalAmount: renewedAmount,
      interestRate: oldInvestment.interestRate,
      interestMethod: oldInvestment.interestMethod,
      interestPayoutFrequency: oldInvestment.interestPayoutFrequency,
      compoundingFrequency: oldInvestment.compoundingFrequency,
      estimatedInterest: 0,
      estimatedAnnualInterest: 0,
      estimatedInterestPerPayout: 0,
      estimatedMaturityAmount: 0,
      totalInterestReceived: 0,
      interestTransactions: [],
      renewedFromId: oldInvestment._id,
      renewedToId: null,
      renewalCount: Number(oldInvestment.renewalCount || 0) + 1,
      renewedAt: new Date(),
      maturedAt: null,
      closedAt: null,
      reminder: oldInvestment.reminder,
      maturityReminder: oldInvestment.maturityReminder,
    });

    // --------------------------------------------------------
    // LINK OLD → NEW
    // --------------------------------------------------------

    oldInvestment.renewedToId = newInvestment._id;
    await oldInvestment.save();

    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    return res.status(201).json({
      success: true,
      message: "Investment renewed successfully.",
      investment: newInvestment,
      renewedFromId: oldInvestment._id,
      renewedToId: newInvestment._id,
    });
  } catch (error) {
    console.error("Renew Investment:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to renew investment.",
    });
  }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  addInvestment,
  getInvestments,
  getInvestment,
  updateInvestment,
  deleteInvestment,
  recordFDInterest,
  getSIPContributions,
  addSIPContribution,
  updateSIPContribution,
  recordInvestmentMaturity,
  renewInvestment,
};