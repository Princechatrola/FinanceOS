// ============================================================
// FINANCEOS - UPCOMING FINANCIAL ACTIVITY
// ============================================================
//
// Dashboard rule:
//
// Show ONLY financial events occurring:
//
// TODAY → NEXT 30 DAYS
//
// Example:
//
// Today = 26 July 2026
//
// Visible:
// 05 Aug 2026
// 15 Aug 2026
// 25 Aug 2026
//
// Not visible:
// 05 Sep 2026
// 05 Oct 2026
//
// IMPORTANT:
//
// Events outside this range are NOT deleted.
// They remain available in Financial Calendar.
//
// ============================================================


import {
  useMemo,
} from "react";


import {
  FiCalendar,
  FiTarget,
  FiTrendingUp,
  FiShield,
  FiCreditCard,
  FiClock,
  FiBell,
} from "react-icons/fi";


import {
  generateFinancialCalendarEvents,
} from "../../utils/financialCalendar.js";


// ============================================================
// CONSTANT
// ============================================================

const UPCOMING_DAYS = 30;


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
// FORMAT DATE
// ============================================================

function formatDate(
  dateString
) {

  if (!dateString) {

    return "";

  }


  const date =
    new Date(
      `${dateString}T00:00:00`
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return dateString;

  }


  return date.toLocaleDateString(
    "en-IN",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );

}


// ============================================================
// CONVERT EVENT DATE
// ============================================================
//
// Event dates are stored as:
//
// YYYY-MM-DD
//
// We create a local date so timezone conversion does not move
// the event to the previous/next date.
//
// ============================================================

