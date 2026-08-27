// ============================================================
// FINANCEOS - BACKEND SERVER
// ============================================================

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

// ============================================================
// EXPRESS
// ============================================================

const app = express();

// ============================================================
// MIDDLEWARE
// ============================================================

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

// ============================================================
// ROUTES
// ============================================================

const authRoutes =
  require("./routes/authRoutes");

const adminRoutes =
  require("./routes/adminRoutes");

const monthlyFinanceRoutes =
  require("./routes/monthlyFinanceRoutes");

const additionalIncomeRoutes =
  require("./routes/additionalIncomeRoutes");

const savingGoalRoutes =
  require("./routes/savingGoalRoutes");

const investmentRoutes =
  require("./routes/investmentRoutes");

const reminderRoutes =
  require("./routes/reminderRoutes");

const userReminderRoutes =
  require("./routes/userReminderRoutes");

const liabilityRoutes = require("./routes/liabilityRoutes");
const insuranceRoutes = require("./routes/insuranceRoutes");
const messageRoutes = require("./routes/messageRoutes");

// ============================================================
// AUTH
// ============================================================

app.use(
  "/api/auth",
  authRoutes
);

// ============================================================
// ADMIN
// ============================================================

app.use(
  "/api/admin",
  adminRoutes
);

app.use(
  "/api/admin/reminders",
  reminderRoutes
);

// ============================================================
// FINANCE
// ============================================================

app.use(
  "/api/monthly-finance",
  monthlyFinanceRoutes
);

app.use(
  "/api/additional-income",
  additionalIncomeRoutes
);

app.use(
  "/api/saving-goals",
  savingGoalRoutes
);

app.use(
  "/api/investments",
  investmentRoutes
);

app.use(
  "/api/reminders",
  userReminderRoutes
);

app.use(
  "/api/liabilities",
  liabilityRoutes
);

app.use(
  "/api/messages",
  messageRoutes
);

app.use(
  "/api/insurances",
  insuranceRoutes
);

// ============================================================
// TEST
// ============================================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "FinanceOS Backend API is running",
  });
});

// ============================================================
// 404
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
  });
});

const { startScheduler } = require("./utils/schedulerService");

// ============================================================
// MONGODB
// ============================================================

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log(
      "MongoDB connected successfully"
    );

    // Start background scheduler worker
    startScheduler();

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