// ============================================================
// FINANCEOS - MONTHLY FINANCE ROUTES
// ============================================================

const express = require("express");

const MonthlyFinance =
  require("../models/MonthlyFinance");

const authMiddleware =
  require("../middleware/authMiddleware");

const router = express.Router();


// ============================================================
// CHECK FINANCIAL PERIOD
//
// Returns:
// -1 = past
//  0 = current month
//  1 = future
// ============================================================

function compareWithCurrentMonth(year, month) {
  const now = new Date();

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year > currentYear) {
    return 1;
  }

  if (year < currentYear) {
    return -1;
  }

  if (month > currentMonth) {
    return 1;
  }

  if (month < currentMonth) {
    return -1;
  }

  return 0;
}


// ============================================================
// VALIDATE MONTH / YEAR
// ============================================================

function validatePeriod(year, month) {
  const numericYear = Number(year);
  const numericMonth = Number(month);

  if (
    !Number.isInteger(numericYear) ||
    numericYear < 2000 ||
    numericYear > 2100
  ) {
    return {
      valid: false,
      message: "Invalid year.",
    };
  }

  if (
    !Number.isInteger(numericMonth) ||
    numericMonth < 1 ||
    numericMonth > 12
  ) {
    return {
      valid: false,
      message: "Invalid month.",
    };
  }

  if (
    compareWithCurrentMonth(
      numericYear,
      numericMonth
    ) > 0
  ) {
    return {
      valid: false,
      message:
        "Future monthly finance records are not allowed.",
    };
  }

  return {
    valid: true,
    year: numericYear,
    month: numericMonth,
  };
}


// ============================================================
// SAVE OR UPDATE MONTH
// PUT /api/monthly-finance
//
// If record doesn't exist -> CREATE
// If record exists       -> UPDATE
// ============================================================

router.put(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const {
        year,
        month,
        income,
        expenses,
        cashBalance,
        updateDate,
        reminderEnabled,
        emailNotification,
      } = req.body;


      // ======================================================
      // AUTH USER
      // ======================================================

      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid authentication token.",
        });
      }


      // ======================================================
      // PERIOD
      // ======================================================

      const period =
        validatePeriod(year, month);

      if (!period.valid) {
        return res.status(400).json({
          success: false,
          message: period.message,
        });
      }


      // ======================================================
      // NUMERIC VALUES
      // ======================================================

      const numericIncome = Number(income);
      const numericExpenses = Number(expenses);
      const numericCashBalance =
        Number(cashBalance);


      if (
        !Number.isFinite(numericIncome) ||
        numericIncome < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Income must be zero or greater.",
        });
      }


      if (
        !Number.isFinite(numericExpenses) ||
        numericExpenses < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Expenses must be zero or greater.",
        });
      }


      if (
        !Number.isFinite(numericCashBalance) ||
        numericCashBalance < 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Cash and savings balance must be zero or greater.",
        });
      }

      const parsedUpdateDate = new Date(updateDate);
      if (isNaN(parsedUpdateDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Monthly update date must be a valid date.",
        });
      }


      // ======================================================
      // SAVE / UPDATE
      //
      // IMPORTANT:
      // user comes from JWT, never request body.
      // ======================================================

      const finance =
        await MonthlyFinance.findOneAndUpdate(
          {
            user: userId,
            year: period.year,
            month: period.month,
          },

          {
            $set: {
              income: numericIncome,

              expenses: numericExpenses,

              cashBalance:
                numericCashBalance,

              updateDate: parsedUpdateDate,

              reminderEnabled:
                Boolean(reminderEnabled),

              emailNotification:
                Boolean(emailNotification),
            },

            $setOnInsert: {
              user: userId,

              year: period.year,

              month: period.month,
            },
          },

          {
            new: true,
            upsert: true,
            runValidators: true,
          }
        );


      // ======================================================
      // RESPONSE
      // ======================================================

      return res.status(200).json({
        success: true,

        message:
          "Monthly finance saved successfully.",

        finance,
      });

    } catch (error) {
      console.error(
        "Save monthly finance error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to save monthly finance.",
      });
    }
  }
);


// ============================================================
// GET SELECTED MONTH
//
// GET /api/monthly-finance/2026/7
// ============================================================

router.get(
  "/:year/:month",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid authentication token.",
        });
      }


      const period =
        validatePeriod(
          req.params.year,
          req.params.month
        );


      if (!period.valid) {
        return res.status(400).json({
          success: false,
          message: period.message,
        });
      }


      // ======================================================
      // USER-SCOPED QUERY
      // ======================================================

      const finance =
        await MonthlyFinance.findOne({
          user: userId,
          year: period.year,
          month: period.month,
        });


      return res.status(200).json({
        success: true,
        finance: finance || null,
      });

    } catch (error) {
      console.error(
        "Get monthly finance error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve monthly finance.",
      });
    }
  }
);


// ============================================================
// GET ALL MONTHLY HISTORY
//
// GET /api/monthly-finance
// ============================================================

router.get(
  "/",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid authentication token.",
        });
      }


      const history =
        await MonthlyFinance.find({
          user: userId,
        }).sort({
          year: -1,
          month: -1,
        });


      return res.status(200).json({
        success: true,

        count: history.length,

        history,
      });

    } catch (error) {
      console.error(
        "Get monthly history error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to retrieve monthly finance history.",
      });
    }
  }
);


// ============================================================
// DELETE MONTH
//
// DELETE /api/monthly-finance/2026/7
//
// Past/current month only.
// Future month is blocked by validatePeriod().
// ============================================================

router.delete(
  "/:year/:month",
  authMiddleware,
  async (req, res) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid authentication token.",
        });
      }


      const period =
        validatePeriod(
          req.params.year,
          req.params.month
        );


      if (!period.valid) {
        return res.status(400).json({
          success: false,
          message: period.message,
        });
      }


      const deletedFinance =
        await MonthlyFinance.findOneAndDelete({
          user: userId,
          year: period.year,
          month: period.month,
        });


      if (!deletedFinance) {
        return res.status(404).json({
          success: false,
          message:
            "Monthly finance record not found.",
        });
      }


      return res.status(200).json({
        success: true,

        message:
          "Monthly finance deleted successfully.",
      });

    } catch (error) {
      console.error(
        "Delete monthly finance error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to delete monthly finance.",
      });
    }
  }
);


// ============================================================
// EXPORT
// ============================================================

module.exports = router;
