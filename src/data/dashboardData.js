/*
  ============================================================
  FINANCEOS - TEMPORARY INITIAL DATA
  ============================================================

  Purpose:
  This file contains the INITIAL frontend data used while
  FinanceOS does not yet have a backend/database.

  IMPORTANT:

  This is NOT permanent user data.

  Later:

  MongoDB
      ↓
  Backend API
      ↓
  FinanceProvider
      ↓
  FinanceOS Pages

  will replace this temporary initial data.

  RULE:

  We never create fake financial items for the user.

  If the user has not created:
  - a Saving Goal
  - a Loan
  - an Investment
  - an Insurance Policy

  then those collections remain EMPTY.

  The Dashboard should display an item only after the user
  actually creates it.
*/


// ============================================================
// 1. TEMPORARY USER INFORMATION
// ============================================================
//
// Later this will come from the authenticated user's account.
// ============================================================

export const userData = {
  id: "user_001",
  name: "Dip",
};


// ============================================================
// 2. MONTHLY FINANCE
// ============================================================
//
// Monthly finance contains RAW user-entered information.
//
// We store:
//
// - Month
// - Year
// - Income
// - Regular Expenses
//
// We DO NOT store:
//
// - Monthly Savings
// - Available to Allocate
//
// because those are calculated values.
//
// Later this information will be loaded from MongoDB for the
// selected month.
// ============================================================

export const monthlyFinance = {
  month: 7,
  year: 2026,

  // Temporary development values.
  // The Monthly Finance page can update these.
  income: 25000,
  expenses: 18000,
};


// ============================================================
// 3. SAVING GOALS
// ============================================================
//
// Examples:
//
// - Phone
// - Car
// - Travel
// - Emergency Fund
//
// IMPORTANT:
//
// A new user starts with NO saving goals.
//
// When the user creates a goal from the Saving Goals page,
// that goal will be added here through FinanceProvider.
//
// Later the goal will be saved in MongoDB.
//
// Example FUTURE object:
//
// {
//   id: "goal_001",
//   name: "Phone",
//   targetAmount: 100000,
//   savedAmount: 0,
//   monthlyAllocation: 5000,
//   durationMonths: 20,
//   status: "Active"
// }
// ============================================================

export const savingGoals = [];


// ============================================================
// 4. LIABILITIES
// ============================================================
//
// Examples:
//
// - Personal Loan
// - Home Loan
// - Vehicle Loan
// - Credit Card Outstanding
// - Other Liability
//
// A new user starts with NO liabilities.
//
// A liability should appear on the Dashboard only after the
// user adds one.
// ============================================================

export const liabilities = [];


// ============================================================
// 5. INVESTMENTS
// ============================================================
//
// Examples:
//
// - SIP
// - Mutual Fund
// - Gold Investment
// - Fixed Deposit
// - Recurring Deposit
// - Other Investment
//
// A new user starts with NO investments.
// ============================================================

export const investments = [];


// ============================================================
// 6. INSURANCE POLICIES
// ============================================================
//
// Examples:
//
// - LIC / Life Insurance
// - Health Insurance
// - Other Policy
//
// A new user starts with NO insurance policies.
// ============================================================

export const insurancePolicies = [];