// ============================================================
// FINANCEOS - FINANCIAL CALENDAR UTILITIES
// ============================================================
//
// PURPOSE:
//
// Convert FinanceOS records into calendar events.
//
// SOURCES:
//
// 1. Saving Goals
// 2. Investments
// 3. Insurance
// 4. Liabilities
//
// IMPORTANT:
//
// Calendar events are CALCULATED from the financial records.
// They are not stored separately.
//
// If a plan is deleted, paused, completed or closed,
// the calendar automatically reflects that.
//
// ============================================================


// ============================================================
// SETTINGS
// ============================================================
//
// If a recurring record has no known end date,
// FinanceOS generates events for the next 12 occurrences.
//
// This prevents infinite event generation.
//
// ============================================================

const DEFAULT_OCCURRENCE_LIMIT = 12;


// ============================================================
// FORMAT MONEY
// ============================================================

function formatMoney(amount) {
  return Number(
    amount || 0
  ).toLocaleString(
    "en-IN",
    {
      maximumFractionDigits: 0,
    }
  );
}


// ============================================================
// VALID DATE
// ============================================================

function isValidDate(date) {
  if (!date) {
    return false;
  }

  const parsedDate =
    new Date(
      `${date}T00:00:00`
    );

  return !Number.isNaN(
    parsedDate.getTime()
  );
}


// ============================================================
// PARSE DATE
// ============================================================
//
// Using local year/month/day avoids timezone problems.
//
// ============================================================

function parseDate(dateString) {
  if (!isValidDate(dateString)) {
    return null;
  }

  const [
    year,
    month,
    day,
  ] = dateString
    .split("-")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day
  );
}


// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(date) {
  if (
    !(date instanceof Date) ||
    Number.isNaN(
      date.getTime()
    )
  ) {
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
// ADD MONTHS SAFELY
// ============================================================
//
// Example:
//
// 31 January + 1 month
//
// should not accidentally become:
//
// 3 March
//
// We preserve the requested day where possible and otherwise
// use the final valid day of the destination month.
//
// ============================================================

function addMonthsSafe(
  date,
  months
) {
  const originalDay =
    date.getDate();

  const result =
    new Date(
      date.getFullYear(),
      date.getMonth() +
        months,
      1
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
// DATE COMPARISON
// ============================================================

function isAfterDate(
  date,
  endDate
) {
  if (!endDate) {
    return false;
  }

  return (
    date.getTime() >
    endDate.getTime()
  );
}


// ============================================================
// CREATE EVENT
// ============================================================

function createEvent({
  id,
  sourceId,
  type,
  title,
  date,
  amount = 0,
  status = "Active",
  reminder = null,
  description = "",
}) {
  return {
    id,

    sourceId,

    type,

    title,

    date,

    amount:
      Number(
        amount || 0
      ),

    status,

    reminder,

    description,
  };
}


// ============================================================
// GENERATE RECURRING MONTHLY DATES
// ============================================================
//
// startDate:
// First occurrence.
//
// intervalMonths:
// 1  = monthly
// 3  = quarterly
// 6  = half-yearly
// 12 = yearly
//
// endDate:
// Optional.
//
// occurrenceLimit:
// Safety limit.
//
// ============================================================

function generateRecurringDates({
  startDate,
  intervalMonths = 1,
  endDate = null,
  occurrenceLimit = DEFAULT_OCCURRENCE_LIMIT,
  dueDay = null,
}) {
  const start = parseDate(startDate);
  if (!start) {
    return [];
  }

  const targetDay = Number(dueDay) || start.getDate();
  const end = endDate ? parseDate(endDate) : null;
  const dates = [];

  let startYear = start.getFullYear();
  let startMonth = start.getMonth(); // 0-based
  let count = 0;

  while (count < occurrenceLimit) {
    const curYear = startYear + Math.floor((startMonth + count * intervalMonths) / 12);
    const curMonth = (startMonth + count * intervalMonths) % 12;
    const lastDayOfMonth = new Date(curYear, curMonth + 1, 0).getDate();
    const clampedDay = Math.min(Math.max(targetDay, 1), lastDayOfMonth);
    const current = new Date(curYear, curMonth, clampedDay);

    if (end && isAfterDate(current, end)) {
      break;
    }

    dates.push(formatDate(current));
    count += 1;
  }

  return dates;
}


// ============================================================
// GET FREQUENCY MONTHS
// ============================================================

function getFrequencyMonths(
  frequency
) {
  switch (frequency) {
    case "Monthly":
      return 1;

    case "Quarterly":
      return 3;

    case "Half Yearly":
      return 6;

    case "Yearly":
      return 12;

    default:
      return 1;
  }
}


// ============================================================
// 1. SAVING GOAL EVENTS
// ============================================================

function createGoalEvents(
  savingGoals = []
) {
  const events = [];

  savingGoals.forEach(
    (goal) => {

      // ------------------------------------------------------
      // ONLY ACTIVE GOALS CREATE FUTURE CONTRIBUTIONS
      // ------------------------------------------------------

      const isActive =
        goal.status ===
        "Active";


      // ------------------------------------------------------
      // CONTRIBUTION AMOUNT
      // ------------------------------------------------------

      const monthlyAllocation =
        Number(
          goal.monthlyAllocation ||
            0
        );


      // ------------------------------------------------------
      // CONTRIBUTION START DATE
      // ------------------------------------------------------
      //
      // Preferred:
      //
      // nextContributionDate
      //
      // Fallback:
      //
      // startDate
      //
      // ------------------------------------------------------

      const contributionStartDate =
        isValidDate(
          goal.nextContributionDate
        )
          ? goal.nextContributionDate
          : isValidDate(
              goal.startDate
            )
          ? goal.startDate
          : null;


      // ------------------------------------------------------
      // DEADLINE
      // ------------------------------------------------------

      const deadline =
        isValidDate(
          goal.targetDate
        )
          ? goal.targetDate
          : null;


      // ------------------------------------------------------
      // NUMBER OF CONTRIBUTIONS
      // ------------------------------------------------------
      //
      // If durationMonths exists, use it.
      //
      // Otherwise use the standard 12-occurrence safety limit.
      //
      // ------------------------------------------------------

      const duration =
        Number(
          goal.durationMonths ||
            0
        );


      const occurrenceLimit =
        duration > 0
          ? Math.min(
              duration,
              120
            )
          : DEFAULT_OCCURRENCE_LIMIT;


      // ------------------------------------------------------
      // MONTHLY CONTRIBUTIONS
      // ------------------------------------------------------

      if (
        isActive &&
        contributionStartDate &&
        monthlyAllocation > 0
      ) {
        const goalDueDay =
          goal.contributionDay ||
          (goal.reminder && goal.reminder.contributionDay) ||
          null;

        const dates =
          generateRecurringDates({
            startDate:
              contributionStartDate,

            intervalMonths: 1,

            endDate:
              deadline,

            occurrenceLimit,

            dueDay: goalDueDay,
          });


        dates.forEach(
          (
            date,
            index
          ) => {
            events.push(
              createEvent({
                id:
                  `goal-contribution-${goal.id}-${index}`,

                sourceId:
                  goal.id,

                type:
                  "goal",

                title:
                  `${goal.name} Contribution`,

                date,

                amount:
                  monthlyAllocation,

                status:
                  goal.status,

                reminder:
                  goal.reminder,

                description:
                  `Planned contribution ₹${formatMoney(
                    monthlyAllocation
                  )}`,
              })
            );
          }
        );
      }


      // ------------------------------------------------------
      // GOAL DEADLINE
      // ------------------------------------------------------

      if (
        deadline &&
        goal.status !==
          "Closed"
      ) {
        events.push(
          createEvent({
            id:
              `goal-deadline-${goal.id}`,

            sourceId:
              goal.id,

            type:
              "goal-deadline",

            title:
              `${goal.name} Goal Deadline`,

            date:
              deadline,

            amount:
              goal.targetAmount,

            status:
              goal.status,

            reminder:
              goal.reminder,

            description:
              `Target amount ₹${formatMoney(
                goal.targetAmount
              )}`,
          })
        );
      }
    }
  );

  return events;
}


// ============================================================
// 2. INVESTMENT EVENTS
// ============================================================

function createInvestmentEvents(
  investments = []
) {
  const events = [];

  investments.forEach(
    (investment) => {

      const isActive =
        investment.status ===
        "Active";


      // ------------------------------------------------------
      // CONTRIBUTION AMOUNT
      // ------------------------------------------------------
      //
      // Preferred:
      //
      // monthlyContribution
      //
      // Fallbacks support older records.
      //
      // ------------------------------------------------------

      const contributionAmount =
        Number(
          investment.monthlyContribution ??
            investment.contributionAmount ??
            investment.amount ??
            0
        );


      // ------------------------------------------------------
      // CONTRIBUTION START
      // ------------------------------------------------------

      const contributionStart =
        isValidDate(
          investment.nextContributionDate
        )
          ? investment.nextContributionDate
          : isValidDate(
              investment.startDate
            )
          ? investment.startDate
          : null;


      // ------------------------------------------------------
      // MATURITY
      // ------------------------------------------------------

      const maturityDate =
        isValidDate(
          investment.maturityDate
        )
          ? investment.maturityDate
          : null;


      // ------------------------------------------------------
      // FREQUENCY
      // ------------------------------------------------------

      const intervalMonths =
        getFrequencyMonths(
          investment.frequency ||
            investment.contributionFrequency ||
            "Monthly"
        );


      // ------------------------------------------------------
      // RECURRING CONTRIBUTIONS
      // ------------------------------------------------------

      if (
        isActive &&
        contributionStart &&
        contributionAmount > 0
      ) {
        const invDueDay =
          investment.dueDay ||
          (investment.reminder && investment.reminder.contributionDay) ||
          null;

        const dates =
          generateRecurringDates({
            startDate:
              contributionStart,

            intervalMonths,

            endDate:
              maturityDate,

            occurrenceLimit:
              DEFAULT_OCCURRENCE_LIMIT,

            dueDay: invDueDay,
          });


        dates.forEach(
          (
            date,
            index
          ) => {
            events.push(
              createEvent({
                id:
                  `investment-contribution-${investment.id}-${index}`,

                sourceId:
                  investment.id,

                type:
                  "investment",

                title:
                  `${investment.name} Contribution`,

                date,

                amount:
                  contributionAmount,

                status:
                  investment.status,

                reminder:
                  investment.reminder,

                description:
                  `Investment contribution ₹${formatMoney(
                    contributionAmount
                  )}`,
              })
            );
          }
        );
      }


      // ------------------------------------------------------
      // MATURITY EVENT
      // ------------------------------------------------------

      if (
        maturityDate &&
        investment.status !==
          "Closed"
      ) {
        events.push(
          createEvent({
            id:
              `investment-maturity-${investment.id}`,

            sourceId:
              investment.id,

            type:
              "investment-maturity",

            title:
              `${investment.name} Maturity`,

            date:
              maturityDate,

            amount:
              investment.currentValue ??
              investment.amount ??
              0,

            status:
              investment.status,

            reminder:
              investment.maturityReminder ||
              investment.reminder,

            description:
              "Investment maturity date",
          })
        );
      }
    }
  );

  return events;
}


// ============================================================
// 3. INSURANCE EVENTS
// ============================================================

function createInsuranceEvents(
  insurancePolicies = []
) {
  const events = [];

  insurancePolicies.forEach(
    (policy) => {

      const isActive =
        policy.status ===
        "Active";


      // ------------------------------------------------------
      // PREMIUM START
      // ------------------------------------------------------

      const premiumStart =
        isValidDate(
          policy.nextPremiumDate
        )
          ? policy.nextPremiumDate
          : isValidDate(
              policy.startDate
            )
          ? policy.startDate
          : null;


      // ------------------------------------------------------
      // MATURITY
      // ------------------------------------------------------

      const maturityDate =
        isValidDate(
          policy.maturityDate
        )
          ? policy.maturityDate
          : null;


      // ------------------------------------------------------
      // PREMIUM FREQUENCY
      // ------------------------------------------------------

      const intervalMonths =
        getFrequencyMonths(
          policy.premiumFrequency ||
            "Monthly"
        );


      // ------------------------------------------------------
      // PREMIUM EVENTS
      // ------------------------------------------------------

      if (
        isActive &&
        premiumStart &&
        Number(
          policy.premiumAmount ||
            0
        ) > 0
      ) {
        const insDueDay =
          policy.premiumDueDay ||
          null;

        const dates =
          generateRecurringDates({
            startDate:
              premiumStart,

            intervalMonths,

            endDate:
              maturityDate,

            occurrenceLimit:
              DEFAULT_OCCURRENCE_LIMIT,

            dueDay: insDueDay,
          });


        dates.forEach(
          (
            date,
            index
          ) => {
            events.push(
              createEvent({
                id:
                  `insurance-premium-${policy.id}-${index}`,

                sourceId:
                  policy.id,

                type:
                  "insurance",

                title:
                  `${policy.name} Premium`,

                date,

                amount:
                  policy.premiumAmount,

                status:
                  policy.status,

                reminder:
                  policy.paymentReminder,

                description:
                  `${policy.premiumFrequency || "Premium"} payment ₹${formatMoney(
                    policy.premiumAmount
                  )}`,
              })
            );
          }
        );
      }


      // ------------------------------------------------------
      // MATURITY / EXPIRY
      // ------------------------------------------------------

      if (
        maturityDate &&
        policy.status !==
          "Closed"
      ) {
        events.push(
          createEvent({
            id:
              `insurance-maturity-${policy.id}`,

            sourceId:
              policy.id,

            type:
              "insurance-maturity",

            title:
              `${policy.name} Maturity / Expiry`,

            date:
              maturityDate,

            amount: 0,

            status:
              policy.status,

            reminder:
              policy.maturityReminder,

            description:
              "Insurance policy maturity or expiry date",
          })
        );
      }
    }
  );

  return events;
}


// ============================================================
// 4. LIABILITY EVENTS
// ============================================================

function createLiabilityEvents(
  liabilities = []
) {
  const events = [];

  liabilities.forEach(
    (liability) => {

      // ------------------------------------------------------
      // ONLY ACTIVE LIABILITIES
      // ------------------------------------------------------

      if (
        liability.status !==
        "Active"
      ) {
        return;
      }


      // ------------------------------------------------------
      // PAYMENT START
      // ------------------------------------------------------

      const paymentStart =
        isValidDate(
          liability.nextDueDate
        )
          ? liability.nextDueDate
          : (isValidDate(liability.startDate) ? liability.startDate : new Date());

      const liabDueDay =
        liability.dueDay ||
        (liability.nextDueDate ? new Date(liability.nextDueDate).getDate() : 5);

      if (!paymentStart) {
        return;
      }


      // ------------------------------------------------------
      // END DATE
      // ------------------------------------------------------

      const endDate =
        isValidDate(
          liability.endDate
        )
          ? liability.endDate
          : null;


      // ------------------------------------------------------
      // PAYMENT AMOUNT
      // ------------------------------------------------------

      const paymentAmount =
        Number(
          liability.monthlyEMI ||
            0
        );


      if (
        paymentAmount <= 0
      ) {
        return;
      }


      // ------------------------------------------------------
      // CALCULATE POSSIBLE NUMBER OF PAYMENTS
      // ------------------------------------------------------
      //
      // If remaining amount is ₹100,000 and EMI is ₹10,000,
      // maximum payments required = 10.
      //
      // ------------------------------------------------------

      const remainingAmount =
        Number(
          liability.remainingAmount ||
            liability.principalAmount ||
            0
        );

      const maxPayments =
        remainingAmount > 0
          ? Math.ceil(
              remainingAmount /
                paymentAmount
            )
          : DEFAULT_OCCURRENCE_LIMIT;

      const occurrenceLimit =
        Math.min(
          maxPayments,
          DEFAULT_OCCURRENCE_LIMIT
        );


      // ------------------------------------------------------
      // RECURRING PAYMENT DATES
      // ------------------------------------------------------

      const dates =
        generateRecurringDates({
          startDate:
            paymentStart,

          intervalMonths: 1,

          endDate,

          occurrenceLimit,

          dueDay: liabDueDay,
        });


      const isCreditCard =
        liability.type ===
        "Credit Card";


      dates.forEach(
        (
          date,
          index
        ) => {

          // Final payment may be smaller than regular EMI.

          let amount =
            paymentAmount;


          if (
            remainingAmount > 0
          ) {
            const alreadyScheduled =
              paymentAmount *
              index;

            const amountLeft =
              remainingAmount -
              alreadyScheduled;

            amount =
              Math.min(
                paymentAmount,
                Math.max(
                  amountLeft,
                  0
                )
              );
          }


          if (amount <= 0) {
            return;
          }


          events.push(
            createEvent({
              id:
                `liability-payment-${liability.id}-${index}`,

              sourceId:
                liability.id,

              type:
                "liability",

              title:
                isCreditCard
                  ? `${liability.name} Payment Due`
                  : `${liability.name} EMI Due`,

              date,

              amount,

              status:
                liability.status,

              reminder:
                liability.reminder,

              description:
                isCreditCard
                  ? `Payment ₹${formatMoney(
                      amount
                    )}`
                  : `EMI ₹${formatMoney(
                      amount
                    )}`,
            })
          );
        }
      );


      // ------------------------------------------------------
      // LIABILITY END DATE
      // ------------------------------------------------------

      if (endDate) {
        events.push(
          createEvent({
            id:
              `liability-end-${liability.id}`,

            sourceId:
              liability.id,

            type:
              "liability-end",

            title:
              `${liability.name} Expected Completion`,

            date:
              endDate,

            amount: 0,

            status:
              liability.status,

            reminder:
              liability.reminder,

            description:
              "Expected liability completion date",
          })
        );
      }
    }
  );

  return events;
}


// ============================================================
// 5. GENERATE COMPLETE FINANCIAL CALENDAR
// ============================================================

export function generateFinancialCalendarEvents({
  savingGoals = [],
  investments = [],
  insurancePolicies = [],
  liabilities = [],
  userReminders = [],
}) {
  const goalEvents =
    createGoalEvents(
      savingGoals
    );


  const investmentEvents =
    createInvestmentEvents(
      investments
    );


  const insuranceEvents =
    createInsuranceEvents(
      insurancePolicies
    );


  const liabilityEvents =
    createLiabilityEvents(
      liabilities
    );

  const customReminderEvents = userReminders.map(reminder => createEvent({
    id: `user-reminder-${reminder.id}`,
    sourceId: reminder.id,
    type: "user-reminder",
    title: reminder.title,
    date: reminder.date,
    amount: 0,
    status: "Active",
    reminder: true,
    description: reminder.description || "Custom Reminder"
  }));


  const allEvents = [
    ...goalEvents,
    ...investmentEvents,
    ...insuranceEvents,
    ...liabilityEvents,
    ...customReminderEvents,
  ];


  // ==========================================================
  // SORT BY DATE
  // ==========================================================

  return allEvents.sort(
    (a, b) =>
      parseDate(
        a.date
      ) -
      parseDate(
        b.date
      )
  );
}


// ============================================================
// 6. GET UPCOMING EVENTS
// ============================================================
//
// Can later be reused by:
//
// Dashboard
// Upcoming Obligations
// Upcoming Reminders
//
// ============================================================

export function getUpcomingFinancialEvents(
  events = [],
  limit = 5
) {
  const today =
    new Date();


  today.setHours(
    0,
    0,
    0,
    0
  );


  return events
    .filter(
      (event) => {
        const eventDate =
          parseDate(
            event.date
          );


        if (!eventDate) {
          return false;
        }


        return (
          eventDate >= today
        );
      }
    )
    .sort(
      (a, b) =>
        parseDate(
          a.date
        ) -
        parseDate(
          b.date
        )
    )
    .slice(
      0,
      limit
    );
}


// ============================================================
// 7. GET EVENTS FOR MONTH
// ============================================================
//
// JavaScript months:
//
// January   = 0
// February  = 1
// ...
// December  = 11
//
// ============================================================

export function getEventsForMonth(
  events = [],
  year,
  month
) {
  return events.filter(
    (event) => {
      const eventDate =
        parseDate(
          event.date
        );


      if (!eventDate) {
        return false;
      }


      return (
        eventDate.getFullYear() ===
          year &&
        eventDate.getMonth() ===
          month
      );
    }
  );
}


// ============================================================
// 8. GET EVENTS FOR DATE
// ============================================================

export function getEventsForDate(
  events = [],
  date
) {
  return events.filter(
    (event) =>
      event.date ===
      date
  );
}