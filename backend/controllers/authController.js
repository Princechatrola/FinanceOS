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
// NODEMAILER TRANSPORTER (POOLED + SECURE DIRECT TLS)
// ============================================================

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000,
  rateLimit: 5,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  connectionTimeout: 8000,
  greetingTimeout: 4000,
  socketTimeout: 8000,
});

// IN-FLIGHT REQUEST SET (PREVENTS DUPLICATE CONCURRENT SENDS)
const inflightOtpRequests = new Set();


// ============================================================
// VERIFY EMAIL CONNECTION
// ============================================================

transporter.verify((error) => {
  if (error) {
    console.error(
      "Email transporter error:",
      error.message
    );
  } else {
    console.log(
      "FinanceOS email server is ready."
    );
  }
});


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
    // EMAIL OPTIONS
    // ========================================================

    const mailOptions = {

      from:
        `"FinanceOS" <${process.env.EMAIL_USER}>`,

      to:
        normalizedEmail,

      subject:
        "FinanceOS - Your Login OTP",


      // ======================================================
      // PLAIN TEXT EMAIL
      // ======================================================

      text: `
Hello ${user.name || "User"},

Your FinanceOS login OTP is:

${otp}

This OTP will expire in 5 minutes.

If you did not request this OTP, please ignore this email.

Regards,
FinanceOS Team
      `,


      // ======================================================
      // HTML EMAIL
      // ======================================================

      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 600px;
          margin: 30px auto;
          padding: 30px;
          border: 1px solid #e1e7dc;
          border-radius: 15px;
          background-color: #ffffff;
        ">

          <h2 style="
            color: #43822e;
            margin-bottom: 10px;
          ">
            FinanceOS
          </h2>


          <p>
            Hello ${user.name || "User"},
          </p>


          <p>
            Your FinanceOS login OTP is:
          </p>


          <div style="
            font-size: 32px;
            font-weight: bold;
            letter-spacing: 8px;
            color: #173b2b;
            background: #edf5e8;
            padding: 20px;
            text-align: center;
            border-radius: 10px;
            margin: 20px 0;
          ">
            ${otp}
          </div>


          <p>
            This OTP will expire in
            <strong>5 minutes</strong>.
          </p>


          <p style="
            color: #777;
          ">
            If you did not request this OTP,
            please ignore this email.
          </p>


          <hr />


          <p style="
            font-size: 12px;
            color: #888;
          ">
            FinanceOS - Manage Today, Secure Tomorrow
          </p>

        </div>
      `,
    };


    // ========================================================
    // SEND EMAIL
    // ========================================================

    await transporter.sendMail(
      mailOptions
    );


    // ========================================================
    // SUCCESS LOG
    // ========================================================

    console.log(
      "OTP email sent successfully."
    );

    console.log(
      "Assigned role:",
      role
    );

    console.log(
      "================================="
    );


    // ========================================================
    // RESPONSE
    // ========================================================

    return res.status(200).json({

      success: true,

      message:
        "OTP sent successfully to your email.",

    });


  } catch (error) {

    console.error(
      "Send Login OTP Error:",
      error.message || error
    );

    // Rollback OTP in database if email dispatch failed
    try {
      const email = req.body?.email;
      if (email) {
        const normalized = String(email).trim().toLowerCase();
        await User.findOneAndUpdate(
          { email: normalized },
          { $set: { otp: null, otpExpiresAt: null } }
        );
      }
    } catch (_) {}

    return res.status(500).json({

      success: false,

      message:
        "Unable to send OTP. Please try again.",

    });

  } finally {
    try {
      const email = req.body?.email;
      if (email) {
        const normalized = String(email).trim().toLowerCase();
        inflightOtpRequests.delete(normalized);
      }
    } catch (_) {}
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
// EXPORT
// ============================================================

module.exports = {

  sendLoginOTP,

  verifyLoginOTP,

};