// ============================================================
// FINANCEOS - ADDITIONAL INCOME CONTROLLER
// ============================================================

const AdditionalIncome = require("../models/AdditionalIncome");

// ============================================================
// ADD ADDITIONAL INCOME
// ============================================================

const addAdditionalIncome = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const {
      title,
      category,
      amount,
      description,
      month,
      year,
      receivedDate,
    } = req.body;

    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid income amount is required.",
      });
    }

    const additionalIncome = await AdditionalIncome.create({
      user: userId,
      title: (title || "").trim(),
      category: category || "Other",
      amount: numericAmount,
      description: (description || "").trim(),
      month: Number(month) || (new Date().getMonth() + 1),
      year: Number(year) || new Date().getFullYear(),
      receivedDate: receivedDate || new Date(),
    });

    res.status(201).json({
      success: true,
      message: "Additional income added successfully.",
      data: additionalIncome,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// GET ALL ADDITIONAL INCOME
// ============================================================

const getAdditionalIncome = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const incomes = await AdditionalIncome.find({
      user: userId,
    }).sort({
      year: -1,
      month: -1,
      receivedDate: -1,
    });

    res.status(200).json({
      success: true,
      count: incomes.length,
      data: incomes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// UPDATE ADDITIONAL INCOME
// ============================================================

const updateAdditionalIncome = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const income = await AdditionalIncome.findOne({
      _id: req.params.id,
      user: userId,
    });

    if (!income) {
      return res.status(404).json({
        success: false,
        message: "Additional income not found.",
      });
    }

    Object.assign(income, req.body);

    await income.save();

    res.status(200).json({
      success: true,
      message: "Additional income updated successfully.",
      data: income,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// DELETE ADDITIONAL INCOME
// ============================================================

const deleteAdditionalIncome = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    const income = await AdditionalIncome.findOne({
      _id: req.params.id,
      user: userId,
    });

    if (!income) {
      return res.status(404).json({
        success: false,
        message: "Additional income not found.",
      });
    }

    await income.deleteOne();

    res.status(200).json({
      success: true,
      message: "Additional income deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  addAdditionalIncome,
  getAdditionalIncome,
  updateAdditionalIncome,
  deleteAdditionalIncome,
};