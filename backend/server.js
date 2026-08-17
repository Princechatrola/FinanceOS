// ============================================================
// FINANCEOS - BACKEND SERVER
// ============================================================

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// ============================================================
// ENVIRONMENT VARIABLES
// ============================================================

dotenv.config();

// ============================================================
// EXPRESS APP
// ============================================================

const app = express();

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(cors());

app.use(express.json());

// ============================================================
// ROUTES
// ============================================================

// ============================================================
// AUTH ROUTES
//
// /api/auth/signup
// /api/auth/signin
// /api/auth/me
// /api/auth/profile
// ============================================================

const authRoutes =
  require("./routes/authRoutes");

app.use(
  "/api/auth",
  authRoutes
);

// ============================================================
// MONTHLY FINANCE ROUTES
//
// POST   /api/monthly-finance
// PUT    /api/monthly-finance
// GET    /api/monthly-finance
// GET    /api/monthly-finance/:year/:month
// DELETE /api/monthly-finance/:year/:month
// ============================================================

const monthlyFinanceRoutes =
  require("./routes/monthlyFinanceRoutes");

app.use(
  "/api/monthly-finance",
  monthlyFinanceRoutes
);

// ============================================================
// ADDITIONAL INCOME ROUTES
//
// POST   /api/additional-income
// GET    /api/additional-income
// PUT    /api/additional-income/:id
// DELETE /api/additional-income/:id
// ============================================================

const additionalIncomeRoutes =
  require("./routes/additionalIncomeRoutes");

app.use(
  "/api/additional-income",
  additionalIncomeRoutes
);

// ============================================================
// SAVING GOAL ROUTES
//
// POST   /api/saving-goals
// GET    /api/saving-goals
// GET    /api/saving-goals/:id
// PUT    /api/saving-goals/:id
// DELETE /api/saving-goals/:id
// ============================================================

const savingGoalRoutes =
  require("./routes/savingGoalRoutes");

app.use(
  "/api/saving-goals",
  savingGoalRoutes
);

// ============================================================
// INVESTMENT ROUTES
//
// POST   /api/investments
// GET    /api/investments
// GET    /api/investments/:id
// PUT    /api/investments/:id
// DELETE /api/investments/:id
// POST   /api/investments/:id/interest
// POST   /api/investments/:id/renew
// ============================================================

const investmentRoutes =
  require("./routes/investmentRoutes");

app.use(
  "/api/investments",
  investmentRoutes
);

// ============================================================
// TEST ROUTE
// ============================================================

app.get("/", (req, res) => {

  res.json({
    success: true,
    message:
      "FinanceOS Backend API is running",
  });

});

// ============================================================
// 404 API ROUTE
// ============================================================

app.use((req, res) => {

  res.status(404).json({
    success: false,
    message: "API route not found.",
  });

});

// ============================================================
// MONGODB CONNECTION
// ============================================================

mongoose
  .connect(process.env.MONGO_URI)

  .then(() => {

    console.log(
      "MongoDB connected successfully"
    );

    const PORT =
      process.env.PORT || 5000;

    app.listen(PORT, () => {

      console.log(
        `FinanceOS server running on port ${PORT}`
      );

    });

  })

  .catch((error) => {

    console.error(
      "MongoDB connection failed:",
      error.message
    );

    process.exit(1);

  });