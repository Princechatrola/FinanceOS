// ============================================================
// FINANCEOS - JWT AUTHENTICATION MIDDLEWARE
// ============================================================

const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    // Expected header:
    // Authorization: Bearer <token>
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        code: "AUTH_REQUIRED",
        message: "Authentication required.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        code: "TOKEN_NOT_FOUND",
        message: "Authentication token not found.",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return res.status(401).json({
        success: false,
        code: "INVALID_TOKEN",
        message: "Invalid or expired authentication token.",
      });
    }

    // Extract user ID from token
    const candidateId = decoded.id || decoded._id;
    let user = null;

    if (candidateId && mongoose.Types.ObjectId.isValid(candidateId)) {
      user = await User.findById(candidateId).select("-otp -otpExpiresAt");
    }

    if (!user && decoded.userId) {
      user = await User.findOne({ userId: decoded.userId }).select("-otp -otpExpiresAt");
    }

    if (!user && decoded.email) {
      user = await User.findOne({ email: String(decoded.email).trim().toLowerCase() }).select("-otp -otpExpiresAt");
    }

    // IF USER NO LONGER EXISTS (e.g. permanently deleted by admin)
    if (!user) {
      return res.status(401).json({
        success: false,
        code: "ACCOUNT_DELETED",
        message: "Your FinanceOS account no longer exists. Please create a new account.",
      });
    }

    // CHECK ACCOUNT STATUS
    if (user.status && user.status === "Suspended") {
      return res.status(401).json({
        success: false,
        code: "ACCOUNT_SUSPENDED",
        message: "Your FinanceOS account has been suspended. Please contact support.",
      });
    }

    if (user.status && user.status === "Inactive") {
      return res.status(401).json({
        success: false,
        code: "ACCOUNT_INACTIVE",
        message: "Your FinanceOS account is inactive. Please contact support.",
      });
    }

    // Canonical Admin enforcement: ONLY financeos.system@gmail.com is authorized as Admin
    const isCanonicalAdmin = String(user.email).trim().toLowerCase() === "financeos.system@gmail.com";
    const authoritativeRole = isCanonicalAdmin ? "admin" : "user";

    // Store decoded JWT and live user information on request
    req.user = decoded;
    req.user._id = user._id;
    req.user.id = user._id.toString();
    req.user.userId = user.userId;
    req.user.role = authoritativeRole;
    req.user.email = user.email;
    req.user.status = user.status;
    req.userDoc = user;

    next();
  } catch (error) {
    console.error("JWT authentication error:", error.message);

    return res.status(401).json({
      success: false,
      code: "AUTH_ERROR",
      message: "Authentication error.",
    });
  }
};

module.exports = authMiddleware;