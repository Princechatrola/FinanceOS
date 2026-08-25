// ============================================================
// FINANCEOS - FINANCIAL CALENDAR
// ============================================================
//
// Displays financial events generated from:
//
// - Saving Goals
// - Investments
// - Insurance
// - Liabilities
//
// FinanceProvider
//      ↓
// financialCalendar.js
//      ↓
// FinancialCalendar.jsx
//
// ============================================================


// ============================================================
// IMPORT REACT
// ============================================================

import {
  useMemo,
  useState,
} from "react";


// ============================================================
// IMPORT ICONS
// ============================================================

import {
  FiChevronLeft,
  FiChevronRight,
  FiCalendar,
  FiTarget,
  FiTrendingUp,
  FiShield,
  FiCreditCard,
  FiPlus,
  FiX,
  FiBell,
} from "react-icons/fi";


// ============================================================
// IMPORT LAYOUT
// ============================================================

import Sidebar
  from "../components/layout/Sidebar.jsx";

import Topbar
  from "../components/layout/Topbar.jsx";


// ============================================================
// IMPORT FINANCE DATA
// ============================================================

import useFinance
  from "../context/useFinance.js";


// ============================================================
// IMPORT CALENDAR UTILITIES
// ============================================================

import {
  generateFinancialCalendarEvents,
  getEventsForMonth,
  getEventsForDate,
} from "../utils/financialCalendar.js";


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
// FORMAT DATE KEY
// ============================================================
//
// Example:
//
// year  = 2026
// month = 6
// day   = 26
//
// Result:
// 2026-07-26
//
// ============================================================

function formatDateKey(
  year,
  month,
  day
) {
  const formattedMonth =
    String(
      month + 1
    ).padStart(
      2,
      "0"
    );

  const formattedDay =
    String(
      day
    ).padStart(
      2,
      "0"
    );

  return `${year}-${formattedMonth}-${formattedDay}`;
}


// ============================================================
// FORMAT DISPLAY DATE
// ============================================================

function formatDisplayDate(
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
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}


// ============================================================
// EVENT LABEL
// ============================================================

