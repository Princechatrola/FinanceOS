// ============================================================
// FINANCEOS - AUTH CONTROLLER
// OTP BASED AUTHENTICATION 
// ============================================================

const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

const User = require("../models/User");
const { logActivity } = require("../utils/activityLogger");

// ============================================================
// ADMIN EMAILS
// ============================================================

const ADMIN_EMAILS = [
  "admin@financeos.com",
  ...(process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL.toLowerCase()] : []),
  ...(process.env.EMAIL_USER ? [process.env.EMAIL_USER.toLowerCase()] : []),
];


// ============================================================
// CHECK EMAIL CONFIGURATION
// ============================================================

console.log("=================================");
console.log("FINANCEOS EMAIL CONFIGURATION");
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log(
  "EMAIL_PASSWORD:",
  process.env.EMAIL_PASSWORD ? "LOADED" : "NOT FOUND"
);
console.log("=================================");


// ============================================================
// CENTRALIZED EMAIL SERVICE
// ============================================================

const { sendOTPEmail, verifyTransporter } = require("../services/emailService");

// IN-FLIGHT REQUEST SET (PREVENTS DUPLICATE CONCURRENT SENDS)
const inflightOtpRequests = new Set();



// ============================================================
// GENERATE 6 DIGIT OTP (CRYPTOGRAPHICALLY SECURE)
// ============================================================

function generateOTP() {
  return crypto.randomInt(100000, 1000000).toString();
}


// ============================================================
// GET USER ROLE
// ============================================================

function getUserRole(email, existingUser = null) {
  if (existingUser?.role === "admin") {
    return "admin";
  }

  const normalizedEmail = String(email)
    .trim()
    .toLowerCase();

  if (ADMIN_EMAILS.includes(normalizedEmail)) {
    return "admin";
  }

  return existingUser?.role || "user";
}


// ============================================================
// SEND LOGIN OTP
//
// POST /api/auth/send-otp
// ============================================================

