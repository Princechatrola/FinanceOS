// ============================================================
// FINANCEOS - INVESTMENT CONTROLLER
// ============================================================

const Investment = require("../models/Investment");

// ============================================================
// ADD INVESTMENT
// ============================================================

const addInvestment = async (req, res) => {

  try {

    const investment =
      await Investment.create({
        user: req.user._id,
        ...req.body,
      });

    res.status(201).json({
      success: true,
      message:
        "Investment added successfully.",
      investment,
    });

  } catch (error) {

    console.error(
      "Add Investment:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Failed to add investment.",
    });

  }

};

// ============================================================
// GET ALL INVESTMENTS
// ============================================================

const getInvestments = async (req, res) => {

  try {

    const investments = await Investment.find({
      user: req.user._id,
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
      user: req.user._id,
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
        user: req.user._id,
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
      user: req.user._id,
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
      user: req.user._id,
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
// RENEW INVESTMENT
// ============================================================

const renewInvestment = async (req, res) => {

  try {

    // --------------------------------------------------------
    // FIND OLD INVESTMENT
    // --------------------------------------------------------

    const oldInvestment =
      await Investment.findOne({
        _id: req.params.id,
        user: req.user._id,
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

    if (
      String(oldInvestment.status)
        .toLowerCase() !== "matured"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Only a matured investment can be renewed.",
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

    const maturityAmount =
      Number(
        oldInvestment.estimatedMaturityAmount ||
        oldInvestment.principalAmount ||
        oldInvestment.amount ||
        0
      );

    // --------------------------------------------------------
    // RENEWAL AMOUNT
    // --------------------------------------------------------

    const renewedAmount =
      Number(
        amount ??
        principalAmount ??
        maturityAmount
      );

    if (
      !Number.isFinite(renewedAmount) ||
      renewedAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Renewal amount must be greater than 0.",
      });
    }

    if (
      renewedAmount > maturityAmount
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Renewal amount cannot exceed the maturity amount.",
      });
    }

    // --------------------------------------------------------
    // CREATE NEW INVESTMENT
    // --------------------------------------------------------

    const newInvestment =
      await Investment.create({

        user:
          req.user._id,

        name:
          oldInvestment.name,

        type:
          oldInvestment.type,

        amount:
          renewedAmount,

        contributionType:
          contributionType ??
          oldInvestment.contributionType,

        frequency:
          frequency ??
          oldInvestment.frequency,

        monthlyContribution:
          oldInvestment.monthlyContribution || 0,

        startDate:
          new Date(),

        nextContributionDate:
          oldInvestment.nextContributionDate,

        maturityDate:
          maturityDate ??
          oldInvestment.maturityDate,

        status:
          "Active",

        currentValue:
          renewedAmount,

        // ----------------------------------------------------
        // KEEP EXISTING INVESTMENT TERMS
        // ----------------------------------------------------

        institution:
          oldInvestment.institution,

        principalAmount:
          renewedAmount,

        interestRate:
          oldInvestment.interestRate,

        interestMethod:
          oldInvestment.interestMethod,

        interestPayoutFrequency:
          oldInvestment.interestPayoutFrequency,

        compoundingFrequency:
          oldInvestment.compoundingFrequency,

        // ----------------------------------------------------
        // RESET INTEREST FOR NEW PERIOD
        // ----------------------------------------------------

        estimatedInterest:
          0,

        estimatedAnnualInterest:
          0,

        estimatedInterestPerPayout:
          0,

        estimatedMaturityAmount:
          0,

        totalInterestReceived:
          0,

        interestTransactions:
          [],

        // ----------------------------------------------------
        // RENEWAL LINK
        // ----------------------------------------------------

        renewedFromId:
          oldInvestment._id,

        renewedToId:
          null,

        renewalCount:
          Number(
            oldInvestment.renewalCount || 0
          ) + 1,

        renewedAt:
          new Date(),

        maturedAt:
          null,

        closedAt:
          null,

        reminder:
          oldInvestment.reminder,

        maturityReminder:
          oldInvestment.maturityReminder,
      });

    // --------------------------------------------------------
    // LINK OLD → NEW
    // --------------------------------------------------------

    oldInvestment.renewedToId =
      newInvestment._id;

    await oldInvestment.save();

    // --------------------------------------------------------
    // SUCCESS
    // --------------------------------------------------------

    return res.status(201).json({

      success: true,

      message:
        "Investment renewed successfully.",

      investment:
        newInvestment,

      renewedFromId:
        oldInvestment._id,

      renewedToId:
        newInvestment._id,

    });

  } catch (error) {

    console.error(
      "Renew Investment:",
      error
    );

    return res.status(500).json({

      success: false,

      message:
        error.message ||
        "Failed to renew investment.",

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
  renewInvestment,
};