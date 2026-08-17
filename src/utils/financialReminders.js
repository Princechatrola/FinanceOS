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
// - Send SMS
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

    const parts =
      value
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

function getReminderOptions(
  reminder = {}
) {

  const options =
    new Set();


  // ==========================================================
  // ARRAY OPTIONS
  // ==========================================================

  if (
    Array.isArray(
      reminder.options
    )
  ) {

    reminder.options.forEach(
      (option) => {

        options.add(
          String(
            option
          )
            .trim()
            .toLowerCase()
        );

      }
    );

  }


  // ==========================================================
  // ALTERNATIVE ARRAY
  // ==========================================================

  if (
    Array.isArray(
      reminder.timings
    )
  ) {

    reminder.timings.forEach(
      (option) => {

        options.add(
          String(
            option
          )
            .trim()
            .toLowerCase()
        );

      }
    );

  }


  // ==========================================================
  // BOOLEAN FIELDS
  // ==========================================================

  if (
    reminder.remind5DaysBefore
  ) {

    options.add(
      "5-days-before"
    );

  }


  if (
    reminder.remind1DayBefore
  ) {

    options.add(
      "1-day-before"
    );

  }


  if (
    reminder.remindOnDueDate
  ) {

    options.add(
      "on-due-date"
    );

  }


  if (
    reminder.remind2MonthsBefore
  ) {

    options.add(
      "2-months-before"
    );

  }


  if (
    reminder.remind1MonthBefore
  ) {

    options.add(
      "1-month-before"
    );

  }


  // ==========================================================
  // SUPPORT HUMAN-READABLE VALUES
  // ==========================================================

  const normalized =
    Array.from(
      options
    ).map(
      (option) => {


        if (
          option === "5 days before"
        ) {

          return "5-days-before";

        }


        if (
          option === "1 day before"
        ) {

          return "1-day-before";

        }


        if (
          option === "on due date"
        ) {

          return "on-due-date";

        }


        if (
          option === "2 months before"
        ) {

          return "2-months-before";

        }


        if (
          option === "1 month before"
        ) {

          return "1-month-before";

        }


        return option;

      }
    );


  return new Set(
    normalized
  );

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

  const eventDate =
    normalizeDate(
      event.date
    );


  return {

    // --------------------------------------------------------
    // UNIQUE ID
    // --------------------------------------------------------

    id:
      `${event.id}-${timing}-${formatDateKey(
        reminderDate
      )}`,


    // --------------------------------------------------------
    // SOURCE EVENT
    // --------------------------------------------------------

    eventId:
      event.id,


    eventType:
      event.type,


    type:
      getReminderTypeLabel(
        event
      ),


    // --------------------------------------------------------
    // DISPLAY INFORMATION
    // --------------------------------------------------------

    title:
      event.title ||
      "Financial Reminder",


    message,


    amount:
      Number(
        event.amount || 0
      ),


    // --------------------------------------------------------
    // DATES
    // --------------------------------------------------------

    eventDate:
      event.date,


    reminderDate:
      formatDateKey(
        reminderDate
      ),


    // --------------------------------------------------------
    // REMINDER TIMING
    // --------------------------------------------------------

    timing,


    // --------------------------------------------------------
    // SOURCE INFORMATION
    // --------------------------------------------------------

    status:
      event.status || null,


    sourceId:
      event.sourceId || null,


    // --------------------------------------------------------
    // CHANNEL SETTINGS
    // --------------------------------------------------------

    channels:
      event.reminder
        ?.channels || [],


    // --------------------------------------------------------
    // DEFAULT UI STATE
    // --------------------------------------------------------

    read:
      false,


    // --------------------------------------------------------
    // DAYS UNTIL EVENT
    // --------------------------------------------------------

    daysUntilEvent:
      differenceInDays(
        reminderDate,
        eventDate
      ),

  };

}


// ============================================================
// GENERATE REMINDERS FOR ONE EVENT
// ============================================================

function generateEventReminders(
  event
) {


  // ==========================================================
  // VALIDATE EVENT
  // ==========================================================

  if (
    !event ||
    !event.date
  ) {

    return [];

  }


  // ==========================================================
  // REMINDER SETTINGS
  // ==========================================================

  const reminder =
    event.reminder || {};


  // ==========================================================
  // REMINDER DISABLED
  // ==========================================================

  if (
    reminder.enabled !== true
  ) {

    return [];

  }


  // ==========================================================
  // EVENT DATE
  // ==========================================================

  const eventDate =
    normalizeDate(
      event.date
    );


  if (!eventDate) {

    return [];

  }


  // ==========================================================
  // OPTIONS
  // ==========================================================

  const options =
    getReminderOptions(
      reminder
    );


  const reminders =
    [];


  // ==========================================================
  // IF NO OPTIONS EXIST
  // ==========================================================
  //
  // Default:
  //
  // On due date.
  //
  // This prevents Reminder On from producing no reminder when
  // older records do not contain timing options.
  //
  // ==========================================================

  if (
    options.size === 0
  ) {

    options.add(
      "on-due-date"
    );

  }


  // ==========================================================
  // 5 DAYS BEFORE
  // ==========================================================

  if (
    options.has(
      "5-days-before"
    )
  ) {

    reminders.push(

      createReminder({

        event,

        reminderDate:
          subtractDays(
            eventDate,
            5
          ),

        timing:
          "5-days-before",

        message:
          `${event.title} is due in 5 days.`,

      })

    );

  }


  // ==========================================================
  // 1 DAY BEFORE
  // ==========================================================

  if (
    options.has(
      "1-day-before"
    )
  ) {

    reminders.push(

      createReminder({

        event,

        reminderDate:
          subtractDays(
            eventDate,
            1
          ),

        timing:
          "1-day-before",

        message:
          `${event.title} is due tomorrow.`,

      })

    );

  }


  // ==========================================================
  // ON DUE DATE
  // ==========================================================

  if (
    options.has(
      "on-due-date"
    )
  ) {

    reminders.push(

      createReminder({

        event,

        reminderDate:
          eventDate,

        timing:
          "on-due-date",

        message:
          `${event.title} is due today.`,

      })

    );

  }


  // ==========================================================
  // MATURITY REMINDERS
  // ==========================================================
  //
  // These timings are mainly intended for:
  //
  // FD maturity
  // Policy maturity
  // Goal deadline
  // Liability completion
  //
  // ==========================================================

  if (
    isMaturityEvent(
      event.type
    )
  ) {


    // --------------------------------------------------------
    // 2 MONTHS BEFORE
    // --------------------------------------------------------

    if (
      options.has(
        "2-months-before"
      )
    ) {

      reminders.push(

        createReminder({

          event,

          reminderDate:
            subtractMonths(
              eventDate,
              2
            ),

          timing:
            "2-months-before",

          message:
            `${event.title} is scheduled in 2 months.`,

        })

      );

    }


    // --------------------------------------------------------
    // 1 MONTH BEFORE
    // --------------------------------------------------------

    if (
      options.has(
        "1-month-before"
      )
    ) {

      reminders.push(

        createReminder({

          event,

          reminderDate:
            subtractMonths(
              eventDate,
              1
            ),

          timing:
            "1-month-before",

          message:
            `${event.title} is scheduled in 1 month.`,

        })

      );

    }

  }


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