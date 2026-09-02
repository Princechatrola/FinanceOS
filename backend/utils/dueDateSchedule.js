// ============================================================
// FINANCEOS - RECURRING DUE DATE SCHEDULE UTILITY
// ============================================================
//
// Single source of truth for deriving due dates from a stored
// recurring schedule (dueDay + frequency + startDate + endDate).
//
// Rules:
//   1. dueDay is clamped to the last valid day of the month
//      (e.g., dueDay 31 in February → 28 or 29).
//   2. Frequency controls which months have a due date.
//   3. startDate controls the first eligible due date.
//   4. endDate / maturityDate controls the last eligible due date.
//   5. The backend always derives the due date — never trust
//      the client-supplied dueDate for recurring plans.
//
// ============================================================

/**
 * Calculate the actual due date for a given month, clamping
 * the day to the last valid day of that month.
 *
 * @param {number} dueDay  - Configured day of month (1-31)
 * @param {number} year    - Target year (e.g. 2026)
 * @param {number} month   - Target month (1-12)
 * @returns {Date}         - Valid Date object for that month
 */
function calculateDueDateForMonth(dueDay, year, month) {
  const day = Number(dueDay) || 1;
  const y = Number(year);
  const m = Number(month);

  // Last day of the target month
  const lastDay = new Date(y, m, 0).getDate();

  // Clamp dueDay to the last valid day
  const clampedDay = Math.min(Math.max(day, 1), lastDay);

  return new Date(y, m - 1, clampedDay);
}

/**
 * Format a Date to ISO date string YYYY-MM-DD (local, no TZ shift).
 */
function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Check whether a recurring schedule is due in the given month.
 *
 * Supports: Monthly, Quarterly, Half-Yearly, Yearly.
 *
 * For non-monthly frequencies, the start month is used as the
 * anchor. A contribution is due only in months that are a
 * multiple of the frequency interval from the start month.
 *
 * @param {string} frequency  - "Monthly", "Quarterly", "Half-Yearly", "Yearly"
 * @param {Date|string} startDate - Plan start date
 * @param {number} year       - Target year
 * @param {number} month      - Target month (1-12)
 * @returns {boolean}
 */
function isDueInMonth(frequency, startDate, year, month) {
  const freq = String(frequency || "Monthly").trim();
  const y = Number(year);
  const m = Number(month);

  // Monthly — always due
  if (/month/i.test(freq)) return true;

  // Determine interval in months
  let interval = 1;
  if (/quarter/i.test(freq)) interval = 3;
  else if (/half/i.test(freq)) interval = 6;
  else if (/year|annual/i.test(freq)) interval = 12;
  else return true; // unknown → treat as monthly

  // Anchor from startDate
  const start = startDate ? new Date(startDate) : null;
  if (!start || Number.isNaN(start.getTime())) return true;

  const startYear = start.getFullYear();
  const startMonth = start.getMonth() + 1; // 1-based

  // Total months elapsed from start
  const totalMonthsFromStart = (y - startYear) * 12 + (m - startMonth);

  // Due only if elapsed months is a non-negative multiple of interval
  return totalMonthsFromStart >= 0 && totalMonthsFromStart % interval === 0;
}

/**
 * Check whether a recurring plan is active for a given due date,
 * considering start date and end/maturity/closure dates.
 *
 * @param {object} plan          - The plan/investment/insurance/liability document
 * @param {Date}   derivedDueDate - The computed due date for the target month
 * @returns {boolean}
 */
function isPlanActiveForDueDate(plan, derivedDueDate) {
  if (!plan || !derivedDueDate) return false;

  const dueTime = derivedDueDate.getTime();

  // Check start date
  const startRaw = plan.startDate || plan.createdAt;
  if (startRaw) {
    const sDate = new Date(startRaw);
    if (!Number.isNaN(sDate.getTime())) {
      // Plan must have started on or before the due date's month
      const startYM = sDate.getFullYear() * 100 + (sDate.getMonth() + 1);
      const dueYM = derivedDueDate.getFullYear() * 100 + (derivedDueDate.getMonth() + 1);
      if (dueYM < startYM) return false;
    }
  }

  // Check end / maturity / closure dates
  const endRaw = plan.endDate || plan.maturityDate || plan.closureDate || plan.closedAt || plan.maturedAt;
  if (endRaw) {
    const eDate = new Date(endRaw);
    if (!Number.isNaN(eDate.getTime())) {
      // If the due date is in a month strictly after the end month, plan is no longer active
      const endYM = eDate.getFullYear() * 100 + (eDate.getMonth() + 1);
      const dueYM = derivedDueDate.getFullYear() * 100 + (derivedDueDate.getMonth() + 1);
      if (dueYM > endYM) return false;
    }
  }

  // Check status
  const status = String(plan.status || "").trim().toLowerCase();
  const inactiveStatuses = ["closed", "completed", "matured", "cancelled", "lapsed", "expired", "settled"];
  if (inactiveStatuses.includes(status)) return false;

  return true;
}

/**
 * Derive the full due date for a plan in a selected month.
 * Returns null if the plan is not due in that month.
 *
 * @param {object} params
 * @param {number} params.dueDay      - Stored recurring day (1-31)
 * @param {string} params.frequency   - "Monthly", "Quarterly", etc.
 * @param {Date|string} params.startDate
 * @param {object} params.plan        - Full plan document (for lifecycle checks)
 * @param {number} params.year        - Selected month year
 * @param {number} params.month       - Selected month (1-12)
 * @returns {{ dueDate: Date, dueDateISO: string } | null}
 */
function deriveDueDateForMonth({ dueDay, frequency, startDate, plan, year, month }) {
  if (!dueDay || !year || !month) return null;

  // Check frequency alignment
  if (!isDueInMonth(frequency || "Monthly", startDate, year, month)) {
    return null;
  }

  // Calculate clamped due date
  const derivedDate = calculateDueDateForMonth(dueDay, year, month);

  // Check lifecycle
  if (plan && !isPlanActiveForDueDate(plan, derivedDate)) {
    return null;
  }

  return {
    dueDate: derivedDate,
    dueDateISO: formatDateISO(derivedDate),
  };
}

/**
 * Derive the contribution/payment status from due date, paid date, and stored status.
 *
 * @param {Date|string} dueDate
 * @param {Date|string|null} paidDate
 * @param {string|null} storedStatus - e.g., "Paid", "Skipped", "Not Paid"
 * @returns {string} - "Upcoming", "Due", "Overdue", "Paid", "Skipped", "Not Paid"
 */
function deriveContributionStatus(dueDate, paidDate, storedStatus) {
  // If explicitly marked
  const s = String(storedStatus || "").trim();
  if (s === "Paid") return "Paid";
  if (s === "Skipped") return "Skipped";

  if (!dueDate) return "Not Paid";

  const due = new Date(dueDate);
  if (Number.isNaN(due.getTime())) return "Not Paid";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  if (due.getTime() > today.getTime()) {
    return "Upcoming";
  } else if (due.getTime() === today.getTime()) {
    return "Due";
  } else {
    return "Overdue";
  }
}

module.exports = {
  calculateDueDateForMonth,
  formatDateISO,
  isDueInMonth,
  isPlanActiveForDueDate,
  deriveDueDateForMonth,
  deriveContributionStatus,
};
