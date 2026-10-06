// ============================================================
// FINANCEOS - PROTECTED ADMIN ROUTE
// ============================================================

import { Navigate } from "react-router-dom";

function AdminProtectedRoute({ children }) {

  // ==========================================================
  // GET AUTHENTICATION DATA (SESSION & LOCAL STORAGE)
  // ==========================================================

  const token =
    sessionStorage.getItem("financeos_token") ||
    localStorage.getItem("financeos_token");
  const storedUser =
    sessionStorage.getItem("financeos_user") ||
    localStorage.getItem("financeos_user");


  // ==========================================================
  // NOT LOGGED IN
  // ==========================================================

  if (!token || !storedUser) {
    return (
      <Navigate
        to="/signin"
        replace
      />
    );
  }


  // ==========================================================
  // READ USER
  // ==========================================================

  let user;

  try {
    user = JSON.parse(storedUser);
  } catch (error) {
    console.error(
      "Invalid FinanceOS user data:",
      error
    );

    sessionStorage.removeItem("financeos_token");
    sessionStorage.removeItem("financeos_user");
    localStorage.removeItem("financeos_token");
    localStorage.removeItem("financeos_user");

    return (
      <Navigate
        to="/signin"
        replace
      />
    );
  }


  // ==========================================================
  // USER ROLE CHECK (ADMIN)
  // ==========================================================

  const userRole = (user?.role || "").toLowerCase();

  if (!user || (userRole !== "admin" && userRole !== "administrator")) {
    if (userRole === "user") {
      return (
        <Navigate
          to="/dashboard"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/signin"
        replace
      />
    );
  }


  // ==========================================================
  // AUTHORIZED
  // ==========================================================

  return children;
}

export default AdminProtectedRoute;
