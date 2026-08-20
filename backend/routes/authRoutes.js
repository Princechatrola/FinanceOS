// ============================================================
// FINANCEOS - AUTH ROUTES
// OTP BASED AUTHENTICATION
// ============================================================

const express = require("express");

const User = require("../models/User");
const authMiddleware = require("../middleware/authMiddleware");

console.log(
  "AUTH MIDDLEWARE TYPE:",
  typeof authMiddleware
);

const {
  sendLoginOTP,
  verifyLoginOTP,
} = require("../controllers/authController");

const router = express.Router();


// ============================================================
// SEND LOGIN OTP
//
// POST /api/auth/send-otp
// ============================================================

router.post(
  "/send-otp",
  sendLoginOTP
);


// ============================================================
// VERIFY LOGIN OTP
//
// POST /api/auth/verify-otp
// ============================================================

router.post(
  "/verify-otp",
  verifyLoginOTP
);


// ============================================================
// GENERATE FINANCEOS USER ID
// ============================================================

async function generateUserId() {
  const lastUser = await User.findOne({
    userId: /^FOS-U-/,
  }).sort({
    createdAt: -1,
  });

  let nextNumber = 1;

  if (lastUser?.userId) {
    const currentNumber = Number(
      lastUser.userId.replace("FOS-U-", "")
    );

    if (!Number.isNaN(currentNumber)) {
      nextNumber = currentNumber + 1;
    }
  }

  return `FOS-U-${String(nextNumber).padStart(6, "0")}`;
}


// ============================================================
// SIGN UP
//
// POST /api/auth/signup
//
// No password is used.
// FinanceOS uses Email OTP for authentication.
// ============================================================

router.post(
  "/signup",
  async (req, res) => {
    try {

      const {
        fullName,
        dateOfBirth,
        gender,
        mobileNumber,
        city,
        state,
        email,
      } = req.body;


      // ======================================================
      // REQUIRED FIELDS
      // ======================================================

      if (
        !fullName ||
        !dateOfBirth ||
        !gender ||
        !mobileNumber ||
        !city ||
        !state ||
        !email
      ) {
        return res.status(400).json({
          success: false,
          message:
            "All registration fields are required.",
        });
      }


      // ======================================================
      // NORMALIZE NAME
      // ======================================================

      const normalizedName =
        String(fullName).trim();


      if (!normalizedName) {
        return res.status(400).json({
          success: false,
          message:
            "Full name cannot be empty.",
        });
      }


      // ======================================================
      // NORMALIZE MOBILE
      // ======================================================

      const normalizedMobile =
        String(mobileNumber).trim();


      if (
        !/^[0-9]{10}$/.test(
          normalizedMobile
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Enter a valid 10-digit mobile number.",
        });
      }


      // ======================================================
      // NORMALIZE EMAIL
      // ======================================================

      const normalizedEmail =
        String(email)
          .trim()
          .toLowerCase();


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


      // ======================================================
      // CHECK EXISTING EMAIL
      // ======================================================

      const existingUser =
        await User.findOne({
          email: normalizedEmail,
        });


      if (existingUser) {
        return res.status(409).json({
          success: false,
          message:
            "An account with this email already exists.",
        });
      }


      // ======================================================
      // DATE OF BIRTH
      // ======================================================

      const dob = new Date(
        `${dateOfBirth}T00:00:00`
      );


      if (
        Number.isNaN(
          dob.getTime()
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Enter a valid date of birth.",
        });
      }


      if (
        dob > new Date()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Date of birth cannot be in the future.",
        });
      }


      // ======================================================
      // GENDER
      // ======================================================

      const normalizedGender =
        String(gender).trim();


      const allowedGenders = [
        "male",
        "female",
        "other",
        "prefer-not-to-say",
      ];


      if (
        !allowedGenders.includes(
          normalizedGender
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid gender selected.",
        });
      }


      // ======================================================
      // CITY
      // ======================================================

      const normalizedCity =
        String(city).trim();


      if (!normalizedCity) {
        return res.status(400).json({
          success: false,
          message:
            "City cannot be empty.",
        });
      }


      // ======================================================
      // STATE
      // ======================================================

      const normalizedState =
        String(state).trim();


      if (!normalizedState) {
        return res.status(400).json({
          success: false,
          message:
            "State cannot be empty.",
        });
      }


      // ======================================================
      // GENERATE USER ID
      // ======================================================

      const userId =
        await generateUserId();


      // ======================================================
      // CREATE USER
      // ======================================================

      const user =
        await User.create({

          userId,

          name:
            normalizedName,

          dateOfBirth:
            dob,

          gender:
            normalizedGender,

          phone:
            normalizedMobile,

          city:
            normalizedCity,

          state:
            normalizedState,

          email:
            normalizedEmail,

          role:
            "user",

          status:
            "Active",

          otp:
            null,

          otpExpiresAt:
            null,

        });


      // ======================================================
      // RESPONSE
      // ======================================================

      return res.status(201).json({

        success: true,

        message:
          "FinanceOS account created successfully.",

        user: {

          _id:
            user._id,

          userId:
            user.userId,

          name:
            user.name,

          dateOfBirth:
            user.dateOfBirth,

          gender:
            user.gender,

          phone:
            user.phone,

          city:
            user.city,

          state:
            user.state,

          email:
            user.email,

          role:
            user.role,

          status:
            user.status,

        },

      });

    } catch (error) {

      console.error(
        "Signup error:",
        error
      );


      // ======================================================
      // DUPLICATE KEY
      // ======================================================

      if (
        error.code === 11000
      ) {
        return res.status(409).json({
          success: false,
          message:
            "An account with this information already exists.",
        });
      }


      // ======================================================
      // MONGOOSE VALIDATION
      // ======================================================

      if (
        error.name ===
        "ValidationError"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please provide valid registration information.",
        });
      }


      return res.status(500).json({
        success: false,
        message:
          "Unable to create account.",
      });

    }
  }
);