function parseEventDate(
  dateString
) {

  if (!dateString) {

    return null;

  }


  const parts =
    dateString
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


// ============================================================
// EVENT TYPE LABEL
// ============================================================

function getEventTypeLabel(
  type
) {

  switch (type) {

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

    case "user-reminder":

      return "Custom Reminder";


    default:

      return "Financial Event";

  }

}


// ============================================================
// EVENT ICON
// ============================================================

function EventIcon({
  type,
}) {


  // GOAL

  if (
    type === "goal" ||
    type === "goal-deadline"
  ) {

    return <FiTarget />;

  }


  // INVESTMENT

  if (
    type === "investment" ||
    type === "investment-maturity"
  ) {

    return <FiTrendingUp />;

  }


  // INSURANCE

  if (
    type === "insurance" ||
    type === "insurance-maturity"
  ) {

    return <FiShield />;

  }


  // LIABILITY

  if (
    type === "liability" ||
    type === "liability-end"
  ) {

    return <FiCreditCard />;

  }


  if (type === "user-reminder") {
    return <FiBell />;
  }

  return <FiCalendar />;

}


// ============================================================
// UPCOMING FINANCIAL ACTIVITY
// ============================================================

function UpcomingFinancialActivity({

  savingGoals = [],

  investments = [],

  insurancePolicies = [],

  liabilities = [],

  userReminders = [],

}) {


  // ==========================================================
  // GENERATE ALL CALENDAR EVENTS
  // ==========================================================
  //
  // We still generate ALL events because Financial Calendar
  // needs the complete financial schedule.
  //
  // Filtering is performed only for this Dashboard component.
  //
  // ==========================================================

  const allEvents =
    useMemo(
      () =>

        generateFinancialCalendarEvents({

          savingGoals:
            Array.isArray(
              savingGoals
            )
              ? savingGoals
              : [],


          investments:
            Array.isArray(
              investments
            )
              ? investments
              : [],


          insurancePolicies:
            Array.isArray(
              insurancePolicies
            )
              ? insurancePolicies
              : [],


          liabilities:
            Array.isArray(
              liabilities
            )
              ? liabilities
              : [],

          userReminders:
            Array.isArray(userReminders)
              ? userReminders
              : [],

        }),

      [
        savingGoals,
        investments,
        insurancePolicies,
        liabilities,
        userReminders,
      ]
    );


  // ==========================================================
  // FILTER NEXT 30 DAYS
  // ==========================================================
  //
  // Range:
  //
  // Today
  //   ↓
  // Today + 30 days
  //
  // Past events are removed.
  //
  // Events beyond 30 days are removed from Dashboard only.
  //
  // ==========================================================

  const upcomingEvents =
    useMemo(
      () => {


        // ------------------------------------------------------
        // TODAY
        // ------------------------------------------------------

        const today =
          new Date();


        today.setHours(
          0,
          0,
          0,
          0
        );


        // ------------------------------------------------------
        // END DATE
        // ------------------------------------------------------

        const endDate =
          new Date(
            today
          );


        endDate.setDate(
          endDate.getDate() +
          UPCOMING_DAYS
        );


        endDate.setHours(
          23,
          59,
          59,
          999
        );


        // ------------------------------------------------------
        // FILTER
        // ------------------------------------------------------

        return allEvents

          .filter(
            (event) => {


              const eventDate =
                parseEventDate(
                  event.date
                );


              if (!eventDate) {

                return false;

              }


              eventDate.setHours(
                0,
                0,
                0,
                0
              );


              return (
                eventDate >= today &&
                eventDate <= endDate
              );

            }
          )


          // ----------------------------------------------------
          // SORT NEAREST FIRST
          // ----------------------------------------------------

          .sort(
            (
              firstEvent,
              secondEvent
            ) => {


              const firstDate =
                parseEventDate(
                  firstEvent.date
                );


              const secondDate =
                parseEventDate(
                  secondEvent.date
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

      },

      [
        allEvents,
      ]
    );


  // ==========================================================
  // UI
  // ==========================================================

  return (

    <section className="mt-6 rounded-2xl border border-[#e2e8dc] bg-white p-5">


      {/* ======================================================
          HEADER
         ====================================================== */}

      <div className="flex items-start justify-between gap-4">


        <div>


          <div className="flex items-center gap-2">


            <FiClock className="text-[#315c46]" />


            <h2 className="text-base font-semibold text-[#18392c]">

              Upcoming Financial Activity

            </h2>


          </div>


          <p className="mt-1 text-xs leading-5 text-slate-400">

            Payments, contributions, deadlines and
            maturity events scheduled within the next
            30 days.

          </p>


        </div>


        {/* ====================================================
            COUNT
           ==================================================== */}

        {upcomingEvents.length >
          0 && (

          <div className="shrink-0 rounded-full bg-[#edf6e8] px-3 py-1">


            <span className="text-[10px] font-semibold text-[#315c46]">

              {
                upcomingEvents.length
              }{" "}
              Upcoming

            </span>


          </div>

        )}


      </div>


      {/* ======================================================
          EMPTY STATE
         ====================================================== */}

      {upcomingEvents.length ===
        0 && (

        <div className="mt-5 rounded-xl border border-dashed border-[#dce5d7] bg-[#fafcf8] px-6 py-8 text-center">


          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#edf6e8] text-[#315c46]">


            <FiCalendar />


          </div>


          <p className="mt-3 text-sm font-semibold text-[#18392c]">

            No activity in the next 30 days

          </p>


          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-slate-400">

            You currently have no payments,
            contributions, deadlines or maturity
            events scheduled during the next 30 days.

            Future events are still available in your
            Financial Calendar.

          </p>


        </div>

      )}


      {/* ======================================================
          UPCOMING EVENTS
         ====================================================== */}

      {upcomingEvents.length >
        0 && (

        <div className="mt-5 divide-y divide-[#edf0e9]">


          {upcomingEvents.map(
            (
              event
            ) => (

              <div
                key={
                  event.id
                }

                className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
              >


                {/* =============================================
                    ICON
                   ============================================= */}

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf6e8] text-[#315c46]">


                  <EventIcon
                    type={
                      event.type
                    }
                  />


                </div>


                {/* =============================================
                    EVENT INFORMATION
                   ============================================= */}

                <div className="min-w-0 flex-1">


                  {/* TITLE */}

                  <div className="flex flex-wrap items-center gap-2">


                    <h3 className="truncate text-sm font-semibold text-[#18392c]">

                      {
                        event.title
                      }

                    </h3>


                    {/* REMINDER */}

                    {event.reminder
                      ?.enabled && (

                      <span className="rounded-full bg-[#edf6e8] px-2 py-0.5 text-[9px] font-semibold text-[#315c46]">

                        Reminder On

                      </span>

                    )}


                  </div>


                  {/* TYPE + DATE */}

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">


                    <span className="text-[10px] text-slate-400">

                      {
                        getEventTypeLabel(
                          event.type
                        )
                      }

                    </span>


                    <span className="text-[10px] font-medium text-[#5f7568]">

                      {
                        formatDate(
                          event.date
                        )
                      }

                    </span>


                  </div>


                </div>


                {/* =============================================
                    AMOUNT
                   ============================================= */}

                <div className="shrink-0 text-right">


                  {Number(
                    event.amount || 0
                  ) > 0 ? (

                    <p className="text-sm font-bold text-[#18392c]">

                      ₹
                      {
                        formatMoney(
                          event.amount
                        )
                      }

                    </p>

                  ) : (

                    <p className="text-xs font-medium text-[#5f7568]">

                      Date Event

                    </p>

                  )}


                  {/* STATUS */}

                  {event.status && (

                    <p className="mt-1 text-[9px] text-slate-400">

                      {
                        event.status
                      }

                    </p>

                  )}


                </div>


              </div>

            )
          )}


        </div>

      )}


      {/* ======================================================
          CALENDAR NOTE
         ====================================================== */}

      {upcomingEvents.length >
        0 && (

        <div className="mt-4 border-t border-[#edf0e9] pt-4">


          <div className="flex items-center gap-2">


            <FiCalendar className="shrink-0 text-xs text-[#6c8b72]" />


            <p className="text-[10px] text-slate-400">

              Showing activity for the next 30 days.
              View Financial Calendar for the complete
              schedule.

            </p>


          </div>


        </div>

      )}


    </section>

  );

}


// ============================================================
// EXPORT
// ============================================================

export default UpcomingFinancialActivity;