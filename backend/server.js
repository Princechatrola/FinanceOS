// ============================================================
// FINANCEOS - BACKEND SERVER
// ============================================================

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({
  path: path.resolve(__dirname, ".env"),
});

// ============================================================
// EXPRESS APP
// ============================================================

const app = express();

// ============================================================
// PORT
// ============================================================

const PORT = process.env.PORT || 5000;

// ============================================================
// CORS
// ============================================================

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without origin
      // Example: Thunder Client, Postman, server-to-server
      if (!origin) {
        return callback(null, true);
      }

      // Development / flexible mode
      if (
        process.env.NODE_ENV !== "production" &&
        process.env.ALLOW_ALL_CORS === "true"
      ) {
        return callback(null, true);
      }

      // Production allowed frontend
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.warn(
        `[CORS] Blocked origin: ${origin}`
      );

      return callback(
        new Error("Not allowed by CORS")
      );
    },

    credentials: true,
  })
);

// ============================================================
// BODY PARSER
// ============================================================

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

// ============================================================
// REQUEST LOGGER
// ============================================================

app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`
  );

  next();
});

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

const liabilityRoutes =
  require("./routes/liabilityRoutes");

const insuranceRoutes =
  require("./routes/insuranceRoutes");

const messageRoutes =
  require("./routes/messageRoutes");

const aiRoutes =
  require("./routes/aiRoutes");

const reportRoutes =
  require("./routes/reportRoutes");

// ============================================================
// AUTH ROUTES
// ============================================================

app.use(
  "/api/auth",
  authRoutes
);

// ============================================================
// ADMIN ROUTES
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
// FINANCE ROUTES
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

app.use(
  "/api/ai",
  aiRoutes
);

app.use(
  "/api/reports",
  reportRoutes
);

// ============================================================
// SERVICES
// ============================================================

const {
  startScheduler,
} = require("./services/schedulerService");

const {
  verifyTransporter,
} = require("./services/emailService");

const {
  migrateRecurringSchedules,
} = require("./utils/migrateDueDates");

const {
  cleanupLegacySmsPreferences,
} = require("./utils/cleanupLegacySms");

// ============================================================
// ROOT TEST
// ============================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "FinanceOS Backend API is running",
    environment:
      process.env.NODE_ENV || "development",
  });
});

// ============================================================
// API HEALTH
// ============================================================

app.get("/api/health", (req, res) => {
  const dbState =
    mongoose.connection.readyState;

  let dbStatus = "disconnected";

  if (dbState === 1) {
    dbStatus = "connected";
  } else if (dbState === 2) {
    dbStatus = "connecting";
  } else if (dbState === 3) {
    dbStatus = "disconnecting";
  }

  res.status(200).json({
    success: true,

    server: "ok",

    database: dbStatus,

    email: process.env.EMAIL_USER
      ? "configured"
      : "not configured",

    environment:
      process.env.NODE_ENV || "development",

    uptime:
      Math.floor(process.uptime()) + "s",
  });
});

// ============================================================
// AUTH API TEST
// ============================================================

app.get("/api/auth-test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "FinanceOS authentication API is reachable.",
    endpoints: {
      sendOTP: "POST /api/auth/send-otp",
      verifyOTP: "POST /api/auth/verify-otp",
      google: "POST /api/auth/google",
    },
  });
});

// ============================================================
// 404 HANDLER
// ============================================================

app.use((req, res) => {
  console.warn(
    `[404] ${req.method} ${req.originalUrl}`
  );

  res.status(404).json({
    success: false,
    message: `API route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================

app.use(
  (error, req, res, next) => {
    console.error(
      "================================================="
    );

    console.error(
      "[FINANCEOS] GLOBAL ERROR"
    );

    console.error(
      "Message:",
      error.message
    );

    console.error(
      "Stack:",
      error.stack
    );

    console.error(
      "================================================="
    );

    if (res.headersSent) {
      return next(error);
    }

    res.status(500).json({
      success: false,
      message:
        "Internal FinanceOS server error.",
    });
  }
);