const sendLoginOTP = async (req, res) => {
  try {

    console.log("=================================");
    console.log("SEND OTP REQUEST");


    // ========================================================
    // GET REQUEST DATA
    // ========================================================

    const { email } = req.body;


    console.log(
      "Email:",
      email
    );


    // ========================================================
    // VALIDATE EMAIL
    // ========================================================

    if (!email) {

      return res.status(400).json({
        success: false,
        message:
          "Email address is required.",
      });

    }


    // ========================================================
    // NORMALIZE EMAIL
    // ========================================================

    const normalizedEmail =
      String(email)
        .trim()
        .toLowerCase();


    // ========================================================
    // CONCURRENT IN-FLIGHT REQUEST CHECK
    // ========================================================

    if (inflightOtpRequests.has(normalizedEmail)) {
      return res.status(429).json({
        success: false,
        message:
          "An OTP request is already being processed. Please wait a moment.",
      });
    }


    // ========================================================
    // EMAIL FORMAT VALIDATION
    // ========================================================

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (
      !emailRegex.test(
        normalizedEmail
      )
    ) {

      return res.status(400).json({
        success: false,
        message:
          "Enter a valid email address.",
      });

    }


    // ========================================================
    // FIND USER
    // ========================================================

    const user =
      await User.findOne({
        email: normalizedEmail,
      });


    // ========================================================
    // USER NOT FOUND
    // ========================================================

    if (!user) {

      console.log(
        "User not found:",
        normalizedEmail
      );

      return res.status(404).json({
        success: false,
        message:
          "No account found with this email address.",
      });

    }


    // ========================================================
    // DETERMINE ROLE
    // Admin emails configured via ADMIN_EMAILS or role in DB
    // ========================================================

    const role =
      getUserRole(normalizedEmail, user);


    console.log(
      "User found:",
      user.email
    );

    console.log(
      "Assigned role:",
      role
    );

    console.log(
      "Status:",
      user.status
    );


    // ========================================================
    // ACCOUNT STATUS CHECK
    // ========================================================

    if (
      user.status !== "Active"
    ) {

      return res.status(403).json({
        success: false,
        message:
          "Your account is inactive.",
      });

    }


    // ========================================================
    // OTP RATE LIMIT / COOLDOWN CHECK (30 SECONDS COOLDOWN)
    // ========================================================

    if (user.otpExpiresAt) {
      const msRemaining = user.otpExpiresAt.getTime() - Date.now();
      // OTP has 5 minutes validity (300 seconds).
      // If remaining time is greater than 270 seconds, request was made < 30 seconds ago.
      if (msRemaining > (5 * 60 - 30) * 1000) {
        const cooldownSeconds = Math.ceil(
          (msRemaining - (5 * 60 - 30) * 1000) / 1000
        );
        return res.status(429).json({
          success: false,
          message: `Please wait ${cooldownSeconds} seconds before requesting another OTP.`,
        });
      }
    }


    // ========================================================
    // KEEP ROLE IN DATABASE SYNCHRONIZED
    // ========================================================

    if (
      user.role !== role
    ) {

      user.role = role;

      await user.save();

    }


    // ========================================================
    // GENERATE OTP
    // ========================================================

    const otp =
      generateOTP();


    // ========================================================
    // DEVELOPMENT ONLY — DISPLAY OTP IN TERMINAL
    //
    // This block prints the OTP to the backend terminal so the
    // developer can complete login without phone access during
    // local development and demos.
    //
    // SECURITY: Automatically disabled in production even if
    // SHOW_OTP_IN_TERMINAL is set to true.
    //
    // The email is STILL sent normally via Nodemailer.
    // ========================================================

    if (
      process.env.NODE_ENV !== "production" &&
      process.env.SHOW_OTP_IN_TERMINAL === "true"
    ) {
      console.log("==================================================");
      console.log("[FINANCEOS OTP - DEVELOPMENT ONLY]");
      console.log(`Email: ${normalizedEmail}`);
      console.log(`OTP: ${otp}`);
      console.log("Expires: 5 minutes");
      console.log("==================================================");
    }


    // ========================================================
    // OTP EXPIRATION
    //
    // OTP valid for 5 minutes
    // ========================================================

    const otpExpiresAt =
      new Date(
        Date.now() +
        5 * 60 * 1000
      );


    // ========================================================
    // SAVE OTP IN DATABASE
    // ========================================================

    await User.findByIdAndUpdate(user._id, {
      $set: {
        otp,
        otpExpiresAt,
        role,
      },
    });

    // Mark request as in-flight
    inflightOtpRequests.add(normalizedEmail);


    // ========================================================
    // ATTEMPT EMAIL DISPATCH VIA CENTRALIZED SERVICE
    //
    // In development mode, an email failure does NOT destroy
    // the legitimate generated OTP from MongoDB.
    // The developer can use the OTP printed to the terminal.
    // ========================================================

    let emailSent = false;
    let emailErrorMsg = null;

    try {
      const emailResult = await sendOTPEmail(normalizedEmail, otp);
      emailSent = emailResult && emailResult.success === true;
      if (!emailSent) {
        emailErrorMsg = emailResult?.error || "SMTP delivery failure";
      }
    } catch (mailErr) {
      emailSent = false;
      emailErrorMsg = mailErr.message || "Email service exception";
    }

    if (emailSent) {
      console.log(`[AUTH] OTP email successfully delivered to ${normalizedEmail}`);
      console.log("Assigned role:", role);
      console.log("=================================");

      return res.status(200).json({
        success: true,
        emailSent: true,
        message: "OTP sent successfully to your email.",
      });
    }

    // Email delivery failed
    console.error(
      `[AUTH] Send OTP email failed for ${normalizedEmail}:`,
      emailErrorMsg
    );

    if (process.env.NODE_ENV !== "production") {
      // DEVELOPMENT / EXAM DEMO MODE:
      // The OTP was generated and saved to MongoDB. The terminal displays it.
      // Do NOT roll back the OTP in development!
      console.log(
        `[AUTH] Development mode active: OTP preserved in database. Use terminal OTP to log in.`
      );

      return res.status(200).json({
        success: true,
        emailSent: false,
        message:
          "OTP generated. Email delivery failed. Development terminal OTP is available.",
      });
    }

    // PRODUCTION MODE: Roll back OTP if email delivery failed
    try {
      await User.findByIdAndUpdate(user._id, {
        $set: { otp: null, otpExpiresAt: null },
      });
    } catch (_) {}

    return res.status(500).json({
      success: false,
      message: "Unable to send OTP email. Please try again.",
    });

  } catch (error) {
    console.error(
      "[AUTH] Send Login OTP unexpected error:",
      error.message || error
    );

    return res.status(500).json({
      success: false,
      message: "Internal server error while processing OTP request.",
    });

  } finally {
    try {
      const email = req.body?.email;
      if (email) {
        const normalized = String(email).trim().toLowerCase();
        inflightOtpRequests.delete(normalized);
      }
    } catch (_) { }
  }
};


