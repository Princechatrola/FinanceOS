// ============================================================
// FINANCEOS - FINANCIAL REMINDER ENGINE
// ============================================================
//
// PURPOSE:
//
// Convert Financial Calendar events into actionable reminders.
//
// Example:
//
// EMI Due:
// 10 August 2026
//
// Reminder settings:
// - 5 days before
// - 1 day before
// - On due date
//
// Reminder dates:
//
// 05 Aug -> Upcoming EMI
// 09 Aug -> EMI due tomorrow
// 10 Aug -> EMI due today
//
// ------------------------------------------------------------
//
// IMPORTANT:
//
// This utility does NOT:
//
// - Send email
// - Send browser notifications
//
// It only determines WHICH reminders should appear.
//
// Backend notification delivery can be added later.
//
// ============================================================


// ============================================================
// DAY IN MILLISECONDS
// ============================================================

const DAY_MS =
  24 * 60 * 60 * 1000;


// ============================================================
// NORMALIZE DATE
// ============================================================
//
// Converts:
//
// Date object
// OR
// YYYY-MM-DD
//
// into a local Date at midnight.
//
// ============================================================

function normalizeDate(value) {

  if (!value) {

    return null;

  }


  // ----------------------------------------------------------
  // DATE OBJECT
  // ----------------------------------------------------------

  if (value instanceof Date) {

    const date =
      new Date(
        value.getFullYear(),
        value.getMonth(),
        value.getDate()
      );


    return date;

  }


  // ----------------------------------------------------------
  // STRING DATE
  // ----------------------------------------------------------

  if (
    typeof value === "string"
  ) {
    const str = value.split("T")[0];
    const parts =
      str
        .split("-")
        .map(Number);


    if (
      parts.length !== 3
    ) {

      return null;

    }


    const [
      year,
      month,
      day,
    ] = parts;


    const date =
      new Date(
        year,
        month - 1,
        day
      );


    if (
      Number.isNaN(
        date.getTime()
      )
    ) {

      return null;

    }


    return date;

  }


  return null;

}


// ============================================================
// FORMAT DATE KEY
// ============================================================
//
// Result:
//
// 2026-08-05
//
// ============================================================

