// ============================================================
// FINANCEOS - SAVING GOAL CONTROLLER
// ============================================================

const SavingGoal = require("../models/SavingGoal");
const MonthlyFinance = require("../models/MonthlyFinance");

// ============================================================
// ADD SAVING GOAL
// ============================================================

const addSavingGoal = async (req, res) => {
  try {
    console.log("req.user:", req.user);
    console.log("req.body:", req.body);

    // --------------------------------------------------------
    // GET CURRENT MONTHLY FINANCE
    // --------------------------------------------------------

    const today = new Date();

    const finance = await MonthlyFinance.findOne({
      user: req.user.id,
      month: today.getMonth() + 1,
      year: today.getFullYear(),
    });

    if (!finance) {
      return res.status(400).json({
        success: false,
        message:
          "Please add your current month's finance details before creating a saving goal.",
      });
    }

    // --------------------------------------------------------
    // GET MONTHLY CONTRIBUTION
    // --------------------------------------------------------

    const monthlyContribution = Number(
      req.body.monthlyContribution || 0
    );

    // --------------------------------------------------------
    // CHECK AFFORDABILITY
    // --------------------------------------------------------

    const availableToAllocate = finance.availableToAllocate;

    if (monthlyContribution > availableToAllocate) {
      return res.status(400).json({
        success: false,
        message:
          "Saving goal cannot be created because the monthly contribution exceeds your available amount.",
        financialSummary: {
          income: finance.income,
          expenses: finance.expenses,
          monthlySavings: finance.monthlySavings,
          goalAllocations: finance.goalAllocations,
          availableToAllocate,
          requestedMonthlyContribution: monthlyContribution,
        },
      });
    }

    // --------------------------------------------------------
    // INITIAL SAVED AMOUNT
    // --------------------------------------------------------

    const alreadySaved = Number(
      req.body.alreadySaved || 0
    );

    // --------------------------------------------------------
    // CREATE GOAL
    // --------------------------------------------------------

    const goal = await SavingGoal.create({
      user: req.user.id,
      ...req.body,

      // Existing savings become the starting amount
      alreadySaved,
      currentAmount: alreadySaved,
    });

    // --------------------------------------------------------
    // ADD NEW GOAL TO MONTHLY PLANNED ALLOCATION
    // --------------------------------------------------------

    finance.goalAllocations =
      Number(finance.goalAllocations || 0) +
      monthlyContribution;

    await finance.save();

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    res.status(201).json({
      success: true,
      message: "Saving goal created successfully.",
      goal,

      financialSummary: {
        income: finance.income,
        expenses: finance.expenses,
        monthlySavings: finance.monthlySavings,
        goalAllocations: finance.goalAllocations,
        availableToAllocate: finance.availableToAllocate,
      },
    });

  } catch (error) {
    console.error("Add Saving Goal Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// GET ALL SAVING GOALS
// ============================================================

const getSavingGoals = async (req, res) => {
  try {
    const goals = await SavingGoal.find({
      user: req.user.id,
    }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: goals.length,
      goals,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// GET SINGLE SAVING GOAL
// ============================================================

const getSavingGoal = async (req, res) => {
  try {
    const goal = await SavingGoal.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Saving goal not found.",
      });
    }

    res.status(200).json({
      success: true,
      goal,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// UPDATE SAVING GOAL
// ============================================================

const updateSavingGoal = async (req, res) => {
  try {

    // --------------------------------------------------------
    // FIND EXISTING GOAL
    // --------------------------------------------------------

    const goal = await SavingGoal.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Saving goal not found.",
      });
    }

    // --------------------------------------------------------
    // GET CURRENT MONTHLY FINANCE
    // --------------------------------------------------------

    const today = new Date();

    const finance = await MonthlyFinance.findOne({
      user: req.user.id,
      month: today.getMonth() + 1,
      year: today.getFullYear(),
    });

    if (!finance) {
      return res.status(400).json({
        success: false,
        message:
          "Please add your current month's finance details before updating a saving goal.",
      });
    }

    // --------------------------------------------------------
    // OLD AND NEW MONTHLY CONTRIBUTION
    // --------------------------------------------------------

    const oldContribution = Number(
      goal.monthlyContribution || 0
    );

    const newContribution =
      req.body.monthlyContribution !== undefined
        ? Number(req.body.monthlyContribution)
        : oldContribution;

    // --------------------------------------------------------
    // REMOVE CURRENT GOAL'S OLD ALLOCATION
    //
    // We are checking what would be available if this goal's
    // old contribution is removed first.
    // --------------------------------------------------------

    const allocationWithoutCurrentGoal =
      Math.max(
        0,
        Number(finance.goalAllocations || 0) -
          oldContribution
      );

    const availableToAllocate =
      Math.max(
        0,
        finance.monthlySavings -
          allocationWithoutCurrentGoal
      );

    // --------------------------------------------------------
    // CHECK NEW CONTRIBUTION
    // --------------------------------------------------------

    if (newContribution > availableToAllocate) {
      return res.status(400).json({
        success: false,
        message:
          "Saving goal cannot be updated because the monthly contribution exceeds your available amount.",
        financialSummary: {
          income: finance.income,
          expenses: finance.expenses,
          monthlySavings: finance.monthlySavings,
          currentGoalContribution: oldContribution,
          goalAllocations: finance.goalAllocations,
          availableToAllocate,
          requestedMonthlyContribution: newContribution,
        },
      });
    }

    // --------------------------------------------------------
    // UPDATE GOAL
    // --------------------------------------------------------

    Object.assign(goal, req.body);

    goal.monthlyContribution = newContribution;

    await goal.save();

    // --------------------------------------------------------
    // UPDATE MONTHLY GOAL ALLOCATION
    // --------------------------------------------------------

    finance.goalAllocations =
      allocationWithoutCurrentGoal +
      newContribution;

    await finance.save();

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    res.status(200).json({
      success: true,
      message: "Saving goal updated successfully.",
      goal,

      financialSummary: {
        income: finance.income,
        expenses: finance.expenses,
        monthlySavings: finance.monthlySavings,
        goalAllocations: finance.goalAllocations,
        availableToAllocate:
          finance.availableToAllocate,
      },
    });

  } catch (error) {

    console.error(
      "Update Saving Goal Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// RECORD GOAL CONTRIBUTION
// ============================================================

const addGoalContribution = async (req, res) => {
  try {
    const { amount, source } = req.body;

    const contributionAmount = Number(amount);

    // --------------------------------------------------------
    // VALIDATE AMOUNT
    // --------------------------------------------------------

    if (!contributionAmount || contributionAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Contribution amount must be greater than 0.",
      });
    }

    // --------------------------------------------------------
    // FIND GOAL
    // --------------------------------------------------------

    const goal = await SavingGoal.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Saving goal not found.",
      });
    }

    // --------------------------------------------------------
    // CHECK IF GOAL IS ALREADY COMPLETED
    // --------------------------------------------------------

    if (goal.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "This saving goal is already completed.",
      });
    }

    // --------------------------------------------------------
    // CALCULATE REMAINING GOAL AMOUNT
    // --------------------------------------------------------

    const remainingAmount =
      goal.targetAmount - goal.currentAmount;

    // --------------------------------------------------------
    // PREVENT CONTRIBUTION ABOVE TARGET
    // --------------------------------------------------------

    if (contributionAmount > remainingAmount) {
      return res.status(400).json({
        success: false,
        message:
          "Contribution amount cannot be greater than the remaining goal amount.",
        remainingAmount,
        requestedContribution: contributionAmount,
      });
    }

    // ========================================================
    // MONTHLY SAVINGS CONTRIBUTION
    // ========================================================

    if (source === "Monthly Savings") {
      const today = new Date();

      const finance = await MonthlyFinance.findOne({
        user: req.user.id,
        month: today.getMonth() + 1,
        year: today.getFullYear(),
      });

      // ------------------------------------------------------
      // CURRENT MONTH FINANCE REQUIRED
      // ------------------------------------------------------

      if (!finance) {
        return res.status(400).json({
          success: false,
          message:
            "Please add your current month's finance details before making a contribution from Monthly Savings.",
        });
      }

      // ------------------------------------------------------
      // CHECK AFFORDABILITY
      // ------------------------------------------------------

      if (contributionAmount > finance.availableToAllocate) {
        return res.status(400).json({
          success: false,
          message: "Contribution amount exceeds your available to allocate.",
          availableToAllocate: finance.availableToAllocate,
          requestedContribution: contributionAmount,
        });
      }

      // ------------------------------------------------------
      // UPDATE GOAL AND FINANCE
      // ------------------------------------------------------

      goal.currentAmount += contributionAmount;
      finance.goalAllocations += contributionAmount;
      await finance.save();

    } else {
      // ======================================================
      // OTHER SOURCES
      // ======================================================

      goal.currentAmount += contributionAmount;
    }

    // --------------------------------------------------------
    // CHECK GOAL COMPLETION
    // --------------------------------------------------------

    if (goal.currentAmount >= goal.targetAmount) {
      goal.currentAmount = goal.targetAmount;
      goal.status = "Completed";
    }

    // --------------------------------------------------------
    // SAVE GOAL
    // --------------------------------------------------------

    await goal.save();

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    res.status(200).json({
      success: true,
      message: "Contribution recorded successfully.",
      goal,
    });

  } catch (error) {
    console.error(
      "Add Goal Contribution Error:",
      error
    );

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ============================================================
// DELETE SAVING GOAL
// ============================================================

const deleteSavingGoal = async (req, res) => {
  try {

    // --------------------------------------------------------
    // FIND GOAL
    // --------------------------------------------------------

    const goal = await SavingGoal.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!goal) {
      return res.status(404).json({
        success: false,
        message: "Saving goal not found.",
      });
    }

    // --------------------------------------------------------
    // GET CURRENT MONTHLY FINANCE
    // --------------------------------------------------------

    const today = new Date();

    const finance = await MonthlyFinance.findOne({
      user: req.user.id,
      month: today.getMonth() + 1,
      year: today.getFullYear(),
    });

    // --------------------------------------------------------
    // REMOVE GOAL'S MONTHLY ALLOCATION
    // --------------------------------------------------------

    if (finance) {

      const contribution = Number(
        goal.monthlyContribution || 0
      );

      finance.goalAllocations = Math.max(
        0,
        Number(finance.goalAllocations || 0) -
          contribution
      );

      await finance.save();
    }

    // --------------------------------------------------------
    // DELETE GOAL
    // --------------------------------------------------------

    await goal.deleteOne();

    // --------------------------------------------------------
    // RESPONSE
    // --------------------------------------------------------

    res.status(200).json({
      success: true,
      message: "Saving goal deleted successfully.",
    });

  } catch (error) {

    console.error(
      "Delete Saving Goal Error:",
      error
    );

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
  addSavingGoal,
  getSavingGoals,
  getSavingGoal,
  updateSavingGoal,
  addGoalContribution,
  deleteSavingGoal,
};