// ============================================================
// FINANCEOS - AUTH CONTROLLER
// OTP BASED AUTHENTICATION
// ADMIN EMAIL:
// princepatel0570@gmail.com
// ============================================================

const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const User = require("../models/User");

// ============================================================
// ADMIN EMAIL
// ============================================================

const ADMIN_EMAIL = "princepatel0570@gmail.com";


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
// NODEMAILER TRANSPORTER
// ============================================================

const transporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});


// ============================================================
// VERIFY EMAIL CONNECTION
// ============================================================

transporter.verify((error, success) => {
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
// GENERATE 6 DIGIT OTP
// ============================================================

function generateOTP() {
  return Math.floor(
    100000 + Math.random() * 900000
  ).toString();
}


// ============================================================
// GET USER ROLE
//
// ONLY THIS EMAIL IS ADMIN:
// princepatel0570@gmail.com
//
// EVERY OTHER USER = user
// ============================================================

function getUserRole(email) {
  const normalizedEmail = String(email)
    .trim()
    .toLowerCase();

  if (
    normalizedEmail === ADMIN_EMAIL.toLowerCase()
  ) {
    return "admin";
  }

  return "user";
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
    //
    // Admin email:
    // princepatel0570@gmail.com
    //
    // Everyone else:
    // user
    // ========================================================

    const role =
      getUserRole(normalizedEmail);


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


    console.log(
      "OTP generated:",
      otp
    );


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

    user.otp =
      otp;

    user.otpExpiresAt =
      otpExpiresAt;


    await user.save();


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
      error
    );


    return res.status(500).json({

      success: false,

      message:
        "Unable to send OTP. Please try again.",

    });

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
    //
    // THIS IS THE IMPORTANT PART
    //
    // princepatel0570@gmail.com
    //       ↓
    //     ADMIN
    //
    // Every other email
    //       ↓
    //      USER
    // ========================================================

    const role =
      getUserRole(normalizedEmail);


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
    // UPDATE USER ROLE
    // ========================================================

    user.role =
      role;


    // ========================================================
    // CLEAR OTP AFTER SUCCESSFUL VERIFICATION
    // ========================================================

    user.otp = null;

    user.otpExpiresAt = null;


    await user.save();


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