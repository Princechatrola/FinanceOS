// ============================================================
// FINANCEOS - APP.JSX
// ============================================================

import { Routes, Route, Navigate } from "react-router-dom";


// ============================================================
// AUTH
// ============================================================

import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";


// ============================================================
// PUBLIC PAGES
// ============================================================

import Home from "./pages/Home.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";


// ============================================================
// USER PAGES
// ============================================================

import UserDashboard from "./pages/UserDashboard.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import MonthlyFinance from "./pages/MonthlyFinance.jsx";
import SavingGoals from "./pages/SavingGoals.jsx";
import PlansCommitments from "./pages/PlansCommitments.jsx";
import FinancialCalendar from "./pages/FinancialCalendar.jsx";
import Reports from "./pages/Reports.jsx";
import Profile from "./pages/Profile.jsx";


// ============================================================
// ADMIN DASHBOARD
// ============================================================

import AdminDashboard from "./pages/AdminDashboard.jsx";

// ============================================================
// ADMIN - USER MANAGEMENT
// ============================================================

import AdminUsers from "./pages/AdminUsers.jsx";
import AdminCreateUser from "./pages/AdminCreateUser.jsx";
import AdminUserDetails from "./pages/AdminUserDetails.jsx";
import AdminEditUser from "./pages/AdminEditUser.jsx";
import AdminUserAccess from "./pages/AdminUserAccess.jsx";


// ============================================================
// SUPER ADMIN - ADMINISTRATOR MANAGEMENT
// ============================================================

import AdminAdministrators from "./pages/AdminAdministrators.jsx";
import AdminCreateAdministrator from "./pages/AdminCreateAdministrator.jsx";
import AdminAdministratorDetails from "./pages/AdminAdministratorDetails.jsx";
import AdminEditAdministrator from "./pages/AdminEditAdministrator.jsx";
import AdminAdministratorAccess from "./pages/AdminAdministratorAccess.jsx";


// ============================================================
// ADMIN - USER ACTIVITY
// ============================================================

import AdminActivity from "./pages/AdminActivity.jsx";


// ============================================================
// ADMIN - REPORTS
// ============================================================

import AdminReports from "./pages/AdminReports.jsx";


// ============================================================
// ADMIN - MESSAGES
// ============================================================

import AdminMessages from "./pages/AdminMessages.jsx";


// ============================================================
// ADMIN - AUTOMATIC USER REMINDERS
// ============================================================

import AdminReminders from "./pages/AdminReminders.jsx";


// ============================================================
// APP
// ============================================================

function App() {
  return (
    <Routes>

      {/* ======================================================
          PUBLIC ROUTES
      ====================================================== */}

      <Route
        path="/"
        element={<Home />}
      />

      <Route
        path="/signin"
        element={<SignIn />}
      />

      <Route
        path="/login"
        element={
          <Navigate
            to="/signin"
            replace
          />
        }
      />

      <Route
        path="/signup"
        element={<SignUp />}
      />


      {/* ======================================================
          PROTECTED USER ROUTES
      ====================================================== */}

      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        }
      />


      {/* USER DASHBOARD */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        }
      />


      {/* ALTERNATIVE USER DASHBOARD URL */}

      <Route
        path="/user/dashboard"
        element={
          <ProtectedRoute>
            <UserDashboard />
          </ProtectedRoute>
        }
      />


      {/* MONTHLY FINANCE */}

      <Route
        path="/monthly-finance"
        element={
          <ProtectedRoute>
            <MonthlyFinance />
          </ProtectedRoute>
        }
      />


      {/* SAVING GOALS */}

      <Route
        path="/saving-goals"
        element={
          <ProtectedRoute>
            <SavingGoals />
          </ProtectedRoute>
        }
      />


      {/* PLANS & COMMITMENTS */}

      <Route
        path="/plans-commitments"
        element={
          <ProtectedRoute>
            <PlansCommitments />
          </ProtectedRoute>
        }
      />


      {/* FINANCIAL CALENDAR */}

      <Route
        path="/financial-calendar"
        element={
          <ProtectedRoute>
            <FinancialCalendar />
          </ProtectedRoute>
        }
      />


      {/* REPORTS */}

      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        }
      />


      {/* PROFILE */}

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />


      {/* ======================================================
          ADMIN ROOT
          Admin authentication will be handled separately.
      ====================================================== */}

      <Route
        path="/admin"
        element={
          <Navigate
            to="/admin-dashboard"
            replace
          />
        }
      />


      {/* ======================================================
          ADMIN DASHBOARD
      ====================================================== */}

      <Route
        path="/admin/dashboard"
        element={<AdminDashboard />}
      />


      {/* ======================================================
          ADMIN - USER MANAGEMENT
      ====================================================== */}

      <Route
        path="/admin/users"
        element={<AdminUsers />}
      />

      <Route
        path="/admin/users/create"
        element={<AdminCreateUser />}
      />

      <Route
        path="/admin/users/:id"
        element={<AdminUserDetails />}
      />

      <Route
        path="/admin/users/:id/edit"
        element={<AdminEditUser />}
      />

      <Route
        path="/admin/users/:id/access"
        element={<AdminUserAccess />}
      />


      {/* ======================================================
          SUPER ADMIN - ADMINISTRATOR MANAGEMENT
      ====================================================== */}

      <Route
        path="/admin/administrators"
        element={<AdminAdministrators />}
      />

      <Route
        path="/admin/administrators/create"
        element={<AdminCreateAdministrator />}
      />

      <Route
        path="/admin/administrators/:id"
        element={<AdminAdministratorDetails />}
      />

      <Route
        path="/admin/administrators/:id/edit"
        element={<AdminEditAdministrator />}
      />

      <Route
        path="/admin/administrators/:id/access"
        element={<AdminAdministratorAccess />}
      />


      {/* ======================================================
          ADMIN - USER ACTIVITY
      ====================================================== */}

      <Route
        path="/admin/activity"
        element={<AdminActivity />}
      />


      {/* ======================================================
          ADMIN - REPORTS
      ====================================================== */}

      <Route
        path="/admin/reports"
        element={<AdminReports />}
      />


      {/* ======================================================
          ADMIN - MESSAGES
      ====================================================== */}

      <Route
        path="/admin/messages"
        element={<AdminMessages />}
      />


      {/* ======================================================
          ADMIN - AUTOMATIC REMINDERS
      ====================================================== */}

      <Route
        path="/admin/reminders"
        element={<AdminReminders />}
      />


      {/* ======================================================
          ADMIN SETTINGS
          Temporary redirect until AdminSettings.jsx exists.
      ====================================================== */}

      <Route
        path="/admin/settings"
        element={
          <Navigate
            to="/admin/dashboard"
            replace
          />
        }
      />


      {/* ======================================================
          404 / UNKNOWN ROUTE
      ====================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  );
}


// ============================================================
// EXPORT
// ============================================================

export default App;