function getEventLabel(type) {
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
      return "Insurance Maturity / Expiry";

    case "liability":
      return "EMI / Payment";

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
  if (
    type === "goal" ||
    type === "goal-deadline"
  ) {
    return <FiTarget />;
  }

  if (
    type === "investment" ||
    type === "investment-maturity"
  ) {
    return <FiTrendingUp />;
  }

  if (
    type === "insurance" ||
    type === "insurance-maturity"
  ) {
    return <FiShield />;
  }

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
// FINANCIAL CALENDAR
// ============================================================

function FinancialCalendar() {


  // ==========================================================
  // GET FINANCE DATA
  // ==========================================================

  const {
    savingGoals,
    investments,
    insurancePolicies,
    liabilities,
    userReminders,
    loadUserReminders,
  } = useFinance();

  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderForm, setReminderForm] = useState({ title: "", date: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReminderSubmit = async (e) => {
    e.preventDefault();
    if (!reminderForm.title || !reminderForm.date) return;
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("financeos_token") || sessionStorage.getItem("financeos_token");
      const res = await fetch("http://localhost:5000/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(reminderForm),
      });
      if (res.ok) {
        await loadUserReminders();
        setIsReminderModalOpen(false);
        setReminderForm({ title: "", date: "", description: "" });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };


  // ==========================================================
  // SAFE ARRAYS
  // ==========================================================
  //
  // IMPORTANT:
  //
  // These arrays are memoized.
  //
  // Previously:
  //
  // const goals = Array.isArray(savingGoals)
  //   ? savingGoals
  //   : [];
  //
  // could create a new [] reference on every render.
  //
  // Because these values are dependencies of another useMemo,
  // ESLint reported dependency warnings.
  //
  // ==========================================================

  const goals =
    useMemo(
      () =>
        Array.isArray(
          savingGoals
        )
          ? savingGoals
          : [],
      [
        savingGoals,
      ]
    );


  const investmentRecords =
    useMemo(
      () =>
        Array.isArray(
          investments
        )
          ? investments
          : [],
      [
        investments,
      ]
    );


  const insuranceRecords =
    useMemo(
      () =>
        Array.isArray(
          insurancePolicies
        )
          ? insurancePolicies
          : [],
      [
        insurancePolicies,
      ]
    );


  const liabilityRecords =
    useMemo(
      () =>
        Array.isArray(
          liabilities
        )
          ? liabilities
          : [],
      [
        liabilities,
      ]
    );


  // ==========================================================
  // TODAY
  // ==========================================================

  const today =
    new Date();


  const todayKey =
    formatDateKey(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );


  // ==========================================================
  // DISPLAYED MONTH
  // ==========================================================

  const [
    currentDate,
    setCurrentDate,
  ] = useState(
    () =>
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
  );


  // ==========================================================
  // SELECTED DATE
  // ==========================================================

  const [
    selectedDate,
    setSelectedDate,
  ] = useState(
    todayKey
  );


  // ==========================================================
  // CURRENT YEAR AND MONTH
  // ==========================================================

  const year =
    currentDate.getFullYear();


  const month =
    currentDate.getMonth();


  // ==========================================================
  // GENERATE ALL EVENTS
  // ==========================================================

  const allEvents =
    useMemo(
      () =>
        generateFinancialCalendarEvents({
          savingGoals:
            goals,

          investments:
            investmentRecords,

          insurancePolicies:
            insuranceRecords,

          liabilities:
            liabilityRecords,

          userReminders:
            userReminders || [],
        }),

      [
        goals,
        investmentRecords,
        insuranceRecords,
        liabilityRecords,
        userReminders,
      ]
    );


  // ==========================================================
  // CURRENT MONTH EVENTS
  // ==========================================================

  const monthEvents =
    useMemo(
      () =>
        getEventsForMonth(
          allEvents,
          year,
          month
        ),

      [
        allEvents,
        year,
        month,
      ]
    );


  // ==========================================================
  // SELECTED DATE EVENTS
  // ==========================================================

  const selectedDateEvents =
    useMemo(
      () =>
        getEventsForDate(
          allEvents,
          selectedDate
        ),

      [
        allEvents,
        selectedDate,
      ]
    );


  // ==========================================================
  // CALENDAR INFORMATION
  // ==========================================================

  const firstDay =
    new Date(
      year,
      month,
      1
    ).getDay();


  const daysInMonth =
    new Date(
      year,
      month + 1,
      0
    ).getDate();


  const monthName =
    currentDate.toLocaleDateString(
      "en-US",
      {
        month: "long",
        year: "numeric",
      }
    );


  // ==========================================================
  // PREVIOUS MONTH
  // ==========================================================

  function goPreviousMonth() {
    const previousMonth =
      new Date(
        year,
        month - 1,
        1
      );


    setCurrentDate(
      previousMonth
    );


    setSelectedDate(
      formatDateKey(
        previousMonth.getFullYear(),
        previousMonth.getMonth(),
        1
      )
    );
  }


  // ==========================================================
  // NEXT MONTH
  // ==========================================================

  function goNextMonth() {
    const nextMonth =
      new Date(
        year,
        month + 1,
        1
      );


    setCurrentDate(
      nextMonth
    );


    setSelectedDate(
      formatDateKey(
        nextMonth.getFullYear(),
        nextMonth.getMonth(),
        1
      )
    );
  }


  // ==========================================================
  // GO TO TODAY
  // ==========================================================

  function goToday() {
    const now =
      new Date();


    setCurrentDate(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      )
    );


    setSelectedDate(
      formatDateKey(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      )
    );
  }


  // ==========================================================
  // BUILD CALENDAR CELLS
  // ==========================================================

  const calendarCells =
    [];


  // ==========================================================
  // EMPTY CELLS BEFORE FIRST DAY
  // ==========================================================

  for (
    let index = 0;
    index < firstDay;
    index += 1
  ) {
    calendarCells.push(
      <div
        key={`empty-${index}`}
        className="min-h-[110px] border-b border-r border-[#edf0e9]/50 bg-white/40"
      />
    );
  }


  // ==========================================================
  // DAYS
  // ==========================================================

  for (
    let day = 1;
    day <= daysInMonth;
    day += 1
  ) {
    const dateKey =
      formatDateKey(
        year,
        month,
        day
      );


    const dayEvents =
      monthEvents.filter(
        (event) =>
          event.date ===
          dateKey
      );


    const isToday =
      dateKey ===
      todayKey;


    const isSelected =
      dateKey ===
      selectedDate;


    calendarCells.push(
      <button
        key={
          dateKey
        }

        type="button"

        onClick={() =>
          setSelectedDate(
            dateKey
          )
        }

        className={`min-h-[110px] border-b border-r border-[#edf0e9]/50 p-2 text-left transition-all duration-300 ${
          isSelected
            ? "bg-gradient-to-br from-[#f2f8ed] to-[#e6f4cf]/30 shadow-inner"
            : "bg-transparent hover:bg-white/80 hover:shadow-sm"
        }`}
      >

        {/* ===============================================
            DAY HEADER
           =============================================== */}

        <div className="flex items-center justify-between">

          <span
            className={
              isToday
                ? "flex h-7 w-7 items-center justify-center rounded-full bg-[#315c46] text-xs font-bold text-white"
                : "flex h-7 w-7 items-center justify-center text-xs font-semibold text-[#52665b]"
            }
          >
            {
              day
            }
          </span>


          {/* EVENT COUNT */}

          {dayEvents.length >
            0 && (

            <span className="rounded-full bg-[#e9f4e2] px-1.5 py-0.5 text-[9px] font-semibold text-[#315c46]">
              {
                dayEvents.length
              }
            </span>

          )}

        </div>


        {/* ===============================================
            EVENTS
           =============================================== */}

        <div className="mt-2 space-y-1">

          {dayEvents
            .slice(
              0,
              2
            )
            .map(
              (event) => (

                <div
                  key={
                    event.id
                  }

                  title={
                    event.title
                  }

                  className="truncate rounded-md bg-[#e9f4e2] px-2 py-1 text-[9px] font-medium text-[#315c46]"
                >
                  {
                    event.title
                  }
                </div>

              )
            )}


          {/* MORE EVENTS */}

          {dayEvents.length >
            2 && (

            <p className="px-1 text-[9px] font-medium text-slate-400">
              +
              {
                dayEvents.length -
                2
              }{" "}
              more
            </p>

          )}

        </div>

      </button>
    );
  }


  // ==========================================================
  // COMPLETE FINAL WEEK
  // ==========================================================

  const remainder =
    calendarCells.length %
    7;


  if (
    remainder !== 0
  ) {
    const emptyCells =
      7 -
      remainder;


    for (
      let index = 0;
      index < emptyCells;
      index += 1
    ) {
      calendarCells.push(
        <div
          key={`ending-${index}`}
          className="min-h-[110px] border-b border-r border-[#edf0e9]/50 bg-white/40"
        />
      );
    }
  }


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="min-h-screen bg-[#f6f8f4]">


      {/* ======================================================
          SIDEBAR
         ====================================================== */}

      <Sidebar />


      {/* ======================================================
          MAIN
         ====================================================== */}

      <main className="ml-64 min-h-screen">


        {/* TOPBAR */}

        <Topbar />


        {/* ====================================================
            PAGE CONTENT
           ==================================================== */}

        <div className="px-8 py-6">


          {/* ==================================================
              HEADER
             ================================================== */}

          <div className="flex flex-wrap items-end justify-between gap-4">

            <div>

              <p className="text-sm font-medium text-[#5f7568]">
                FinanceOS Schedule
              </p>


              <h1 className="mt-1 text-2xl font-bold text-[#18392c]">
                Financial Calendar
              </h1>


              <p className="mt-1 text-sm text-slate-500">
                View your upcoming payments,
                contributions, deadlines and
                maturity dates.
              </p>

            </div>


            {/* BUTTONS */}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsReminderModalOpen(true)}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#4f8d32] to-[#3a6825] px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-[#4f8d32]/20 transition-all hover:shadow-[#4f8d32]/40 hover:-translate-y-0.5"
              >
                <FiPlus />
                Add Reminder
              </button>

              <button
                type="button"

                onClick={
                  goToday
                }

                className="flex items-center gap-2 rounded-xl border border-[#dfe6da] bg-white/60 backdrop-blur px-4 py-2.5 text-xs font-semibold text-[#315c46] shadow-sm transition hover:bg-white"
              >
                <FiCalendar />

                Today
              </button>
            </div>

          </div>


          {/* ==================================================
              CALENDAR
             ================================================== */}

          <section className="mt-6 overflow-hidden rounded-[24px] border border-[#e2e8dc]/60 bg-white/60 backdrop-blur-xl shadow-xl shadow-slate-200/40">


            {/* =================================================
                MONTH NAVIGATION
               ================================================= */}

            <div className="flex items-center justify-between border-b border-[#e2e8dc] px-5 py-4">


              {/* PREVIOUS */}

              <button
                type="button"

                onClick={
                  goPreviousMonth
                }

                aria-label="Previous month"

                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e2e8dc] text-[#52665b] transition hover:bg-[#f4f7f1]"
              >
                <FiChevronLeft />
              </button>


              {/* CURRENT MONTH */}

              <div className="text-center">

                <h2 className="text-base font-bold text-[#18392c]">
                  {
                    monthName
                  }
                </h2>


                <p className="mt-1 text-[10px] text-slate-400">
                  {
                    monthEvents.length
                  }{" "}
                  {
                    monthEvents.length ===
                    1
                      ? "financial event"
                      : "financial events"
                  }
                </p>

              </div>


              {/* NEXT */}

              <button
                type="button"

                onClick={
                  goNextMonth
                }

                aria-label="Next month"

                className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#e2e8dc] text-[#52665b] transition hover:bg-[#f4f7f1]"
              >
                <FiChevronRight />
              </button>

            </div>


            {/* =================================================
                WEEKDAY HEADER
               ================================================= */}

            <div className="grid grid-cols-7 border-b border-[#edf0e9]/50 bg-white/50 backdrop-blur">

              {[
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
              ].map(
                (weekday) => (

                  <div
                    key={
                      weekday
                    }

                    className="border-r border-[#edf0e9] px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400"
                  >
                    {
                      weekday
                    }
                  </div>

                )
              )}

            </div>


            {/* =================================================
                DAYS
               ================================================= */}

            <div className="grid grid-cols-7">
              {
                calendarCells
              }
            </div>

          </section>


          {/* ==================================================
              SELECTED DATE DETAILS
             ================================================== */}

          <section className="mt-6 rounded-2xl border border-[#e2e8dc] bg-white p-5">


            {/* HEADER */}

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#edf6e8] text-[#315c46]">
                <FiCalendar />
              </div>


              <div>

                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#6c8b72]">
                  Selected Date
                </p>


                <h2 className="mt-1 text-base font-bold text-[#18392c]">
                  {
                    formatDisplayDate(
                      selectedDate
                    )
                  }
                </h2>

              </div>

            </div>


            {/* =================================================
                EMPTY DATE
               ================================================= */}

            {selectedDateEvents.length ===
              0 && (

              <div className="mt-5 rounded-xl border border-dashed border-[#dce5d7] bg-[#fafcf8] px-6 py-8 text-center">

                <FiCalendar className="mx-auto text-xl text-[#6c8b72]" />


                <p className="mt-3 text-sm font-semibold text-[#18392c]">
                  No financial events
                </p>


                <p className="mx-auto mt-1 max-w-lg text-xs leading-5 text-slate-400">
                  There are no scheduled payments,
                  contributions, deadlines or
                  maturity events on this date.
                </p>

              </div>

            )}


            {/* =================================================
                SELECTED DATE EVENTS
               ================================================= */}

            {selectedDateEvents.length >
              0 && (

              <div className="mt-5 grid grid-cols-1 gap-3 lg:grid-cols-2">

                {selectedDateEvents.map(
                  (event) => (

                    <div
                      key={
                        event.id
                      }

                      className="rounded-xl border border-[#e2e8dc] bg-[#fafcf8] p-4"
                    >

                      <div className="flex items-start gap-3">


                        {/* ICON */}

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#edf6e8] text-[#315c46]">

                          <EventIcon
                            type={
                              event.type
                            }
                          />

                        </div>


                        {/* EVENT DETAILS */}

                        <div className="min-w-0 flex-1">


                          {/* EVENT TYPE */}

                          <p className="text-[9px] font-semibold uppercase tracking-wider text-[#6c8b72]">
                            {
                              getEventLabel(
                                event.type
                              )
                            }
                          </p>


                          {/* TITLE */}

                          <h3 className="mt-1 text-sm font-bold text-[#18392c]">
                            {
                              event.title
                            }
                          </h3>


                          {/* DESCRIPTION */}

                          {event.description && (

                            <p className="mt-1 text-xs leading-5 text-slate-500">
                              {
                                event.description
                              }
                            </p>

                          )}


                          {/* AMOUNT */}

                          {Number(
                            event.amount ||
                              0
                          ) > 0 && (

                            <p className="mt-3 text-sm font-bold text-[#315c46]">
                              ₹
                              {
                                formatMoney(
                                  event.amount
                                )
                              }
                            </p>

                          )}


                          {/* STATUS AND REMINDER */}

                          <div className="mt-3 flex flex-wrap gap-2">


                            {/* STATUS */}

                            {event.status && (

                              <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-medium text-[#52665b]">
                                {
                                  event.status
                                }
                              </span>

                            )}


                            {/* REMINDER */}

                            {event.reminder
                              ?.enabled && (

                              <span className="rounded-full bg-[#edf6e8] px-2.5 py-1 text-[9px] font-semibold text-[#315c46]">
                                Reminder On
                              </span>

                            )}

                          </div>

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </section>


          {/* ==================================================
              NO FINANCIAL RECORDS
             ================================================== */}

          {allEvents.length ===
            0 && (

            <section className="mt-6 rounded-2xl border border-dashed border-[#dce5d7] bg-white px-6 py-8 text-center">

              <FiCalendar className="mx-auto text-2xl text-[#6c8b72]" />


              <h2 className="mt-3 text-sm font-semibold text-[#18392c]">
                No financial events yet
              </h2>


              <p className="mx-auto mt-2 max-w-lg text-xs leading-5 text-slate-400">
                Create a saving goal, investment,
                insurance policy or liability with
                schedule information. FinanceOS will
                automatically display its financial
                dates here.
              </p>

            </section>

          )}

        </div>

        {/* ==================================================
            ADD REMINDER MODAL
           ================================================== */}
        {isReminderModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173b2b]/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                <h3 className="text-lg font-bold text-[#18392c]">Add Custom Reminder</h3>
                <button
                  type="button"
                  onClick={() => setIsReminderModalOpen(false)}
                  className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                >
                  <FiX size={18} />
                </button>
              </div>

              <form onSubmit={handleReminderSubmit} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Reminder Title</label>
                    <input
                      type="text"
                      required
                      value={reminderForm.title}
                      onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })}
                      placeholder="e.g. Renew car insurance"
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm focus:border-[#4f8d32] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#4f8d32]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Date</label>
                    <input
                      type="date"
                      required
                      value={reminderForm.date}
                      onChange={(e) => setReminderForm({ ...reminderForm, date: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm focus:border-[#4f8d32] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#4f8d32]/10"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-600">Description (Optional)</label>
                    <textarea
                      value={reminderForm.description}
                      onChange={(e) => setReminderForm({ ...reminderForm, description: e.target.value })}
                      placeholder="Add any notes here..."
                      rows={3}
                      className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm focus:border-[#4f8d32] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#4f8d32]/10"
                    />
                  </div>
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsReminderModalOpen(false)}
                    className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 rounded-xl bg-[#4f8d32] py-3 text-sm font-semibold text-white shadow-lg shadow-[#4f8d32]/20 transition hover:bg-[#437a2a]"
                  >
                    {isSubmitting ? "Saving..." : "Save Reminder"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}


// ============================================================
// DEFAULT EXPORT
// ============================================================

export default FinancialCalendar;