function formatDateKey(date) {

  if (!date) {

    return "";

  }


  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}-${day}`;

}


// ============================================================
// SUBTRACT DAYS
// ============================================================

function subtractDays(
  date,
  days
) {

  const result =
    new Date(
      date
    );


  result.setDate(
    result.getDate() -
    days
  );


  return result;

}


// ============================================================
// SUBTRACT MONTHS
// ============================================================
//
// Used for maturity reminders.
//
// Example:
//
// FD maturity:
// 20 December
//
// 2 months before:
// 20 October
//
// ============================================================

function subtractMonths(
  date,
  months
) {

  const result =
    new Date(
      date
    );


  const originalDay =
    result.getDate();


  result.setDate(
    1
  );


  result.setMonth(
    result.getMonth() -
    months
  );


  const lastDay =
    new Date(
      result.getFullYear(),
      result.getMonth() + 1,
      0
    ).getDate();


  result.setDate(
    Math.min(
      originalDay,
      lastDay
    )
  );


  return result;

}


// ============================================================
// DIFFERENCE IN DAYS
// ============================================================

function differenceInDays(
  firstDate,
  secondDate
) {

  const first =
    normalizeDate(
      firstDate
    );


  const second =
    normalizeDate(
      secondDate
    );


  if (
    !first ||
    !second
  ) {

    return null;

  }


  return Math.round(
    (
      second.getTime() -
      first.getTime()
    ) /
    DAY_MS
  );

}


// ============================================================
// IS MATURITY EVENT
// ============================================================

function isMaturityEvent(type) {

  return [

    "goal-deadline",

    "investment-maturity",

    "insurance-maturity",

    "liability-end",

  ].includes(
    type
  );

}


// ============================================================
// REMINDER TYPE LABEL
// ============================================================

function getReminderTypeLabel(
  event
) {

  switch (
    event.type
  ) {

    case "goal":

      return "Goal Contribution";


    case "goal-deadline":

      return "Goal Deadline";


    case "investment":

      return "Investment Contribution";


    case "investment-maturity":

      return "Investment Maturity";


    case "insurance":

      return "Insurance Premium";


    case "insurance-maturity":

      return "Insurance Maturity";


    case "liability":

      return "Payment / EMI";


    case "liability-end":

      return "Liability Completion";


    default:

      return "Financial Reminder";

  }

}


// ============================================================
// NORMALIZE REMINDER OPTIONS
// ============================================================
//
// We support several possible field formats so older forms
// continue working.
//
// Example:
//
// reminder: {
//
//   enabled: true,
//
//   options: [
//      "5-days-before",
//      "1-day-before",
//      "on-due-date"
//   ]
//
// }
//
// OR:
//
// reminder: {
//
//   enabled: true,
//
//   remind5DaysBefore: true,
//   remind1DayBefore: true,
//   remindOnDueDate: true
//
// }
//
// ============================================================

function getReminderOptions(reminder = {}) {
  const options = new Set();

  // 1. Array options (legacy or explicit)
  if (Array.isArray(reminder.options)) {
    reminder.options.forEach((opt) => options.add(String(opt).trim().toLowerCase()));
  }
  if (Array.isArray(reminder.timings)) {
    reminder.timings.forEach((opt) => options.add(String(opt).trim().toLowerCase()));
  }

  // 2. notifyBefore array (e.g. [5, 1, 0, 7])
  if (Array.isArray(reminder.notifyBefore)) {
    reminder.notifyBefore.forEach((num) => {
      const n = Number(num);
      if (n === 0) options.add("on-due-date");
      else if (n > 0) options.add(`${n}-days-before`);
    });
  }

  // 3. daysBefore number (Liabilities)
  if (typeof reminder.daysBefore === "number" && reminder.daysBefore > 0) {
    options.add(`${reminder.daysBefore}-days-before`);
  }

  // 4. notifyBeforeDays & notifyBeforeMonths (Maturity)
  if (Array.isArray(reminder.notifyBeforeDays)) {
    reminder.notifyBeforeDays.forEach((n) => {
      if (Number(n) > 0) options.add(`${Number(n)}-days-before`);
    });
  }
  if (Array.isArray(reminder.notifyBeforeMonths)) {
    reminder.notifyBeforeMonths.forEach((n) => {
      if (Number(n) > 0) options.add(`${Number(n)}-months-before`);
    });
  }
  if (reminder.onMaturityDate) {
    options.add("on-due-date");
  }

  // 5. Insurance premiumReminders
  if (reminder.premiumReminders) {
    if (reminder.premiumReminders.fiveDaysBefore) options.add("5-days-before");
    if (reminder.premiumReminders.oneDayBefore) options.add("1-day-before");
    if (reminder.premiumReminders.onDueDate) options.add("on-due-date");
  }

  // 6. Insurance expiryReminders
  if (reminder.expiryReminders) {
    if (reminder.expiryReminders.twoMonthsBefore) options.add("2-months-before");
    if (reminder.expiryReminders.oneMonthBefore) options.add("1-month-before");
    if (reminder.expiryReminders.sevenDaysBefore) options.add("7-days-before");
    if (reminder.expiryReminders.onExpiryDate) options.add("on-due-date");
  }

  // 7. Insurance maturityReminders
  if (reminder.maturityReminders) {
    if (reminder.maturityReminders.twoMonthsBefore) options.add("2-months-before");
    if (reminder.maturityReminders.oneMonthBefore) options.add("1-month-before");
    if (reminder.maturityReminders.onMaturityDate) options.add("on-due-date");
  }

  // 8. Legacy boolean fields
  if (reminder.remind5DaysBefore) options.add("5-days-before");
  if (reminder.remind1DayBefore) options.add("1-day-before");
  if (reminder.remindOnDueDate) options.add("on-due-date");
  if (reminder.remind2MonthsBefore) options.add("2-months-before");
  if (reminder.remind1MonthBefore) options.add("1-month-before");

  // Normalize human strings
  const normalized = new Set();
  options.forEach((opt) => {
    const s = String(opt).toLowerCase().trim();
    if (s === "5 days before") normalized.add("5-days-before");
    else if (s === "1 day before") normalized.add("1-day-before");
    else if (s === "on due date" || s === "on date") normalized.add("on-due-date");
    else if (s === "2 months before") normalized.add("2-months-before");
    else if (s === "1 month before") normalized.add("1-month-before");
    else normalized.add(s);
  });

  return normalized;
}


// ============================================================
// CREATE REMINDER
// ============================================================

function createReminder({
  event,
  reminderDate,
  timing,
  message,
}) {
  const eventDate = normalizeDate(event.date);

  return {
    id: `${event.id}-${timing}-${formatDateKey(reminderDate)}`,
    eventId: event.id,
    eventType: event.type,
    type: getReminderTypeLabel(event),
    title: event.title || "Financial Reminder",
    message,
    amount: Number(event.amount || 0),
    eventDate: event.date,
    reminderDate: formatDateKey(reminderDate),
    date: formatDateKey(reminderDate),
    timing,
    status: event.status || null,
    sourceId: event.sourceId || null,
    channels: event.reminder?.channels || [],
    read: false,
    daysUntilEvent: differenceInDays(reminderDate, eventDate),
  };
}


// ============================================================
// GENERATE REMINDERS FOR ONE EVENT
// ============================================================

export function generateEventReminders(event) {
  if (!event || !event.date) {
    return [];
  }

  const reminder = event.reminder || {};
  if (reminder.enabled !== true && reminder.enabled !== "true") {
    return [];
  }

  const eventDate = normalizeDate(event.date);
  if (!eventDate) {
    return [];
  }

  const options = getReminderOptions(reminder);
  if (options.size === 0) {
    options.add("on-due-date");
  }

  const reminders = [];
  const processedTimings = new Set();

  options.forEach((opt) => {
    if (opt === "on-due-date" && !processedTimings.has("on-due-date")) {
      processedTimings.add("on-due-date");
      reminders.push(
        createReminder({
          event,
          reminderDate: eventDate,
          timing: "on-due-date",
          message: `${event.title} is due today.`,
        })
      );
      return;
    }

    const dayMatch = opt.match(/^(\d+)-days?-before$/);
    if (dayMatch) {
      const days = parseInt(dayMatch[1], 10);
      const timingKey = `${days}-days-before`;
      if (!processedTimings.has(timingKey)) {
        processedTimings.add(timingKey);
        reminders.push(
          createReminder({
            event,
            reminderDate: subtractDays(eventDate, days),
            timing: timingKey,
            message: days === 1 ? `${event.title} is due tomorrow.` : `${event.title} is due in ${days} days.`,
          })
        );
      }
      return;
    }

    const monthMatch = opt.match(/^(\d+)-months?-before$/);
    if (monthMatch) {
      const months = parseInt(monthMatch[1], 10);
      const timingKey = `${months}-months-before`;
      if (!processedTimings.has(timingKey)) {
        processedTimings.add(timingKey);
        reminders.push(
          createReminder({
            event,
            reminderDate: subtractMonths(eventDate, months),
            timing: timingKey,
            message: `${event.title} is scheduled in ${months} month${months > 1 ? "s" : ""}.`,
          })
        );
      }
    }
  });

  return reminders;
}


// ============================================================
// GENERATE ALL FINANCIAL REMINDERS
// ============================================================
//
// INPUT:
//
// Financial Calendar events.
//
// OUTPUT:
//
// All configured reminder occurrences.
//
// ============================================================

export function generateFinancialReminders(
  events = []
) {

  if (
    !Array.isArray(
      events
    )
  ) {

    return [];

  }


  return events

    .flatMap(
      (
        event
      ) =>

        generateEventReminders(
          event
        )
    )

    .sort(
      (
        first,
        second
      ) => {

        const firstDate =
          normalizeDate(
            first.reminderDate
          );


        const secondDate =
          normalizeDate(
            second.reminderDate
          );


        if (
          !firstDate ||
          !secondDate
        ) {

          return 0;

        }


        return (
          firstDate.getTime() -
          secondDate.getTime()
        );

      }
    );

}


// ============================================================
// GET REMINDERS DUE TODAY
// ============================================================
//
// Used by:
//
// Topbar Notification Bell
//
// ============================================================

export function getRemindersDueToday(
  reminders = [],
  referenceDate = new Date()
) {

  const today =
    normalizeDate(
      referenceDate
    );


  if (!today) {

    return [];

  }


  const todayKey =
    formatDateKey(
      today
    );


  return reminders.filter(
    (
      reminder
    ) =>
      reminder.reminderDate ===
      todayKey
  );

}


// ============================================================
// GET ACTIVE REMINDERS
// ============================================================
//
// Returns reminders that became due recently.
//
// Example:
//
// If the user didn't open FinanceOS yesterday, yesterday's
// reminder can still appear today.
//
// Default lookback:
//
// 7 days.
//
// Future reminders are NOT included.
//
// ============================================================

export function getActiveReminders(
  reminders = [],
  referenceDate = new Date(),
  lookbackDays = 7
) {

  const today =
    normalizeDate(
      referenceDate
    );


  if (!today) {

    return [];

  }


  const startDate =
    subtractDays(
      today,
      lookbackDays
    );


  return reminders

    .filter(
      (
        reminder
      ) => {


        const reminderDate =
          normalizeDate(
            reminder.reminderDate
          );


        if (!reminderDate) {

          return false;

        }


        return (
          reminderDate >=
            startDate &&
          reminderDate <=
            today
        );

      }
    )

    .sort(
      (
        first,
        second
      ) => {


        const firstDate =
          normalizeDate(
            first.reminderDate
          );


        const secondDate =
          normalizeDate(
            second.reminderDate
          );


        if (
          !firstDate ||
          !secondDate
        ) {

          return 0;

        }


        // Most recent first

        return (
          secondDate.getTime() -
          firstDate.getTime()
        );

      }
    );

}


// ============================================================
// GET THIS MONTH REMINDERS
// ============================================================
//
// Used by:
//
// Topbar Notification Bell
// Returns all reminders that fall within the current calendar month.
// ============================================================

export function getThisMonthReminders(
  reminders = [],
  referenceDate = new Date()
) {
  const ref = normalizeDate(referenceDate) || new Date();
  const year = ref.getFullYear();
  const month = ref.getMonth();

  if (!Array.isArray(reminders)) {
    return [];
  }

  return reminders
    .filter((reminder) => {
      const dateVal = reminder.reminderDate || reminder.eventDate;
      if (!dateVal) return false;

      let rYear, rMonth;
      if (typeof dateVal === "string") {
        const clean = dateVal.split("T")[0];
        const parts = clean.split("-").map(Number);
        if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          rYear = parts[0];
          rMonth = parts[1] - 1;
        }
      }

      if (rYear === undefined) {
        const rDate = normalizeDate(dateVal);
        if (!rDate) return false;
        rYear = rDate.getFullYear();
        rMonth = rDate.getMonth();
      }

      return rYear === year && rMonth === month;
    })
    .sort((first, second) => {
      const firstDate = normalizeDate(first.reminderDate || first.eventDate)?.getTime() || 0;
      const secondDate = normalizeDate(second.reminderDate || second.eventDate)?.getTime() || 0;
      return secondDate - firstDate;
    });
}


// ============================================================
// GET UPCOMING REMINDER SCHEDULE
// ============================================================
//
// This is NOT the notification bell.
//
// It can be used later for:
//
// "Upcoming Reminders"
//
// Shows reminders scheduled during the next N days.
//
// ============================================================

export function getUpcomingReminders(
  reminders = [],
  days = 30,
  referenceDate = new Date()
) {

  const today =
    normalizeDate(
      referenceDate
    );


  if (!today) {

    return [];

  }


  const endDate =
    new Date(
      today
    );


  endDate.setDate(
    endDate.getDate() +
    days
  );


  return reminders

    .filter(
      (
        reminder
      ) => {


        const reminderDate =
          normalizeDate(
            reminder.reminderDate
          );


        if (!reminderDate) {

          return false;

        }


        return (
          reminderDate >=
            today &&
          reminderDate <=
            endDate
        );

      }
    )

    .sort(
      (
        first,
        second
      ) => {


        const firstDate =
          normalizeDate(
            first.reminderDate
          );


        const secondDate =
          normalizeDate(
            second.reminderDate
          );


        if (
          !firstDate ||
          !secondDate
        ) {

          return 0;

        }


        return (
          firstDate.getTime() -
          secondDate.getTime()
        );

      }
    );

}


// ============================================================
// GET UNREAD COUNT
// ============================================================

export function getUnreadReminderCount(
  reminders = []
) {

  if (
    !Array.isArray(
      reminders
    )
  ) {

    return 0;

  }


  return reminders.filter(
    (
      reminder
    ) =>
      reminder.read !== true
  ).length;

}