// ============================================================
// VERIFY LOGIN OTP
//
// POST /api/auth/verify-otp
// ============================================================

const verifyLoginOTP = async (req, res) => {

  try {

    // ========================================================
    // GET REQUEST DATA
    // ========================================================

    const {
      email,
      otp,
    } = req.body;


    // ========================================================
    // VALIDATE REQUEST
    // ========================================================

    if (
      !email ||
      !otp
    ) {

      return res.status(400).json({

        success: false,

        message:
          "Email and OTP are required.",

      });

    }


    // ========================================================
    // NORMALIZE EMAIL
    // ========================================================

    const normalizedEmail =
      String(email)
        .trim()
        .toLowerCase();


    // ========================================================
    // NORMALIZE OTP
    // ========================================================

    const normalizedOTP =
      String(otp).trim();


    // ========================================================
    // OTP FORMAT CHECK
    // ========================================================

    if (
      !/^[0-9]{6}$/.test(
        normalizedOTP
      )
    ) {

      return res.status(400).json({

        success: false,

        message:
          "OTP must be a 6-digit number.",

      });

    }


    // ========================================================
    // FIND USER
    // ========================================================

    const user =
      await User.findOne({
        email: normalizedEmail,
      });


    // ========================================================
    // USER NOT FOUND
    // ========================================================

    if (!user) {

      return res.status(404).json({

        success: false,

        message:
          "User account not found.",

      });

    }


    // ========================================================
    // ACCOUNT STATUS
    // ========================================================

    if (
      user.status !== "Active"
    ) {

      return res.status(403).json({

        success: false,

        message:
          "Your account is inactive.",

      });

    }


    // ========================================================
    // CHECK OTP EXISTS
    // ========================================================

    if (!user.otp) {

      return res.status(401).json({

        success: false,

        message:
          "No active OTP found. Please request a new OTP.",

      });

    }


    // ========================================================
    // CHECK OTP EXPIRATION FIRST
    // ========================================================

    if (
      !user.otpExpiresAt ||
      user.otpExpiresAt < new Date()
    ) {

      user.otp = null;

      user.otpExpiresAt = null;

      await user.save();


      return res.status(401).json({

        success: false,

        message:
          "OTP has expired. Please request a new OTP.",

      });

    }


    // ========================================================
    // CHECK OTP
    // ========================================================

    if (
      String(user.otp) !==
      normalizedOTP
    ) {

      return res.status(401).json({

        success: false,

        message:
          "Invalid OTP.",

      });

    }


    // ========================================================
    // DETERMINE ROLE AFTER OTP VERIFICATION
    // Admin emails configured via ADMIN_EMAILS or role in DB
    // ========================================================

    const role =
      getUserRole(normalizedEmail, user);


    console.log(
      "================================="
    );

    console.log(
      "OTP VERIFIED"
    );

    console.log(
      "Email:",
      normalizedEmail
    );

    console.log(
      "Assigned Role:",
      role
    );


    // ========================================================
    // CLEAR OTP AFTER SUCCESSFUL VERIFICATION & SYNC ROLE
    // ========================================================

    await User.findByIdAndUpdate(user._id, {
      $set: {
        otp: null,
        otpExpiresAt: null,
        role,
      },
    });


    // ========================================================
    // CHECK JWT SECRET
    // ========================================================

    if (
      !process.env.JWT_SECRET
    ) {

      console.error(
        "JWT_SECRET is missing from .env"
      );

      return res.status(500).json({

        success: false,

        message:
          "Server authentication configuration is missing.",

      });

    }


    // ========================================================
    // GENERATE JWT
    // ========================================================

    const token =
      jwt.sign(

        {
          id:
            user._id.toString(),

          userId:
            user.userId,

          email:
            user.email,

          role:
            role,
        },

        process.env.JWT_SECRET,

        {
          expiresIn:
            "7d",
        }

      );


    // ========================================================
    // SUCCESS RESPONSE
    // ========================================================

    console.log(
      "Login successful."
    );

    console.log(
      "Role:",
      role
    );

    console.log(
      "================================="
    );


    return res.status(200).json({

      success: true,

      message:
        "Login successful.",

      token,

      user: {

        _id:
          user._id,

        userId:
          user.userId,

        name:
          user.name ||
          user.fullName,

        dateOfBirth:
          user.dateOfBirth,

        gender:
          user.gender,

        phone:
          user.phone ||
          user.mobileNumber,

        city:
          user.city,

        state:
          user.state,

        email:
          user.email,

        // IMPORTANT
        role:
          role,

        status:
          user.status,

      },

    });


  } catch (error) {

    console.error(
      "Verify Login OTP Error:",
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Unable to verify OTP.",

    });

  }

};