// ============================================================
// PROCESS ERROR HANDLERS
// ============================================================

process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "================================================="
    );

    console.error(
      "[FINANCEOS] UNCAUGHT EXCEPTION"
    );

    console.error(
      "Error:",
      error.message
    );

    console.error(
      "Stack:",
      error.stack
    );

    console.error(
      "================================================="
    );
  }
);

process.on(
  "unhandledRejection",
  (reason) => {
    console.error(
      "================================================="
    );

    console.error(
      "[FINANCEOS] UNHANDLED PROMISE REJECTION"
    );

    console.error(
      "Reason:",
      reason
    );

    console.error(
      "================================================="
    );
  }
);

// ============================================================
// MONGODB
// ============================================================

async function startServer() {
  try {
    // ----------------------------------------------------------
    // CHECK MONGO URI
    // ----------------------------------------------------------

    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is not configured."
      );
    }

    // ----------------------------------------------------------
    // CONNECT MONGODB
    // ----------------------------------------------------------

    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      "MongoDB connected successfully"
    );

    // ----------------------------------------------------------
    // MONGODB EVENTS
    // ----------------------------------------------------------

    mongoose.connection.on(
      "error",
      (error) => {
        console.error(
          "[MongoDB] Connection error:",
          error.message
        );
      }
    );

    mongoose.connection.on(
      "disconnected",
      () => {
        console.warn(
          "[MongoDB] Disconnected."
        );
      }
    );

    mongoose.connection.on(
      "reconnected",
      () => {
        console.log(
          "[MongoDB] Reconnected successfully."
        );
      }
    );

    // ----------------------------------------------------------
    // VERIFY EMAIL
    // ----------------------------------------------------------

    try {
      await verifyTransporter();

      console.log(
        "SMTP transporter verified successfully"
      );
    } catch (error) {
      console.error(
        "[Startup] SMTP verification failed:",
        error.message
      );
    }

    // ----------------------------------------------------------
    // MIGRATION
    // ----------------------------------------------------------

    try {
      await migrateRecurringSchedules();

      console.log(
        "Recurring schedule migration completed"
      );
    } catch (error) {
      console.error(
        "[Startup] Migration error:",
        error.message
      );
    }

    // ----------------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------------

    try {
      await cleanupLegacySmsPreferences();

      console.log(
        "Legacy SMS cleanup completed"
      );
    } catch (error) {
      console.error(
        "[Startup] SMS cleanup error:",
        error.message
      );
    }

    // ----------------------------------------------------------
    // SCHEDULER
    // ----------------------------------------------------------

    try {
      startScheduler();

      console.log(
        "Scheduler started successfully"
      );
    } catch (error) {
      console.error(
        "[Startup] Scheduler failed:",
        error.message
      );
    }

    // ----------------------------------------------------------
    // START EXPRESS
    // ----------------------------------------------------------

    app.listen(
      PORT,
      () => {
        console.log("");
        console.log(
          "================================================="
        );
        console.log(
          "FinanceOS Backend"
        );
        console.log(
          "-------------------------------------------------"
        );

        console.log(
          `Environment: ${process.env.NODE_ENV || "development"}`
        );

        console.log(
          `Port:        ${PORT}`
        );

        console.log(
          `MongoDB:     connected`
        );

        console.log(
          `Email:       ${
            process.env.EMAIL_USER
              ? "configured"
              : "NOT configured"
          }`
        );

        console.log(
          `Frontend:    ${
            process.env.FRONTEND_URL ||
            "not configured"
          }`
        );

        console.log(
          "Auth API:    /api/auth"
        );

        console.log(
          "Health:      /api/health"
        );

        console.log(
          "================================================="
        );

        console.log("");
      }
    );
  } catch (error) {
    console.error(
      "================================================="
    );

    console.error(
      "FinanceOS backend startup failed"
    );

    console.error(
      "Error:",
      error.message
    );

    console.error(
      "================================================="
    );

    process.exit(1);
  }
}

// ============================================================
// START
// ============================================================

startServer();