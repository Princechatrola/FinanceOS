// ============================================================
// FINANCEOS - JWT AUTHENTICATION MIDDLEWARE
// ============================================================

const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // Expected header:
    // Authorization: Bearer <token>
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Authentication token not found.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Store decoded JWT information on request
    req.user = decoded;

    next();
  } catch (error) {
    console.error("JWT authentication error:", error.message);

    return res.status(401).json({
      message: "Invalid or expired authentication token.",
    });
  }
};

module.exports = authMiddleware;