// ============================================================
// CURRENT LOGGED-IN USER
//
// GET /api/auth/me
// ============================================================

router.get(
  "/me",
  authMiddleware,
  async (req, res) => {

    try {

      // ======================================================
      // GET USER ID FROM JWT
      // ======================================================

      const mongoUserId =
        req.user?.id || req.user?._id;


      if (!mongoUserId) {

        return res.status(401).json({
          success: false,
          message:
            "Invalid authentication token.",
        });

      }


      // ======================================================
      // FIND USER
      // ======================================================

      const user =
        await User.findById(
          mongoUserId
        ).select(
          "-otp -otpExpiresAt"
        );


      // ======================================================
      // USER NOT FOUND
      // ======================================================

      if (!user) {

        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });

      }


      // ======================================================
      // ROLE CHECK
      // ======================================================

      if (
        user.role !== "user"
      ) {

        return res.status(403).json({
          success: false,
          message:
            "Access denied. User account required.",
        });

      }


      // ======================================================
      // STATUS CHECK
      // ======================================================

      if (
        user.status !== "Active"
      ) {

        return res.status(403).json({
          success: false,
          message:
            "Your account is inactive.",
        });

      }


      // ======================================================
      // RESPONSE
      // ======================================================

      return res.status(200).json({

        success: true,

        user: {

          _id:
            user._id,

          userId:
            user.userId,

          name:
            user.name,

          dateOfBirth:
            user.dateOfBirth,

          gender:
            user.gender,

          phone:
            user.phone,

          city:
            user.city,

          state:
            user.state,

          email:
            user.email,

          role:
            user.role,

          status:
            user.status,

          createdAt:
            user.createdAt,

          updatedAt:
            user.updatedAt,

        },

      });

    } catch (error) {

      console.error(
        "Get current user error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to retrieve user information.",

      });

    }

  }
);


// ============================================================
// UPDATE CURRENT USER PROFILE
//
// PUT /api/auth/profile
//
// User can update:
// - Name
// - Date of Birth
// - Gender
// - Mobile Number
// - City
// - State
//
// User cannot update:
// - Email
// - FinanceOS User ID
// - Role
// - Status
// - OTP
// ============================================================

