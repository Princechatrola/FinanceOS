// ============================================================
// FINANCEOS - RECURRING DUE DATE SCHEDULE UTILITY (FRONTEND)
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
//   5. Normal user contribution flow has READ-ONLY due date.
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
export function calculateDueDateForMonth(dueDay, year, month) {
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
 * Format a Date to ISO date string YYYY-MM-DD (local date, no timezone shift).
 */
export function formatDateISO(date) {
  if (!date) return "";
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Format a date string or Date object for friendly UI display (e.g. "10 March 2026").
 */
export function formatDateDisplay(dateInput) {
  if (!dateInput) return "";
  const d = dateInput instanceof Date ? dateInput : new Date(String(dateInput).includes("T") ? dateInput : `${dateInput}T00:00:00`);
  if (Number.isNaN(d.getTime())) return String(dateInput);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
 * @param {string} frequency      - "Monthly", "Quarterly", "Half-Yearly", "Yearly"
 * @param {Date|string} startDate - Plan start date
 * @param {number} year           - Target year
 * @param {number} month          - Target month (1-12)
 * @returns {boolean}
 */
export function isDueInMonth(frequency, startDate, year, month) {
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
  else return true;

  // Anchor from startDate
  const start = startDate ? new Date(startDate) : null;
  if (!start || Number.isNaN(start.getTime())) return true;

  const startYear = start.getFullYear();
  const startMonth = start.getMonth() + 1; // 1-based

  const totalMonthsFromStart = (y - startYear) * 12 + (m - startMonth);
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
export function isPlanActiveForDueDate(plan, derivedDueDate) {
  if (!plan || !derivedDueDate) return false;

  // Check start date
  const startRaw = plan.startDate || plan.createdAt;
  if (startRaw) {
    const sDate = new Date(startRaw);
    if (!Number.isNaN(sDate.getTime())) {
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
 * @returns {{ dueDate: Date, dueDateISO: string, displayDate: string } | null}
 */
export function deriveDueDateForMonth({ dueDay, frequency, startDate, plan, year, month }) {
  if (!dueDay || !year || !month) return null;

  if (!isDueInMonth(frequency || "Monthly", startDate, year, month)) {
    return null;
  }

  const derivedDate = calculateDueDateForMonth(dueDay, year, month);

  if (plan && !isPlanActiveForDueDate(plan, derivedDate)) {
    return null;
  }

  const iso = formatDateISO(derivedDate);
  return {
    dueDate: derivedDate,
    dueDateISO: iso,
    displayDate: formatDateDisplay(iso),
  };
}

/**
 * Derive contribution/payment status from due date, paid date, and stored status.
 *
 * @param {Date|string} dueDate
 * @param {Date|string|null} paidDate
 * @param {string|null} storedStatus - e.g., "Paid", "Skipped", "Not Paid"
 * @returns {string} - "Upcoming", "Due", "Overdue", "Paid", "Skipped", "Not Paid"
 */
export function deriveContributionStatus(dueDate, paidDate, storedStatus) {
  const s = String(storedStatus || "").trim();
  if (s === "Paid") return "Paid";
  if (s === "Skipped") return "Skipped";

  if (!dueDate) return "Not Paid";

  const due = new Date(String(dueDate).includes("T") ? dueDate : `${dueDate}T00:00:00`);
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
