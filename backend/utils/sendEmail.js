// ============================================================
// FINANCEOS - OTP EMAIL DELEGATOR
// Delegates directly to centralized services/emailService.js
// ============================================================

const { sendOTPEmail } = require("../services/emailService");

module.exports = sendOTPEmail;