router.put(
  "/profile",
  authMiddleware,
  async (req, res) => {

    try {

      const {
        fullName,
        dateOfBirth,
        gender,
        mobileNumber,
        city,
        state,
      } = req.body;


      // ======================================================
      // GET USER ID FROM JWT
      // ======================================================

      const mongoUserId =
        req.user?.id || req.user?._id;


      if (!mongoUserId) {

        return res.status(401).json({
          success: false,
          message:
            "Invalid authentication token.",
        });

      }


      // ======================================================
      // FIND USER
      // ======================================================

      const user =
        await User.findById(
          mongoUserId
        );


      if (!user) {

        return res.status(404).json({
          success: false,
          message:
            "User not found.",
        });

      }


      // ======================================================
      // ROLE CHECK
      // ======================================================

      if (
        user.role !== "user"
      ) {

        return res.status(403).json({
          success: false,
          message:
            "Access denied. User account required.",
        });

      }


      // ======================================================
      // STATUS CHECK
      // ======================================================

      if (
        user.status !== "Active"
      ) {

        return res.status(403).json({
          success: false,
          message:
            "Your account is inactive.",
        });

      }


      // ======================================================
      // FULL NAME
      // ======================================================

      if (
        fullName !== undefined
      ) {

        const normalizedName =
          String(fullName).trim();


        if (!normalizedName) {

          return res.status(400).json({
            success: false,
            message:
              "Full name cannot be empty.",
          });

        }


        user.name =
          normalizedName;

      }


      // ======================================================
      // MOBILE NUMBER
      // ======================================================

      if (
        mobileNumber !== undefined
      ) {

        const normalizedMobile =
          String(
            mobileNumber
          ).trim();


        if (
          !/^[0-9]{10}$/.test(
            normalizedMobile
          )
        ) {

          return res.status(400).json({
            success: false,
            message:
              "Enter a valid 10-digit mobile number.",
          });

        }


        user.phone =
          normalizedMobile;

      }


      // ======================================================
      // DATE OF BIRTH
      // ======================================================

      if (
        dateOfBirth !== undefined
      ) {

        const normalizedDate =
          String(
            dateOfBirth
          ).trim();


        if (!normalizedDate) {

          return res.status(400).json({
            success: false,
            message:
              "Date of birth is required.",
          });

        }


        const dob =
          new Date(
            `${normalizedDate}T00:00:00`
          );


        if (
          Number.isNaN(
            dob.getTime()
          )
        ) {

          return res.status(400).json({
            success: false,
            message:
              "Enter a valid date of birth.",
          });

        }


        if (
          dob > new Date()
        ) {

          return res.status(400).json({
            success: false,
            message:
              "Date of birth cannot be in the future.",
          });

        }


        user.dateOfBirth =
          dob;

      }


      // ======================================================
      // GENDER
      // ======================================================

      if (
        gender !== undefined
      ) {

        const normalizedGender =
          String(gender).trim();


        const allowedGenders = [
          "male",
          "female",
          "other",
          "prefer-not-to-say",
        ];


        if (
          !allowedGenders.includes(
            normalizedGender
          )
        ) {

          return res.status(400).json({
            success: false,
            message:
              "Invalid gender selected.",
          });

        }


        user.gender =
          normalizedGender;

      }


      // ======================================================
      // CITY
      // ======================================================

      if (
        city !== undefined
      ) {

        const normalizedCity =
          String(city).trim();


        if (!normalizedCity) {

          return res.status(400).json({
            success: false,
            message:
              "City cannot be empty.",
          });

        }


        user.city =
          normalizedCity;

      }


      // ======================================================
      // STATE
      // ======================================================

      if (
        state !== undefined
      ) {

        const normalizedState =
          String(state).trim();


        if (!normalizedState) {

          return res.status(400).json({
            success: false,
            message:
              "State cannot be empty.",
          });

        }


        user.state =
          normalizedState;

      }


      // ======================================================
      // SAVE USER
      // ======================================================

      await user.save();


      // ======================================================
      // RESPONSE
      // ======================================================

      return res.status(200).json({

        success: true,

        message:
          "Profile updated successfully.",

        user: {

          _id:
            user._id,

          userId:
            user.userId,

          name:
            user.name,

          dateOfBirth:
            user.dateOfBirth,

          gender:
            user.gender,

          phone:
            user.phone,

          city:
            user.city,

          state:
            user.state,

          email:
            user.email,

          role:
            user.role,

          status:
            user.status,

          createdAt:
            user.createdAt,

          updatedAt:
            user.updatedAt,

        },

      });

    } catch (error) {

      console.error(
        "Update profile error:",
        error
      );


      return res.status(500).json({

        success: false,

        message:
          "Unable to update profile.",

      });

    }

  }
);


// ============================================================
// AUTH TEST ROUTE
//
// GET /api/auth
// ============================================================

router.get(
  "/",
  (req, res) => {

    res.status(200).json({

      success: true,

      message:
        "FinanceOS Auth API is working.",

    });

  }
);


// ============================================================
// EXPORT ROUTER
// ============================================================

module.exports = router;