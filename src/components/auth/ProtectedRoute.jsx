// ============================================================
// FINANCEOS - PROTECTED USER ROUTE
// ============================================================

import { Navigate } from "react-router-dom";


function ProtectedRoute({ children }) {

  // ==========================================================
  // GET AUTHENTICATION DATA
  // ==========================================================

  const token =
    localStorage.getItem("financeos_token") ||
    sessionStorage.getItem("financeos_token");

  const storedUser =
    localStorage.getItem("financeos_user") ||
    sessionStorage.getItem("financeos_user");


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

    localStorage.removeItem("financeos_token");
    localStorage.removeItem("financeos_user");

    sessionStorage.removeItem("financeos_token");
    sessionStorage.removeItem("financeos_user");

    return (
      <Navigate
        to="/signin"
        replace
      />
    );

  }


  // ==========================================================
  // USER ROLE CHECK
  // ==========================================================

  if (!user || user.role !== "user") {

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


export default ProtectedRoute;