// ============================================================
// DEVELOPMENT LOGIN FALLBACK (EXAM/DEMO ONLY)
//
// POST /api/auth/dev-login
// Strictly gated by:
// 1. NODE_ENV === "development"
// 2. DEV_AUTH_BYPASS === "true"
// Uses real MongoDB user and authentic role.
// ============================================================

const devLogin = async (req, res) => {
  try {
    // 1. Strictly verify development environment and explicit bypass flag
    if (
      process.env.NODE_ENV !== "development" ||
      process.env.DEV_AUTH_BYPASS !== "true"
    ) {
      return res.status(403).json({
        success: false,
        message: "Development login is disabled.",
      });
    }

    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email address is required.",
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // 2. Verify real MongoDB user exists (no fake data or arbitrary accounts)
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No FinanceOS account was found for this email.",
      });
    }

    if (user.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: "Your account is inactive.",
      });
    }

    // 3. Resolve role from real user data
    const role = getUserRole(normalizedEmail, user);

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        success: false,
        message: "Server authentication configuration is missing.",
      });
    }

    // 4. Issue standard authenticated JWT token
    const token = jwt.sign(
      {
        id: user._id.toString(),
        userId: user.userId,
        email: user.email,
        role: role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    await logActivity({
      userId: user._id,
      userName: user.name,
      userEmail: user.email,
      type: "Sign In",
      description: "Signed in via development fallback",
    });

    console.log(`[AUTH] Dev login successful for ${normalizedEmail} (Role: ${role})`);

    return res.status(200).json({
      success: true,
      message: "Development login successful.",
      token,
      user: {
        _id: user._id,
        userId: user.userId,
        name: user.name || user.fullName,
        dateOfBirth: user.dateOfBirth,
        gender: user.gender,
        phone: user.phone || user.mobileNumber,
        city: user.city,
        state: user.state,
        email: user.email,
        role: role,
        status: user.status,
      },
    });
  } catch (error) {
    console.error("[AUTH] Dev login error:", error.message || error);
    return res.status(500).json({
      success: false,
      message: "Unable to process development login.",
    });
  }
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {

  sendLoginOTP,

  verifyLoginOTP,

  devLogin,

};