// ============================================================
// FINANCEOS - MONTH LIFECYCLE & DATE VALIDATION UTILITIES
// ============================================================

/**
 * Checks if a financial item (Saving Goal, Investment, Insurance, Liability)
 * was active/existed during a specific target year and month.
 *
 * Rules:
 * 1. Start / Creation Date:
 *    - An item is NOT visible in historical months strictly before its start/creation month.
 * 2. End / Closed / Matured Date:
 *    - If an item is closed/settled/matured, it is not active in months strictly after its close month.
 */
function isItemActiveInMonth(item, targetYear, targetMonth) {
  if (!item) return false;

  const y = Number(targetYear);
  const m = Number(targetMonth);
  if (!y || !m) return true;

  // 1. Determine effective start date
  const startRaw = item.startDate || item.createdAt || item.date || item.createdDate;
  if (startRaw) {
    const sDate = new Date(startRaw);
    if (!Number.isNaN(sDate.getTime())) {
      const startYear = sDate.getFullYear();
      const startMonth = sDate.getMonth() + 1;

      // If item starts in a future month relative to target (y, m), it DID NOT exist yet
      if (startYear > y || (startYear === y && startMonth > m)) {
        return false;
      }
    }
  }

  // 2. Determine effective closure / end date
  const status = String(item.status || "").trim().toLowerCase();
  const isClosedStatus = ["closed", "settled", "matured", "completed", "paid", "cancelled"].includes(status);

  if (isClosedStatus) {
    const closeRaw =
      item.closedDate ||
      item.closedAt ||
      item.settledAt ||
      item.maturedAt ||
      item.endDate ||
      (status === "closed" ? item.updatedAt : null);

    if (closeRaw) {
      const cDate = new Date(closeRaw);
      if (!Number.isNaN(cDate.getTime())) {
        const closeYear = cDate.getFullYear();
        const closeMonth = cDate.getMonth() + 1;

        // If target month is strictly AFTER the month the item closed, it is no longer active
        if (y > closeYear || (y === closeYear && m > closeMonth)) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Parses selectedMonth string (e.g. "2026-03") or defaults to current date.
 */
function parseSelectedMonth(monthStr) {
  if (monthStr && typeof monthStr === "string" && /^\d{4}-\d{1,2}$/.test(monthStr)) {
    const [yStr, mStr] = monthStr.split("-");
    const year = Number(yStr);
    const month = Number(mStr);
    if (year >= 2000 && year <= 2100 && month >= 1 && month <= 12) {
      const monthPadded = String(month).padStart(2, "0");
      const lastDay = new Date(year, month, 0).getDate();
      return {
        year,
        month,
        iso: `${year}-${monthPadded}`,
        minDate: `${year}-${monthPadded}-01`,
        maxDate: `${year}-${monthPadded}-${String(lastDay).padStart(2, "0")}`,
        defaultDate: `${year}-${monthPadded}-15`,
        formatted: getMonthName(month) + " " + year,
      };
    }
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthPadded = String(month).padStart(2, "0");
  const lastDay = new Date(year, month, 0).getDate();
  const dayPadded = String(now.getDate()).padStart(2, "0");

  return {
    year,
    month,
    iso: `${year}-${monthPadded}`,
    minDate: `${year}-${monthPadded}-01`,
    maxDate: `${year}-${monthPadded}-${String(lastDay).padStart(2, "0")}`,
    defaultDate: `${year}-${monthPadded}-${dayPadded}`,
    formatted: getMonthName(month) + " " + year,
  };
}

/**
 * Validates whether a given date falls within the target year and month.
 */
function isDateInMonth(dateInput, targetYear, targetMonth) {
  if (!dateInput) return false;
  const d = new Date(dateInput);
  if (Number.isNaN(d.getTime())) return false;
  return d.getFullYear() === Number(targetYear) && d.getMonth() + 1 === Number(targetMonth);
}

function getMonthName(monthIndex) {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[monthIndex - 1] || "";
}

module.exports = {
  isItemActiveInMonth,
  parseSelectedMonth,
  isDateInMonth,
  getMonthName,
};
