// ============================================================
// FINANCEOS - ADMIN AUTHORIZATION MIDDLEWARE
// ============================================================

const adminMiddleware = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    // Support different role names used by the project
    const role = String(
      req.user.role ||
      req.user.userType ||
      req.user.accountType ||
      ""
    ).toLowerCase();

    if (role !== "admin" && role !== "administrator") {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    next();

  } catch (error) {
    console.error(
      "Admin authorization error:",
      error.message
    );

    return res.status(403).json({
      success: false,
      message: "Admin authorization failed.",
    });
  }
};

module.exports = adminMiddleware;